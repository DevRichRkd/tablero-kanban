@echo off
echo [INFO] Deteniendo contenedor tablero-kanban-app...
docker stop tablero-kanban-app >nul 2>&1
docker rm tablero-kanban-app >nul 2>&1
echo [INFO] Contenedor detenido y eliminado correctamente.
