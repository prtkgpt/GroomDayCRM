import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  PawPrint,
  Calendar,
  Edit,
  Plus,
  ExternalLink,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { getClient } from "@/lib/actions/clients"
import {
  getInitials,
  formatCurrency,
  formatTime,
  formatPhone,
  getStatusColor,
  getStatusLabel,
  generateGoogleMapsUrl,
} from "@/lib/utils"
import { EditClientModal } from "./edit-client-modal"
import { AddPetModal } from "./add-pet-modal"

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const client = await getClient(id)

  if (!client) {
    notFound()
  }

  const fullAddress = [client.address, client.city, client.state, client.zipCode]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <Avatar className="h-14 w-14">
              <AvatarFallback className="bg-primary/10 text-primary text-xl font-medium">
                {getInitials(client.firstName, client.lastName)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-2xl font-bold">
                {client.firstName} {client.lastName}
              </h1>
              <p className="text-muted-foreground">
                {client.pets.length} pet{client.pets.length !== 1 && "s"} •{" "}
                {client.appointments.length} appointment
                {client.appointments.length !== 1 && "s"}
              </p>
            </div>
          </div>
        </div>
        <EditClientModal client={client} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pets */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <PawPrint className="h-5 w-5" />
                Pets
              </CardTitle>
              <AddPetModal clientId={client.id} />
            </CardHeader>
            <CardContent>
              {client.pets.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">
                  No pets added yet
                </p>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {client.pets.map((pet) => (
                    <Link
                      key={pet.id}
                      href={`/app/pets/${pet.id}`}
                      className="block p-4 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <PawPrint className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium">{pet.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {[pet.breed, pet.weight && `${pet.weight} lbs`]
                              .filter(Boolean)
                              .join(" • ") || pet.species}
                          </p>
                          {pet.appointmentPets.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              Last groomed:{" "}
                              {format(
                                new Date(pet.appointmentPets[0].appointment.dateTime),
                                "MMM d, yyyy"
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
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
              {client.appointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">
                  No appointments yet
                </p>
              ) : (
                <div className="space-y-3">
                  {client.appointments.map((appt) => (
                    <Link
                      key={appt.id}
                      href={`/app/appointments/${appt.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            {format(new Date(appt.dateTime), "EEEE, MMMM d, yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(appt.dateTime)} •{" "}
                            {appt.appointmentPets.map((ap) => ap.pet.name).join(", ")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appt.appointmentServices
                              .map((as) => as.service.name)
                              .join(", ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(appt.status)}>
                            {getStatusLabel(appt.status)}
                          </Badge>
                          <p className="text-sm font-medium mt-1">
                            {formatCurrency(appt.totalAmount)}
                          </p>
                          {appt.payment ? (
                            <Badge variant="success" className="text-xs mt-1">
                              Paid
                            </Badge>
                          ) : appt.status === "COMPLETED" ? (
                            <Badge variant="warning" className="text-xs mt-1">
                              Unpaid
                            </Badge>
                          ) : null}
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {client.phone && (
                <a
                  href={`tel:${client.phone}`}
                  className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                >
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  {formatPhone(client.phone)}
                </a>
              )}
              {client.email && (
                <a
                  href={`mailto:${client.email}`}
                  className="flex items-center gap-3 text-sm hover:text-primary transition-colors"
                >
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  {client.email}
                </a>
              )}
              {fullAddress && (
                <a
                  href={generateGoogleMapsUrl(fullAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 text-sm hover:text-primary transition-colors"
                >
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                  <span className="flex-1">{fullAddress}</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {!client.phone && !client.email && !fullAddress && (
                <p className="text-sm text-muted-foreground">
                  No contact info added
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {client.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {client.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle>Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.phone && (
                <a href={`sms:${client.phone}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Phone className="h-4 w-4 mr-2" />
                    Send Text
                  </Button>
                </a>
              )}
              {client.email && (
                <a href={`mailto:${client.email}`} className="block">
                  <Button variant="outline" className="w-full justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                </a>
              )}
              {fullAddress && (
                <a
                  href={generateGoogleMapsUrl(fullAddress)}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" className="w-full justify-start">
                    <MapPin className="h-4 w-4 mr-2" />
                    Get Directions
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
