"use client";

interface MicButtonProps {
  listening: boolean;
  disabled?: boolean;
  onPress: () => void;
}

export function MicButton({ listening, disabled, onPress }: MicButtonProps) {
  return (
    <button
      type="button"
      onClick={onPress}
      disabled={disabled}
      aria-label={listening ? "Escuchando" : "Hablar para registrar"}
      className={`flex h-16 w-16 items-center justify-center rounded-full text-2xl shadow-lg transition-transform active:scale-95 disabled:opacity-50 ${
        listening
          ? "animate-pulse bg-red-500 text-white"
          : "bg-indigo-500 text-white"
      }`}
    >
      {listening ? "🎙️" : "🎤"}
    </button>
  );
}
