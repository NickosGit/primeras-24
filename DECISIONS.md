# DECISIONS — Primeras 24

## Primer paso de mañana

Commit 4: `/api/dmarc`, `<DmarcCard />`, métricas, descarga de la bitácora y "Borrar todo". **Antes:** DEPLOY 1 pendiente (necesita la cuenta de Vercel y la clave de Gemini del dueño).

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

### Recortado / pendiente

- Nada todavía.
