"use client";

import { useState } from "react";
import clsx from "clsx";
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Card, Column } from "@/lib/kanban";
import { KanbanCard } from "@/components/KanbanCard";
import { AddCardModal } from "@/components/AddCardModal";

type KanbanColumnProps = {
  column: Column;
  cards: Card[];
  onRename: (columnId: string, title: string) => void;
  onAddCard: (columnId: string, title: string, details: string) => void;
  onDeleteCard: (columnId: string, cardId: string) => void;
};

export const KanbanColumn = ({
  column,
  cards,
  onRename,
  onAddCard,
  onDeleteCard,
}: KanbanColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section
      ref={setNodeRef}
      className={clsx(
        "flex min-h-[520px] flex-col rounded-3xl border border-[var(--stroke)] bg-[var(--surface-strong)] p-4 shadow-[var(--shadow)] transition",
        isOver && "ring-2 ring-[var(--accent-yellow)]"
      )}
      data-testid={`column-${column.id}`}
    >
      {/* Cabecera de la columna */}
      <div className="flex items-start justify-between gap-3">
        <div className="w-full">
          <div className="flex items-center gap-3">
            <div className="h-2 w-10 rounded-full bg-[var(--accent-yellow)]" />
            <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
              {cards.length} {cards.length === 1 ? "tarjeta" : "tarjetas"}
            </span>
          </div>
          <input
            value={column.title}
            onChange={(event) => onRename(column.id, event.target.value)}
            className="mt-3 w-full bg-transparent font-display text-lg font-semibold text-[var(--navy-dark)] outline-none transition focus:text-[var(--primary-blue)]"
            aria-label="Titulo de columna"
          />
        </div>
      </div>

      {/* Lista de tarjetas */}
      <div className="mt-4 flex flex-1 flex-col gap-3">
        <SortableContext items={column.cardIds} strategy={verticalListSortingStrategy}>
          {cards.map((card) => (
            <KanbanCard
              key={card.id}
              card={card}
              onDelete={(cardId) => onDeleteCard(column.id, cardId)}
            />
          ))}
        </SortableContext>

        {cards.length === 0 && (
          <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-[var(--stroke)] px-3 py-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-[var(--gray-text)]">
            Arrastra una tarjeta aqui
          </div>
        )}

        {/* Boton para agregar tarjeta al final de la ultima tarjeta */}
        <button
          type="button"
          data-testid={`btn-add-card-${column.id}`}
          onClick={() => setIsModalOpen(true)}
          className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white/70 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--primary-blue)] shadow-sm transition hover:border-[var(--primary-blue)] hover:bg-white hover:shadow"
        >
          <span className="text-base font-bold leading-none">+</span>
          <span>Agregar tarjeta</span>
        </button>
      </div>

      {/* Modal para ingresar titulo y detalles */}
      <AddCardModal
        isOpen={isModalOpen}
        columnTitle={column.title}
        onClose={() => setIsModalOpen(false)}
        onAdd={(title, details) => onAddCard(column.id, title, details)}
      />
    </section>
  );
};
