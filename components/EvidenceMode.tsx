"use client";

import { copy } from "@/data/copy";
import { evidencia } from "@/data/protocols";
import { Checklist } from "@/components/Checklist";
import { TarjetaEscalamiento } from "@/components/HablarConPersona";

// Condition 4: when the incident cannot be classified, no protocol is picked.
// Only gather evidence, then hand off to a person.
export function EvidenceMode({ hechos }: { hechos: Map<string, number> }) {
  return (
    <div data-testid="evidence-mode" className="flex flex-col gap-4">
      <div>
        <h2 className="text-xl font-extrabold">{copy.evidencia.titulo}</h2>
        <p className="mt-1 text-gris">{copy.evidencia.intro}</p>
      </div>
      <Checklist pasos={evidencia} hechos={hechos} />
      <TarjetaEscalamiento />
    </div>
  );
}
