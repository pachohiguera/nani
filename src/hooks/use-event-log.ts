"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordCategoryEvent } from "@/lib/events/actions";
import { enrichEvent } from "@/lib/events/enrich";
import { matchVoiceCommand } from "@/lib/voice/commands";
import { startOfLocalDay } from "@/lib/time";
import { useTickingClock } from "@/hooks/use-ticking-clock";
import type { BabyEvent, EventCategory, EventOrigin } from "@/types/database";
import type { EventWithRelations } from "@/types/today";

interface UseEventLogParams {
  babyId: string;
  caregiverId: string;
  categories: EventCategory[];
  initialEvents: BabyEvent[];
  caregiverNamesById: Record<string, string>;
}

export function useEventLog({
  babyId,
  caregiverId,
  categories,
  initialEvents,
  caregiverNamesById,
}: UseEventLogParams) {
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState<EventWithRelations[]>(() =>
    initialEvents.map((row) => enrichEvent(row, categories, caregiverNamesById))
  );
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(
    null
  );
  const [flashCategoryId, setFlashCategoryId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const openEventsByCategory = useMemo(() => {
    const map = new Map<string, EventWithRelations>();
    for (const event of events) {
      if (event.ended_at === null && event.event_categories?.tipo === "duracion") {
        map.set(event.category_id, event);
      }
    }
    return map;
  }, [events]);

  const hasOpenEvents = openEventsByCategory.size > 0;
  const now = useTickingClock(hasOpenEvents);

  const todaysEvents = useMemo(() => {
    const startOfToday = startOfLocalDay();
    return events
      .filter((event) => new Date(event.started_at) >= startOfToday)
      .sort(
        (a, b) =>
          new Date(b.started_at).getTime() - new Date(a.started_at).getTime()
      );
  }, [events]);

  const showToast = useCallback((message: string) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToastMessage(message);
    toastTimer.current = setTimeout(() => setToastMessage(null), 2200);
  }, []);

  const upsertEvent = useCallback(
    (row: BabyEvent) => {
      setEvents((prev) => {
        const enriched = enrichEvent(row, categories, caregiverNamesById);
        const idx = prev.findIndex((e) => e.id === row.id);
        if (idx === -1) return [enriched, ...prev];
        const next = [...prev];
        next[idx] = enriched;
        return next;
      });
    },
    [categories, caregiverNamesById]
  );

  useEffect(() => {
    const channel = supabase
      .channel(`events-${babyId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "events",
          filter: `baby_id=eq.${babyId}`,
        },
        (payload) => {
          if (payload.eventType === "DELETE") {
            const oldId = (payload.old as Partial<BabyEvent>).id;
            if (oldId) {
              setEvents((prev) => prev.filter((e) => e.id !== oldId));
            }
            return;
          }
          upsertEvent(payload.new as BabyEvent);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, babyId, upsertEvent]);

  // Mutación compartida: crea/cierra un evento y refleja el resultado en el
  // estado local. Botón y voz llaman esto con distinto texto de feedback.
  const mutate = useCallback(
    async (
      category: EventCategory,
      openEventId: string | null,
      origen: EventOrigin
    ) => {
      setPendingCategoryId(category.id);
      const { data, error } = await recordCategoryEvent({
        supabase,
        babyId,
        caregiverId,
        category,
        origen,
        openEventId,
      });
      setPendingCategoryId(null);

      if (error || !data) {
        showToast("No se pudo registrar, intenta de nuevo");
        return null;
      }

      upsertEvent(data);
      setFlashCategoryId(category.id);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlashCategoryId(null), 400);

      return data;
    },
    [supabase, babyId, caregiverId, showToast, upsertEvent]
  );

  const recordButtonPress = useCallback(
    async (category: EventCategory) => {
      const openEvent = openEventsByCategory.get(category.id);
      const result = await mutate(category, openEvent?.id ?? null, "boton");
      if (!result) return;

      if (category.tipo === "instantaneo") {
        showToast(`${category.nombre} registrado`);
      } else if (openEvent) {
        showToast(`${category.nombre} detenido`);
      } else {
        showToast(`${category.nombre} iniciado`);
      }
    },
    [mutate, openEventsByCategory, showToast]
  );

  // Misma tabla de comandos para tap-to-talk y manos libres. Devuelve si se
  // reconoció algo, para que la UI de voz pueda dar feedback sonoro.
  const recordVoiceTranscript = useCallback(
    async (transcript: string): Promise<{ recognized: boolean }> => {
      const command = matchVoiceCommand(transcript, categories);

      switch (command.kind) {
        case "instant": {
          const result = await mutate(command.category, null, "voz");
          if (result) showToast(`${command.category.nombre} registrado`);
          return { recognized: true };
        }
        case "start-duration": {
          const openEvent = openEventsByCategory.get(command.category.id);
          if (openEvent) {
            showToast(`Ya hay un cronómetro de ${command.category.nombre} corriendo`);
            return { recognized: true };
          }
          const result = await mutate(command.category, null, "voz");
          if (result) showToast(`${command.category.nombre} iniciado`);
          return { recognized: true };
        }
        case "stop-category": {
          const openEvent = openEventsByCategory.get(command.category.id);
          if (!openEvent) {
            showToast(`No hay ${command.category.nombre} en curso`);
            return { recognized: true };
          }
          const result = await mutate(command.category, openEvent.id, "voz");
          if (result) showToast(`${command.category.nombre} detenido`);
          return { recognized: true };
        }
        case "stop-latest": {
          const openEvents = [...openEventsByCategory.values()];
          if (openEvents.length === 0) {
            showToast("No hay ningún cronómetro corriendo");
            return { recognized: true };
          }
          const latest = openEvents.reduce((a, b) =>
            new Date(a.started_at) > new Date(b.started_at) ? a : b
          );
          const category = categories.find((c) => c.id === latest.category_id);
          if (!category) return { recognized: true };
          const result = await mutate(category, latest.id, "voz");
          if (result) showToast(`${category.nombre} detenido`);
          return { recognized: true };
        }
        case "none":
        default:
          showToast("No entendí, intenta de nuevo o usa un botón");
          return { recognized: false };
      }
    },
    [categories, mutate, openEventsByCategory, showToast]
  );

  return {
    events,
    todaysEvents,
    openEventsByCategory,
    hasOpenEvents,
    now,
    toastMessage,
    flashCategoryId,
    pendingCategoryId,
    recordButtonPress,
    recordVoiceTranscript,
  };
}
