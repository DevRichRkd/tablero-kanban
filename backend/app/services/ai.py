import asyncio
import json
import os
from pathlib import Path
import re
from typing import Any, Dict, List, Optional
import httpx

DEFAULT_MODEL = "gemini-3.1-flash-lite"
GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"


def clean_and_parse_json(raw_text: str) -> Dict[str, Any]:
    """
    Limpia bloques de codigo markdown y extrae un diccionario JSON valido.
    """
    text = raw_text.strip()
    # Eliminar bloques markdown ```json ... ``` si existen
    if text.startswith("```"):
        text = re.sub(r"^```[a-zA-Z]*\s*", "", text)
        text = re.sub(r"\s*```$", "", text)
        text = text.strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError:
        # Buscar el primer bloque delimitado por llaves { ... }
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if match:
            return json.loads(match.group(0))
        raise


def get_config_var(key: str, default: str = "") -> str:
    """Obtiene una variable de entorno desde os.environ o fallback a archivo .env."""
    val = os.getenv(key)
    if val:
        return val

    # Busqueda jerarquica de archivo .env
    candidates = [
        Path(".env"),
        Path("../.env"),
        Path(__file__).resolve().parents[2] / ".env",
        Path(__file__).resolve().parents[3] / ".env",
    ]
    for candidate in candidates:
        if candidate.exists():
            try:
                for line in candidate.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        if k.strip() == key:
                            return v.strip().strip("'\"")
            except Exception:
                pass
    return default


def get_gemini_api_key() -> str:
    return get_config_var("GEMINI_API_KEY", "")


def get_gemini_model() -> str:
    return get_config_var("GEMINI_MODEL", DEFAULT_MODEL) or DEFAULT_MODEL


async def generate_content(
    prompt: str,
    model: Optional[str] = None,
    system_instruction: Optional[str] = None,
    temperature: float = 0.7,
    timeout_seconds: float = 30.0,
    response_mime_type: Optional[str] = None,
    contents: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    """
    Realiza una peticion asincrona a la API de Google Gemini para generar texto.
    Retorna un diccionario estandarizado con el resultado o la descripcion del error.
    """
    api_key = get_gemini_api_key()
    target_model = model or get_gemini_model()

    if not api_key:
        return {
            "success": False,
            "error": "GEMINI_API_KEY no esta configurada en el archivo .env",
            "provider": "gemini",
            "model": target_model,
            "configured": False,
        }

    url = f"{GEMINI_API_BASE}/{target_model}:generateContent?key={api_key}"

    generation_config: Dict[str, Any] = {
        "temperature": temperature,
    }
    if response_mime_type:
        generation_config["responseMimeType"] = response_mime_type

    # Formatear el contenido de la peticion
    request_contents = contents if contents is not None else [
        {
            "role": "user",
            "parts": [{"text": prompt}],
        }
    ]

    payload: Dict[str, Any] = {
        "contents": request_contents,
        "generationConfig": generation_config,
    }

    if system_instruction:
        payload["systemInstruction"] = {
            "parts": [{"text": system_instruction}],
        }

    try:
        async with httpx.AsyncClient(timeout=timeout_seconds) as client:
            response = await client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"},
            )

            # Reintento unico automatico ante picos temporales de demanda (429/503)
            if response.status_code in [429, 503]:
                await asyncio.sleep(2.0)
                response = await client.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"},
                )

        if response.status_code != 200:
            error_data = {}
            try:
                error_data = response.json().get("error", {})
            except Exception:
                pass
            message = error_data.get("message") or f"Error HTTP {response.status_code}: {response.text}"
            return {
                "success": False,
                "error": f"Error de API Gemini: {message}",
                "provider": "gemini",
                "model": target_model,
                "configured": True,
            }

        data = response.json()
        candidates = data.get("candidates", [])
        if not candidates:
            return {
                "success": False,
                "error": "La API de Gemini no retorno ningun candidato de respuesta.",
                "provider": "gemini",
                "model": target_model,
                "configured": True,
            }

        first_candidate = candidates[0]
        content = first_candidate.get("content", {})
        parts = content.get("parts", [])
        reply_text = "".join([part.get("text", "") for part in parts]).strip()

        return {
            "success": True,
            "reply": reply_text,
            "provider": "gemini",
            "model": target_model,
            "configured": True,
        }

    except httpx.TimeoutException:
        return {
            "success": False,
            "error": "Tiempo de espera agotado al conectar con la API de Google Gemini.",
            "provider": "gemini",
            "model": target_model,
            "configured": True,
        }
    except httpx.RequestError as exc:
        return {
            "success": False,
            "error": f"Fallo de conexion de red con Google Gemini: {str(exc)}",
            "provider": "gemini",
            "model": target_model,
            "configured": True,
        }
    except Exception as exc:
        return {
            "success": False,
            "error": f"Error inesperado al invocar Google Gemini: {str(exc)}",
            "provider": "gemini",
            "model": target_model,
            "configured": True,
        }
