from contextlib import asynccontextmanager
from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.db import init_db
from app.routes.kanban import router as kanban_router
from app.routes.ai import router as ai_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Inicializar y sembrar base de datos si no existe
    init_db()
    yield

app = FastAPI(
    title="Tablero Kanban API",
    description="API para la aplicacion de Gestion de Proyectos Kanban",
    version="0.1.0",
    lifespan=lifespan,
)

# Registrar rutas de API
app.include_router(kanban_router)
app.include_router(ai_router)

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "kanban-backend",
        "message": "Backend operativo",
    }

# Montar directorio estatico para servir Next.js en /
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
