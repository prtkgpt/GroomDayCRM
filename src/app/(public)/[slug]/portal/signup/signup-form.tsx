"use client"

import { useState, useTransition } from "react"
import { Mail, Loader2, CheckCircle, User, Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestSignup } from "@/lib/actions/portal-auth"
import { cn } from "@/lib/utils"
import type { Theme } from "@/lib/themes"

interface PortalSignupFormProps {
  slug: string
  theme: Theme
}

export function PortalSignupForm({ slug, theme }: PortalSignupFormProps) {
  const [isPending, startTransition] = useTransition()
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.email || !formData.firstName || !formData.lastName) {
      setError("Please fill in all required fields")
      return
    }

    startTransition(async () => {
      const result = await requestSignup(
        {
          email: formData.email.trim().toLowerCase(),
          firstName: formData.firstName.trim(),
          lastName: formData.lastName.trim(),
          phone: formData.phone.trim() || undefined,
        },
        slug
      )
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
        <h2 className="text-xl font-semibold mb-2">Account Created!</h2>
        <p className="text-muted-foreground mb-4">
          Check your email at <strong>{formData.email}</strong> for a login link.
        </p>
        <p className="text-sm text-muted-foreground">
          The link expires in 15 minutes.
          <br />
          Check your spam folder if you don&apos;t see it.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="firstName">First Name *</Label>
          <div className="relative mt-1">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="firstName"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="John"
              className="pl-10"
              disabled={isPending}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="lastName">Last Name *</Label>
          <Input
            id="lastName"
            type="text"
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            placeholder="Doe"
            className="mt-1"
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email">Email Address *</Label>
        <div className="relative mt-1">
          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="you@example.com"
            className="pl-10"
            disabled={isPending}
          />
        </div>
      </div>

      <div>
        <Label htmlFor="phone">Phone Number (optional)</Label>
        <div className="relative mt-1">
          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="(555) 123-4567"
            className="pl-10"
            disabled={isPending}
          />
        </div>
      </div>

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

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
            Creating Account...
          </>
        ) : (
          "Create Account"
        )}
      </Button>
    </form>
  )
}
