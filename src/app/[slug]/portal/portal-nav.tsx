"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Calendar, PawPrint, LayoutDashboard, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { logoutPortal } from "@/lib/actions/client-portal"
import { cn } from "@/lib/utils"

interface PortalNavProps {
  orgName: string
  orgSlug: string
  clientName: string
}

export function PortalNav({ orgName, orgSlug, clientName }: PortalNavProps) {
  const pathname = usePathname()

  const navItems = [
    {
      href: `/${orgSlug}/portal/dashboard`,
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: `/${orgSlug}/portal/appointments`,
      label: "Appointments",
      icon: Calendar,
    },
    {
      href: `/${orgSlug}/portal/pets`,
      label: "My Pets",
      icon: PawPrint,
    },
  ]

  const handleLogout = async () => {
    await logoutPortal()
    window.location.href = `/${orgSlug}/portal`
  }

  return (
    <div className="mb-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href={`/${orgSlug}`} className="text-sm text-muted-foreground hover:text-primary">
            {orgName}
          </Link>
          <p className="text-xs text-muted-foreground">Client Portal</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {clientName}
          </span>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            <span className="ml-2 hidden sm:inline">Sign out</span>
          </Button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex gap-1 p-1 bg-muted rounded-xl">
        {navItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
                isActive
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{item.label}</span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
}
