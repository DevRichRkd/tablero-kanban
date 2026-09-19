import type { BoardData, Card } from "@/lib/kanban";

function getBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) return process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined" && window.location?.origin) return window.location.origin;
  return "http://localhost:8000";
}

export async function fetchBoard(username: string): Promise<BoardData> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/kanban?username=${encodeURIComponent(username)}`);
  if (!res.ok) {
    throw new Error(`Error al cargar tablero: ${res.statusText}`);
  }
  return res.json();
}

export async function createCardApi(
  columnId: string,
  title: string,
  details: string
): Promise<Card> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/kanban/cards`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ column_id: columnId, title, details }),
  });
  if (!res.ok) {
    throw new Error(`Error al crear tarjeta: ${res.statusText}`);
  }
  return res.json();
}

export async function updateCardApi(
  cardId: string,
  title?: string,
  details?: string
): Promise<Card> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/kanban/cards/${cardId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title, details }),
  });
  if (!res.ok) {
    throw new Error(`Error al actualizar tarjeta: ${res.statusText}`);
  }
  return res.json();
}

export async function deleteCardApi(cardId: string): Promise<void> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/kanban/cards/${cardId}`, {
    method: "DELETE",
  });
  if (!res.ok) {
    throw new Error(`Error al eliminar tarjeta: ${res.statusText}`);
  }
}

export async function renameColumnApi(columnId: string, title: string): Promise<void> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/kanban/columns/${columnId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) {
    throw new Error(`Error al renombrar columna: ${res.statusText}`);
  }
}

export async function moveCardApi(
  activeId: string,
  overId: string,
  username: string
): Promise<BoardData> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/kanban/move-card?username=${encodeURIComponent(username)}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ active_id: activeId, over_id: overId }),
  });
  if (!res.ok) {
    throw new Error(`Error al mover tarjeta: ${res.statusText}`);
  }
  return res.json();
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  action?: string;
}

export interface AiChatApiResponse {
  status: "ok" | "error";
  reply: string;
  action: string;
  payload: Record<string, any>;
  board: BoardData;
  error?: string | null;
}

export async function sendChatMessageApi(
  message: string,
  username: string,
  history: ChatMessage[] = []
): Promise<AiChatApiResponse> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/api/ai/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      username,
      history: history.map((h) => ({ role: h.role, content: h.content })),
    }),
  });
  if (!res.ok) {
    throw new Error(`Error en la comunicacion con el chat: ${res.statusText}`);
  }
  return res.json();
}
