# Frontend - Tablero Kanban MVP

## Descripcion General

El frontend es una aplicacion Next.js construida como demostracion inicial del tablero Kanban. Permite la visualizacion de columnas fijas, la edicion de titulos de columna, la creacion y eliminacion de tarjetas, y la reordenacion mediante arrastrar y soltar (drag and drop).

## Stack Tecnologico

- Framework: Next.js 16 (App Router)
- UI Library: React 19
- Lenguaje: TypeScript 5
- Estilos: Tailwind CSS v4 con variables CSS personalizadas
- Libreria de Drag and Drop: @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- Utilidades: clsx
- Pruebas Unitarias: Vitest 3 con React Testing Library y jsdom
- Pruebas E2E: Playwright 1.58

## Estructura de Directorios

- `src/app/`:
  - `page.tsx`: Punto de entrada principal que monta el componente `KanbanBoard`.
  - `layout.tsx`: Layout base con configuracion de fuentes e idioma.
  - `globals.css`: Definicion del sistema de diseno y tokens de color.
- `src/components/`:
  - `KanbanBoard.tsx`: Contenedor principal. Administra el estado global del tablero, eventos de drag and drop y operaciones sobre columnas y tarjetas.
  - `KanbanColumn.tsx`: Representa una columna droppable. Contiene la lista sortable de tarjetas, el campo para renombrar la columna y el formulario de nueva tarjeta.
  - `KanbanCard.tsx`: Representa una tarjeta individual sortable con boton de eliminacion.
  - `KanbanCardPreview.tsx`: Vista previa flotante utilizada por el overlay durante el arrastre.
  - `NewCardForm.tsx`: Formulario colapsable para agregar una tarjeta a la columna.
- `src/lib/`:
  - `kanban.ts`: Tipos principales (`Card`, `Column`, `BoardData`), datos semilla (`initialData`), utilidades de identificadores (`createId`) y logica pura para movimiento de tarjetas (`moveCard`).
- `tests/`:
  - `kanban.spec.ts`: Pruebas de extremo a extremo con Playwright para carga, creacion y movimiento de tarjetas.

## Esquema de Color Implementado

Definido en `src/app/globals.css`:
- Amarillo Acentuado: `#ecad0a` (`--accent-yellow`)
- Azul Primario: `#209dd7` (`--primary-blue`)
- Purpura Secundario: `#753991` (`--secondary-purple`)
- Azul Marino Oscuro: `#032147` (`--navy-dark`)
- Texto Gris: `#888888` (`--gray-text`)
- Fondo Superficie: `#f7f8fb` (`--surface`)
- Superficie Fuerte: `#ffffff` (`--surface-strong`)
- Borde: `rgba(3, 33, 71, 0.08)` (`--stroke`)
- Sombra: `0 18px 40px rgba(3, 33, 71, 0.12)` (`--shadow`)

## Comandos Disponibles

- `npm run dev`: Inicia el servidor de desarrollo local de Next.js.
- `npm run build`: Compila la aplicacion (configurable a exportacion estatica `output: 'export'`).
- `npm run start`: Inicia el servidor compilado de Next.js.
- `npm run lint`: Ejecuta ESLint.
- `npm run test` / `npm run test:unit`: Ejecuta las pruebas unitarias con Vitest.
- `npm run test:e2e`: Ejecuta las pruebas de integracion con Playwright.
- `npm run test:all`: Ejecuta suite completa de pruebas unitarias y e2e.

## Estado de la Integracion

Actualmente el frontend opera 100% en el cliente con datos en memoria (`initialData`). En fases posteriores se integrara con la API FastAPI para sincronizacion y persistencia en SQLite, asi como la incorporacion de la barra lateral de chat con IA.
