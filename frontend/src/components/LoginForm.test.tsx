import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LoginForm } from "@/components/LoginForm";

describe("LoginForm", () => {
  it("renders login form elements", () => {
    render(<LoginForm onLogin={() => {}} />);
    expect(screen.getByTestId("input-username")).toBeInTheDocument();
    expect(screen.getByTestId("input-password")).toBeInTheDocument();
    expect(screen.getByTestId("btn-login")).toBeInTheDocument();
  });

  it("shows error with invalid credentials", async () => {
    render(<LoginForm onLogin={() => {}} />);
    await userEvent.type(screen.getByTestId("input-username"), "wrong");
    await userEvent.type(screen.getByTestId("input-password"), "wrong");
    await userEvent.click(screen.getByTestId("btn-login"));

    expect(screen.getByTestId("login-error")).toBeInTheDocument();
  });

  it("calls onLogin when user/password credentials are valid", async () => {
    const handleLogin = vi.fn();
    render(<LoginForm onLogin={handleLogin} />);
    await userEvent.type(screen.getByTestId("input-username"), "user");
    await userEvent.type(screen.getByTestId("input-password"), "password");
    await userEvent.click(screen.getByTestId("btn-login"));

    expect(handleLogin).toHaveBeenCalledWith("user");
  });

  it("calls onLogin when usuario/contraseña credentials are valid", async () => {
    const handleLogin = vi.fn();
    render(<LoginForm onLogin={handleLogin} />);
    await userEvent.type(screen.getByTestId("input-username"), "usuario");
    await userEvent.type(screen.getByTestId("input-password"), "contraseña");
    await userEvent.click(screen.getByTestId("btn-login"));

    expect(handleLogin).toHaveBeenCalledWith("usuario");
  });
});
