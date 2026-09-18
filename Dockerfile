FROM python:3.12-slim-bookworm

# Instalar uv desde imagen oficial
COPY --from=ghcr.io/astral-sh/uv:latest /uv /uvx /bin/

WORKDIR /app/backend

ENV UV_COMPILE_BYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PATH="/app/backend/.venv/bin:$PATH"

# Instalar dependencias del backend usando uv
COPY backend/pyproject.toml backend/README.md ./
RUN uv sync --no-dev

# Copiar codigo fuente del backend
COPY backend/ ./

# Reemplazar static con la exportacion estatica compilada de Next.js
RUN rm -rf static
COPY frontend/out/ ./static/

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
