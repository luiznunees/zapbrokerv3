"use client"

import { useId } from "react"
import { motion } from "framer-motion"
import { cn } from "@/lib/utils"

const ICON_PATH =
  "M45.636 0H66.0571H162.582C171.472 0 176.932 9.73165 172.298 17.3173L160.371 36.8419L103.197 47.9529L129.931 18.5834H54.7867L35.1477 50.9653L66.0571 32.4884H97.9289L36.1367 83.1704L149.184 59.5188L18.4796 116.017C8.26284 120.434 -1.56938 109.078 4.26571 99.6006L23.8 67.8739C22.0199 69.3529 19.9425 70.4674 17.6834 71.1287L14.6251 72.0239C4.63133 74.9492 -3.72133 64.0348 1.71561 55.1551L32.1554 5.44009C34.2247 2.06055 37.9027 0 41.8659 0H45.636Z"

const SIZES: Record<"sm" | "md" | "lg", number> = {
  sm: 28,
  md: 44,
  lg: 72,
}

interface BrandLoaderProps {
  size?: "sm" | "md" | "lg"
  label?: string
  className?: string
  fullScreen?: boolean
}

export function BrandLoader({ size = "md", label, className, fullScreen }: BrandLoaderProps) {
  const gradientId = useId()
  const clipId = useId()
  const width = SIZES[size]
  const height = width * (117 / 174)

  const content = (
    <div className={cn("flex flex-col items-center gap-3", className)}>
      <svg width={width} height={height} viewBox="0 0 174 117" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Carregando">
        <defs>
          <linearGradient id={gradientId} x1="423.5" y1="-41.5" x2="246" y2="177" gradientUnits="userSpaceOnUse">
            <stop stopColor="#0B3B82" />
            <stop offset="1" stopColor="#2E7CF6" />
          </linearGradient>
          <clipPath id={clipId}>
            <motion.rect
              x="0"
              width="174"
              initial={{ y: 117, height: 0 }}
              animate={{ y: [117, 0, 0, 117], height: [0, 117, 117, 0] }}
              transition={{ duration: 2, times: [0, 0.6, 0.85, 1], repeat: Infinity, ease: "easeInOut" }}
            />
          </clipPath>
        </defs>
        {/* Contorno "vazado" */}
        <path d={ICON_PATH} fill="none" stroke="currentColor" strokeOpacity={0.15} strokeWidth={3} />
        {/* Preenchimento animado */}
        <path d={ICON_PATH} fill={`url(#${gradientId})`} clipPath={`url(#${clipId})`} />
      </svg>
      {label && <p className="text-sm text-muted-foreground animate-pulse">{label}</p>}
    </div>
  )

  if (!fullScreen) return content

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      {content}
    </div>
  )
}
