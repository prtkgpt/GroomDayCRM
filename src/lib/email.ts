import { Resend } from "resend"
import { db } from "@/lib/db"

// Platform-level Resend client (fallback)
const platformResend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

// Get Resend client for an organization (uses org key if available, else platform)
export async function getResendClient(organizationId: string): Promise<Resend | null> {
  // Try to get org's own Resend API key
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { resendApiKey: true },
  })

  if (organization?.resendApiKey) {
    return new Resend(organization.resendApiKey)
  }

  // Fall back to platform key
  return platformResend
}

// Get Resend client by organization slug
export async function getResendClientBySlug(slug: string): Promise<{
  resend: Resend | null
  organization: { id: string; name: string } | null
}> {
  const organization = await db.organization.findUnique({
    where: { slug },
    select: { id: true, name: true, resendApiKey: true },
  })

  if (!organization) {
    return { resend: null, organization: null }
  }

  const resend = organization.resendApiKey
    ? new Resend(organization.resendApiKey)
    : platformResend

  return {
    resend,
    organization: { id: organization.id, name: organization.name },
  }
}

// Default from email based on whether org has custom key
export function getFromEmail(organizationName: string, hasCustomKey: boolean): string {
  if (hasCustomKey) {
    // Org with custom key can use their own domain (they need to configure in Resend)
    const fromEmail = process.env.RESEND_FROM_EMAIL || "noreply@groomdaycrm.com"
    return `${organizationName} <${fromEmail}>`
  }
  // Platform email
  return `${organizationName} via GroomDayCRM <noreply@groomdaycrm.com>`
}

interface SendEmailOptions {
  organizationId: string
  to: string
  subject: string
  html?: string
  text?: string
}

export async function sendEmail({
  organizationId,
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<{ success: boolean; id?: string; error?: string }> {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { name: true, resendApiKey: true },
  })

  if (!organization) {
    return { success: false, error: "Organization not found" }
  }

  const resend = organization.resendApiKey
    ? new Resend(organization.resendApiKey)
    : platformResend

  if (!resend) {
    console.log("Resend not configured, email would be sent to:", to)
    console.log("Subject:", subject)
    return { success: true } // Return success in dev without Resend
  }

  try {
    const from = getFromEmail(organization.name, !!organization.resendApiKey)
    const result = await resend.emails.send({
      from,
      to,
      subject,
      html: html || undefined,
      text: text || "",
    })

    return { success: true, id: result.data?.id || undefined }
  } catch (error) {
    console.error("Failed to send email:", error)
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to send email",
    }
  }
}
