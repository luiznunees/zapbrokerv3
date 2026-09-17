"use client"

import { extractLocalPhoneDigits, formatLocalPhoneDisplay } from "@/lib/phone"
import { cn } from "@/lib/utils"

interface PhoneInputProps {
  /** DDD + número, sem o 55 — é isso que o componente pai guarda no estado. */
  value: string
  onChange: (localDigits: string) => void
  placeholder?: string
  disabled?: boolean
  autoFocus?: boolean
  /** Classes do container (borda, fundo, arredondamento) — o input em si fica sem estilo próprio. */
  className?: string
  inputClassName?: string
  ddiClassName?: string
}

// "+55" fixo fora da área editável — colar o prefixo dentro do mesmo texto que o
// usuário edita quebra a digitação em números curtos (o próprio dígito "5" do "55"
// vira ambíguo com o que a pessoa está digitando). Aqui o input nunca contém o "55".
export function PhoneInput({
  value, onChange, placeholder = "(11) 91234-5678", disabled, autoFocus, className, inputClassName, ddiClassName,
}: PhoneInputProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <span className={cn("text-sm font-medium text-muted-foreground shrink-0", ddiClassName)}>+55</span>
      <input
        type="tel"
        inputMode="numeric"
        value={formatLocalPhoneDisplay(value)}
        onChange={(e) => onChange(extractLocalPhoneDigits(e.target.value))}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        className={cn("flex-1 min-w-0 bg-transparent outline-none", inputClassName)}
      />
    </div>
  )
}
