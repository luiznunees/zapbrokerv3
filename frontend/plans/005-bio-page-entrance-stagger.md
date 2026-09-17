# 005 — Stagger the entrance of the bio page links

- **Status**: DONE
- **Commit**: e8c256d
- **Severity**: LOW
- **Category**: Missed opportunity (delight)
- **Estimated scope**: 2 files (1 new), small

## Problem

`frontend/app/bio/page.tsx:38-85` — current: the icon, headline, subtitle,
all three link cards, and the social-proof line render simultaneously on
first paint — nothing animates. This is a link-in-bio page: nearly every
visit is a first visit, arriving from an Instagram bio tap (AUDIT.md §1:
"rare/first-time" tier, where delight is explicitly allowed, not just
tolerated).

This file exports `metadata` (line 7) — that requires it to remain a
Server Component. `framer-motion`'s `motion.*` components need
`"use client"`, and Next.js does not allow a single file to both export
`metadata` and carry `"use client"`. The three link cards need per-item
entrance, which needs client-side `motion` — this forces a small split,
not a same-file edit like plans 003/004.

## Target

A new client component owns just the animated link list; `page.tsx` stays
a server component and renders it.

`frontend/components/bio/BioLinks.tsx` (new file):

```tsx
"use client"

import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { motion } from "framer-motion"
import type { LucideIcon } from "lucide-react"

interface BioLink {
    href: string
    icon: LucideIcon
    title: string
    desc: string
    primary?: boolean
    external?: boolean
}

export function BioLinks({ links }: { links: BioLink[] }) {
    return (
        <div className="w-full max-w-sm flex flex-col gap-3 mb-8">
            {links.map((link, i) => (
                <motion.div
                    key={link.title}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1], delay: i * 0.06 }}
                >
                    <Link
                        href={link.href}
                        target={link.external ? "_blank" : undefined}
                        rel={link.external ? "noopener noreferrer" : undefined}
                        className={
                            link.primary
                                ? "group flex items-center gap-3 rounded-2xl px-5 py-4 bg-landing-lime hover:bg-landing-lime-dark text-landing-navy transition-colors text-left"
                                : "group flex items-center gap-3 rounded-2xl px-5 py-4 bg-white/8 hover:bg-white/14 border border-white/15 text-white transition-colors text-left"
                        }
                    >
                        <link.icon className="w-5 h-5 shrink-0" />
                        <span className="flex-1">
                            <span className="block font-bold text-sm">{link.title}</span>
                            <span className={`block text-xs mt-0.5 ${link.primary ? "text-landing-navy/70" : "text-white/60"}`}>
                                {link.desc}
                            </span>
                        </span>
                        <ArrowUpRight className="w-4 h-4 shrink-0 opacity-60 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </Link>
                </motion.div>
            ))}
        </div>
    )
}
```

`frontend/app/bio/page.tsx` — replace the inline `<div className="w-full max-w-sm ...">{LINKS.map(...)}</div>` block (lines 50-73) with `<BioLinks links={LINKS} />`, and remove the now-unused `Link`/`ArrowUpRight` imports if nothing else in the file uses them (check: `ArrowUpRight` is also used standalone inside each link's markup, which now lives in `BioLinks.tsx` — confirm `page.tsx` has no other use of `Link`/`ArrowUpRight` before removing).

- Stagger: `delay: i * 0.06` — inside AUDIT.md §7's 30–80ms stagger range,
  same shape as the existing `delay: i * 0.05` convention in
  `frontend/app/dashboard/page.tsx:904`, nudged to 0.06 only because there
  are 3 items here vs. up to 4 there and either value is within range — do
  not treat 0.06 as load-bearing, 0.05 is equally acceptable if the
  executor prefers exact consistency with the dashboard.
- `y: 8 → 0`, `duration: 0.2` — identical values to the dashboard's
  suggestion-card entrance (`frontend/app/dashboard/page.tsx:902-904`),
  reused deliberately for cohesion (AUDIT.md §7).

## Repo conventions to follow

- Stagger pattern to imitate exactly:
  `frontend/app/dashboard/page.tsx:899-904`:
  ```tsx
  {suggestionCards.map((card, i) => (
    <motion.button
      key={i}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.05, duration: 0.2 }}
  ```
- This plan wraps each `<Link>` in a `<motion.div>` rather than converting
  `<Link>` itself to `motion(Link)` — simpler, avoids fighting
  `next/link`'s own prop types, and matches how `QRCodeModal.tsx` wraps
  plain content in a `motion.div` rather than motion-ifying deeply nested
  elements.

## Steps

1. Create `frontend/components/bio/` directory and `frontend/components/bio/BioLinks.tsx` with the exact content from Target above.
2. In `frontend/app/bio/page.tsx`:
   - Add `import { BioLinks } from "@/components/bio/BioLinks"`.
   - Remove `import Link from "next/link"` and `ArrowUpRight` from the `lucide-react` import (keep `MessageCircle, Sparkles, Star` — check each is still used elsewhere in the file before removing any single one; `Star` is used in the social-proof block at the bottom, unrelated to this change).
   - Replace the block from `<div className="w-full max-w-sm flex flex-col gap-3 mb-8">` through its closing `</div>` (current lines 50-73) with `<BioLinks links={LINKS} />`.
   - The `LINKS` array (lines 13-36) stays in `page.tsx` unchanged — it's passed as a prop, not duplicated.

## Boundaries

- Do NOT move the `LINKS` array definition into `BioLinks.tsx` — keep content data in the server component, motion logic in the client component.
- Do NOT animate the logo, headline, subtitle, or social-proof line in this plan — scope is the link list only. (If a future pass wants the whole page to stagger as one sequence, that's a follow-up plan, not a silent scope expansion here.)
- Do NOT change `metadata` or any SEO-related export in `page.tsx`.
- Do NOT add `"use client"` to `page.tsx` itself — the whole point of the split is to keep it a server component.

## Verification

- **Mechanical**: `cd frontend && npx tsc --noEmit` — expect no new errors. Also run `npx next build` if feasible in this environment to confirm the server/client boundary is valid (a `metadata` export coexisting with a client-only import is fine; only a literal `"use client"` inside `page.tsx` itself would break the build).
- **Feel check**:
  - Visit `/bio` — confirm the three link cards rise+fade in with a visible stagger (top card first, ~60ms gap, then the next two), not all at once.
  - Confirm the logo/headline/subtitle/social-proof are still present and unanimated (unchanged from before this plan).
  - Confirm each link is still clickable and keyboard-focusable immediately — the stagger must not block interaction (AUDIT.md §7: "stagger is decorative — it must never block interaction"). Tab to the second link before its animation finishes and confirm focus lands correctly.
  - In DevTools Animations panel at 10% playback, confirm only `transform`/`opacity` animate.
- **Done when**: the three link cards visibly stagger in on every load of `/bio`, `page.tsx` remains a server component with its `metadata` export intact, and clicking/tabbing to any link works during and after the animation.
