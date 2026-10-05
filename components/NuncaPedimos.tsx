import { copy } from "@/data/copy";

// Rendered from the root layout, so it is on every screen (Shadow Clause).
export function NuncaPedimos() {
  const t = copy.nuncaPedimos;
  return (
    <div
      role="note"
      data-testid="nunca-pedimos"
      className="rounded-xl bg-tinta px-4 py-3 text-[15px] leading-snug text-white"
    >
      <strong className="text-aviso">{t.fuerte}</strong> {t.resto} {t.estafa}
    </div>
  );
}
