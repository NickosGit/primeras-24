# BUILD PROMPT — Primeras 24

Paste everything below into your coding agent, in a repo that already contains `docs/PACKET.md` and `docs/mockup.png`.

---

You are building **Primeras 24**, a phone-first web app that guides the person running a small Mexican clinic through the first hours after a cyberattack. It is a protocol-bound assistant: it gives safe first steps and escalates to a human when the case needs expert judgment. Read `docs/PACKET.md` (especially section 9) and look at `docs/mockup.png` before writing any code. The packet is the spec; if this prompt and the packet disagree, stop and ask.

## Non-negotiables (from the team Blueprint)

Each rule has a test, and a failing test blocks the commit.

**Shadow Clause (Condition 2): the AI may not become the attacker or the authority.**
1. The app never asks for a password. No `type="password"` input exists anywhere.
2. No remote access, file upload, or software installation is requested or enabled.
3. The app never tells the user to pay or negotiate, or how.
4. The app never names, guesses or accuses who did it, and never drafts anything public.
5. The app never suggests attacking back.
6. The LLM never writes response steps. It classifies and summarizes. Steps come only from `data/protocols.ts`.

**Four states (Condition 1).** Every claim on screen is rendered through `<Estado />` with exactly one of `CONFIRMADO | SIN_VERIFICAR | DESCONOCIDO | REQUIERE_HUMANO`. Only the result of a real check (the DNS lookup) may be CONFIRMADO. Anything the user typed and anything the AI inferred is SIN_VERIFICAR. No string anywhere says the user or the business is "seguro", "protegido", "a salvo" or "garantizado", and nothing promises recovery of files or money.

**Authority gate (Condition 3).** Every step has `gate: "reversible" | "requiere_humano"`. Reversible steps have a checkbox and an `undo` line. Gated steps have no checkbox, only "Anotar quién lo decidió" (role required, name optional).

**Evidence Mode (Condition 4).** If the incident cannot be classified, do not pick the closest protocol. Render Evidence Mode.

**Non-experts under pressure (Condition 5).** Mexican Spanish, informal "tú", no jargon ("secuestro de archivos" before "ransomware", "correos falsos a tu nombre" before "DMARC"). Acknowledge instantly on submit. "Hablar con una persona" visible on every screen.

**Privacy.** Nothing the user types is stored server-side. No database, no analytics on input text, no logging of request bodies. `<NuncaPedimos />` renders on every screen.

## Stack

Next.js (App Router, TypeScript), Tailwind CSS, zod, Vitest. Deploy on Vercel Hobby. No Supabase, no auth.

One environment variable: `LLM_API_KEY`, read only inside `app/api/triage/route.ts`. Use a free-tier LLM API (Gemini or Groq); check the provider's current docs for the free model name instead of assuming one. The app must work fully with the variable unset. Add `.env*` to `.gitignore` in the first commit.

## Files

```
app/page.tsx                 describe screen
app/plan/page.tsx            plan screen (protocol or Evidence Mode)
app/api/triage/route.ts      POST {text} -> {type, summary, source, redacted}
app/api/dmarc/route.ts       POST {domain} -> {dmarc, spf, policy}
components/NuncaPedimos.tsx
components/Estado.tsx        the four status chips
components/AiLabel.tsx       "Clasificación hecha por IA, puede equivocarse" / SIMULADO badge
components/Checklist.tsx     reversible steps
components/GatedStep.tsx     locked steps + approver form
components/EvidenceMode.tsx
components/DmarcCard.tsx
components/HablarConPersona.tsx   tel:088 link + escalation card
data/protocols.ts
data/copy.ts                 every UI string
lib/guard.ts
lib/classify.ts
lib/bitacora.ts
tests/*.test.ts
DECISIONS.md
```

## Contracts

**`lib/guard.ts`**
- `redactSecrets(text): { clean: string; redacted: boolean }` replaces with `[DATO OCULTO]`: whatever follows "contraseña / clave / password / pass / nip" plus an optional "es" or ":", 16-digit card numbers, 18-digit CLABEs.
- `violatesShadow(text): boolean`, case and accent insensitive, true if the text: asks the user to share a password or code; mentions installing or opening AnyDesk, TeamViewer or any remote tool; tells her to pay, transfer, negotiate or buy crypto; suggests attacking back; attributes the attack to a person or company ("fue tu empleado", "seguramente fue…"); tells her to publish or post about it; tells her to format, reinstall, wipe, restore a backup or run a decryptor; claims she is "segura / protegida / a salvo" or that files "se van a recuperar".

**`lib/classify.ts`**
- `classifyByKeywords(text): IncidentType` where `IncidentType = "ransomware" | "correo" | "banco" | "no_claro"`. Returns `no_claro` unless at least one strong keyword for exactly one type is present.

**`app/api/triage/route.ts`**
- zod: `text` is a string, 10 to 600 characters after trim. On failure return 400 with a Spanish message.
- Run `redactSecrets`. Send only `clean` to the LLM.
- System prompt: classify into exactly one of the four types; choose `no_claro` whenever the text does not clearly describe one of the other three; return strict JSON `{"type": ..., "summary": ...}`; the summary is at most two sentences of plain Mexican Spanish restating only what the user wrote, with no added facts, no cause, no culprit, no instructions and no reassurance.
- If the key is missing, the call fails, parsing fails, `type` is invalid, or `violatesShadow(summary)` is true: use `classifyByKeywords` and a fixed summary per type, `source: "simulado"`. Otherwise `source: "ia"`.
- If `type` is `no_claro`, return no summary.
- Never log the body.

**`app/api/dmarc/route.ts`**
- Validate: lowercase, trim, strip protocol and path, must match a hostname regex, at most 253 characters. Reject anything else with 400 before any network call.
- Fetch `https://dns.google/resolve?name=_dmarc.<domain>&type=TXT` and the root TXT for SPF, 5 second timeout.
- `policy`: `reject | quarantine | none | sin_registro | no_se_pudo`. Return the raw record too.
- UI wording per policy describes the record only: "Publica una regla que pide rechazar correos falsos a su nombre" / "…mandarlos a spam" / "Solo vigila, no los detiene" / "No publica ninguna regla". Chip CONFIRMADO for the first four, DESCONOCIDO for `no_se_pudo`. Add one fixed line: "Esto es un solo dato. No dice si tu negocio está bien o mal en lo demás."

**`data/protocols.ts`**
Steps: `{ id, box: "15min" | "1h" | "24h", gate, text, why, undo?, link? }`.

*Ransomware — reversible:* disconnect that computer from the internet without turning it off (undo: reconnect the cable or Wi-Fi); photograph the screen with your phone; do not pay and do not reply; do not plug the backup drive into that computer; from your phone, change the passwords of your email and your bank and turn on two-step verification; write down which programs and files stopped opening; look up whether a free key exists at No More Ransom (`https://www.nomoreransom.org/es/index.html`), looking only; call 088 with your summary ready.
*Ransomware — requiere_humano:* using any decryption tool; restoring from backup, reinstalling or formatting; deciding whether patient data was taken; telling patients or any authority about their data.

*Email takeover — reversible:* change the password from a different device and close all sessions; turn on two-step verification; look at forwarding rules and filters and photograph anything you did not create; tell your contacts by phone not to act on recent emails; run the email check; call 088.
*Email takeover — requiere_humano:* deleting rules, emails or accounts; deciding what the intruder read; any formal notice to patients, suppliers or authorities.

*Bank fraud — reversible:* call your bank on the number printed on your card; ask them to block the card or account (undo: the bank reactivates it); write down the folio number; do not call any number that arrived by message; change your banking password from a clean device; call 088.
*Bank fraud — requiere_humano:* signing or filing the written dispute; deciding whether a device is compromised.

*Evidence Mode (`no_claro`) — no protocol:* photograph what you see; write down what happened and at what time; do not pay or reply to anyone; do not delete anything; then the escalation card (088, your bank if money is involved, a specialist), all marked REQUIERE_HUMANO.

Every protocol and Evidence Mode contains a "no pagues" step. No step asks the user to give anything to this app.

**`components/GatedStep.tsx`**
- Shows the step with chip REQUIERE_HUMANO and one line on why this one is not hers or the app's to decide alone.
- Form: role (select, required: especialista en ciberseguridad, abogado, proveedor de TI, mi banco, 088, yo como responsable del negocio), name (optional, max 60 chars, stays in the browser). Saving writes a bitácora entry `kind: "decision"`.

**`lib/bitacora.ts`**
- localStorage key `p24:bitacora`. Entries `{ ts, kind: "inicio" | "paso" | "decision" | "dmarc" | "nota", estado, text }`.
- `metrics()`: minutes from `inicio` to the first `paso`; count of `decision` entries; count of gated steps still open.
- `exportTxt()`: header with start time and incident type marked SIN VERIFICAR (or DESCONOCIDO); timestamped entries with their status; the metrics; a five-line summary to read on the phone to 088. No notice to patients, no attribution.
- `clear()` removes everything.

## Commit plan (5 commits, 2 deploys)

**Commit 1 — `scaffold + shadow banner + estados`**
Next.js, Tailwind, Vitest; `.gitignore` with `.env*`; `<NuncaPedimos />` and `<HablarConPersona />` in the root layout; `<Estado />`; describe screen as static UI matching the mockup; `data/copy.ts`; `DECISIONS.md`.
✅ Accept: `npm run build` passes; banner and "Hablar con una persona" visible on `/`; test asserts the layout renders both; test scans `data/copy.ts` and fails on certainty claims.

**Commit 2 — `guard + classifier + protocols`**
`lib/guard.ts`, `lib/classify.ts`, `data/protocols.ts` with unit tests.
✅ Accept: "mi contraseña es Gato2024!" is redacted; each of these returns true from `violatesShadow`: "comparte tu contraseña", "instala AnyDesk", "paga el rescate en bitcoin", "seguramente fue tu exempleado", "publícalo en redes", "formatea la computadora", "ya estás protegida"; "desconecta la compu del internet" returns false; "algo raro pasa con la compu" classifies as `no_claro`; every protocol has a "no pagues" step; no step about decryption, restore, wipe or notification is `reversible`; a test greps `app/` and `components/` and fails on `type="password"`.

**Commit 3 — `triage route + plan + evidence mode`** → **DEPLOY 1**
`/api/triage` with fallback; `/plan` with `<Checklist />`, `<GatedStep />`, `<EvidenceMode />`, `<AiLabel />`; instant acknowledgement on submit.
✅ Accept: with no env var, the red-bitcoin-screen text lands on the ransomware plan with chip SIN VERIFICAR and badge SIMULADO; vague text lands on Evidence Mode with chip DESCONOCIDO and no protocol; a 3-character input is rejected in Spanish; a mocked LLM response containing "comparte tu contraseña" triggers the fallback; a gated step renders no checkbox and cannot be saved without a role; the acknowledgement is in the DOM before the fetch resolves.
Deploy to Vercel, set `LLM_API_KEY` in Vercel only, confirm on the live URL that the badge switches to the IA label.

**Commit 4 — `dmarc check + bitacora`**
`/api/dmarc`, `<DmarcCard />`, localStorage log, metrics, download, "Borrar todo".
✅ Accept: `sat.gob.mx` and `banxico.org.mx` return real records rendered with chip CONFIRMADO and wording that never says "protegido"; `not a domain` and `http://x/../etc` are rejected with no outbound fetch (assert the mock was not called); three ticks and one recorded decision survive a reload and appear in the downloaded file with timestamps, statuses and both metrics; "Borrar todo" empties storage.

**Commit 5 — `fix from testing + labels`** → **DEPLOY 2**
Run the mechanical test plan from the packet on the live URL. Fix at least one real bug found and record it in `DECISIONS.md` with before and after. Confirm the three honesty labels are on screen: AI fallibility label, SIMULADO badge, "DEMO · datos inventados" on the example chips.
✅ Accept: all tests green; `git grep` finds no key; Lighthouse accessibility at or above 90 on mobile.

## Session close (every session, no exceptions)

Update `DECISIONS.md` (what was decided and why, what was cut), write tomorrow's first move at the top, commit, push.

## Do not

Add a database, auth, analytics, a chat interface, file upload, a WhatsApp integration, a notice-to-patients generator, or any incident type beyond the four. Do not let the model generate steps. Do not put real people's names, emails, clinic names or patient data in seeds, examples or tests.
