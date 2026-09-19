import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AiChatSidebar } from "@/components/AiChatSidebar";
import * as api from "@/lib/api";
import { initialData } from "@/lib/kanban";

vi.mock("@/lib/api", () => ({
  sendChatMessageApi: vi.fn(),
}));

describe("AiChatSidebar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("does not render when isOpen is false", () => {
    render(
      <AiChatSidebar
        currentUser="user"
        isOpen={false}
        onClose={vi.fn()}
        onBoardUpdate={vi.fn()}
      />
    );
    expect(screen.queryByTestId("ai-chat-sidebar")).not.toBeInTheDocument();
  });

  it("renders properly when isOpen is true", () => {
    render(
      <AiChatSidebar
        currentUser="user"
        isOpen={true}
        onClose={vi.fn()}
        onBoardUpdate={vi.fn()}
      />
    );
    expect(screen.getByTestId("ai-chat-sidebar")).toBeInTheDocument();
    expect(screen.getByText("Asistente IA")).toBeInTheDocument();
    expect(screen.getByTestId("ai-chat-input")).toBeInTheDocument();
    expect(screen.getByTestId("ai-chat-submit")).toBeInTheDocument();
  });

  it("calls onClose when clicking close button", async () => {
    const handleClose = vi.fn();
    render(
      <AiChatSidebar
        currentUser="user"
        isOpen={true}
        onClose={handleClose}
        onBoardUpdate={vi.fn()}
      />
    );
    const closeBtn = screen.getByTestId("ai-chat-close");
    await userEvent.click(closeBtn);
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("sends message, displays reply, and triggers onBoardUpdate", async () => {
    const handleBoardUpdate = vi.fn();
    const updatedBoard = { ...initialData };

    vi.mocked(api.sendChatMessageApi).mockResolvedValueOnce({
      status: "ok",
      reply: "He creado la tarjeta exitosamente.",
      action: "create_card",
      payload: { title: "Nueva Tarea", column_id: "col-backlog-user" },
      board: updatedBoard,
    });

    render(
      <AiChatSidebar
        currentUser="user"
        isOpen={true}
        onClose={vi.fn()}
        onBoardUpdate={handleBoardUpdate}
      />
    );

    const input = screen.getByTestId("ai-chat-input");
    const submitBtn = screen.getByTestId("ai-chat-submit");

    await userEvent.type(input, "Crea una tarjeta Nueva Tarea en Backlog");
    await userEvent.click(submitBtn);

    expect(screen.getByText("Crea una tarjeta Nueva Tarea en Backlog")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("He creado la tarjeta exitosamente.")).toBeInTheDocument();
    });

    expect(screen.getByText("Tarjeta creada en tablero")).toBeInTheDocument();
    expect(handleBoardUpdate).toHaveBeenCalledWith(updatedBoard);
  });

  it("handles error response gracefully", async () => {
    vi.mocked(api.sendChatMessageApi).mockRejectedValueOnce(
      new Error("Fallo de conexion")
    );

    render(
      <AiChatSidebar
        currentUser="user"
        isOpen={true}
        onClose={vi.fn()}
        onBoardUpdate={vi.fn()}
      />
    );

    const input = screen.getByTestId("ai-chat-input");
    const submitBtn = screen.getByTestId("ai-chat-submit");

    await userEvent.type(input, "Hola");
    await userEvent.click(submitBtn);

    await waitFor(() => {
      expect(
        screen.getByText("No fue posible comunicarse con el servicio de IA en este momento.")
      ).toBeInTheDocument();
    });
    expect(screen.getByText("Fallo de conexion")).toBeInTheDocument();
  });
});
