"use client";

import { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "@/components/KanbanColumn";
import { KanbanCardPreview } from "@/components/KanbanCardPreview";
import { LoginForm } from "@/components/LoginForm";
import { AiChatSidebar } from "@/components/AiChatSidebar";
import { createId, initialData, moveCard, type BoardData } from "@/lib/kanban";
import {
  fetchBoard,
  createCardApi,
  deleteCardApi,
  renameColumnApi,
  moveCardApi,
} from "@/lib/api";

type KanbanBoardProps = {
  initialUser?: string | null;
  initialBoard?: BoardData;
};

export const KanbanBoard = ({ initialUser, initialBoard }: KanbanBoardProps) => {
  const [board, setBoard] = useState<BoardData>(() => initialBoard || initialData);
  const [activeCardId, setActiveCardId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<string | null>(() => initialUser ?? null);
  const [mounted, setMounted] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"synced" | "saving" | "error">("synced");
  const [isChatOpen, setIsChatOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (initialUser === undefined) {
      const stored = localStorage.getItem("kanban_user");
      if (stored) {
        setCurrentUser(stored);
      }
    }
  }, [initialUser]);

  // Cargar datos reales desde el backend cuando hay usuario autenticado
  useEffect(() => {
    if (!currentUser || initialBoard) {
      return;
    }

    let isSubscribed = true;
    setSyncStatus("saving");

    fetchBoard(currentUser)
      .then((data) => {
        if (isSubscribed) {
          setBoard(data);
          setSyncStatus("synced");
        }
      })
      .catch((err) => {
        console.warn("No se pudo cargar desde el backend, usando estado local:", err);
        if (isSubscribed) {
          setSyncStatus("synced");
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [currentUser, initialBoard]);

  const handleLogin = (username: string) => {
    localStorage.setItem("kanban_user", username);
    setCurrentUser(username);
  };

  const handleLogout = () => {
    localStorage.removeItem("kanban_user");
    setCurrentUser(null);
  };

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 6 },
    })
  );

  const cardsById = useMemo(() => board.cards, [board.cards]);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveCardId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCardId(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Actualizacion optimista inmediata
    const nextColumns = moveCard(board.columns, active.id as string, over.id as string);
    setBoard((prev) => ({ ...prev, columns: nextColumns }));

    if (currentUser) {
      setSyncStatus("saving");
      try {
        const updatedBoard = await moveCardApi(
          active.id as string,
          over.id as string,
          currentUser
        );
        setBoard(updatedBoard);
        setSyncStatus("synced");
      } catch (err) {
        console.error("Error al persistir movimiento:", err);
        setSyncStatus("error");
      }
    }
  };

  const handleRenameColumn = async (columnId: string, title: string) => {
    setBoard((prev) => ({
      ...prev,
      columns: prev.columns.map((column) =>
        column.id === columnId ? { ...column, title } : column
      ),
    }));

    if (currentUser) {
      setSyncStatus("saving");
      try {
        await renameColumnApi(columnId, title);
        setSyncStatus("synced");
      } catch (err) {
        console.error("Error al renombrar columna:", err);
        setSyncStatus("error");
      }
    }
  };

  const handleAddCard = async (columnId: string, title: string, details: string) => {
    const id = createId("card");
    const localCard = { id, title, details: details || "Sin detalles adicionales." };

    // Insercion optimista inmediata
    setBoard((prev) => ({
      ...prev,
      cards: {
        ...prev.cards,
        [id]: localCard,
      },
      columns: prev.columns.map((column) =>
        column.id === columnId
          ? { ...column, cardIds: [...column.cardIds, id] }
          : column
      ),
    }));

    if (currentUser) {
      setSyncStatus("saving");
      try {
        const newCard = await createCardApi(columnId, title, details);
        setBoard((prev) => {
          const updatedCards = { ...prev.cards };
          delete updatedCards[id];
          updatedCards[newCard.id] = newCard;

          return {
            ...prev,
            cards: updatedCards,
            columns: prev.columns.map((column) =>
              column.id === columnId
                ? {
                    ...column,
                    cardIds: column.cardIds.map((cid) => (cid === id ? newCard.id : cid)),
                  }
                : column
            ),
          };
        });
        setSyncStatus("synced");
      } catch (err) {
        console.error("Error al crear tarjeta en backend:", err);
        setSyncStatus("error");
      }
    }
  };

  const handleDeleteCard = async (columnId: string, cardId: string) => {
    setBoard((prev) => ({
      ...prev,
      cards: Object.fromEntries(
        Object.entries(prev.cards).filter(([id]) => id !== cardId)
      ),
      columns: prev.columns.map((column) =>
        column.id === columnId
          ? {
              ...column,
              cardIds: column.cardIds.filter((id) => id !== cardId),
            }
          : column
      ),
    }));

    if (currentUser) {
      setSyncStatus("saving");
      try {
        await deleteCardApi(cardId);
        setSyncStatus("synced");
      } catch (err) {
        console.error("Error al eliminar tarjeta en backend:", err);
        setSyncStatus("error");
      }
    }
  };

  // Si no ha iniciado sesion, mostrar formulario de autenticacion
  if (mounted && !currentUser) {
    return <LoginForm onLogin={handleLogin} />;
  }

  // Durante la carga inicial antes de hidratar en cliente
  if (!mounted && initialUser === undefined) {
    return <LoginForm onLogin={handleLogin} />;
  }

  const activeCard = activeCardId ? cardsById[activeCardId] : null;

  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

      <main className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col gap-10 px-6 pb-16 pt-12">
        <header className="flex flex-col gap-6 rounded-[32px] border border-[var(--stroke)] bg-white/80 p-8 shadow-[var(--shadow)] backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[var(--gray-text)]">
                Tablero de Proyecto
              </p>
              <h1 className="mt-3 font-display text-4xl font-semibold text-[var(--navy-dark)]">
                Mi Kanban
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--gray-text)]">
                Mantén visible el avance de tu equipo. Renombra columnas, arrastra tarjetas entre etapas y gestiona tareas con asistencia inteligente.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gray-text)]">
                  Estado
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span
                    className={`h-2 w-2 rounded-full ${
                      syncStatus === "saving"
                        ? "animate-pulse bg-[var(--accent-yellow)]"
                        : syncStatus === "error"
                        ? "bg-red-500"
                        : "bg-emerald-500"
                    }`}
                  />
                  <span className="text-xs font-medium text-[var(--navy-dark)]">
                    {syncStatus === "saving"
                      ? "Guardando..."
                      : syncStatus === "error"
                      ? "Error al sincronizar"
                      : "Sincronizado con SQLite"}
                  </span>
                </div>
              </div>

              <div className="rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--gray-text)]">
                  Sesion activa
                </p>
                <p className="mt-1 font-mono text-sm font-semibold text-[var(--primary-blue)]">
                  {currentUser || "usuario"}
                </p>
              </div>

              <button
                type="button"
                data-testid="ai-chat-toggle"
                onClick={() => setIsChatOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-2xl border border-[var(--stroke)] bg-[var(--navy-dark)] px-5 py-4 text-xs font-semibold uppercase tracking-wider text-white shadow-sm transition hover:bg-slate-800"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--accent-yellow)]" />
                <span>Asistente IA</span>
              </button>

              <button
                type="button"
                data-testid="btn-logout"
                onClick={handleLogout}
                className="rounded-2xl border border-[var(--stroke)] bg-white px-5 py-4 text-xs font-semibold uppercase tracking-wider text-[var(--gray-text)] transition hover:border-red-300 hover:text-red-600"
              >
                Cerrar sesion
              </button>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            {board.columns.map((column) => (
              <div
                key={column.id}
                className="flex items-center gap-2 rounded-full border border-[var(--stroke)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)]"
              >
                <span className="h-2 w-2 rounded-full bg-[var(--accent-yellow)]" />
                {column.title}
              </div>
            ))}
          </div>
        </header>

        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <section className="grid gap-6 lg:grid-cols-5">
            {board.columns.map((column) => (
              <KanbanColumn
                key={column.id}
                column={column}
                cards={column.cardIds.map((cardId) => board.cards[cardId]).filter(Boolean)}
                onRename={handleRenameColumn}
                onAddCard={handleAddCard}
                onDeleteCard={handleDeleteCard}
              />
            ))}
          </section>
          <DragOverlay>
            {activeCard ? (
              <div className="w-[260px]">
                <KanbanCardPreview card={activeCard} />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        {/* Boton flotante de acceso rapido a la IA */}
        {!isChatOpen && (
          <button
            type="button"
            data-testid="ai-chat-floating-button"
            onClick={() => setIsChatOpen(true)}
            className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 rounded-full border border-[var(--stroke)] bg-[var(--navy-dark)] px-5 py-3 text-sm font-semibold text-white shadow-xl transition hover:scale-105 hover:bg-slate-800"
          >
            <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-[var(--accent-yellow)]" />
            <span>Asistente IA</span>
          </button>
        )}

        {/* Barra lateral de chat con IA */}
        <AiChatSidebar
          currentUser={currentUser || "user"}
          isOpen={isChatOpen}
          onClose={() => setIsChatOpen(false)}
          onBoardUpdate={(updatedBoard) => setBoard(updatedBoard)}
        />
      </main>
    </div>
  );
};
