import type { EstadoTipo } from "@/components/Estado";
import { isIncidentType, type IncidentType } from "@/lib/classify";
import { copy } from "@/data/copy";

// The incident log lives only in this browser (localStorage) and leaves only
// when the user downloads it. Nothing here talks to a server.

export const KEY = "p24:bitacora";
export const CASO_KEY = "p24:caso";
export const EVENTO = "p24:cambio";

export type Kind = "inicio" | "paso" | "decision" | "dmarc" | "nota";

export type Entrada = {
  ts: number;
  kind: Kind;
  estado: EstadoTipo;
  text: string;
  /** Step id for "paso" / "decision" entries, and for a "nota" that unticks a step. */
  ref?: string;
};

export type Caso = {
  ts: number;
  type: IncidentType;
  summary?: string;
  source: "ia" | "simulado";
  redacted: boolean;
};

export type Metricas = {
  minutosAlPrimerPaso: number | null;
  decisiones: number;
  gatedAbiertos: number;
};

// ---------- storage ----------

function almacen(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function leerRaw(clave: string): string | null {
  try {
    return almacen()?.getItem(clave) ?? null;
  } catch {
    return null;
  }
}

function escribir(clave: string, valor: unknown) {
  try {
    almacen()?.setItem(clave, JSON.stringify(valor));
  } catch {
    // Storage full or blocked: the plan still works, the log just won't persist.
  }
  avisar();
}

function avisar() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENTO));
}

export function parseEntradas(raw: string | null): Entrada[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data)
      ? data.filter(
          (e): e is Entrada =>
            e && typeof e.ts === "number" && typeof e.kind === "string" && typeof e.text === "string",
        )
      : [];
  } catch {
    return [];
  }
}

export function parseCaso(raw: string | null): Caso | null {
  if (!raw) return null;
  try {
    const c = JSON.parse(raw);
    return c && typeof c.ts === "number" && isIncidentType(c.type) ? (c as Caso) : null;
  } catch {
    return null;
  }
}

export const leer = () => parseEntradas(leerRaw(KEY));
export const leerCaso = () => parseCaso(leerRaw(CASO_KEY));

export function agregar(e: Omit<Entrada, "ts"> & { ts?: number }): Entrada {
  const entrada: Entrada = { ...e, ts: e.ts ?? Date.now() };
  escribir(KEY, [...leer(), entrada]);
  return entrada;
}

export function etiquetaTipo(caso: Pick<Caso, "type" | "source">): string {
  return copy.plan.titulos[caso.type];
}

/** Starts a new case: stores it and writes the "inicio" entry at submit time. */
export function iniciar(caso: Caso) {
  escribir(CASO_KEY, caso);
  agregar({
    ts: caso.ts,
    kind: "inicio",
    estado: caso.type === "no_claro" ? "DESCONOCIDO" : "SIN_VERIFICAR",
    text: `Inicio. ${etiquetaTipo(caso)} (${caso.source === "ia" ? copy.ai.ia : `${copy.ai.simulado}: ${copy.ai.simuladoExplica}`})`,
  });
}

/** clear() removes everything this app ever stored. */
export function clear() {
  try {
    const s = almacen();
    if (s) {
      for (const k of Object.keys(s)) if (k.startsWith("p24:")) s.removeItem(k);
    }
  } catch {
    // nothing to do
  }
  avisar();
}

// ---------- derived state ----------

/** Entries of the current case: everything since the last "inicio". */
export function segmentoActual(entradas: Entrada[]): Entrada[] {
  let desde = -1;
  entradas.forEach((e, i) => {
    if (e.kind === "inicio") desde = i;
  });
  return desde === -1 ? entradas : entradas.slice(desde);
}

/** Step id -> time it was ticked. A later "nota" with the same ref unticks it. */
export function pasosHechos(entradas: Entrada[]): Map<string, number> {
  const hechos = new Map<string, number>();
  for (const e of segmentoActual(entradas)) {
    if (!e.ref) continue;
    if (e.kind === "paso") hechos.set(e.ref, e.ts);
    if (e.kind === "nota") hechos.delete(e.ref);
  }
  return hechos;
}

export function decisionesTomadas(entradas: Entrada[]): Map<string, Entrada> {
  const d = new Map<string, Entrada>();
  for (const e of segmentoActual(entradas)) if (e.kind === "decision" && e.ref) d.set(e.ref, e);
  return d;
}

export function metrics(entradas: Entrada[], gatedIds: string[]): Metricas {
  const seg = segmentoActual(entradas);
  const inicio = seg.find((e) => e.kind === "inicio");
  const primerPaso = seg.find((e) => e.kind === "paso");
  const decididos = decisionesTomadas(entradas);
  return {
    minutosAlPrimerPaso:
      inicio && primerPaso
        ? Math.max(0, Math.round((primerPaso.ts - inicio.ts) / 60000))
        : null,
    decisiones: seg.filter((e) => e.kind === "decision").length,
    gatedAbiertos: gatedIds.filter((id) => !decididos.has(id)).length,
  };
}

// ---------- export ----------

export const hora = (ts: number) =>
  new Date(ts).toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit", hour12: false });

export const fechaHora = (ts: number) =>
  new Date(ts).toLocaleString("es-MX", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

const ETIQUETA = (estado: EstadoTipo) => copy.estados[estado].etiqueta;

export function exportTxt(
  entradas: Entrada[],
  caso: Caso | null,
  gatedIds: string[],
  ahora = Date.now(),
): string {
  const seg = segmentoActual(entradas);
  const m = metrics(entradas, gatedIds);
  const inicio = caso?.ts ?? seg[0]?.ts ?? ahora;
  const estadoTipo: EstadoTipo = !caso || caso.type === "no_claro" ? "DESCONOCIDO" : "SIN_VERIFICAR";
  const tipo = caso ? etiquetaTipo(caso) : "No se sabe";
  const origen = caso
    ? caso.source === "ia"
      ? copy.ai.ia
      : `${copy.ai.simulado}: ${copy.ai.simuladoExplica}`
    : "";

  const vigentes = pasosHechos(entradas);
  const hechos = seg.filter((e) => e.kind === "paso" && e.ref && vigentes.get(e.ref) === e.ts);
  const decisiones = seg.filter((e) => e.kind === "decision");

  const lineas = [
    "PRIMERAS 24 · BITÁCORA DEL INCIDENTE",
    `Generada: ${fechaHora(ahora)}`,
    `Inicio: ${fechaHora(inicio)}`,
    `Tipo de incidente: ${tipo} [${ETIQUETA(estadoTipo)}]`,
    ...(origen ? [`Clasificación: ${origen}`] : []),
    ...(caso?.summary && caso.source === "ia"
      ? [`Lo que entendimos de lo que escribiste [${ETIQUETA("SIN_VERIFICAR")}]: ${caso.summary}`]
      : []),
    "",
    "REGISTRO",
    ...seg.map((e) => `${hora(e.ts)}  [${ETIQUETA(e.estado)}]  ${e.text}`),
    "",
    "MÉTRICAS",
    `Minutos al primer paso: ${m.minutosAlPrimerPaso ?? "sin pasos todavía"}`,
    `Decisiones enviadas a humano: ${m.decisiones}`,
    `Decisiones con candado todavía abiertas: ${m.gatedAbiertos}`,
    "",
    "PARA LEER AL 088",
    `1. Desde las ${hora(inicio)} tengo un posible incidente informático en mi negocio.`,
    `2. ${caso && caso.type !== "no_claro" ? `${tipo}. Nadie lo ha verificado todavía.` : "Todavía no sé qué tipo de incidente es."}`,
    `3. Ya hice: ${hechos.length ? hechos.map((e) => e.text.replace(/^Hecho: /, "").replace(/\.$/, "")).join("; ") : "nada todavía"}.`,
    `4. Decisiones que ya tomó una persona: ${decisiones.length}. Pendientes: ${m.gatedAbiertos}.`,
    "5. Tengo fotos y esta bitácora con horas para entregarlas.",
    "",
    copy.pie.linea1,
  ];
  return lineas.join("\n");
}
