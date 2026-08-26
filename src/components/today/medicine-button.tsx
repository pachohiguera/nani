"use client";

import { useState } from "react";
import { iconFor } from "@/lib/categories";
import type { EventCategory } from "@/types/database";

interface MedicineButtonProps {
  category: EventCategory;
  flash: boolean;
  disabled?: boolean;
  onSave: (nombre: string) => void;
}

export function MedicineButton({ category, flash, disabled, onSave }: MedicineButtonProps) {
  const [open, setOpen] = useState(false);
  const [nombre, setNombre] = useState("");

  function handleSave() {
    const trimmed = nombre.trim();
    if (!trimmed) return;
    onSave(trimmed);
    setNombre("");
    setOpen(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={disabled}
        style={{
          borderColor: category.color,
          backgroundColor: flash ? category.color : "transparent",
        }}
        className={`relative flex min-h-[104px] flex-col items-center justify-center gap-1 rounded-3xl border-2 px-3 py-4 text-center transition-transform active:scale-95 disabled:opacity-50 ${
          flash ? "scale-105" : ""
        }`}
      >
        <span className="text-3xl">{iconFor(category.icono)}</span>
        <span className={`text-sm font-semibold ${flash ? "text-white" : "text-zinc-100"}`}>
          {category.nombre}
        </span>
        <span className={`text-xs ${flash ? "text-white/80" : "text-zinc-500"}`}>
          {flash ? "Guardado ✓" : "Toca para registrar"}
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Registrar medicina"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-3xl bg-zinc-900 p-6 sm:rounded-3xl"
          >
            <h2 className="mb-4 text-lg font-bold text-white">💊 ¿Qué medicina?</h2>
            <input
              type="text"
              autoFocus
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSave();
              }}
              placeholder="Ej: Paracetamol"
              className="mb-4 h-12 w-full rounded-2xl border border-zinc-700 bg-zinc-950 px-4 text-white placeholder:text-zinc-600"
            />
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleSave}
                disabled={!nombre.trim()}
                className="flex-1 rounded-2xl bg-indigo-500 py-3 font-semibold text-white active:bg-indigo-600 disabled:opacity-50"
              >
                Guardar
              </button>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex-1 rounded-2xl bg-zinc-800 py-3 font-semibold text-zinc-300 active:bg-zinc-700"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
