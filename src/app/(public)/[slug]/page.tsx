import Link from "next/link"
import { notFound } from "next/navigation"
import {
  Phone,
  Mail,
  MapPin,
  Clock,
  Scissors,
  ChevronRight,
  PawPrint,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { db } from "@/lib/db"
import { getTheme } from "@/lib/themes"
import { cn } from "@/lib/utils"

async function getOrganizationWithServices(slug: string) {
  const organization = await db.organization.findUnique({
    where: { slug },
    include: {
      services: {
        where: { isActive: true },
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  return organization
}

function formatBusinessHours(start: string, end: string) {
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":").map(Number)
    const period = hours >= 12 ? "PM" : "AM"
    const hour12 = hours % 12 || 12
    return `${hour12}:${minutes.toString().padStart(2, "0")} ${period}`
  }
  return `${formatTime(start)} - ${formatTime(end)}`
}

export default async function BusinessLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const organization = await getOrganizationWithServices(slug)

  if (!organization) {
    notFound()
  }

  const theme = getTheme(organization.theme)
  const mainServices = organization.services.filter((s) => !s.isAddOn)
  const addOns = organization.services.filter((s) => s.isAddOn)

  const fullAddress = [
    organization.address,
    organization.city,
    organization.state,
    organization.zipCode,
  ]
    .filter(Boolean)
    .join(", ")

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className={cn("relative overflow-hidden bg-gradient-to-b", theme.colors.gradient)}>
        <div className={cn("absolute inset-0 bg-gradient-to-br", theme.colors.heroGradient)} />
        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24 relative">
          <div className="text-center">
            <div className={cn(
              "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6",
              theme.colors.badge,
              theme.colors.badgeText
            )}>
              <PawPrint className="h-4 w-4" />
              Professional Pet Grooming
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              {organization.name}
            </h1>
            {organization.description && (
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                {organization.description}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href={`/${slug}/book`}>
                <button className={cn(
                  "inline-flex items-center justify-center gap-2 text-lg px-8 py-3 rounded-lg font-medium transition-colors",
                  theme.colors.primary,
                  theme.colors.primaryForeground,
                  theme.colors.buttonHover
                )}>
                  <Scissors className="h-5 w-5" />
                  Book Appointment
                </button>
              </Link>
              {organization.phone && (
                <a href={`tel:${organization.phone}`}>
                  <button className="inline-flex items-center justify-center gap-2 text-lg px-8 py-3 rounded-lg font-medium border bg-background hover:bg-muted transition-colors">
                    <Phone className="h-5 w-5" />
                    Call Us
                  </button>
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-16 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Our Services</h2>
            <p className="text-muted-foreground">
              Professional grooming services tailored to your pet&apos;s needs
            </p>
          </div>

          {/* Main Services */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
            {mainServices.map((service) => (
              <Card key={service.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-lg">{service.name}</h3>
                    <span className={cn("text-xl font-bold", theme.colors.badgeText)}>
                      ${service.defaultPrice}
                    </span>
                  </div>
                  {service.description && (
                    <p className="text-muted-foreground text-sm mb-3">
                      {service.description}
                    </p>
                  )}
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Clock className="h-4 w-4 mr-1" />
                    {service.defaultDuration} minutes
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add-ons */}
          {addOns.length > 0 && (
            <div className="mt-8">
              <h3 className="text-xl font-semibold mb-4 text-center">Add-On Services</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {addOns.map((service) => (
                  <div
                    key={service.id}
                    className="inline-flex items-center gap-2 bg-background border rounded-full px-4 py-2"
                  >
                    <span className="font-medium">{service.name}</span>
                    <span className={cn("font-semibold", theme.colors.badgeText)}>
                      +${service.defaultPrice}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA */}
          <div className="text-center mt-12">
            <Link href={`/${slug}/book`}>
              <button className={cn(
                "inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors",
                theme.colors.primary,
                theme.colors.primaryForeground,
                theme.colors.buttonHover
              )}>
                Book Now
                <ChevronRight className="h-5 w-5" />
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact & Hours Section */}
      <section className="py-16">
        <div className="max-w-5xl mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Contact Info */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-6">Contact Us</h3>
                <div className="space-y-4">
                  {organization.phone && (
                    <a
                      href={`tel:${organization.phone}`}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        theme.colors.accent
                      )}>
                        <Phone className={cn("h-5 w-5", theme.colors.badgeText)} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{organization.phone}</p>
                      </div>
                    </a>
                  )}

                  {organization.email && (
                    <a
                      href={`mailto:${organization.email}`}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        theme.colors.accent
                      )}>
                        <Mail className={cn("h-5 w-5", theme.colors.badgeText)} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <p className="font-medium">{organization.email}</p>
                      </div>
                    </a>
                  )}

                  {fullAddress && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                    >
                      <div className={cn(
                        "h-10 w-10 rounded-full flex items-center justify-center",
                        theme.colors.accent
                      )}>
                        <MapPin className={cn("h-5 w-5", theme.colors.badgeText)} />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Location</p>
                        <p className="font-medium">{fullAddress}</p>
                      </div>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Business Hours */}
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-6">Business Hours</h3>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "h-10 w-10 rounded-full flex items-center justify-center",
                    theme.colors.accent
                  )}>
                    <Clock className={cn("h-5 w-5", theme.colors.badgeText)} />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Open Daily</p>
                    <p className="font-medium">
                      {formatBusinessHours(
                        organization.businessHoursStart,
                        organization.businessHoursEnd
                      )}
                    </p>
                  </div>
                </div>

                <div className={cn("mt-8 p-4 rounded-lg", theme.colors.accent)}>
                  <p className="text-sm text-center text-muted-foreground">
                    Book online anytime! We&apos;ll confirm your appointment within 24 hours.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className={cn("py-16", theme.colors.footer)}>
        <div className="max-w-5xl mx-auto px-4 text-center">
          <h2 className={cn("text-3xl font-bold mb-4", theme.colors.primaryForeground)}>
            Ready to Book?
          </h2>
          <p className={cn("mb-8 max-w-xl mx-auto opacity-90", theme.colors.footerText)}>
            Give your furry friend the pampering they deserve. Book your appointment today!
          </p>
          <Link href={`/${slug}/book`}>
            <button className="inline-flex items-center justify-center gap-2 text-lg px-8 py-3 rounded-lg font-medium bg-white text-gray-900 hover:bg-gray-100 transition-colors">
              <Scissors className="h-5 w-5" />
              Book Appointment
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              {organization.name} &copy; {new Date().getFullYear()}
            </p>
            <p className="text-sm text-muted-foreground">
              Powered by{" "}
              <a href="/" className={cn("hover:underline", theme.colors.badgeText)}>
                GroomDayCRM
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
