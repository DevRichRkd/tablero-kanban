"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

interface AddCardModalProps {
  isOpen: boolean;
  columnTitle: string;
  onClose: () => void;
  onAdd: (title: string, details: string) => void;
}

export function AddCardModal({
  isOpen,
  columnTitle,
  onClose,
  onAdd,
}: AddCardModalProps) {
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const titleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTitle("");
      setDetails("");
      setTimeout(() => titleInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    onAdd(cleanTitle, details.trim());
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      data-testid="add-card-modal"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Fondo desenfocado */}
      <div
        className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Tarjeta del modal */}
      <div className="relative w-full max-w-md rounded-[32px] border border-[var(--stroke)] bg-white p-8 shadow-[0_25px_50px_-12px_rgba(3,33,71,0.25)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke)] bg-[var(--surface)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)]">
              <span className="h-2 w-2 rounded-full bg-[var(--accent-yellow)]" />
              Nueva tarjeta
            </div>
            <h3
              id="modal-title"
              className="mt-3 font-display text-2xl font-bold text-[var(--navy-dark)]"
            >
              Agregar a {columnTitle}
            </h3>
            <p className="mt-1 text-xs text-[var(--gray-text)]">
              Ingresa los datos para registrar la tarea en esta columna.
            </p>
          </div>
          <button
            type="button"
            data-testid="modal-close"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full border border-[var(--stroke)] text-sm font-semibold text-[var(--gray-text)] transition hover:bg-slate-100 hover:text-[var(--navy-dark)]"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label
              htmlFor="card-title-input"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy-dark)]"
            >
              Titulo de la tarjeta
            </label>
            <input
              id="card-title-input"
              ref={titleInputRef}
              type="text"
              required
              data-testid="modal-card-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej. Revisar propuesta técnica"
              className="mt-1.5 w-full rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-3 text-sm font-medium text-[var(--navy-dark)] placeholder-[var(--gray-text)] outline-none transition focus:border-[var(--primary-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            />
          </div>

          <div>
            <label
              htmlFor="card-details-input"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy-dark)]"
            >
              Descripcion o detalles
            </label>
            <textarea
              id="card-details-input"
              rows={3}
              data-testid="modal-card-details"
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Detalles sobre el alcance, notas o entregables..."
              className="mt-1.5 w-full resize-none rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-3 text-sm text-[var(--navy-dark)] placeholder-[var(--gray-text)] outline-none transition focus:border-[var(--primary-blue)] focus:bg-white focus:ring-2 focus:ring-[var(--primary-blue)]/20"
            />
          </div>

          <div className="mt-6 flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              data-testid="modal-btn-cancel"
              onClick={onClose}
              className="rounded-2xl border border-[var(--stroke)] px-5 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--gray-text)] transition hover:bg-slate-50 hover:text-[var(--navy-dark)]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              data-testid="modal-btn-save"
              className="rounded-2xl bg-[#753991] px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white shadow-md shadow-purple-950/20 transition-all duration-200 hover:bg-[#032147] hover:shadow-lg active:scale-95"
            >
              Guardar tarjeta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
