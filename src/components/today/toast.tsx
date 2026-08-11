"use client";

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-50 flex justify-center px-4">
      <div className="rounded-full bg-zinc-800 px-5 py-2.5 text-sm font-medium text-white shadow-lg">
        {message}
      </div>
    </div>
  );
}
