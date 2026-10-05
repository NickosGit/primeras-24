"use client";

import { useState } from "react";
import { copy } from "@/data/copy";
import { agregar } from "@/lib/bitacora";
import { Estado } from "@/components/Estado";
import type { DmarcRespuesta } from "@/app/api/dmarc/route";

// The one real check in the app. CONFIRMADO describes the published record only.
export function DmarcCard() {
  const t = copy.dmarc;
  const [dominio, setDominio] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [res, setRes] = useState<DmarcRespuesta | null>(null);

  async function revisar(e: React.FormEvent) {
    e.preventDefault();
    if (cargando) return;
    setCargando(true);
    setError(null);
    try {
      const r = await fetch("/api/dmarc", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ domain: dominio }),
      });
      const data = await r.json().catch(() => ({}));
      if (!r.ok) {
        setRes(null);
        setError(typeof data.error === "string" ? data.error : t.errorDominio);
        return;
      }
      const resultado = data as DmarcRespuesta;
      setRes(resultado);
      const confirmado = resultado.policy !== "no_se_pudo";
      agregar({
        kind: "dmarc",
        estado: confirmado ? "CONFIRMADO" : "DESCONOCIDO",
        text: `Revisión de correos falsos para ${resultado.domain}: ${t.politicas[resultado.policy]}${
          confirmado && resultado.spfConsultado ? ` ${resultado.spf ? t.spfSi : t.spfNo}` : ""
        }`,
      });
    } catch {
      setRes(null);
      setError(t.politicas.no_se_pudo);
    } finally {
      setCargando(false);
    }
  }

  const confirmado = res && res.policy !== "no_se_pudo";

  return (
    <section
      id="revisar-correo"
      aria-labelledby="dmarc-titulo"
      data-testid="dmarc-card"
      className="scroll-mt-4 rounded-xl border-2 border-linea bg-white p-4"
    >
      <h2 id="dmarc-titulo" className="text-lg leading-snug font-extrabold">
        {t.titulo}
      </h2>
      <p className="mt-1 text-sm text-gris">{t.intro}</p>

      <form onSubmit={revisar} noValidate className="mt-3 flex gap-2">
        <label htmlFor="dominio" className="sr-only">
          {t.etiqueta}
        </label>
        <input
          id="dominio"
          type="text"
          inputMode="url"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          autoComplete="off"
          maxLength={253}
          value={dominio}
          onChange={(e) => setDominio(e.target.value)}
          placeholder={t.placeholder}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "dominio-error" : undefined}
          className="min-h-11 min-w-0 flex-1 rounded-lg border-2 border-tinta px-3"
        />
        <button
          type="submit"
          disabled={cargando || !dominio.trim()}
          className="min-h-11 rounded-lg bg-tinta px-4 font-bold text-white disabled:bg-gris-claro"
        >
          {cargando ? t.revisando : t.boton}
        </button>
      </form>

      {error && (
        <p id="dominio-error" role="alert" className="mt-2 text-sm font-semibold text-acento">
          {error}
        </p>
      )}

      {res && (
        <div data-testid="dmarc-resultado" role="status" className="mt-3 flex flex-col gap-1">
          <p>
            <span className="font-semibold">{res.domain}</span>{" "}
            <Estado estado={confirmado ? "CONFIRMADO" : "DESCONOCIDO"} />
          </p>
          <p>{t.politicas[res.policy]}</p>
          {confirmado && res.spfConsultado && (
            <p className="text-sm">{res.spf ? t.spfSi : t.spfNo}</p>
          )}
          <p className="text-sm text-gris">{t.unSoloDato}</p>
          <p className="text-sm text-gris">{t.fuente}</p>
          {(res.dmarc || res.spf) && (
            <details className="text-sm text-gris">
              <summary className="cursor-pointer underline underline-offset-2">
                {t.verRegistro}
              </summary>
              {res.dmarc && <pre className="mt-1 break-all whitespace-pre-wrap">{res.dmarc}</pre>}
              {res.spf && <pre className="mt-1 break-all whitespace-pre-wrap">{res.spf}</pre>}
            </details>
          )}
        </div>
      )}
    </section>
  );
}
