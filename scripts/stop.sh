#!/usr/bin/env bash
set -e

echo "[INFO] Deteniendo contenedor tablero-kanban-app..."
docker stop tablero-kanban-app 2>/dev/null || true
docker rm tablero-kanban-app 2>/dev/null || true
echo "[INFO] Contenedor detenido y eliminado correctamente."
