"use client"

import { Smartphone, CheckCircle2, RefreshCw, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

export type WhatsAppQrStatus = "connecting" | "connected" | "expired"

interface ChatWhatsAppQRProps {
  qrCode: string | null
  status: WhatsAppQrStatus
  onRegenerate: () => void
  regenerating?: boolean
}

const STEPS = [
  "Abra o WhatsApp no seu celular",
  "Toque em Mais opções (⋮) ou Configurações",
  "Toque em Aparelhos conectados",
  "Toque em Conectar um aparelho e aponte a câmera pro código",
]

export function ChatWhatsAppQR({ qrCode, status, onRegenerate, regenerating }: ChatWhatsAppQRProps) {
  const isConnected = status === "connected"
  const isExpired = status === "expired"

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
              {isExpired ? "Código expirado" : "Escaneie o código abaixo"}
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

          {!isExpired && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Aguardando leitura do código...
            </div>
          )}

          <ol className="mt-3 space-y-1">
            {STEPS.map((step, i) => (
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
