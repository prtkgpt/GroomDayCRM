import Link from "next/link"
import Image from "next/image"
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
  Heart,
  Shield,
  Sparkles,
  Award,
  Calendar,
  Quote,
  CheckCircle2,
} from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
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

// Sample pet images (using placeholder URLs - in production these would come from the organization's gallery)
const petImages = [
  "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1598133894008-61f7fdb8cc3a?w=400&h=400&fit=crop",
  "https://images.unsplash.com/photo-1544568100-847a948585b9?w=400&h=400&fit=crop",
]

// Sample testimonials (in production these would come from the database)
const testimonials = [
  {
    name: "Sarah M.",
    pet: "Max (Golden Retriever)",
    rating: 5,
    text: "Absolutely amazing service! Max always comes back looking and smelling fantastic. The groomers are so gentle and patient with him.",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop",
  },
  {
    name: "Michael R.",
    pet: "Luna (Poodle)",
    rating: 5,
    text: "Best grooming experience we've ever had. They really take their time and Luna is always so happy after her appointments.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop",
  },
  {
    name: "Emily K.",
    pet: "Buddy (Shih Tzu)",
    rating: 5,
    text: "The online booking is so convenient, and the results are always perfect. Buddy looks like a show dog every time!",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop",
  },
]

const whyChooseUs = [
  {
    icon: Heart,
    title: "Gentle & Caring",
    description: "We treat every pet like our own, with patience and love.",
  },
  {
    icon: Award,
    title: "Experienced Groomers",
    description: "Our team has years of experience with all breeds.",
  },
  {
    icon: Shield,
    title: "Safe Products",
    description: "We use only premium, pet-safe grooming products.",
  },
  {
    icon: Sparkles,
    title: "Spotless Results",
    description: "Your pet will look and smell absolutely amazing.",
  },
]

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
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href={`/${slug}`} className="flex items-center gap-2.5">
            <div className={cn("h-9 w-9 rounded-xl flex items-center justify-center", theme.colors.primary)}>
              <PawPrint className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-semibold text-gray-900">{organization.name}</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#services" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Services
            </a>
            <a href="#gallery" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Gallery
            </a>
            <a href="#reviews" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Reviews
            </a>
            <a href="#contact" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
              Contact
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href={`/${slug}/portal`}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors hidden sm:block"
            >
              Sign In
            </Link>
            <Link href={`/${slug}/book`}>
              <Button className={cn("rounded-full px-6", theme.colors.primary, theme.colors.buttonHover)}>
                Book Now
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-50 via-white to-gray-100" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-br from-primary/5 to-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-primary/5 to-transparent rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="text-center lg:text-left">
              <div className={cn(
                "inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium mb-6",
                "bg-primary/10 text-primary"
              )}>
                <Sparkles className="h-4 w-4" />
                Professional Pet Grooming
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1] mb-6">
                Where Every Pet
                <br />
                <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Gets the Royal Treatment
                </span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-xl mx-auto lg:mx-0">
                {organization.description || "Experience premium grooming services that keep your furry friends looking fabulous and feeling their best."}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                <Link href={`/${slug}/book`}>
                  <Button size="lg" className={cn("rounded-full px-8 text-base h-12", theme.colors.primary, theme.colors.buttonHover)}>
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Appointment
                  </Button>
                </Link>
                {organization.phone && (
                  <a href={`tel:${organization.phone}`}>
                    <Button variant="outline" size="lg" className="rounded-full px-8 text-base h-12 border-gray-300">
                      <Phone className="mr-2 h-5 w-5" />
                      {organization.phone}
                    </Button>
                  </a>
                )}
              </div>

              {/* Trust badges */}
              <div className="flex items-center gap-6 mt-10 justify-center lg:justify-start">
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <span className="text-sm font-medium text-gray-600">5.0 Rating</span>
                </div>
                <div className="h-5 w-px bg-gray-200" />
                <div className="flex items-center gap-2">
                  <Heart className="h-5 w-5 text-red-500 fill-red-500" />
                  <span className="text-sm font-medium text-gray-600">500+ Happy Pets</span>
                </div>
              </div>
            </div>

            {/* Hero Image Grid */}
            <div className="relative hidden lg:block">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                    <Image
                      src={petImages[0]}
                      alt="Happy groomed dog"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl">
                    <Image
                      src={petImages[1]}
                      alt="Cute puppy"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
                <div className="space-y-4 pt-8">
                  <div className="relative aspect-square rounded-3xl overflow-hidden shadow-xl">
                    <Image
                      src={petImages[2]}
                      alt="Dog getting groomed"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-2xl">
                    <Image
                      src={petImages[3]}
                      alt="Beautiful dog portrait"
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>
              </div>
              {/* Floating badge */}
              <div className="absolute -left-6 bottom-20 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3">
                <div className={cn("h-12 w-12 rounded-full flex items-center justify-center", theme.colors.accent)}>
                  <CheckCircle2 className={cn("h-6 w-6", theme.colors.badgeText)} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">Satisfaction Guaranteed</p>
                  <p className="text-xs text-gray-500">100% Happy Customers</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {whyChooseUs.map((item) => (
              <div key={item.title} className="text-center">
                <div className={cn(
                  "inline-flex items-center justify-center h-14 w-14 rounded-2xl mb-4",
                  theme.colors.accent
                )}>
                  <item.icon className={cn("h-7 w-7", theme.colors.badgeText)} />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-600 text-sm">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <span className={cn("text-sm font-semibold tracking-wide uppercase", theme.colors.badgeText)}>
              Our Services
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
              Premium Grooming Packages
            </h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              From a simple bath to a full spa day, we offer services tailored to your pet&apos;s unique needs.
            </p>
          </div>

          {/* Main Services */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {mainServices.map((service, index) => (
              <Card
                key={service.id}
                className={cn(
                  "group relative overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300",
                  index === 0 && "lg:col-span-1 row-span-1"
                )}
              >
                <div className={cn("absolute top-0 left-0 right-0 h-1", theme.colors.primary)} />
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-4">
                    <div className={cn(
                      "h-12 w-12 rounded-xl flex items-center justify-center",
                      theme.colors.accent
                    )}>
                      <Scissors className={cn("h-6 w-6", theme.colors.badgeText)} />
                    </div>
                    <span className={cn("text-2xl font-bold", theme.colors.badgeText)}>
                      ${service.defaultPrice}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{service.name}</h3>
                  {service.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">{service.description}</p>
                  )}
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="h-4 w-4 mr-1.5" />
                    {service.defaultDuration} minutes
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Add-ons */}
          {addOns.length > 0 && (
            <div className="mt-12">
              <h3 className="text-xl font-semibold text-gray-900 text-center mb-6">
                Enhance Your Visit with Add-Ons
              </h3>
              <div className="flex flex-wrap justify-center gap-3">
                {addOns.map((service) => (
                  <div
                    key={service.id}
                    className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-5 py-2.5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Sparkles className={cn("h-4 w-4", theme.colors.badgeText)} />
                    <span className="font-medium text-gray-900">{service.name}</span>
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
              <Button size="lg" className={cn("rounded-full px-8", theme.colors.primary, theme.colors.buttonHover)}>
                Book Your Appointment
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className={cn("text-sm font-semibold tracking-wide uppercase", theme.colors.badgeText)}>
              Gallery
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
              Our Happy Customers
            </h2>
            <p className="mt-4 text-lg text-gray-600">
              See the transformation! Fresh cuts, happy pets.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {petImages.map((src, index) => (
              <div
                key={index}
                className={cn(
                  "relative rounded-2xl overflow-hidden group cursor-pointer",
                  index === 0 && "md:col-span-2 md:row-span-2 aspect-square md:aspect-auto",
                  index !== 0 && "aspect-square"
                )}
              >
                <Image
                  src={src}
                  alt={`Happy pet ${index + 1}`}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300" />
                <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1.5 text-sm font-medium text-gray-900">
                    <Heart className="h-4 w-4 text-red-500 fill-red-500" />
                    Fresh & Fabulous
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="reviews" className="py-20 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <span className={cn("text-sm font-semibold tracking-wide uppercase", theme.colors.badgeText)}>
              Testimonials
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900">
              What Pet Parents Say
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardContent className="p-8">
                  <div className="flex gap-1 mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <Quote className="h-8 w-8 text-gray-200 mb-4" />
                  <p className="text-gray-700 mb-6 leading-relaxed">{testimonial.text}</p>
                  <div className="flex items-center gap-4">
                    <div className="relative h-12 w-12 rounded-full overflow-hidden">
                      <Image
                        src={testimonial.avatar}
                        alt={testimonial.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{testimonial.name}</p>
                      <p className="text-sm text-gray-500">{testimonial.pet}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Review Links */}
          {(organization.googleReviewUrl || organization.yelpUrl) && (
            <div className="text-center mt-12">
              <p className="text-gray-600 mb-4">Love our service? Leave us a review!</p>
              <div className="flex justify-center gap-4">
                {organization.googleReviewUrl && (
                  <a
                    href={organization.googleReviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all"
                  >
                    <GoogleIcon className="h-5 w-5" />
                    Review on Google
                  </a>
                )}
                {organization.yelpUrl && (
                  <a
                    href={organization.yelpUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:bg-gray-50 hover:shadow-md transition-all"
                  >
                    <YelpIcon className="h-5 w-5 text-red-600" />
                    Review on Yelp
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-gray-50 scroll-mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
            <div>
              <span className={cn("text-sm font-semibold tracking-wide uppercase", theme.colors.badgeText)}>
                Get in Touch
              </span>
              <h2 className="mt-2 text-3xl sm:text-4xl font-bold text-gray-900 mb-6">
                Ready to Book?
              </h2>
              <p className="text-lg text-gray-600 mb-8">
                We&apos;d love to pamper your furry friend! Book online or reach out to us directly.
              </p>

              <div className="space-y-6">
                {organization.phone && (
                  <a
                    href={`tel:${organization.phone}`}
                    className="flex items-center gap-4 group"
                  >
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                      theme.colors.accent
                    )}>
                      <Phone className={cn("h-6 w-6", theme.colors.badgeText)} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Call us</p>
                      <p className="text-lg font-semibold text-gray-900">{organization.phone}</p>
                    </div>
                  </a>
                )}

                {organization.email && (
                  <a
                    href={`mailto:${organization.email}`}
                    className="flex items-center gap-4 group"
                  >
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                      theme.colors.accent
                    )}>
                      <Mail className={cn("h-6 w-6", theme.colors.badgeText)} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email us</p>
                      <p className="text-lg font-semibold text-gray-900">{organization.email}</p>
                    </div>
                  </a>
                )}

                {fullAddress && (
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 group"
                  >
                    <div className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110",
                      theme.colors.accent
                    )}>
                      <MapPin className={cn("h-6 w-6", theme.colors.badgeText)} />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Visit us</p>
                      <p className="text-lg font-semibold text-gray-900">{fullAddress}</p>
                    </div>
                  </a>
                )}

                <div className="flex items-center gap-4">
                  <div className={cn(
                    "h-14 w-14 rounded-2xl flex items-center justify-center",
                    theme.colors.accent
                  )}>
                    <Clock className={cn("h-6 w-6", theme.colors.badgeText)} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Business Hours</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {formatBusinessHours(organization.businessHoursStart, organization.businessHoursEnd)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Social Links */}
              {(organization.facebookUrl || organization.instagramUrl) && (
                <div className="mt-8 flex items-center gap-4">
                  <span className="text-sm text-gray-500">Follow us:</span>
                  {organization.facebookUrl && (
                    <a
                      href={organization.facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-blue-600 hover:border-blue-600 transition-colors"
                    >
                      <Facebook className="h-5 w-5" />
                    </a>
                  )}
                  {organization.instagramUrl && (
                    <a
                      href={organization.instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-10 w-10 rounded-full bg-white border border-gray-200 flex items-center justify-center text-gray-600 hover:text-pink-600 hover:border-pink-600 transition-colors"
                    >
                      <Instagram className="h-5 w-5" />
                    </a>
                  )}
                </div>
              )}
            </div>

            {/* Booking Card */}
            <div className="lg:pl-12">
              <Card className="border-0 shadow-2xl overflow-hidden">
                <div className={cn("h-2", theme.colors.primary)} />
                <CardContent className="p-8 lg:p-10">
                  <div className="text-center mb-8">
                    <div className={cn(
                      "inline-flex h-16 w-16 rounded-2xl items-center justify-center mb-4",
                      theme.colors.accent
                    )}>
                      <Calendar className={cn("h-8 w-8", theme.colors.badgeText)} />
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">Book Your Appointment</h3>
                    <p className="text-gray-600">Schedule online in just a few clicks</p>
                  </div>

                  <Link href={`/${slug}/book`} className="block">
                    <Button className={cn("w-full h-14 text-lg rounded-xl", theme.colors.primary, theme.colors.buttonHover)}>
                      <Scissors className="mr-2 h-5 w-5" />
                      Book Now
                    </Button>
                  </Link>

                  <p className="text-center text-sm text-gray-500 mt-6">
                    Free cancellation up to 24 hours before your appointment
                  </p>

                  <div className="mt-8 pt-8 border-t border-gray-100">
                    <p className="text-sm text-gray-500 text-center mb-4">Already have an account?</p>
                    <Link href={`/${slug}/portal`} className="block">
                      <Button variant="outline" className="w-full h-12 rounded-xl">
                        <User className="mr-2 h-5 w-5" />
                        Sign In to Portal
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className={cn("py-12", theme.colors.primary)}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                <PawPrint className="h-5 w-5 text-white" />
              </div>
              <span className="text-lg font-semibold text-white">{organization.name}</span>
            </div>

            <div className="flex items-center gap-6 text-sm text-white/80">
              <Link href={`/${slug}/book`} className="hover:text-white transition-colors">
                Book Appointment
              </Link>
              <Link href={`/${slug}/portal`} className="hover:text-white transition-colors">
                Client Portal
              </Link>
              {organization.phone && (
                <a href={`tel:${organization.phone}`} className="hover:text-white transition-colors">
                  {organization.phone}
                </a>
              )}
            </div>

            <p className="text-sm text-white/60">
              &copy; {new Date().getFullYear()} {organization.name}. Powered by{" "}
              <a href="/" className="text-white/80 hover:text-white transition-colors">
                GroomDayCRM
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
