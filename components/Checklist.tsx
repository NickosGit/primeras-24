"use client";

import { copy } from "@/data/copy";
import type { Caja, Paso } from "@/data/protocols";
import { agregar, hora } from "@/lib/bitacora";

const CAJAS: Caja[] = ["15min", "1h", "24h"];

// Reversible steps only: each has a checkbox and a line saying how to undo it.
export function Checklist({ pasos, hechos }: { pasos: Paso[]; hechos: Map<string, number> }) {
  const reversibles = pasos.filter((p) => p.gate === "reversible");

  function marcar(paso: Paso, hecho: boolean) {
    agregar(
      hecho
        ? { kind: "paso", estado: "SIN_VERIFICAR", ref: paso.id, text: `Hecho: ${paso.text}` }
        : { kind: "nota", estado: "SIN_VERIFICAR", ref: paso.id, text: `Desmarcado: ${paso.text}` },
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {CAJAS.map((caja) => {
        const enCaja = reversibles.filter((p) => p.box === caja);
        if (!enCaja.length) return null;
        return (
          <section key={caja} aria-labelledby={`caja-${caja}`}>
            <h2
              id={`caja-${caja}`}
              className="mb-2 text-sm font-bold tracking-widest text-acento"
            >
              {copy.plan.cajas[caja]}
            </h2>
            <ul className="flex flex-col gap-3">
              {enCaja.map((paso) => {
                const ts = hechos.get(paso.id);
                const hecho = ts !== undefined;
                return (
                  <li key={paso.id} className="flex gap-3">
                    <input
                      id={paso.id}
                      type="checkbox"
                      checked={hecho}
                      onChange={(e) => marcar(paso, e.target.checked)}
                      className="mt-0.5 size-7 shrink-0 accent-tinta"
                    />
                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={paso.id}
                        className={`block text-[17px] leading-snug ${hecho ? "text-gris line-through" : ""}`}
                      >
                        {paso.text}
                      </label>
                      <p className="mt-0.5 text-sm text-gris">
                        {ts !== undefined && (
                          <span className="font-semibold text-verde">
                            {copy.plan.hecho} {hora(ts)} ·{" "}
                          </span>
                        )}
                        {paso.undo}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                        {paso.link && (
                          <a
                            href={paso.link.href}
                            {...(paso.link.externo
                              ? { target: "_blank", rel: "noopener noreferrer" }
                              : {})}
                            className="font-semibold text-tinta underline underline-offset-2"
                          >
                            {paso.link.label}
                          </a>
                        )}
                        <details className="text-sm text-gris">
                          <summary className="cursor-pointer underline underline-offset-2">
                            {copy.plan.porQue}
                          </summary>
                          <p className="mt-1">{paso.why}</p>
                        </details>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
