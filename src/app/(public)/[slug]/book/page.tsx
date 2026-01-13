import { notFound } from "next/navigation"
import { getOrganizationBySlug } from "@/lib/actions/public-booking"
import { BookingForm } from "./booking-form"

export default async function PublicBookingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const organization = await getOrganizationBySlug(slug)

  if (!organization) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/5 to-background">
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">
            {organization.name}
          </h1>
          <p className="text-muted-foreground">
            Book your grooming appointment online
          </p>
        </div>

        {/* Booking Form */}
        <BookingForm
          organization={{
            id: organization.id,
            name: organization.name,
            address: organization.address,
            phone: organization.phone,
            email: organization.email,
          }}
          services={organization.services.map((s) => ({
            id: s.id,
            name: s.name,
            description: s.description,
            price: s.defaultPrice,
            duration: s.defaultDuration,
          }))}
        />

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            Questions? Contact us at{" "}
            {organization.phone && (
              <a href={`tel:${organization.phone}`} className="text-primary hover:underline">
                {organization.phone}
              </a>
            )}
            {organization.phone && organization.email && " or "}
            {organization.email && (
              <a href={`mailto:${organization.email}`} className="text-primary hover:underline">
                {organization.email}
              </a>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}
