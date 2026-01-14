import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  ArrowLeft,
  Repeat,
  User,
  PawPrint,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getRecurringSchedule } from "@/lib/actions/recurring"
import { formatCurrency, formatDuration, getStatusColor, getStatusLabel } from "@/lib/utils"
import { RecurringActions } from "./recurring-actions"

const frequencyLabels: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 weeks",
  MONTHLY: "Monthly",
}

const dayOfWeekLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default async function RecurringScheduleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const schedule = await getRecurringSchedule(id)

  if (!schedule) {
    notFound()
  }

  const totalPrice = schedule.services.reduce(
    (sum, s) => sum + (s.price || s.service.defaultPrice),
    0
  )

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/recurring">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {schedule.name || "Recurring Schedule"}
              </h1>
              <Badge variant={schedule.isActive ? "default" : "secondary"}>
                {schedule.isActive ? "Active" : "Paused"}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {frequencyLabels[schedule.frequency]} on{" "}
              {schedule.dayOfWeek !== null
                ? dayOfWeekLabels[schedule.dayOfWeek]
                : `the ${schedule.dayOfMonth}${getOrdinalSuffix(schedule.dayOfMonth || 1)}`
              } at {schedule.time}
            </p>
          </div>
        </div>
        <RecurringActions schedule={schedule} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client & Pets */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Client & Pets
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Link
                href={`/app/clients/${schedule.client.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {schedule.client.firstName} {schedule.client.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {schedule.client.phone || schedule.client.email}
                    </p>
                  </div>
                </div>
              </Link>

              <div className="grid gap-2 sm:grid-cols-2">
                {schedule.pets.map(({ pet }) => (
                  <Link
                    key={pet.id}
                    href={`/app/pets/${pet.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <PawPrint className="h-5 w-5 text-muted-foreground" />
                    <span className="font-medium">{pet.name}</span>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Services */}
          <Card>
            <CardHeader>
              <CardTitle>Services</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {schedule.services.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p className="font-medium">{s.service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDuration(s.duration || s.service.defaultDuration)}
                      </p>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(s.price || s.service.defaultPrice)}
                    </span>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between py-2 font-bold">
                  <span>Total per Appointment</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Recent Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {schedule.appointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No appointments generated yet
                </p>
              ) : (
                <div className="space-y-2">
                  {schedule.appointments.map((apt) => (
                    <Link
                      key={apt.id}
                      href={`/app/appointments/${apt.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="font-medium">
                          {format(new Date(apt.dateTime), "EEEE, MMMM d, yyyy")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(apt.dateTime), "h:mm a")}
                        </p>
                      </div>
                      <Badge className={getStatusColor(apt.status)}>
                        {getStatusLabel(apt.status)}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Schedule Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="h-5 w-5" />
                Schedule Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{frequencyLabels[schedule.frequency]}</p>
                  <p className="text-sm text-muted-foreground">
                    {schedule.dayOfWeek !== null
                      ? `Every ${dayOfWeekLabels[schedule.dayOfWeek]}`
                      : `On the ${schedule.dayOfMonth}${getOrdinalSuffix(schedule.dayOfMonth || 1)}`
                    }
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{schedule.time}</p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {formatDuration(schedule.duration)}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm text-muted-foreground mb-1">Start Date</p>
                <p className="font-medium">
                  {format(new Date(schedule.startDate), "MMMM d, yyyy")}
                </p>
              </div>

              {schedule.endDate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">End Date</p>
                  <p className="font-medium">
                    {format(new Date(schedule.endDate), "MMMM d, yyyy")}
                  </p>
                </div>
              )}

              {schedule.lastGeneratedDate && (
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Last Generated</p>
                  <p className="font-medium">
                    {format(new Date(schedule.lastGeneratedDate), "MMMM d, yyyy")}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">
                {getStatusLabel(schedule.locationType)}
              </p>
              {schedule.locationAddress ? (
                <p className="text-sm text-muted-foreground">
                  {schedule.locationAddress}
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No address specified
                </p>
              )}
              {schedule.locationNotes && (
                <p className="text-sm text-muted-foreground mt-2">
                  {schedule.locationNotes}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {schedule.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{schedule.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}
