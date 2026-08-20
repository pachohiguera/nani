"use client";

import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth/client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="rounded-full border border-zinc-800 px-4 py-2 text-sm font-medium text-zinc-400 active:bg-zinc-900"
    >
      Cerrar sesión
    </button>
  );
}
