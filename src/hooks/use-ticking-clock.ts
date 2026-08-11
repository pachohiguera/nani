"use client";

import { useEffect, useState } from "react";

// null hasta que el efecto corre en el cliente: el render inicial del
// servidor y el primer render del cliente deben producir el mismo HTML,
// y "ahora" nunca es el mismo instante en ambos lados. Solo después de
// montar (fuera de la hidratación) es seguro pintar la hora real; esto
// replica el patrón "mostrar contenido distinto server/cliente" de los
// docs de React (usar un efecto para setear el valor real tras montar).
// Tickea cada segundo solo mientras `active` es true (hay un cronómetro
// corriendo), para no gastar batería el resto del tiempo.
export function useTickingClock(active: boolean, intervalMs = 1000): Date | null {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- valor solo disponible en cliente, ver comentario arriba
    setNow(new Date());

    if (!active) return;

    const id = setInterval(() => setNow(new Date()), intervalMs);
    return () => clearInterval(id);
  }, [active, intervalMs]);

  return now;
}
