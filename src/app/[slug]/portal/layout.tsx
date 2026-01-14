import { Metadata } from "next"
import { notFound } from "next/navigation"
import { getOrganizationBySlug } from "@/lib/actions/public-booking"

interface PortalLayoutProps {
  children: React.ReactNode
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PortalLayoutProps): Promise<Metadata> {
  const { slug } = await params
  const org = await getOrganizationBySlug(slug)

  if (!org) {
    return { title: "Not Found" }
  }

  return {
    title: `Client Portal - ${org.name}`,
    description: `View your appointments and pet information with ${org.name}`,
  }
}

export default async function PortalLayout({
  children,
  params,
}: PortalLayoutProps) {
  const { slug } = await params
  const org = await getOrganizationBySlug(slug)

  if (!org) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {children}
    </div>
  )
}
