// Every UI string lives here so tests/copy.test.ts can scan it for certainty claims.
// Mexican Spanish, informal "tú", plain words first and jargon in parentheses.

export const copy = {
  app: {
    nombre: "Primeras",
    numero: "24",
    titulo: "Primeras 24",
    descripcion:
      "Guía para las primeras horas después de un ataque informático a tu negocio.",
    demo: "DEMO · datos inventados",
  },

  nuncaPedimos: {
    fuerte: "Nunca te vamos a pedir",
    resto: "contraseñas, acceso a tu computadora ni dinero.",
    estafa: "Si alguien te los pide en nuestro nombre, es una estafa.",
  },

  persona: {
    boton: "Hablar con una persona · 088",
    botonCorto: "Hablar con una persona",
    tel: "tel:088",
    tarjetaTitulo: "Quién puede decidir contigo",
    tarjetaIntro:
      "Estas llamadas las haces tú. Ten a la mano tu bitácora o el resumen.",
    opciones: [
      {
        id: "088",
        titulo: "Llama al 088",
        detalle: "Línea de la Guardia Nacional para reportar delitos en internet.",
        href: "tel:088",
        accion: "Llamar al 088",
      },
      {
        id: "banco",
        titulo: "Si hay dinero de por medio, llama a tu banco",
        detalle:
          "Usa solo el número impreso atrás de tu tarjeta, nunca uno que te llegó por mensaje.",
      },
      {
        id: "especialista",
        titulo: "Un especialista en ciberseguridad o tu proveedor de TI de confianza",
        detalle: "Alguien que tú ya conoces, no alguien que te contactó hoy.",
      },
    ],
  },

  pie: {
    linea1: "Guía general. No sustituye a un especialista ni promete recuperar nada.",
    linea2: "Lo que escribes no se guarda en ningún servidor.",
  },

  estados: {
    CONFIRMADO: {
      etiqueta: "CONFIRMADO",
      explica: "Lo comprobamos con una consulta real.",
    },
    SIN_VERIFICAR: {
      etiqueta: "SIN VERIFICAR",
      explica: "Te creemos, pero nadie lo ha comprobado todavía.",
    },
    DESCONOCIDO: {
      etiqueta: "DESCONOCIDO",
      explica: "Con lo que sabemos no alcanza para decirlo.",
    },
    REQUIERE_HUMANO: {
      etiqueta: "REQUIERE HUMANO",
      explica: "Esto lo decide una persona preparada, no la app ni tú sin ayuda.",
    },
  },

  describir: {
    titulo: "Cuéntame qué pasó, con tus palabras.",
    ayuda:
      "No necesitas saber cómo se llama. No escribas contraseñas, cuentas ni nombres de pacientes.",
    etiquetaCampo: "Qué pasó",
    placeholder: "Por ejemplo: la compu de recepción muestra un mensaje raro…",
    ejemplosTitulo: "Si no sabes cómo empezar, toca un ejemplo:",
    ejemplos: [
      "Mis pacientes recibieron correos míos pidiendo depósitos",
      "Hicieron una transferencia que yo no autoricé",
    ],
    ejemploPrefijo: "Ejemplo:",
    boton: "Dime qué hago ahora",
    errorCorto: "Escribe un poco más, al menos 10 letras, para poder ayudarte.",
    errorLargo: "Es demasiado largo. Cuéntalo en 600 letras o menos.",
    errorRed:
      "No pudimos leer tu texto en este momento. Mientras tanto, llama al 088.",
    casoAbierto: "Ya tienes un plan abierto desde las",
    verPlan: "Ver mi plan",
  },

  acuse: {
    recibido: "Recibido",
    vamos: "Vamos paso a paso.",
    leyendo: "Estoy leyendo lo que escribiste…",
  },

  plan: {
    sinCaso: "Todavía no nos has contado qué pasó.",
    empezar: "Contar qué pasó",
    titulos: {
      ransomware: "Parece un secuestro de archivos (ransomware)",
      correo: "Parece que alguien entró a tu correo",
      banco: "Parece un fraude con tu banco o tarjeta",
      no_claro: "Todavía no sabemos qué pasó",
    },
    resumenTitulo: "Lo que entendimos de lo que escribiste:",
    resumenSimulado: {
      ransomware:
        "Tu descripción tiene palabras que suelen aparecer en un secuestro de archivos.",
      correo:
        "Tu descripción tiene palabras que suelen aparecer cuando alguien entra a un correo ajeno.",
      banco:
        "Tu descripción tiene palabras que suelen aparecer en un fraude con el banco.",
    },
    oculto:
      "Quitamos de tu texto algo que parecía una contraseña o un número de cuenta antes de leerlo. No lo necesitamos y no se lo des a nadie.",
    cajas: {
      "15min": "AHORA · LO PUEDES HACER TÚ",
      "1h": "EN LA PRIMERA HORA",
      "24h": "ANTES DE QUE TERMINE EL DÍA",
    },
    porQue: "¿Por qué?",
    hecho: "Hecho",
    deshacer: "Cómo se deshace:",
    abrirEnlace: "Abrir",
    llamar: "Llamar",
    gatedTitulo: "ESTO LO DECIDE UNA PERSONA, NO LA APP",
    gatedIntro:
      "No tienen casilla. Cuando alguien preparado lo decida, anota quién fue.",
  },

  gate: {
    anotar: "Anotar quién lo decidió",
    rol: "¿Quién lo decidió?",
    rolElige: "Elige una opción",
    roles: [
      "especialista en ciberseguridad",
      "abogado",
      "proveedor de TI",
      "mi banco",
      "088",
      "yo como responsable del negocio",
    ],
    nombre: "Nombre (opcional, se queda en tu teléfono)",
    guardar: "Guardar",
    cancelar: "Cancelar",
    faltaRol: "Elige quién lo decidió para poder guardarlo.",
    decidido: "Decisión anotada",
    por: "por",
  },

  ai: {
    ia: "Clasificación hecha por IA, puede equivocarse",
    simulado: "SIMULADO",
    simuladoExplica:
      "Clasificado por palabras clave, sin IA. Puede equivocarse.",
  },

  evidencia: {
    titulo: "Modo evidencia",
    intro:
      "Con lo que escribiste no alcanza para elegir un plan, y no vamos a adivinar. Mientras hablas con una persona, junta evidencia:",
  },

  dmarc: {
    titulo: "¿Pueden mandar correos falsos a tu nombre?",
    intro:
      "Escribe solo el dominio de tu correo (lo que va después de la @). Revisamos un registro público, nada más.",
    etiqueta: "Dominio de tu correo",
    placeholder: "clinica-ejemplo.mx",
    boton: "Revisar",
    revisando: "Revisando…",
    politicas: {
      reject: "Publica una regla que pide rechazar correos falsos a su nombre.",
      quarantine: "Publica una regla que pide mandar correos falsos a su nombre a spam.",
      none: "Publica una regla que solo vigila, no los detiene.",
      sin_registro: "No publica ninguna regla contra correos falsos.",
      no_se_pudo: "No pudimos consultar el registro ahora. Intenta en un rato.",
    },
    spfSi: "También publica la lista de servidores que pueden mandar su correo (SPF).",
    spfNo: "No publica la lista de servidores que pueden mandar su correo (SPF).",
    unSoloDato:
      "Esto es un solo dato. No dice si tu negocio está bien o mal en lo demás.",
    fuente: "Es un solo dato, de un registro público.",
    verRegistro: "Ver el registro tal cual",
    errorDominio: "Eso no parece un dominio. Escribe algo como clinica-ejemplo.mx",
  },

  bitacora: {
    titulo: "Tu bitácora",
    intro:
      "Se guarda solo en este teléfono. Descárgala y llévala al 088, a tu banco o a tu especialista.",
    descargar: "Descargar mi bitácora",
    borrar: "Borrar todo",
    confirmarBorrar:
      "¿Borrar tu bitácora y tu plan de este teléfono? No se puede deshacer.",
    borrado: "Borraste todo. No queda nada de este caso en este teléfono.",
    pasosHechos: "pasos hechos",
    decisiones: "decisiones enviadas a una persona",
    minutos: "minutos al primer paso",
    vacia: "Todavía no hay nada que descargar.",
  },
} as const;

export type Copy = typeof copy;
