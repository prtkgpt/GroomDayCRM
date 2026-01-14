import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  PawPrint,
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  LogOut,
} from "lucide-react"
import { db } from "@/lib/db"
import { getPortalSession, portalLogout } from "@/lib/actions/portal-auth"
import { getTheme } from "@/lib/themes"
import { cn, getStatusColor, getStatusLabel } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

async function getOrganization(slug: string) {
  return db.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      theme: true,
    },
  })
}

async function getAllClientAppointments(clientId: string) {
  return db.appointment.findMany({
    where: { clientId },
    include: {
      appointmentPets: { include: { pet: true } },
      appointmentServices: { include: { service: true } },
    },
    orderBy: { dateTime: "desc" },
  })
}

export default async function PortalBookingsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const organization = await getOrganization(slug)
  if (!organization) {
    notFound()
  }

  const session = await getPortalSession()
  if (!session || session.organization.slug !== slug) {
    redirect(`/${slug}/portal`)
  }

  const theme = getTheme(organization.theme)
  const { client } = session
  const appointments = await getAllClientAppointments(client.id)

  // Group appointments by upcoming and past
  const now = new Date()
  const upcoming = appointments.filter(
    (apt) => apt.dateTime >= now && apt.status !== "CANCELED"
  )
  const past = appointments.filter(
    (apt) => apt.dateTime < now || apt.status === "CANCELED" || apt.status === "COMPLETED"
  )

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className={cn("py-4", theme.colors.primary)}>
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <PawPrint className="h-6 w-6" />
            <span className="font-semibold">{organization.name}</span>
          </div>
          <form action={async () => {
            "use server"
            await portalLogout()
            redirect(`/${slug}/portal`)
          }}>
            <Button
              type="submit"
              variant="ghost"
              size="sm"
              className="text-white/80 hover:text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </Button>
          </form>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Back Button */}
        <div className="flex items-center justify-between">
          <Link href={`/${slug}/portal/dashboard`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Dashboard
            </Button>
          </Link>
          <Link href={`/${slug}/book`}>
            <Button className={cn(
              theme.colors.primary,
              theme.colors.primaryForeground,
              theme.colors.buttonHover
            )}>
              <Calendar className="h-4 w-4 mr-2" />
              Book New
            </Button>
          </Link>
        </div>

        <div>
          <h1 className="text-2xl font-bold">My Appointments</h1>
          <p className="text-muted-foreground">
            View all your appointments
          </p>
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming ({upcoming.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No upcoming appointments
              </p>
            ) : (
              <div className="space-y-4">
                {upcoming.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} theme={theme} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Past Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5" />
              Past Appointments ({past.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {past.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">
                No past appointments
              </p>
            ) : (
              <div className="space-y-4">
                {past.map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} theme={theme} isPast />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-sm text-muted-foreground">
        Powered by{" "}
        <a href="/" className="hover:underline">
          GroomDayCRM
        </a>
      </footer>
    </div>
  )
}

function AppointmentCard({
  appointment,
  theme,
  isPast = false,
}: {
  appointment: Awaited<ReturnType<typeof getAllClientAppointments>>[0]
  theme: ReturnType<typeof getTheme>
  isPast?: boolean
}) {
  const pets = appointment.appointmentPets.map((ap) => ap.pet.name).join(", ")
  const services = appointment.appointmentServices.map((as) => as.service.name).join(", ")

  return (
    <div className={cn(
      "p-4 rounded-lg border",
      isPast ? "bg-muted/50" : "bg-background"
    )}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <p className={cn("font-semibold", isPast && "text-muted-foreground")}>
              {format(appointment.dateTime, "EEEE, MMMM d, yyyy")}
            </p>
            <Badge variant="secondary" className={getStatusColor(appointment.status)}>
              {getStatusLabel(appointment.status)}
            </Badge>
          </div>
          <div className="grid gap-1 text-sm text-muted-foreground">
            <p className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              {format(appointment.dateTime, "h:mm a")} ({appointment.duration} min)
            </p>
            <p className="flex items-center gap-2">
              <PawPrint className="h-4 w-4" />
              {pets}
            </p>
            <p className="text-xs">{services}</p>
            {appointment.totalAmount > 0 && (
              <p className="font-medium text-foreground mt-1">
                ${appointment.totalAmount.toFixed(2)}
              </p>
            )}
          </div>
        </div>
        {!isPast && appointment.locationAddress && (
          <a
            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(appointment.locationAddress)}`}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(
              "p-2 rounded-lg shrink-0",
              theme.colors.accent,
              "hover:opacity-80 transition-opacity"
            )}
          >
            <MapPin className={cn("h-5 w-5", theme.colors.badgeText)} />
          </a>
        )}
      </div>
    </div>
  )
}
