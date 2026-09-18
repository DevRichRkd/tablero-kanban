# Scripts de Control del Servidor

## Descripcion General

Este directorio contiene los scripts de inicio y parada del entorno Docker para Mac, Linux y Windows.

## Archivos y Plataformas

- `start.sh`: Script Bash para iniciar la construccion y ejecucion del contenedor en Mac y Linux.
- `stop.sh`: Script Bash para detener y limpiar el contenedor en Mac y Linux.
- `start.bat`: Script Batch para iniciar la construccion y ejecucion del contenedor en Windows.
- `stop.bat`: Script Batch para detener y limpiar el contenedor en Windows.

## Uso

### En Mac / Linux:

Iniciar:
```bash
./scripts/start.sh
```

Detener:
```bash
./scripts/stop.sh
```

### En Windows:

Iniciar:
```cmd
scripts\start.bat
```

Detener:
```cmd
scripts\stop.bat
```

## Comportamiento

Los scripts compilan la imagen Docker etiquetada como `tablero-kanban`, detienen cualquier instancia previa llamada `tablero-kanban-app` y levantan el contenedor en segundo plano exponiendo el puerto 8000 hacia `http://localhost:8000`.