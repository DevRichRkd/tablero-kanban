"use client";

import { useState, type FormEvent } from "react";

type LoginFormProps = {
  onLogin: (username: string) => void;
};

export const LoginForm = ({ onLogin }: LoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const cleanUser = username.trim().toLowerCase();
    const cleanPass = password.trim();

    const isValidUser =
      (cleanUser === "user" && cleanPass === "password") ||
      (cleanUser === "usuario" && cleanPass === "contraseña");

    if (isValidUser) {
      setError(null);
      onLogin(cleanUser);
    } else {
      setError("Credenciales invalidas. Utilice user / password.");
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-12">
      {/* Fondos degradados decorativos */}
      <div className="pointer-events-none absolute left-0 top-0 h-[420px] w-[420px] -translate-x-1/3 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,_rgba(32,157,215,0.25)_0%,_rgba(32,157,215,0.05)_55%,_transparent_70%)]" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-[520px] w-[520px] translate-x-1/4 translate-y-1/4 rounded-full bg-[radial-gradient(circle,_rgba(117,57,145,0.18)_0%,_rgba(117,57,145,0.05)_55%,_transparent_75%)]" />

      <main className="relative w-full max-w-md rounded-[32px] border border-[var(--stroke)] bg-white/90 p-8 shadow-[var(--shadow)] backdrop-blur">
        <div className="mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--stroke)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--navy-dark)]">
            <span className="h-2 w-2 rounded-full bg-[var(--accent-yellow)]" />
            Acceso
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold text-[var(--navy-dark)]">
            Kanban Studio
          </h1>
          <p className="mt-2 text-sm leading-6 text-[var(--gray-text)]">
            Inicie sesion para gestionar su tablero y tareas de proyecto.
          </p>
        </div>

        {error && (
          <div
            role="alert"
            data-testid="login-error"
            className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs font-medium text-red-700"
          >
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy-dark)]"
            >
              Usuario
            </label>
            <input
              id="username"
              data-testid="input-username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="user o usuario"
              required
              className="mt-1 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-xs font-semibold uppercase tracking-wider text-[var(--navy-dark)]"
            >
              Contraseña
            </label>
            <input
              id="password"
              data-testid="input-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password o contraseña"
              required
              className="mt-1 w-full rounded-2xl border border-[var(--stroke)] bg-white px-4 py-3 text-sm font-medium text-[var(--navy-dark)] outline-none transition focus:border-[var(--primary-blue)]"
            />
          </div>

          <button
            type="submit"
            data-testid="btn-login"
            className="w-full rounded-full bg-[var(--secondary-purple)] py-3 text-sm font-semibold uppercase tracking-wide text-white transition hover:brightness-110"
          >
            Iniciar sesion
          </button>
        </form>

        <div className="mt-6 rounded-2xl border border-[var(--stroke)] bg-[var(--surface)] p-4 text-xs text-[var(--gray-text)]">
          <p className="font-semibold text-[var(--navy-dark)]">Credenciales de prueba:</p>
          <p className="mt-1">Usuario: <span className="font-mono text-[var(--primary-blue)]">user</span> | Clave: <span className="font-mono text-[var(--primary-blue)]">password</span></p>
          <p className="mt-0.5">Usuario: <span className="font-mono text-[var(--primary-blue)]">usuario</span> | Clave: <span className="font-mono text-[var(--primary-blue)]">contraseña</span></p>
        </div>
      </main>
    </div>
  );
};
