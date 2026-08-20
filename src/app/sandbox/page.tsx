import { SandboxView } from "@/components/sandbox/sandbox-view";

export default function SandboxPage() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-950 text-white">
      <header className="px-6 py-5">
        <p className="text-sm text-zinc-400">Nani · sandbox</p>
        <h1 className="text-2xl font-bold">Registrar evento</h1>
        <p className="mt-1 text-xs text-zinc-500">
          Datos en memoria — se pierden al recargar la página.
        </p>
      </header>

      <main className="flex-1 px-4 pb-10">
        <SandboxView />
      </main>
    </div>
  );
}
