import { describe, expect, it, vi } from "vitest";
import { POST } from "@/app/api/triage/route";

const pedir = (body: unknown) =>
  POST(
    new Request("http://localhost/api/triage", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

const RANSOMWARE =
  "Llegué a la clínica y la compu de recepción tiene una pantalla roja en inglés que pide bitcoins. No abre la agenda ni los expedientes.";

function modeloResponde(salida: unknown) {
  const fetchMock = vi.fn(async () =>
    Response.json({
      candidates: [{ content: { parts: [{ text: JSON.stringify(salida) }] } }],
    }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("POST /api/triage without LLM_API_KEY", () => {
  it("lands the red-bitcoin-screen text on ransomware, simulated", async () => {
    vi.stubEnv("LLM_API_KEY", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await pedir({ text: RANSOMWARE });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({ type: "ransomware", source: "simulado", redacted: false });
    expect(typeof data.summary).toBe("string");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("vague text goes to no_claro with no summary", async () => {
    vi.stubEnv("LLM_API_KEY", "");
    const data = await (await pedir({ text: "algo raro pasa con la compu" })).json();
    expect(data).toEqual({ type: "no_claro", source: "simulado", redacted: false });
  });

  it("rejects a 3-character input in Spanish, before any model call", async () => {
    vi.stubEnv("LLM_API_KEY", "clave-de-prueba");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const res = await pedir({ text: "  hol " });
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/Escribe un poco más/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects more than 600 characters and malformed bodies", async () => {
    expect((await pedir({ text: "a".repeat(601) })).status).toBe(400);
    expect((await pedir("no es json")).status).toBe(400);
    expect((await pedir({ texto: RANSOMWARE })).status).toBe(400);
  });
});

describe("POST /api/triage with a (mocked) LLM", () => {
  it("uses the model's answer when it is valid", async () => {
    vi.stubEnv("LLM_API_KEY", "clave-de-prueba");
    modeloResponde({
      type: "ransomware",
      summary: "La compu de recepción muestra una pantalla roja que pide bitcoins.",
    });
    const data = await (await pedir({ text: RANSOMWARE })).json();
    expect(data).toEqual({
      type: "ransomware",
      summary: "La compu de recepción muestra una pantalla roja que pide bitcoins.",
      source: "ia",
      redacted: false,
    });
  });

  it("sends only redacted text to the model and tells the UI", async () => {
    vi.stubEnv("LLM_API_KEY", "clave-de-prueba");
    const fetchMock = modeloResponde({ type: "correo", summary: "No puedes entrar a tu correo." });
    const data = await (
      await pedir({ text: "hackearon mi correo, mi contraseña es Gato2024! y ya no sirve" })
    ).json();
    expect(data.redacted).toBe(true);
    const [, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    const enviado = String(init.body);
    expect(enviado).toContain("[DATO OCULTO]");
    expect(enviado).not.toContain("Gato2024");
  });

  it.each([
    "comparte tu contraseña",
    "instala AnyDesk",
    "paga el rescate",
    "fue tu exempleado",
    "ya estás protegida",
  ])("falls back when the model output says %s", async (malo) => {
    vi.stubEnv("LLM_API_KEY", "clave-de-prueba");
    modeloResponde({ type: "ransomware", summary: `Tu compu está bloqueada. ${malo}.` });
    const data = await (await pedir({ text: RANSOMWARE })).json();
    expect(data.source).toBe("simulado");
    expect(data.summary).not.toMatch(new RegExp(malo, "i"));
  });

  it("falls back when the model returns an invalid type or broken JSON", async () => {
    vi.stubEnv("LLM_API_KEY", "clave-de-prueba");
    modeloResponde({ type: "phishing", summary: "x" });
    expect((await (await pedir({ text: RANSOMWARE })).json()).source).toBe("simulado");

    vi.stubGlobal("fetch", vi.fn(async () => new Response("{roto", { status: 200 })));
    expect((await (await pedir({ text: RANSOMWARE })).json()).source).toBe("simulado");

    vi.stubGlobal("fetch", vi.fn(async () => new Response("", { status: 500 })));
    expect((await (await pedir({ text: RANSOMWARE })).json()).source).toBe("simulado");

    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("sin red"))));
    expect((await (await pedir({ text: RANSOMWARE })).json()).source).toBe("simulado");
  });

  it("drops the summary when the model says no_claro", async () => {
    vi.stubEnv("LLM_API_KEY", "clave-de-prueba");
    modeloResponde({ type: "no_claro", summary: "Algo raro pasa con tu compu." });
    const data = await (await pedir({ text: "algo raro pasa con la compu" })).json();
    expect(data).toEqual({ type: "no_claro", source: "ia", redacted: false });
  });

  it("never logs the request body", async () => {
    vi.stubEnv("LLM_API_KEY", "clave-de-prueba");
    const espias = (["log", "info", "warn", "error", "debug"] as const).map((m) =>
      vi.spyOn(console, m).mockImplementation(() => {}),
    );
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new Error("sin red"))));
    await pedir({ text: RANSOMWARE });
    for (const espia of espias) expect(espia).not.toHaveBeenCalled();
  });
});
