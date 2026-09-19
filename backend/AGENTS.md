# Backend - Tablero Kanban

## Descripcion General

El backend proporciona la API REST, persistencia relacional con SQLite y el servicio de archivos estaticos de Next.js para la aplicacion de Gestion de Proyectos Kanban. Esta construido con FastAPI y gestionado mediante uv y Docker.

## Stack Tecnologico

- Lenguaje: Python 3.12+
- Framework Web: FastAPI 0.115+
- ORM: SQLAlchemy 2.0+
- Base de datos: SQLite local (autocreada en el arranque si no existe)
- Servidor ASGI: Uvicorn 0.30+
- Gestor de paquetes: uv
- Pruebas unitarias: pytest y httpx TestClient

## Estructura de Directorios

- `pyproject.toml`: Declaracion de dependencias y configuracion de empaquetado con uv.
- `app/`:
  - `__init__.py`: Inicializador del paquete backend.
  - `main.py`: Punto de entrada de FastAPI, lifespan para inicializacion de BD, registro de routers y montaje de estaticos.
  - `db.py`: Configuracion de la base de datos SQLite, sesion SQLAlchemy y funcion `init_db()` para creacion de tablas y datos semilla.
  - `models.py`: Modelos ORM (`User`, `Board`, `BoardColumn`, `Card`) y esquemas Pydantic para request/response.
  - `routes/`:
    - `__init__.py`: Paquete de rutas.
    - `kanban.py`: Endpoints para lectura y manipulacion del tablero.
- `tests/`:
  - `test_kanban_api.py`: Suite completa de pruebas unitarias con base de datos en memoria (`sqlite:///:memory:`).
- `static/`:
  - Directorio donde se montan los artefactos compilados del frontend Next.js.

## Endpoints de la API

- `GET /api/health`: Comprobacion de estado del servidor (200 OK).
- `GET /api/kanban?username={user}`: Obtiene el tablero completo del usuario (columnas y tarjetas).
- `POST /api/kanban/cards`: Crea una nueva tarjeta en una columna.
- `PUT /api/kanban/cards/{card_id}`: Actualiza el titulo y/o detalles de una tarjeta.
- `DELETE /api/kanban/cards/{card_id}`: Elimina una tarjeta y reordena las restantes.
- `PUT /api/kanban/columns/{column_id}`: Renombra una columna.
- `PUT /api/kanban/move-card?username={user}`: Mueve una tarjeta entre columnas o reordena dentro de la misma.
- `GET /`: Entrega la aplicacion web estatica.

## Comandos de Desarrollo y Pruebas

Ejecutar pruebas unitarias:
```bash
docker exec tablero-kanban-app pytest -v tests/test_kanban_api.py
```

Ejecucion local con uv:
```bash
uv sync
uv run uvicorn app.main:app --reload --port 8000
```
