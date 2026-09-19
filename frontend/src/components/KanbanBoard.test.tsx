import { describe, it, expect } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { KanbanBoard } from "@/components/KanbanBoard";

const getFirstColumn = () => screen.getAllByTestId(/column-/i)[0];

describe("KanbanBoard", () => {
  it("renders login form when no user is authenticated", () => {
    render(<KanbanBoard initialUser={null} />);
    expect(screen.getByTestId("btn-login")).toBeInTheDocument();
  });

  it("renders five columns when user is authenticated", () => {
    render(<KanbanBoard initialUser="user" />);
    expect(screen.getAllByTestId(/column-/i)).toHaveLength(5);
    expect(screen.getByText("user")).toBeInTheDocument();
    expect(screen.getByTestId("btn-logout")).toBeInTheDocument();
  });

  it("logs out and shows login form when clicking Cerrar sesion", async () => {
    render(<KanbanBoard initialUser="user" />);
    const logoutBtn = screen.getByTestId("btn-logout");
    await userEvent.click(logoutBtn);
    expect(screen.getByTestId("btn-login")).toBeInTheDocument();
  });

  it("renames a column", async () => {
    render(<KanbanBoard initialUser="user" />);
    const column = getFirstColumn();
    const input = within(column).getByLabelText(/titulo de columna/i);
    await userEvent.clear(input);
    await userEvent.type(input, "New Name");
    expect(input).toHaveValue("New Name");
  });

  it("adds and removes a card", async () => {
    render(<KanbanBoard initialUser="user" />);
    const column = getFirstColumn();
    const addButton = within(column).getByRole("button", {
      name: /agregar tarjeta/i,
    });
    await userEvent.click(addButton);

    const titleInput = screen.getByTestId("modal-card-title");
    await userEvent.type(titleInput, "New card");
    const detailsInput = screen.getByTestId("modal-card-details");
    await userEvent.type(detailsInput, "Notes");

    await userEvent.click(screen.getByTestId("modal-btn-save"));

    expect(within(column).getByText("New card")).toBeInTheDocument();

    const deleteButton = within(column).getByRole("button", {
      name: /eliminar tarjeta new card/i,
    });
    await userEvent.click(deleteButton);

    expect(within(column).queryByText("New card")).not.toBeInTheDocument();
  });
});
