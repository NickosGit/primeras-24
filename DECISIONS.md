# DECISIONS — Primeras 24

## Primer paso de mañana

1. **DEPLOY** (lo hace el dueño): crear el repo en GitHub y hacer push, importarlo en Vercel Hobby y poner `LLM_API_KEY` (clave gratuita de Gemini) **solo** en las variables de Vercel. En la URL en vivo, comprobar que una descripción clara muestra "Clasificación hecha por IA, puede equivocarse" y no el sello SIMULADO.
2. Correr en la URL en vivo el plan de pruebas mecánico del packet (§12, pruebas 1 a 12) y anotar aquí lo que falle.
3. Prueba de persona (Laura) con capturas → `docs/PERSONA_TEST.md`; arreglar la peor confusión.

---

## Sesión 1 · 2026-10-04

### Decidido

- **Proyecto nuevo en `primeras-24/`** con Next.js 16.3 (App Router, TypeScript), Tailwind 4, zod 4 y Vitest 5. Sin Supabase ni auth: no se guarda nada del lado del servidor.
- **`docs/PACKET.md` es la especificación.** La copia de `docs/mockup.png` se convirtió del `.webp` original sin cambiar nada más.
- **`.env*` va en `.gitignore` desde el primer commit.** No hay `.env.example`: la única variable es `LLM_API_KEY` y se documenta en el README.
- **No usamos fuentes de Google.** El sistema usa la fuente del teléfono: es más rápido con mala señal, no hace peticiones a terceros y la prueba del layout corre sin red.
- **`<NuncaPedimos />` y `<HablarConPersona />` viven en el layout raíz**, así que no hay pantalla que pueda olvidarlos. La prueba del layout lo verifica.
- **`<Estado />` explica cada chip** con un `title` y, opcionalmente, una línea visible (`explicar`). El packet teme que "SIN VERIFICAR" se lea como "no te creemos"; la explicación dice "Te creemos, pero nadie lo ha comprobado todavía".
- **Lenguaje neutral en el copy.** El packet usa a Laura como persona, pero quien use la app puede ser hombre o mujer: evitamos adjetivos con género ("sola", "protegida") en la interfaz.
- **La prueba de certeza revisa `data/copy.ts` y `data/protocols.ts`**, sin importar acentos ni mayúsculas, y comprueba que el propio escáner detecta una afirmación plantada.
- **Componentes extra fuera de la lista del prompt:** `components/DescribeForm.tsx` (formulario cliente de la pantalla 1). Así `app/page.tsx` se queda como componente de servidor.

- **`redactSecrets` no borra la palabra que sigue a "clave" si es una palabra común** ("me cambiaron la clave *de* mi correo"). Cuando hay "es", "son" o ":", siempre oculta. Así no se rompe la clasificación de frases normales sobre claves.
- **`violatesShadow` ignora negaciones** ("no pagues", "nunca compartas tu contraseña"): una regla no cuenta si "no / nunca / ni / jamás / sin" aparece en las tres palabras anteriores. Las reglas de acceso remoto y atribución no aceptan negación: el modelo no tiene por qué mencionarlas.
- **Cada paso reversible, aunque sea un "no hagas", tiene línea de deshacer.** Si no cambia nada se dice: "No cambia nada en tu equipo." Así la persona ve explícitamente que es reversible.
- **"No pagues" también en correo y banco.** La lista de pasos de correo y banco del prompt no lo trae, pero la regla "todo protocolo trae un paso de no pagues" sí. Gana la regla.
- **Las pruebas de protocolos pasan cada paso reversible por `violatesShadow`**: si alguien edita un paso y le cuela "formatea" o "restaura el respaldo", la prueba falla.
- **Modo evidencia no tiene pasos con candado.** El escalamiento es la tarjeta de personas (088, banco, especialista), marcada REQUIERE HUMANO.

- **Modelo: `gemini-3.5-flash-lite`** vía `generateContent` con `responseSchema` (tipo en enum). Se revisó contra la página de precios de Gemini el 2026-10-04: es estable, tiene capa gratuita y es el más rápido de los Flash. Timeout de 8 s; si falla, entra el clasificador por palabras clave.
- **El prompt del sistema le dice al modelo que el texto de la persona es un dato, no instrucciones.** Es la primera defensa contra inyección de instrucciones; la segunda es `violatesShadow` sobre el resumen; la tercera es que el modelo nunca escribe pasos.
- **Cómo pasa el caso de `/` a `/plan`: localStorage, nunca la URL.** El texto crudo no se guarda en ningún lado; solo se guarda el resultado (tipo, resumen, fuente, si se ocultó algo) en `p24:caso`, en el teléfono.
- **Acuse instantáneo en la misma pantalla.** Al enviar, el formulario se cambia por "Recibido 08:41. Vamos paso a paso." antes de llamar a `/api/triage`. La hora de inicio de la bitácora es la del envío, no la de la respuesta.
- **Si falla la red, se clasifica en el teléfono** (`redactSecrets` + `classifyByKeywords`), marcado SIMULADO. Nadie se queda sin plan por mala señal.
- **El resumen fijo del modo simulado no lleva el título "Lo que entendimos de lo que escribiste"**: no repite nada de lo que escribió la persona, así que ese título mentiría.
- **`lib/bitacora.ts` entró en el commit 3** y no en el 4: la pantalla con candado tiene que escribir la decisión en algún lado para que la prueba "no se guarda sin rol" signifique algo. Las métricas, la descarga y "Borrar todo" se prueban en el commit 4.
- **Las entradas de la bitácora llevan un `ref` opcional** (el id del paso). Desmarcar un paso no borra la entrada: agrega una `nota` con el mismo `ref`. La bitácora solo crece, como debe ser la evidencia.
- **Una decisión anotada no se puede editar.** Si alguien se equivoca, lo correcto es una nota nueva (pendiente de diseño), no reescribir la evidencia.
- **Se muestran todos los pasos de cada bloque de tiempo**, como en el mockup, y no "un paso a la vez" como dice la Condición 5 del packet. El mockup es más concreto; anotarlo para la prueba de persona.

- **La revisión de correo se ofrece en los planes de correo y banco**, no en el de secuestro de archivos ni en modo evidencia. El packet (§5b y §10) dice "email incident" y "email takeover or bank fraud"; el mockup la muestra bajo ransomware. Ganó el texto del packet.
- **El dominio se valida antes de cualquier consulta**: minúsculas, sin protocolo, sin ruta, sin "alguien@", al menos dos etiquetas y un TLD de letras. `http://x/../etc` queda como `x` y se rechaza por no tener TLD. Las IP también se rechazan.
- **`no_se_pudo` se distingue de `sin_registro`**: NXDOMAIN (Status 3) significa que no hay registro, y eso es un hecho CONFIRMADO; un timeout o un SERVFAIL es DESCONOCIDO.
- **La prueba con DNS real (`sat.gob.mx`, `banxico.org.mx`) corre solo con `RUN_LIVE=1`**, para que `npm test` funcione sin red. Corrida el 2026-10-04: sat.gob.mx → `p=reject`, banxico.org.mx → `p=none`, los dos con SPF.
- **La bitácora exporta solo el caso actual** (desde el último "inicio"). Los casos anteriores siguen en el teléfono hasta "Borrar todo".
- **"Borrar todo" pide confirmación** (es lo único irreversible de la app) y borra todas las claves `p24:*`.
- **El archivo descargado lleva BOM UTF-8**, para que los acentos se vean bien en el Bloc de notas de Windows.

### Commit 5: bug encontrado al probar

**Bug: el resumen "PARA LEER AL 088" afirmaba cosas que la bitácora no respalda.** Se encontró al revisar el texto de una bitácora de ejemplo (prueba 10 del packet), con un paso de foto marcado y luego desmarcado.

Antes:

```
3. Ya hice: Desconecta esa compu del internet: quita el cable o apaga su Wi-Fi. No la apagues.
5. Tengo fotos y esta bitácora con horas para entregarlas.
```

- La línea 5 decía "Tengo fotos" **siempre**, aunque nadie hubiera marcado un paso de foto. Viola la Condición 1: convierte algo que no sabemos en una afirmación que la persona le lee a la autoridad.
- La línea 3 pegaba el texto imperativo del paso ("Desconecta… No la apagues."). Leído en voz alta al 088 no tiene sentido.

Después:

```
3. Desconecté la compu del internet sin apagarla.
5. Tengo esta bitácora con horas para entregarla.
```

- Cada paso reversible tiene `hecho` (primera persona, pasado) y los pasos de foto llevan `foto: true`. La línea 3 usa solo los pasos que siguen marcados, en el orden en que se hicieron. La línea 5 menciona fotos solo si un paso de foto sigue marcado.
- Pruebas de regresión en `tests/bitacora.test.tsx` ("088 summary"): fallan con el código anterior (comprobado con `git stash`) y pasan con el arreglo. `tests/protocols.test.ts` exige `hecho` en todo paso reversible, sin "tú", y que `foto` marque exactamente los pasos que hablan de foto.

### Commit 5: otras revisiones

- **Accesibilidad:** axe-core en la pantalla del plan con datos marcó contenido fuera de landmarks. El aviso "Nunca te vamos a pedir" pasó al `<header>` y "Hablar con una persona" al `<footer>`. Después: 0 violaciones en axe; Lighthouse móvil 100 en accesibilidad y 100 en buenas prácticas, en `/` y `/plan` (build de producción local).
- **Revisión de "un solo dato":** la tarjeta de correo repetía la idea dos veces. La segunda línea ahora dice de dónde sale el dato.
- **`git grep`** de claves (`AIza…`, `gsk_…`, `LLM_API_KEY=`): solo aparece el ejemplo `tu-clave` del README.
- **Las tres etiquetas de honestidad están en pantalla:** "Clasificación hecha por IA, puede equivocarse" (fuente IA), el sello SIMULADO (respaldo) y "DEMO · datos inventados" en la cabecera y en cada ejemplo.
- **Falsa alarma documentada:** con `curl` en Git Bash la ñ llega al servidor como U+FFFD y "contraseña" no se oculta. Con un cuerpo UTF-8 real sí se oculta. Para probar a mano en Windows, manda el cuerpo desde un archivo (`--data-binary @archivo.json`).

### Recortado / pendiente

- **Deploy 1 y 2 a Vercel:** pendientes del dueño (cuenta de Vercel y clave de Gemini). Todo lo demás del commit 3 al 5 se probó en local.
- **El sello IA en vivo** no se probó contra Gemini real: no hay clave en esta máquina. La ruta está probada con respuestas simuladas del modelo (válidas, inválidas, con violaciones de la cláusula sombra, con JSON roto y sin red).
- **`docs/PERSONA_TEST.md`:** pendiente; es una sesión aparte con capturas.
- **La tarjeta de correo no recuerda su resultado al recargar** (sí queda en la bitácora). Mejora pequeña para después.
- **Corregir una decisión anotada:** no hay forma todavía; habría que agregar una nota, no editar.
