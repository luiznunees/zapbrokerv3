"use client"

import { useEffect, useState } from "react"
import { Smartphone, CheckCircle2, RefreshCw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type WhatsAppQrStatus = "connecting" | "connected" | "expired"

interface ChatWhatsAppQRProps {
  qrCode: string | null
  pairingCode?: string | null
  status: WhatsAppQrStatus
  onRegenerate: () => void
  onRequestPairingCode: (phoneNumber: string) => void
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

export function ChatWhatsAppQR({ qrCode, pairingCode, status, onRegenerate, onRequestPairingCode, regenerating }: ChatWhatsAppQRProps) {
  const isConnected = status === "connected"
  const isExpired = status === "expired"
  const [mode, setMode] = useState<"qrcode" | "code">(isMobileDevice() ? "code" : "qrcode")
  const [phoneNumber, setPhoneNumber] = useState("")

  useEffect(() => {
    if (pairingCode) setPhoneNumber("")
  }, [pairingCode])

  return (
    <div
      className={cn(
        "mt-2 w-full max-w-[280px] rounded-2xl border p-4 transition-all",
        isConnected
          ? "border-emerald-500/30 bg-gradient-to-br from-emerald-950/40 to-teal-950/20"
          : "border-emerald-500/20 bg-gradient-to-br from-emerald-950/30 to-teal-950/10"
      )}
    >
      <div className="flex items-center gap-2.5 mb-3">
        <span
          className={cn(
            "flex items-center justify-center size-8 rounded-xl shrink-0",
            isConnected ? "bg-emerald-500/25 text-emerald-400" : "bg-emerald-500/15 text-emerald-400"
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
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/10 px-3 py-3 text-sm text-emerald-300">
          <span className="text-lg">🎉</span>
          Pronto! Seu número já está vinculado à plataforma.
        </div>
      ) : (
        <>
          <div className="flex bg-black/20 rounded-lg p-1 mb-3">
            <button
              onClick={() => setMode("qrcode")}
              className={cn(
                "flex-1 text-[11px] font-medium py-1.5 rounded-md transition-colors",
                mode === "qrcode" ? "bg-emerald-500/20 text-emerald-300" : "text-muted-foreground/70"
              )}
            >
              QR Code
            </button>
            <button
              onClick={() => setMode("code")}
              className={cn(
                "flex-1 text-[11px] font-medium py-1.5 rounded-md transition-colors",
                mode === "code" ? "bg-emerald-500/20 text-emerald-300" : "text-muted-foreground/70"
              )}
            >
              Código
            </button>
          </div>

          {mode === "code" ? (
            pairingCode ? (
              <div className="space-y-3">
                <p className="text-center text-2xl font-bold tracking-[0.25em] text-foreground bg-black/20 rounded-xl py-3">
                  {pairingCode}
                </p>
                <button
                  onClick={onRegenerate}
                  disabled={regenerating}
                  className="w-full text-[11px] underline text-muted-foreground/70 disabled:opacity-60"
                >
                  Gerar novo código
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input
                  type="tel"
                  inputMode="numeric"
                  placeholder="5511999999999"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
                  className="w-full text-center text-sm font-medium bg-black/20 border border-emerald-500/20 rounded-lg py-2 px-3 text-foreground focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
                />
                <button
                  onClick={() => onRequestPairingCode(phoneNumber)}
                  disabled={regenerating || phoneNumber.length < 10}
                  className="w-full bg-emerald-500/20 hover:bg-emerald-500/30 disabled:opacity-50 text-emerald-300 text-xs font-semibold py-2 rounded-lg transition-colors"
                >
                  {regenerating ? "Gerando..." : "Gerar código"}
                </button>
              </div>
            )
          ) : (
            <div className="relative rounded-xl bg-white p-3 flex items-center justify-center aspect-square">
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
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Aguardando conexão...
            </div>
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
