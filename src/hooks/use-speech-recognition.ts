"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseSpeechRecognitionOptions {
  lang?: string;
  onResult: (transcript: string) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  supported: boolean;
  listening: boolean;
  startOnce: () => void;
  startContinuous: () => void;
  stop: () => void;
}

function getConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null;
}

// Envuelve la Web Speech API con dos modos: tap-to-talk (una sola frase,
// `startOnce`) y manos libres (`startContinuous`, se reinicia solo si el
// navegador corta el reconocimiento por silencio, hasta que se llame `stop`).
export function useSpeechRecognition({
  lang = "es-MX",
  onResult,
  onError,
}: UseSpeechRecognitionOptions): UseSpeechRecognitionReturn {
  // false hasta que el efecto corre en el cliente: `window` no existe en el
  // servidor, así que el primer render del cliente debe coincidir con el
  // del servidor (false) o React tira un hydration mismatch. El valor real
  // llega un instante después de montar.
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const shouldContinueRef = useRef(false);
  const onResultRef = useRef(onResult);
  const onErrorRef = useRef(onError);

  useEffect(() => {
    onResultRef.current = onResult;
    onErrorRef.current = onError;
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- valor solo disponible en cliente, ver comentario arriba
    setSupported(getConstructor() !== null);
  }, []);

  const getRecognition = useCallback(() => {
    if (recognitionRef.current) return recognitionRef.current;

    const Ctor = getConstructor();
    if (!Ctor) return null;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results.item(i);
        if (result.isFinal) {
          onResultRef.current(result[0].transcript);
        }
      }
    };

    recognition.onerror = (event) => {
      onErrorRef.current?.(event.error);
      if (event.error === "not-allowed" || event.error === "audio-capture") {
        shouldContinueRef.current = false;
        setListening(false);
      }
    };

    recognition.onend = () => {
      if (shouldContinueRef.current) {
        setTimeout(() => {
          if (shouldContinueRef.current) {
            try {
              recognition.start();
            } catch {
              // ya estaba corriendo; se ignora
            }
          }
        }, 250);
        return;
      }
      setListening(false);
    };

    recognitionRef.current = recognition;
    return recognition;
  }, [lang]);

  const startOnce = useCallback(() => {
    const recognition = getRecognition();
    if (!recognition) return;

    shouldContinueRef.current = false;
    recognition.continuous = false;
    try {
      recognition.start();
      setListening(true);
    } catch {
      // ya estaba corriendo
    }
  }, [getRecognition]);

  const startContinuous = useCallback(() => {
    const recognition = getRecognition();
    if (!recognition) return;

    shouldContinueRef.current = true;
    recognition.continuous = true;
    try {
      recognition.start();
      setListening(true);
    } catch {
      // ya estaba corriendo
    }
  }, [getRecognition]);

  const stop = useCallback(() => {
    shouldContinueRef.current = false;
    recognitionRef.current?.stop();
    setListening(false);
  }, []);

  useEffect(() => {
    return () => {
      shouldContinueRef.current = false;
      recognitionRef.current?.stop();
    };
  }, []);

  return { supported, listening, startOnce, startContinuous, stop };
}
