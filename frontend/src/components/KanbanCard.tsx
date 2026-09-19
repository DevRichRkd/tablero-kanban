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
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h4 className="font-display text-base font-semibold text-[var(--navy-dark)]">
            {card.title}
          </h4>
          <p className="mt-2 text-sm leading-6 text-[var(--gray-text)]">
            {card.details}
          </p>
        </div>
        <button
          type="button"
          onClick={() => onDelete(card.id)}
          className="rounded-full border border-transparent px-2.5 py-1 text-xs font-semibold text-[var(--gray-text)] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
          aria-label={`Eliminar tarjeta ${card.title}`}
        >
          Eliminar
        </button>
      </div>
    </article>
  );
};
