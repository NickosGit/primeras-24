// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: () => {} }) }));

import { PlanView } from "@/components/PlanView";
import { DmarcCard } from "@/components/DmarcCard";
import { protocolos } from "@/data/protocols";
import {
  agregar,
  exportTxt,
  iniciar,
  leer,
  metrics,
  type Caso,
} from "@/lib/bitacora";

beforeEach(() => localStorage.clear());
afterEach(cleanup);

const gatedRansomware = protocolos.ransomware
  .filter((p) => p.gate === "requiere_humano")
  .map((p) => p.id);

function leerBlob(blob: Blob): Promise<string> {
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.readAsText(blob);
  });
}

function capturarDescarga() {
  const blobs: Blob[] = [];
  Object.defineProperty(URL, "createObjectURL", {
    configurable: true,
    value: (b: Blob) => {
      blobs.push(b);
      return "blob:prueba";
    },
  });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, value: () => {} });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
  return blobs;
}

describe("metrics()", () => {
  it("minutes to first step, decisions, open gates", () => {
    const t0 = new Date("2026-10-04T08:41:00").getTime();
    const caso: Caso = { ts: t0, type: "ransomware", source: "simulado", redacted: false };
    iniciar(caso);
    agregar({ ts: t0 + 2 * 60000, kind: "paso", estado: "SIN_VERIFICAR", text: "Hecho: a", ref: "ran-desconecta" });
    agregar({ ts: t0 + 9 * 60000, kind: "decision", estado: "REQUIERE_HUMANO", text: "Decisión: x. Lo decidió: 088.", ref: "ran-gate-herramienta" });
    expect(metrics(leer(), gatedRansomware)).toEqual({
      minutosAlPrimerPaso: 2,
      decisiones: 1,
      gatedAbiertos: 3,
    });
  });

  it("only counts the current case (since the last inicio)", () => {
    const t0 = Date.now() - 3600_000;
    iniciar({ ts: t0, type: "banco", source: "simulado", redacted: false });
    agregar({ kind: "decision", estado: "REQUIERE_HUMANO", text: "x", ref: "ban-gate-aparato" });
    iniciar({ ts: Date.now(), type: "ransomware", source: "simulado", redacted: false });
    expect(metrics(leer(), gatedRansomware)).toMatchObject({ decisiones: 0, minutosAlPrimerPaso: null });
  });

  it("exportTxt marks the type SIN VERIFICAR, or DESCONOCIDO for no_claro, and never names a culprit", () => {
    const t0 = Date.now();
    iniciar({ ts: t0, type: "no_claro", source: "ia", redacted: false });
    const txt = exportTxt(leer(), { ts: t0, type: "no_claro", source: "ia", redacted: false }, []);
    expect(txt).toMatch(/Tipo de incidente: Todavía no sabemos qué pasó \[DESCONOCIDO\]/);
    expect(txt).toContain("PARA LEER AL 088");
    expect(txt).not.toMatch(/culpable|fue tu|aviso a pacientes/i);
  });
});

describe("088 summary (bug found in commit 5)", () => {
  const t0 = new Date("2026-10-04T08:41:00").getTime();
  const caso: Caso = { ts: t0, type: "ransomware", source: "simulado", redacted: false };
  const paso = (min: number, ref: string) =>
    agregar({ ts: t0 + min * 60000, kind: "paso", estado: "SIN_VERIFICAR", text: `Hecho: ${ref}`, ref });

  it("does not claim photos when the photo step was unticked", () => {
    iniciar(caso);
    paso(2, "ran-desconecta");
    paso(4, "ran-foto");
    agregar({ ts: t0 + 5 * 60000, kind: "nota", estado: "SIN_VERIFICAR", text: "Desmarcado", ref: "ran-foto" });
    const txt = exportTxt(leer(), caso, gatedRansomware);
    expect(txt).not.toMatch(/Tengo fotos/);
    expect(txt).toMatch(/^5\. Tengo esta bitácora con horas para entregarla\.$/m);
    expect(txt).toMatch(/^3\. Desconecté la compu del internet sin apagarla\.$/m);
  });

  it("claims photos only when a photo step is ticked, and reads steps in first person", () => {
    iniciar(caso);
    paso(2, "ran-desconecta");
    paso(4, "ran-foto");
    const txt = exportTxt(leer(), caso, gatedRansomware);
    expect(txt).toMatch(/^5\. Tengo fotos y esta bitácora/m);
    expect(txt).toMatch(/^3\. Desconecté la compu del internet sin apagarla; le tomé foto a la pantalla\.$/m);
    expect(txt).not.toMatch(/^3\..*(Desconecta esa|No la apagues)/m);
  });

  it("says nothing was done yet when no step is ticked", () => {
    iniciar(caso);
    expect(exportTxt(leer(), caso, gatedRansomware)).toMatch(
      /^3\. Todavía no he hecho ningún paso de la lista\.$/m,
    );
  });
});

describe("bitácora end to end", () => {
  it("three ticks and one decision survive a reload and appear in the download", async () => {
    const blobs = capturarDescarga();
    iniciar({ ts: Date.now() - 5 * 60000, type: "ransomware", source: "simulado", redacted: false });

    const { unmount } = render(<PlanView />);
    const casillas = screen.getAllByRole("checkbox");
    for (const c of casillas.slice(0, 3)) await userEvent.click(c);

    const [primerCandado] = screen.getAllByTestId("gated-step");
    await userEvent.click(within(primerCandado).getByRole("button", { name: /Anotar quién/ }));
    await userEvent.selectOptions(within(primerCandado).getByRole("combobox"), "proveedor de TI");
    await userEvent.click(within(primerCandado).getByRole("button", { name: "Guardar" }));
    unmount();

    // "reload": a fresh render reads everything back from localStorage
    render(<PlanView />);
    const despues = screen.getAllByRole("checkbox");
    expect(despues.slice(0, 3).every((c) => (c as HTMLInputElement).checked)).toBe(true);
    expect((despues[3] as HTMLInputElement).checked).toBe(false);
    expect(screen.getAllByTestId("gated-step")[0]).toHaveTextContent("Lo decidió: proveedor de TI");

    await userEvent.click(screen.getByRole("button", { name: "Descargar mi bitácora" }));
    expect(blobs).toHaveLength(1);
    const txt = await leerBlob(blobs[0]);

    expect(txt.match(/^\d{2}:\d{2} {2}\[SIN VERIFICAR\] {2}Hecho: /gm)).toHaveLength(3);
    expect(txt).toMatch(/^\d{2}:\d{2} {2}\[REQUIERE HUMANO\] {2}Decisión: .*Lo decidió: proveedor de TI/m);
    expect(txt).toMatch(/Tipo de incidente: Parece un secuestro de archivos \(ransomware\) \[SIN VERIFICAR\]/);
    expect(txt).toMatch(/Minutos al primer paso: 5/);
    expect(txt).toMatch(/Decisiones enviadas a humano: 1/);
    expect(txt).toMatch(/Decisiones con candado todavía abiertas: 3/);
  });

  it("'Borrar todo' empties storage and disables the download", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(true);
    iniciar({ ts: Date.now(), type: "ransomware", source: "simulado", redacted: false });
    render(<PlanView />);
    await userEvent.click(screen.getAllByRole("checkbox")[0]);
    await userEvent.click(screen.getByRole("button", { name: "Borrar todo" }));

    expect(Object.keys(localStorage).filter((k) => k.startsWith("p24:"))).toEqual([]);
    expect(localStorage.length).toBe(0);
    expect(screen.getByRole("button", { name: "Descargar mi bitácora" })).toBeDisabled();
    expect(screen.getByText(/Borraste todo/)).toBeInTheDocument();
  });

  it("'Borrar todo' does nothing if the person cancels", async () => {
    vi.spyOn(window, "confirm").mockReturnValue(false);
    iniciar({ ts: Date.now(), type: "ransomware", source: "simulado", redacted: false });
    render(<PlanView />);
    await userEvent.click(screen.getByRole("button", { name: "Borrar todo" }));
    expect(leer()).toHaveLength(1);
  });
});

describe("DmarcCard", () => {
  it.each(["reject", "quarantine", "none", "sin_registro"] as const)(
    "policy %s renders CONFIRMADO, describes the record and never says protegido",
    async (policy) => {
      vi.stubGlobal(
        "fetch",
        vi.fn(async () =>
          Response.json({
            domain: "sat.gob.mx",
            policy,
            dmarc: policy === "sin_registro" ? null : `v=DMARC1; p=${policy}`,
            spf: "v=spf1 -all",
            spfConsultado: true,
          }),
        ),
      );
      render(<DmarcCard />);
      await userEvent.type(screen.getByLabelText("Dominio de tu correo"), "sat.gob.mx");
      await userEvent.click(screen.getByRole("button", { name: "Revisar" }));
      const r = await screen.findByTestId("dmarc-resultado");
      expect(within(r).getByText("CONFIRMADO")).toBeInTheDocument();
      expect(r).toHaveTextContent("Esto es un solo dato. No dice si tu negocio está bien o mal en lo demás.");
      expect(r.textContent).not.toMatch(/proteg|segur|a salvo|garantiz/i);
      const [entrada] = leer();
      expect(entrada).toMatchObject({ kind: "dmarc", estado: "CONFIRMADO" });
    },
  );

  it("no_se_pudo renders DESCONOCIDO", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ domain: "sat.gob.mx", policy: "no_se_pudo", dmarc: null, spf: null, spfConsultado: false }),
      ),
    );
    render(<DmarcCard />);
    await userEvent.type(screen.getByLabelText("Dominio de tu correo"), "sat.gob.mx");
    await userEvent.click(screen.getByRole("button", { name: "Revisar" }));
    const r = await screen.findByTestId("dmarc-resultado");
    expect(within(r).getByText("DESCONOCIDO")).toBeInTheDocument();
    expect(within(r).queryByText("CONFIRMADO")).toBeNull();
    expect(leer()[0]).toMatchObject({ kind: "dmarc", estado: "DESCONOCIDO" });
  });

  it("shows the server's Spanish error for a bad domain", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ error: "Eso no parece un dominio. Escribe algo como clinica-ejemplo.mx" }, { status: 400 }),
      ),
    );
    render(<DmarcCard />);
    await userEvent.type(screen.getByLabelText("Dominio de tu correo"), "not a domain");
    await userEvent.click(screen.getByRole("button", { name: "Revisar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("no parece un dominio");
    expect(leer()).toHaveLength(0);
  });

  it("is offered on the email and bank plans, not on ransomware or Evidence Mode", () => {
    for (const [type, esperado] of [
      ["correo", true],
      ["banco", true],
      ["ransomware", false],
      ["no_claro", false],
    ] as const) {
      localStorage.clear();
      iniciar({ ts: Date.now(), type, source: "simulado", redacted: false });
      const { unmount } = render(<PlanView />);
      expect(screen.queryByTestId("dmarc-card") !== null).toBe(esperado);
      unmount();
    }
  });
});
