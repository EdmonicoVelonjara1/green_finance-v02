"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

interface SidebarContextType {
  sidebarVisible: boolean
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

export function SidebarProvider({ children }: { children: ReactNode }) {
  const [sidebarVisible, setSidebarVisible] = useState(true)

  const toggleSidebar = () => {
    setSidebarVisible((prev) => !prev)
  }

  return <SidebarContext.Provider value={{ sidebarVisible, toggleSidebar }}>{children}</SidebarContext.Provider>
}

export function useSidebarToggle() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebarToggle must be used within a SidebarProvider")
  }
  return context
}
