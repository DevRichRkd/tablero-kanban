from datetime import datetime, timezone
from typing import Optional
from pydantic import BaseModel, Field
from sqlalchemy import Column, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from app.db import Base

# Modelos SQLAlchemy

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, index=True)
    username = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    created_at = Column(String, default=lambda: datetime.now(timezone.utc).isoformat())

    boards = relationship("Board", back_populates="user", cascade="all, delete-orphan")


class Board(Base):
    __tablename__ = "boards"

    id = Column(String, primary_key=True, index=True)
    user_id = Column(String, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, default="Tablero Principal")
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())

    user = relationship("User", back_populates="boards")
    columns = relationship("BoardColumn", back_populates="board", cascade="all, delete-orphan", order_by="BoardColumn.position")


class BoardColumn(Base):
    __tablename__ = "columns"

    id = Column(String, primary_key=True, index=True)
    board_id = Column(String, ForeignKey("boards.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    position = Column(Integer, nullable=False)

    board = relationship("Board", back_populates="columns")
    cards = relationship("Card", back_populates="column", cascade="all, delete-orphan", order_by="Card.position")


class Card(Base):
    __tablename__ = "cards"

    id = Column(String, primary_key=True, index=True)
    column_id = Column(String, ForeignKey("columns.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String, nullable=False)
    details = Column(Text, default="")
    position = Column(Integer, nullable=False)
    created_at = Column(String, default=lambda: datetime.utcnow().isoformat())

    column = relationship("BoardColumn", back_populates="cards")


# Esquemas Pydantic

class CardResponse(BaseModel):
    id: str
    title: str
    details: str

class ColumnResponse(BaseModel):
    id: str
    title: str
    cardIds: list[str]

class BoardDataResponse(BaseModel):
    columns: list[ColumnResponse]
    cards: dict[str, CardResponse]

class CreateCardRequest(BaseModel):
    column_id: str
    title: str
    details: Optional[str] = "No details yet."

class UpdateCardRequest(BaseModel):
    title: Optional[str] = None
    details: Optional[str] = None

class RenameColumnRequest(BaseModel):
    title: str

class MoveCardRequest(BaseModel):
    active_id: str
    over_id: str
