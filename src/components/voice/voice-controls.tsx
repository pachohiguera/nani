"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";
import { useWakeLock } from "@/hooks/use-wake-lock";
import { extractCommandAfterWakeWord } from "@/lib/voice/commands";
import { playBeep } from "@/lib/voice/beep";
import { MicButton } from "@/components/voice/mic-button";
import { HandsFreeToggle } from "@/components/voice/hands-free-toggle";

interface VoiceControlsProps {
  recordVoiceTranscript: (
    transcript: string
  ) => Promise<{ recognized: boolean }>;
}

// 18 min: dentro del rango de 15-20 min pedido para apagar por inactividad.
const INACTIVITY_MS = 18 * 60 * 1000;
const WARNING_BEFORE_MS = 60 * 1000;

export function VoiceControls({ recordVoiceTranscript }: VoiceControlsProps) {
  const [handsFree, setHandsFree] = useState(false);
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const [micError, setMicError] = useState<string | null>(null);
  const modeRef = useRef<"once" | "continuous">("once");
  const warnTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const micErrorTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Solo cancela los timers pendientes, sin tocar estado: es lo único que
  // puede llamarse de forma síncrona dentro de un efecto sin disparar
  // renders en cascada.
  const clearTimers = useCallback(() => {
    if (warnTimer.current) clearTimeout(warnTimer.current);
    if (offTimer.current) clearTimeout(offTimer.current);
  }, []);

  const armTimers = useCallback(() => {
    clearTimers();
    warnTimer.current = setTimeout(
      () => setShowInactivityWarning(true),
      INACTIVITY_MS - WARNING_BEFORE_MS
    );
    offTimer.current = setTimeout(() => setHandsFree(false), INACTIVITY_MS);
  }, [clearTimers]);

  // Reprograma los timers Y limpia el aviso de inactividad; se usa desde el
  // handler de resultados de voz (no desde el efecto) para no violar la
  // regla de no hacer setState síncrono dentro de un efecto.
  const scheduleInactivityTimers = useCallback(() => {
    armTimers();
    setShowInactivityWarning(false);
  }, [armTimers]);

  const handleResult = useCallback(
    async (transcript: string) => {
      let command = transcript;
      if (modeRef.current === "continuous") {
        const afterWake = extractCommandAfterWakeWord(transcript);
        if (afterWake === null) return; // no dijo "Hey Nani": se ignora
        command = afterWake;
      }

      const { recognized } = await recordVoiceTranscript(command);
      playBeep(recognized ? "success" : "error");

      if (modeRef.current === "continuous") {
        scheduleInactivityTimers();
      }
    },
    [recordVoiceTranscript, scheduleInactivityTimers]
  );

  const handleError = useCallback((error: string) => {
    if (error === "not-allowed" || error === "audio-capture") {
      setMicError("No hay permiso de micrófono");
    } else if (error === "no-speech") {
      return; // normal en modo continuo, no es un error real
    } else {
      setMicError("Error de reconocimiento de voz");
    }
    if (micErrorTimer.current) clearTimeout(micErrorTimer.current);
    micErrorTimer.current = setTimeout(() => setMicError(null), 3000);
  }, []);

  const speech = useSpeechRecognition({ onResult: handleResult, onError: handleError });
  const { startContinuous, stop } = speech;

  useWakeLock(handsFree);

  useEffect(() => {
    if (handsFree) {
      modeRef.current = "continuous";
      startContinuous();
      armTimers();
    } else {
      stop();
      clearTimers();
    }
  }, [handsFree, startContinuous, stop, armTimers, clearTimers]);

  function handleMicPress() {
    if (handsFree) return; // manos libres ya está escuchando
    modeRef.current = "once";
    speech.startOnce();
  }

  if (!speech.supported) {
    return (
      <p className="text-right text-xs text-zinc-600">
        El reconocimiento de voz no está disponible en este navegador.
      </p>
    );
  }

  return (
    <div className="flex flex-col items-end gap-2">
      {handsFree && showInactivityWarning && (
        <p className="rounded-full bg-amber-900 px-3 py-1 text-xs text-amber-200">
          Manos libres se apagará en 1 min por inactividad
        </p>
      )}
      {micError && (
        <p className="rounded-full bg-red-950 px-3 py-1 text-xs text-red-300">
          {micError}
        </p>
      )}
      <div className="flex items-center gap-3">
        <HandsFreeToggle enabled={handsFree} onChange={setHandsFree} />
        {handsFree ? (
          <span className="flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-indigo-500/20 text-2xl">
            🎙️
          </span>
        ) : (
          <MicButton listening={speech.listening} onPress={handleMicPress} />
        )}
      </div>
    </div>
  );
}
