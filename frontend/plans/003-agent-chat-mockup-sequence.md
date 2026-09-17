# 003 — Sequence the AgentChatMockup bubbles to demonstrate the product

- **Status**: DONE
- **Commit**: e8c256d
- **Severity**: LOW
- **Category**: Missed opportunity (explanation)
- **Estimated scope**: 1 file, small

## Problem

`frontend/components/landing/AgentChatMockup.tsx:16-33` — current:

```tsx
<div className="flex-1 space-y-3">
    <div className="flex gap-2 justify-end">
        <div className="max-w-[75%] bg-primary text-white text-[10px] px-3 py-2 rounded-2xl rounded-tr-sm">
            Dispara pra quem não visitou ainda esse mês
        </div>
    </div>

    <div className="flex gap-2 items-start">
        <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-purple-500/80 to-indigo-500/80 flex items-center justify-center shrink-0">
            <Bot className="w-3 h-3 text-white" />
        </div>
        <div className="max-w-[75%] bg-zinc-800 border border-white/5 text-zinc-300 text-[10px] px-3 py-2 rounded-2xl rounded-tl-sm space-y-1.5">
            <p>Encontrei 42 leads sem visita. Envio um lembrete pra eles?</p>
            <div className="flex gap-1.5 pt-1">
                <span className="text-[8px] bg-primary text-white px-2 py-1 rounded-full font-medium">Enviar agora</span>
                <span className="text-[8px] bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full font-medium">Agendar</span>
            </div>
        </div>
    </div>
</div>
```

This is used inside `AgentShowcase.tsx` to demonstrate "you talk, the agent
builds the dispatch" — but both bubbles render simultaneously, fully
formed. There's no moment where the visitor sees the conversation *happen*,
which undercuts the section's own copy ("Você fala o que quer no painel,
igual conversa no ChatGPT"). This is a marketing/explanatory surface, seen
rarely (once per landing visit) — AUDIT.md §1 explicitly allows a longer,
more deliberate beat here ("Marketing / explanatory: can be longer"), and
names "explanation" as a valid animation purpose distinct from decoration.

## Target

The user bubble appears first (as if just sent), then a brief pause (as if
the agent is "typing"), then the agent bubble + its action pills appear.

```tsx
"use client"

import { motion } from "framer-motion"
import { Bot, Sparkles, Send } from "lucide-react"

// ...

<div className="flex-1 space-y-3">
    <motion.div
        className="flex gap-2 justify-end"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
    >
        <div className="max-w-[75%] bg-primary text-white text-[10px] px-3 py-2 rounded-2xl rounded-tr-sm">
            Dispara pra quem não visitou ainda esse mês
        </div>
    </motion.div>

    <motion.div
        className="flex gap-2 items-start"
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1], delay: 0.9 }}
    >
        <div className="w-6 h-6 rounded-xl bg-gradient-to-br from-purple-500/80 to-indigo-500/80 flex items-center justify-center shrink-0">
            <Bot className="w-3 h-3 text-white" />
        </div>
        <div className="max-w-[75%] bg-zinc-800 border border-white/5 text-zinc-300 text-[10px] px-3 py-2 rounded-2xl rounded-tl-sm space-y-1.5">
            <p>Encontrei 42 leads sem visita. Envio um lembrete pra eles?</p>
            <div className="flex gap-1.5 pt-1">
                <span className="text-[8px] bg-primary text-white px-2 py-1 rounded-full font-medium">Enviar agora</span>
                <span className="text-[8px] bg-zinc-700 text-zinc-300 px-2 py-1 rounded-full font-medium">Agendar</span>
            </div>
        </div>
    </motion.div>
</div>
```

- `y: 6 → 0` + `opacity: 0 → 1` — a subtle rise, not a scale (chat bubbles
  in real messaging apps slide up, they don't zoom in).
- `duration: 0.3` (300ms) — at the marketing-page allowance from AUDIT.md
  §2, slightly above the strict 300ms UI ceiling but still restrained; this
  is a deliberate two-line justification, not an excuse to go longer.
- `delay: 0.9` on the agent bubble — long enough to read as "the agent is
  responding" without feeling like the demo is stuck. This value can't be
  verified by reading code alone; flagged as a feel-check item below.
- No `exit` prop — this mounts once per page load and never unmounts under
  normal use, so no exit animation is needed.

## Repo conventions to follow

- Easing: same `[0.23, 1, 0.32, 1]` cubic-bezier used in plan 001 — this
  repo has no `--ease-out` token, so pass the array literal inline in the
  `transition` prop (matches how `frontend/app/dashboard/page.tsx:904`
  already writes `transition={{ delay: i * 0.05, duration: 0.2 }}` inline
  without a token).
- Stagger-by-delay convention: `frontend/app/dashboard/page.tsx:900-904`
  already staggers a `.map()` of suggestion cards via
  `transition={{ delay: i * 0.05, duration: 0.2 }}` — this plan follows the
  same "delay in the transition prop" idiom, just with two named delays
  instead of an index-driven one (there are only two fixed bubbles, not a
  list).

## Steps

1. Add `"use client"` as the first line of `frontend/components/landing/AgentChatMockup.tsx` (it has none today — required because `framer-motion`'s `motion.*` components use hooks and must run client-side; confirm this doesn't already inherit `"use client"` from a parent — Next.js client boundaries don't propagate down through imports, so this file needs its own directive).
2. Add `import { motion } from "framer-motion"` to the imports.
3. Convert the two direct children of `<div className="flex-1 space-y-3">` from `<div>` to `<motion.div>`, adding the `initial`/`animate`/`transition` props from Target above to each — first bubble gets `delay: 0` (omit the key, framer-motion defaults to 0), second bubble gets `delay: 0.9`. Keep every existing class name and nested markup unchanged.

## Boundaries

- Do NOT add an `exit` animation — this component doesn't unmount in normal use.
- Do NOT animate the outer wrapper, the "Assistente ZapBroker" pill, or the bottom input bar — only the two message bubbles.
- Do NOT touch `AgentShowcase.tsx` (the parent) in this plan.
- Do NOT add scroll-triggered (`whileInView`) motion — this plan is mount-triggered by design; if a future plan wants the sequence to replay when scrolled into view, that's a separate decision, not a silent addition here.

## Verification

- **Mechanical**: `cd frontend && npx tsc --noEmit` — expect no new errors.
- **Feel check**:
  - Load the landing page, scroll to the `AgentShowcase` section (or wherever it renders).
  - Confirm the user's message ("Dispara pra quem não visitou...") appears first, rising in.
  - Confirm there's a visible pause (~0.6–0.9s) before the agent's bubble appears — it should read as "the agent is thinking/responding," not as two separate lazy-loaded elements.
  - Reload the page 3-4 times — confirm the delay feels consistent and not too long to feel broken (if 900ms reads as sluggish in practice, this is a value to tune, not a structural problem — note in the PR/commit if you change it).
  - In DevTools Animations panel at 10% playback, confirm only `transform`/`opacity` animate.
- **Done when**: the two bubbles visibly enter in sequence (not simultaneously) on every page load, within the delay/duration values above or a tuned variant noted in the implementation notes.
