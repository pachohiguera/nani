"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  deleteSession,
  getRecentEvents,
  pauseEvent,
  recordCategoryEvent,
  resumeEvent,
  switchBreastSide,
  updateSessionDuration,
} from "@/lib/events/actions";
import { oppositeBreastIcono } from "@/lib/categories";
import { enrichEvent } from "@/lib/events/enrich";
import { matchVoiceCommand } from "@/lib/voice/commands";
import { startOfLocalDay } from "@/lib/time";
import { useTickingClock } from "@/hooks/use-ticking-clock";
import type { BabyEvent, EventCategory, EventOrigin } from "@/types/database";
import type { EventWithRelations } from "@/types/today";

const POLL_INTERVAL_MS = 20_000;

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
  // El reloj solo necesita tickear si hay algo corriendo de verdad — un
  // cronómetro en pausa no cambia de un segundo a otro, así que no hace
  // falta re-renderizar cada segundo solo por eso (batería).
  const hasActiveEvents = useMemo(
    () => [...openEventsByCategory.values()].some((event) => event.paused_at === null),
    [openEventsByCategory]
  );
  const now = useTickingClock(hasActiveEvents);

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

  const removeEvents = useCallback((ids: string[]) => {
    setEvents((prev) => prev.filter((e) => !ids.includes(e.id)));
  }, []);

  // Nota de aprendizaje: con Supabase, un canal de Realtime (postgres_changes)
  // mantenía sincronizados a los dos caregivers en vivo. Neon no tiene un
  // equivalente integrado, así que en su lugar hacemos polling: cada 20s (y
  // al volver a la pestaña) se vuelve a pedir la lista completa y se
  // reemplaza el estado local. No es instantáneo como Realtime, pero para
  // dos personas registrando eventos de un bebé es más que suficiente, y no
  // agrega ninguna infraestructura nueva.
  useEffect(() => {
    let cancelled = false;

    async function sync() {
      const rows = await getRecentEvents(babyId);
      if (cancelled) return;
      setEvents(rows.map((row) => enrichEvent(row, categories, caregiverNamesById)));
    }

    const intervalId = setInterval(() => {
      if (document.visibilityState === "visible") sync();
    }, POLL_INTERVAL_MS);

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") sync();
    }
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [babyId, categories, caregiverNamesById]);

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
    [babyId, caregiverId, showToast, upsertEvent]
  );

  // Cierra el evento del seno actual y abre el del otro, enlazados como una
  // sola sesión de toma. Se usa tanto desde el botón explícito "Cambiar de
  // lado" como cuando alguien toca el otro seno directamente (ver abajo).
  const switchSide = useCallback(
    async (fromCategory: EventCategory, toCategory: EventCategory) => {
      const openEvent = openEventsByCategory.get(fromCategory.id);
      if (!openEvent) return;

      setPendingCategoryId(fromCategory.id);
      const { data, error } = await switchBreastSide({
        fromEventId: openEvent.id,
        toCategoryId: toCategory.id,
        caregiverId,
        origen: "boton",
      });
      setPendingCategoryId(null);

      if (error || !data) {
        showToast("No se pudo cambiar de lado, intenta de nuevo");
        return;
      }

      upsertEvent(data.closed);
      upsertEvent(data.opened);
      showToast(`Cambiado a ${toCategory.nombre}`);
    },
    [caregiverId, openEventsByCategory, showToast, upsertEvent]
  );

  // Medicina y Vómito piden un dato extra antes de guardar (ver
  // MedicineButton/VomitButton), así que no pasan por recordButtonPress/
  // mutate normal — ese dato queda en notas.
  const recordWithNote = useCallback(
    async (category: EventCategory, nota: string) => {
      setPendingCategoryId(category.id);
      const { data, error } = await recordCategoryEvent({
        babyId,
        caregiverId,
        category,
        origen: "boton",
        notas: nota,
      });
      setPendingCategoryId(null);

      if (error || !data) {
        showToast("No se pudo registrar, intenta de nuevo");
        return;
      }

      upsertEvent(data);
      setFlashCategoryId(category.id);
      if (flashTimer.current) clearTimeout(flashTimer.current);
      flashTimer.current = setTimeout(() => setFlashCategoryId(null), 400);
      showToast(`${category.nombre} registrado: ${nota}`);
    },
    [babyId, caregiverId, showToast, upsertEvent]
  );

  const recordMedicine = useCallback(
    (category: EventCategory, nombre: string) => recordWithNote(category, nombre),
    [recordWithNote]
  );

  const recordVomit = useCallback(
    (category: EventCategory, severity: string) => recordWithNote(category, severity),
    [recordWithNote]
  );

  const recordButtonPress = useCallback(
    async (category: EventCategory) => {
      const openEvent = openEventsByCategory.get(category.id);

      // Si esta categoría es un seno y el OTRO seno está corriendo, tocar
      // este botón "para iniciar" en realidad cambia de lado, en vez de
      // dejar dos tomas abiertas al mismo tiempo por accidente.
      if (!openEvent && category.tipo === "duracion") {
        const oppositeIcono = oppositeBreastIcono(category.icono);
        const siblingCategory = oppositeIcono
          ? categories.find((c) => c.icono === oppositeIcono)
          : undefined;
        const siblingOpenEvent = siblingCategory
          ? openEventsByCategory.get(siblingCategory.id)
          : undefined;

        if (siblingCategory && siblingOpenEvent) {
          await switchSide(siblingCategory, category);
          return;
        }
      }

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
    [categories, mutate, openEventsByCategory, showToast, switchSide]
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

  // Pausar/reanudar un cronómetro de seno o sueño sin cerrarlo. No usa
  // `mutate` porque no crea un evento nuevo ni dispara el flash/toast de
  // "registrado" — es un ajuste silencioso del mismo evento abierto.
  const togglePause = useCallback(
    async (category: EventCategory) => {
      const openEvent = openEventsByCategory.get(category.id);
      if (!openEvent) return;

      const isPaused = openEvent.paused_at !== null;
      const { data, error } = isPaused
        ? await resumeEvent(openEvent.id)
        : await pauseEvent(openEvent.id);

      if (error || !data) {
        showToast("No se pudo actualizar, intenta de nuevo");
        return;
      }

      upsertEvent(data);
    },
    [openEventsByCategory, showToast, upsertEvent]
  );

  // Edición manual desde el historial (senos y sueño): la persona escribe
  // los minutos totales que quiere que quede la sesión completa (aunque haya
  // tenido cambio de lado) y, opcionalmente, corrige la hora en que empezó
  // — por si se olvidó registrarla a tiempo. sessionKey es el session_id
  // compartido o, para un evento suelto, su propio id.
  const editSessionDuration = useCallback(
    async (sessionKey: string, minutes: number, startedAt?: string) => {
      const { data, error } = await updateSessionDuration(sessionKey, minutes, startedAt);
      if (error || !data) {
        showToast("No se pudo actualizar, intenta de nuevo");
        return;
      }
      data.forEach(upsertEvent);
      showToast("Evento actualizado");
    },
    [showToast, upsertEvent]
  );

  // Borrar un registro por error, desde el historial (⚙️). Aplica a
  // instantáneos (pañales, medicina) y a senos/sueño ya cerrados.
  const deleteEvent = useCallback(
    async (sessionKey: string) => {
      const { data, error } = await deleteSession(sessionKey);
      if (error || !data) {
        showToast("No se pudo eliminar, intenta de nuevo");
        return;
      }
      removeEvents(data.deletedIds);
      showToast("Evento eliminado");
    },
    [showToast, removeEvents]
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
    togglePause,
    editSessionDuration,
    deleteEvent,
    switchSide,
    recordMedicine,
    recordVomit,
  };
}
