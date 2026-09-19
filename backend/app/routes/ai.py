import json
from typing import Any, Dict, List, Optional, Tuple
import uuid
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import (
    Board,
    BoardColumn,
    Card,
    BoardDataResponse,
)
from app.routes.kanban import _get_user_board, _build_board_response
from app.services.ai import (
    generate_content,
    clean_and_parse_json,
    get_gemini_model,
    get_gemini_api_key,
)

router = APIRouter(prefix="/api/ai", tags=["AI"])


class AiTestRequest(BaseModel):
    prompt: str = Field(default="¿Cuánto es 2+2?", description="Mensaje de prueba para enviar a Gemini")
    model: Optional[str] = Field(default=None, description="Modelo de Gemini a utilizar (opcional)")


class AiTestResponse(BaseModel):
    status: str
    provider: str
    model: str
    reply: Optional[str] = None
    error: Optional[str] = None
    configured: bool


class ChatMessage(BaseModel):
    role: str = Field(description="Rol del emisor: 'user' o 'assistant' / 'model'")
    content: str = Field(description="Contenido del mensaje")


class AiChatRequest(BaseModel):
    message: str = Field(description="Mensaje del usuario")
    username: str = Field(default="user", description="Nombre del usuario actual")
    history: Optional[List[ChatMessage]] = Field(default_factory=list, description="Historial de mensajes recientes")


class AiChatResponse(BaseModel):
    status: str = Field(default="ok", description="'ok' o 'error'")
    reply: str = Field(description="Respuesta explicativa para el usuario")
    action: str = Field(default="none", description="Accion ejecutada: none | create_card | update_card | move_card | delete_card")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Parametros de la accion")
    board: BoardDataResponse = Field(description="Estado fresco del tablero tras la accion")
    error: Optional[str] = Field(default=None, description="Detalle del error si ocurrio alguno")


def _serialize_board_for_ai(board: Board) -> str:
    """Serializa el tablero a una estructura JSON concisa para el contexto del LLM."""
    summary = []
    for col in sorted(board.columns, key=lambda c: c.position):
        cards = []
        for card in sorted(col.cards, key=lambda c: c.position):
            cards.append({
                "id": card.id,
                "title": card.title,
                "details": card.details,
            })
        summary.append({
            "id": col.id,
            "title": col.title,
            "cards": cards,
        })
    return json.dumps(summary, ensure_ascii=False, indent=2)


def _build_system_instruction(board_summary_json: str) -> str:
    """Genera la instruccion de sistema estricta para respuestas estructuradas en JSON."""
    return (
        "Eres un asistente de IA para una aplicacion de Gestion de Proyectos con Tablero Kanban.\n"
        "Tu mision es conversar con el usuario de manera clara, concisa y profesional en espanol, "
        "y cuando el usuario lo solicite, manipular las tarjetas del tablero mediante acciones estructuradas.\n\n"
        f"ESTADO ACTUAL DEL TABLERO:\n{board_summary_json}\n\n"
        "FORMATO DE RESPUESTA OBLIGATORIO:\n"
        "Debes responder UNICAMENTE con un objeto JSON valido con los siguientes campos:\n"
        "{\n"
        '  "reply": "Tu mensaje para el usuario en espanol explicando brevemente lo que hiciste o respondiendo su pregunta.",\n'
        '  "action": "none" | "create_card" | "update_card" | "move_card" | "delete_card",\n'
        '  "payload": {\n'
        '    // Segun la accion elegida:\n'
        '    // Para "create_card": {"column_id": "id_o_nombre_columna", "title": "Titulo", "details": "Detalles"}\n'
        '    // Para "update_card": {"card_id": "id_o_nombre_tarjeta", "title": "Nuevo titulo opcional", "details": "Nuevos detalles opcional"}\n'
        '    // Para "move_card": {"card_id": "id_o_nombre_tarjeta", "target_column_id": "id_o_nombre_columna_destino", "position": 0}\n'
        '    // Para "delete_card": {"card_id": "id_o_nombre_tarjeta"}\n'
        '    // Para "none": {}\n'
        "  }\n"
        "}\n\n"
        "REGLAS ESTRICTAS:\n"
        "1. NUNCA uses emojis en ningun texto, titulo ni descripcion.\n"
        "2. Si el usuario pide crear una tarjeta y no menciona columna, creala en Backlog.\n"
        "3. Si el usuario hace una pregunta o conversacion general sin solicitar cambios, usa action 'none'.\n"
        "4. Devuelve UNICAMENTE el objeto JSON sin etiquetas de bloque de codigo ni texto extra."
    )


def _apply_board_mutation(
    db: Session,
    board: Board,
    action: str,
    payload: Dict[str, Any],
) -> Tuple[str, Dict[str, Any]]:
    """Aplica la mutacion solicitada por el LLM directamente en la base de datos SQLite."""
    action_normalized = (action or "none").lower().strip()
    result_payload = dict(payload)

    if action_normalized == "create_card":
        col_ident = str(
            payload.get("column_id")
            or payload.get("column")
            or payload.get("list")
            or payload.get("columna")
            or ""
        ).strip().lower()
        target_col = None
        for col in board.columns:
            if col.id.lower() == col_ident or col.title.lower() == col_ident:
                target_col = col
                break
        if not target_col:
            sorted_cols = sorted(board.columns, key=lambda c: c.position)
            target_col = sorted_cols[0] if sorted_cols else None

        if target_col:
            title = str(payload.get("title") or payload.get("tarjeta") or "Nueva Tarea").strip()
            details = str(payload.get("details") or payload.get("descripcion") or "").strip()
            new_id = f"card-{uuid.uuid4().hex[:8]}"
            pos = len(target_col.cards)
            new_card = Card(
                id=new_id,
                column_id=target_col.id,
                title=title,
                details=details or "Detalle pendiente.",
                position=pos,
            )
            db.add(new_card)
            db.commit()
            db.refresh(board)
            result_payload["created_card_id"] = new_id
            result_payload["column_id"] = target_col.id

    elif action_normalized == "update_card":
        card_ident = str(
            payload.get("card_id")
            or payload.get("card")
            or payload.get("tarjeta")
            or ""
        ).strip().lower()
        target_card = None
        for col in board.columns:
            for c in col.cards:
                if c.id.lower() == card_ident or c.title.lower() == card_ident:
                    target_card = c
                    break
            if target_card:
                break

        if target_card:
            new_title = payload.get("title") or payload.get("nuevo_titulo")
            new_details = payload.get("details") or payload.get("descripcion")
            if new_title:
                target_card.title = str(new_title).strip()
            if new_details:
                target_card.details = str(new_details).strip()
            db.commit()
            db.refresh(board)
            result_payload["updated_card_id"] = target_card.id

    elif action_normalized == "move_card":
        card_ident = str(
            payload.get("card_id")
            or payload.get("card")
            or payload.get("tarjeta")
            or payload.get("title")
            or ""
        ).strip().lower()
        target_card = None
        current_col = None
        for col in board.columns:
            for c in col.cards:
                if c.id.lower() == card_ident or c.title.lower() == card_ident:
                    target_card = c
                    current_col = col
                    break
            if target_card:
                break

        dest_ident = str(
            payload.get("target_column_id")
            or payload.get("column_id")
            or payload.get("to_column")
            or payload.get("list")
            or payload.get("target_list")
            or payload.get("columna")
            or ""
        ).strip().lower()
        target_col = None
        for col in board.columns:
            if col.id.lower() == dest_ident or col.title.lower() == dest_ident:
                target_col = col
                break

        if target_card and target_col and current_col:
            if current_col.id != target_col.id:
                old_pos = target_card.position
                for c in current_col.cards:
                    if c.position > old_pos:
                        c.position -= 1

                target_card.column_id = target_col.id
                target_card.position = len(target_col.cards)
            db.commit()
            db.refresh(board)
            result_payload["moved_card_id"] = target_card.id
            result_payload["target_column_id"] = target_col.id

    elif action_normalized == "delete_card":
        card_ident = str(payload.get("card_id") or payload.get("card") or "").strip().lower()
        target_card = None
        current_col = None
        for col in board.columns:
            for c in col.cards:
                if c.id.lower() == card_ident or c.title.lower() == card_ident:
                    target_card = c
                    current_col = col
                    break
            if target_card:
                break

        if target_card and current_col:
            old_pos = target_card.position
            db.delete(target_card)
            db.flush()
            for c in current_col.cards:
                if c.position > old_pos:
                    c.position -= 1
            db.commit()
            db.refresh(board)
            result_payload["deleted_card_id"] = target_card.id

    return action_normalized, result_payload


@router.post("/chat", response_model=AiChatResponse)
async def chat_with_board(
    request: AiChatRequest,
    db: Session = Depends(get_db),
):
    """
    Endpoint principal para interactuar con la IA en lenguaje natural.
    El LLM analiza el estado del tablero y devuelve una respuesta estructurada con mutaciones aplicables.
    """
    board = _get_user_board(db, request.username)
    board_json = _serialize_board_for_ai(board)
    system_inst = _build_system_instruction(board_json)

    # Construir historial para Gemini
    gemini_contents = []
    for item in (request.history or []):
        role = "model" if item.role in ["assistant", "model"] else "user"
        gemini_contents.append({
            "role": role,
            "parts": [{"text": item.content}],
        })
    gemini_contents.append({
        "role": "user",
        "parts": [{"text": request.message}],
    })

    # Llamada a Gemini con especificacion de JSON estructurado
    ai_result = await generate_content(
        prompt=request.message,
        system_instruction=system_inst,
        response_mime_type="application/json",
        contents=gemini_contents,
        temperature=0.4,
    )

    if not ai_result.get("success"):
        fresh_board = _build_board_response(board)
        return AiChatResponse(
            status="error",
            reply="Disculpa, ocurrio un problema al conectar con el servicio de IA.",
            action="none",
            payload={},
            board=fresh_board,
            error=ai_result.get("error"),
        )

    raw_reply = ai_result.get("reply", "{}")

    try:
        parsed = clean_and_parse_json(raw_reply)
        reply_text = str(parsed.get("reply") or "Entendido.").strip()
        action = str(parsed.get("action") or "none").strip()
        payload = parsed.get("payload") if isinstance(parsed.get("payload"), dict) else {}

        # Ejecutar mutacion en BD si corresponde
        applied_action, final_payload = _apply_board_mutation(db, board, action, payload)

        fresh_board = _build_board_response(board)
        return AiChatResponse(
            status="ok",
            reply=reply_text,
            action=applied_action,
            payload=final_payload,
            board=fresh_board,
        )

    except Exception as exc:
        fresh_board = _build_board_response(board)
        return AiChatResponse(
            status="ok",
            reply=raw_reply if raw_reply else "Procesado sin acciones adicionales.",
            action="none",
            payload={},
            board=fresh_board,
            error=f"Aviso de interpretacion: {str(exc)}",
        )


@router.post("/test", response_model=AiTestResponse)
async def test_ai_connection(request: Optional[AiTestRequest] = None):
    """
    Endpoint de diagnostico para comprobar la conectividad del backend con Google Gemini.
    """
    prompt = request.prompt if request else "¿Cuánto es 2+2?"
    model = request.model if request else None

    result = await generate_content(prompt=prompt, model=model)

    if result.get("success"):
        return AiTestResponse(
            status="ok",
            provider=result.get("provider", "gemini"),
            model=result.get("model", get_gemini_model()),
            reply=result.get("reply"),
            configured=True,
        )
    else:
        return AiTestResponse(
            status="error",
            provider=result.get("provider", "gemini"),
            model=result.get("model", get_gemini_model()),
            error=result.get("error"),
            configured=result.get("configured", bool(get_gemini_api_key())),
        )


@router.get("/status")
def get_ai_status():
    """
    Verifica el estado de configuracion del servicio de IA sin realizar llamadas externas.
    """
    has_key = bool(get_gemini_api_key())
    return {
        "provider": "gemini",
        "model": get_gemini_model(),
        "configured": has_key,
        "message": "Servicio configurado correctamente" if has_key else "GEMINI_API_KEY no configurada",
    }
