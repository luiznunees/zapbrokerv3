import { MessageCircle } from 'lucide-react'

export default function SupportButton() {
    return (
        <a
            href="https://wa.me/5551980985330?text=Olá,%20tenho%20interesse%20no%20ZapBroker!"
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg transition-all hover:scale-110 flex items-center gap-2 group"
            aria-label="Falar no WhatsApp"
        >
            <MessageCircle className="w-6 h-6" />
            <span className="max-w-0 overflow-hidden group-hover:max-w-xs transition-all duration-300 ease-in-out whitespace-nowrap font-bold">
                Falar com Suporte
            </span>
        </a>
    )
}
