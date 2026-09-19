import asyncio
from unittest.mock import AsyncMock, patch
import httpx
import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.services.ai import generate_content, get_gemini_model

client = TestClient(app)


def test_ai_status_endpoint():
    """Verifica que el endpoint de estado devuelva los metadatos de configuracion."""
    response = client.get("/api/ai/status")
    assert response.status_code == 200
    data = response.json()
    assert data["provider"] == "gemini"
    assert "model" in data
    assert "configured" in data


def test_generate_content_missing_api_key():
    """Valida que si no hay GEMINI_API_KEY se retorne un error claro sin lanzar excepcion."""
    with patch("app.services.ai.get_gemini_api_key", return_value=""):
        result = asyncio.run(generate_content(prompt="Hola"))
        assert result["success"] is False
        assert "no esta configurada" in result["error"]
        assert result["configured"] is False


def test_generate_content_successful_response():
    """Valida la transformacion correcta de la respuesta recibida de Google Gemini."""
    mock_gemini_json = {
        "candidates": [
            {
                "content": {
                    "parts": [{"text": "2 + 2 son 4"}],
                    "role": "model",
                },
                "finishReason": "STOP",
            }
        ]
    }

    mock_response = httpx.Response(
        status_code=200,
        json=mock_gemini_json,
        request=httpx.Request("POST", "https://example.com"),
    )

    with patch("app.services.ai.get_gemini_api_key", return_value="fake_test_key"):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            result = asyncio.run(generate_content(prompt="¿Cuánto es 2+2?"))
            assert result["success"] is True
            assert result["reply"] == "2 + 2 son 4"
            assert result["provider"] == "gemini"
            assert result["configured"] is True


def test_generate_content_api_error_response():
    """Valida que un error HTTP retornado por la API de Gemini sea manejado apropiadamente."""
    mock_error_json = {
        "error": {
            "code": 400,
            "message": "API key not valid",
            "status": "INVALID_ARGUMENT",
        }
    }

    mock_response = httpx.Response(
        status_code=400,
        json=mock_error_json,
        request=httpx.Request("POST", "https://example.com"),
    )

    with patch("app.services.ai.get_gemini_api_key", return_value="invalid_key"):
        with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
            mock_post.return_value = mock_response
            result = asyncio.run(generate_content(prompt="¿Cuánto es 2+2?"))
            assert result["success"] is False
            assert "API key not valid" in result["error"]


def test_post_ai_test_endpoint_success():
    """Valida el endpoint POST /api/ai/test con mock exitoso."""
    mock_service_result = {
        "success": True,
        "reply": "El resultado de 2 + 2 es 4.",
        "provider": "gemini",
        "model": "gemini-2.5-flash",
        "configured": True,
    }

    with patch("app.routes.ai.generate_content", new_callable=AsyncMock) as mock_generate:
        mock_generate.return_value = mock_service_result
        response = client.post("/api/ai/test", json={"prompt": "¿Cuánto es 2+2?"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "ok"
        assert data["reply"] == "El resultado de 2 + 2 es 4."
        assert data["provider"] == "gemini"
        assert data["configured"] is True


def test_post_ai_test_endpoint_error_handling():
    """Valida que el endpoint POST /api/ai/test entregue status=error en caso de falla de API."""
    mock_service_result = {
        "success": False,
        "error": "Cuota excedida o clave invalida",
        "provider": "gemini",
        "model": "gemini-2.5-flash",
        "configured": True,
    }

    with patch("app.routes.ai.generate_content", new_callable=AsyncMock) as mock_generate:
        mock_generate.return_value = mock_service_result
        response = client.post("/api/ai/test", json={"prompt": "Hola"})
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "error"
        assert "Cuota excedida" in data["error"]
