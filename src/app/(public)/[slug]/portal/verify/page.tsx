import { redirect, notFound } from "next/navigation"
import { db } from "@/lib/db"
import { verifyMagicLink } from "@/lib/actions/portal-auth"
import { getTheme } from "@/lib/themes"
import { PawPrint, XCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import Link from "next/link"
import { Button } from "@/components/ui/button"

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

export default async function PortalVerifyPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { slug } = await params
  const { token } = await searchParams

  let organization
  try {
    organization = await getOrganization(slug)
  } catch (error) {
    console.error("Error fetching organization:", error)
    notFound()
  }

  if (!organization) {
    notFound()
  }

  const theme = getTheme(organization.theme)

  if (!token) {
    return (
      <ErrorPage
        organization={organization}
        theme={theme}
        message="Invalid link. Please request a new login link."
        slug={slug}
      />
    )
  }

  // Verify the token
  let result
  try {
    result = await verifyMagicLink(token)
  } catch (error) {
    console.error("Error verifying magic link:", error)
    return (
      <ErrorPage
        organization={organization}
        theme={theme}
        message="An error occurred while verifying your link. Please try again."
        slug={slug}
      />
    )
  }

  if (result.success) {
    // Redirect to dashboard
    redirect(`/${slug}/portal/dashboard`)
  }

  return (
    <ErrorPage
      organization={organization}
      theme={theme}
      message={result.error || "Invalid or expired link"}
      slug={slug}
    />
  )
}

function ErrorPage({
  organization,
  theme,
  message,
  slug,
}: {
  organization: { name: string }
  theme: ReturnType<typeof getTheme>
  message: string
  slug: string
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex flex-col">
      {/* Header */}
      <header className={cn("py-4", theme.colors.primary)}>
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center gap-2 text-white">
            <PawPrint className="h-6 w-6" />
            <span className="font-semibold">{organization.name}</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold mb-2">Link Invalid</h1>
            <p className="text-muted-foreground mb-6">{message}</p>
            <Link href={`/${slug}/portal`}>
              <Button className={cn(
                theme.colors.primary,
                theme.colors.primaryForeground,
                theme.colors.buttonHover
              )}>
                Request New Link
              </Button>
            </Link>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground">
        Powered by{" "}
        <a href="/" className="hover:underline">
          GroomDayCRM
        </a>
      </footer>
    </div>
  )
}
