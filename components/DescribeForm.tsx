"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { copy } from "@/data/copy";
import { hora, iniciar, type Caso } from "@/lib/bitacora";
import { redactSecrets } from "@/lib/guard";
import { classifyByKeywords, isIncidentType } from "@/lib/classify";
import { useBitacora } from "@/components/useBitacora";

export const MIN_TEXTO = 10;
export const MAX_TEXTO = 600;

// If the network fails, classify on the device instead of leaving the person alone.
function respaldoLocal(texto: string): Omit<Caso, "ts"> {
  const { clean, redacted } = redactSecrets(texto);
  const type = classifyByKeywords(clean);
  return type === "no_claro"
    ? { type, source: "simulado", redacted }
    : { type, summary: copy.plan.resumenSimulado[type], source: "simulado", redacted };
}

export function DescribeForm() {
  const t = copy.describir;
  const router = useRouter();
  const { caso } = useBitacora();
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [acuse, setAcuse] = useState<number | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    if (acuse) return;
    const limpio = texto.trim();
    if (limpio.length < MIN_TEXTO) return setError(t.errorCorto);
    if (limpio.length > MAX_TEXTO) return setError(t.errorLargo);
    setError(null);

    // Condition 5: acknowledge instantly, before any answer comes back.
    const inicio = Date.now();
    setAcuse(inicio);

    let resultado: Omit<Caso, "ts">;
    try {
      const res = await fetch("/api/triage", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: limpio }),
      });
      if (res.status === 400) {
        const data = await res.json().catch(() => ({}));
        setAcuse(null);
        setError(typeof data.error === "string" ? data.error : t.errorCorto);
        return;
      }
      const data = await res.json();
      if (!res.ok || !isIncidentType(data.type)) throw new Error("respuesta");
      resultado = {
        type: data.type,
        summary: typeof data.summary === "string" ? data.summary : undefined,
        source: data.source === "ia" ? "ia" : "simulado",
        redacted: data.redacted === true,
      };
    } catch {
      resultado = respaldoLocal(limpio);
    }

    iniciar({ ts: inicio, ...resultado });
    router.push("/plan");
  }

  if (acuse) {
    return (
      <div role="status" aria-live="assertive" data-testid="acuse" className="flex flex-col gap-2 py-6">
        <p className="text-2xl font-extrabold text-verde">
          {copy.acuse.recibido} {hora(acuse)}. {copy.acuse.vamos}
        </p>
        <p className="text-lg text-gris">{copy.acuse.leyendo}</p>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
      {caso && (
        <p className="rounded-lg border border-linea bg-white px-3 py-2 text-sm">
          {t.casoAbierto} {hora(caso.ts)}.{" "}
          <Link href="/plan" className="font-bold underline underline-offset-2">
            {t.verPlan}
          </Link>
        </p>
      )}

      <h1 className="text-[28px] leading-tight font-extrabold">{t.titulo}</h1>
      <p className="text-gris">{t.ayuda}</p>

      <div>
        <label htmlFor="texto" className="sr-only">
          {t.etiquetaCampo}
        </label>
        <textarea
          id="texto"
          name="texto"
          rows={5}
          maxLength={MAX_TEXTO}
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={t.placeholder}
          aria-describedby={error ? "contador texto-error" : "contador"}
          aria-invalid={error ? true : undefined}
          autoComplete="off"
          spellCheck
          className="w-full rounded-xl border-2 border-tinta bg-white p-4 text-lg leading-relaxed placeholder:text-gris-claro"
        />
        <p id="contador" className="text-right text-sm text-gris">
          {texto.length} / {MAX_TEXTO}
        </p>
        {error && (
          <p id="texto-error" role="alert" className="font-semibold text-acento">
            {error}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm text-gris">{t.ejemplosTitulo}</p>
        {t.ejemplos.map((ej) => (
          <button
            key={ej}
            type="button"
            onClick={() => {
              setTexto(ej);
              setError(null);
            }}
            className="rounded-xl border border-dashed border-gris-claro px-4 py-2 text-left text-[15px] text-gris"
          >
            {t.ejemploPrefijo} «{ej}»{" "}
            <span className="text-xs tracking-wider whitespace-nowrap uppercase">
              · {copy.app.demo}
            </span>
          </button>
        ))}
      </div>

      <button
        type="submit"
        className="min-h-14 rounded-xl bg-acento px-4 py-3 text-xl font-bold text-white active:bg-acento-oscuro"
      >
        {t.boton}
      </button>
    </form>
  );
}
