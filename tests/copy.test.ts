import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

// Condition 1: no string may tell the user or the business that it is safe,
// protected or guaranteed, and nothing may promise recovery.
const CERTEZA = [
  /\bsegur[oa]s?\b/,
  /\bproteg(e|id[oa]s?|er)\b/,
  /\ba salvo\b/,
  /\bgarantiz\w*/,
  /\bfuera de peligro\b/,
  /\b(se van a|vas a|van a|vamos a) recuperar\b/,
  /\brecuperar(as|emos|an)\b/,
  /\bsin riesgo\b/,
];

const sinAcentos = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

const ARCHIVOS = ["data/copy.ts", "data/protocols.ts"];

describe("no certainty claims in UI strings", () => {
  for (const archivo of ARCHIVOS) {
    const ruta = join(process.cwd(), archivo);
    it.runIf(existsSync(ruta))(`${archivo} makes no certainty claim`, () => {
      const lineas = sinAcentos(readFileSync(ruta, "utf8")).split("\n");
      const hallazgos = lineas.flatMap((linea, i) =>
        CERTEZA.filter((re) => re.test(linea)).map(
          (re) => `${archivo}:${i + 1} ${re} -> ${linea.trim()}`,
        ),
      );
      expect(hallazgos).toEqual([]);
    });
  }

  it("the scanner itself catches a planted claim", () => {
    const plantado = sinAcentos("Listo, ya estás protegida y tus archivos se van a recuperar.");
    expect(CERTEZA.some((re) => re.test(plantado))).toBe(true);
  });
});
