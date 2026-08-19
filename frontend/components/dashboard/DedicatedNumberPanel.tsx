"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Smartphone, Loader2, Plus, Trash2, MessageSquareText, ArrowRight, RefreshCw, CheckCircle2, MapPin, CreditCard, ShieldCheck, FlaskConical,
} from "lucide-react"
import { api } from "@/services/api"
import { PoweredBySalvy } from "@/components/dashboard/PoweredBySalvy"
import { useUser } from "@/contexts/user-context"

interface DedicatedNumber {
  id: string
  user_id: string
  salvy_id: string | null
  phone_number: string
  area_code: number | null
  status: string
  canceled_at: string | null
  created_at: string
}

interface DedicatedNumberSms {
  id: string
  dedicated_number_id: string
  salvy_sms_id: string | null
  body: string | null
  origin: string | null
  verification_code: string | null
  received_at: string
}

interface Instance {
  id: string
  name: string
  evolution_id?: string
  status?: string
}

interface DedicatedNumberPanelProps {
  onCreateInstance: () => void
  onConnect: (instanceId: string, phoneNumber?: string) => void
  instances: Instance[]
}

export function DedicatedNumberPanel({ onCreateInstance, onConnect, instances }: DedicatedNumberPanelProps) {
  const { user } = useUser()
  const [numbers, setNumbers] = useState<DedicatedNumber[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showBuyForm, setShowBuyForm] = useState(false)
  const [ddd, setDdd] = useState("")
  const [cpf, setCpf] = useState("")
  const [cellphone, setCellphone] = useState("")
  const [checkout, setCheckout] = useState<{ id: string; amount: number; brCode: string; brCodeBase64: string; expiresAt: string } | null>(null)
  const [areaCodes, setAreaCodes] = useState<{ areaCode: number; available: boolean }[]>([])
  const [smsByNumber, setSmsByNumber] = useState<Record<string, DedicatedNumberSms[]>>({})
  const [error, setError] = useState<string | null>(null)
  const [canceling, setCanceling] = useState<string | null>(null)
  const [refreshingSms, setRefreshingSms] = useState(false)
  const [testingSms, setTestingSms] = useState<string | null>(null)
  const [testResult, setTestResult] = useState<Record<string, { ok: boolean; message: string }>>({})

  const activeNumbers = numbers.filter((n) => n.status === "active")

  // Pré-preenche CPF/celular com os dados usados no pagamento da assinatura
  useEffect(() => {
    if (user?.pixCpf && !cpf) setCpf(user.pixCpf)
    if (user?.pixCellphone && !cellphone) setCellphone(user.pixCellphone)
  }, [user, cpf, cellphone])

  const fetchNumbers = useCallback(async () => {
    try {
      const data = await api.dedicatedNumbers.list()
      setNumbers(data as DedicatedNumber[])
      return data as DedicatedNumber[]
    } catch (err) {
      console.error("Failed to fetch dedicated numbers:", err)
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchSms = useCallback(async (numbers: DedicatedNumber[]) => {
    for (const n of numbers) {
      if (n.status !== "active") continue
      try {
        const msgs = await api.dedicatedNumbers.sms(n.id)
        setSmsByNumber((prev) => ({ ...prev, [n.id]: msgs as DedicatedNumberSms[] }))
} catch (err) {
      console.error(`Failed to fetch SMS for ${n.id}:`, err)
    }
    }
  }, [])

  interface AreaCodesResponse {
  areaCodes: { areaCode: number; available: boolean }[]
}

  const availableCodes = areaCodes.filter((a) => a.available)
  const filteredCodes = ddd ? availableCodes.filter((a) => String(a.areaCode).startsWith(ddd)) : availableCodes

  const formatCpf = (v: string) => {
    const d = v.replace(/\D/g, "")
    if (d.length <= 3) return d
    if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`
    if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`
    return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
  }

  const formatCellphone = (v: string) => {
    const d = v.replace(/\D/g, "")
    if (d.length <= 2) return d
    if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }

useEffect(() => {
    fetchNumbers().then((data) => fetchSms(data))
    api.dedicatedNumbers.areaCodes()
      .then((res) => {
        const data = res as AreaCodesResponse
        const codes = data?.areaCodes || []
        setAreaCodes(codes)
        const firstAvailable = codes.find((a) => a.available)
        if (firstAvailable) setDdd((prev) => prev || String(firstAvailable.areaCode))
      })
      .catch(() => {})
  }, [fetchNumbers, fetchSms])

  useEffect(() => {
    if (activeNumbers.length === 0) return
    const interval = setInterval(() => {
      activeNumbers.forEach((n) => {
        api.dedicatedNumbers
          .sms(n.id)
          .then((msgs) => setSmsByNumber((prev) => ({ ...prev, [n.id]: msgs as DedicatedNumberSms[] })))
          .catch(() => {})
      })
    }, 4000)
    return () => clearInterval(interval)
  }, [activeNumbers])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const areaCode = Number(ddd)
    if (!areaCode || areaCode < 10 || areaCode > 99) {
      setError("Digite um DDD válido (ex: 11 para São Paulo).")
      return
    }
    if (!availableCodes.some((a) => a.areaCode === areaCode)) {
      setError("Este DDD está esgotado no momento. Escolha um dos disponíveis abaixo.")
      return
    }
    if (!cpf || !cellphone) {
      setError("CPF e celular são obrigatórios para gerar o PIX.")
      return
    }
    setCreating(true)
    setError(null)
    try {
      const created = await api.dedicatedNumbers.checkout(areaCode, cpf, cellphone) as { id: string; amount: number; brCode: string; brCodeBase64: string; expiresAt: string }
      setCheckout(created)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar o pagamento.")
    } finally {
      setCreating(false)
    }
  }

  useEffect(() => {
    if (!checkout?.id) return
    const interval = setInterval(async () => {
      try {
        const res = await api.dedicatedNumbers.checkoutStatus(checkout.id) as { status: string }
        if (res.status === "active") {
          setCheckout(null)
          setShowBuyForm(false)
          setDdd("")
          setCpf("")
          setCellphone("")
          const data = await fetchNumbers()
          await fetchSms(data.filter((n) => n.status === "active"))
          clearInterval(interval)
        }
      } catch { /* ignore */ }
    }, 3000)
    return () => clearInterval(interval)
  }, [checkout?.id, fetchNumbers, fetchSms])

  const handleCheckPaid = async () => {
    if (!checkout?.id) return
    try {
      const res = await api.dedicatedNumbers.checkoutStatus(checkout.id) as { status: string }
      if (res.status === "active") {
        setCheckout(null)
        setShowBuyForm(false)
        setDdd("")
        setCpf("")
        setCellphone("")
        const data = await fetchNumbers()
        await fetchSms(data.filter((n) => n.status === "active"))
      } else {
        setError("Pagamento ainda não detectado. Assim que o PIX for pago, o número é ativado automaticamente.")
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível verificar o pagamento.")
    }
  }

  const handleCopyPix = async () => {
    if (!checkout?.brCode) return
    try {
      await navigator.clipboard.writeText(checkout.brCode)
      setError(null)
    } catch {
      setError("Não foi possível copiar o código PIX.")
    }
  }

  const handleCancel = async (id: string) => {
    if (!confirm("Cancelar este número dedicado? A linha será cancelada e cobrada integralmente neste mês.")) return
    setCanceling(id)
    try {
      await api.dedicatedNumbers.cancel(id)
      await fetchNumbers()
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cancelar número dedicado.")
    } finally {
      setCanceling(null)
    }
  }

  const handleRefreshSms = async (number: DedicatedNumber) => {
    if (refreshingSms) return
    setRefreshingSms(true)
    try {
      await fetchSms([number])
    } finally {
      setRefreshingSms(false)
    }
  }

  const handleTestSms = async (number: DedicatedNumber) => {
    if (testingSms) return
    setTestingSms(number.id)
    setTestResult((prev) => ({ ...prev, [number.id]: { ok: true, message: "Enviando SMS de teste..." } }))
    try {
      await api.dedicatedNumbers.simulateSms(number.id, "ZapBroker: seu codigo de verificacao e 483920.")
      setTestResult((prev) => ({ ...prev, [number.id]: { ok: true, message: "SMS enviado! O código aparece em alguns segundos." } }))
      setTimeout(() => fetchSms([number]), 3000)
    } catch (err: unknown) {
      setTestResult((prev) => ({ ...prev, [number.id]: { ok: false, message: err instanceof Error ? err.message : "Falha ao enviar SMS de teste." } }))
    } finally {
      setTestingSms(null)
    }
  }

  const formatPhone = (phone: string) => {
    const digits = phone.replace(/\D/g, "")
    if (digits.length === 13) {
      return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 5)} ${digits.slice(5, 9)}-${digits.slice(9)}`
    }
    if (digits.length === 12) {
      return `+${digits.slice(0, 2)} (${digits.slice(2, 4)}) ${digits.slice(4, 8)}-${digits.slice(8)}`
    }
    return phone
  }

  const connectedInstanceFor = (number: DedicatedNumber) =>
    instances.find((i) => i.evolution_id?.includes(number.id.slice(0, 4)) || i.name?.includes(number.id.slice(0, 4)))

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-transparent to-transparent overflow-hidden">
      <div className="p-5 space-y-5">
        <div className="flex items-start gap-3">
          <span className="flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary shrink-0">
            <Smartphone className="size-5" />
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-foreground leading-tight">Número para WhatsApp</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {activeNumbers.length > 0
                ? "Recebe o código de confirmação sem usar seu número pessoal. R$ 29,90/mês."
                : "Um número extra só para receber o código de confirmação do WhatsApp."}
            </p>
          </div>
        </div>

        {error && (
          <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-3 text-xs text-red-600 font-medium">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="size-4 animate-spin mr-2" /> Carregando...
          </div>
        ) : activeNumbers.length > 0 ? (
          <div className="space-y-4">
            {activeNumbers.map((number) => {
              const numberSms = smsByNumber[number.id] || []
              const connectedInstance = connectedInstanceFor(number)
              return (
                <div key={number.id} className="rounded-xl bg-white/70 border border-border p-4 space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] uppercase tracking-wide text-muted-foreground font-semibold mb-1">Seu número</p>
                      <p className="text-2xl font-bold text-foreground tracking-wide">{formatPhone(number.phone_number)}</p>
                    </div>
                    {connectedInstance ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-600 bg-emerald-500/10 border border-emerald-500/30 rounded-full px-2.5 py-1">
                        <CheckCircle2 className="size-3.5" /> Conectado
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[11px] font-semibold text-amber-600 bg-amber-500/10 border border-amber-500/30 rounded-full px-2.5 py-1">
                        <span className="size-1.5 rounded-full bg-amber-500 animate-pulse" /> Aguardando
                      </span>
                    )}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
                      <span className="mt-0.5">1.</span>
                      <span>Cadastre o número no <strong>WhatsApp Business</strong> do celular.</span>
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed flex items-start gap-2">
                      <span className="mt-0.5">2.</span>
                      <span>Quando o SMS chegar, o código aparece na lista abaixo.</span>
                    </p>
                  </div>

                  {!connectedInstance && (
                    <button
                      onClick={instances.length > 0
                        ? () => onConnect(instances[0].id, number.phone_number)
                        : () => onCreateInstance()}
                      className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-colors disabled:opacity-50"
                    >
                      {instances.length > 0 ? (
                        <><ArrowRight className="size-4" /> Conectar este número</>
                      ) : (
                        <><Plus className="size-4" /> Criar instância com este número</>
                      )}
                    </button>
                  )}

                  <div className="rounded-xl bg-white border border-border p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <MessageSquareText className="size-4 text-primary" />
                      <p className="text-xs font-bold text-foreground uppercase tracking-wide flex-1">SMS recebidos</p>
                      <button
                        type="button"
                        onClick={() => handleTestSms(number)}
                        disabled={testingSms === number.id}
                        title="Testar recebimento de SMS (sandbox)"
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 text-[11px] font-semibold transition-colors disabled:opacity-50"
                      >
                        <FlaskConical className={`size-3 ${testingSms === number.id ? "animate-spin" : ""}`} />
                        Testar SMS
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRefreshSms(number)}
                        disabled={refreshingSms}
                        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-white text-[11px] font-semibold transition-colors disabled:opacity-50"
                        title="Recarregar mensagens"
                      >
                        <RefreshCw className={`size-3 ${refreshingSms ? "animate-spin" : ""}`} />
                        Recarregar
                      </button>
                    </div>
                    {testResult[number.id] && (
                      <p className={`text-[11px] font-medium mb-2 ${testResult[number.id].ok ? "text-emerald-600" : "text-rose-500"}`}>
                        {testResult[number.id].message}
                      </p>
                    )}
                    {numberSms.length === 0 ? (
                      <p className="text-xs text-muted-foreground/70 py-2">
                        Nenhum SMS ainda. Quando chegar, o código aparece acima.
                      </p>
                    ) : (
                      <ul className="space-y-2 max-h-56 overflow-y-auto pr-1">
                        {numberSms.map((sms) => (
                          <li key={sms.id} className="rounded-lg border border-border/70 bg-white p-3">
                            {sms.verification_code && (
                              <p className="text-sm font-bold text-foreground tracking-[0.2em] mb-1">
                                Código: {sms.verification_code}
                              </p>
                            )}
                            {sms.body && (
                              <p className="text-xs text-muted-foreground leading-relaxed break-words">{sms.body}</p>
                            )}
                            <div className="flex items-center justify-between mt-1.5 text-[11px] text-muted-foreground/70">
                              <span>{sms.origin ? `De: ${sms.origin}` : "SMS"}</span>
                              <span>{new Date(sms.received_at).toLocaleString("pt-BR")}</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleCancel(number.id)}
                    disabled={canceling === number.id}
                    className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[11px] text-muted-foreground/70 hover:text-red-600 transition-colors disabled:opacity-50"
                  >
                    {canceling === number.id ? <Loader2 className="size-3 animate-spin" /> : <Trash2 className="size-3" />} Remover este número
                  </button>
                </div>
              )
            })}

            <button
              onClick={() => setShowBuyForm(true)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-primary/30 text-primary hover:bg-primary/10 text-sm font-bold transition-colors"
            >
              <Plus className="size-4" /> Adicionar outro número
            </button>
          </div>
        ) : showBuyForm ? checkout ? (
          <div className="rounded-xl bg-white/70 border border-border p-4 space-y-4">
            <p className="text-xs font-bold text-foreground uppercase tracking-wide">Pague para ativar</p>
            <p className="text-xs text-muted-foreground">
              Escaneie o QR com o app do banco ou copie o código.
            </p>
            <p className="text-2xl font-bold text-foreground">
              R$ {(checkout.amount / 100).toFixed(2).replace(".", ",")}
            </p>
            {checkout.brCodeBase64 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={checkout.brCodeBase64.startsWith("data:") ? checkout.brCodeBase64 : `data:image/png;base64,${checkout.brCodeBase64}`}
                alt="QR Code PIX"
                className="mx-auto size-48 rounded-xl border border-border bg-white"
              />
            )}
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={checkout.brCode}
                onFocus={(e) => e.target.select()}
                className="flex-1 min-w-0 px-3 py-2 rounded-lg bg-white border border-border text-xs text-muted-foreground"
              />
              <button
                type="button"
                onClick={handleCopyPix}
                className="px-3 py-2 rounded-lg border border-primary/30 text-primary hover:bg-primary/10 text-xs font-bold transition-colors"
              >
                Copiar
              </button>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCheckPaid}
                disabled={creating}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`size-4 ${creating ? "animate-spin" : ""}`} /> Já fiz o pagamento
              </button>
              <button
                type="button"
                onClick={() => setCheckout(null)}
                className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="rounded-xl bg-white/70 border border-border p-3 flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Receba SMS de confirmação (como o do WhatsApp) sem usar seu número pessoal.
                O código chega aqui no painel.
              </p>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                  DDD (código da sua região)
                </label>
                <div className="relative">
                  <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <MapPin className="size-4 text-muted-foreground" />
                  </div>
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={ddd}
                    onChange={(e) => setDdd(e.target.value.replace(/\D/g, "").slice(0, 2))}
                    placeholder="Digite o DDD (ex: 11)"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-white/70 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                  {ddd.length === 2 && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {availableCodes.some((a) => String(a.areaCode) === ddd) ? (
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
                          <CheckCircle2 className="size-3.5" /> Disponível
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold text-rose-500">Esgotado</span>
                      )}
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  {availableCodes.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {filteredCodes.map((a) => (
                        <button
                          key={a.areaCode}
                          type="button"
                          onClick={() => setDdd(String(a.areaCode))}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors border ${
                            ddd === String(a.areaCode)
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-white/70 border-border text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {a.areaCode}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground">Carregando DDDs disponíveis...</p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1.5">
                    Clique no DDD que quiser ou digite para buscar.
                  </p>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-muted-foreground">Seus dados</label>
                  <span className="text-[10px] text-muted-foreground/70 flex items-center gap-1">
                    <ShieldCheck className="size-3" /> Do seu pagamento
                  </span>
                </div>
                <div className="space-y-2">
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={formatCpf(cpf)}
                    onChange={(e) => setCpf(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    placeholder="000.000.000-00"
                    className="w-full px-4 py-2.5 rounded-lg bg-white/70 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={formatCellphone(cellphone)}
                    onChange={(e) => setCellphone(e.target.value.replace(/\D/g, "").slice(0, 11))}
                    placeholder="(11) 99999-9999"
                    className="w-full px-4 py-2.5 rounded-lg bg-white/70 border border-border focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm"
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">
                  Vem do seu cadastro. Mude se precisar.
                </p>
              </div>

              <div className="rounded-xl bg-primary/5 border border-primary/20 p-3 flex items-center justify-between">
                <div className="space-y-0.5">
                  <p className="text-[11px] font-bold text-foreground uppercase tracking-wide">Valor</p>
                  <p className="text-[11px] text-muted-foreground">
                    Pague agora e o número ativa na hora.
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <CreditCard className="size-4 text-primary" />
                  <span className="text-lg font-bold text-foreground">R$ 29,90</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-colors disabled:opacity-50"
                >
                  {creating ? <Loader2 className="size-4 animate-spin" /> : <ArrowRight className="size-4" />} Pagar e ativar
                </button>
                <button
                  type="button"
                  onClick={() => setShowBuyForm(false)}
                  className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="rounded-xl bg-white/70 border border-border p-4 space-y-3">
            <div className="flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-primary shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Receba o <strong>código de confirmação</strong> do WhatsApp num número separado, sem usar o seu número pessoal.
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CreditCard className="size-4 text-primary" />
                <span className="text-sm font-bold text-foreground">R$ 29,90</span>
                <span className="text-[11px] text-muted-foreground">/mês</span>
              </div>
              <button
                onClick={() => setShowBuyForm(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-sm font-bold transition-colors"
              >
                <Plus className="size-4" /> Comprar
              </button>
            </div>
          </div>
        )}

        <div className="pt-2 border-t border-border/60">
          <PoweredBySalvy />
        </div>
      </div>
    </div>
  )
}