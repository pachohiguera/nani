"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createBabyProfile } from "@/lib/onboarding/actions";

export function BabySetupForm() {
  const router = useRouter();
  const [nombre, setNombre] = useState("");
  const [fechaNacimiento, setFechaNacimiento] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { error } = await createBabyProfile(nombre, fechaNacimiento);
      if (error) {
        setError(error.message);
        return;
      }
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error inesperado, intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h2 className="mb-1 text-center text-2xl font-bold text-white">
        ¡Bienvenido a Nani!
      </h2>
      <p className="mb-8 text-center text-zinc-400">
        Creá el perfil de tu bebé para empezar a registrar
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label htmlFor="nombre" className="text-sm font-medium text-zinc-300">
            Nombre del bebé
          </label>
          <input
            id="nombre"
            type="text"
            required
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="h-14 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-lg text-white placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
            placeholder="Ej: Sofía"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="fecha" className="text-sm font-medium text-zinc-300">
            Fecha de nacimiento
          </label>
          <input
            id="fecha"
            type="date"
            required
            value={fechaNacimiento}
            onChange={(e) => setFechaNacimiento(e.target.value)}
            className="h-14 rounded-2xl border border-zinc-800 bg-zinc-900 px-4 text-lg text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        {error && (
          <p className="rounded-xl bg-red-950 px-4 py-3 text-sm text-red-300">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 h-14 rounded-2xl bg-indigo-500 text-lg font-semibold text-white transition-colors active:bg-indigo-600 disabled:opacity-50"
        >
          {loading ? "Creando..." : "Empezar a registrar"}
        </button>
      </form>
    </div>
  );
}
