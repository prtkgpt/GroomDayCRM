import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  PawPrint,
  Calendar,
  Clock,
  MapPin,
  ChevronRight,
  LogOut,
  Dog,
  Phone,
  Mail,
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
      phone: true,
      email: true,
    },
  })
}

async function getClientAppointments(clientId: string) {
  const now = new Date()

  const [upcoming, past] = await Promise.all([
    // Upcoming appointments
    db.appointment.findMany({
      where: {
        clientId,
        dateTime: { gte: now },
        status: { notIn: ["CANCELED"] },
      },
      include: {
        appointmentPets: { include: { pet: true } },
        appointmentServices: { include: { service: true } },
      },
      orderBy: { dateTime: "asc" },
      take: 5,
    }),
    // Past appointments
    db.appointment.findMany({
      where: {
        clientId,
        OR: [
          { dateTime: { lt: now } },
          { status: "COMPLETED" },
        ],
      },
      include: {
        appointmentPets: { include: { pet: true } },
        appointmentServices: { include: { service: true } },
      },
      orderBy: { dateTime: "desc" },
      take: 5,
    }),
  ])

  return { upcoming, past }
}

export default async function PortalDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  let organization
  try {
    organization = await getOrganization(slug)
  } catch (error) {
    console.error("Error fetching organization:", error)
    notFound()
  }

  if (!organization) {
    notFound()
  }

  let session
  try {
    session = await getPortalSession()
  } catch (error) {
    console.error("Error getting portal session:", error)
    redirect(`/${slug}/portal`)
  }

  if (!session || session.organization.slug !== slug) {
    redirect(`/${slug}/portal`)
  }

  const theme = getTheme(organization.theme)
  const { client } = session

  let appointments = { upcoming: [], past: [] } as Awaited<ReturnType<typeof getClientAppointments>>
  try {
    appointments = await getClientAppointments(client.id)
  } catch (error) {
    console.error("Error fetching appointments:", error)
  }
  const { upcoming, past } = appointments

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
        {/* Welcome */}
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {client.firstName}!
          </h1>
          <p className="text-muted-foreground">
            Manage your appointments and pets
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Link href={`/${slug}/book`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={cn("p-3 rounded-full", theme.colors.accent)}>
                  <Calendar className={cn("h-6 w-6", theme.colors.badgeText)} />
                </div>
                <div>
                  <p className="font-semibold">Book Appointment</p>
                  <p className="text-sm text-muted-foreground">Schedule a new visit</p>
                </div>
              </CardContent>
            </Card>
          </Link>

          <Link href={`/${slug}/portal/pets`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-6 flex items-center gap-4">
                <div className={cn("p-3 rounded-full", theme.colors.accent)}>
                  <Dog className={cn("h-6 w-6", theme.colors.badgeText)} />
                </div>
                <div>
                  <p className="font-semibold">My Pets</p>
                  <p className="text-sm text-muted-foreground">
                    {client.pets.length} pet{client.pets.length !== 1 ? "s" : ""} registered
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>

          {organization.phone && (
            <a href={`tel:${organization.phone}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardContent className="p-6 flex items-center gap-4">
                  <div className={cn("p-3 rounded-full", theme.colors.accent)}>
                    <Phone className={cn("h-6 w-6", theme.colors.badgeText)} />
                  </div>
                  <div>
                    <p className="font-semibold">Contact Us</p>
                    <p className="text-sm text-muted-foreground">{organization.phone}</p>
                  </div>
                </CardContent>
              </Card>
            </a>
          )}
        </div>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
            <Link href={`/${slug}/portal/bookings`}>
              <Button variant="ghost" size="sm">
                View All <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcoming.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground mb-4">No upcoming appointments</p>
                <Link href={`/${slug}/book`}>
                  <Button className={cn(
                    theme.colors.primary,
                    theme.colors.primaryForeground,
                    theme.colors.buttonHover
                  )}>
                    Book Now
                  </Button>
                </Link>
              </div>
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
        {past.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-5 w-5" />
                Recent Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {past.slice(0, 3).map((apt) => (
                  <AppointmentCard key={apt.id} appointment={apt} theme={theme} isPast />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
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
  appointment: Awaited<ReturnType<typeof getClientAppointments>>["upcoming"][0]
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
