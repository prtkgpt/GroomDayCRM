import { notFound } from "next/navigation"
import { getOrganizationBySlug, getPublicServices } from "@/lib/actions/public-booking"
import { BookingWizard } from "./booking-wizard"

interface BookingPageProps {
  params: Promise<{ slug: string }>
}

export default async function BookingPage({ params }: BookingPageProps) {
  const { slug } = await params
  const org = await getOrganizationBySlug(slug)

  if (!org || !org.bookingEnabled) {
    notFound()
  }

  const services = await getPublicServices(org.id)

  return (
    <div className="container max-w-3xl mx-auto px-4 py-8 lg:py-12">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl lg:text-4xl font-semibold tracking-tight mb-2">
          {org.name}
        </h1>
        {org.description && (
          <p className="text-muted-foreground text-lg">{org.description}</p>
        )}
      </div>

      {/* Booking Form */}
      <BookingWizard
        organization={org}
        services={services}
      />
    </div>
  )
}
