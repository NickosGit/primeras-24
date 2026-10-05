import { describe, expect, it } from "vitest";
import { evidencia, protocolos, type Paso } from "@/data/protocols";
import { normalizar, violatesShadow } from "@/lib/guard";

const todos: [string, Paso[]][] = [...Object.entries(protocolos), ["evidencia", evidencia]];

// Categories that must always sit behind the authority gate (Condition 3).
const DE_ALTO_IMPACTO =
  /(descifr|desencript|decrypt|desbloquear archivos|herramienta|restaur|reinstal|formate|borrar|eliminar|aviso formal|avisar a pacientes|autoridad|decidir|firmar|presentar)/;

describe("protocol integrity", () => {
  it.each(todos)("%s has a 'no pagues' step", (_, pasos) => {
    expect(pasos.some((p) => /\bno pagues\b/.test(normalizar(p.text)))).toBe(true);
  });

  it.each(todos)("%s never makes a high-impact step reversible", (_, pasos) => {
    const mal = pasos.filter(
      (p) => p.gate === "reversible" && DE_ALTO_IMPACTO.test(normalizar(p.text)),
    );
    expect(mal.map((p) => p.id)).toEqual([]);
  });

  it.each(todos)("%s: every reversible step has an undo line", (_, pasos) => {
    const sinUndo = pasos.filter((p) => p.gate === "reversible" && !p.undo);
    expect(sinUndo.map((p) => p.id)).toEqual([]);
  });

  it.each(todos)("%s: every reversible step has a first-person line for the 088 summary", (_, pasos) => {
    const mal = pasos.filter(
      (p) =>
        p.gate === "reversible" &&
        (!p.hecho || p.hecho === p.text || /\b(tu|tus|te)\b|\.$/.test(p.hecho)),
    );
    expect(mal.map((p) => p.id)).toEqual([]);
  });

  it.each(todos)("%s: only steps that are about photos are flagged foto", (_, pasos) => {
    const mal = pasos.filter((p) => Boolean(p.foto) !== /\bfoto\b/.test(p.text));
    expect(mal.map((p) => p.id)).toEqual([]);
  });

  it.each(todos)("%s: reversible steps pass the Shadow guard", (_, pasos) => {
    const mal = pasos.filter(
      (p) =>
        p.gate === "reversible" &&
        (violatesShadow(p.text) || violatesShadow(p.undo ?? "") || violatesShadow(p.hecho ?? "")),
    );
    expect(mal.map((p) => p.id)).toEqual([]);
  });

  it.each(todos)("%s: no step asks the user to give anything to this app", (_, pasos) => {
    const mal = pasos.filter((p) =>
      /\b(escribe aqui|pega aqui|sube|adjunta|comparte con nosotros|envianos|mandanos|dinos tu)\b/.test(
        normalizar(p.text),
      ),
    );
    expect(mal.map((p) => p.id)).toEqual([]);
  });

  it("the four gated ransomware categories are requiere_humano", () => {
    const gated = protocolos.ransomware.filter((p) => p.gate === "requiere_humano");
    const textos = gated.map((p) => normalizar(p.text)).join(" | ");
    expect(textos).toMatch(/desbloquear archivos/);
    expect(textos).toMatch(/restaurar/);
    expect(textos).toMatch(/formatear/);
    expect(textos).toMatch(/datos de pacientes/);
    expect(textos).toMatch(/avisar a pacientes/);
  });

  it("step ids are unique", () => {
    const ids = todos.flatMap(([, pasos]) => pasos.map((p) => p.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("Evidence Mode has no gated steps (escalation is the human card)", () => {
    expect(evidencia.every((p) => p.gate === "reversible")).toBe(true);
  });

  it("ransomware starts with disconnecting without turning off, with its undo", () => {
    const [primero] = protocolos.ransomware;
    expect(primero.text).toMatch(/Desconecta .* del internet.*No la apagues/);
    expect(primero.undo).toMatch(/reconectando/);
  });
});
