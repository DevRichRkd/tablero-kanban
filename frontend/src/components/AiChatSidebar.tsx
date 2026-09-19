"use client";

import { useEffect, useRef, useState } from "react";
import type { BoardData } from "@/lib/kanban";
import { sendChatMessageApi, type ChatMessage } from "@/lib/api";

interface AiChatSidebarProps {
  currentUser: string;
  isOpen: boolean;
  onClose: () => void;
  onBoardUpdate: (updatedBoard: BoardData) => void;
}

export function AiChatSidebar({
  currentUser,
  isOpen,
  onClose,
  onBoardUpdate,
}: AiChatSidebarProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hola, soy tu asistente de gestión de proyectos impulsado por IA. Puedo crear, mover o actualizar tarjetas en tu tablero. Por ejemplo: 'Crea una tarea llamada Diseñar interfaz en Backlog'.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView?.({ behavior: "smooth" });
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputValue).trim();
    if (!text || isLoading) return;

    const newMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(newMessages);
    setInputValue("");
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const response = await sendChatMessageApi(text, currentUser, newMessages);

      if (response.status === "ok") {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: response.reply,
            action: response.action !== "none" ? response.action : undefined,
          },
        ]);

        if (response.board) {
          onBoardUpdate(response.board);
        }
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content:
              response.reply ||
              "Ocurrio un problema al procesar la solicitud con el asistente.",
          },
        ]);
        if (response.error) {
          setErrorMessage(response.error);
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error de red al conectar con la IA";
      setErrorMessage(msg);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "No fue posible comunicarse con el servicio de IA en este momento.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage();
  };

  const getActionLabel = (action?: string) => {
    switch (action) {
      case "create_card":
        return "Tarjeta creada en tablero";
      case "update_card":
        return "Tarjeta actualizada";
      case "move_card":
        return "Tarjeta reubicada";
      case "delete_card":
        return "Tarjeta eliminada";
      default:
        return null;
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <aside
      data-testid="ai-chat-sidebar"
      className="fixed inset-y-0 right-0 z-50 flex w-full max-w-[420px] flex-col border-l border-[var(--stroke)] bg-white/95 shadow-2xl backdrop-blur-md transition-all duration-300"
    >
      {/* Cabecera del chat */}
      <div className="flex items-center justify-between border-b border-[var(--stroke)] px-6 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[var(--navy-dark)] text-white shadow-sm">
            <span className="text-xs font-bold tracking-wider">IA</span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-[var(--navy-dark)]">
                Asistente IA
              </h2>
              <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                Gemini 3.1 Flash Lite
              </span>
            </div>
            <p className="text-xs text-[var(--gray-text)]">
              Control inteligente del tablero
            </p>
          </div>
        </div>

        <button
          type="button"
          data-testid="ai-chat-close"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full border border-[var(--stroke)] text-sm font-semibold text-[var(--gray-text)] transition hover:bg-slate-100 hover:text-[var(--navy-dark)]"
          aria-label="Cerrar chat"
        >
          ✕
        </button>
      </div>

      {/* Historial de mensajes */}
      <div
        data-testid="ai-chat-messages"
        className="flex-1 space-y-4 overflow-y-auto px-6 py-6"
      >
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          const actionBadge = getActionLabel(msg.action);

          return (
            <div
              key={index}
              className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  isUser
                    ? "bg-[var(--navy-dark)] text-white shadow-sm"
                    : "border border-[var(--stroke)] bg-slate-50 text-[var(--navy-dark)]"
                }`}
              >
                <p className="whitespace-pre-wrap">{msg.content}</p>

                {actionBadge && (
                  <div className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-[var(--accent-yellow)] bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-900">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent-yellow)]" />
                    {actionBadge}
                  </div>
                )}
              </div>
              <span className="mt-1 px-1 text-[10px] text-[var(--gray-text)]">
                {isUser ? "Tu" : "Asistente"}
              </span>
            </div>
          );
        })}

        {isLoading && (
          <div
            data-testid="ai-chat-loading"
            className="flex items-center gap-2 text-xs text-[var(--gray-text)]"
          >
            <div className="flex gap-1">
              <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--primary-blue)]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--purple-secondary)] [animation-delay:0.2s]" />
              <span className="h-2 w-2 animate-bounce rounded-full bg-[var(--accent-yellow)] [animation-delay:0.4s]" />
            </div>
            <span>El asistente esta pensando...</span>
          </div>
        )}

        {errorMessage && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <p className="font-semibold">Aviso de comunicacion:</p>
            <p className="mt-0.5">{errorMessage}</p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Sugerencias rapidas */}
      <div className="border-t border-[var(--stroke)]/50 bg-slate-50/70 px-6 py-2.5">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--gray-text)]">
          Sugerencias
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleSendMessage("Crea una tarjeta llamada Revisar diseno en Backlog")}
            className="rounded-full border border-[var(--stroke)] bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--navy-dark)] transition hover:border-[var(--primary-blue)] hover:text-[var(--primary-blue)]"
          >
            + Tarjeta en Backlog
          </button>
          <button
            type="button"
            onClick={() => handleSendMessage("Que tareas tenemos actualmente en Backlog?")}
            className="rounded-full border border-[var(--stroke)] bg-white px-2.5 py-1 text-[11px] font-medium text-[var(--navy-dark)] transition hover:border-[var(--primary-blue)] hover:text-[var(--primary-blue)]"
          >
            Consultar Backlog
          </button>
        </div>
      </div>

      {/* Formulario de entrada */}
      <form
        data-testid="ai-chat-form"
        onSubmit={handleSubmit}
        className="border-t border-[var(--stroke)] bg-white p-4"
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            data-testid="ai-chat-input"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Pide crear, mover o editar tarjetas..."
            disabled={isLoading}
            className="flex-1 rounded-xl border border-[var(--stroke)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--navy-dark)] placeholder-[var(--gray-text)] outline-none transition focus:border-[var(--primary-blue)] focus:ring-2 focus:ring-[var(--primary-blue)]/20 disabled:opacity-50"
          />
          <button
            type="submit"
            data-testid="ai-chat-submit"
            disabled={isLoading || !inputValue.trim()}
            className="flex items-center justify-center rounded-xl bg-[var(--purple-secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#60287a] disabled:cursor-not-allowed disabled:opacity-50"
          >
            Enviar
          </button>
        </div>
      </form>
    </aside>
  );
}
