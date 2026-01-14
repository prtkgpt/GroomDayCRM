import Link from "next/link"
import { format } from "date-fns"
import {
  Calendar,
  Users,
  DollarSign,
  Clock,
  PawPrint,
  ArrowRight,
  AlertCircle,
  Bell,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getDashboardStats } from "@/lib/actions/organization"
import { getTodayAppointments, getUpcomingAppointments, getUnpaidAppointments, getPendingAppointments } from "@/lib/actions/appointments"
import { formatCurrency, formatTime, getStatusColor, getStatusLabel } from "@/lib/utils"
import { PendingBookingsCard } from "./pending-bookings-card"

export default async function DashboardPage() {
  const [stats, todayAppointments, upcomingAppointments, unpaidAppointments, pendingAppointments] =
    await Promise.all([
      getDashboardStats(),
      getTodayAppointments(),
      getUpcomingAppointments(5),
      getUnpaidAppointments(),
      getPendingAppointments(),
    ])

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Today
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Week
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.weekAppointments}</div>
            <p className="text-xs text-muted-foreground">appointments</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Clients
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClients}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalPets} pets
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              This Month
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(stats.monthlyRevenue)}
            </div>
            <p className="text-xs text-muted-foreground">revenue</p>
          </CardContent>
        </Card>
      </div>

      {/* Pending Bookings Alert */}
      {pendingAppointments.length > 0 && (
        <PendingBookingsCard appointments={pendingAppointments} />
      )}

      {/* Unpaid Alert */}
      {stats.unpaidCount > 0 && (
        <Card className="border-yellow-500 bg-yellow-50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-yellow-800">
                  {stats.unpaidCount} unpaid appointment{stats.unpaidCount !== 1 && "s"}
                </p>
                <p className="text-sm text-yellow-700">
                  {formatCurrency(
                    unpaidAppointments.reduce((sum, a) => sum + a.totalAmount, 0)
                  )}{" "}
                  outstanding
                </p>
              </div>
            </div>
            <Link href="/app/calendar?filter=unpaid">
              <Button variant="outline" size="sm">
                View
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Today's Schedule</CardTitle>
            <Link href="/app/calendar">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No appointments today</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appt) => (
                  <Link
                    key={appt.id}
                    href={`/app/appointments/${appt.id}`}
                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium">
                          {formatTime(appt.dateTime)} - {appt.client.firstName}{" "}
                          {appt.client.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <PawPrint className="h-3 w-3" />
                          {appt.appointmentPets.map((ap) => ap.pet.name).join(", ")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {appt.appointmentServices.map((as) => as.service.name).join(", ")}
                        </p>
                      </div>
                      <Badge className={getStatusColor(appt.status)}>
                        {getStatusLabel(appt.status)}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming</CardTitle>
            <Link href="/app/calendar">
              <Button variant="ghost" size="sm">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
                <p>No upcoming appointments</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appt) => (
                  <Link
                    key={appt.id}
                    href={`/app/appointments/${appt.id}`}
                    className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(appt.dateTime), "EEE, MMM d")} at{" "}
                          {formatTime(appt.dateTime)}
                        </p>
                        <p className="font-medium">
                          {appt.client.firstName} {appt.client.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <PawPrint className="h-3 w-3" />
                          {appt.appointmentPets.map((ap) => ap.pet.name).join(", ")}
                        </p>
                      </div>
                      <span className="font-medium">
                        {formatCurrency(appt.totalAmount)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
