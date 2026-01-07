import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  ArrowLeft,
  PawPrint,
  Calendar,
  Edit,
  Scale,
  Scissors,
  AlertTriangle,
  Syringe,
  Heart,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getPet } from "@/lib/actions/pets"
import { formatCurrency, formatTime, getStatusColor, getStatusLabel } from "@/lib/utils"
import { EditPetModal } from "./edit-pet-modal"

export default async function PetDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const pet = await getPet(id)

  if (!pet) {
    notFound()
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/app/clients/${pet.clientId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
              <PawPrint className="h-7 w-7 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{pet.name}</h1>
              <Link
                href={`/app/clients/${pet.clientId}`}
                className="text-muted-foreground hover:text-primary"
              >
                Owner: {pet.client.firstName} {pet.client.lastName}
              </Link>
            </div>
          </div>
        </div>
        <EditPetModal pet={pet} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Details Grid */}
          <Card>
            <CardHeader>
              <CardTitle>Pet Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Species</p>
                  <p className="font-medium">{pet.species}</p>
                </div>
                {pet.breed && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Breed</p>
                    <p className="font-medium">{pet.breed}</p>
                  </div>
                )}
                {pet.weight && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="font-medium">{pet.weight} lbs</p>
                  </div>
                )}
                {pet.sex && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Sex</p>
                    <p className="font-medium">{pet.sex}</p>
                  </div>
                )}
                {pet.birthDate && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Birth Date</p>
                    <p className="font-medium">
                      {format(new Date(pet.birthDate), "MMMM d, yyyy")}
                    </p>
                  </div>
                )}
                {pet.color && (
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground">Color</p>
                    <p className="font-medium">{pet.color}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Grooming History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pet.appointmentPets.length === 0 ? (
                <p className="text-muted-foreground text-center py-6">
                  No grooming history yet
                </p>
              ) : (
                <div className="space-y-3">
                  {pet.appointmentPets.map(({ appointment }) => (
                    <Link
                      key={appointment.id}
                      href={`/app/appointments/${appointment.id}`}
                      className="block p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">
                            {format(new Date(appointment.dateTime), "EEEE, MMMM d, yyyy")}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatTime(appointment.dateTime)} •{" "}
                            {appointment.appointmentServices
                              .map((as) => as.service.name)
                              .join(", ")}
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(appointment.status)}>
                            {getStatusLabel(appointment.status)}
                          </Badge>
                          <p className="text-sm font-medium mt-1">
                            {formatCurrency(appointment.totalAmount)}
                          </p>
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
          {/* Coat Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scissors className="h-5 w-5" />
                Coat Info
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {pet.coatType && (
                <div>
                  <p className="text-sm text-muted-foreground">Type</p>
                  <p className="font-medium">{pet.coatType}</p>
                </div>
              )}
              {pet.coatNotes && (
                <div>
                  <p className="text-sm text-muted-foreground">Notes</p>
                  <p className="text-sm whitespace-pre-wrap">{pet.coatNotes}</p>
                </div>
              )}
              {!pet.coatType && !pet.coatNotes && (
                <p className="text-sm text-muted-foreground">No coat info</p>
              )}
            </CardContent>
          </Card>

          {/* Behavior Notes */}
          {pet.behaviorNotes && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-yellow-800">
                  <AlertTriangle className="h-5 w-5" />
                  Behavior Notes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-yellow-800 whitespace-pre-wrap">
                  {pet.behaviorNotes}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Grooming Preferences */}
          {pet.groomingPrefs && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Heart className="h-5 w-5" />
                  Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{pet.groomingPrefs}</p>
              </CardContent>
            </Card>
          )}

          {/* Medical & Vaccines */}
          {(pet.vaccineNotes || pet.medicalNotes) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Syringe className="h-5 w-5" />
                  Medical Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {pet.vaccineNotes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Vaccines</p>
                    <p className="text-sm whitespace-pre-wrap">{pet.vaccineNotes}</p>
                  </div>
                )}
                {pet.medicalNotes && (
                  <div>
                    <p className="text-sm text-muted-foreground">Medical Notes</p>
                    <p className="text-sm whitespace-pre-wrap">{pet.medicalNotes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
