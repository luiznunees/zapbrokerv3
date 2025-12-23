"use client"
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export default function WhatsAppDemo() {
    const [step, setStep] = useState(0)

    useEffect(() => {
        const timer = setInterval(() => {
            setStep((s) => (s < 4 ? s + 1 : s))
        }, 1500)
        return () => clearInterval(timer)
    }, [])

    return (
        <div className="relative mx-auto border-gray-800 dark:border-gray-800 bg-gray-800 border-[14px] rounded-[2.5rem] h-[500px] w-[280px] sm:w-[300px] shadow-xl">
            <div className="w-[148px] h-[18px] bg-gray-800 top-0 rounded-b-[1rem] left-1/2 -translate-x-1/2 absolute z-10"></div>
            <div className="h-[32px] w-[3px] bg-gray-800 absolute -start-[17px] top-[72px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[124px] rounded-s-lg"></div>
            <div className="h-[46px] w-[3px] bg-gray-800 absolute -start-[17px] top-[178px] rounded-s-lg"></div>
            <div className="h-[64px] w-[3px] bg-gray-800 absolute -end-[17px] top-[142px] rounded-e-lg"></div>

            <div className="rounded-[2rem] overflow-hidden w-full h-full bg-[#E5DDD5] dark:bg-[#0b141a] relative flex flex-col">
                {/* Header */}
                <div className="bg-[#075E54] dark:bg-[#202c33] p-3 pt-8 flex items-center gap-3 shadow-sm z-10 text-white">
                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold">
                        ⚡
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm leading-tight">ZapBroker AI</h3>
                        <p className="text-[10px] opacity-80">Online</p>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 p-3 space-y-3 overflow-hidden font-sans text-sm relative">
                    {/* Background Pattern */}
                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
                        style={{ backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")' }}
                    />

                    {/* Message 1: User */}
                    <div className={cn("flex justify-end transition-all duration-500 transform", step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                        <div className="bg-[#dcf8c6] dark:bg-[#005c4b] text-black dark:text-white p-2.5 rounded-lg rounded-tr-none shadow-sm max-w-[85%] relative">
                            <p>Dispara a oferta do Jardins para os leads mornos.</p>
                            <span className="text-[9px] text-gray-500 dark:text-gray-300 block text-right mt-1 ml-2">10:42 ✓✓</span>
                        </div>
                    </div>

                    {/* Message 2: Bot */}
                    <div className={cn("flex justify-start transition-all duration-500 delay-100 transform", step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                        <div className="bg-white dark:bg-[#202c33] text-black dark:text-white p-2.5 rounded-lg rounded-tl-none shadow-sm max-w-[85%] relative">
                            <p>Encontrei 42 leads com perfil na base "Mornos".</p>
                            <p className="mt-1">A mensagem será: <i>"Olá [Nome], surgiu uma oportunidade exclusiva no Jardins..."</i></p>
                            <p className="mt-2 font-bold text-primary">Posso enviar?</p>
                            <span className="text-[9px] text-gray-400 block text-right mt-1 ml-2">10:42</span>
                        </div>
                    </div>

                    {/* Message 3: User */}
                    <div className={cn("flex justify-end transition-all duration-500 delay-200 transform", step >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4")}>
                        <div className="bg-[#dcf8c6] dark:bg-[#005c4b] text-black dark:text-white p-2.5 rounded-lg rounded-tr-none shadow-sm max-w-[85%] relative">
                            <p>Manda ver! 🚀</p>
                            <span className="text-[9px] text-gray-500 dark:text-gray-300 block text-right mt-1 ml-2">10:43 ✓✓</span>
                        </div>
                    </div>

                    {/* Message 4: Bot Action */}
                    <div className={cn("flex justify-center transition-all duration-500 delay-300 transform", step >= 4 ? "opacity-100 scale-100" : "opacity-0 scale-95")}>
                        <div className="bg-gray-200 dark:bg-[#202c33]/80 p-1.5 px-3 rounded-full shadow-sm">
                            <p className="text-[10px] text-gray-600 dark:text-gray-300 flex items-center gap-1">
                                ⚡ Enviando 1/42...
                            </p>
                        </div>
                    </div>
                </div>

                {/* Input Area */}
                <div className="bg-[#f0f0f0] dark:bg-[#202c33] p-2 flex items-center gap-2 z-10">
                    <div className="w-6 h-6 rounded-full border border-gray-400 opacity-50"></div>
                    <div className="flex-1 h-8 bg-white dark:bg-[#2a3942] rounded-full px-3 text-xs flex items-center text-gray-500">
                        Digite uma mensagem...
                    </div>
                    <div className="w-8 h-8 rounded-full bg-[#00897b] flex items-center justify-center text-white text-xs">
                        🎤
                    </div>
                </div>
            </div>
        </div>
    )
}
