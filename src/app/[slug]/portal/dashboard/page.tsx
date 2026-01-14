import { redirect } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  Calendar,
  PawPrint,
  Clock,
  History,
  LogOut,
  ChevronRight,
  User,
  Sparkles,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getOrganizationBySlug } from "@/lib/actions/public-booking"
import { getPortalSession, getClientUpcomingAppointments, logoutPortal } from "@/lib/actions/client-portal"
import { formatCurrency, formatTime, getStatusColor, getStatusLabel } from "@/lib/utils"
import { PortalNav } from "../portal-nav"

interface DashboardPageProps {
  params: Promise<{ slug: string }>
}

export default async function DashboardPage({ params }: DashboardPageProps) {
  const { slug } = await params
  const org = await getOrganizationBySlug(slug)

  if (!org) {
    return null
  }

  const client = await getPortalSession(org.id)
  if (!client) {
    redirect(`/${slug}/portal`)
  }

  const appointments = await getClientUpcomingAppointments(client.id)

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <PortalNav
        orgName={org.name}
        orgSlug={slug}
        clientName={`${client.firstName} ${client.lastName}`}
      />

      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">
          Welcome back, {client.firstName}!
        </h1>
        <p className="text-muted-foreground">
          Manage your appointments and pet information
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Link href={`/${slug}/book`}>
          <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <p className="font-medium text-sm">Book Appointment</p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${slug}/portal/appointments`}>
          <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
                <History className="h-5 w-5 text-blue-600" />
              </div>
              <p className="font-medium text-sm">View History</p>
            </CardContent>
          </Card>
        </Link>

        <Link href={`/${slug}/portal/pets`}>
          <Card className="hover:shadow-lg transition-all cursor-pointer h-full">
            <CardContent className="p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center mb-3">
                <PawPrint className="h-5 w-5 text-amber-600" />
              </div>
              <p className="font-medium text-sm">My Pets</p>
              <p className="text-xs text-muted-foreground mt-1">
                {client.pets.length} pet{client.pets.length !== 1 ? "s" : ""}
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="h-full">
          <CardContent className="p-4 flex flex-col items-center text-center">
            <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-3">
              <User className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="font-medium text-sm">{client.email || client.phone}</p>
            <p className="text-xs text-muted-foreground mt-1">Your account</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Upcoming Appointments
          </CardTitle>
          {appointments.length > 0 && (
            <Link href={`/${slug}/portal/appointments`}>
              <Button variant="ghost" size="sm">
                View all
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          )}
        </CardHeader>
        <CardContent>
          {appointments.length === 0 ? (
            <div className="text-center py-8">
              <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="font-medium mb-1">No upcoming appointments</p>
              <p className="text-sm text-muted-foreground mb-4">
                Book your next grooming session
              </p>
              <Link href={`/${slug}/book`}>
                <Button>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Book Now
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appt) => (
                <div
                  key={appt.id}
                  className="p-4 rounded-xl border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="font-semibold">
                          {format(new Date(appt.dateTime), "EEEE, MMMM d")}
                        </p>
                        <Badge className={getStatusColor(appt.status)}>
                          {getStatusLabel(appt.status)}
                        </Badge>
                      </div>
                      <p className="text-primary font-medium">
                        {formatTime(appt.dateTime)}
                      </p>
                      <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                        <PawPrint className="h-3.5 w-3.5" />
                        {appt.appointmentPets.map((ap) => ap.pet.name).join(", ")}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {appt.appointmentServices.map((s) => s.service.name).join(", ")}
                      </p>
                      {appt.staff && (
                        <p className="text-sm text-muted-foreground mt-1">
                          with {appt.staff.firstName} {appt.staff.lastName}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {formatCurrency(appt.totalAmount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appt.duration} min
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
