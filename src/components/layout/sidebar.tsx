"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Star,
  Settings,
  Menu,
  X,
  Plus,
  Repeat,
  BarChart3,
  Package,
  UserCog,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "Calendar", href: "/app/calendar", icon: Calendar },
  { name: "Clients", href: "/app/clients", icon: Users },
  { name: "Staff", href: "/app/staff", icon: UserCog },
  { name: "Recurring", href: "/app/recurring", icon: Repeat },
  { name: "Services", href: "/app/services", icon: Scissors },
  { name: "Inventory", href: "/app/inventory", icon: Package },
  { name: "Reports", href: "/app/reports", icon: BarChart3 },
  { name: "Reviews", href: "/app/reviews", icon: Star },
  { name: "Settings", href: "/app/settings", icon: Settings },
]

interface SidebarProps {
  orgName: string
  onNewBooking: () => void
}

export function Sidebar({ orgName, onNewBooking }: SidebarProps) {
  const pathname = usePathname()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <>
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-16 items-center justify-between border-b bg-background px-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2"
          >
            <Menu className="h-6 w-6" />
          </button>
          <span className="text-lg font-semibold text-primary">GroomDay</span>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onNewBooking}>
            <Plus className="h-4 w-4 mr-1" />
            Book
          </Button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-background shadow-xl">
            <div className="flex h-16 items-center justify-between px-4 border-b">
              <span className="text-lg font-semibold text-primary">GroomDay</span>
              <button onClick={() => setMobileMenuOpen(false)} className="p-2">
                <X className="h-6 w-6" />
              </button>
            </div>
            <nav className="p-4 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/app" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    {item.name}
                  </Link>
                )
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r bg-background px-4 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center border-b -mx-4 px-4">
            <Link href="/app" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Scissors className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">GroomDay</span>
            </Link>
          </div>

          {/* New Booking Button */}
          <Button onClick={onNewBooking} className="w-full" size="lg">
            <Plus className="h-5 w-5 mr-2" />
            New Booking
          </Button>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col gap-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/app" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User section */}
          <div className="flex items-center gap-3 rounded-lg border p-3">
            <UserButton afterSignOutUrl="/" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{orgName}</p>
              <p className="text-xs text-muted-foreground">Free plan</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
