import Link from "next/link"
import { format } from "date-fns"
import {
  Clock,
  Users,
  AlertTriangle,
  CheckCircle,
  Bell,
  Plus,
  Calendar,
  PawPrint,
  Scissors,
  User,
  MoreVertical,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getWaitlistEntries, getWaitlistStats } from "@/lib/actions/waitlist"
import { WaitlistActions } from "./waitlist-actions"

function getUrgencyBadge(urgency: string) {
  switch (urgency) {
    case "URGENT":
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100">Urgent</Badge>
    case "HIGH":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">High</Badge>
    case "NORMAL":
      return <Badge variant="outline">Normal</Badge>
    case "LOW":
      return <Badge variant="outline" className="text-muted-foreground">Low</Badge>
    default:
      return null
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "ACTIVE":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Waiting</Badge>
    case "NOTIFIED":
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100">Notified</Badge>
    case "BOOKED":
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">Booked</Badge>
    case "EXPIRED":
      return <Badge variant="outline" className="text-muted-foreground">Expired</Badge>
    case "CANCELLED":
      return <Badge variant="outline" className="text-muted-foreground">Cancelled</Badge>
    default:
      return null
  }
}

function formatPreferences(entry: {
  preferredDate: Date | null
  preferredDayOfWeek: number[]
  preferredTimeStart: string | null
  preferredTimeEnd: string | null
  isFlexibleDate: boolean
  isFlexibleTime: boolean
}) {
  const parts: string[] = []

  if (entry.isFlexibleDate) {
    parts.push("Any date")
  } else if (entry.preferredDate) {
    parts.push(format(new Date(entry.preferredDate), "MMM d, yyyy"))
  } else if (entry.preferredDayOfWeek.length > 0) {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    const dayNames = entry.preferredDayOfWeek.map((d) => days[d])
    parts.push(dayNames.join(", "))
  }

  if (entry.isFlexibleTime) {
    parts.push("any time")
  } else if (entry.preferredTimeStart && entry.preferredTimeEnd) {
    parts.push(`${entry.preferredTimeStart}-${entry.preferredTimeEnd}`)
  }

  return parts.join(" • ") || "No preferences set"
}

export default async function WaitlistPage() {
  const [activeEntries, notifiedEntries, stats] = await Promise.all([
    getWaitlistEntries({ status: "ACTIVE" }),
    getWaitlistEntries({ status: "NOTIFIED" }),
    getWaitlistStats(),
  ])

  const allActive = [...activeEntries, ...notifiedEntries]

  return (
    <div className="p-4 lg:p-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-tight">Waitlist</h1>
          <p className="text-muted-foreground">
            Manage clients waiting for appointment openings
          </p>
        </div>
        <Link href="/app/waitlist/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add to Waitlist
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center">
                <Clock className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-semibold">{stats.activeCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center">
                <Bell className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Notified</p>
                <p className="text-2xl font-semibold">{stats.notifiedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-red-50 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Urgent</p>
                <p className="text-2xl font-semibold">{stats.urgentCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Booked This Week</p>
                <p className="text-2xl font-semibold">{stats.bookedThisWeek}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Waitlist Entries */}
      <Card>
        <CardHeader>
          <CardTitle>Waitlist Entries</CardTitle>
        </CardHeader>
        <CardContent>
          {allActive.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Users className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">No one on the waitlist</p>
              <p className="text-sm text-muted-foreground mb-4">
                Clients will appear here when they request unavailable time slots
              </p>
              <Link href="/app/waitlist/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {allActive.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between p-4 rounded-xl border hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="h-6 w-6 text-primary" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {entry.client.firstName} {entry.client.lastName}
                        </p>
                        {getStatusBadge(entry.status)}
                        {getUrgencyBadge(entry.urgency)}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <PawPrint className="h-3.5 w-3.5" />
                          {entry.pets.map((p) => p.pet.name).join(", ")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Scissors className="h-3.5 w-3.5" />
                          {entry.services.map((s) => s.service.name).join(", ")}
                        </span>
                        {entry.preferredStaff && (
                          <span className="flex items-center gap-1">
                            <User className="h-3.5 w-3.5" />
                            {entry.preferredStaff.firstName}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-sm">
                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {formatPreferences(entry)}
                        </span>
                      </div>

                      {entry.notes && (
                        <p className="text-sm text-muted-foreground italic">
                          &quot;{entry.notes}&quot;
                        </p>
                      )}

                      {entry.status === "NOTIFIED" && entry.offeredSlotDate && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-purple-50 text-purple-700 text-sm">
                          <Bell className="h-4 w-4" />
                          Offered: {format(new Date(entry.offeredSlotDate), "MMM d 'at' h:mm a")}
                          {entry.respondByDate && (
                            <span className="text-purple-500">
                              (expires {format(new Date(entry.respondByDate), "MMM d")})
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Added {format(new Date(entry.createdAt), "MMM d, yyyy")}
                      </p>
                    </div>
                  </div>

                  <WaitlistActions entry={entry} />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
