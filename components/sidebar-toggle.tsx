"use client"

import { Menu, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSidebarToggle } from "@/components/sidebar-context"

export function SidebarToggle() {
  const { toggleSidebar, sidebarVisible } = useSidebarToggle()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleSidebar}
      className="ml-1 h-7 w-7 text-green-700 hover:bg-green-50"
    >
      {sidebarVisible ? <X size={16} /> : <Menu size={16} />}
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
}
