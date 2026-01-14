import { Suspense } from "react"
import Link from "next/link"
import { format } from "date-fns"
import { Repeat, Plus, Calendar, User, PawPrint, Clock } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getRecurringSchedules } from "@/lib/actions/recurring"
import { NewRecurringModal } from "./new-recurring-modal"
import { GenerateButton } from "./generate-button"

const frequencyLabels: Record<string, string> = {
  WEEKLY: "Weekly",
  BIWEEKLY: "Every 2 weeks",
  MONTHLY: "Monthly",
}

const dayOfWeekLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

async function RecurringList() {
  const schedules = await getRecurringSchedules()

  if (schedules.length === 0) {
    return (
      <div className="text-center py-12">
        <Repeat className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium">No recurring schedules</h3>
        <p className="text-muted-foreground mb-4">
          Set up recurring appointments for clients who book regularly
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {schedules.map((schedule) => (
        <Link key={schedule.id} href={`/app/recurring/${schedule.id}`}>
          <Card className={`hover:shadow-md transition-shadow cursor-pointer h-full ${!schedule.isActive ? 'opacity-60' : ''}`}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Repeat className="h-5 w-5 text-primary" />
                  <Badge variant={schedule.isActive ? "default" : "secondary"}>
                    {schedule.isActive ? frequencyLabels[schedule.frequency] : "Paused"}
                  </Badge>
                </div>
              </div>

              {schedule.name && (
                <h3 className="font-medium mb-2">{schedule.name}</h3>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  <span>{schedule.client.firstName} {schedule.client.lastName}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <PawPrint className="h-4 w-4" />
                  <span>{schedule.pets.map(p => p.pet.name).join(", ")}</span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {schedule.dayOfWeek !== null
                      ? `${dayOfWeekLabels[schedule.dayOfWeek]}s at ${schedule.time}`
                      : schedule.dayOfMonth
                        ? `${schedule.dayOfMonth}${getOrdinalSuffix(schedule.dayOfMonth)} of each month at ${schedule.time}`
                        : `At ${schedule.time}`
                    }
                  </span>
                </div>

                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>{schedule.duration} minutes</span>
                </div>
              </div>

              {schedule.services.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-3">
                  {schedule.services.map((s) => (
                    <Badge key={s.id} variant="outline" className="text-xs">
                      {s.service.name}
                    </Badge>
                  ))}
                </div>
              )}

              {schedule.appointments.length > 0 && (
                <p className="text-xs text-muted-foreground mt-3">
                  Next: {format(new Date(schedule.appointments[0].dateTime), "MMM d, yyyy")}
                </p>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function getOrdinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"]
  const v = n % 100
  return s[(v - 20) % 10] || s[v] || s[0]
}

function RecurringListSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-6 w-24 mb-3" />
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-4 w-40 mb-2" />
            <Skeleton className="h-4 w-28" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function RecurringSchedulesPage() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Recurring Schedules</h1>
          <p className="text-muted-foreground">
            Manage automatic recurring appointments
          </p>
        </div>
        <div className="flex items-center gap-2">
          <GenerateButton />
          <NewRecurringModal />
        </div>
      </div>

      <Suspense fallback={<RecurringListSkeleton />}>
        <RecurringList />
      </Suspense>
    </div>
  )
}
