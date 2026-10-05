# Primeras 24

Guía para el teléfono, para quien administra una clínica pequeña en México, durante las primeras horas después de un ataque informático. Da primeros pasos seguros de deshacer y pasa a una persona las decisiones que necesitan criterio experto.

La especificación está en [`docs/PACKET.md`](docs/PACKET.md), el plan de construcción en [`docs/BUILD_PROMPT.md`](docs/BUILD_PROMPT.md) y las decisiones en [`DECISIONS.md`](DECISIONS.md).

## Correr

```bash
npm install
npm run dev
```

```bash
npm test
```

## Variable de entorno

La única es `LLM_API_KEY`: una clave gratuita de Gemini. Solo se lee en `app/api/triage/route.ts` y se configura en Vercel, nunca en el repo. **La app funciona completa sin ella**: usa el clasificador por palabras clave y lo marca como SIMULADO.

Para probarla en local, crea `.env.local` (está ignorado por git) con:

```
LLM_API_KEY=tu-clave
```
