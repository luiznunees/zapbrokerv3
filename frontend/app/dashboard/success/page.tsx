"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";


export default function SuccessPage() {
    const router = useRouter();

    useEffect(() => {
        // Automatically redirect to dashboard after 5 seconds
        const timer = setTimeout(() => {
            router.push("/dashboard");
        }, 5000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
            <div className="mx-auto w-full max-w-md text-center space-y-6 animate-in fade-in zoom-in duration-500">
                <div className="flex justify-center">
                    <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/20">
                        <CheckCircle2 className="h-16 w-16 text-green-600 dark:text-green-400" />
                    </div>
                </div>

                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight">Pagamento Recebido!</h1>
                    <p className="text-muted-foreground text-lg">
                        Obrigado por assinar o ZapBroker. Sua conta está sendo ativada agora mesmo.
                    </p>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground border">
                    Você será redirecionado para o painel em alguns segundos...
                </div>

                <button
                    onClick={() => router.push("/dashboard")}
                    className="w-full text-lg font-bold h-12 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center shadow-lg shadow-primary/20"
                >
                    Ir para o Dashboard agora
                </button>
            </div>
        </div>
    );
}
