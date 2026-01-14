"use client"

import { useState, useTransition } from "react"
import { Mail, Loader2, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestMagicLink } from "@/lib/actions/portal-auth"
import { cn } from "@/lib/utils"
import type { Theme } from "@/lib/themes"

interface PortalLoginFormProps {
  slug: string
  theme: Theme
}

export function PortalLoginForm({ slug, theme }: PortalLoginFormProps) {
  const [email, setEmail] = useState("")
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!email) {
      setError("Please enter your email address")
      return
    }

    startTransition(async () => {
      const result = await requestMagicLink(email.trim().toLowerCase(), slug)
      if (result.success) {
        setSent(true)
      } else {
        setError(result.error || "Something went wrong")
      }
    })
  }

  if (sent) {
    return (
      <div className="text-center py-4">
        <div className={cn(
          "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
          theme.colors.accent
        )}>
          <CheckCircle className={cn("h-8 w-8", theme.colors.badgeText)} />
        </div>
        <h2 className="text-xl font-semibold mb-2">Check your email!</h2>
        <p className="text-muted-foreground mb-4">
          We sent a login link to <strong>{email}</strong>
        </p>
        <p className="text-sm text-muted-foreground">
          The link expires in 15 minutes.
          <br />
          Check your spam folder if you don&apos;t see it.
        </p>
        <Button
          variant="ghost"
          className="mt-4"
          onClick={() => {
            setSent(false)
            setEmail("")
          }}
        >
          Use a different email
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="email">Email Address</Label>
        <div className="relative mt-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="pl-10"
            disabled={isPending}
          />
        </div>
        {error && (
          <p className="text-sm text-destructive mt-1">{error}</p>
        )}
      </div>

      <Button
        type="submit"
        disabled={isPending}
        className={cn(
          "w-full",
          theme.colors.primary,
          theme.colors.primaryForeground,
          theme.colors.buttonHover
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Sending...
          </>
        ) : (
          "Send Login Link"
        )}
      </Button>
    </form>
  )
}
