"use client";

import { useId, useState } from "react";
import { copy } from "@/data/copy";
import type { Paso } from "@/data/protocols";
import { agregar, hora, type Entrada } from "@/lib/bitacora";
import { Estado } from "@/components/Estado";

const MAX_NOMBRE = 60;

// A high-impact step (Condition 3). No checkbox: the only action is recording
// which human decided. Role is required, name is optional and stays in the browser.
export function GatedStep({ paso, decision }: { paso: Paso; decision?: Entrada }) {
  const t = copy.gate;
  const id = useId();
  const [abierto, setAbierto] = useState(false);
  const [rol, setRol] = useState("");
  const [nombre, setNombre] = useState("");
  const [error, setError] = useState<string | null>(null);

  function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!(t.roles as readonly string[]).includes(rol)) {
      setError(t.faltaRol);
      return;
    }
    const quien = nombre.trim().slice(0, MAX_NOMBRE);
    agregar({
      kind: "decision",
      estado: "REQUIERE_HUMANO",
      ref: paso.id,
      text: `Decisión: ${paso.text}. Lo decidió: ${rol}${quien ? ` (${quien})` : ""}.`,
    });
    setAbierto(false);
  }

  return (
    <li
      data-testid="gated-step"
      className="rounded-xl border-2 border-dashed border-tinta bg-humano-fondo p-4"
    >
      <p className="text-[17px] leading-snug">
        <Estado estado="REQUIERE_HUMANO" /> <span>{paso.text}</span>
      </p>
      <p className="mt-1 text-sm text-gris">{paso.why}</p>

      {decision ? (
        <p className="mt-2 text-sm font-semibold text-tinta">
          {t.decidido} · {hora(decision.ts)} · {decision.text.slice(decision.text.indexOf("Lo decidió:"))}
        </p>
      ) : !abierto ? (
        <button
          type="button"
          onClick={() => setAbierto(true)}
          className="mt-2 text-sm font-semibold text-tinta underline underline-offset-2"
        >
          {t.anotar} ›
        </button>
      ) : (
        <form onSubmit={guardar} noValidate className="mt-3 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-rol`} className="text-sm font-semibold">
              {t.rol}
            </label>
            <select
              id={`${id}-rol`}
              required
              value={rol}
              onChange={(e) => {
                setRol(e.target.value);
                setError(null);
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-error` : undefined}
              className="min-h-11 rounded-lg border-2 border-tinta bg-white px-3"
            >
              <option value="">{t.rolElige}</option>
              {t.roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor={`${id}-nombre`} className="text-sm font-semibold">
              {t.nombre}
            </label>
            <input
              id={`${id}-nombre`}
              type="text"
              autoComplete="off"
              maxLength={MAX_NOMBRE}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="min-h-11 rounded-lg border-2 border-tinta bg-white px-3"
            />
          </div>
          {error && (
            <p id={`${id}-error`} role="alert" className="text-sm font-semibold text-acento">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              aria-disabled={!rol}
              className={`min-h-11 flex-1 rounded-lg px-4 font-bold text-white ${rol ? "bg-tinta" : "bg-gris-claro"}`}
            >
              {t.guardar}
            </button>
            <button
              type="button"
              onClick={() => {
                setAbierto(false);
                setError(null);
              }}
              className="min-h-11 flex-1 rounded-lg border-2 border-tinta bg-white px-4 font-bold"
            >
              {t.cancelar}
            </button>
          </div>
        </form>
      )}
    </li>
  );
}
