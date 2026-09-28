"use client"

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { CRISP_WEBSITE_ID, crispPush, isCrispEnabled } from '@/lib/crisp'

// Rotas onde a bolha padrão do Crisp some:
// - /dashboard já tem o SupportButton no mesmo canto, que abre o chat pelo menu
// - /admin e /zbteam são só do fundador
const HIDE_BUBBLE_PREFIXES = ['/dashboard', '/admin', '/zbteam']

export function CrispWidget() {
    const pathname = usePathname()
    const hideBubble = HIDE_BUBBLE_PREFIXES.some((p) => pathname?.startsWith(p))

    useEffect(() => {
        if (!isCrispEnabled || window.CRISP_WEBSITE_ID) return

        window.$crisp = window.$crisp || []
        window.CRISP_WEBSITE_ID = CRISP_WEBSITE_ID
        window.CRISP_RUNTIME_CONFIG = { locale: 'pt' }

        const script = document.createElement('script')
        script.src = 'https://client.crisp.chat/l.js'
        script.async = true
        document.head.appendChild(script)
    }, [])

    useEffect(() => {
        crispPush(['do', hideBubble ? 'chat:hide' : 'chat:show'])
        // Aberto pelo menu do SupportButton: ao fechar, a bolha volta a sumir.
        crispPush(['off', 'chat:closed'])
        if (hideBubble) crispPush(['on', 'chat:closed', () => crispPush(['do', 'chat:hide'])])
    }, [hideBubble])

    return null
}
