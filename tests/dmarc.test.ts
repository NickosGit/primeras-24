import { describe, expect, it, vi } from "vitest";
import { POST, normalizarDominio, politicaDe } from "@/app/api/dmarc/route";

const pedir = (body: unknown) =>
  POST(
    new Request("http://localhost/api/dmarc", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );

const doh = (status: number, answers: string[] = []) =>
  Response.json({ Status: status, Answer: answers.map((data) => ({ type: 16, data })) });

function dnsFalso(registros: Record<string, Response | Error>) {
  const fetchMock = vi.fn(async (url: string | URL) => {
    const nombre = new URL(String(url)).searchParams.get("name")!;
    const r = registros[nombre];
    if (r instanceof Error) throw r;
    return (r ?? doh(3)).clone();
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

describe("normalizarDominio", () => {
  it.each([
    ["sat.gob.mx", "sat.gob.mx"],
    ["  SAT.GOB.MX  ", "sat.gob.mx"],
    ["https://www.banxico.org.mx/inicio?x=1", "www.banxico.org.mx"],
    ["clinica-ejemplo.mx/", "clinica-ejemplo.mx"],
    ["recepcion@clinica-ejemplo.mx", "clinica-ejemplo.mx"],
    ["clinica-ejemplo.mx.", "clinica-ejemplo.mx"],
  ])("%s -> %s", (entrada, salida) => {
    expect(normalizarDominio(entrada)).toBe(salida);
  });

  it.each([
    "not a domain",
    "http://x/../etc",
    "localhost",
    "x",
    "-malo.mx",
    "malo-.mx",
    "a..b.mx",
    "127.0.0.1",
    "sat.gob.mx&type=A",
    "dominio con espacios.mx",
    `${"a".repeat(64)}.mx`,
    `${"a.".repeat(130)}mx`,
    "",
  ])("rejects %j", (entrada) => {
    expect(normalizarDominio(entrada)).toBeNull();
  });
});

describe("POST /api/dmarc validation", () => {
  it.each(["not a domain", "http://x/../etc", "", "localhost"])(
    "rejects %j with 400 and makes no outbound fetch",
    async (domain) => {
      const fetchMock = vi.fn();
      vi.stubGlobal("fetch", fetchMock);
      const res = await pedir({ domain });
      expect(res.status).toBe(400);
      expect((await res.json()).error).toMatch(/no parece un dominio/);
      expect(fetchMock).not.toHaveBeenCalled();
    },
  );

  it("rejects non-string and malformed bodies without fetching", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    expect((await pedir({ domain: 42 })).status).toBe(400);
    expect((await pedir("{")).status).toBe(400);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("POST /api/dmarc lookup", () => {
  it("reads p=reject and the SPF record", async () => {
    const fetchMock = dnsFalso({
      "_dmarc.clinica-ejemplo.mx": doh(0, ['"v=DMARC1; p=reject; rua=mailto:dmarc@clinica-ejemplo.mx"']),
      "clinica-ejemplo.mx": doh(0, ['"google-site-verification=abc"', '"v=spf1 include:_spf.google.com ~all"']),
    });
    const data = await (await pedir({ domain: "https://clinica-ejemplo.mx/contacto" })).json();
    expect(data).toEqual({
      domain: "clinica-ejemplo.mx",
      policy: "reject",
      dmarc: "v=DMARC1; p=reject; rua=mailto:dmarc@clinica-ejemplo.mx",
      spf: "v=spf1 include:_spf.google.com ~all",
      spfConsultado: true,
    });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(String(fetchMock.mock.calls[0][0])).toMatch(/^https:\/\/dns\.google\/resolve\?/);
  });

  it("joins TXT records split into chunks", async () => {
    dnsFalso({ "_dmarc.clinica-ejemplo.mx": doh(0, ['"v=DMARC1; p=" "quarantine; pct=100"']) });
    expect((await (await pedir({ domain: "clinica-ejemplo.mx" })).json()).policy).toBe("quarantine");
  });

  it("NXDOMAIN or no DMARC record -> sin_registro", async () => {
    dnsFalso({ "_dmarc.clinica-ejemplo.mx": doh(3) });
    const data = await (await pedir({ domain: "clinica-ejemplo.mx" })).json();
    expect(data).toMatchObject({ policy: "sin_registro", dmarc: null, spf: null });
  });

  it("network failure or SERVFAIL -> no_se_pudo", async () => {
    dnsFalso({ "_dmarc.clinica-ejemplo.mx": new Error("timeout") });
    expect((await (await pedir({ domain: "clinica-ejemplo.mx" })).json()).policy).toBe("no_se_pudo");
    dnsFalso({ "_dmarc.clinica-ejemplo.mx": doh(2) });
    expect((await (await pedir({ domain: "clinica-ejemplo.mx" })).json()).policy).toBe("no_se_pudo");
  });

  it("politicaDe reads the p tag only", () => {
    expect(politicaDe("v=DMARC1; sp=reject; p=none")).toBe("none");
    expect(politicaDe("v=DMARC1;p=REJECT")).toBe("reject");
    expect(politicaDe(null)).toBe("sin_registro");
  });
});

// Real DNS. Runs only with RUN_LIVE=1 so the suite works offline.
describe.runIf(process.env.RUN_LIVE === "1")("live DNS", () => {
  it.each(["sat.gob.mx", "banxico.org.mx"])("%s returns a real DMARC record", async (domain) => {
    const data = await (await pedir({ domain })).json();
    expect(data.policy).toMatch(/^(reject|quarantine|none)$/);
    expect(data.dmarc).toMatch(/^v=DMARC1/i);
  }, 15000);
});
