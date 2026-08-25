"use client";

import { useState } from "react";

const SOUNDS: { sonido: string; significado: string }[] = [
  { sonido: "Neh", significado: "Tengo hambre" },
  { sonido: "Owh", significado: "Tengo sueño" },
  { sonido: "Heh", significado: "Incomodidad (pañal mojado, temperatura, molestia general)" },
  { sonido: "Eairh", significado: "Gases / ganas de evacuar" },
  { sonido: "Eh", significado: "Necesita eructar" },
];

export function CryingGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-900 py-3 text-sm font-semibold text-zinc-200 transition-transform active:scale-95"
      >
        😢 Guía de llanto
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 sm:items-center"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Guía de llanto"
            onClick={(e) => e.stopPropagation()}
            className="max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-t-3xl bg-zinc-900 p-6 sm:rounded-3xl"
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">Guía de llanto</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Cerrar"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-800 text-zinc-400 active:bg-zinc-700"
              >
                ✕
              </button>
            </div>

            <p className="mb-4 text-xs text-zinc-500">
              Según el sonido que hace el llanto, esto es lo que suele significar:
            </p>

            <ul className="flex flex-col gap-2">
              {SOUNDS.map(({ sonido, significado }) => (
                <li
                  key={sonido}
                  className="flex items-start gap-3 rounded-2xl bg-zinc-950 px-4 py-3"
                >
                  <span className="shrink-0 rounded-lg bg-indigo-500/20 px-2 py-1 text-sm font-bold text-indigo-300">
                    {sonido}
                  </span>
                  <span className="text-sm text-zinc-300">{significado}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}
