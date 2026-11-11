"use client";

import { useState } from "react";

interface InviteCodeCardProps {
  code: string;
}

export function InviteCodeCard({ code }: InviteCodeCardProps) {
  const [copied, setCopied] = useState(false);

  async function copyLink() {
    const link = `${window.location.origin}/login?invite=${code}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex flex-col items-center gap-6 rounded-2xl bg-zinc-900 px-6 py-8 text-center">
      <p className="text-sm text-zinc-400">
        Comparte este link con la otra mamá/papá — al abrirlo, su correo y
        contraseña quedan vinculados al mismo bebé.
      </p>
      <p className="text-3xl font-bold tracking-[0.3em] text-white">{code}</p>
      <button
        type="button"
        onClick={copyLink}
        className="h-14 w-full rounded-2xl bg-indigo-500 text-lg font-semibold text-white transition-colors active:bg-indigo-600"
      >
        {copied ? "¡Copiado!" : "Copiar link para compartir"}
      </button>
    </div>
  );
}
