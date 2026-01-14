"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  Loader2,
  CreditCard,
  MessageSquare,
  Mail,
  Star,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { integrationsSchema, type IntegrationsFormData } from "@/lib/validations"
import { updateIntegrations } from "@/lib/actions/organization"

interface IntegrationsSettingsProps {
  integrations: {
    stripeSecretKey: string | null
    stripePublishableKey: string | null
    twilioAccountSid: string | null
    twilioAuthToken: string | null
    twilioPhoneNumber: string | null
    resendApiKey: string | null
    googleReviewUrl: string | null
    yelpUrl: string | null
    facebookUrl: string | null
    instagramUrl: string | null
  }
}

function maskApiKey(key: string | null): string {
  if (!key) return ""
  if (key.length <= 8) return key
  return key.slice(0, 4) + "..." + key.slice(-4)
}

export function IntegrationsSettings({ integrations }: IntegrationsSettingsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showStripeSecret, setShowStripeSecret] = useState(false)
  const [showTwilioAuth, setShowTwilioAuth] = useState(false)
  const [showResendKey, setShowResendKey] = useState(false)

  const form = useForm<IntegrationsFormData>({
    resolver: zodResolver(integrationsSchema),
    defaultValues: {
      stripeSecretKey: integrations.stripeSecretKey || "",
      stripePublishableKey: integrations.stripePublishableKey || "",
      twilioAccountSid: integrations.twilioAccountSid || "",
      twilioAuthToken: integrations.twilioAuthToken || "",
      twilioPhoneNumber: integrations.twilioPhoneNumber || "",
      resendApiKey: integrations.resendApiKey || "",
      googleReviewUrl: integrations.googleReviewUrl || "",
      yelpUrl: integrations.yelpUrl || "",
      facebookUrl: integrations.facebookUrl || "",
      instagramUrl: integrations.instagramUrl || "",
    },
  })

  const onSubmit = (data: IntegrationsFormData) => {
    startTransition(async () => {
      try {
        await updateIntegrations(data)
        toast({ title: "Integrations saved" })
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save integrations"
        toast({ title: message, variant: "destructive" })
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Stripe */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Stripe Payments
          </CardTitle>
          <CardDescription>
            Accept online payments from your customers.{" "}
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Get your API keys <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="stripePublishableKey">Publishable Key</Label>
            <Input
              id="stripePublishableKey"
              {...form.register("stripePublishableKey")}
              placeholder="pk_live_..."
            />
          </div>
          <div>
            <Label htmlFor="stripeSecretKey">Secret Key</Label>
            <div className="relative">
              <Input
                id="stripeSecretKey"
                type={showStripeSecret ? "text" : "password"}
                {...form.register("stripeSecretKey")}
                placeholder="sk_live_..."
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowStripeSecret(!showStripeSecret)}
              >
                {showStripeSecret ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Keep this secret! Never share your secret key publicly.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Twilio */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Twilio SMS
          </CardTitle>
          <CardDescription>
            Send SMS appointment reminders and notifications.{" "}
            <a
              href="https://console.twilio.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Get your credentials <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="twilioAccountSid">Account SID</Label>
            <Input
              id="twilioAccountSid"
              {...form.register("twilioAccountSid")}
              placeholder="AC..."
            />
          </div>
          <div>
            <Label htmlFor="twilioAuthToken">Auth Token</Label>
            <div className="relative">
              <Input
                id="twilioAuthToken"
                type={showTwilioAuth ? "text" : "password"}
                {...form.register("twilioAuthToken")}
                placeholder="Your auth token"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowTwilioAuth(!showTwilioAuth)}
              >
                {showTwilioAuth ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <div>
            <Label htmlFor="twilioPhoneNumber">Twilio Phone Number</Label>
            <Input
              id="twilioPhoneNumber"
              {...form.register("twilioPhoneNumber")}
              placeholder="+1234567890"
            />
            <p className="text-xs text-muted-foreground mt-1">
              The phone number purchased from Twilio to send SMS from
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Resend Email */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Resend Email
          </CardTitle>
          <CardDescription>
            Use your own Resend API key for sending emails. If not provided, emails will be sent from the platform.{" "}
            <a
              href="https://resend.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline inline-flex items-center gap-1"
            >
              Get your API key <ExternalLink className="h-3 w-3" />
            </a>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <Label htmlFor="resendApiKey">API Key (Optional)</Label>
            <div className="relative">
              <Input
                id="resendApiKey"
                type={showResendKey ? "text" : "password"}
                {...form.register("resendApiKey")}
                placeholder="re_..."
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setShowResendKey(!showResendKey)}
              >
                {showResendKey ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Leave blank to use platform email sending. Add your own key to send emails from your domain.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Review Links */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Review & Social Links
          </CardTitle>
          <CardDescription>
            Add links to encourage reviews and connect with customers on social media.
            These will appear on your landing page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="googleReviewUrl">Google Review Link</Label>
            <Input
              id="googleReviewUrl"
              {...form.register("googleReviewUrl")}
              placeholder="https://g.page/r/..."
            />
            <p className="text-xs text-muted-foreground mt-1">
              <a
                href="https://support.google.com/business/answer/7035772"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-1"
              >
                How to get your Google review link <ExternalLink className="h-3 w-3" />
              </a>
            </p>
          </div>
          <div>
            <Label htmlFor="yelpUrl">Yelp Business Page</Label>
            <Input
              id="yelpUrl"
              {...form.register("yelpUrl")}
              placeholder="https://yelp.com/biz/..."
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="facebookUrl">Facebook Page</Label>
              <Input
                id="facebookUrl"
                {...form.register("facebookUrl")}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div>
              <Label htmlFor="instagramUrl">Instagram Profile</Label>
              <Input
                id="instagramUrl"
                {...form.register("instagramUrl")}
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save Integrations
        </Button>
      </div>
    </form>
  )
}
