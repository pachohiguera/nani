"use client";

import { useCallback, useMemo, useState } from "react";
import { useTickingClock } from "@/hooks/use-ticking-clock";
import type { SandboxCategory } from "@/lib/sandbox/categories";
import type { SandboxEvent } from "@/types/sandbox";

const FLASH_DURATION_MS = 1000;

export function useSandboxLog() {
  // Toda la "base de datos" del sandbox vive acá, en memoria. Se pierde al
  // recargar la página — eso es intencional en este paso.
  const [events, setEvents] = useState<SandboxEvent[]>([]);

  // Categorías de duración con un evento abierto ahora mismo, indexadas por
  // categoryId para que el botón sepa si debe mostrarse "corriendo".
  const [openByCategory, setOpenByCategory] = useState<Record<string, SandboxEvent>>({});

  const [flashCategoryId, setFlashCategoryId] = useState<string | null>(null);

  const hasOpenEvents = Object.keys(openByCategory).length > 0;

  // Solo tickea (re-renderiza cada segundo) mientras haya al menos un
  // cronómetro corriendo; el resto del tiempo `now` queda quieto.
  const now = useTickingClock(hasOpenEvents);

  const handlePress = useCallback((category: SandboxCategory) => {
    const nowIso = new Date().toISOString();

    if (category.tipo === "instantaneo") {
      const event: SandboxEvent = {
        id: crypto.randomUUID(),
        categoryId: category.id,
        categoria: category.nombre,
        tipo: "instantaneo",
        started_at: nowIso,
        ended_at: null,
        duration_seconds: null,
      };
      setEvents((prev) => [event, ...prev]);

      setFlashCategoryId(category.id);
      setTimeout(() => setFlashCategoryId((current) => (current === category.id ? null : current)), FLASH_DURATION_MS);
      return;
    }

    const openEvent = openByCategory[category.id];

    if (!openEvent) {
      // Arrancar el cronómetro: crea el evento ya, con ended_at pendiente.
      const event: SandboxEvent = {
        id: crypto.randomUUID(),
        categoryId: category.id,
        categoria: category.nombre,
        tipo: "duracion",
        started_at: nowIso,
        ended_at: null,
        duration_seconds: null,
      };
      setEvents((prev) => [event, ...prev]);
      setOpenByCategory((prev) => ({ ...prev, [category.id]: event }));
      return;
    }

    // Detener el cronómetro: cierra el mismo evento por id.
    const durationSeconds = Math.round(
      (new Date(nowIso).getTime() - new Date(openEvent.started_at).getTime()) / 1000
    );
    const closedEvent: SandboxEvent = {
      ...openEvent,
      ended_at: nowIso,
      duration_seconds: durationSeconds,
    };

    setEvents((prev) => prev.map((e) => (e.id === closedEvent.id ? closedEvent : e)));
    setOpenByCategory((prev) => {
      const next = { ...prev };
      delete next[category.id];
      return next;
    });
  }, [openByCategory]);

  const recentEvents = useMemo(() => events.slice(0, 10), [events]);

  return {
    recentEvents,
    openByCategory,
    now,
    flashCategoryId,
    handlePress,
  };
}
