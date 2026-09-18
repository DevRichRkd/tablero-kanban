# Backend - Tablero Kanban

## Descripcion General

El backend proporciona la API REST y el servicio de archivos estaticos para la aplicacion de Gestion de Proyectos Kanban. Esta construido con FastAPI y empaquetado mediante uv y Docker.

## Stack Tecnologico

- Lenguaje: Python 3.12+
- Framework Web: FastAPI 0.115+
- Servidor ASGI: Uvicorn 0.30+
- Gestor de paquetes: uv
- Contenedor: Docker (multi-stage con uv y python:3.12-slim-bookworm)

## Estructura de Directorios

- `pyproject.toml`: Declaracion de dependencias y metadatos del proyecto.
- `app/`:
  - `__init__.py`: Inicializador del paquete.
  - `main.py`: Punto de entrada de la aplicacion FastAPI, registro de rutas y montaje de archivos estaticos.
- `static/`:
  - `index.html`: Archivo HTML estatico inicial de verificacion (hola mundo y prueba de API). En etapas posteriores sera sustituido por la exportacion estatica de Next.js.

## Endpoints Actuales

- `GET /api/health`: Endpoint de comprobacion de estado. Retorna status ok y nombre del servicio.
- `GET /`: Servidor de archivos estaticos que entrega `static/index.html`.

## Comandos de Desarrollo Local

Instalar dependencias y ejecutar en modo desarrollo:
```bash
uv sync
uv run uvicorn app.main:app --reload --port 8000
```
