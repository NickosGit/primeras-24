import type { ReactNode } from "react";
import { copy } from "@/data/copy";

// The only way to render a claim on screen (Condition 1).
// CONFIRMADO is reserved for the result of a real check (the DNS lookup).
export const ESTADOS = [
  "CONFIRMADO",
  "SIN_VERIFICAR",
  "DESCONOCIDO",
  "REQUIERE_HUMANO",
] as const;

export type EstadoTipo = (typeof ESTADOS)[number];

const estilos: Record<EstadoTipo, string> = {
  CONFIRMADO: "bg-verde-fondo text-verde",
  SIN_VERIFICAR: "bg-ambar-fondo text-ambar",
  DESCONOCIDO: "bg-linea text-tinta",
  REQUIERE_HUMANO: "bg-tinta text-white",
};

export function Estado({
  estado,
  children,
  explicar = false,
}: {
  estado: EstadoTipo;
  children?: ReactNode;
  /** Shows the one-line meaning of the chip next to it. */
  explicar?: boolean;
}) {
  const { etiqueta, explica } = copy.estados[estado];
  return (
    <span className="inline-flex flex-wrap items-baseline gap-x-2 gap-y-1">
      <span
        data-estado={estado}
        title={explica}
        className={`inline-block rounded px-2 py-0.5 text-xs font-bold tracking-wider whitespace-nowrap ${estilos[estado]}`}
      >
        {etiqueta}
      </span>
      {explicar && <span className="text-sm text-gris">{explica}</span>}
      {children}
    </span>
  );
}
