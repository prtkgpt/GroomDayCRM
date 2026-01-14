import { redirect, notFound } from "next/navigation"
import Link from "next/link"
import { format, differenceInYears, differenceInMonths } from "date-fns"
import {
  PawPrint,
  ArrowLeft,
  LogOut,
  Dog,
  Calendar,
  Weight,
  Scissors,
  Syringe,
  AlertTriangle,
} from "lucide-react"
import { db } from "@/lib/db"
import { getPortalSession, portalLogout } from "@/lib/actions/portal-auth"
import { getTheme } from "@/lib/themes"
import { cn } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
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

async function getClientPets(clientId: string) {
  return db.pet.findMany({
    where: { clientId },
    include: {
      vaccinations: {
        orderBy: { expirationDate: "asc" },
      },
    },
    orderBy: { name: "asc" },
  })
}

function formatAge(birthDate: Date | null): string {
  if (!birthDate) return "Unknown age"
  const years = differenceInYears(new Date(), birthDate)
  if (years >= 1) {
    return `${years} year${years !== 1 ? "s" : ""} old`
  }
  const months = differenceInMonths(new Date(), birthDate)
  return `${months} month${months !== 1 ? "s" : ""} old`
}

export default async function PortalPetsPage({
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
  const pets = await getClientPets(client.id)

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
        <Link href={`/${slug}/portal/dashboard`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
        </Link>

        <div>
          <h1 className="text-2xl font-bold">My Pets</h1>
          <p className="text-muted-foreground">
            View your registered pets and their information
          </p>
        </div>

        {pets.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Dog className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-4">No pets registered yet</p>
              <Link href={`/${slug}/book`}>
                <Button className={cn(
                  theme.colors.primary,
                  theme.colors.primaryForeground,
                  theme.colors.buttonHover
                )}>
                  Book Your First Appointment
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {pets.map((pet) => (
              <PetCard key={pet.id} pet={pet} theme={theme} />
            ))}
          </div>
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

function PetCard({
  pet,
  theme,
}: {
  pet: Awaited<ReturnType<typeof getClientPets>>[0]
  theme: ReturnType<typeof getTheme>
}) {
  const now = new Date()
  const expiringVaccinations = pet.vaccinations.filter(
    (v) => v.expirationDate && v.expirationDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  )
  const hasExpiringVaccines = expiringVaccinations.length > 0

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className={cn(
              "p-3 rounded-full",
              theme.colors.accent
            )}>
              <Dog className={cn("h-8 w-8", theme.colors.badgeText)} />
            </div>
            <div>
              <CardTitle className="text-xl">{pet.name}</CardTitle>
              <CardDescription>
                {pet.breed || pet.species}
                {pet.color && ` • ${pet.color}`}
              </CardDescription>
            </div>
          </div>
          {hasExpiringVaccines && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="h-3 w-3" />
              Vaccines expiring
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Basic Info */}
        <div className="grid gap-4 sm:grid-cols-3">
          {pet.birthDate && (
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{formatAge(pet.birthDate)}</span>
            </div>
          )}
          {pet.weight && (
            <div className="flex items-center gap-2 text-sm">
              <Weight className="h-4 w-4 text-muted-foreground" />
              <span>{pet.weight} lbs</span>
            </div>
          )}
          {pet.sex && (
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Sex:</span>
              <span>{pet.sex}</span>
            </div>
          )}
        </div>

        {/* Coat Info */}
        {(pet.coatType || pet.coatNotes) && (
          <div className="p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-1">
              <Scissors className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Grooming Notes</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {pet.coatType && <span>Coat type: {pet.coatType}. </span>}
              {pet.coatNotes}
            </p>
          </div>
        )}

        {/* Vaccinations */}
        {pet.vaccinations.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Syringe className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium text-sm">Vaccinations</span>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {pet.vaccinations.map((vax) => {
                const isExpired = vax.expirationDate && vax.expirationDate < now
                const isExpiringSoon = vax.expirationDate &&
                  vax.expirationDate <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) &&
                  !isExpired

                return (
                  <div
                    key={vax.id}
                    className={cn(
                      "p-2 rounded-lg border text-sm",
                      isExpired && "border-destructive/50 bg-destructive/5",
                      isExpiringSoon && "border-yellow-500/50 bg-yellow-500/5"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{vax.name}</span>
                      {isExpired && (
                        <Badge variant="destructive" className="text-xs">Expired</Badge>
                      )}
                      {isExpiringSoon && (
                        <Badge variant="outline" className="text-xs border-yellow-500 text-yellow-700">
                          Expiring soon
                        </Badge>
                      )}
                    </div>
                    {vax.expirationDate && (
                      <p className="text-xs text-muted-foreground">
                        Expires: {format(vax.expirationDate, "MMM d, yyyy")}
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Special Notes */}
        {(pet.behaviorNotes || pet.medicalNotes || pet.groomingPrefs) && (
          <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
            <p className="font-medium text-sm mb-1">Special Notes</p>
            <p className="text-sm text-muted-foreground">
              {pet.behaviorNotes && <span>{pet.behaviorNotes} </span>}
              {pet.medicalNotes && <span>{pet.medicalNotes} </span>}
              {pet.groomingPrefs && <span>{pet.groomingPrefs}</span>}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
