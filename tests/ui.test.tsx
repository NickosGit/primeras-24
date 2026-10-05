// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));

import { DescribeForm } from "@/components/DescribeForm";
import { PlanView } from "@/components/PlanView";
import { GatedStep } from "@/components/GatedStep";
import { protocolos } from "@/data/protocols";
import { CASO_KEY, iniciar, leer, type Caso } from "@/lib/bitacora";

beforeEach(() => {
  localStorage.clear();
  push.mockReset();
});
afterEach(cleanup);

const caso = (c: Partial<Caso>): Caso => ({
  ts: Date.now(),
  type: "ransomware",
  source: "simulado",
  redacted: false,
  ...c,
});

describe("describe screen", () => {
  it("shows the acknowledgement before the fetch resolves", async () => {
    const fetchMock = vi.fn(() => new Promise<Response>(() => {})); // never resolves
    vi.stubGlobal("fetch", fetchMock);
    render(<DescribeForm />);
    await userEvent.type(
      screen.getByRole("textbox"),
      "la compu de recepción tiene una pantalla roja que pide bitcoins",
    );
    await userEvent.click(screen.getByRole("button", { name: "Dime qué hago ahora" }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("acuse")).toHaveTextContent(/Recibido \d{2}:\d{2}\. Vamos paso a paso\./);
    expect(push).not.toHaveBeenCalled();
  });

  it("rejects a 3-character input in Spanish and sends nothing", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    render(<DescribeForm />);
    await userEvent.type(screen.getByRole("textbox"), "hol");
    await userEvent.click(screen.getByRole("button", { name: "Dime qué hago ahora" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Escribe un poco más");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("stores the triage result and goes to the plan", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({ type: "correo", summary: "x", source: "simulado", redacted: false }),
      ),
    );
    render(<DescribeForm />);
    await userEvent.click(screen.getByRole("button", { name: /Mis pacientes recibieron/ }));
    await userEvent.click(screen.getByRole("button", { name: "Dime qué hago ahora" }));
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/plan"));
    expect(JSON.parse(localStorage.getItem(CASO_KEY)!).type).toBe("correo");
    expect(leer()[0].kind).toBe("inicio");
  });

  it("falls back to on-device keywords when the network fails", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("sin red"))));
    render(<DescribeForm />);
    await userEvent.type(screen.getByRole("textbox"), "hicieron una transferencia que no autoricé");
    await userEvent.click(screen.getByRole("button", { name: "Dime qué hago ahora" }));
    await vi.waitFor(() => expect(push).toHaveBeenCalledWith("/plan"));
    expect(JSON.parse(localStorage.getItem(CASO_KEY)!)).toMatchObject({
      type: "banco",
      source: "simulado",
    });
  });
});

describe("plan screen", () => {
  it("ransomware: chip SIN VERIFICAR and badge SIMULADO", () => {
    iniciar(caso({ type: "ransomware", summary: "resumen fijo" }));
    render(<PlanView />);
    const clasif = screen.getByTestId("clasificacion");
    expect(clasif).toHaveTextContent("Parece un secuestro de archivos (ransomware)");
    expect(within(clasif).getAllByText("SIN VERIFICAR").length).toBeGreaterThan(0);
    expect(within(clasif).getByText("SIMULADO")).toBeInTheDocument();
    expect(screen.getAllByRole("checkbox")[0]).toHaveAccessibleName(
      /Desconecta esa compu del internet/,
    );
    expect(screen.getByText(/Se deshace reconectando/)).toBeInTheDocument();
    expect(screen.getAllByTestId("gated-step")).toHaveLength(4);
  });

  it("IA source shows the fallibility label instead of SIMULADO", () => {
    iniciar(caso({ type: "correo", summary: "No puedes entrar a tu correo.", source: "ia" }));
    render(<PlanView />);
    const clasif = screen.getByTestId("clasificacion");
    expect(clasif).toHaveTextContent("Clasificación hecha por IA, puede equivocarse");
    expect(within(clasif).queryByText("SIMULADO")).toBeNull();
  });

  it("vague text: Evidence Mode, chip DESCONOCIDO, no protocol, escalation card", () => {
    iniciar(caso({ type: "no_claro" }));
    render(<PlanView />);
    expect(screen.getByTestId("evidence-mode")).toBeInTheDocument();
    expect(within(screen.getByTestId("clasificacion")).getByText("DESCONOCIDO")).toBeInTheDocument();
    expect(screen.queryAllByTestId("gated-step")).toHaveLength(0);
    expect(screen.queryByText(/Desconecta esa compu/)).toBeNull();
    const esc = screen.getByTestId("escalamiento");
    expect(within(esc).getAllByText("REQUIERE HUMANO")).toHaveLength(3);
    expect(within(esc).getByRole("link", { name: "Llamar al 088" })).toHaveAttribute("href", "tel:088");
  });

  it("shows the redaction notice when something was hidden", () => {
    iniciar(caso({ redacted: true }));
    render(<PlanView />);
    expect(screen.getByText(/Quitamos de tu texto algo que parecía una contraseña/)).toBeInTheDocument();
  });

  it("ticking a step writes a timestamped bitácora entry", async () => {
    iniciar(caso({ type: "ransomware" }));
    render(<PlanView />);
    await userEvent.click(screen.getAllByRole("checkbox")[0]);
    expect(screen.getAllByRole("checkbox")[0]).toBeChecked();
    expect(leer().filter((e) => e.kind === "paso")).toHaveLength(1);
    expect(screen.getByText(/^Hecho \d{2}:\d{2}/)).toBeInTheDocument();
  });
});

describe("gated step", () => {
  const paso = protocolos.ransomware.find((p) => p.id === "ran-gate-herramienta")!;

  it("renders no checkbox and cannot be saved without a role", async () => {
    render(<GatedStep paso={paso} />);
    expect(screen.queryByRole("checkbox")).toBeNull();
    expect(screen.getByText("REQUIERE HUMANO")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: /Anotar quién lo decidió/ }));
    await userEvent.type(screen.getByLabelText(/Nombre/), "Persona de prueba");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));

    expect(screen.getByRole("alert")).toHaveTextContent("Elige quién lo decidió");
    expect(leer()).toHaveLength(0);
  });

  it("records the decision with the role once one is chosen", async () => {
    render(<GatedStep paso={paso} />);
    await userEvent.click(screen.getByRole("button", { name: /Anotar quién lo decidió/ }));
    await userEvent.selectOptions(screen.getByLabelText("¿Quién lo decidió?"), "especialista en ciberseguridad");
    await userEvent.click(screen.getByRole("button", { name: "Guardar" }));
    const [d] = leer();
    expect(d).toMatchObject({ kind: "decision", estado: "REQUIERE_HUMANO", ref: paso.id });
    expect(d.text).toContain("Lo decidió: especialista en ciberseguridad");
  });
});
