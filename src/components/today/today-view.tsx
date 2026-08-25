"use client";

import { useEventLog } from "@/hooks/use-event-log";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { CategoryGrid } from "@/components/today/category-grid";
import { CryingGuide } from "@/components/today/crying-guide";
import { SummaryCards } from "@/components/today/summary-cards";
import { EventTimeline } from "@/components/today/event-timeline";
import { Toast } from "@/components/today/toast";
import { VoiceControls } from "@/components/voice/voice-controls";
import type { BabyEvent, EventCategory } from "@/types/database";

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
  const {
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
    switchSide,
  } = useEventLog({
    babyId,
    caregiverId,
    categories,
    initialEvents,
    caregiverNamesById,
  });

  // La pantalla no debe apagarse mientras haya un cronómetro corriendo
  // (el modo manos libres pide su propio wake lock por separado).
  useWakeLock(hasOpenEvents);

  return (
    <div className="flex flex-col gap-6">
      <Toast message={toastMessage} />

      <SummaryCards events={todaysEvents} now={now} />

      <CryingGuide />

      <CategoryGrid
        categories={categories}
        openEventsByCategory={openEventsByCategory}
        now={now}
        flashCategoryId={flashCategoryId}
        pendingCategoryId={pendingCategoryId}
        onPress={recordButtonPress}
        onTogglePause={togglePause}
        onSwitchSide={switchSide}
      />

      <VoiceControls recordVoiceTranscript={recordVoiceTranscript} />

      <div>
        <h2 className="mb-2 text-sm font-semibold uppercase tracking-wide text-zinc-500">
          Hoy
        </h2>
        <EventTimeline events={todaysEvents} onEditDuration={editSessionDuration} />
      </div>
    </div>
  );
}
