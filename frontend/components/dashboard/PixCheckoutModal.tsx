"use client"

import { useEffect, useState, useCallback } from 'react'
import { Loader2, ShieldCheck, Check, Copy, CheckCheck, X, Clock } from 'lucide-react'
import { api } from '@/services/api'
import { PLAN_INFO } from '@/lib/plans'

function formatCpf(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function isValidCpf(value: string): boolean {
    const cpf = value.replace(/\D/g, '')
    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false
    const digits = cpf.split('').map(Number)
    const calcCheckDigit = (length: number) => {
        let sum = 0
        for (let i = 0; i < length; i++) sum += digits[i] * (length + 1 - i)
        const remainder = (sum * 10) % 11
        return remainder === 10 ? 0 : remainder
    }
    return calcCheckDigit(9) === digits[9] && calcCheckDigit(10) === digits[10]
}

function formatCellphone(value: string) {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    return digits.replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2')
}

type PixCharge = {
    subscriptionId: string
    brCode: string
    brCodeBase64: string
    expiresAt: string
}

// In-app upgrade/renewal flow — deliberately a modal over the current page (settings),
// not a navigation to /checkout/redirect. That standalone page still exists for links
// that arrive from outside the app (renewal reminder emails), where there's no "current
// page" to stay on.
export function PixCheckoutModal({ planId, onClose, onSuccess }: { planId: string; onClose: () => void; onSuccess: () => void }) {
    const [cpf, setCpf] = useState('')
    const [cellphone, setCellphone] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [charge, setCharge] = useState<PixCharge | null>(null)
    const [copied, setCopied] = useState(false)
    const [checking, setChecking] = useState(false)
    const [checkMsg, setCheckMsg] = useState<string | null>(null)

    const plan = PLAN_INFO[planId]
    const cpfDigits = cpf.replace(/\D/g, '')
    const cpfTouched = cpfDigits.length > 0
    const cpfInvalid = cpfTouched && cpfDigits.length === 11 && !isValidCpf(cpf)
    const canSubmit = isValidCpf(cpf) && cellphone.replace(/\D/g, '').length >= 10
    const isExpired = charge ? new Date(charge.expiresAt).getTime() < Date.now() : false

    useEffect(() => {
        api.auth.me()
            .then((data: any) => {
                const u = data?.user || data
                if (u?.pixCpf) setCpf(formatCpf(u.pixCpf))
                if (u?.pixCellphone) setCellphone(formatCellphone(u.pixCellphone))
            })
            .catch(() => {})
    }, [])

    // Auto-poll so most people never need the manual button — but it isn't the only way out.
    useEffect(() => {
        if (!charge || isExpired) return
        const interval = setInterval(async () => {
            try {
                const data = await api.payments.getSubscriptionStatus(charge.subscriptionId)
                if (data.status === 'active') {
                    clearInterval(interval)
                    onSuccess()
                }
            } catch {
                // transient network error — keep polling
            }
        }, 4000)
        return () => clearInterval(interval)
    }, [charge, isExpired, onSuccess])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            const response: any = await api.payments.createSubscription(planId, { cpf, cellphone })
            if (response.brCodeBase64 && response.brCode) {
                setCharge({
                    subscriptionId: response.subscriptionId,
                    brCode: response.brCode,
                    brCodeBase64: response.brCodeBase64,
                    expiresAt: response.expiresAt,
                })
            } else {
                throw new Error('PIX não recebido')
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao preparar checkout')
        } finally {
            setLoading(false)
        }
    }

    const handleCopy = useCallback(() => {
        if (!charge) return
        navigator.clipboard.writeText(charge.brCode).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }, [charge])

    const handleCheckNow = async () => {
        if (!charge) return
        setChecking(true)
        setCheckMsg(null)
        try {
            const data: any = await api.payments.checkPaymentNow(charge.subscriptionId)
            if (data.status === 'active') {
                onSuccess()
                return
            }
            setCheckMsg('Ainda não identificamos o pagamento. Se você acabou de pagar, aguarde alguns segundos e tente de novo.')
        } catch {
            setCheckMsg('Não conseguimos verificar agora. Tente de novo em instantes.')
        } finally {
            setChecking(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
            <div className="bg-white border border-border rounded-2xl p-6 max-w-sm w-full relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-600">
                    <X className="w-5 h-5" />
                </button>

                {error ? (
                    <div className="text-center space-y-4 pt-2">
                        <div className="bg-red-50 text-red-600 p-4 rounded-lg text-sm text-left">{error}</div>
                        <button onClick={() => setError(null)} className="px-6 py-2 bg-primary text-white rounded-full text-sm font-bold">
                            Tentar novamente
                        </button>
                    </div>
                ) : charge ? (
                    isExpired ? (
                        <div className="text-center space-y-4 pt-2">
                            <Clock className="h-10 w-10 text-amber-500 mx-auto" />
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900">O PIX expirou</h2>
                                <p className="text-zinc-500 text-sm mt-1">Gere um novo código para continuar.</p>
                            </div>
                            <button onClick={() => setCharge(null)} className="w-full py-3 bg-primary text-white rounded-full text-sm font-bold">
                                Gerar novo PIX
                            </button>
                        </div>
                    ) : (
                        <div className="text-center space-y-4 pt-2">
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900">Pague com PIX para ativar seu plano</h2>
                                {plan && (
                                    <p className="text-zinc-500 text-sm mt-1">
                                        Plano {plan.name} · R$ {plan.price.toFixed(2).replace('.', ',')}/mês
                                    </p>
                                )}
                            </div>

                            <img src={charge.brCodeBase64} alt="QR Code PIX" className="w-52 h-52 mx-auto border border-zinc-200 rounded-lg p-2" />

                            <div className="space-y-1.5 text-left">
                                <label className="text-xs font-medium text-zinc-500">Ou copie o código</label>
                                <div className="flex items-center gap-2">
                                    <input readOnly value={charge.brCode} className="flex-1 min-w-0 text-xs border border-zinc-300 rounded-md px-2 py-2 bg-zinc-50 text-zinc-600 truncate" />
                                    <button onClick={handleCopy} className="shrink-0 flex items-center gap-1 px-3 py-2 bg-zinc-900 text-white rounded-md text-xs font-medium">
                                        {copied ? <CheckCheck className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                                        {copied ? 'Copiado' : 'Copiar'}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleCheckNow}
                                disabled={checking}
                                className="w-full py-3 bg-primary text-white rounded-full text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                Já fiz o pagamento
                            </button>
                            {checkMsg && <p className="text-xs text-amber-600">{checkMsg}</p>}

                            <p className="text-[11px] text-zinc-400">A confirmação também acontece sozinha assim que o PIX cair.</p>
                        </div>
                    )
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                        <div>
                            <h2 className="text-lg font-bold text-zinc-900">Assinar {plan?.name}</h2>
                            <p className="text-zinc-500 text-sm mt-0.5">Confirme seus dados para gerar o PIX</p>
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-zinc-700">CPF</label>
                            <input
                                type="text"
                                required
                                inputMode="numeric"
                                value={cpf}
                                onChange={(e) => setCpf(formatCpf(e.target.value))}
                                placeholder="000.000.000-00"
                                className={`w-full border rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${cpfInvalid ? 'border-red-400' : 'border-zinc-300'}`}
                            />
                            {cpfInvalid && <p className="text-xs text-red-500">CPF inválido. Confira os números digitados.</p>}
                        </div>

                        <div className="space-y-1">
                            <label className="text-sm font-medium text-zinc-700">Celular (WhatsApp)</label>
                            <input
                                type="text"
                                required
                                inputMode="numeric"
                                value={cellphone}
                                onChange={(e) => setCellphone(formatCellphone(e.target.value))}
                                placeholder="(00) 00000-0000"
                                className="w-full border border-zinc-300 rounded-md px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={!canSubmit || loading}
                            className="w-full py-3 bg-primary text-white rounded-full text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                            Gerar PIX
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
