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
  TrendingUp,
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
    <div className="p-4 lg:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d, yyyy")}
        </p>
      </div>

      {/* Stats Grid - Airbnb-style cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-semibold">{stats.todayAppointments}</p>
              <p className="text-sm text-muted-foreground">Today's appointments</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                <Clock className="h-5 w-5 text-blue-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-semibold">{stats.weekAppointments}</p>
              <p className="text-sm text-muted-foreground">This week</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
                <Users className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-semibold">{stats.totalClients}</p>
              <p className="text-sm text-muted-foreground">{stats.totalPets} pets</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <div className="space-y-1">
              <p className="text-3xl font-semibold">
                {formatCurrency(stats.monthlyRevenue)}
              </p>
              <p className="text-sm text-muted-foreground">This month</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Bookings Alert */}
      {pendingAppointments.length > 0 && (
        <PendingBookingsCard appointments={pendingAppointments} />
      )}

      {/* Unpaid Alert */}
      {stats.unpaidCount > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex items-center justify-between p-5">
            <div className="flex items-center gap-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="font-medium text-amber-900">
                  {stats.unpaidCount} unpaid appointment{stats.unpaidCount !== 1 && "s"}
                </p>
                <p className="text-sm text-amber-700">
                  {formatCurrency(
                    unpaidAppointments.reduce((sum, a) => sum + a.totalAmount, 0)
                  )}{" "}
                  outstanding
                </p>
              </div>
            </div>
            <Link href="/app/calendar?filter=unpaid">
              <Button variant="outline" size="sm" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                View
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">Today's Schedule</CardTitle>
            <Link href="/app/calendar">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {todayAppointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Calendar className="h-6 w-6 opacity-50" />
                </div>
                <p className="font-medium">No appointments today</p>
                <p className="text-sm mt-1">Enjoy your free time!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayAppointments.map((appt) => (
                  <Link
                    key={appt.id}
                    href={`/app/appointments/${appt.id}`}
                    className="block p-4 rounded-xl border hover:bg-accent/50 transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-primary">
                            {formatTime(appt.dateTime)}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <span className="font-medium truncate">
                            {appt.client.firstName} {appt.client.lastName}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                          <PawPrint className="h-3.5 w-3.5" />
                          {appt.appointmentPets.map((ap) => ap.pet.name).join(", ")}
                        </p>
                        <p className="text-sm text-muted-foreground mt-0.5">
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
          <CardHeader className="flex flex-row items-center justify-between pb-4">
            <CardTitle className="text-lg">Upcoming</CardTitle>
            <Link href="/app/calendar">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                View all
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 opacity-50" />
                </div>
                <p className="font-medium">No upcoming appointments</p>
                <p className="text-sm mt-1">Time to book some clients!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.map((appt) => (
                  <Link
                    key={appt.id}
                    href={`/app/appointments/${appt.id}`}
                    className="block p-4 rounded-xl border hover:bg-accent/50 transition-all duration-200 hover:shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-muted-foreground mb-1">
                          {format(new Date(appt.dateTime), "EEE, MMM d")} at{" "}
                          {formatTime(appt.dateTime)}
                        </p>
                        <p className="font-medium truncate">
                          {appt.client.firstName} {appt.client.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                          <PawPrint className="h-3.5 w-3.5" />
                          {appt.appointmentPets.map((ap) => ap.pet.name).join(", ")}
                        </p>
                      </div>
                      <span className="font-semibold text-primary">
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
