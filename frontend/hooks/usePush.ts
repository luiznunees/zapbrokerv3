"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { api } from "@/services/api"

// Chave pública VAPID (deve bater com o backend). Gerada em npx web-push generate-vapid-keys.
const VAPID_PUBLIC_KEY =
  "BCgKk1bZzm80rN6E19R6Q_81xRgmB3VZH88sS3xoBJojGixjD19vQriTH3_p8ULqFcN2TDoqu_ZFtgkw1GPeX90"

function base64UrlToUint8Array(base64Url: string): Uint8Array<ArrayBuffer> {
  const padding = "=".repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, "+").replace(/_/g, "/")
  const raw = atob(base64)
  const output = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; ++i) {
    output[i] = raw.charCodeAt(i)
  }
  return output
}

export function usePush() {
  const [supported] = useState(() => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window)
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default")
  const [subscribed, setSubscribed] = useState(false)
  const [loading, setLoading] = useState(false)
  const regRef = useRef<ServiceWorkerRegistration | null>(null)

  const refreshPermission = useCallback(() => {
    if (!supported || typeof Notification === "undefined") {
      setPermission("unsupported")
      return
    }
    setPermission(Notification.permission)
  }, [supported])

  useEffect(() => {
    if (!supported) return
    refreshPermission()
  }, [supported, refreshPermission])

  const subscribe = useCallback(async (): Promise<boolean> => {
    if (!supported) return false
    setLoading(true)
    try {
      let reg = regRef.current
      if (!reg) {
        reg = await navigator.serviceWorker.register("/sw.js")
        regRef.current = reg
      }
      // Aguarda o service worker ficar ATIVO antes de assinar o push —
      // logo após register() ele ainda está instalando e o subscribe falha.
      const activeReg = await navigator.serviceWorker.ready
      const existing = await activeReg.pushManager.getSubscription()
      if (existing) {
        setSubscribed(true)
        return true
      }

      const sub = await activeReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64UrlToUint8Array(VAPID_PUBLIC_KEY),
      })

      const raw = sub.toJSON()
      if (raw.endpoint && raw.keys?.p256dh && raw.keys?.auth) {
        await api.push.subscribe(raw.endpoint, { p256dh: raw.keys.p256dh, auth: raw.keys.auth })
      }

      setSubscribed(true)
      refreshPermission()
      return true
    } catch (err) {
      console.error("Falha ao ativar notificações:", err)
      return false
    } finally {
      setLoading(false)
    }
  }, [supported, refreshPermission])

  const unsubscribe = useCallback(async () => {
    if (!supported) return
    setLoading(true)
    try {
      const reg = regRef.current || (await navigator.serviceWorker.getRegistration("/sw.js"))
      const existing = reg && (await reg.pushManager.getSubscription())
      if (existing) {
        await api.push.unsubscribe(existing.endpoint)
        await existing.unsubscribe()
      }
      setSubscribed(false)
    } catch (err) {
      console.error("Falha ao desativar notificações:", err)
    } finally {
      setLoading(false)
    }
  }, [supported])

  useEffect(() => {
    if (!supported) return
    const check = async () => {
      try {
        const reg = await navigator.serviceWorker.getRegistration("/sw.js")
        const sub = reg && (await reg.pushManager.getSubscription())
        setSubscribed(Boolean(sub))
      } catch {
        setSubscribed(false)
      }
    }
    check()
    window.addEventListener("focus", check)
    return () => window.removeEventListener("focus", check)
  }, [supported])

  return {
    supported,
    permission,
    subscribed,
    loading,
    subscribe,
    unsubscribe,
    requestPermission: subscribe,
  }
}