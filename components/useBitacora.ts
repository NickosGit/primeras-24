"use client";

import { useMemo, useSyncExternalStore } from "react";
import { CASO_KEY, EVENTO, KEY, leerRaw, parseCaso, parseEntradas } from "@/lib/bitacora";

function subscribe(cb: () => void) {
  window.addEventListener("storage", cb);
  window.addEventListener(EVENTO, cb);
  return () => {
    window.removeEventListener("storage", cb);
    window.removeEventListener(EVENTO, cb);
  };
}

const nada = () => () => {};

/** Reads the log and the case from localStorage, re-rendering on every change. */
export function useBitacora() {
  const hidratado = useSyncExternalStore(nada, () => true, () => false);
  const rawEntradas = useSyncExternalStore(subscribe, () => leerRaw(KEY), () => null);
  const rawCaso = useSyncExternalStore(subscribe, () => leerRaw(CASO_KEY), () => null);
  const entradas = useMemo(() => parseEntradas(rawEntradas), [rawEntradas]);
  const caso = useMemo(() => parseCaso(rawCaso), [rawCaso]);
  return { hidratado, entradas, caso };
}
