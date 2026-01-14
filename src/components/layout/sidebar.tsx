"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { UserButton } from "@clerk/nextjs"
import {
  LayoutDashboard,
  Calendar,
  Users,
  Scissors,
  Settings,
  Menu,
  X,
  Plus,
  UserCog,
  Sparkles,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { useState } from "react"

const navigation = [
  { name: "Dashboard", href: "/app", icon: LayoutDashboard },
  { name: "Calendar", href: "/app/calendar", icon: Calendar },
  { name: "Clients", href: "/app/clients", icon: Users },
  { name: "Staff", href: "/app/staff", icon: UserCog },
  { name: "Services", href: "/app/services", icon: Scissors },
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
      {/* Mobile header - Apple-style frosted glass */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 flex h-14 items-center justify-between bg-background/80 backdrop-blur-xl border-b px-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-1.5 -ml-1.5 rounded-lg hover:bg-accent transition-colors"
          >
            <Menu className="h-5 w-5" />
          </button>
          <Link href="/app" className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-semibold tracking-tight">GroomDay</span>
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" onClick={onNewBooking} className="h-8 px-3 rounded-lg shadow-sm">
            <Plus className="h-4 w-4 mr-1.5" />
            Book
          </Button>
          <UserButton afterSignOutUrl="/" />
        </div>
      </div>

      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-background shadow-2xl">
            <div className="flex h-14 items-center justify-between px-4 border-b">
              <Link href="/app" className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-semibold tracking-tight">GroomDay</span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="p-3 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname === item.href ||
                  (item.href !== "/app" && pathname.startsWith(item.href))
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
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

      {/* Desktop sidebar - Clean, minimal */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-60 lg:flex-col">
        <div className="flex grow flex-col overflow-y-auto bg-background border-r px-3 pb-4">
          {/* Logo */}
          <div className="flex h-14 shrink-0 items-center px-2">
            <Link href="/app" className="flex items-center gap-2.5">
              <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-sm">
                <Sparkles className="h-4.5 w-4.5 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold tracking-tight">GroomDay</span>
            </Link>
          </div>

          {/* New Booking Button - Prominent CTA */}
          <div className="px-2 pt-2 pb-4">
            <Button
              onClick={onNewBooking}
              className="w-full rounded-xl h-11 shadow-sm hover:shadow-md transition-all duration-200"
              size="lg"
            >
              <Plus className="h-5 w-5 mr-2" />
              New Booking
            </Button>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col gap-1 px-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href ||
                (item.href !== "/app" && pathname.startsWith(item.href))
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                    isActive
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <item.icon className={cn("h-5 w-5", isActive && "drop-shadow-sm")} />
                  {item.name}
                </Link>
              )
            })}
          </nav>

          {/* User section - Clean card */}
          <div className="mt-auto px-2 pt-4">
            <div className="flex items-center gap-3 rounded-xl bg-accent/50 p-3">
              <UserButton afterSignOutUrl="/" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{orgName}</p>
                <p className="text-xs text-muted-foreground">Free plan</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
