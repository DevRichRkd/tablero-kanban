from pathlib import Path
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI(
    title="Tablero Kanban API",
    description="API para la aplicacion de Gestion de Proyectos Kanban",
    version="0.1.0",
)

@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "service": "kanban-backend",
        "message": "Backend operativo",
    }

# Montar directorio estatico si existe
STATIC_DIR = Path(__file__).resolve().parent.parent / "static"
if STATIC_DIR.exists():
    app.mount("/", StaticFiles(directory=str(STATIC_DIR), html=True), name="static")
