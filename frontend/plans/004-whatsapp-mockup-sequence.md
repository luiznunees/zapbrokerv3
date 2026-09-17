# 004 — Sequence the WhatsAppMockup messages to demonstrate the product

- **Status**: DONE
- **Commit**: e8c256d
- **Severity**: LOW
- **Category**: Missed opportunity (explanation)
- **Estimated scope**: 1 file, small

## Problem

`frontend/components/landing/WhatsAppMockup.tsx:26-52` — current:

```tsx
{/* Dispatch finished notification */}
<div className="flex justify-start">
    <div className="max-w-[85%] bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm">
        <p className="text-[13px] text-zinc-800 leading-snug">
            ✅ Disparo <strong>"Vila Mariana"</strong> finalizado.<br />45/130 leads visualizaram.
        </p>
        <span className="flex items-center justify-end gap-1 text-[10px] text-zinc-400 mt-1">
            14:02 <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
        </span>
    </div>
</div>

{/* New dispatch confirmation */}
<div className="flex justify-start">
    <div className="max-w-[85%] bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm">
        <p className="text-[13px] text-zinc-800 leading-snug">
            📤 Disparo <strong>"Cobertura Pinheiros"</strong> agendado para 130 leads.
        </p>
        <span className="block text-right text-[10px] text-zinc-400 mt-1">14:03</span>
    </div>
</div>

<div className="flex justify-end">
    <div className="bg-brand-green-500/10 text-brand-green-700 dark:text-brand-green-400 text-[11px] font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
        Uma mensagem, toda a lista
    </div>
</div>
```

Used in `Hero.tsx` and `LpHero.tsx` — the highest-visibility marketing
surface on the site (above the fold on both landing variants). All three
elements (two WhatsApp bubbles + the "Uma mensagem, toda a lista" pill)
render at once, fully formed, on every page load. Same category as plan
003: rare/first-visit frequency, explanatory purpose, AUDIT.md §1 allows
"can add delight" and §2 allows longer marketing durations — this is a
missed opportunity, not a violation of restraint (a static-forever hero
mockup reads as a screenshot, not a live product).

## Target

The two message bubbles enter in sequence (first the completed dispatch,
then the newly scheduled one, as if arriving moments apart), then the
summary pill settles in last.

```tsx
"use client"

import { CheckCheck } from "lucide-react"
import { motion } from "framer-motion"

// ...

<motion.div
    className="flex justify-start"
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
>
    <div className="max-w-[85%] bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm">
        <p className="text-[13px] text-zinc-800 leading-snug">
            ✅ Disparo <strong>"Vila Mariana"</strong> finalizado.<br />45/130 leads visualizaram.
        </p>
        <span className="flex items-center justify-end gap-1 text-[10px] text-zinc-400 mt-1">
            14:02 <CheckCheck className="w-3.5 h-3.5 text-sky-500" />
        </span>
    </div>
</motion.div>

<motion.div
    className="flex justify-start"
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1], delay: 0.5 }}
>
    <div className="max-w-[85%] bg-white rounded-lg rounded-tl-none px-3 py-2 shadow-sm">
        <p className="text-[13px] text-zinc-800 leading-snug">
            📤 Disparo <strong>"Cobertura Pinheiros"</strong> agendado para 130 leads.
        </p>
        <span className="block text-right text-[10px] text-zinc-400 mt-1">14:03</span>
    </div>
</motion.div>

<motion.div
    className="flex justify-end"
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1], delay: 0.9 }}
>
    <div className="bg-brand-green-500/10 text-brand-green-700 dark:text-brand-green-400 text-[11px] font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
        Uma mensagem, toda a lista
    </div>
</motion.div>
```

- Same `y: 6 → 0` rise as plan 003 — cohesion across the two mockups
  (AUDIT.md §7: mismatched personality across components is a finding, so
  both marketing mockups should feel like the same "product" of motion).
- Delays of `0`, `0.5`, `0.9` — three-step stagger, tighter gaps than plan
  003's two-bubble sequence because there are three beats to land inside a
  still-reasonable total (~1.2s).

## Repo conventions to follow

- This component is used in two places (`Hero.tsx` and `LpHero.tsx`) —
  the motion lives inside `WhatsAppMockup.tsx` itself, so both call sites
  inherit it for free. Do not duplicate the animation logic into the
  parents.
- Same easing/delay-prop idiom as plan 003 — keep the two plans visually
  consistent since they're the same category of fix on sibling components.

## Steps

1. Add `"use client"` as the first line of `frontend/components/landing/WhatsAppMockup.tsx` (it has none today).
2. Add `import { motion } from "framer-motion"` to the imports (alongside the existing `import { CheckCheck } from "lucide-react"`).
3. Convert the three top-level children inside the chat body `<div>` (the two message wrappers and the summary pill wrapper) from `<div className="flex justify-start">` / `<div className="flex justify-end">` to `<motion.div>` with the same `className`, adding the `initial`/`animate`/`transition` props from Target above with delays `0`, `0.5`, `0.9` respectively.

## Boundaries

- Do NOT modify `Hero.tsx` or `LpHero.tsx` — they consume this component unchanged.
- Do NOT animate the chat header (the "ZapBroker · disparo no seu WhatsApp" bar) — it should feel like a persistent app chrome, not part of the message sequence.
- Do NOT add `exit` props — this mounts once and doesn't unmount in normal use.
- Do NOT change delay values beyond what's specified without noting it — if 500ms/900ms feels too slow or too fast in the feel check, that's a tuning note to report, not a silent change.

## Verification

- **Mechanical**: `cd frontend && npx tsc --noEmit` — expect no new errors.
- **Feel check**:
  - Load the homepage — confirm the WhatsApp mockup in the Hero shows the "Vila Mariana" bubble first, then ~0.5s later the "Cobertura Pinheiros" bubble, then ~0.4s later the green summary pill.
  - Visit `/corretores` (uses `LpHero.tsx`, same component) — confirm identical sequencing.
  - Total sequence should read as "messages arriving," not as "elements popping in randomly" — if the gaps feel arbitrary, that's the signal the delay values need tuning (report, don't silently change).
  - In DevTools Animations panel at 10% playback, confirm only `transform`/`opacity` animate, and each element starts from `y: 6px`, not `y: 0` with only opacity (physicality — a message arriving should have a touch of motion, not just fade).
- **Done when**: all three elements in the mockup enter in a visible, readable sequence on every page load, on both `Hero.tsx` and `LpHero.tsx`.
