# 002 — Add press feedback to chat quick-action buttons

- **Status**: DONE
- **Commit**: e8c256d
- **Severity**: MEDIUM
- **Category**: Physicality & origin (press feedback)
- **Estimated scope**: 1 file, tiny

## Problem

`frontend/app/dashboard/page.tsx:1049-1062` — current:

```tsx
{msg.actions && msg.actions.length > 0 && (
  <div className="flex flex-wrap gap-2">
    {msg.actions.map((action, i) => (
      <button
        key={i}
        onClick={() => handleAction(action)}
        disabled={isLoading}
        className="px-4 py-1.5 text-xs font-medium rounded-full glass text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-50"
      >
        {action.label}
      </button>
    ))}
  </div>
)}
```

These are the agent's quick-reply pills (e.g. "Aprovar", "Editar", "Enviar
agora") — a pressable element with a `hover:` state but no `:active` press
feedback (AUDIT.md §3: "pressable elements with no press feedback" is an
explicit hunt target). Frequency is occasional-to-moderate (a few times per
chat session, not keyboard-driven) — squarely in the "standard, subtle"
tier, not exempt.

Also flagging: `className="... transition-all ..."` — AUDIT.md §5 calls
`transition: all` an always-a-finding performance issue (animates
unintended properties off the GPU-accelerated path). This plan fixes both
in the same edit since they're the same `className` string.

## Target

```tsx
{msg.actions && msg.actions.length > 0 && (
  <div className="flex flex-wrap gap-2">
    {msg.actions.map((action, i) => (
      <button
        key={i}
        onClick={() => handleAction(action)}
        disabled={isLoading}
        className="px-4 py-1.5 text-xs font-medium rounded-full glass text-primary transition-[background-color,color,transform] duration-150 hover:bg-primary hover:text-white active:scale-[0.97] disabled:opacity-50 disabled:active:scale-100"
      >
        {action.label}
      </button>
    ))}
  </div>
)}
```

- Press feedback: `scale(0.97)` — inside the AUDIT.md §3 subtle range
  (0.95–0.98).
- Duration: 150ms — inside the AUDIT.md §2 button-press budget (100–160ms).
- `transition-[background-color,color,transform]` replaces `transition-all`
  — explicit properties only (AUDIT.md §5), still covers the existing hover
  color change plus the new press scale.
- `disabled:active:scale-100` prevents the press-scale from firing on a
  disabled (loading) button — there's nothing to give feedback for.

## Repo conventions to follow

- This is plain Tailwind, not Framer Motion — correct choice per AUDIT.md
  §5 ("CSS beats rAF-based JS for predetermined motion"); a hover/press
  color+scale doesn't need JS.
- Matches the existing `active:scale-[0.97]` idiom already used elsewhere
  in this exact file for a different button — see
  `frontend/app/dashboard/page.tsx` search for `active:scale` if present;
  if not found, this establishes the pattern that plan 005 (bio page) and
  any future plan should also reach for first before inventing a new value.

## Steps

1. In `frontend/app/dashboard/page.tsx`, locate the `className` string on the `<button>` inside `msg.actions.map` (search for `glass text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-50` to find the exact line — it's around line 1056 as of commit e8c256d, but STOP and re-locate by content match if the line number has drifted).
2. Replace that exact `className` string with the Target string above — same button, same children, only the class list changes.

## Boundaries

- Do NOT touch any other button in this file — only the one inside `msg.actions.map`.
- Do NOT change the `onClick`/`disabled` logic.
- Do NOT add `framer-motion` here — plain CSS/Tailwind transition is correct and lighter for a hover+press state.

## Verification

- **Mechanical**: `cd frontend && npx tsc --noEmit` — expect no new errors (this is a className-only change).
- **Feel check**:
  - Trigger a message with quick-action buttons (e.g. ask the agent to draft a dispatch until it shows "Aprovar"/"Editar" pills).
  - Click and hold (mousedown, don't release) one pill — confirm it shrinks slightly (`scale(0.97)`) immediately, not after a delay.
  - Release — confirm it snaps back within ~150ms, no lingering shrink.
  - While `isLoading` (button `disabled`), confirm clicking does not produce the press-scale (it should look inert, matching the existing `disabled:opacity-50` treatment).
  - In DevTools Animations panel at 10% playback, confirm only `transform` and `background-color`/`color` change — no `width`/`padding` shift causing the pill to reflow.
- **Done when**: every quick-action pill visibly compresses on press and springs back on release, within the 100–160ms budget, with no `transition-all` remaining on this button.
