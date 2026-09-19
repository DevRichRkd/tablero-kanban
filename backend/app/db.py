import os
from datetime import datetime
from pathlib import Path
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

DB_PATH = os.getenv("KANBAN_DB_PATH", str(Path(__file__).resolve().parent.parent / "kanban.db"))
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db(bind_engine=None):
    from app.models import User, Board, BoardColumn, Card

    target_engine = bind_engine or engine
    Base.metadata.create_all(bind=target_engine)

    Session = sessionmaker(autocommit=False, autoflush=False, bind=target_engine)
    db = Session()

    try:
        # Verificar o crear usuarios por defecto
        seed_users = [
            {"id": "user-default-1", "username": "user", "password": "password"},
            {"id": "user-default-2", "username": "usuario", "password": "contraseña"},
        ]

        for u in seed_users:
            existing_user = db.query(User).filter(User.username == u["username"]).first()
            if not existing_user:
                new_user = User(
                    id=u["id"],
                    username=u["username"],
                    password_hash=u["password"],
                    created_at=datetime.utcnow().isoformat(),
                )
                db.add(new_user)
                db.flush()

                # Crear tablero inicial para el usuario
                board_id = f"board-{u['username']}"
                board = Board(
                    id=board_id,
                    user_id=new_user.id,
                    title="Tablero Principal",
                    created_at=datetime.utcnow().isoformat(),
                )
                db.add(board)
                db.flush()

                # Crear las 5 columnas
                columns_def = [
                    ("col-backlog", "Backlog", 0),
                    ("col-discovery", "Discovery", 1),
                    ("col-progress", "In Progress", 2),
                    ("col-review", "Review", 3),
                    ("col-done", "Done", 4),
                ]

                for col_id, col_title, pos in columns_def:
                    col = BoardColumn(
                        id=f"{col_id}-{u['username']}",
                        board_id=board.id,
                        title=col_title,
                        position=pos,
                    )
                    db.add(col)
                db.flush()

                # Sembrar tarjetas iniciales
                seed_cards = [
                    ("card-1", f"col-backlog-{u['username']}", "Align roadmap themes", "Draft quarterly themes with impact statements and metrics.", 0),
                    ("card-2", f"col-backlog-{u['username']}", "Gather customer signals", "Review support tags, sales notes, and churn feedback.", 1),
                    ("card-3", f"col-discovery-{u['username']}", "Prototype analytics view", "Sketch initial dashboard layout and key drill-downs.", 0),
                    ("card-4", f"col-progress-{u['username']}", "Refine status language", "Standardize column labels and tone across the board.", 0),
                    ("card-5", f"col-progress-{u['username']}", "Design card layout", "Add hierarchy and spacing for scanning dense lists.", 1),
                    ("card-6", f"col-review-{u['username']}", "QA micro-interactions", "Verify hover, focus, and loading states.", 0),
                    ("card-7", f"col-done-{u['username']}", "Ship marketing page", "Final copy approved and asset pack delivered.", 0),
                    ("card-8", f"col-done-{u['username']}", "Close onboarding sprint", "Document release notes and share internally.", 1),
                ]

                for cid, col_id, title, details, pos in seed_cards:
                    card = Card(
                        id=f"{cid}-{u['username']}",
                        column_id=col_id,
                        title=title,
                        details=details,
                        position=pos,
                        created_at=datetime.utcnow().isoformat(),
                    )
                    db.add(card)

        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
