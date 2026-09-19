import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import (
    Board,
    BoardColumn,
    Card,
    User,
    BoardDataResponse,
    CardResponse,
    ColumnResponse,
    CreateCardRequest,
    UpdateCardRequest,
    RenameColumnRequest,
    MoveCardRequest,
)

router = APIRouter(prefix="/api/kanban", tags=["Kanban"])

def _get_user_board(db: Session, username: str) -> Board:
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail=f"Usuario '{username}' no encontrado")
    board = db.query(Board).filter(Board.user_id == user.id).first()
    if not board:
        raise HTTPException(status_code=404, detail=f"Tablero para el usuario '{username}' no encontrado")
    return board

def _build_board_response(board: Board) -> BoardDataResponse:
    columns_resp = []
    cards_resp = {}

    for col in sorted(board.columns, key=lambda c: c.position):
        sorted_cards = sorted(col.cards, key=lambda c: c.position)
        card_ids = [c.id for c in sorted_cards]
        columns_resp.append(ColumnResponse(id=col.id, title=col.title, cardIds=card_ids))

        for c in sorted_cards:
            cards_resp[c.id] = CardResponse(id=c.id, title=c.title, details=c.details)

    return BoardDataResponse(columns=columns_resp, cards=cards_resp)

@router.get("", response_model=BoardDataResponse)
def get_kanban_board(
    username: str = Query(default="user", description="Nombre de usuario"),
    db: Session = Depends(get_db),
):
    board = _get_user_board(db, username)
    return _build_board_response(board)

@router.post("/cards", response_model=CardResponse, status_code=201)
def create_card(
    request: CreateCardRequest,
    db: Session = Depends(get_db),
):
    column = db.query(BoardColumn).filter(BoardColumn.id == request.column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Columna no encontrada")

    # Posicion al final de la columna
    current_count = db.query(Card).filter(Card.column_id == request.column_id).count()
    new_id = f"card-{uuid.uuid4().hex[:8]}"

    card = Card(
        id=new_id,
        column_id=request.column_id,
        title=request.title,
        details=request.details or "No details yet.",
        position=current_count,
    )
    db.add(card)
    db.commit()
    db.refresh(card)

    return CardResponse(id=card.id, title=card.title, details=card.details)

@router.put("/cards/{card_id}", response_model=CardResponse)
def update_card(
    card_id: str,
    request: UpdateCardRequest,
    db: Session = Depends(get_db),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")

    if request.title is not None:
        card.title = request.title
    if request.details is not None:
        card.details = request.details

    db.commit()
    db.refresh(card)
    return CardResponse(id=card.id, title=card.title, details=card.details)

@router.delete("/cards/{card_id}", status_code=200)
def delete_card(
    card_id: str,
    db: Session = Depends(get_db),
):
    card = db.query(Card).filter(Card.id == card_id).first()
    if not card:
        raise HTTPException(status_code=404, detail="Tarjeta no encontrada")

    col_id = card.column_id
    old_pos = card.position

    db.delete(card)
    db.flush()

    # Reordenar las tarjetas restantes en la columna
    remaining = db.query(Card).filter(Card.column_id == col_id, Card.position > old_pos).all()
    for c in remaining:
        c.position -= 1

    db.commit()
    return {"status": "deleted", "card_id": card_id}

@router.put("/columns/{column_id}")
def rename_column(
    column_id: str,
    request: RenameColumnRequest,
    db: Session = Depends(get_db),
):
    column = db.query(BoardColumn).filter(BoardColumn.id == column_id).first()
    if not column:
        raise HTTPException(status_code=404, detail="Columna no encontrada")

    column.title = request.title.strip()
    db.commit()
    return {"id": column.id, "title": column.title}

@router.put("/move-card", response_model=BoardDataResponse)
def move_card(
    request: MoveCardRequest,
    username: str = Query(default="user"),
    db: Session = Depends(get_db),
):
    active_card = db.query(Card).filter(Card.id == request.active_id).first()
    if not active_card:
        raise HTTPException(status_code=404, detail="Tarjeta activa no encontrada")

    source_col_id = active_card.column_id
    target_col = db.query(BoardColumn).filter(BoardColumn.id == request.over_id).first()

    if target_col:
        # Arrastrado directamente sobre el contenedor de la columna
        target_col_id = target_col.id
        insert_index = db.query(Card).filter(Card.column_id == target_col_id, Card.id != active_card.id).count()
    else:
        # Arrastrado sobre otra tarjeta
        over_card = db.query(Card).filter(Card.id == request.over_id).first()
        if not over_card:
            raise HTTPException(status_code=404, detail="Elemento destino no encontrado")
        target_col_id = over_card.column_id
        insert_index = over_card.position

    if source_col_id == target_col_id:
        # Movimiento dentro de la misma columna
        cards = db.query(Card).filter(Card.column_id == source_col_id).order_by(Card.position).all()
        cards = [c for c in cards if c.id != active_card.id]
        cards.insert(min(insert_index, len(cards)), active_card)

        for idx, c in enumerate(cards):
            c.position = idx
    else:
        # Movimiento entre columnas distintas
        source_cards = db.query(Card).filter(Card.column_id == source_col_id, Card.id != active_card.id).order_by(Card.position).all()
        for idx, c in enumerate(source_cards):
            c.position = idx

        target_cards = db.query(Card).filter(Card.column_id == target_col_id).order_by(Card.position).all()
        target_cards.insert(min(insert_index, len(target_cards)), active_card)
        active_card.column_id = target_col_id

        for idx, c in enumerate(target_cards):
            c.position = idx

    db.commit()

    board = _get_user_board(db, username)
    return _build_board_response(board)
