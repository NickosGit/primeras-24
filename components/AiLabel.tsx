import { copy } from "@/data/copy";

// Honesty label next to every classification: who classified it and that it can be wrong.
export function AiLabel({ source }: { source: "ia" | "simulado" }) {
  if (source === "ia") {
    return (
      <span data-testid="ai-label" className="text-sm text-gris">
        {copy.ai.ia}
      </span>
    );
  }
  return (
    <span data-testid="ai-label" className="inline-flex flex-wrap items-baseline gap-2">
      <span className="rounded border-2 border-dashed border-acento px-2 py-0.5 text-xs font-bold tracking-wider text-acento">
        {copy.ai.simulado}
      </span>
      <span className="text-sm text-gris">{copy.ai.simuladoExplica}</span>
    </span>
  );
}
