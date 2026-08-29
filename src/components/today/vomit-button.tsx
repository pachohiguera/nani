"use client";

import { useState } from "react";
import { iconFor, VOMIT_SEVERITIES } from "@/lib/categories";
import type { EventCategory } from "@/types/database";

interface VomitButtonProps {
  category: EventCategory;
  flash: boolean;
  disabled?: boolean;
  onSave: (severity: string) => void;
}

export function VomitButton({ category, flash, disabled, onSave }: VomitButtonProps) {
  const [open, setOpen] = useState(false);

  function handleSave(severity: string) {
    onSave(severity);
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
            aria-label="Registrar vómito"
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-t-3xl bg-zinc-900 p-6 sm:rounded-3xl"
          >
            <h2 className="mb-4 text-lg font-bold text-white">🤮 ¿Cuánto?</h2>
            <div className="flex flex-col gap-3">
              {VOMIT_SEVERITIES.map((severity) => (
                <button
                  key={severity}
                  type="button"
                  onClick={() => handleSave(severity)}
                  className="rounded-2xl bg-zinc-800 py-4 text-lg font-semibold text-white active:bg-zinc-700"
                >
                  {severity}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-2xl py-2 text-sm text-zinc-500"
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
