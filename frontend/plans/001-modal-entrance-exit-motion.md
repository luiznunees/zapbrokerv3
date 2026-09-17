# 001 — Add entrance/exit motion to HowItWorksModal and PushPromptModal

- **Status**: DONE
- **Commit**: e8c256d
- **Severity**: HIGH
- **Category**: Missed opportunity / Purpose & frequency
- **Estimated scope**: 2 files, small

## Problem

Two modals teleport in and out with zero transition — they're either fully
visible or fully absent, one frame apart. Both are "occasional" frequency
(shown once per relevant event, not on every keystroke), which the audit
playbook (AUDIT.md §1) puts squarely in "standard animation" territory —
teleporting here is a missed opportunity, not a deliberate choice.

`frontend/components/dashboard/HowItWorksModal.tsx:33-38` — current:

```tsx
export function HowItWorksModal({ onClose }: { onClose: () => void }) {
    return (
        <div className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-md p-6 relative max-h-[85vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-muted-foreground hover:text-foreground">
```

`frontend/components/dashboard/PushPromptModal.tsx:40-46` — current:

```tsx
  if (!visible || !supported) return null
  // Se já está ativado, esconde — exceto no flash de "sucesso" logo após ativar.
  if ((permission === "granted" || subscribed) && status !== "success") return null

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-border shadow-2xl p-5">
```

Both components are called from a parent that conditionally renders them
(`{show && <HowItWorksModal .../>}` pattern, and the internal early-return
in `PushPromptModal`) — no `AnimatePresence` wraps either, so React unmounts
them instantly with no chance for an exit animation.

## Target

Backdrop fades in/out (`opacity 0→1`, 200ms). Panel fades + scales in from
`scale(0.95)` (never `scale(0)` — AUDIT.md §3), same duration, `ease-out`.
Modals are exempt from the "scale from trigger" rule — center transform-origin
is correct (AUDIT.md §3) — do not add a `transform-origin` override.

```tsx
// target — both files, same pattern
<AnimatePresence>
  {isOpenCondition && (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
        className="bg-card border border-border rounded-2xl w-full max-w-md p-6 relative max-h-[85vh] overflow-y-auto"
      >
        {/* existing content unchanged */}
      </motion.div>
    </motion.div>
  )}
</AnimatePresence>
```

Duration: 200ms is within the "Modals, drawers: 200–500ms" budget
(AUDIT.md §2) — use the lower bound since these are lightweight, low-drama
modals (info panel, permission prompt), not a heavy checkout flow.

Easing: this repo has no `--ease-out` CSS token defined (checked
`app/globals.css` — no `--ease-*` custom properties exist). Use the literal
cubic-bezier array `[0.23, 1, 0.32, 1]` from AUDIT.md §2 inline in the
`transition` prop, matching how `QRCodeModal.tsx` passes transition values
inline today (see exemplar below) rather than introducing a token file this
plan doesn't otherwise touch.

## Repo conventions to follow

- `frontend/components/dashboard/QRCodeModal.tsx:40-46` already does the
  correct panel entrance/exit shape — imitate its `initial`/`animate`/`exit`
  values exactly (`opacity: 0, scale: 0.95` → `opacity: 1, scale: 1`):
  ```tsx
  <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
          >
  ```
  Note: `QRCodeModal.tsx` does NOT animate its backdrop `<div>`, only the
  panel. This plan improves on that by fading the backdrop too — apply the
  backdrop fade to `HowItWorksModal`/`PushPromptModal` even though the
  exemplar doesn't have it; do not "fix" `QRCodeModal.tsx` in this plan
  (that's plan 006).
- Both target files already have `motion`/`AnimatePresence` available via
  `framer-motion` (confirmed in `package.json:28`, `^12.23.26`) — no new
  dependency needed.

## Steps

1. **`HowItWorksModal.tsx`**: Add `import { motion, AnimatePresence } from 'framer-motion'` to the top imports. Find the parent that renders `<HowItWorksModal onClose={...} />` conditionally (search for `HowItWorksModal` usage — it's rendered from `frontend/app/dashboard/page.tsx` or a layout component behind a boolean state). Wrap the conditional render itself in `<AnimatePresence>` at the call site, and inside `HowItWorksModal.tsx` convert the outer `<div className="fixed inset-0 ...">` to `<motion.div>` with the backdrop `initial/animate/exit` from Target above, and the inner panel `<div className="bg-card ...">` to `<motion.div>` with the panel `initial/animate/exit` from Target above. Keep every existing class name unchanged — only convert the tag and add the motion props.
2. **`PushPromptModal.tsx`**: The early-return guards (`if (!visible ...) return null`, `if ((permission === "granted" ...`) prevent `AnimatePresence` from ever seeing an "about to unmount" state — `AnimatePresence` needs the element to stay mounted in the tree with the condition evaluated inside JSX, not via early return. Refactor: remove the early `return null` statements; instead wrap the final `return (...)` JSX in a variable, and render `<AnimatePresence>{shouldShow && <motion.div>...}</AnimatePresence>` where `shouldShow` is the boolean combination of the two guard conditions (`visible && supported && !((permission === "granted" || subscribed) && status !== "success")`). Apply the same backdrop + panel motion values as step 1.
3. Add `import { motion, AnimatePresence } from 'framer-motion'` to `PushPromptModal.tsx` imports (it currently has none).

## Boundaries

- Do NOT touch `QRCodeModal.tsx` — that's a separate plan (006).
- Do NOT change any markup structure, class names, or copy — motion wrapper and props only.
- Do NOT add new dependencies — `framer-motion` is already installed.
- Do NOT change the `visible`/`status` state machine logic in `PushPromptModal.tsx` beyond converting the early returns to a single `shouldShow` boolean used for the `AnimatePresence` condition.
- If the parent call site for `HowItWorksModal` renders it unconditionally (no boolean gate) when you check, STOP and report — the plan assumes a conditional render exists to wrap in `AnimatePresence`.

## Verification

- **Mechanical**: `cd frontend && npx tsc --noEmit` — expect no new type errors introduced by these two files.
- **Feel check**:
  - Open `HowItWorksModal` (trigger it from wherever the "Como funciona" entry point is in the dashboard) — confirm the backdrop and panel fade+scale in together, no flash of fully-formed modal.
  - Close it — confirm it fades+scales out (not an instant disappearance). If it still disappears instantly, the parent isn't wrapping the conditional render in `AnimatePresence` correctly.
  - Trigger `PushPromptModal` (visit `/dashboard` fresh, wait 1.5s) — same entrance check. Click "Agora não" — confirm exit animation plays before the DOM node is gone.
  - In DevTools Animations panel, set playback to 10% and confirm both scale from 0.95→1 (not 0→1) and never touch `width`/`height`/`top`/`left`.
  - Toggle `prefers-reduced-motion` (Rendering panel) — opacity fade should remain, but this plan doesn't introduce any position/scale-heavy motion that needs a reduced-motion branch (scale 0.95→1 is subtle enough to leave as-is; note this as an accepted tradeoff, not a gap).
- **Done when**: both modals fade+scale on open and on close, matching `QRCodeModal.tsx`'s existing panel motion, with the backdrop also animating (which `QRCodeModal.tsx` doesn't do today).
