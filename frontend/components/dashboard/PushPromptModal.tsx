"use client"

import { useEffect, useState } from "react"
import { Bell, BellRing, X, Loader2, Smartphone } from "lucide-react"
import { usePush } from "@/hooks/usePush"

const STORAGE_KEY = "zapbroker_push_prompt_done"

export function PushPromptModal() {
  const { supported, permission, subscribed, subscribe, loading } = usePush()
  const [visible, setVisible] = useState(false)
  const [status, setStatus] = useState<"idle" | "success" | "denied">("idle")

  // Mostra só uma vez, na primeira visita ao site (após login, dentro do dashboard)
  useEffect(() => {
    if (!supported) return
    if (typeof window === "undefined") return
    const done = localStorage.getItem(STORAGE_KEY)
    if (done === "1") return
    const path = window.location.pathname
    // Só dispara em telas autenticadas (não na landing/login)
    if (!path.startsWith("/dashboard")) return
    const t = setTimeout(() => setVisible(true), 1500)
    return () => clearTimeout(t)
  }, [supported])

  const handleActivate = async () => {
    const ok = await subscribe()
    setStatus(ok ? "success" : "denied")
    // Só marca como "já vimos" em caso de sucesso — se falhar, tenta de novo na próxima visita.
    if (ok) localStorage.setItem(STORAGE_KEY, "1")
    setTimeout(() => setVisible(false), ok ? 1200 : 4000)
  }

  const handleLater = () => {
    localStorage.setItem(STORAGE_KEY, "1")
    setVisible(false)
  }

  if (!visible || !supported) return null
  // Se já está ativado, esconde — exceto no flash de "sucesso" logo após ativar.
  if ((permission === "granted" || subscribed) && status !== "success") return null

  return (
    <div className="fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-border shadow-2xl p-5">
        <div className="flex items-start justify-between mb-3">
          <span className="flex items-center justify-center size-11 rounded-xl bg-primary/10 text-primary">
            {status === "success" ? <BellRing className="size-5" /> : <Bell className="size-5" />}
          </span>
          <button
            onClick={handleLater}
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Fechar"
          >
            <X className="size-5" />
          </button>
        </div>

        {status === "success" ? (
          <div>
            <h3 className="text-base font-bold text-foreground">Notificações ativadas!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Você vai saber na hora quando receber um SMS de confirmação, uma resposta de lead ou novidades.
            </p>
          </div>
        ) : status === "denied" ? (
          <div>
            <h3 className="text-base font-bold text-foreground">Permissão negada</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Você pode ativar depois no navegador (ícone de cadeado → permissões → notificações). Queremos avisar você na hora que algo importante acontecer.
            </p>
          </div>
        ) : (
          <div>
            <h3 className="text-base font-bold text-foreground">Receba avisos no seu celular</h3>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
              Ative as notificações para saber na hora quando:
            </p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
              <li className="flex items-center gap-2">
                <Bell className="size-4 text-primary shrink-0" /> O código de confirmação do WhatsApp chegar
              </li>
              <li className="flex items-center gap-2">
                <Smartphone className="size-4 text-primary shrink-0" /> Um lead responder sua campanha
              </li>
              <li className="flex items-center gap-2">
                <Bell className="size-4 text-primary shrink-0" /> Seu pagamento ser confirmado
              </li>
            </ul>
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleActivate}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-colors disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Bell className="size-4" />} Ativar notificações
              </button>
              <button
                onClick={handleLater}
                className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                Agora não
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}