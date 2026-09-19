@echo off
setlocal enabledelayedexpansion

echo [INFO] Verificando Docker...
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker no esta instalado o no se encuentra en el PATH.
    exit /b 1
)

cd /d "%~dp0.."

echo [INFO] Construyendo imagen Docker tablero-kanban...
docker build -t tablero-kanban .
if %errorlevel% neq 0 (
    echo [ERROR] Fallo la construccion de la imagen Docker.
    exit /b 1
)
docker image prune -f >nul 2>&1

echo [INFO] Deteniendo contenedor previo si existe...
docker rm -f tablero-kanban-app >nul 2>&1

echo "[INFO] Iniciando contenedor tablero-kanban-app en el puerto 8000..."
set "ENV_ARG="
if exist ".env" (
    echo "[INFO] Cargando variables de entorno desde .env..."
    set "ENV_ARG=--env-file .env"
)
docker run -d --name tablero-kanban-app %ENV_ARG% -p 8000:8000 tablero-kanban

echo [INFO] Aplicacion disponible en http://localhost:8000
