#!/usr/bin/env bash
set -e

# Navegar a la raiz del proyecto
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Incluir node20 local si existe
if [ -d "$HOME/.local/node20/bin" ]; then
    export PATH="$HOME/.local/node20/bin:$PATH"
fi

echo "[INFO] Verificando Docker..."
if ! command -v docker &> /dev/null; then
    echo "[ERROR] Docker no esta instalado o no se encuentra en el PATH."
    exit 1
fi

# Compilar frontend si no existe exportacion o si se solicita
if [ ! -d "frontend/out" ]; then
    echo "[INFO] Compilando frontend Next.js a exportacion estatica..."
    (cd frontend && npm run build)
fi

echo "[INFO] Construyendo imagen Docker tablero-kanban..."
docker build -t tablero-kanban .
docker image prune -f >/dev/null 2>&1 || true

echo "[INFO] Deteniendo contenedor previo si existe..."
docker rm -f tablero-kanban-app 2>/dev/null || true

echo "[INFO] Iniciando contenedor tablero-kanban-app en el puerto 8000..."
ENV_ARG=""
if [ -f ".env" ]; then
    echo "[INFO] Cargando variables de entorno desde .env..."
    ENV_ARG="--env-file .env"
fi
docker run -d --name tablero-kanban-app $ENV_ARG -p 8000:8000 tablero-kanban

echo "[INFO] Aplicacion disponible en http://localhost:8000"
