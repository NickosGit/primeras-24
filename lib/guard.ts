// Shadow Clause guard (Condition 2). Pure functions, no I/O.
//
// redactSecrets runs on what the user typed, before anything leaves the route.
// violatesShadow runs on what the model wrote, before anything reaches the screen.

export const OCULTO = "[DATO OCULTO]";

// Words that usually follow "clave"/"contraseña" in a normal sentence
// ("me cambiaron la clave de mi correo"). Only skipped when there is no "es" or ":".
const PALABRAS_COMUNES = new Set([
  "de", "del", "la", "el", "los", "las", "mi", "mis", "tu", "tus", "su", "sus",
  "y", "o", "que", "no", "se", "a", "al", "en", "para", "por", "con", "sin",
  "un", "una", "nueva", "nuevo", "anterior", "vieja", "ya", "me", "le", "lo",
  "ni", "pero", "porque", "cuando", "como", "son", "fue", "era", "esta", "está",
]);

const SECRETO =
  /\b(contrase[ñn]as?|claves?|passwords?|pass|nip)\b(\s*[:=]\s*|\s+(?:es|son|era)\s*:?\s*|\s+)([^\s,;]+)/giu;

// 18-digit CLABE first, then 16-digit card numbers (spaces or dashes allowed).
const CLABE = /\b(?:\d[ -]?){17}\d\b/g;
const TARJETA = /\b(?:\d[ -]?){15}\d\b/g;

export function redactSecrets(text: string): { clean: string; redacted: boolean } {
  let redacted = false;

  let clean = text.replace(SECRETO, (todo, palabra: string, sep: string, valor: string) => {
    const explicito = /[:=]|\b(es|son|era)\b/i.test(sep);
    const limpio = valor.replace(/[.!?¡¿)]+$/u, "");
    if (!explicito && PALABRAS_COMUNES.has(limpio.toLowerCase())) return todo;
    if (valor === OCULTO) return todo;
    redacted = true;
    return `${palabra}${sep}${OCULTO}`;
  });

  clean = clean.replace(CLABE, () => {
    redacted = true;
    return OCULTO;
  });
  clean = clean.replace(TARJETA, () => {
    redacted = true;
    return OCULTO;
  });

  return { clean, redacted };
}

export const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Each pattern runs on lowercase text without accents.
// `negable` patterns are ignored when "no / nunca / ni / jamas" comes right before
// ("no pagues", "nunca compartas tu clave" are safe advice, not violations).
type Regla = { motivo: string; re: RegExp; negable: boolean };

const REGLAS: Regla[] = [
  // 1. Asks the user to share a password or a code.
  {
    motivo: "pide contraseña o código",
    re: /\b(comparte|compartenos|compartir|dame|danos|dime|dinos|enviame|envianos|envia|manda|mandame|mandanos|pasame|pasanos|proporciona|proporcionanos|dicta|dictame|escribe|escribenos|escribela|ingresa|introduce|teclea|pega|confirma|confirmanos)\b(\s+\S+){0,4}?\s+(la\s+|tu\s+|el\s+|tus\s+)?(contrasenas?|claves?|passwords?|nip|pin|codigos?|token|contrasena)\b/,
    negable: true,
  },
  // 2. Remote tools or installing software.
  {
    motivo: "acceso remoto",
    re: /\b(anydesk|any desk|teamviewer|team viewer|rustdesk|ultraviewer|supremo|splashtop|logmein|screenconnect|connectwise|vnc|quick ?assist|asistencia rapida|escritorio remoto|acceso remoto|control remoto|chrome remote desktop)\b/,
    negable: false,
  },
  {
    motivo: "instalar software",
    re: /\b(instala|instalar|instale|instalen|descarga e instala|descargar e instalar)\b/,
    negable: true,
  },
  // 3. Pay, transfer, negotiate, buy crypto.
  {
    motivo: "pagar o negociar",
    re: /\b(paga|pagar|pague|paguen|pagale|pagales|pagarle|pagarles|transfiere|transferir|transfiera|transfierele|deposita|depositar|deposite|negocia|negociar|negocie|negocien|regatea|regatear)\b/,
    negable: true,
  },
  {
    motivo: "comprar cripto",
    re: /\b(compra|comprar|compre|consigue|conseguir|adquiere)\b(\s+\S+){0,3}?\s+(bitcoins?|btc|criptomonedas?|cripto|monero|usdt|ethereum)\b/,
    negable: true,
  },
  {
    motivo: "contestar al atacante",
    re: /\b(contesta|contestale|contestales|responde|respondele|respondeles|escribele|escribeles|contacta|contactalos|contactales)\b(\s+\S+){0,3}?\s+(al|a los|a las|con el|con los)?\s*(atacantes?|secuestradores?|delincuentes?|hackers?|extorsionadores?|criminales?)\b/,
    negable: true,
  },
  // 4. Attacking back.
  {
    motivo: "atacar de vuelta",
    re: /\b(contraataca|contraatacar|contraataque|hackealos|hackearlos|hackeales|hackea de vuelta|ataca de vuelta|atacalos|atacarlos|atacar de vuelta|devuelve el ataque|devolver el ataque|vengate|vengarte|tumba su|tumbar su|ddos)\b/,
    negable: true,
  },
  // 5. Attribution: naming, guessing or accusing who did it.
  {
    motivo: "atribuye el ataque",
    re: /\b(seguramente|probablemente|quiza|quizas|tal vez|seguro que|sin duda|de seguro|parece que|creo que|posiblemente)\s+(lo\s+hizo|fue|fueron|lo hicieron)\b/,
    negable: false,
  },
  {
    motivo: "acusa a alguien",
    re: /\b(fue|fueron|lo hizo|lo hicieron)\s+(tu|tus|su|sus|el|la|los|las|un|una|alguien de|alguno de)\s+(ex\s?)?(empleados?|empleadas?|exempleados?|exempleadas?|trabajador\w*|sobrin[oa]s?|proveedor\w*|soci[oa]s?|competencia|competidor\w*|recepcionista|asistente|doctor\w*|pacientes?|vecin[oa]s?|famili\w*|pareja|hackers?|grupos?|bandas?|cartel\w*)\b/,
    negable: false,
  },
  {
    motivo: "nombra culpables",
    re: /\b(el culpable|la culpable|los culpables|el responsable es|los responsables son|detras de (esto|este ataque|el ataque) (esta|estan)|es obra de|lockbit|conti|revil|blackcat|alphv|cl0p|clop|akira|rhysida|ransomhub|lazarus|blackbasta|black basta|play ransomware)\b/,
    negable: false,
  },
  // 6. Publishing or posting about it.
  {
    motivo: "publicar",
    re: /\b(publicalo|publicala|publicarlo|publicarla|postealo|postea|postear|hazlo publico|exhibelo|exhibelos|exhibirlo|denuncialo en redes)\b/,
    negable: true,
  },
  {
    motivo: "publicar en redes",
    re: /\b(publica|publicar|publique|sube|subelo|subir|comparte|compartelo|compartir|avisa|cuenta|escribe)\b(\s+\S+){0,4}?\s+(en|a)\s+(redes|tus redes|redes sociales|facebook|instagram|twitter|tiktok|tu estado|tus estados|grupos de whatsapp|internet)\b/,
    negable: true,
  },
  // 7. Format, reinstall, wipe, restore a backup, run a decryptor.
  {
    motivo: "formatear o borrar",
    re: /\b(formatea|formatear|formatee|formateala|formatealo|formateen|reinstala|reinstalar|reinstale|resetea|resetear|restablece de fabrica|restablecer de fabrica|borra todo|borrar todo|borralo todo|wipe)\b/,
    negable: true,
  },
  {
    motivo: "restaurar respaldo",
    re: /\b(restaura|restaurar|restaure|restauren|recupera|recuperar|carga|cargar|conecta|conectar|usa|usar)\b(\s+\S+){0,4}?\s+(respaldos?|backups?|copia de seguridad|copias de seguridad)\b/,
    negable: true,
  },
  {
    motivo: "correr descifrador",
    re: /\b(usa|usar|corre|correr|ejecuta|ejecutar|descarga|descargar|baja|bajar|prueba|probar|aplica|aplicar|abre|abrir)\b(\s+\S+){0,4}?\s+(\S*descifr\S*|\S*desencript\S*|\S*decrypt\S*|\S*decript\S*)/,
    negable: true,
  },
  // 8. Certainty: "you are safe / protected", "files will be recovered".
  {
    motivo: "promete seguridad",
    re: /\b(segur[oa]s?|protegid[oa]s?|a salvo|fuera de peligro|sin riesgo|garantiz\w*)\b/,
    negable: true,
  },
  {
    motivo: "promete recuperar",
    re: /\b((se|los|las|te)\s+)?(van a|vas a|vamos a|podras|podran|podemos)\s+(recuperar|recuperarlos|recuperarlas|regresar|devolver)\b|\brecuperar(as|emos|an)\b|\bse recuperaran\b/,
    negable: true,
  },
];

const NEGACION = /\b(no|nunca|ni|jamas|tampoco|sin)\b/;

function negado(texto: string, indice: number): boolean {
  const antes = texto.slice(0, indice).trim().split(/\s+/).slice(-3).join(" ");
  return NEGACION.test(antes);
}

/** Returns the first rule the text breaks, or null. */
export function shadowMotivo(text: string): string | null {
  const t = normalizar(text);
  for (const { motivo, re, negable } of REGLAS) {
    const global = new RegExp(re.source, re.flags.includes("g") ? re.flags : re.flags + "g");
    for (const m of t.matchAll(global)) {
      if (negable && negado(t, m.index ?? 0)) continue;
      return motivo;
    }
  }
  return null;
}

export function violatesShadow(text: string): boolean {
  return shadowMotivo(text) !== null;
}
