import { redirect } from "next/navigation"
import { format } from "date-fns"
import {
  PawPrint,
  Dog,
  Cat,
  Calendar,
  Weight,
  Palette,
  Heart,
  Scissors,
  FileText,
  Syringe,
  Plus,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { getOrganizationBySlug } from "@/lib/actions/public-booking"
import { getPortalSession, getClientPetsPortal } from "@/lib/actions/client-portal"
import { PortalNav } from "../portal-nav"

interface PetsPageProps {
  params: Promise<{ slug: string }>
}

function getSpeciesIcon(species: string) {
  const lower = species.toLowerCase()
  if (lower === "dog" || lower === "canine") {
    return Dog
  }
  if (lower === "cat" || lower === "feline") {
    return Cat
  }
  return PawPrint
}

function calculateAge(birthDate: Date | null): string | null {
  if (!birthDate) return null
  const now = new Date()
  const years = now.getFullYear() - birthDate.getFullYear()
  const months = now.getMonth() - birthDate.getMonth()

  if (years === 0) {
    return months <= 1 ? "< 1 month" : `${months} months`
  }
  if (years === 1 && months < 0) {
    return `${12 + months} months`
  }
  return years === 1 ? "1 year" : `${years} years`
}

export default async function PetsPage({ params }: PetsPageProps) {
  const { slug } = await params
  const org = await getOrganizationBySlug(slug)

  if (!org) {
    return null
  }

  const client = await getPortalSession(org.id)
  if (!client) {
    redirect(`/${slug}/portal`)
  }

  const pets = await getClientPetsPortal(client.id)

  return (
    <div className="container max-w-4xl mx-auto px-4 py-8">
      <PortalNav
        orgName={org.name}
        orgSlug={slug}
        clientName={`${client.firstName} ${client.lastName}`}
      />

      <div className="mb-6">
        <h1 className="text-2xl font-semibold">My Pets</h1>
        <p className="text-muted-foreground">
          View your pet profiles and grooming history
        </p>
      </div>

      {pets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="h-12 w-12 rounded-2xl bg-amber-50 flex items-center justify-center mx-auto mb-4">
              <PawPrint className="h-6 w-6 text-amber-600" />
            </div>
            <p className="font-medium mb-1">No pets on file</p>
            <p className="text-sm text-muted-foreground mb-4">
              Add a pet when you book your next appointment
            </p>
            <a href={`/${slug}/book`}>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Book Appointment
              </Button>
            </a>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pets.map((pet) => {
            const SpeciesIcon = getSpeciesIcon(pet.species)
            const age = calculateAge(pet.birthDate)
            const lastVisit = pet.appointmentPets[0]?.appointment

            return (
              <Card key={pet.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                        <SpeciesIcon className="h-7 w-7 text-amber-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl">{pet.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline">{pet.species}</Badge>
                          {pet.breed && (
                            <span className="text-sm text-muted-foreground">
                              {pet.breed}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {lastVisit && (
                      <div className="text-right text-sm">
                        <p className="text-muted-foreground">Last visit</p>
                        <p className="font-medium">
                          {format(new Date(lastVisit.dateTime), "MMM d, yyyy")}
                        </p>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                    {age && (
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Age</p>
                          <p className="text-sm font-medium">{age}</p>
                        </div>
                      </div>
                    )}
                    {pet.weight && (
                      <div className="flex items-center gap-2">
                        <Weight className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Weight</p>
                          <p className="text-sm font-medium">{pet.weight} lbs</p>
                        </div>
                      </div>
                    )}
                    {pet.color && (
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Color</p>
                          <p className="text-sm font-medium">{pet.color}</p>
                        </div>
                      </div>
                    )}
                    {pet.sex && (
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="text-xs text-muted-foreground">Sex</p>
                          <p className="text-sm font-medium capitalize">{pet.sex.toLowerCase()}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes sections */}
                  <div className="space-y-4">
                    {pet.coatType && (
                      <div className="p-3 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Scissors className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">Coat Type</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{pet.coatType}</p>
                        {pet.coatNotes && (
                          <p className="text-sm text-muted-foreground mt-1">{pet.coatNotes}</p>
                        )}
                      </div>
                    )}

                    {pet.groomingPrefs && (
                      <div className="p-3 rounded-xl bg-muted/50">
                        <div className="flex items-center gap-2 mb-1">
                          <Scissors className="h-4 w-4 text-muted-foreground" />
                          <p className="text-sm font-medium">Grooming Preferences</p>
                        </div>
                        <p className="text-sm text-muted-foreground">{pet.groomingPrefs}</p>
                      </div>
                    )}

                    {pet.behaviorNotes && (
                      <div className="p-3 rounded-xl bg-amber-50">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-amber-600" />
                          <p className="text-sm font-medium text-amber-900">Behavior Notes</p>
                        </div>
                        <p className="text-sm text-amber-800">{pet.behaviorNotes}</p>
                      </div>
                    )}

                    {pet.vaccineNotes && (
                      <div className="p-3 rounded-xl bg-emerald-50">
                        <div className="flex items-center gap-2 mb-1">
                          <Syringe className="h-4 w-4 text-emerald-600" />
                          <p className="text-sm font-medium text-emerald-900">Vaccine Status</p>
                        </div>
                        <p className="text-sm text-emerald-800">{pet.vaccineNotes}</p>
                      </div>
                    )}

                    {pet.medicalNotes && (
                      <div className="p-3 rounded-xl bg-red-50">
                        <div className="flex items-center gap-2 mb-1">
                          <Heart className="h-4 w-4 text-red-600" />
                          <p className="text-sm font-medium text-red-900">Medical Notes</p>
                        </div>
                        <p className="text-sm text-red-800">{pet.medicalNotes}</p>
                      </div>
                    )}
                  </div>

                  {/* Visit count */}
                  <div className="mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Total visits: <span className="font-medium">{pet._count.appointmentPets}</span>
                    </p>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
