"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { recordCategoryEvent } from "@/lib/events/actions";
import { enrichEvent } from "@/lib/events/enrich";
import { startOfLocalDay } from "@/lib/time";
import { useTickingClock } from "@/hooks/use-ticking-clock";
import { CategoryGrid } from "@/components/today/category-grid";
import { SummaryCards } from "@/components/today/summary-cards";
import { EventTimeline } from "@/components/today/event-timeline";
import { Toast } from "@/components/today/toast";
import type { BabyEvent, EventCategory } from "@/types/database";
import type { EventWithRelations } from "@/types/today";

interface TodayViewProps {
  babyId: string;
  caregiverId: string;
  categories: EventCategory[];
  initialEvents: BabyEvent[];
  caregiverNamesById: Record<string, string>;
}

export function TodayView({
  babyId,
  caregiverId,
  categories,
  initialEvents,
  caregiverNamesById,
}: TodayViewProps) {
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

  async function handlePress(category: EventCategory) {
    const openEvent = openEventsByCategory.get(category.id);
    setPendingCategoryId(category.id);

    const { data, error } = await recordCategoryEvent({
      supabase,
      babyId,
      caregiverId,
      category,
      origen: "boton",
      openEventId: openEvent?.id ?? null,
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

    if (category.tipo === "instantaneo") {
      showToast(`${category.nombre} registrado`);
    } else if (openEvent) {
      showToast(`${category.nombre} detenido`);
    } else {
      showToast(`${category.nombre} iniciado`);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Toast message={toastMessage} />

      <SummaryCards events={todaysEvents} now={now} />

      <CategoryGrid
        categories={categories}
        openEventsByCategory={openEventsByCategory}
        now={now}
        flashCategoryId={flashCategoryId}
        pendingCategoryId={pendingCategoryId}
        onPress={handlePress}
      />

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Hoy
        </h2>
        <EventTimeline events={todaysEvents} />
      </div>
    </div>
  );
}
