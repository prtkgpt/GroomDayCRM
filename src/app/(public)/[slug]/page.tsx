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
  Star,
  Facebook,
  Instagram,
  User,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { db } from "@/lib/db"
import { getTheme } from "@/lib/themes"
import { cn } from "@/lib/utils"

// Custom icons for Google and Yelp (not in lucide)
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  )
}

function YelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21.111 18.226c-.141.969-2.119 3.483-3.029 3.847-.311.124-.611.094-.85-.09-.154-.12-.314-.333-2.324-3.065-.121-.164-.191-.362-.191-.569a.876.876 0 0 1 .831-.869c.09-.007 2.885-.154 3.035-.154.494 0 .688.262.744.544.024.118.024.3-.216.356zM15.937 12.534c.115.065.229.127.344.181.797.367 1.17.913 1.017 1.488-.156.589-.832.98-1.473.848-.055-.011-.105-.027-.156-.044-2.093-.551-2.093-.551-2.237-.657-.349-.257-.499-.56-.487-.913.021-.611.503-1.014 1.271-1.051.069-.004.154-.004.242-.004.565 0 1.204.053 1.479.152z" />
      <path d="M12.82 15.99c.025.604-.307 1.032-.921 1.183-.175.043-.351.068-.528.068-.39 0-.784-.103-1.04-.236-.026-.014-.052-.027-.077-.043-.119-.076-2.153-1.478-2.272-1.559-.185-.127-.31-.353-.31-.606 0-.253.125-.482.323-.621.112-.079.293-.153.674-.302l2.93-1.136c.169-.065.35-.107.54-.107.54 0 .996.378 1.073.9.013.087.014.176.008.268-.102 1.477-.333 1.858-.4 2.191z" />
      <path d="M9.666 11.293c-.148.056-.304.097-.466.097-.171 0-.351-.046-.514-.133-.089-.048-2.398-1.456-2.506-1.525-.167-.108-.28-.305-.28-.533 0-.162.064-.32.177-.449.094-.107.218-.189.357-.249 1.477-.633 2.037-.633 2.339-.633.359 0 .649.116.815.326.171.217.211.503.117.838l-.699 2.1c-.057.174-.192.323-.34.161z" />
      <path d="M10.111 8.631c-.044.018-.087.035-.132.05-.544.185-1.037-.032-1.323-.552-.024-.044-.044-.091-.062-.14-.516-1.335-.78-2.042-.78-2.097 0-.562.323-1.04.82-1.216.158-.057 2.25-.79 3.066-1.003.39-.102.771-.047 1.076.155.323.214.508.574.508.988v3.566c0 .36-.193.633-.503.764-.101.043-.2.057-.304.057-.126 0-.251-.027-.366-.072z" />
    </svg>
  )
}

async function getOrganizationWithServices(slug: string) {
  const organization = await db.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      theme: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      businessHoursStart: true,
      businessHoursEnd: true,
      googleReviewUrl: true,
      yelpUrl: true,
      facebookUrl: true,
      instagramUrl: true,
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
      {/* Header Navigation */}
      <header className={cn("sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60")}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/${slug}`} className="flex items-center gap-2 font-semibold">
            <PawPrint className={cn("h-5 w-5", theme.colors.badgeText)} />
            {organization.name}
          </Link>
          <div className="flex items-center gap-3">
            <Link
              href={`/${slug}/book`}
              className={cn(
                "hidden sm:inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg transition-colors",
                theme.colors.primary,
                theme.colors.primaryForeground,
                theme.colors.buttonHover
              )}
            >
              <Scissors className="h-4 w-4" />
              Book Now
            </Link>
            <Link
              href={`/${slug}/portal`}
              className="inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border hover:bg-muted transition-colors"
            >
              <User className="h-4 w-4" />
              <span className="hidden sm:inline">Client Login</span>
              <span className="sm:hidden">Login</span>
            </Link>
          </div>
        </div>
      </header>

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

                {/* Review Links */}
                {(organization.googleReviewUrl || organization.yelpUrl) && (
                  <div className="mt-8">
                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Love our service? Leave a review!
                    </h4>
                    <div className="flex gap-3">
                      {organization.googleReviewUrl && (
                        <a
                          href={organization.googleReviewUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            theme.colors.accent,
                            "hover:opacity-80"
                          )}
                        >
                          <GoogleIcon className="h-4 w-4" />
                          Google
                        </a>
                      )}
                      {organization.yelpUrl && (
                        <a
                          href={organization.yelpUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={cn(
                            "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                            theme.colors.accent,
                            "hover:opacity-80"
                          )}
                        >
                          <YelpIcon className="h-4 w-4" />
                          Yelp
                        </a>
                      )}
                    </div>
                  </div>
                )}

                <div className={cn("mt-6 p-4 rounded-lg", theme.colors.accent)}>
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

            {/* Quick Links */}
            <div className="flex items-center gap-4 text-sm">
              <Link
                href={`/${slug}/book`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Book Appointment
              </Link>
              <Link
                href={`/${slug}/portal`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                Client Login
              </Link>
            </div>

            {/* Social Media Icons */}
            {(organization.facebookUrl || organization.instagramUrl || organization.googleReviewUrl || organization.yelpUrl) && (
              <div className="flex items-center gap-3">
                {organization.facebookUrl && (
                  <a
                    href={organization.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Facebook"
                  >
                    <Facebook className="h-5 w-5" />
                  </a>
                )}
                {organization.instagramUrl && (
                  <a
                    href={organization.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Instagram"
                  >
                    <Instagram className="h-5 w-5" />
                  </a>
                )}
                {organization.googleReviewUrl && (
                  <a
                    href={organization.googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Google Reviews"
                  >
                    <GoogleIcon className="h-5 w-5" />
                  </a>
                )}
                {organization.yelpUrl && (
                  <a
                    href={organization.yelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Yelp"
                  >
                    <YelpIcon className="h-5 w-5" />
                  </a>
                )}
              </div>
            )}

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
