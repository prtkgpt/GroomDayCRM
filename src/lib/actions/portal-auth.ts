"use server"

import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { getResendClientBySlug, getFromEmail } from "@/lib/email"

const PORTAL_SESSION_COOKIE = "portal_session"

// Generate a random token
function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

// Request magic link - send email with login link
export async function requestMagicLink(email: string, slug: string) {
  // Get organization and Resend client (uses org's key if available)
  const { resend, organization } = await getResendClientBySlug(slug)

  if (!organization) {
    return { success: false, error: "Business not found" }
  }

  // Check if org has custom Resend key
  const orgData = await db.organization.findUnique({
    where: { slug },
    select: { id: true, resendApiKey: true },
  })
  const hasCustomKey = !!orgData?.resendApiKey

  // Find client by email in this organization
  const client = await db.client.findFirst({
    where: {
      email: email.toLowerCase(),
      organizationId: organization.id,
    },
  })

  if (!client) {
    // Don't reveal if email exists or not for security
    // But we still return success to prevent email enumeration
    return { success: true }
  }

  // Generate magic link token
  const token = generateToken()
  const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  // Create session with magic link token
  await db.customerSession.create({
    data: {
      token,
      tokenExpiresAt,
      clientId: client.id,
    },
  })

  // Build the magic link URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.groomdaycrm.com"
  const magicLink = `${baseUrl}/${slug}/portal/verify?token=${token}`

  // Send email with magic link
  if (!resend) {
    console.log("Resend not configured, magic link:", magicLink)
    return { success: true }
  }

  try {
    const from = getFromEmail(organization.name, hasCustomKey)
    await resend.emails.send({
      from,
      to: email,
      subject: `Your login link for ${organization.name}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${client.firstName}!</h2>
          <p>Click the button below to access your pet portal at ${organization.name}:</p>
          <p style="margin: 30px 0;">
            <a href="${magicLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Pet Portal
            </a>
          </p>
          <p style="color: #666; font-size: 14px;">
            This link expires in 15 minutes. If you didn't request this link, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">
            ${organization.name} uses GroomDayCRM for appointment management.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error("Failed to send magic link email:", error)
    return { success: false, error: "Failed to send email" }
  }

  return { success: true }
}

// Verify magic link token and create session
export async function verifyMagicLink(token: string) {
  // Find the session by token
  const session = await db.customerSession.findUnique({
    where: { token },
    include: {
      client: {
        include: {
          organization: {
            select: { slug: true },
          },
        },
      },
    },
  })

  if (!session) {
    return { success: false, error: "Invalid or expired link" }
  }

  // Check if token is expired
  if (session.tokenExpiresAt < new Date()) {
    // Clean up expired session
    await db.customerSession.delete({ where: { id: session.id } })
    return { success: false, error: "Link has expired. Please request a new one." }
  }

  // Generate session token
  const sessionToken = generateToken()
  const sessionExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

  // Update session with session token
  await db.customerSession.update({
    where: { id: session.id },
    data: {
      sessionToken,
      sessionExpiresAt,
      token: generateToken(), // Invalidate the magic link token
      tokenExpiresAt: new Date(0),
    },
  })

  // Set session cookie
  const cookieStore = await cookies()
  cookieStore.set(PORTAL_SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: sessionExpiresAt,
    path: "/",
  })

  return {
    success: true,
    slug: session.client.organization.slug,
  }
}

// Get current portal session
export async function getPortalSession() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(PORTAL_SESSION_COOKIE)?.value

  if (!sessionToken) {
    return null
  }

  const session = await db.customerSession.findUnique({
    where: { sessionToken },
    include: {
      client: {
        include: {
          organization: {
            select: {
              id: true,
              name: true,
              slug: true,
              phone: true,
              email: true,
            },
          },
          pets: true,
        },
      },
    },
  })

  if (!session || !session.sessionExpiresAt || session.sessionExpiresAt < new Date()) {
    // Clean up expired session
    if (session) {
      await db.customerSession.delete({ where: { id: session.id } })
    }
    return null
  }

  return {
    client: session.client,
    organization: session.client.organization,
  }
}

// Request signup - create client and send magic link
export async function requestSignup(
  data: {
    email: string
    firstName: string
    lastName: string
    phone?: string
  },
  slug: string
) {
  const email = data.email.trim().toLowerCase()

  // Get organization and Resend client
  const { resend, organization } = await getResendClientBySlug(slug)

  if (!organization) {
    return { success: false, error: "Business not found" }
  }

  // Check if org has custom Resend key
  const orgData = await db.organization.findUnique({
    where: { slug },
    select: { id: true, resendApiKey: true },
  })
  const hasCustomKey = !!orgData?.resendApiKey

  // Check if client already exists
  const existingClient = await db.client.findFirst({
    where: {
      email,
      organizationId: organization.id,
    },
  })

  if (existingClient) {
    // Client already exists - just send login link instead
    return requestMagicLink(email, slug)
  }

  // Create new client
  const client = await db.client.create({
    data: {
      organizationId: organization.id,
      email,
      firstName: data.firstName.trim(),
      lastName: data.lastName.trim(),
      phone: data.phone?.trim() || null,
    },
  })

  // Generate magic link token
  const token = generateToken()
  const tokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000) // 15 minutes

  // Create session with magic link token
  await db.customerSession.create({
    data: {
      token,
      tokenExpiresAt,
      clientId: client.id,
    },
  })

  // Build the magic link URL
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.groomdaycrm.com"
  const magicLink = `${baseUrl}/${slug}/portal/verify?token=${token}`

  // Send welcome email with magic link
  if (!resend) {
    console.log("Resend not configured, magic link:", magicLink)
    return { success: true }
  }

  try {
    const from = getFromEmail(organization.name, hasCustomKey)
    await resend.emails.send({
      from,
      to: email,
      subject: `Welcome to ${organization.name}!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome, ${client.firstName}!</h2>
          <p>Your account has been created at ${organization.name}. Click the button below to access your pet portal:</p>
          <p style="margin: 30px 0;">
            <a href="${magicLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Access Pet Portal
            </a>
          </p>
          <p>From your portal, you can:</p>
          <ul>
            <li>Book grooming appointments</li>
            <li>View your appointment history</li>
            <li>Manage your pet profiles</li>
          </ul>
          <p style="color: #666; font-size: 14px;">
            This link expires in 15 minutes. If you didn't create this account, you can safely ignore this email.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="color: #999; font-size: 12px;">
            ${organization.name} uses GroomDayCRM for appointment management.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error("Failed to send welcome email:", error)
    // Don't delete the client, they can request another magic link
    return { success: false, error: "Failed to send email. Please try again." }
  }

  return { success: true }
}

// Logout from portal
export async function portalLogout() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(PORTAL_SESSION_COOKIE)?.value

  if (sessionToken) {
    // Delete the session from database
    await db.customerSession.deleteMany({
      where: { sessionToken },
    })
  }

  // Clear the cookie
  cookieStore.delete(PORTAL_SESSION_COOKIE)

  return { success: true }
}
