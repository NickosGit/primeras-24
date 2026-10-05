# DECISIONS — Primeras 24

## Primer paso de mañana

Commit 3: `/api/triage` con respaldo por palabras clave, pantalla del plan, modo evidencia y acuse instantáneo.

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

### Recortado / pendiente

- Nada todavía.
