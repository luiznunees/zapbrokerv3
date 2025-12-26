import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
    CheckCircle,
    MagicStick,
    Restart,
    UploadMinimalistic,
    FileText,
    InfoCircle,
    FileDownload,
    DocumentText
} from '@solar-icons/react'
import { api } from '@/services/api'
import { cn } from '@/lib/utils'

interface LeadImporterModalProps {
    isOpen: boolean
    onClose: () => void
    onSuccess: () => void
    targetListId?: string
    targetListName?: string
}

export function LeadImporterModal({ isOpen, onClose, onSuccess, targetListId, targetListName }: LeadImporterModalProps) {
    const [mode, setMode] = useState<'pdf' | 'csv'>(targetListId ? 'csv' : 'pdf')
    const [step, setStep] = useState<'input' | 'result'>('input')

    const [file, setFile] = useState<File | null>(null)
    const [importResult, setImportResult] = useState<{ listName?: string, count: number } | null>(null)

    const [isSubmitting, setIsSubmitting] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleImport = async () => {
        if (!file) return

        setIsSubmitting(true)
        try {
            const formData = new FormData()
            formData.append('file', file)

            let result;

            if (mode === 'pdf') {
                const response = await api.contacts.importPdf(formData)
                result = { listName: response.list.name, count: response.count }
            } else {
                // CSV or Excel Import
                if (!targetListId) {
                    throw new Error("Selecione uma pasta para importar o CSV/Excel.")
                }

                // Check if file is Excel
                const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls')

                const response = isExcel
                    ? await api.contacts.importExcel(targetListId, formData)
                    : await api.contacts.import(targetListId, formData)

                result = { listName: targetListName, count: response.count }
            }

            setImportResult(result)
            setStep('result')
            onSuccess()
        } catch (error: any) {
            console.error("Import failed", error)
            alert("Erro ao importar: " + (error.message || "Erro desconhecido"))
        } finally {
            setIsSubmitting(false)
        }
    }

    const resetState = () => {
        setStep('input')
        setFile(null)
        setImportResult(null)
    }

    const downloadTemplate = () => {
        const link = document.createElement('a')
        link.href = '/template_contatos.csv'
        link.download = 'template_zapbroker.csv'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
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
                            Importador de Contatos
                        </h2>
                        <p className="text-muted-foreground font-medium text-sm mt-1">
                            {mode === 'pdf'
                                ? <span>Criará uma <span className="text-primary font-bold">nova pasta</span> com o nome do arquivo.</span>
                                : <span>Importando para <span className="text-primary font-bold">{targetListName || 'Pasta Selecionada'}</span>.</span>
                            }
                        </p>
                    </div>
                </div>

                {/* Tabs (Only if not forcing a specific mode implicitly, but user might want to switch) */}
                {/* Actually, if targetListId is present, we probably only want CSV, or maybe PDF into existing list? 
                   Backend PDF import creates a NEW list. So if we are in a list, we probably only want CSV.
                   Let's keep it simple: If targetListId is present, show CSV mode. If not, show PDF mode (default) but maybe allow switching?
                   For now, let's stick to the logic: Inside folder -> CSV. Outside -> PDF.
                */}

                {/* Content */}
                <div className="p-8 overflow-y-auto flex-1 custom-scrollbar relative">

                    {!targetListId && (
                        <div className="flex gap-2 mb-6 bg-accent/50 p-1 rounded-xl w-fit mx-auto">
                            <button
                                onClick={() => { setMode('pdf'); setFile(null); }}
                                className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all", mode === 'pdf' ? "bg-card shadow-sm text-primary" : "text-muted-foreground hover:text-foreground")}
                            >
                                Importar PDF (Nova Pasta)
                            </button>
                            <button
                                onClick={() => { alert("Para importar CSV, entre em uma pasta primeiro."); }}
                                className={cn("px-4 py-2 rounded-lg text-sm font-bold transition-all opacity-50 cursor-not-allowed", mode === 'csv' ? "bg-card shadow-sm text-primary" : "text-muted-foreground")}
                            >
                                Importar CSV (Excel)
                            </button>
                        </div>
                    )}

                    {/* Disclaimer / Template */}
                    {mode === 'pdf' ? (
                        <div className="space-y-4 mb-6">
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3 items-start">
                                <InfoCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400">Para que serve?</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        Ideal para <b>listagens de condomínios</b>, <b>documentos de proprietários</b>,
                                        relatórios de imobiliárias ou qualquer PDF com contatos.
                                        O sistema extrairá automaticamente nomes e telefones do documento.
                                    </p>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 flex gap-3 items-start">
                                <InfoCircle className="w-5 h-5 text-orange-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-orange-600 dark:text-orange-400">Importante</h4>
                                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                                        A extração automática não é 100% precisa. Ela depende da formatação do PDF original.
                                        Sempre revise os dados na pasta criada antes de iniciar campanhas.
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 mb-6">
                            <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 flex gap-3 items-start">
                                <InfoCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <h4 className="text-sm font-bold text-blue-600 dark:text-blue-400 mb-1">Para que serve?</h4>
                                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                                        Ideal para <b>planilhas de contatos</b>, listas exportadas de outros sistemas (CRM, Excel, Google Sheets)
                                        ou qualquer arquivo CSV/Excel com nomes e telefones organizados.
                                    </p>
                                    <button
                                        onClick={downloadTemplate}
                                        className="px-4 py-2 bg-blue-500 text-white text-xs font-bold rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                                    >
                                        <FileDownload className="w-4 h-4" />
                                        Baixar Modelo CSV
                                    </button>
                                </div>
                            </div>
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 flex gap-3 items-start">
                                <InfoCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-sm font-bold text-green-600 dark:text-green-400">Como preparar seu arquivo</h4>
                                    <ul className="text-xs text-muted-foreground mt-2 leading-relaxed space-y-1 list-disc list-inside">
                                        <li>Use as colunas <b>"nome"</b> e <b>"telefone"</b></li>
                                        <li>Telefones devem estar no formato: <b>5511999998888</b> (com DDI e DDD)</li>
                                        <li>Aceita arquivos <b>.csv</b> e <b>.xlsx</b> (Excel)</li>
                                        <li>Baixe nosso modelo para garantir o formato correto</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 'result' && importResult && (
                        <div className="flex flex-col items-center justify-center py-10 text-center space-y-4">
                            <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground">Importação Concluída!</h3>
                            <p className="text-muted-foreground max-w-sm">
                                {mode === 'pdf'
                                    ? <span>Criamos a pasta <b className="text-foreground">{importResult.listName}</b> e importamos <b>{importResult.count}</b> contatos.</span>
                                    : <span>Importamos <b>{importResult.count}</b> contatos para a pasta <b className="text-foreground">{importResult.listName}</b>.</span>
                                }
                            </p>
                        </div>
                    )}

                    {step === 'input' && (
                        <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-border rounded-3xl hover:border-primary/50 transition-all bg-accent/5 group cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}>

                            <input
                                type="file"
                                accept={mode === 'pdf' ? ".pdf" : ".csv,.xlsx,.xls"}
                                ref={fileInputRef}
                                className="hidden"
                                onChange={(e) => setFile(e.target.files?.[0] || null)}
                            />

                            {file ? (
                                <div className="text-center">
                                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 text-primary">
                                        {mode === 'pdf' ? <FileText className="w-8 h-8" /> : <DocumentText className="w-8 h-8" />}
                                    </div>
                                    <p className="text-lg font-bold text-foreground">{file.name}</p>
                                    <p className="text-sm text-muted-foreground mt-1">{(file.size / 1024).toFixed(1)} KB</p>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setFile(null); }}
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
                                    <p className="text-lg font-bold text-foreground">
                                        Clique para selecionar o {mode === 'pdf' ? 'PDF' : 'CSV'}
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2 max-w-xs mx-auto">
                                        {mode === 'pdf'
                                            ? "Nós criaremos uma nova pasta automaticamente."
                                            : "Certifique-se de seguir o modelo padrão."}
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
                            onClick={handleImport}
                            disabled={isSubmitting || !file}
                            className="px-8 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:shadow-lg hover:shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm"
                        >
                            {isSubmitting ? (
                                <>
                                    <Restart className="w-5 h-5 animate-spin" />
                                    Processando...
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
