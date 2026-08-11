"use client";

import { useEffect } from "react";

// Mantiene la pantalla encendida mientras `active` es true (cronómetro
// corriendo o modo manos libres activo). Se libera solo al desactivarse
// o desmontar. Si el navegador no soporta la API, no hace nada.
export function useWakeLock(active: boolean) {
  useEffect(() => {
    if (!active || typeof navigator === "undefined" || !("wakeLock" in navigator)) {
      return;
    }

    let sentinel: WakeLockSentinel | null = null;
    let cancelled = false;

    async function acquire() {
      try {
        sentinel = await navigator.wakeLock.request("screen");
      } catch {
        // Puede fallar si el documento no está visible/enfocado; no es fatal.
      }
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible" && !sentinel && !cancelled) {
        acquire();
      }
    }

    acquire();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      sentinel?.release().catch(() => {});
    };
  }, [active]);
}
