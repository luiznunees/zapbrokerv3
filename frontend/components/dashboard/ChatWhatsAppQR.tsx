"use client"

import { useEffect, useState } from "react"
import { Smartphone, CheckCircle2, RefreshCw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toFullPhoneDigits } from "@/lib/phone"
import { PhoneInput } from "@/components/ui/PhoneInput"

export type WhatsAppQrStatus = "connecting" | "connected" | "expired"

interface ChatWhatsAppQRProps {
  qrCode: string | null
  pairingCode?: string | null
  status: WhatsAppQrStatus
  onRegenerate: () => void
  onRequestPairingCode: (phoneNumber: string) => void
  onAlreadyConnected?: () => void
  regenerating?: boolean
}

const QR_STEPS = [
  "Abra o WhatsApp no seu celular",
  "Toque em Mais opções (⋮) ou Configurações",
  "Toque em Aparelhos conectados",
  "Toque em Conectar um aparelho e aponte a câmera pro código",
]

const CODE_STEPS = [
  "No celular com o WhatsApp, vá em Configurações",
  "Toque em Aparelhos conectados",
  'Toque em "Conectar um aparelho" > "Conectar com número de telefone"',
  "Digite o código acima",
]

function isMobileDevice() {
  if (typeof navigator === "undefined") return false
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function ChatWhatsAppQR({ qrCode, pairingCode, status, onRegenerate, onRequestPairingCode, onAlreadyConnected, regenerating }: ChatWhatsAppQRProps) {
  const isConnected = status === "connected"
  const isExpired = status === "expired"
  const [mode, setMode] = useState<"qrcode" | "code">(isMobileDevice() ? "code" : "qrcode")
  const [phoneNumber, setPhoneNumber] = useState("")

  useEffect(() => {
    if (pairingCode) setPhoneNumber("")
  }, [pairingCode])

  return (
    <div className="mt-2 w-full max-w-[280px] rounded-2xl border border-border bg-card p-4 transition-all">
      <div className="flex items-center gap-2.5 mb-3">
        <span
          className={cn(
            "flex items-center justify-center size-8 rounded-xl shrink-0",
            isConnected ? "bg-brand-green-500/15 text-brand-green-600" : "bg-primary/10 text-primary"
          )}
        >
          {isConnected ? <CheckCircle2 className="size-4.5" /> : <Smartphone className="size-4.5" />}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            {isConnected ? "WhatsApp conectado!" : "Conectar WhatsApp"}
          </p>
          {!isConnected && (
            <p className="text-[11px] text-muted-foreground/70">
              {isExpired ? "Código expirado" : mode === "code" ? "Use o código de pareamento" : "Escaneie o código abaixo"}
            </p>
          )}
        </div>
      </div>

      {isConnected ? (
        <div className="flex items-center gap-2 rounded-xl border border-brand-green-500/30 bg-brand-green-500/10 px-3 py-3 text-sm text-foreground">
          <span className="text-lg">🎉</span>
          Pronto! Seu número já está vinculado à plataforma.
        </div>
      ) : (
        <>
          <div className="flex bg-accent/50 rounded-lg p-1 mb-3">
            <button
              onClick={() => setMode("qrcode")}
              className={cn(
                "flex-1 text-[11px] font-medium py-1.5 rounded-md transition-colors",
                mode === "qrcode" ? "bg-card shadow text-foreground" : "text-muted-foreground"
              )}
            >
              QR Code
            </button>
            <button
              onClick={() => setMode("code")}
              className={cn(
                "flex-1 text-[11px] font-medium py-1.5 rounded-md transition-colors",
                mode === "code" ? "bg-card shadow text-foreground" : "text-muted-foreground"
              )}
            >
              Código
            </button>
          </div>

          {mode === "code" ? (
            pairingCode ? (
              <div className="space-y-3">
                <p className="text-center text-2xl font-bold tracking-[0.25em] text-foreground bg-accent/50 rounded-xl py-3">
                  {pairingCode}
                </p>
                <button
                  onClick={onRegenerate}
                  disabled={regenerating}
                  className="w-full text-[11px] underline text-muted-foreground disabled:opacity-60"
                >
                  Gerar novo código
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <PhoneInput
                  value={phoneNumber}
                  onChange={setPhoneNumber}
                  className="w-full justify-center text-sm font-medium bg-accent/50 border border-border rounded-lg py-2 px-3 focus-within:ring-2 focus-within:ring-primary"
                  inputClassName="text-center"
                />
                <button
                  onClick={() => onRequestPairingCode(toFullPhoneDigits(phoneNumber))}
                  disabled={regenerating || phoneNumber.length < 10}
                  className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-full shadow-lg transition-all"
                >
                  {regenerating ? "Gerando..." : "Gerar código"}
                </button>
              </div>
            )
          ) : (
            <div className="relative rounded-xl bg-white p-3 flex items-center justify-center aspect-square shadow-inner">
              {qrCode ? (
                <img
                  src={qrCode.startsWith("data:") ? qrCode : `data:image/png;base64,${qrCode}`}
                  alt="QR Code para conectar o WhatsApp"
                  className={cn("w-full h-full object-contain transition-all", isExpired && "blur-sm opacity-40")}
                />
              ) : (
                <Loader2 className="size-6 text-muted-foreground animate-spin" />
              )}

              {isExpired && (
                <button
                  onClick={onRegenerate}
                  disabled={regenerating}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 rounded-xl bg-black/60 text-white text-xs font-medium disabled:opacity-70"
                >
                  <RefreshCw className={cn("size-4", regenerating && "animate-spin")} />
                  Gerar novo código
                </button>
              )}
            </div>
          )}

          {!isExpired && (mode === "qrcode" ? !!qrCode : !!pairingCode) && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-primary">
              <span className="size-1.5 rounded-full bg-primary animate-pulse" />
              Aguardando conexão...
            </div>
          )}

          {!isExpired && (mode === "qrcode" ? !!qrCode : !!pairingCode) && onAlreadyConnected && (
            <button
              onClick={onAlreadyConnected}
              className="mt-2 w-full flex items-center justify-center gap-2 border border-primary text-primary text-xs font-bold py-2 rounded-full hover:bg-primary/5 transition-colors"
            >
              <CheckCircle2 className="size-3.5" />
              Já conectei
            </button>
          )}

          <ol className="mt-3 space-y-1">
            {(mode === "code" ? CODE_STEPS : QR_STEPS).map((step, i) => (
              <li key={i} className="text-[11px] text-muted-foreground/70 flex gap-1.5">
                <span className="text-muted-foreground/40">{i + 1}.</span>
                {step}
              </li>
            ))}
          </ol>
        </>
      )}
    </div>
  )
}
