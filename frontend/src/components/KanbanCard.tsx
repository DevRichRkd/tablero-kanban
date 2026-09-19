import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import clsx from "clsx";
import type { Card } from "@/lib/kanban";

type KanbanCardProps = {
  card: Card;
  onDelete: (cardId: string) => void;
};

export const KanbanCard = ({ card, onDelete }: KanbanCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: card.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={clsx(
        "group relative rounded-2xl border border-slate-200 bg-white px-4 py-4",
        "shadow-[0_0_0_1px_rgba(3,33,71,0.08),0_4px_12px_rgba(3,33,71,0.08)]",
        "transition-all duration-200",
        "hover:border-[var(--primary-blue)]/50 hover:shadow-[0_0_0_1.5px_rgba(32,157,215,0.35),0_8px_20px_rgba(3,33,71,0.12)]",
        isDragging && "opacity-60 ring-2 ring-[var(--accent-yellow)] shadow-[0_0_0_2px_rgba(236,173,10,0.6),0_18px_32px_rgba(3,33,71,0.2)]"
      )}
      {...attributes}
      {...listeners}
      data-testid={`card-${card.id}`}
    >
      <div className="pr-8">
        <h4 className="font-display text-base font-semibold leading-snug text-[var(--navy-dark)]">
          {card.title}
        </h4>
        <p className="mt-2 text-sm leading-6 text-[var(--gray-text)]">
          {card.details}
        </p>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onDelete(card.id);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 opacity-60 transition-all duration-150 hover:bg-red-50 hover:text-red-600 hover:opacity-100 group-hover:opacity-100 focus:opacity-100 focus:outline-none"
        aria-label={`Eliminar tarjeta ${card.title}`}
        title="Eliminar tarjeta"
      >
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth="1.75"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
          />
        </svg>
      </button>
    </article>
  );
};
