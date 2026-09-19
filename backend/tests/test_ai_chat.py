import json
from unittest.mock import AsyncMock, patch
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.db import Base, get_db, init_db
from app.main import app
from app.models import Card

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
    test_client = TestClient(app)
    yield test_client
    app.dependency_overrides.clear()


def test_ai_chat_conversational_none(client):
    """Valida conversacion general sin mutaciones sobre el tablero."""
    gemini_reply = {
        "reply": "Hola, estoy listo para ayudarte a organizar tus proyectos.",
        "action": "none",
        "payload": {},
    }
    mock_result = {
        "success": True,
        "reply": json.dumps(gemini_reply),
        "provider": "gemini",
        "model": "gemini-3.6-flash",
    }

    with patch("app.routes.ai.generate_content", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_result
        response = client.post(
            "/api/ai/chat",
            json={"message": "Hola asistente", "username": "user"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["action"] == "none"
        assert "Hola, estoy listo" in data["reply"]
        assert len(data["board"]["columns"]) == 5


def test_ai_chat_create_card(client, db_session):
    """Valida creacion de tarjeta solicitada por lenguaje natural y persistida en SQLite."""
    gemini_reply = {
        "reply": "He creado la tarjeta en Backlog.",
        "action": "create_card",
        "payload": {
            "column_id": "Backlog",
            "title": "Auditar seguridad",
            "details": "Revisar politicas y permisos",
        },
    }
    mock_result = {
        "success": True,
        "reply": json.dumps(gemini_reply),
    }

    with patch("app.routes.ai.generate_content", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_result
        response = client.post(
            "/api/ai/chat",
            json={"message": "Crea una tarjeta para auditar seguridad en Backlog", "username": "user"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["action"] == "create_card"
        created_id = data["payload"]["created_card_id"]
        assert created_id in data["board"]["cards"]
        assert data["board"]["cards"][created_id]["title"] == "Auditar seguridad"

        # Verificar persistencia en base de datos
        db_card = db_session.query(Card).filter(Card.id == created_id).first()
        assert db_card is not None
        assert db_card.title == "Auditar seguridad"


def test_ai_chat_update_card(client, db_session):
    """Valida actualizacion de titulo o detalles de una tarjeta."""
    gemini_reply = {
        "reply": "Actualice el titulo de la tarjeta.",
        "action": "update_card",
        "payload": {
            "card_id": "card-1-user",
            "title": "Alinear objetivos estrategicos",
            "details": "Detalles actualizados por IA",
        },
    }
    mock_result = {
        "success": True,
        "reply": json.dumps(gemini_reply),
    }

    with patch("app.routes.ai.generate_content", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_result
        response = client.post(
            "/api/ai/chat",
            json={"message": "Modifica el titulo de card-1-user", "username": "user"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "update_card"
        assert data["board"]["cards"]["card-1-user"]["title"] == "Alinear objetivos estrategicos"


def test_ai_chat_move_card(client, db_session):
    """Valida que la IA mueva una tarjeta de una columna a otra en la base de datos."""
    gemini_reply = {
        "reply": "He movido la tarjeta a la columna Done.",
        "action": "move_card",
        "payload": {
            "card_id": "card-1-user",
            "target_column_id": "Done",
        },
    }
    mock_result = {
        "success": True,
        "reply": json.dumps(gemini_reply),
    }

    with patch("app.routes.ai.generate_content", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_result
        response = client.post(
            "/api/ai/chat",
            json={"message": "Mueve card-1-user a Done", "username": "user"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "move_card"

        # Verificar que card-1-user ahora este en Done
        done_col = next(col for col in data["board"]["columns"] if col["title"] == "Done")
        assert "card-1-user" in done_col["cardIds"]


def test_ai_chat_delete_card(client, db_session):
    """Valida la eliminacion de una tarjeta del tablero."""
    gemini_reply = {
        "reply": "Tarjeta eliminada.",
        "action": "delete_card",
        "payload": {
            "card_id": "card-2-user",
        },
    }
    mock_result = {
        "success": True,
        "reply": json.dumps(gemini_reply),
    }

    with patch("app.routes.ai.generate_content", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_result
        response = client.post(
            "/api/ai/chat",
            json={"message": "Elimina la tarjeta card-2-user", "username": "user"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["action"] == "delete_card"
        assert "card-2-user" not in data["board"]["cards"]

        db_card = db_session.query(Card).filter(Card.id == "card-2-user").first()
        assert db_card is None


def test_ai_chat_service_error_handling(client):
    """Valida que si falla el servicio de IA, se devuelva un error amigable sin romper el tablero."""
    mock_result = {
        "success": False,
        "error": "Error de conexion con Gemini",
    }

    with patch("app.routes.ai.generate_content", new_callable=AsyncMock) as mock_gen:
        mock_gen.return_value = mock_result
        response = client.post(
            "/api/ai/chat",
            json={"message": "Hola", "username": "user"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        assert "problema al conectar" in data["reply"]
        assert len(data["board"]["columns"]) == 5
