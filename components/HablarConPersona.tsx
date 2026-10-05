import { copy } from "@/data/copy";
import { Estado } from "@/components/Estado";

// The human path in this slice is the official 088 line (packet §8).
export function HablarConPersona() {
  return (
    <a
      href={copy.persona.tel}
      data-testid="hablar-con-persona"
      className="flex min-h-12 w-full items-center justify-center rounded-xl border-2 border-tinta bg-white px-4 py-3 text-center text-lg font-bold text-tinta active:bg-humano-fondo"
    >
      {copy.persona.boton}
    </a>
  );
}

// Escalation card: every option is a decision for a person, never for the app.
export function TarjetaEscalamiento() {
  const t = copy.persona;
  return (
    <section
      aria-labelledby="escalamiento-titulo"
      data-testid="escalamiento"
      className="rounded-xl border-2 border-dashed border-tinta bg-humano-fondo p-4"
    >
      <h2 id="escalamiento-titulo" className="text-lg font-bold">
        {t.tarjetaTitulo}
      </h2>
      <p className="mt-1 text-sm text-gris">{t.tarjetaIntro}</p>
      <ul className="mt-3 space-y-3">
        {t.opciones.map((o) => (
          <li key={o.id}>
            <Estado estado="REQUIERE_HUMANO">
              <span className="font-semibold">{o.titulo}</span>
            </Estado>
            <p className="mt-1 text-sm text-gris">{o.detalle}</p>
            {"href" in o && (
              <a
                href={o.href}
                className="mt-2 inline-block rounded-lg bg-tinta px-4 py-2 font-bold text-white"
              >
                {o.accion}
              </a>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
