import { X, Loader2, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

export interface QRCodeModalProps {
    isOpen: boolean;
    onClose: () => void;
    qrCode: string | null;
    isLoading: boolean;
    onRetry: () => void;
}

export function QRCodeModal({ isOpen, onClose, qrCode, isLoading, onRetry }: QRCodeModalProps) {
    const [isTimedOut, setIsTimedOut] = React.useState(false);

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

                    <div className="p-8 flex flex-col items-center justify-center text-center space-y-6">
                        {isLoading ? (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                <p className="text-sm text-muted-foreground animate-pulse">
                                    Gerando QR Code seguro...
                                </p>
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
