"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

interface DashboardContextValue {
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  toggleSidebar: () => void
  newChatTrigger: number
  triggerNewChat: () => void
}

const DashboardCtx = createContext<DashboardContextValue>({
  sidebarOpen: false,
  setSidebarOpen: () => {},
  toggleSidebar: () => {},
  newChatTrigger: 0,
  triggerNewChat: () => {},
})

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [newChatTrigger, setNewChatTrigger] = useState(0)

  const toggleSidebar = useCallback(() => setSidebarOpen((v) => !v), [])
  const triggerNewChat = useCallback(() => setNewChatTrigger((v) => v + 1), [])

  return (
    <DashboardCtx.Provider
      value={{ sidebarOpen, setSidebarOpen, toggleSidebar, newChatTrigger, triggerNewChat }}
    >
      {children}
    </DashboardCtx.Provider>
  )
}

export function useDashboard() {
  return useContext(DashboardCtx)
}
