import type { IncidentType } from "@/lib/classify";

// Static, human-reviewed steps. The LLM never writes steps (Shadow Clause rule 6).
// gate "reversible": bounded, she can do it herself, has a checkbox and an undo line.
// gate "requiere_humano": no checkbox, only "Anotar quién lo decidió" (Condition 3).

export type Caja = "15min" | "1h" | "24h";
export type Gate = "reversible" | "requiere_humano";

export type Paso = {
  id: string;
  box: Caja;
  gate: Gate;
  text: string;
  why: string;
  undo?: string;
  /** First person, past tense, for the summary read to 088 ("Desconecté la compu…"). */
  hecho?: string;
  /** Doing this step produces photos the person can hand over. */
  foto?: true;
  link?: { href: string; label: string; externo?: boolean };
};

export type TipoConProtocolo = Exclude<IncidentType, "no_claro">;

const SIN_CAMBIOS = "No cambia nada en tu equipo.";
const LLAMAR_088 = { href: "tel:088", label: "Llamar al 088" };

export const NO_MORE_RANSOM = "https://www.nomoreransom.org/es/index.html";

export const protocolos: Record<TipoConProtocolo, Paso[]> = {
  ransomware: [
    {
      id: "ran-desconecta",
      box: "15min",
      gate: "reversible",
      text: "Desconecta esa compu del internet: quita el cable o apaga su Wi-Fi. No la apagues.",
      hecho: "Desconecté la compu del internet sin apagarla",
      why: "Así deja de hablar con quien la atacó y de contagiar a otras compus. Si la apagas se puede perder evidencia que un especialista va a necesitar.",
      undo: "Se deshace reconectando el cable o el Wi-Fi.",
    },
    {
      id: "ran-foto",
      box: "15min",
      gate: "reversible",
      text: "Tómale foto a la pantalla con tu celular.",
      hecho: "Le tomé foto a la pantalla",
      foto: true,
      why: "El mensaje en pantalla es evidencia para el 088 y para tu especialista.",
      undo: SIN_CAMBIOS,
    },
    {
      id: "ran-no-pagues",
      box: "15min",
      gate: "reversible",
      text: "No pagues y no le contestes a quien te escribe.",
      hecho: "No he pagado ni le he contestado a quien escribe",
      why: "Pagar no hace que te devuelvan tus archivos y te marca como alguien que sí paga. Contestar les da información.",
      undo: SIN_CAMBIOS,
    },
    {
      id: "ran-respaldo",
      box: "15min",
      gate: "reversible",
      text: "No conectes tu disco de respaldo a esa compu.",
      hecho: "No conecté el disco de respaldo a esa compu",
      why: "Si lo conectas, el ataque también puede bloquear tu respaldo, que quizá es tu mejor copia.",
      undo: SIN_CAMBIOS,
    },
    {
      id: "ran-claves",
      box: "15min",
      gate: "reversible",
      text: "Desde tu celular, cambia la clave de tu correo y de tu banco, y activa la verificación en dos pasos.",
      hecho: "Desde mi celular cambié la clave de mi correo y de mi banco, con verificación en dos pasos",
      why: "Si esa compu tenía tus claves guardadas, quien la atacó podría tenerlas. Hazlo desde otro aparato, nunca desde esa compu.",
      undo: "Puedes volver a cambiar tus claves cuando quieras.",
    },
    {
      id: "ran-anota",
      box: "1h",
      gate: "reversible",
      text: "Anota qué programas y archivos dejaron de abrir, y desde qué hora.",
      hecho: "Anoté qué programas y archivos dejaron de abrir y desde qué hora",
      why: "Es lo primero que te van a preguntar el 088 y tu especialista.",
      undo: SIN_CAMBIOS,
    },
    {
      id: "ran-088",
      box: "1h",
      gate: "reversible",
      text: "Llama al 088 con tu resumen a la mano.",
      hecho: "Llamé al 088",
      why: "Es la línea oficial para reportar delitos en internet. Ahí te orientan para levantar tu reporte.",
      undo: SIN_CAMBIOS,
      link: LLAMAR_088,
    },
    {
      id: "ran-nomoreransom",
      box: "24h",
      gate: "reversible",
      text: "Busca en No More Ransom si existe una llave gratis para tu caso. Solo mira: no descargues ni uses nada todavía.",
      hecho: "Busqué en No More Ransom, sin descargar ni usar nada",
      why: "Es un sitio de Europol y empresas de ciberseguridad con llaves gratuitas. Usar una es otra decisión, y se toma con un especialista.",
      undo: SIN_CAMBIOS,
      link: { href: NO_MORE_RANSOM, label: "Abrir No More Ransom", externo: true },
    },
    {
      id: "ran-gate-herramienta",
      box: "24h",
      gate: "requiere_humano",
      text: "Usar una herramienta para desbloquear archivos",
      why: "Una herramienta equivocada puede dañar los archivos para siempre.",
    },
    {
      id: "ran-gate-restaurar",
      box: "24h",
      gate: "requiere_humano",
      text: "Restaurar desde el respaldo, reinstalar o formatear la computadora",
      why: "Borra evidencia y, si el ataque sigue ahí, puede alcanzar también tu respaldo.",
    },
    {
      id: "ran-gate-datos",
      box: "24h",
      gate: "requiere_humano",
      text: "Decidir si se llevaron datos de pacientes",
      why: "Saberlo requiere revisar la compu por dentro. Por lo que se ve en pantalla, nadie puede saberlo.",
    },
    {
      id: "ran-gate-avisar",
      box: "24h",
      gate: "requiere_humano",
      text: "Avisar a pacientes o a alguna autoridad sobre sus datos",
      why: "Tiene consecuencias legales. Se decide con un abogado o un especialista.",
    },
  ],

  correo: [
    {
      id: "cor-clave",
      box: "15min",
      gate: "reversible",
      text: "Desde otro aparato, cambia la clave de tu correo y cierra todas las sesiones abiertas.",
      hecho: "Cambié la clave de mi correo desde otro aparato y cerré todas las sesiones",
      why: "Así sacas a quien entró. Usa un aparato distinto al que crees que tiene problema.",
      undo: "Puedes volver a cambiar tu clave cuando quieras.",
    },
    {
      id: "cor-dos-pasos",
      box: "15min",
      gate: "reversible",
      text: "Activa la verificación en dos pasos en tu correo.",
      hecho: "Activé la verificación en dos pasos en mi correo",
      why: "Aunque alguien tenga tu clave, sin el código que llega a tu celular no puede entrar.",
      undo: "Se puede desactivar desde la configuración de tu correo.",
    },
    {
      id: "cor-no-pagues",
      box: "15min",
      gate: "reversible",
      text: "No pagues y no le contestes a nadie que te pida dinero por esto.",
      hecho: "No he pagado ni le he contestado a quien pide dinero",
      why: "Quien entra a un correo a veces pide dinero para devolverlo o para no publicar nada. Pagar no lo detiene.",
      undo: SIN_CAMBIOS,
    },
    {
      id: "cor-reglas",
      box: "1h",
      gate: "reversible",
      text: "Revisa las reglas de reenvío y los filtros de tu correo. Tómale foto a cualquiera que tú no creaste, sin tocarla.",
      hecho: "Revisé las reglas de reenvío y les tomé foto a las que no creé",
      foto: true,
      why: "Quien entra a un correo suele dejar una regla que le copia tus correos. La foto es evidencia; quitarla es otra decisión.",
      undo: SIN_CAMBIOS,
    },
    {
      id: "cor-contactos",
      box: "1h",
      gate: "reversible",
      text: "Llama a tus contactos frecuentes y diles que no hagan caso a correos recientes tuyos que pidan dinero o datos.",
      hecho: "Avisé por teléfono a mis contactos que no hagan caso a correos recientes",
      why: "Así nadie actúa por un correo falso. Avísales por teléfono, no por correo.",
      undo: SIN_CAMBIOS,
    },
    {
      id: "cor-revision",
      box: "1h",
      gate: "reversible",
      text: "Revisa si se pueden mandar correos falsos a tu nombre (más abajo).",
      hecho: "Revisé si se pueden mandar correos falsos a mi nombre",
      why: "Es una consulta pública a tu dominio. Dice si tu correo publica una regla contra correos falsos.",
      undo: SIN_CAMBIOS,
      link: { href: "#revisar-correo", label: "Ir a la revisión" },
    },
    {
      id: "cor-088",
      box: "1h",
      gate: "reversible",
      text: "Llama al 088 con tu resumen a la mano.",
      hecho: "Llamé al 088",
      why: "Es la línea oficial para reportar delitos en internet. Ahí te orientan para levantar tu reporte.",
      undo: SIN_CAMBIOS,
      link: LLAMAR_088,
    },
    {
      id: "cor-gate-borrar",
      box: "24h",
      gate: "requiere_humano",
      text: "Borrar reglas, correos o cuentas",
      why: "Borrar puede destruir la evidencia de lo que hizo quien entró.",
    },
    {
      id: "cor-gate-leyo",
      box: "24h",
      gate: "requiere_humano",
      text: "Decidir qué leyó o se llevó quien entró",
      why: "Requiere revisar los registros de la cuenta con alguien que sepa leerlos.",
    },
    {
      id: "cor-gate-aviso",
      box: "24h",
      gate: "requiere_humano",
      text: "Mandar un aviso formal a pacientes, proveedores o autoridades",
      why: "Tiene consecuencias legales. Se decide con un abogado.",
    },
  ],

  banco: [
    {
      id: "ban-llama",
      box: "15min",
      gate: "reversible",
      text: "Llama a tu banco al número impreso atrás de tu tarjeta.",
      hecho: "Llamé a mi banco al número de mi tarjeta",
      why: "Es el número real de tu banco. Los que llegan por mensaje pueden ser falsos.",
      undo: SIN_CAMBIOS,
    },
    {
      id: "ban-bloqueo",
      box: "15min",
      gate: "reversible",
      text: "Pídeles que bloqueen la tarjeta o la cuenta afectada.",
      hecho: "Pedí que bloquearan la tarjeta o la cuenta",
      why: "Detiene nuevos cargos mientras se aclara lo que pasó.",
      undo: "El banco la reactiva cuando se lo pidas.",
    },
    {
      id: "ban-folio",
      box: "15min",
      gate: "reversible",
      text: "Anota el número de folio que te den.",
      hecho: "Anoté el folio que me dio el banco",
      why: "Con ese folio das seguimiento a tu aclaración.",
      undo: SIN_CAMBIOS,
    },
    {
      id: "ban-no-llames",
      box: "15min",
      gate: "reversible",
      text: "No llames a ningún número que te llegó por mensaje, correo o WhatsApp.",
      hecho: "No he llamado a números que llegaron por mensaje",
      why: "Los fraudes suelen mandar un número falso de \"tu banco\" para terminar de robar.",
      undo: SIN_CAMBIOS,
    },
    {
      id: "ban-no-pagues",
      box: "15min",
      gate: "reversible",
      text: "No pagues ni mandes dinero a nadie que te ofrezca arreglarlo.",
      hecho: "No le he pagado a nadie que ofrezca arreglarlo",
      why: "Quien te ofrece recuperar tu dinero a cambio de un pago suele ser parte del fraude.",
      undo: SIN_CAMBIOS,
    },
    {
      id: "ban-clave",
      box: "1h",
      gate: "reversible",
      text: "Cambia tu clave de la banca en línea desde un aparato distinto al que crees que tiene problema.",
      hecho: "Cambié la clave de la banca en línea desde otro aparato",
      why: "Si alguien vio tu clave, deja de servirle.",
      undo: "Puedes volver a cambiarla cuando quieras.",
    },
    {
      id: "ban-088",
      box: "1h",
      gate: "reversible",
      text: "Llama al 088 con tu folio y tu resumen a la mano.",
      hecho: "Llamé al 088",
      why: "Es la línea oficial para reportar delitos en internet. Ahí te orientan para levantar tu reporte.",
      undo: SIN_CAMBIOS,
      link: LLAMAR_088,
    },
    {
      id: "ban-gate-aclaracion",
      box: "24h",
      gate: "requiere_humano",
      text: "Firmar o presentar la aclaración por escrito",
      why: "Lo que firmas cuenta legalmente. Revísalo con tu banco o con un abogado.",
    },
    {
      id: "ban-gate-aparato",
      box: "24h",
      gate: "requiere_humano",
      text: "Decidir si tu celular o tu computadora están comprometidos",
      why: "Requiere revisar el aparato por dentro. Lo decide un especialista.",
    },
  ],
};

// Evidence Mode (no_claro): no protocol, only gather evidence, then a human.
export const evidencia: Paso[] = [
  {
    id: "evi-foto",
    box: "15min",
    gate: "reversible",
    text: "Tómale foto a lo que ves: la pantalla, el mensaje o el correo.",
    hecho: "Le tomé foto a lo que vi",
    foto: true,
    why: "Es lo que una persona va a necesitar para decirte qué pasó.",
    undo: SIN_CAMBIOS,
  },
  {
    id: "evi-anota",
    box: "15min",
    gate: "reversible",
    text: "Anota qué pasó y a qué hora lo notaste.",
    hecho: "Anoté qué pasó y a qué hora",
    why: "Con la hora y lo que viste se puede reconstruir lo que pasó.",
    undo: SIN_CAMBIOS,
  },
  {
    id: "evi-no-pagues",
    box: "15min",
    gate: "reversible",
    text: "No pagues y no le contestes a nadie.",
    hecho: "No he pagado ni le he contestado a nadie",
    why: "Mientras no se sepa qué pasó, pagar o contestar solo puede empeorarlo.",
    undo: SIN_CAMBIOS,
  },
  {
    id: "evi-no-borres",
    box: "15min",
    gate: "reversible",
    text: "No borres nada: ni mensajes, ni correos, ni archivos.",
    hecho: "No he borrado nada",
    why: "Borrar destruye la evidencia que una persona necesita para ayudarte.",
    undo: SIN_CAMBIOS,
  },
];

export function pasosDe(tipo: IncidentType): Paso[] {
  return tipo === "no_claro" ? evidencia : protocolos[tipo];
}
