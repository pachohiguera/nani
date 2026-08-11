"use client";

interface HandsFreeToggleProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
}

export function HandsFreeToggle({ enabled, onChange }: HandsFreeToggleProps) {
  return (
    <label className="flex items-center gap-2 text-sm text-zinc-300">
      <span>Manos libres</span>
      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={`relative h-7 w-12 rounded-full transition-colors ${
          enabled ? "bg-indigo-500" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform ${
            enabled ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </label>
  );
}
