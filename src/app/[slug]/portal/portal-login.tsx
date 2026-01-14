"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Mail, Loader2, Check, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { requestPortalAccess, verifyPortalToken } from "@/lib/actions/client-portal"

interface PortalLoginProps {
  organizationId: string
  organizationSlug: string
  token?: string
}

export function PortalLogin({ organizationId, organizationSlug, token }: PortalLoginProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [email, setEmail] = useState("")
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [verifying, setVerifying] = useState(!!token)

  // Verify token if present in URL
  useEffect(() => {
    if (token) {
      setVerifying(true)
      verifyPortalToken(organizationId, token).then((result) => {
        if (result.success) {
          router.push(`/${organizationSlug}/portal/dashboard`)
        } else {
          setError(result.error || "Invalid or expired link")
          setVerifying(false)
        }
      })
    }
  }, [token, organizationId, organizationSlug, router])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    startTransition(async () => {
      try {
        const result = await requestPortalAccess(organizationId, email)
        if (result.success) {
          setSent(true)
          // In development, auto-redirect with token
          if (result._devToken) {
            router.push(`/${organizationSlug}/portal?token=${result._devToken}`)
          }
        }
      } catch (err) {
        setError("Something went wrong. Please try again.")
      }
    })
  }

  if (verifying) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Verifying your login...</p>
        </CardContent>
      </Card>
    )
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check className="h-6 w-6 text-emerald-600" />
          </div>
          <h2 className="text-xl font-semibold mb-2">Check your email</h2>
          <p className="text-muted-foreground mb-4">
            We sent a login link to <strong>{email}</strong>
          </p>
          <p className="text-sm text-muted-foreground">
            The link will expire in 1 hour. Check your spam folder if you do not see it.
          </p>
          <Button
            variant="ghost"
            className="mt-6"
            onClick={() => {
              setSent(false)
              setEmail("")
            }}
          >
            Use a different email
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="text-center">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <Mail className="h-6 w-6 text-primary" />
        </div>
        <CardTitle>Sign in to your account</CardTitle>
        <CardDescription>
          Enter your email to receive a magic login link
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-destructive/10 text-destructive text-sm text-center">
              {error}
            </div>
          )}
          <div>
            <Label htmlFor="email">Email address</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending || !email}>
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Sending...
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-muted-foreground">
            New customer?{" "}
            <a
              href={`/${organizationSlug}/book`}
              className="text-primary hover:underline font-medium"
            >
              Book an appointment
            </a>
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
