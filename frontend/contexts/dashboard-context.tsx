"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface DashboardContextValue {
  newChatTrigger: number
  triggerNewChat: () => void
}

const DashboardCtx = createContext<DashboardContextValue>({
  newChatTrigger: 0,
  triggerNewChat: () => {},
})

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [newChatTrigger, setNewChatTrigger] = useState(0)

  const triggerNewChat = useCallback(() => setNewChatTrigger((v) => v + 1), [])

  return (
    <DashboardCtx.Provider value={{ newChatTrigger, triggerNewChat }}>
      {children}
    </DashboardCtx.Provider>
  )
}

export function useDashboard() {
  return useContext(DashboardCtx)
}
