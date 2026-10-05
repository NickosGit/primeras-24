import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

function archivos(dir: string): string[] {
  return readdirSync(dir).flatMap((nombre) => {
    const ruta = join(dir, nombre);
    return statSync(ruta).isDirectory() ? archivos(ruta) : [ruta];
  });
}

describe("Shadow Clause rule 1: no password field anywhere", () => {
  const fuentes = ["app", "components"].flatMap((d) => archivos(join(process.cwd(), d)));

  it("scans real files", () => {
    expect(fuentes.length).toBeGreaterThan(3);
  });

  it('no source file in app/ or components/ has type="password"', () => {
    const mal = fuentes.filter((f) =>
      /type\s*=\s*\{?\s*["'`]password["'`]/i.test(readFileSync(f, "utf8")),
    );
    expect(mal).toEqual([]);
  });

  it("no file upload input either (rule 2)", () => {
    const mal = fuentes.filter((f) =>
      /type\s*=\s*\{?\s*["'`]file["'`]/i.test(readFileSync(f, "utf8")),
    );
    expect(mal).toEqual([]);
  });
});
