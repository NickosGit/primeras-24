import { z } from "zod";
import { copy } from "@/data/copy";

// POST {domain} -> {domain, policy, dmarc, spf}
// A real check over public DNS (DNS-over-HTTPS, no key). Its result is the only
// thing in the app that may be shown as CONFIRMADO. It describes the record,
// never whether the business is "safe".

const DOH = "https://dns.google/resolve";
const TIMEOUT_MS = 5000;

export type Politica = "reject" | "quarantine" | "none" | "sin_registro" | "no_se_pudo";

export type DmarcRespuesta = {
  domain: string;
  policy: Politica;
  dmarc: string | null;
  spf: string | null;
  spfConsultado: boolean;
};

// At least two labels, letters-only TLD, each label 1-63 chars without edge hyphens.
const HOSTNAME = /^(?=.{4,253}$)(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/;

export function normalizarDominio(entrada: string): string | null {
  let d = entrada.trim().toLowerCase();
  d = d.replace(/^[a-z][a-z0-9+.-]*:\/\//, ""); // protocol
  d = d.replace(/[/?#].*$/, ""); // path, query, fragment
  d = d.replace(/^[^@]*@/, ""); // "alguien@clinica.mx" -> "clinica.mx"
  d = d.replace(/\.$/, "");
  if (d.length > 253 || !HOSTNAME.test(d)) return null;
  return d;
}

const Entrada = z.object({
  domain: z.string().max(300).transform((v, ctx) => {
    const d = normalizarDominio(v);
    if (!d) {
      ctx.addIssue({ code: "custom", message: copy.dmarc.errorDominio });
      return z.NEVER;
    }
    return d;
  }),
});

type DohRespuesta = { Status?: number; Answer?: { type?: number; data?: string }[] };

async function txt(nombre: string): Promise<{ ok: boolean; registros: string[] }> {
  try {
    const url = `${DOH}?name=${encodeURIComponent(nombre)}&type=TXT`;
    const res = await fetch(url, {
      headers: { accept: "application/dns-json" },
      signal: AbortSignal.timeout(TIMEOUT_MS),
      cache: "no-store",
    });
    if (!res.ok) return { ok: false, registros: [] };
    const data = (await res.json()) as DohRespuesta;
    // 0 = NOERROR, 3 = NXDOMAIN (the name does not exist: no record, not an error)
    if (data.Status !== 0 && data.Status !== 3) return { ok: false, registros: [] };
    const registros = (data.Answer ?? [])
      .filter((a) => a.type === 16 && typeof a.data === "string")
      // TXT data comes quoted and may be split in chunks: "v=DMARC1; p=" "reject"
      .map((a) => a.data!.replace(/"\s*"/g, "").replace(/^"|"$/g, "").trim());
    return { ok: true, registros };
  } catch {
    return { ok: false, registros: [] };
  }
}

export function politicaDe(registro: string | null): Politica {
  if (!registro) return "sin_registro";
  const p = /(?:^|;)\s*p\s*=\s*([a-z]+)/i.exec(registro)?.[1]?.toLowerCase();
  return p === "reject" || p === "quarantine" || p === "none" ? p : "none";
}

export async function POST(request: Request) {
  let cuerpo: unknown;
  try {
    cuerpo = await request.json();
  } catch {
    return Response.json({ error: copy.dmarc.errorDominio }, { status: 400 });
  }
  const entrada = Entrada.safeParse(cuerpo);
  if (!entrada.success) {
    return Response.json({ error: copy.dmarc.errorDominio }, { status: 400 });
  }
  const domain = entrada.data.domain;

  const [d, s] = await Promise.all([txt(`_dmarc.${domain}`), txt(domain)]);
  const dmarc = d.registros.find((r) => /^v\s*=\s*dmarc1\b/i.test(r)) ?? null;
  const spf = s.registros.find((r) => /^v\s*=\s*spf1\b/i.test(r)) ?? null;

  const cuerpoRespuesta: DmarcRespuesta = {
    domain,
    policy: d.ok ? politicaDe(dmarc) : "no_se_pudo",
    dmarc,
    spf,
    spfConsultado: s.ok,
  };
  return Response.json(cuerpoRespuesta, { headers: { "cache-control": "no-store" } });
}
