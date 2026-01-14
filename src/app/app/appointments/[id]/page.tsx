import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  ArrowLeft,
  User,
  PawPrint,
  Calendar,
  Clock,
  MapPin,
  DollarSign,
  MessageSquare,
  ExternalLink,
  Copy,
  Mail,
  Phone,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getAppointment } from "@/lib/actions/appointments"
import {
  formatCurrency,
  formatTime,
  formatDuration,
  getStatusColor,
  getStatusLabel,
  generateGoogleMapsUrl,
} from "@/lib/utils"
import { AppointmentActions } from "./appointment-actions"
import { PaymentSection } from "./payment-section"
import { MessageSection } from "./message-section"
import { FeedbackSection } from "./feedback-section"

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const appointment = await getAppointment(id)

  if (!appointment) {
    notFound()
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/calendar">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Appointment</h1>
              <Badge className={getStatusColor(appointment.status)}>
                {getStatusLabel(appointment.status)}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              {format(new Date(appointment.dateTime), "EEEE, MMMM d, yyyy")} at{" "}
              {formatTime(appointment.dateTime)}
            </p>
          </div>
        </div>
        <AppointmentActions appointment={appointment} />
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
                href={`/app/clients/${appointment.client.id}`}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {appointment.client.firstName} {appointment.client.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {appointment.client.phone || appointment.client.email}
                    </p>
                  </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
              </Link>

              <div className="grid gap-2 sm:grid-cols-2">
                {appointment.appointmentPets.map(({ pet }) => (
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
                {appointment.appointmentServices.map((as) => (
                  <div
                    key={as.id}
                    className="flex items-center justify-between py-2"
                  >
                    <div>
                      <p className="font-medium">{as.service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDuration(as.duration)}
                      </p>
                    </div>
                    <span className="font-medium">{formatCurrency(as.price)}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <span className="font-medium">Subtotal</span>
                  <span className="font-medium">
                    {formatCurrency(appointment.subtotal)}
                  </span>
                </div>
                {appointment.tipAmount > 0 && (
                  <div className="flex items-center justify-between py-2 text-green-600">
                    <span>Tip</span>
                    <span>{formatCurrency(appointment.tipAmount)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between py-2 text-lg font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(appointment.totalAmount)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment */}
          <PaymentSection appointment={appointment} />

          {/* Messages */}
          <MessageSection appointment={appointment} />

          {/* Feedback (only shown for completed appointments) */}
          <FeedbackSection appointment={appointment} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Schedule Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Schedule
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {formatTime(appointment.dateTime)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {formatDuration(appointment.duration)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <p>
                  {format(new Date(appointment.dateTime), "EEEE, MMMM d, yyyy")}
                </p>
              </div>
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
                {getStatusLabel(appointment.locationType)}
              </p>
              {appointment.locationAddress ? (
                <>
                  <p className="text-sm text-muted-foreground mb-3">
                    {appointment.locationAddress}
                  </p>
                  <a
                    href={generateGoogleMapsUrl(appointment.locationAddress)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <MapPin className="h-4 w-4 mr-2" />
                      Get Directions
                    </Button>
                  </a>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No address specified
                </p>
              )}
              {appointment.locationNotes && (
                <p className="text-sm text-muted-foreground mt-3">
                  {appointment.locationNotes}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Notes */}
          {(appointment.notes || appointment.internalNotes) && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {appointment.notes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Client Notes
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {appointment.notes}
                    </p>
                  </div>
                )}
                {appointment.internalNotes && (
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Internal Notes
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {appointment.internalNotes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Contact */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {appointment.client.phone && (
                <>
                  <a href={`tel:${appointment.client.phone}`}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <Phone className="h-4 w-4 mr-2" />
                      Call
                    </Button>
                  </a>
                  <a href={`sms:${appointment.client.phone}`}>
                    <Button variant="outline" size="sm" className="w-full justify-start">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Text
                    </Button>
                  </a>
                </>
              )}
              {appointment.client.email && (
                <a href={`mailto:${appointment.client.email}`}>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Email
                  </Button>
                </a>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
