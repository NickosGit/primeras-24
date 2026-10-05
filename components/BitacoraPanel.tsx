"use client";

import { copy } from "@/data/copy";
import { clear, exportTxt, metrics, pasosHechos, type Caso, type Entrada } from "@/lib/bitacora";

function nombreArchivo(ts: number) {
  const d = new Date(ts);
  const p = (n: number) => String(n).padStart(2, "0");
  return `bitacora-primeras24-${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}.txt`;
}

export function BitacoraPanel({
  entradas,
  caso,
  gatedIds,
  borrado,
  onBorrar,
}: {
  entradas: Entrada[];
  caso: Caso | null;
  gatedIds: string[];
  borrado: boolean;
  onBorrar: () => void;
}) {
  const t = copy.bitacora;
  const vacia = entradas.length === 0;
  const m = metrics(entradas, gatedIds);
  const hechos = pasosHechos(entradas).size;

  function descargar() {
    if (vacia) return;
    const ahora = Date.now();
    const texto = exportTxt(entradas, caso, gatedIds, ahora);
    const url = URL.createObjectURL(
      new Blob(["﻿" + texto], { type: "text/plain;charset=utf-8" }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = nombreArchivo(ahora);
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function borrar() {
    if (!window.confirm(t.confirmarBorrar)) return;
    clear();
    onBorrar();
  }

  return (
    <section
      aria-labelledby="bitacora-titulo"
      data-testid="bitacora"
      className="flex flex-col gap-3 rounded-xl border-2 border-linea bg-white p-4"
    >
      <div>
        <h2 id="bitacora-titulo" className="text-lg font-extrabold">
          {t.titulo}
        </h2>
        <p className="text-sm text-gris">{t.intro}</p>
      </div>

      {borrado && vacia && (
        <p role="status" className="rounded-lg bg-humano-fondo px-3 py-2 text-sm font-semibold">
          {t.borrado}
        </p>
      )}

      {!vacia && (
        <dl className="grid grid-cols-3 gap-2 text-center" data-testid="metricas">
          <div className="rounded-lg bg-papel p-2">
            <dt className="text-xs text-gris">{t.pasosHechos}</dt>
            <dd className="text-2xl font-extrabold">{hechos}</dd>
          </div>
          <div className="rounded-lg bg-papel p-2">
            <dt className="text-xs text-gris">{t.minutos}</dt>
            <dd className="text-2xl font-extrabold">{m.minutosAlPrimerPaso ?? "–"}</dd>
          </div>
          <div className="rounded-lg bg-papel p-2">
            <dt className="text-xs text-gris">{t.decisiones}</dt>
            <dd className="text-2xl font-extrabold">{m.decisiones}</dd>
          </div>
        </dl>
      )}

      <button
        type="button"
        onClick={descargar}
        disabled={vacia}
        className="min-h-12 rounded-xl border-2 border-tinta bg-white px-4 text-lg font-bold disabled:border-linea disabled:text-gris-claro"
      >
        {t.descargar}
      </button>
      {vacia && <p className="text-center text-sm text-gris">{t.vacia}</p>}

      {!vacia && (
        <button
          type="button"
          onClick={borrar}
          className="self-center text-sm font-semibold text-acento underline underline-offset-2"
        >
          {t.borrar}
        </button>
      )}
    </section>
  );
}
