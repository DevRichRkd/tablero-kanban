# Plan de Desarrollo - Tablero Kanban MVP

Documento maestro de planificacion y ejecucion del proyecto. Cada fase contiene una lista de verificacion de subpasos, pruebas requeridas y criterios de exito.

---

## Parte 1: Planificacion

Objetivo: Establecer la hoja de ruta detallada del proyecto y documentar la base de codigo existente del frontend.

### Lista de verificacion
- [x] Consolidar la estructura del proyecto en la raiz de `tablero-kanban/`.
- [x] Crear el archivo `frontend/AGENTS.md` con la descripcion tecnica del codigo existente.
- [x] Enriquecer `docs/PLAN.md` con listas de verificacion, pruebas y criterios de exito por fase.
- [x] Obtener revision y aprobacion del plan por parte del usuario.

### Pruebas
- Verificacion visual y de sintaxis de los documentos markdown (`docs/PLAN.md` y `frontend/AGENTS.md`).
- Comprobacion de que no se incluyan emojis en la documentacion ni en el codigo.

### Criterios de exito
- `frontend/AGENTS.md` describe con precision el stack, componentes y comandos del frontend.
- `docs/PLAN.md` cubre las 10 partes con subpasos verificables.
- El usuario aprueba el plan.

---

## Parte 2: Estructura

Objetivo: Configurar el entorno Docker, el backend FastAPI en `backend/` y los scripts de inicio y parada en `scripts/`, sirviendo un HTML estatico de prueba y un endpoint de API funcional.

### Lista de verificacion
- [x] Inicializar el proyecto backend en `backend/` utilizando `uv` con Python 3.12+ y FastAPI.
- [x] Crear la aplicacion FastAPI minima en `backend/app/main.py` con endpoint `GET /api/health` y ruta `/` con HTML basico.
- [x] Crear el `Dockerfile` optimizado con soporte para `uv` y ejecucion de FastAPI mediante Uvicorn.
- [x] Crear scripts ejecutables en `scripts/`:
  - `start.sh` (Mac/Linux) y `start.bat` (Windows).
  - `stop.sh` (Mac/Linux) y `stop.bat` (Windows).
- [x] Actualizar `backend/AGENTS.md` y `scripts/AGENTS.md`.

### Pruebas
- Prueba de API: peticion HTTP a `GET /api/health` retorna `{"status": "ok"}` con codigo 200.
- Prueba estatica: peticion a `GET /` retorna el HTML de prueba.
- Prueba de scripts: ejecutar `./scripts/start.sh` y `./scripts/stop.sh` inicia y detiene el servicio correctamente.

### Criterios de exito
- El contenedor Docker compila e inicia sin advertencias ni errores.
- FastAPI responde localmente en el puerto configurado.

---

## Parte 3: Integracion del Frontend

Objetivo: Configurar Next.js para exportacion estatica y servir el frontend real del tablero Kanban desde FastAPI en la ruta `/`.

### Lista de verificacion
- [x] Configurar `output: 'export'` en `frontend/next.config.ts`.
- [x] Configurar el build del frontend para generar la carpeta de distribucion estatica (`frontend/out`).
- [x] Actualizar `Dockerfile` y scripts de inicio para compilar e integrar los estaticos con FastAPI.
- [x] Configurar FastAPI (`backend/app/main.py`) para montar y servir los archivos estaticos en `/`.
- [x] Probar la navegacion y la carga de recursos (JS, CSS, fuentes) en el navegador.

### Pruebas
- Pruebas unitarias de frontend: ejecucion exitosa de `npm run test:unit`.
- Pruebas de integracion: verificar que el tablero Kanban carga completamente desde `http://localhost:8000/`.
- Prueba de regresion: verificar que el arrastre de tarjetas y la edicion de titulos funcionan en la version servida por FastAPI.

### Criterios de exito
- Acceder a `http://localhost:8000/` muestra el tablero Kanban interactivo sin errores 404 de assets.
- El contenedor unico aloja y sirve frontend y backend conjuntamente.

---

## Parte 4: Anadir una Experiencia de Inicio de Sesion Simulada

Objetivo: Requerir que el usuario inicie sesion con credenciales simuladas antes de acceder al tablero, permitiendo cerrar sesion en cualquier momento.

### Lista de verificacion
- [x] Crear componente de login en `frontend/src/components/LoginForm.tsx`.
- [x] Permitir credenciales ficticias (`user`/`password` o `usuario`/`contraseña`).
- [x] Implementar manejo de estado de autenticacion en el cliente (almacenamiento de sesion/cookie simple).
- [x] Proteger la vista del tablero en `frontend/src/app/page.tsx`: mostrar login si no hay sesion activa.
- [x] Agregar boton de "Cerrar sesion" en la cabecera del tablero que restablezca el estado.
- [x] Aplicar la paleta de colores oficial al formulario de inicio de sesion.

### Pruebas
- Pruebas unitarias con Vitest para `LoginForm`:
  - Muestra mensaje de error si las credenciales son incorrectas.
  - Otorga acceso cuando las credenciales coinciden.
- Prueba de cierre de sesion: al hacer clic en "Cerrar sesion" el usuario vuelve a ver la pantalla de login.

### Criterios de exito
- Un usuario no autenticado no puede ver el tablero ni interactuar con el.
- El flujo de login y logout opera de forma fluida y sin recargas de pagina innecesarias.

---

## Parte 5: Modelado de la Base de Datos

Objetivo: Definir y documentar el modelo de base de datos relacional para soportar usuarios, tableros, columnas y tarjetas en SQLite.

### Lista de verificacion
- [x] Disenar el esquema relacional con soporte multi-usuario:
  - Tabla `users`: identificador, nombre de usuario, contraseña o hash, fecha de creacion.
  - Tabla `boards`: identificador, relacion a usuario (`user_id`), titulo, fecha de creacion.
  - Tabla `columns`: identificador, relacion a tablero (`board_id`), titulo, posicion/orden.
  - Tabla `cards`: identificador, relacion a columna (`column_id`), titulo, detalles, posicion/orden, fecha de creacion.
- [x] Exportar el esquema formal en formato JSON en `docs/schema.json`.
- [x] Documentar el modelo y sus decisiones en `docs/DATABASE.md`.
- [x] Presentar el esquema al usuario y obtener su aprobacion.

### Pruebas
- Validar la sintaxis y estructura del archivo `docs/schema.json`.
- Verificar integridad referencial (claves foraneas y cascada de eliminacion).

### Criterios de exito
- El esquema soporta las operaciones actuales del MVP (1 tablero por usuario) y permite expansion a multiples usuarios y tableros.
- Documento `docs/DATABASE.md` y archivo `docs/schema.json` aprobados por el usuario.

---

## Parte 6: Backend

Objetivo: Implementar la capa de datos SQLite en FastAPI y crear los endpoints CRUD para consultar y modificar el tablero de un usuario, con creacion automatica de la base de datos.

### Lista de verificacion
- [x] Configurar SQLAlchemy / SQLModel con SQLite en `backend/app/db.py`.
- [x] Implementar logica para crear automaticamente el archivo SQLite y poblar datos iniciales si no existe.
- [x] Definir modelos de datos y esquemas Pydantic correspondientes.
- [x] Implementar rutas de API en `backend/app/routes/kanban.py`:
  - `GET /api/kanban`: Obtener columnas y tarjetas del usuario.
  - `POST /api/kanban/cards`: Crear una nueva tarjeta en una columna.
  - `PUT /api/kanban/cards/{card_id}`: Actualizar titulo o detalles de una tarjeta.
  - `DELETE /api/kanban/cards/{card_id}`: Eliminar una tarjeta.
  - `PUT /api/kanban/columns/{column_id}`: Renombrar columna.
  - `PUT /api/kanban/move-card`: Actualizar orden y posicion de tarjetas entre columnas.
- [x] Implementar pruebas unitarias de backend con `pytest`.

### Pruebas
- Pruebas unitarias de creacion de BD: verificar que al arrancar en un entorno limpio se genera la base de datos con el esquema correcto.
- Pruebas de endpoints:
  - Creacion, lectura, actualizacion y eliminacion de tarjetas retornan codigos 200/201.
  - Renombrado de columnas persiste correctamente.
  - Reordenacion de tarjetas refleja el nuevo orden en consultas posteriores.

### Criterios de exito
- Suite de pruebas de backend con `pytest` ejecutandose con 100% de exito.
- La base de datos SQLite se crea sin intervencion manual.

---

## Parte 7: Frontend + Backend

Objetivo: Conectar el frontend Next.js a los endpoints de la API FastAPI para lograr persistencia reactiva completa.

### Lista de verificacion
- [x] Crear cliente HTTP tipado en `frontend/src/lib/api.ts`.
- [x] Modificar `KanbanBoard.tsx` para cargar los datos del tablero desde `GET /api/kanban` al iniciar sesion.
- [x] Conectar la accion de agregar tarjeta con `POST /api/kanban/cards`.
- [x] Conectar la accion de eliminar tarjeta con `DELETE /api/kanban/cards/{card_id}`.
- [x] Conectar la accion de renombrar columna con `PUT /api/kanban/columns/{column_id}`.
- [x] Conectar el movimiento de tarjetas con `PUT /api/kanban/move-card`.
- [x] Agregar indicadores discretos de guardado o error de red.

### Pruebas
- Pruebas de persistencia: crear una tarjeta, recargar la pagina en el navegador y comprobar que la tarjeta permanece visible.
- Pruebas de movimiento: mover una tarjeta de "Backlog" a "Done", recargar la pagina y verificar que permanece en "Done".
- Pruebas de eliminacion: eliminar una tarjeta, recargar la pagina y verificar que ya no existe.

### Criterios de exito
- Cualquier cambio en la interfaz se guarda inmediatamente en la base de datos backend.
- La experiencia de usuario no sufre degradacion perceptible de latencia.

---

## Parte 8: Conectividad con IA

Objetivo: Configurar y verificar la comunicacion del backend con el servicio de IA mediante la API de Google Gemini.

### Lista de verificacion
- [x] Crear modulo de servicio de IA en `backend/app/services/ai.py`.
- [x] Configurar lectura de `GEMINI_API_KEY` desde variable de entorno / `.env`.
- [x] Configurar modelo por defecto `gemini-3.6-flash` con opcion de sobreescritura por variable de entorno `GEMINI_MODEL`.
- [x] Crear endpoint de diagnostico `POST /api/ai/test` que envie una consulta basica ("Cuanto es 2+2?").
- [x] Escribir prueba unitaria con mock y prueba de integracion opcional contra Google Gemini.

### Pruebas
- Prueba unitaria con mock de la llamada a la API de Gemini.
- Prueba manual o de integracion contra el endpoint `POST /api/ai/test` comprobando que retorna el resultado esperado.

### Criterios de exito
- El backend puede autenticarse contra Google Gemini y recibir respuestas validas del modelo.
- En caso de falta de clave o error de cuota/red, se devuelve un mensaje de error claro y descriptivo sin caida del servicio.

---

## Parte 9: Lógica de IA con Salidas Estructuradas

Objetivo: Permitir que el backend envie el estado JSON del tablero y el mensaje del usuario al LLM, obteniendo una respuesta estructurada que contenga el mensaje conversacional y posibles mutaciones al tablero.

### Lista de verificacion
- [x] Disenar esquema de Salida Estructurada (JSON Schema / Pydantic) con los campos:
  - `reply`: Texto de respuesta para el usuario.
  - `action`: Tipo de accion (`none`, `create_card`, `update_card`, `move_card`, `delete_card`).
  - `payload`: Parametros especificos de la operacion sobre el tablero.
- [x] Crear endpoint `POST /api/ai/chat` que reciba:
  - Historial de mensajes de la conversacion.
  - Estado actual del tablero Kanban.
  - Mensaje del usuario.
- [x] Implementar en el backend la aplicacion automatica de la mutacion indicada por el LLM en la base de datos.
- [x] Retornar al cliente tanto el mensaje de respuesta como el estado actualizado del tablero.
- [x] Escribir pruebas unitarias simulando diferentes respuestas estructuradas.

### Pruebas
- Pruebas unitarias de parsing de salida estructurada para cada tipo de accion.
- Prueba de creacion por IA: solicitar "Crea una tarjeta para revisar contratos en Backlog" y comprobar que se inserta en BD.
- Prueba de movimiento por IA: solicitar "Mueve la tarjeta X a Review" y verificar la actualizacion en BD.

### Criterios de exito
- El LLM responde con JSON valido y estructurado.
- Las modificaciones solicitadas se reflejan con precision en la base de datos.

---

## Parte 10: Widget Lateral de Chat con IA en el Frontend

Objetivo: Incorporar en la interfaz de usuario una barra lateral de chat con IA que permita interactuar en lenguaje natural y refleje instantaneamente los cambios en el tablero.

### Lista de verificacion
- [x] Crear componente `frontend/src/components/AiChatSidebar.tsx`.
- [x] Incorporar boton para expandir y colapsar la barra lateral con transiciones fluidas.
- [x] Disenar la interfaz del chat aplicando estrictamente el esquema de colores:
  - Titulos y cabecera: `#032147`
  - Boton de envio: `#753991`
  - Destacados y acentos: `#ecad0a`
  - Enlaces o badges: `#209dd7`
  - Textos secundarios: `#888888`
- [x] Mostrar historial de conversacion con burbujas diferenciadas para usuario e IA.
- [x] Conectar el envio de mensajes a `POST /api/ai/chat`.
- [x] Al recibir un tablero actualizado en la respuesta del backend, actualizar el estado de `KanbanBoard` reactivamente sin recargar la pagina.
- [x] Anadir estados visuales de carga ("Pensando...") y manejo de errores amigable.

### Pruebas
- Pruebas unitarias con Vitest para el componente `AiChatSidebar`.
- Prueba de extremo a extremo:
  - Abrir la barra lateral de chat.
  - Enviar una peticion ("Crea una tarjeta llamada Nueva Tarea en In Progress").
  - Verificar que la tarjeta aparece inmediatamente en la columna correspondiente del tablero en pantalla.

### Criterios de exito
- La barra lateral funciona con alta fluidez visual y respeta las pautas esteticas del proyecto.
- Las modificaciones generadas por la IA actualizan el tablero de forma instantanea y consistente.
