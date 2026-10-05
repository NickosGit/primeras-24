"use client";

import { useState } from "react";
import { copy } from "@/data/copy";

export const MIN_TEXTO = 10;
export const MAX_TEXTO = 600;

export function DescribeForm() {
  const t = copy.describir;
  const [texto, setTexto] = useState("");
  const [error, setError] = useState<string | null>(null);

  function enviar(e: React.FormEvent) {
    e.preventDefault();
    const limpio = texto.trim();
    if (limpio.length < MIN_TEXTO) return setError(t.errorCorto);
    if (limpio.length > MAX_TEXTO) return setError(t.errorLargo);
    setError(null);
  }

  return (
    <form onSubmit={enviar} noValidate className="flex flex-col gap-4">
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
          aria-describedby="contador texto-error"
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
