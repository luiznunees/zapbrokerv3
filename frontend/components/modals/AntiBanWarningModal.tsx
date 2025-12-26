import { AlertTriangle, Shield, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AntiBanWarningModalProps {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
    delaySeconds: number
    batchSize: number
    batchDelaySeconds: number
    totalContacts: number
}

export function AntiBanWarningModal({
    isOpen,
    onClose,
    onConfirm,
    delaySeconds,
    batchSize,
    batchDelaySeconds,
    totalContacts
}: AntiBanWarningModalProps) {
    if (!isOpen) return null

    // Calcular nível de risco
    const getRiskLevel = () => {
        let riskScore = 0

        // Delay muito curto
        if (delaySeconds < 3) riskScore += 3
        else if (delaySeconds < 5) riskScore += 2
        else if (delaySeconds < 8) riskScore += 1

        // Lote muito grande
        if (batchSize > 100) riskScore += 3
        else if (batchSize > 50) riskScore += 2
        else if (batchSize > 30) riskScore += 1

        // Pausa entre lotes muito curta
        if (batchDelaySeconds < 30) riskScore += 3
        else if (batchDelaySeconds < 60) riskScore += 2
        else if (batchDelaySeconds < 120) riskScore += 1

        if (riskScore >= 7) return 'ALTO'
        if (riskScore >= 4) return 'MÉDIO'
        return 'BAIXO'
    }

    const riskLevel = getRiskLevel()
    const isHighRisk = riskLevel === 'ALTO'

    const warnings = []

    if (delaySeconds < 5) {
        warnings.push(`⚠️ Delay de ${delaySeconds}s entre mensagens é muito curto (recomendado: 5-10s)`)
    }

    if (batchSize > 50) {
        warnings.push(`⚠️ Lote de ${batchSize} mensagens é muito grande (recomendado: 30-50)`)
    }

    if (batchDelaySeconds < 60) {
        warnings.push(`⚠️ Pausa de ${batchDelaySeconds}s entre lotes é muito curta (recomendado: 60-120s)`)
    }

    const estimatedTime = Math.ceil(
        (totalContacts * delaySeconds +
            Math.floor(totalContacts / batchSize) * batchDelaySeconds) / 60
    )

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in">
            <div className="bg-card border-2 border-yellow-500/50 rounded-2xl shadow-2xl w-full max-w-lg animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-6 border-b border-border flex items-center justify-between bg-yellow-500/10">
                    <div className="flex items-center gap-3">
                        <div className={cn(
                            "w-12 h-12 rounded-full flex items-center justify-center",
                            isHighRisk ? "bg-red-500/20 text-red-500" : "bg-yellow-500/20 text-yellow-500"
                        )}>
                            <AlertTriangle className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="text-xl font-bold">Aviso de Segurança</h3>
                            <p className="text-sm text-muted-foreground">
                                Risco de bloqueio: <span className={cn(
                                    "font-bold",
                                    isHighRisk ? "text-red-500" : "text-yellow-500"
                                )}>{riskLevel}</span>
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-4">
                    <div className={cn(
                        "p-4 rounded-lg border-2",
                        isHighRisk
                            ? "bg-red-500/10 border-red-500/50"
                            : "bg-yellow-500/10 border-yellow-500/50"
                    )}>
                        <p className="font-medium mb-2">
                            {isHighRisk
                                ? "⛔ Suas configurações estão MUITO agressivas!"
                                : "⚠️ Suas configurações podem ser arriscadas!"
                            }
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Campanhas muito rápidas podem ser detectadas pelo WhatsApp como spam,
                            resultando em bloqueio temporário ou permanente da sua conta.
                        </p>
                    </div>

                    {/* Warnings List */}
                    {warnings.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-sm font-medium">Problemas identificados:</p>
                            <ul className="space-y-1">
                                {warnings.map((warning, index) => (
                                    <li key={index} className="text-sm text-muted-foreground pl-4">
                                        {warning}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-3 p-4 bg-background rounded-lg border border-border">
                        <div>
                            <p className="text-xs text-muted-foreground">Total de Contatos</p>
                            <p className="text-lg font-bold">{totalContacts}</p>
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground">Tempo Estimado</p>
                            <p className="text-lg font-bold">~{estimatedTime} min</p>
                        </div>
                    </div>

                    {/* Recommendations */}
                    <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                        <div className="flex items-start gap-2">
                            <Shield className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-medium text-sm text-primary mb-1">Recomendações de Segurança:</p>
                                <ul className="text-xs text-muted-foreground space-y-1">
                                    <li>• Delay entre mensagens: 5-10 segundos</li>
                                    <li>• Tamanho do lote: 30-50 mensagens</li>
                                    <li>• Pausa entre lotes: 60-120 segundos</li>
                                    <li>• Use variações de mensagem para parecer mais natural</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Confirmation Checkbox */}
                    <div className="bg-background border-2 border-dashed border-border rounded-lg p-4">
                        <label className="flex items-start gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                id="risk-acknowledgment"
                                className="mt-1 w-4 h-4 rounded border-border"
                            />
                            <span className="text-sm">
                                <strong>Eu entendo os riscos</strong> e assumo a responsabilidade
                                por possíveis bloqueios na minha conta do WhatsApp.
                            </span>
                        </label>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border bg-card/50 flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 border border-border rounded-lg font-medium hover:bg-accent transition-colors"
                    >
                        Voltar e Ajustar
                    </button>
                    <button
                        onClick={() => {
                            const checkbox = document.getElementById('risk-acknowledgment') as HTMLInputElement
                            if (!checkbox?.checked) {
                                alert('Por favor, confirme que você entende os riscos.')
                                return
                            }
                            onConfirm()
                        }}
                        className={cn(
                            "flex-1 px-4 py-3 rounded-lg font-bold transition-all",
                            isHighRisk
                                ? "bg-red-500 text-white hover:bg-red-600"
                                : "bg-yellow-500 text-white hover:bg-yellow-600"
                        )}
                    >
                        {isHighRisk ? "Continuar Mesmo Assim" : "Continuar com Cuidado"}
                    </button>
                </div>
            </div>
        </div>
    )
}
