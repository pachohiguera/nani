"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } =
        mode === "signin"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, password, name });

      if (error) {
        setError(
          mode === "signin"
            ? "Correo o contraseña incorrectos."
            : error.message ?? "No se pudo crear la cuenta."
        );
        return;
      }

      router.push("/");
      router.refresh();
    } catch (e) {
      setError(
        e instanceof Error ? `Error inesperado: ${e.message}` : "Error inesperado, intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-950 px-6">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-center text-4xl font-bold tracking-tight text-white">
          Nani
        </h1>
        <p className="mb-8 text-center text-zinc-400">
          {mode === "signin"
            ? "Inicia sesión para seguir a tu bebé"
            : "Crea tu cuenta de caregiver"}
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {mode === "signup" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-sm font-medium text-zinc-300">
                Tu nombre
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="h-14 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-lg text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
                placeholder="Papá"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <label htmlFor="email" className="text-sm font-medium text-zinc-300">
              Correo electrónico
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-14 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-lg text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              placeholder="papa@ejemplo.com"
            />
          </div>

          <div className="flex flex-col gap-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-zinc-300"
            >
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-14 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-lg text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 h-14 rounded-2xl bg-indigo-500 text-lg font-semibold text-white transition-colors active:bg-indigo-600 disabled:opacity-50"
          >
            {loading
              ? "Un momento..."
              : mode === "signin"
              ? "Entrar"
              : "Crear cuenta"}
          </button>

          <button
            type="button"
            onClick={() => {
              setError(null);
              setMode(mode === "signin" ? "signup" : "signin");
            }}
            className="text-sm text-zinc-500 underline-offset-4 hover:underline"
          >
            {mode === "signin"
              ? "¿No tienes cuenta? Créala"
              : "¿Ya tienes cuenta? Inicia sesión"}
          </button>
        </form>
      </div>
    </div>
  );
}
