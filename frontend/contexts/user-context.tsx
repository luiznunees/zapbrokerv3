"use client"

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from "react"
import { api } from "@/services/api"

interface UserContextValue {
  user: any
  loading: boolean
  refetch: () => Promise<any>
}

const UserCtx = createContext<UserContextValue>({ user: null, loading: true, refetch: async () => {} })

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const refetch = useCallback(async () => {
    try {
      const data: any = await api.auth.me()
      const u = data?.user || data
      setUser(u)
      return u
    } catch {
      setUser(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refetch()
  }, [refetch])

  return <UserCtx.Provider value={{ user, loading, refetch }}>{children}</UserCtx.Provider>
}

export function useUser() {
  return useContext(UserCtx)
}
