"use client";

import Link from "next/link";
import { copy } from "@/data/copy";
import { pasosDe } from "@/data/protocols";
import { decisionesTomadas, hora, pasosHechos } from "@/lib/bitacora";
import { useBitacora } from "@/components/useBitacora";
import { Estado } from "@/components/Estado";
import { AiLabel } from "@/components/AiLabel";
import { Checklist } from "@/components/Checklist";
import { GatedStep } from "@/components/GatedStep";
import { EvidenceMode } from "@/components/EvidenceMode";

export function PlanView() {
  const { hidratado, entradas, caso } = useBitacora();

  if (!hidratado) return <p className="text-gris">{copy.acuse.leyendo}</p>;

  if (!caso) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-lg">{copy.plan.sinCaso}</p>
        <Link
          href="/"
          className="rounded-xl bg-acento px-4 py-3 text-center text-lg font-bold text-white"
        >
          {copy.plan.empezar}
        </Link>
      </div>
    );
  }

  const pasos = pasosDe(caso.type);
  const hechos = pasosHechos(entradas);
  const decisiones = decisionesTomadas(entradas);
  const gated = pasos.filter((p) => p.gate === "requiere_humano");
  const claro = caso.type !== "no_claro";

  return (
    <div className="flex flex-col gap-5">
      <p className="font-bold text-verde" role="status">
        {copy.acuse.recibido} {hora(caso.ts)}. {copy.acuse.vamos}
      </p>

      {caso.redacted && (
        <p role="note" className="rounded-lg bg-ambar-fondo px-3 py-2 text-sm text-ambar">
          {copy.plan.oculto}
        </p>
      )}

      <section
        data-testid="clasificacion"
        className="rounded-xl border-2 border-tinta bg-white p-4"
      >
        <h1 className="text-[22px] leading-tight font-extrabold">
          {copy.plan.titulos[caso.type]}
        </h1>
        <div className="mt-2 flex flex-col gap-1">
          <Estado estado={claro ? "SIN_VERIFICAR" : "DESCONOCIDO"} explicar />
          <AiLabel source={caso.source} />
        </div>
        {caso.summary && (
          <div className="mt-3 border-t border-linea pt-3">
            {caso.source === "ia" && (
              <p className="text-sm text-gris">{copy.plan.resumenTitulo}</p>
            )}
            <p className="mt-1">
              <Estado estado="SIN_VERIFICAR">
                <span>{caso.summary}</span>
              </Estado>
            </p>
          </div>
        )}
      </section>

      {claro ? (
        <>
          <Checklist pasos={pasos} hechos={hechos} />

          <section aria-labelledby="gated-titulo">
            <h2 id="gated-titulo" className="text-sm font-bold tracking-widest text-acento">
              {copy.plan.gatedTitulo}
            </h2>
            <p className="mb-2 text-sm text-gris">{copy.plan.gatedIntro}</p>
            <ul className="flex flex-col gap-3">
              {gated.map((p) => (
                <GatedStep key={p.id} paso={p} decision={decisiones.get(p.id)} />
              ))}
            </ul>
          </section>
        </>
      ) : (
        <EvidenceMode hechos={hechos} />
      )}
    </div>
  );
}
