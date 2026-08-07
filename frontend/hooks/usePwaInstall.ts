"use client"

import { useEffect, useState, useCallback } from "react"

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>
    userChoice: Promise<{ outcome: "accepted" | "dismissed" }>
}

export function usePwaInstall() {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
    const [isStandalone, setIsStandalone] = useState(false)
    const [isIOS, setIsIOS] = useState(false)

    useEffect(() => {
        setIsStandalone(window.matchMedia("(display-mode: standalone)").matches)
        setIsIOS(/iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream)

        const handler = (e: Event) => {
            e.preventDefault()
            setDeferredPrompt(e as BeforeInstallPromptEvent)
        }
        window.addEventListener("beforeinstallprompt", handler)

        const installedHandler = () => setIsStandalone(true)
        window.addEventListener("appinstalled", installedHandler)

        return () => {
            window.removeEventListener("beforeinstallprompt", handler)
            window.removeEventListener("appinstalled", installedHandler)
        }
    }, [])

    const promptInstall = useCallback(async () => {
        if (!deferredPrompt) return
        await deferredPrompt.prompt()
        await deferredPrompt.userChoice
        setDeferredPrompt(null)
    }, [deferredPrompt])

    return {
        canInstall: !isStandalone && Boolean(deferredPrompt),
        isIOS: !isStandalone && isIOS,
        isStandalone,
        promptInstall,
    }
}
