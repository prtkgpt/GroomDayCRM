import { redirect } from "next/navigation"
import { getOrganizationBySlug } from "@/lib/actions/public-booking"
import { getPortalSession } from "@/lib/actions/client-portal"
import { PortalLogin } from "./portal-login"

interface PortalPageProps {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}

export default async function PortalPage({ params, searchParams }: PortalPageProps) {
  const { slug } = await params
  const { token } = await searchParams
  const org = await getOrganizationBySlug(slug)

  if (!org) {
    return null
  }

  // Check if user is already logged in
  const client = await getPortalSession(org.id)
  if (client) {
    redirect(`/${slug}/portal/dashboard`)
  }

  return (
    <div className="container max-w-md mx-auto px-4 py-12 lg:py-20">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-semibold tracking-tight mb-2">
          {org.name}
        </h1>
        <p className="text-muted-foreground">
          Client Portal
        </p>
      </div>

      <PortalLogin
        organizationId={org.id}
        organizationSlug={slug}
        token={token}
      />
    </div>
  )
}
