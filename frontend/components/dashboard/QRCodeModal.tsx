import { X, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';
import { BrandLoader } from '@/components/ui/BrandLoader';

export interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrCode: string | null;
    pairingCode?: string | null;
    isLoading: boolean;
    onRetry: () => void;
    onRequestPairingCode: (phoneNumber: string) => void;
}

function isMobileDevice() {
    if (typeof navigator === 'undefined') return false;
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function QRCodeModal({ isOpen, onClose, qrCode, pairingCode, isLoading, onRetry, onRequestPairingCode }: QRCodeModalProps) {
    const [isTimedOut, setIsTimedOut] = React.useState(false);
    const [mode, setMode] = React.useState<'qrcode' | 'code'>('qrcode');
    const [phoneNumber, setPhoneNumber] = React.useState('');

    React.useEffect(() => {
        if (isOpen) {
            setMode(isMobileDevice() ? 'code' : 'qrcode');
        }
    }, [isOpen]);

    React.useEffect(() => {
        if (isOpen && qrCode) {
            setIsTimedOut(false);
            const timer = setTimeout(() => setIsTimedOut(true), 30000); // 30s timeout
            return () => clearTimeout(timer);
        }
    }, [isOpen, qrCode]);

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="bg-card border border-border w-full max-w-md rounded-2xl shadow-2xl overflow-hidden"
                >
                    <div className="flex items-center justify-between p-4 border-b border-border bg-accent/50">
                        <div className="flex items-center gap-2">
                            <Smartphone className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-card-foreground">Conectar WhatsApp</h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="px-6 pt-4">
                        <div className="flex bg-accent/50 rounded-lg p-1">
                            <button
                                onClick={() => setMode('qrcode')}
                                className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${mode === 'qrcode' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}
                            >
                                QR Code
                            </button>
                            <button
                                onClick={() => setMode('code')}
                                className={`flex-1 text-sm font-medium py-1.5 rounded-md transition-colors ${mode === 'code' ? 'bg-card shadow text-foreground' : 'text-muted-foreground'}`}
                            >
                                Código
                            </button>
                        </div>
                    </div>

                    <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                        {mode === 'code' ? (
                            pairingCode ? (
                                <div className="space-y-4">
                                    <p className="text-3xl font-bold tracking-[0.3em] text-foreground bg-accent/50 rounded-xl py-4 px-6">
                                        {pairingCode}
                                    </p>
                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            1. No celular com o WhatsApp, vá em Configurações {'>'} Aparelhos Conectados
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            2. Toque em "Conectar um Aparelho" {'>'} "Conectar com número de telefone"
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            3. Digite o código acima
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => onRequestPairingCode(phoneNumber)}
                                        className="text-xs underline text-muted-foreground"
                                    >
                                        Gerar novo código
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-4 w-full">
                                    <p className="text-sm text-muted-foreground">
                                        Digite o número de WhatsApp que será conectado (com DDI e DDD):
                                    </p>
                                    <input
                                        type="tel"
                                        inputMode="numeric"
                                        placeholder="5511999999999"
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                                        className="w-full text-center text-lg font-medium bg-accent/50 border border-border rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary"
                                    />
                                    <button
                                        onClick={() => onRequestPairingCode(phoneNumber)}
                                        disabled={isLoading || phoneNumber.length < 10}
                                        className="w-full bg-primary hover:bg-primary/90 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-full shadow-lg transition-all"
                                    >
                                        {isLoading ? 'Gerando...' : 'Gerar Código'}
                                    </button>
                                </div>
                            )
                        ) : isLoading ? (
                            <div className="py-8">
                                <BrandLoader size="md" label="Gerando QR Code seguro..." />
                            </div>
                        ) : qrCode ? (
                            <div className="space-y-4 relative">
                                <div className={`p-4 bg-white rounded-xl shadow-inner mx-auto w-fit transition-all duration-500 ${isTimedOut ? 'blur-md opacity-50' : ''}`}>
                                    <img
                                        src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`}
                                        alt="WhatsApp QR Code"
                                        className="w-48 h-48 object-contain"
                                    />
                                </div>

                                {isTimedOut && (
                                    <div className="absolute inset-0 flex items-center justify-center z-10">
                                        <button
                                            onClick={onRetry}
                                            className="bg-primary hover:bg-primary/90 text-white font-bold py-2 px-6 rounded-full shadow-lg transform hover:scale-105 transition-all"
                                        >
                                            Gerar Novo Código
                                        </button>
                                    </div>
                                )}

                                <div>
                                    <p className="text-sm font-medium text-foreground">
                                        1. Abra o WhatsApp no seu celular
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        2. Vá em Configurações {'>'} Aparelhos Conectados
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        3. Toque em "Conectar um Aparelho" e aponte a câmera
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="py-8 text-destructive">
                                <p>Erro ao carregar QR Code.</p>
                                <button
                                    onClick={onRetry}
                                    className="mt-4 text-xs underline"
                                >
                                    Tentar novamente
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Chip Warning Disclaimer */}
                    <div className="px-6 pb-4">
                        <div className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-lg p-4">
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-yellow-500 flex items-center justify-center mt-0.5">
                                    <span className="text-white text-sm font-bold">!</span>
                                </div>
                                <div className="flex-1 text-left">
                                    <p className="font-bold text-sm text-yellow-700 mb-1">
                                        ⚠️ Aviso Importante sobre o Chip
                                    </p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">
                                        <strong>Use apenas chips aquecidos ou já utilizados.</strong> Chips novos têm maior chance de bloqueio pelo WhatsApp.
                                        Não nos responsabilizamos por bloqueios em chips novos ou não aquecidos.
                                    </p>
                                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                                        💡 <strong>Dica:</strong> Antes de conectar, use o chip normalmente por alguns dias,
                                        enviando mensagens para contatos reais e recebendo respostas.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-accent/30 text-center border-t border-border">
                        <p className="text-xs text-muted-foreground">
                            A conexão é criptografada e segura.
                        </p>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
