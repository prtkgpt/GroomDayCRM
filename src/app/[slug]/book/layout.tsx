import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getOrganizationBySlug } from "@/lib/actions/public-booking"

interface BookingLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: BookingLayoutProps): Promise<Metadata> {
  const { slug } = await params
  const org = await getOrganizationBySlug(slug)

  if (!org) {
    return { title: "Not Found" }
  }

  return {
    title: `Book an Appointment - ${org.name}`,
    description: org.description || `Book your pet grooming appointment with ${org.name}`,
  }
}

export default async function BookingLayout({
  children,
  params,
}: BookingLayoutProps) {
  const { slug } = await params
  const org = await getOrganizationBySlug(slug)

  if (!org || !org.bookingEnabled) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {children}
    </div>
  )
}
