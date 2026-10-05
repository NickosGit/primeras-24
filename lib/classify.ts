import { normalizar } from "@/lib/guard";

export const INCIDENT_TYPES = ["ransomware", "correo", "banco", "no_claro"] as const;
export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const isIncidentType = (v: unknown): v is IncidentType =>
  typeof v === "string" && (INCIDENT_TYPES as readonly string[]).includes(v);

// Strong keywords only. A weak hint ("la compu está rara") never picks a protocol.
// Patterns run on lowercase text without accents.
const FUERTES: Record<Exclude<IncidentType, "no_claro">, RegExp[]> = {
  ransomware: [
    /\b(bitcoins?|btc|criptomonedas?|monero|ransomware|ransom|rescate)\b/,
    /\b(cifrad\w*|encriptad\w*|cifraron|encriptaron|encriptado|bloquearon (los|mis|nuestros) archivos)\b/,
    /\bsecuestr\w*\s+(de\s+|los\s+|mis\s+|nuestros\s+)?(archivos|informacion|datos|expedientes|computadoras?|compus?)\b/,
    /\.(lock|locked|encrypted|crypt|crypted)\b/,
    /\bpantalla\b.{0,60}\b(pide|piden|exige|exigen|pidiendo)\b.{0,20}\b(pago|dinero|depositar)\b/,
  ],
  correo: [
    /\bcorreos?\b.{0,40}\b(mios|mio|mias|a mi nombre|en mi nombre|de mi parte|desde mi cuenta|desde mi correo|con mi nombre)\b/,
    /\b(hackearon|robaron|entraron a|se metieron a|tomaron|me quitaron|no puedo entrar a|no puedo abrir|cambiaron la (contrasena|clave) de|bloquearon)\s+(mi|el|nuestro)\s+(correo|email|e-mail|mail|gmail|outlook|hotmail|cuenta de correo)\b/,
    /\b(gmail|outlook|hotmail|email|e-mail)\b.{0,40}\b(hackearon|hackeado|robaron|entraron|no puedo entrar|suplant\w*)\b/,
    /\b(reglas? de reenvio|reenvia mis correos|reenviando mis correos)\b/,
    /\b(suplantan|suplantaron|se hacen pasar por mi)\b/,
  ],
  banco: [
    /\b(transferencias?|cargos?|retiros?|compras?|movimientos?|depositos?)\s+(que\s+)?(yo\s+)?no\s+(autorice|reconozco|hice|realice|pedi)\b/,
    /\b(cargos?|movimientos?|retiros?|compras?)\s+(raros|desconocidos|extranos|no reconocidos|que no conozco)\b/,
    /\b(vaciaron|sacaron dinero|robaron dinero|me robaron el dinero|clonaron|tarjeta clonada|banca en linea|app del banco|cuenta bancaria|cuenta del banco|mi banco)\b/,
    /\b(hicieron|hizo|aparecio|aparece|salio)\s+(una\s+|un\s+)?(transferencia|cargo|retiro|spei)\b/,
  ],
};

export function classifyByKeywords(text: string): IncidentType {
  const t = normalizar(text);
  const hits = (Object.keys(FUERTES) as (keyof typeof FUERTES)[]).filter((tipo) =>
    FUERTES[tipo].some((re) => re.test(t)),
  );
  return hits.length === 1 ? hits[0] : "no_claro";
}
