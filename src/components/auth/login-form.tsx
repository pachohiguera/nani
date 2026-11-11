"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";
import { joinBabyWithCode } from "@/lib/invites/actions";

const ROLES = ["Mamá", "Papá"] as const;
type Role = (typeof ROLES)[number];

interface LoginFormProps {
  initialInviteCode: string;
}

export function LoginForm({ initialInviteCode }: LoginFormProps) {
  const router = useRouter();
  // Si llegó por un link de invitación (?invite=CODIGO), asume que viene a
  // crear su cuenta, no a iniciar sesión.
  const [mode, setMode] = useState<"signin" | "signup">(
    initialInviteCode ? "signup" : "signin"
  );
  const [role, setRole] = useState<Role>("Mamá");
  const [inviteCode, setInviteCode] = useState(initialInviteCode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await authClient.signIn.email({ email, password });
        if (error) {
          setError("Correo o contraseña incorrectos.");
          return;
        }
        router.push("/");
        router.refresh();
        return;
      }

      const { error: signUpError } = await authClient.signUp.email({
        email,
        password,
        name: role,
      });
      if (signUpError) {
        setError(signUpError.message ?? "No se pudo crear la cuenta.");
        return;
      }

      if (inviteCode.trim()) {
        const { error: joinError } = await joinBabyWithCode(inviteCode, role);
        if (joinError) {
          setError(`Cuenta creada, pero ${joinError.message.toLowerCase()}`);
          return;
        }
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
              <span className="text-sm font-medium text-zinc-300">¿Mamá o papá?</span>
              <div className="flex gap-2">
                {ROLES.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setRole(option)}
                    className={`h-14 flex-1 rounded-2xl border text-lg font-medium transition-colors ${
                      role === option
                        ? "border-indigo-500 bg-indigo-500/10 text-white"
                        : "border-zinc-800 bg-zinc-900 text-zinc-400"
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
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

          {mode === "signup" && (
            <div className="flex flex-col gap-2">
              <label htmlFor="invite" className="text-sm font-medium text-zinc-300">
                Código de invitación (opcional)
              </label>
              <input
                id="invite"
                type="text"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                className="h-14 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-lg uppercase text-white placeholder:text-zinc-600 placeholder:normal-case focus:border-indigo-500 focus:outline-none"
                placeholder="Si alguien ya te invitó a su bebé"
              />
            </div>
          )}

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
