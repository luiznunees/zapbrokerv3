import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    CheckCircle,
    MagicStick,
    Restart,
    UploadMinimalistic,
    FileText,
    InfoCircle
} from '@solar-icons/react'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

interface LeadImporterModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
}

export function LeadImporterModal({ isOpen, onClose, onSuccess }: LeadImporterModalProps) {
    const [step, setStep] = useState<'input' | 'result'>('input')
    const [pdfFile, setPdfFile] = useState<File | null>(null)
    const [pdfResult, setPdfResult] = useState<{ listName: string, count: number } | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handlePdfImport = async () => {
        if (!pdfFile) return

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('file', pdfFile)

            const response = await api.contacts.importPdf(formData)

            setPdfResult({
                listName: response.list.name,
                count: response.count
            })
            setStep('result')
            onSuccess() // Refresh lists in background
        } catch (error: any) {
            console.error("PDF Import failed", error)
            alert("Erro ao importar PDF: " + (error.message || "Erro desconhecido"))
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetState = () => {
        setStep('input')
        setPdfFile(null)
        setPdfResult(null)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-background/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-card border border-border rounded-[2rem] shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden"
            >
                {/* Header */}
                <div className="p-8 border-b border-border flex items-center justify-between bg-card z-10">
                    <div>
                        <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
                            <MagicStick className="w-6 h-6 text-primary" />
                            Importador Inteligente
                        </h2>
                        <p className="text-muted-foreground font-medium text-sm mt-1">
                            Criará uma <span className="text-primary font-bold">nova pasta</span> com o nome do arquivo.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar relative">

                    {/* Disclaimer Alert */}
                    <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start">
                        <InfoCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                        <div>
                            <h4 className="text-sm font-bold text-orange-600 dark:text-orange-400">Importante</h4>
                            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                A extração automática não é 100% precisa. Ela depende da formatação do PDF original.
                                Sempre revise os dados na pasta criada antes de iniciar campanhas.
                            </p>
                        </div>
                    </div>

                    {step === 'result' && pdfResult && (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">Importação Concluída!</h3>
                            <p className="text-muted-foreground max-w-sm">
                                Criamos a pasta <b className="text-foreground">{pdfResult.listName}</b> e importamos <b>{pdfResult.count}</b> contatos com sucesso.
                            </p>
                        </div>
                    )}

                    {step === 'input' && (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-3xl hover:border-primary/50 transition-all bg-accent/5 group cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}>

                            <input
                                type="file"
                                accept=".pdf"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                            />

                            {pdfFile ? (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-red-500">
                                        <FileText className="w-8 h-8" />
                                    </div>
                                    <p className="text-lg font-bold text-foreground">{pdfFile.name}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{(pdfFile.size / 1024).toFixed(1)} KB</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setPdfFile(null); }}
                                        className="mt-4 px-4 py-2 bg-accent hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-lg text-xs font-bold transition-colors"
                                    >
                                        Remover Arquivo
                                    </button>
                                </div>
                            ) : (
                                <div className="text-center group-hover:scale-105 transition-transform duration-300">
                                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                                        <UploadMinimalistic className="w-8 h-8" />
                                    </div>
                                    <p className="text-lg font-bold text-foreground">Clique para selecionar o PDF</p>
                                    <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
                                        Nós criaremos uma nova pasta automaticamente com o nome do arquivo.
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-border flex justify-end gap-3 bg-card/50 rounded-b-[2rem]">
                    <button
                        onClick={step === 'result' ? () => { onClose(); resetState(); } : onClose}
                        className="px-6 py-3 text-muted-foreground hover:bg-accent rounded-xl transition-colors font-bold text-sm"
                        disabled={isSubmitting}
                    >
                        {step === 'result' ? 'Fechar' : 'Cancelar'}
                    </button>

                    {step === 'result' ? (
                        <button
                            onClick={() => { resetState(); }}
                            className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 flex items-center gap-2 text-sm"
                        >
                            Importar Outro
                        </button>
                    ) : (
                        <button
                            onClick={handlePdfImport}
                            disabled={isSubmitting || !pdfFile}
                            className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                        >
                            {isSubmitting ? (
                                <>
                                    <Restart className="w-5 h-5 animate-spin" />
                                    Processando PDF...
                                </>
                            ) : (
                                <>
                                    <UploadMinimalistic className="w-5 h-5" />
                                    Confirmar Importação
                                </>
                            )}
                        </button>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
