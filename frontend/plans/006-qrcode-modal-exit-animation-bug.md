# 006 — Fix QRCodeModal's exit animation never playing

- **Status**: DONE
- **Commit**: e8c256d
- **Severity**: HIGH
- **Category**: Interruptibility / Missed opportunity (bug in existing motion)
- **Estimated scope**: 1 file, tiny

## Problem

`frontend/components/dashboard/QRCodeModal.tsx:37-46` — current:

```tsx
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                >
```

`AnimatePresence` detects an element about to unmount by watching its own
children being removed from the React tree *while `AnimatePresence` itself
stays mounted*. Here, `if (!isOpen) return null` runs **before**
`AnimatePresence` is even rendered — when `isOpen` flips to `false`, the
entire `QRCodeModal` function returns `null` in one render pass, so
`AnimatePresence` unmounts along with everything inside it simultaneously.
There's no "child being removed while parent persists" moment for it to
animate — the configured `exit={{ opacity: 0, scale: 0.95 }}` is dead code
that has never actually run.

This is the same structural mistake plan 001 fixes in `HowItWorksModal`/
`PushPromptModal`, except here it's disguised — the component *looks*
correctly animated (has `AnimatePresence`, has an `exit` prop) but isn't.
Also note: the backdrop `<div>` is never wrapped in `motion` at all — only
the inner panel animates; the backdrop still teleports.

## Target

Move the `isOpen` check inside the JSX so `AnimatePresence` stays mounted
across the open/close boundary, and animate the backdrop too (cohesion
with plan 001's modals):

```tsx
    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                >
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
                        className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* existing content unchanged */}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
```

The early `if (!isOpen) return null;` line is deleted entirely — the
`isOpen &&` guard inside JSX replaces it.

## Repo conventions to follow

- This mirrors plan 001's target shape exactly (backdrop + panel, both
  `motion.div`, same duration/easing) — implement plan 001 first if
  possible, or at minimum keep the two visually identical, since all three
  modals (`HowItWorksModal`, `PushPromptModal`, `QRCodeModal`) should feel
  like the same design system, not three slightly different modal
  implementations (AUDIT.md §7).
- The panel's existing `initial`/`animate`/`exit` values (`scale: 0.95 → 1`)
  are correct per AUDIT.md §3 and are preserved unchanged — this plan only
  fixes *when* they run and adds the missing `transition` duration/easing
  (today they rely on framer-motion's default transition, which is a
  spring, not the `ease-out` this repo should standardize on per AUDIT.md
  §2 — adding the explicit `transition` prop makes the duration
  predictable instead of physics-dependent).

## Steps

1. In `frontend/components/dashboard/QRCodeModal.tsx`, delete the line `if (!isOpen) return null;`.
2. Wrap the existing `<div className="fixed inset-0 ...">` in `{isOpen && ( ... )}` inside the `<AnimatePresence>`, and convert that `<div>` to `<motion.div>` with the backdrop `initial`/`animate`/`exit`/`transition` props from Target.
3. Add the explicit `transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}` prop to the existing inner panel `motion.div` (its `initial`/`animate`/`exit` values stay exactly as they are today — only the `transition` prop is new).
4. Confirm the closing tags still balance: the added `{isOpen && ( ... )}` needs its own closing `)}` right before `</AnimatePresence>`.

## Boundaries

- Do NOT change the panel's `initial`/`animate`/`exit` scale/opacity values — they're already correct.
- Do NOT touch any content inside the panel (QR code display, pairing code UI, retry button, etc.) — this plan is the wrapper only.
- Do NOT touch `HowItWorksModal.tsx` or `PushPromptModal.tsx` here — those are plan 001.
- If `isOpen` is derived from more than one condition elsewhere in the file (re-check the full component before editing — the excerpt above is the relevant slice as of commit e8c256d), preserve whatever the full boolean expression is; don't simplify it to just `isOpen` if it's more complex in the actual current file.

## Verification

- **Mechanical**: `cd frontend && npx tsc --noEmit` — expect no new errors.
- **Feel check**:
  - Open the QR code modal (trigger WhatsApp connection flow from wherever it's invoked in the dashboard).
  - Close it (via its close action) — confirm the panel now visibly shrinks+fades out over ~200ms instead of vanishing instantly. This is the core bug fix: before this plan, closing this modal looked identical to `HowItWorksModal` closing (instant); after, it should look like a proper exit.
  - Confirm the backdrop also fades out, not just the panel.
  - Re-open immediately after closing (rapid toggle) — confirm no visual glitch (a stuck backdrop, a flash of unstyled content) from the added `AnimatePresence` boundary.
  - In DevTools Animations panel at 10% playback on close, confirm an actual exit animation is now present in the panel (previously: nothing to inspect, because it never ran).
- **Done when**: closing `QRCodeModal` visibly animates out (backdrop + panel), matching the entrance in reverse, on every close — not just the first render.
