"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Loader2, CheckCircle, XCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { verifyMagicLink } from "@/lib/actions/portal-auth"
import { cn } from "@/lib/utils"
import type { Theme } from "@/lib/themes"

interface VerifyClientProps {
  token: string
  slug: string
  theme: Theme
}

export function VerifyClient({ token, slug, theme }: VerifyClientProps) {
  const router = useRouter()
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying")
  const [errorMessage, setErrorMessage] = useState<string>("")

  useEffect(() => {
    async function verify() {
      try {
        const result = await verifyMagicLink(token)

        if (result.success && result.slug) {
          setStatus("success")
          // Small delay to show success message before redirect
          setTimeout(() => {
            router.push(`/${result.slug}/portal/dashboard`)
          }, 1000)
        } else {
          setStatus("error")
          setErrorMessage(result.error || "Invalid or expired link")
        }
      } catch (error) {
        console.error("Verification error:", error)
        setStatus("error")
        setErrorMessage("An error occurred. Please try again.")
      }
    }

    verify()
  }, [token, router])

  if (status === "verifying") {
    return (
      <div className="bg-card rounded-lg shadow-lg p-8 text-center">
        <div className={cn(
          "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
          theme.colors.accent
        )}>
          <Loader2 className={cn("h-8 w-8 animate-spin", theme.colors.badgeText)} />
        </div>
        <h1 className="text-xl font-semibold mb-2">Verifying your link...</h1>
        <p className="text-muted-foreground">Please wait while we sign you in.</p>
      </div>
    )
  }

  if (status === "success") {
    return (
      <div className="bg-card rounded-lg shadow-lg p-8 text-center">
        <div className={cn(
          "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
          theme.colors.accent
        )}>
          <CheckCircle className={cn("h-8 w-8", theme.colors.badgeText)} />
        </div>
        <h1 className="text-xl font-semibold mb-2">Welcome back!</h1>
        <p className="text-muted-foreground">Redirecting to your dashboard...</p>
      </div>
    )
  }

  // Error state
  return (
    <div className="bg-card rounded-lg shadow-lg p-8 text-center">
      <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-destructive/10">
        <XCircle className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="text-xl font-semibold mb-2">Link Invalid</h1>
      <p className="text-muted-foreground mb-6">{errorMessage}</p>
      <Link href={`/${slug}/portal`}>
        <Button className={cn(
          theme.colors.primary,
          theme.colors.primaryForeground,
          theme.colors.buttonHover
        )}>
          Request New Link
        </Button>
      </Link>
    </div>
  )
}
