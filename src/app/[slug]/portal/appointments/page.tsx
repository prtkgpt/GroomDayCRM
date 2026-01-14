import { redirect } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  Calendar,
  PawPrint,
  Clock,
  History,
  ChevronRight,
  Sparkles,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getOrganizationBySlug } from "@/lib/actions/public-booking"
import {
  getPortalSession,
  getClientUpcomingAppointments,
  getClientPastAppointments,
} from "@/lib/actions/client-portal"
import { formatCurrency, formatTime, getStatusColor, getStatusLabel } from "@/lib/utils"
import { PortalNav } from "../portal-nav"
import { CancelAppointmentButton } from "./cancel-button"

interface AppointmentsPageProps {
  params: Promise<{ slug: string }>
}

export default async function AppointmentsPage({ params }: AppointmentsPageProps) {
  const { slug } = await params
  const org = await getOrganizationBySlug(slug)

  if (!org) {
    return null
  }

  const client = await getPortalSession(org.id)
  if (!client) {
    redirect(`/${slug}/portal`)
  }

  const [upcomingAppointments, pastAppointmentsData] = await Promise.all([
    getClientUpcomingAppointments(client.id),
    getClientPastAppointments(client.id),
  ])

  const pastAppointments = pastAppointmentsData.appointments

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <PortalNav
        orgName={org.name}
        orgSlug={slug}
        clientName={`${client.firstName} ${client.lastName}`}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Appointments</h1>
          <p className="text-muted-foreground">
            View and manage your appointments
          </p>
        </div>
        <Link href={`/${slug}/book`}>
          <Button>
            <Sparkles className="h-4 w-4 mr-2" />
            Book New
          </Button>
        </Link>
      </div>

      <Tabs defaultValue="upcoming" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upcoming" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Upcoming ({upcomingAppointments.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History ({pastAppointments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          {upcomingAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
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
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {upcomingAppointments.map((appt) => (
                <Card key={appt.id}>
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-semibold text-lg">
                            {format(new Date(appt.dateTime), "EEEE, MMMM d, yyyy")}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 mb-3">
                          <Badge className={getStatusColor(appt.status)}>
                            {getStatusLabel(appt.status)}
                          </Badge>
                          <span className="text-primary font-medium">
                            {formatTime(appt.dateTime)}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            ({appt.duration} min)
                          </span>
                        </div>

                        <div className="space-y-2 text-sm">
                          <p className="flex items-center gap-2 text-muted-foreground">
                            <PawPrint className="h-4 w-4" />
                            {appt.appointmentPets.map((ap) => ap.pet.name).join(", ")}
                          </p>
                          <p className="text-muted-foreground">
                            {appt.appointmentServices.map((s) => s.service.name).join(", ")}
                          </p>
                          {appt.staff && (
                            <p className="text-muted-foreground">
                              with {appt.staff.firstName} {appt.staff.lastName}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-semibold text-xl">
                          {formatCurrency(appt.totalAmount)}
                        </p>
                        {appt.status === "SCHEDULED" && (
                          <CancelAppointmentButton
                            clientId={client.id}
                            appointmentId={appt.id}
                            slug={slug}
                          />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="history">
          {pastAppointments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
                  <History className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="font-medium mb-1">No appointment history</p>
                <p className="text-sm text-muted-foreground">
                  Your past appointments will appear here
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {pastAppointments.map((appt) => (
                <Card key={appt.id} className="opacity-90">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <p className="font-medium">
                            {format(new Date(appt.dateTime), "EEEE, MMMM d, yyyy")}
                          </p>
                          <Badge
                            variant="outline"
                            className={
                              appt.status === "COMPLETED"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : appt.status === "CANCELED"
                                ? "border-red-200 bg-red-50 text-red-700"
                                : "border-gray-200 bg-gray-50 text-gray-700"
                            }
                          >
                            {appt.status === "COMPLETED" && (
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                            )}
                            {appt.status === "CANCELED" && (
                              <XCircle className="h-3 w-3 mr-1" />
                            )}
                            {appt.status === "NO_SHOW" && (
                              <AlertCircle className="h-3 w-3 mr-1" />
                            )}
                            {getStatusLabel(appt.status)}
                          </Badge>
                        </div>

                        <div className="space-y-1 text-sm text-muted-foreground">
                          <p className="flex items-center gap-2">
                            <PawPrint className="h-3.5 w-3.5" />
                            {appt.appointmentPets.map((ap) => ap.pet.name).join(", ")}
                          </p>
                          <p>
                            {appt.appointmentServices.map((s) => s.service.name).join(", ")}
                          </p>
                          {appt.staff && (
                            <p>with {appt.staff.firstName} {appt.staff.lastName}</p>
                          )}
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="font-medium">
                          {formatCurrency(appt.totalAmount)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatTime(appt.dateTime)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
