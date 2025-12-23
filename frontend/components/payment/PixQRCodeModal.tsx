import { useEffect, useState } from 'react'
import { X, Copy, CheckCircle, Loader2, QrCode } from 'lucide-react'
import { api } from '@/services/api'

interface PixQRCodeModalProps {
    pixData: {
        id: string
        brCode: string // PIX copy & paste code
        brCodeBase64?: string // QR Code image in base64
    }
    subscriptionId: string
    onClose: () => void
}

export function PixQRCodeModal({ pixData, subscriptionId, onClose }: PixQRCodeModalProps) {
    const [copied, setCopied] = useState(false)
    const [status, setStatus] = useState<'pending' | 'paid' | 'expired'>('pending')
    const [checking, setChecking] = useState(false)

    useEffect(() => {
        // Poll payment status every 5 seconds
        const interval = setInterval(checkStatus, 5000)
        return () => clearInterval(interval)
    }, [])

    const checkStatus = async () => {
        try {
            setChecking(true)
            const response = await api.payments.getSubscriptionStatus(subscriptionId)

            if (response.status === 'active') {
                setStatus('paid')
                setTimeout(() => {
                    // Payment confirmed silently
                    window.location.href = '/dashboard'
                }, 2000)
            } else if (response.status === 'expired' || response.status === 'cancelled') {
                setStatus('expired')
            }
        } catch (error) {
            console.error('Error checking status:', error)
        } finally {
            setChecking(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(pixData.brCode)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl max-w-md w-full p-6 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 hover:bg-accent rounded-lg transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Header */}
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <QrCode className="w-8 h-8 text-primary" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-2">
                        Pague com PIX
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Escaneie o QR Code ou copie o código PIX
                    </p>
                </div>

                {/* Status */}
                {status === 'paid' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6 flex items-center gap-3">
                        <CheckCircle className="w-6 h-6 text-emerald-500" />
                        <div>
                            <p className="font-bold text-emerald-500">Pagamento Confirmado!</p>
                            <p className="text-xs text-emerald-600">Redirecionando...</p>
                        </div>
                    </div>
                )}

                {status === 'pending' && (
                    <>
                        {/* QR Code Image */}
                        {pixData.brCodeBase64 && (
                            <div className="bg-white p-4 rounded-xl mb-6 flex justify-center">
                                <img
                                    src={pixData.brCodeBase64}
                                    alt="QR Code PIX"
                                    width={250}
                                    height={250}
                                    className="rounded-lg"
                                />
                            </div>
                        )}

                        {/* Copy Code */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-foreground mb-2">
                                Código PIX (Copia e Cola)
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={pixData.brCode}
                                    readOnly
                                    className="flex-1 px-4 py-3 rounded-lg bg-accent border border-border text-sm font-mono truncate"
                                />
                                <button
                                    onClick={copyToClipboard}
                                    className="px-4 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                                >
                                    {copied ? (
                                        <>
                                            <CheckCircle className="w-4 h-4" />
                                            Copiado!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4" />
                                            Copiar
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Instructions */}
                        <div className="bg-accent/50 rounded-lg p-4 mb-4">
                            <h3 className="font-bold text-sm text-foreground mb-2">
                                Como pagar:
                            </h3>
                            <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                                <li>Abra o app do seu banco</li>
                                <li>Escolha pagar com PIX</li>
                                <li>Escaneie o QR Code ou cole o código</li>
                                <li>Confirme o pagamento</li>
                            </ol>
                        </div>

                        {/* Status Check */}
                        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                            {checking ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Verificando pagamento...
                                </>
                            ) : (
                                <>
                                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                                    Aguardando pagamento
                                </>
                            )}
                        </div>
                    </>
                )}

                {status === 'expired' && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                        <p className="font-bold text-red-500 mb-2">Pagamento Expirado</p>
                        <p className="text-sm text-red-600">
                            O tempo para pagamento expirou. Por favor, tente novamente.
                        </p>
                        <button
                            onClick={onClose}
                            className="mt-4 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                        >
                            Fechar
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
