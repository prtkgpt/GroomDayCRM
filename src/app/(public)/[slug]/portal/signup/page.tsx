import { notFound, redirect } from "next/navigation"
import Link from "next/link"
import { db } from "@/lib/db"
import { getPortalSession } from "@/lib/actions/portal-auth"
import { getTheme } from "@/lib/themes"
import { PortalSignupForm } from "./signup-form"
import { PawPrint } from "lucide-react"
import { cn } from "@/lib/utils"

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

export default async function PortalSignupPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const organization = await getOrganization(slug)

  if (!organization) {
    notFound()
  }

  // Check if already logged in
  const session = await getPortalSession()
  if (session && session.organization.slug === slug) {
    redirect(`/${slug}/portal/dashboard`)
  }

  const theme = getTheme(organization.theme)

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex flex-col">
      {/* Header */}
      <header className={cn("py-4", theme.colors.primary)}>
        <div className="max-w-md mx-auto px-4">
          <Link href={`/${slug}`} className="flex items-center gap-2 text-white">
            <PawPrint className="h-6 w-6" />
            <span className="font-semibold">{organization.name}</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">Create Your Account</h1>
              <p className="text-muted-foreground">
                Sign up to manage your appointments and pets
              </p>
            </div>

            <PortalSignupForm slug={slug} theme={theme} />

            <p className="text-xs text-center text-muted-foreground mt-6">
              We&apos;ll send a secure login link to your email.
              No password needed!
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link href={`/${slug}/portal`} className={cn("hover:underline font-medium", theme.colors.badgeText)}>
              Sign in
            </Link>
          </p>
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
