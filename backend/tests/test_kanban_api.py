import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db, init_db
from app.main import app
from app.models import User, Board, BoardColumn, Card

# Base de datos SQLite en memoria para pruebas aisladas
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    init_db(bind_engine=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_init_db_seeds_default_data(db_session):
    users = db_session.query(User).all()
    assert len(users) == 2
    usernames = {u.username for u in users}
    assert "user" in usernames
    assert "usuario" in usernames

    columns = db_session.query(BoardColumn).all()
    assert len(columns) == 10  # 5 columnas por cada uno de los 2 usuarios

    cards = db_session.query(Card).all()
    assert len(cards) == 16  # 8 tarjetas por usuario


def test_get_kanban_board_success(client):
    response = client.get("/api/kanban?username=user")
    assert response.status_code == 200
    data = response.json()

    assert "columns" in data
    assert "cards" in data
    assert len(data["columns"]) == 5
    assert len(data["cards"]) == 8

    # Verificar nombres de columnas
    titles = [c["title"] for c in data["columns"]]
    assert titles == ["Backlog", "Discovery", "In Progress", "Review", "Done"]


def test_get_kanban_board_nonexistent_user(client):
    response = client.get("/api/kanban?username=unknown")
    assert response.status_code == 404


def test_create_card(client):
    col_id = "col-backlog-user"
    response = client.post(
        "/api/kanban/cards",
        json={
            "column_id": col_id,
            "title": "Nueva tarjeta de prueba",
            "details": "Detalles de prueba",
        },
    )
    assert response.status_code == 201
    created = response.json()
    assert created["title"] == "Nueva tarjeta de prueba"
    assert created["details"] == "Detalles de prueba"
    assert created["id"].startswith("card-")

    # Verificar que aparece en el tablero
    board_resp = client.get("/api/kanban?username=user")
    board_data = board_resp.json()
    assert created["id"] in board_data["cards"]
    backlog_col = next(c for c in board_data["columns"] if c["id"] == col_id)
    assert created["id"] in backlog_col["cardIds"]


def test_update_card(client):
    card_id = "card-1-user"
    response = client.put(
        f"/api/kanban/cards/{card_id}",
        json={
            "title": "Titulo modificado",
            "details": "Detalles modificados",
        },
    )
    assert response.status_code == 200
    updated = response.json()
    assert updated["title"] == "Titulo modificado"
    assert updated["details"] == "Detalles modificados"


def test_delete_card(client):
    card_id = "card-1-user"
    response = client.delete(f"/api/kanban/cards/{card_id}")
    assert response.status_code == 200
    assert response.json() == {"status": "deleted", "card_id": card_id}

    board_resp = client.get("/api/kanban?username=user")
    board_data = board_resp.json()
    assert card_id not in board_data["cards"]


def test_rename_column(client):
    col_id = "col-backlog-user"
    response = client.put(
        f"/api/kanban/columns/{col_id}",
        json={"title": "Ideas Nuevas"},
    )
    assert response.status_code == 200
    assert response.json()["title"] == "Ideas Nuevas"

    board_resp = client.get("/api/kanban?username=user")
    board_data = board_resp.json()
    backlog_col = next(c for c in board_data["columns"] if c["id"] == col_id)
    assert backlog_col["title"] == "Ideas Nuevas"


def test_move_card_between_columns(client):
    active_id = "card-1-user"  # En col-backlog
    target_col = "col-done-user"

    response = client.put(
        "/api/kanban/move-card?username=user",
        json={
            "active_id": active_id,
            "over_id": target_col,
        },
    )
    assert response.status_code == 200
    board_data = response.json()

    backlog = next(c for c in board_data["columns"] if c["id"] == "col-backlog-user")
    done = next(c for c in board_data["columns"] if c["id"] == target_col)

    assert active_id not in backlog["cardIds"]
    assert active_id in done["cardIds"]
