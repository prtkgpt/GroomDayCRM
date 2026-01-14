import { notFound } from "next/navigation"
import { PawPrint, Star, CheckCircle, XCircle } from "lucide-react"
import { db } from "@/lib/db"
import { getTheme } from "@/lib/themes"
import { cn } from "@/lib/utils"
import { getFeedbackRequest } from "@/lib/actions/feedback"
import { FeedbackForm } from "./feedback-form"

async function getOrganization(slug: string) {
  return db.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      theme: true,
      googleReviewUrl: true,
      yelpUrl: true,
    },
  })
}

export default async function FeedbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ token?: string }>
}) {
  const { slug } = await params
  const { token } = await searchParams

  const organization = await getOrganization(slug)
  if (!organization) {
    notFound()
  }

  const theme = getTheme(organization.theme)

  if (!token) {
    return (
      <ErrorPage
        organization={organization}
        theme={theme}
        title="Missing Token"
        message="This feedback link appears to be incomplete. Please use the link from your email."
      />
    )
  }

  const request = await getFeedbackRequest(token)

  if (!request) {
    return (
      <ErrorPage
        organization={organization}
        theme={theme}
        title="Invalid Link"
        message="This feedback link is invalid or has been removed."
      />
    )
  }

  if (request.isUsed) {
    return (
      <SuccessPage
        organization={organization}
        theme={theme}
        title="Already Submitted"
        message="Thank you! You've already submitted feedback for this appointment."
      />
    )
  }

  if (request.isExpired) {
    return (
      <ErrorPage
        organization={organization}
        theme={theme}
        title="Link Expired"
        message="This feedback link has expired. Please contact the business if you'd still like to leave feedback."
      />
    )
  }

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
          <div className="bg-card rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold mb-2">How was your visit?</h1>
              <p className="text-muted-foreground">
                Hi {request.client.firstName}! We'd love to hear about your experience
                with {request.petNames.join(" and ")}.
              </p>
            </div>

            <FeedbackForm
              token={token}
              theme={theme}
              organization={request.organization}
            />
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

function ErrorPage({
  organization,
  theme,
  title,
  message,
}: {
  organization: { name: string }
  theme: ReturnType<typeof getTheme>
  title: string
  message: string
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex flex-col">
      <header className={cn("py-4", theme.colors.primary)}>
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center gap-2 text-white">
            <PawPrint className="h-6 w-6" />
            <span className="font-semibold">{organization.name}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg shadow-lg p-8 text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-destructive/10">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-xl font-semibold mb-2">{title}</h1>
            <p className="text-muted-foreground">{message}</p>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground">
        Powered by{" "}
        <a href="/" className="hover:underline">
          GroomDayCRM
        </a>
      </footer>
    </div>
  )
}

function SuccessPage({
  organization,
  theme,
  title,
  message,
}: {
  organization: { name: string }
  theme: ReturnType<typeof getTheme>
  title: string
  message: string
}) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/50 to-background flex flex-col">
      <header className={cn("py-4", theme.colors.primary)}>
        <div className="max-w-md mx-auto px-4">
          <div className="flex items-center gap-2 text-white">
            <PawPrint className="h-6 w-6" />
            <span className="font-semibold">{organization.name}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-card rounded-lg shadow-lg p-8 text-center">
            <div className={cn(
              "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
              theme.colors.accent
            )}>
              <CheckCircle className={cn("h-8 w-8", theme.colors.badgeText)} />
            </div>
            <h1 className="text-xl font-semibold mb-2">{title}</h1>
            <p className="text-muted-foreground">{message}</p>
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-sm text-muted-foreground">
        Powered by{" "}
        <a href="/" className="hover:underline">
          GroomDayCRM
        </a>
      </footer>
    </div>
  )
}
