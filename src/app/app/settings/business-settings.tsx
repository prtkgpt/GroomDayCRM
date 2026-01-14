"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, ExternalLink, Copy, Check, Palette, Globe } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { organizationSchema, type OrganizationFormData } from "@/lib/validations"
import { updateOrganization } from "@/lib/actions/organization"
import { themes, themeOptions } from "@/lib/themes"
import { cn } from "@/lib/utils"

interface BusinessSettingsProps {
  organization: {
    id: string
    name: string
    slug: string
    description: string | null
    theme: string
    email: string | null
    phone: string | null
    address: string | null
    city: string | null
    state: string | null
    zipCode: string | null
    timezone: string
    businessHoursStart: string
    businessHoursEnd: string
    appointmentBuffer: number
    bookingEnabled?: boolean
    bookingLeadTime?: number
    bookingMaxDaysAhead?: number
    bookingRequiresApproval?: boolean
  }
}

const timezones = [
  { value: "America/New_York", label: "Eastern Time" },
  { value: "America/Chicago", label: "Central Time" },
  { value: "America/Denver", label: "Mountain Time" },
  { value: "America/Los_Angeles", label: "Pacific Time" },
  { value: "America/Anchorage", label: "Alaska Time" },
  { value: "Pacific/Honolulu", label: "Hawaii Time" },
]

const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0")
  return { value: `${hour}:00`, label: `${i === 0 ? 12 : i > 12 ? i - 12 : i}:00 ${i < 12 ? "AM" : "PM"}` }
})

export function BusinessSettings({ organization }: BusinessSettingsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [copied, setCopied] = useState(false)

  const form = useForm({
    resolver: zodResolver(organizationSchema),
    defaultValues: {
      name: organization.name,
      slug: organization.slug,
      description: organization.description || "",
      theme: organization.theme || "blue",
      email: organization.email || "",
      phone: organization.phone || "",
      address: organization.address || "",
      city: organization.city || "",
      state: organization.state || "",
      zipCode: organization.zipCode || "",
      timezone: organization.timezone,
      businessHoursStart: organization.businessHoursStart,
      businessHoursEnd: organization.businessHoursEnd,
      appointmentBuffer: organization.appointmentBuffer,
      bookingEnabled: organization.bookingEnabled ?? true,
      bookingLeadTime: organization.bookingLeadTime ?? 2,
      bookingMaxDaysAhead: organization.bookingMaxDaysAhead ?? 60,
      bookingRequiresApproval: organization.bookingRequiresApproval ?? false,
    },
  })

  const landingUrl = typeof window !== "undefined"
    ? `${window.location.origin}/${form.watch("slug")}`
    : `/${form.watch("slug")}`

  const bookingUrl = `${landingUrl}/book`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(bookingUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const onSubmit = (data: OrganizationFormData) => {
    startTransition(async () => {
      try {
        await updateOrganization(data)
        toast({ title: "Settings saved" })
        router.refresh()
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to save settings"
        toast({ title: message, variant: "destructive" })
      }
    })
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {/* Online Booking */}
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Online Booking
              </CardTitle>
              <CardDescription>
                Allow customers to book appointments online
              </CardDescription>
            </div>
            <Switch
              checked={form.watch("bookingEnabled")}
              onCheckedChange={(checked) => form.setValue("bookingEnabled", checked)}
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="slug">Your Business URL *</Label>
            <div className="flex gap-2 mt-1">
              <div className="flex-1 flex items-center bg-muted rounded-xl px-3 text-sm">
                <span className="text-muted-foreground">groomdaycrm.com/</span>
                <Input
                  id="slug"
                  {...form.register("slug")}
                  className="border-0 bg-transparent px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder="your-business"
                />
                <span className="text-muted-foreground">/book</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Only lowercase letters, numbers, and hyphens allowed
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 p-3 bg-background rounded-xl border">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Landing Page</p>
                <span className="text-sm truncate block">{landingUrl}</span>
              </div>
              <Button type="button" variant="ghost" size="icon" asChild>
                <a href={landingUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
            <div className="flex items-center gap-2 p-3 bg-background rounded-xl border">
              <div className="flex-1">
                <p className="text-xs text-muted-foreground mb-1">Booking Page</p>
                <span className="text-sm truncate block">{bookingUrl}</span>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button type="button" variant="ghost" size="icon" asChild>
                <a href={bookingUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            </div>
          </div>

          {/* Booking Settings */}
          <div className="pt-4 border-t space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="bookingLeadTime">Minimum Lead Time (hours)</Label>
                <Input
                  id="bookingLeadTime"
                  type="number"
                  min={0}
                  {...form.register("bookingLeadTime")}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How far in advance customers must book
                </p>
              </div>
              <div>
                <Label htmlFor="bookingMaxDaysAhead">Max Days Ahead</Label>
                <Input
                  id="bookingMaxDaysAhead"
                  type="number"
                  min={1}
                  max={365}
                  {...form.register("bookingMaxDaysAhead")}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  How far in advance customers can book
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between p-3 bg-background rounded-xl border">
              <div>
                <p className="font-medium text-sm">Require Approval</p>
                <p className="text-xs text-muted-foreground">
                  Manually approve each online booking
                </p>
              </div>
              <Switch
                checked={form.watch("bookingRequiresApproval")}
                onCheckedChange={(checked) => form.setValue("bookingRequiresApproval", checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Landing Page Theme
          </CardTitle>
          <CardDescription>
            Choose a color theme for your public landing page
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {themeOptions.map((themeOption) => {
              const theme = themes[themeOption.id]
              const isSelected = form.watch("theme") === themeOption.id
              return (
                <button
                  key={themeOption.id}
                  type="button"
                  onClick={() => form.setValue("theme", themeOption.id)}
                  className={cn(
                    "relative p-3 rounded-lg border-2 transition-all text-left",
                    isSelected
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-muted hover:border-muted-foreground/30"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={cn("w-6 h-6 rounded-full", theme.colors.primary)} />
                    <div className={cn("w-4 h-4 rounded-full", theme.colors.accent)} />
                  </div>
                  <p className="font-medium text-sm">{themeOption.name}</p>
                  <p className="text-xs text-muted-foreground">{themeOption.description}</p>
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <Check className="h-4 w-4 text-primary" />
                    </div>
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Preview your landing page to see the theme in action
          </p>
        </CardContent>
      </Card>

      {/* Business Info */}
      <Card>
        <CardHeader>
          <CardTitle>Business Information</CardTitle>
          <CardDescription>
            Your business details shown to clients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="name">Business Name *</Label>
            <Input id="name" {...form.register("name")} />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="Tell customers about your grooming services..."
              rows={3}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Shown on your public landing page
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...form.register("phone")} placeholder="(555) 123-4567" />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" {...form.register("email")} />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Street Address</Label>
            <Input id="address" {...form.register("address")} />
          </div>

          <div className="grid grid-cols-6 gap-2">
            <div className="col-span-3">
              <Label htmlFor="city">City</Label>
              <Input id="city" {...form.register("city")} />
            </div>
            <div className="col-span-1">
              <Label htmlFor="state">State</Label>
              <Input id="state" {...form.register("state")} maxLength={2} />
            </div>
            <div className="col-span-2">
              <Label htmlFor="zipCode">ZIP</Label>
              <Input id="zipCode" {...form.register("zipCode")} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Settings</CardTitle>
          <CardDescription>
            Configure your default business hours and appointment settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={form.watch("timezone")}
              onValueChange={(v) => form.setValue("timezone", v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {timezones.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="businessHoursStart">Business Hours Start</Label>
              <Select
                value={form.watch("businessHoursStart")}
                onValueChange={(v) => form.setValue("businessHoursStart", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="businessHoursEnd">Business Hours End</Label>
              <Select
                value={form.watch("businessHoursEnd")}
                onValueChange={(v) => form.setValue("businessHoursEnd", v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {timeOptions.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="appointmentBuffer">Buffer Between Appointments (minutes)</Label>
            <Input
              id="appointmentBuffer"
              type="number"
              {...form.register("appointmentBuffer")}
            />
            <p className="text-sm text-muted-foreground mt-1">
              Time between appointments for travel or breaks
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
          Save Changes
        </Button>
      </div>
    </form>
  )
}
