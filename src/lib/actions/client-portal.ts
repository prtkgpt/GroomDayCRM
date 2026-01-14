"use server"

import { cookies } from "next/headers"
import { db } from "@/lib/db"
import { addHours, addDays } from "date-fns"
import crypto from "crypto"

const PORTAL_SESSION_COOKIE = "portal_session"
const SESSION_DURATION_DAYS = 30
const TOKEN_EXPIRY_HOURS = 1

// Generate a secure random token
function generateToken(): string {
  return crypto.randomBytes(32).toString("hex")
}

// Request a magic link login
export async function requestPortalAccess(
  organizationId: string,
  email: string
) {
  // Find client by email
  const client = await db.client.findFirst({
    where: {
      organizationId,
      email: email.toLowerCase().trim(),
    },
  })

  if (!client) {
    // Don't reveal if email exists or not for security
    return { success: true, message: "If an account exists, you will receive a login link." }
  }

  // Generate magic link token
  const token = generateToken()
  const tokenExpiresAt = addHours(new Date(), TOKEN_EXPIRY_HOURS)

  // Create or update session
  const existingSession = await db.customerSession.findFirst({
    where: { clientId: client.id },
  })

  if (existingSession) {
    await db.customerSession.update({
      where: { id: existingSession.id },
      data: {
        token,
        tokenExpiresAt,
        sessionToken: null,
        sessionExpiresAt: null,
      },
    })
  } else {
    await db.customerSession.create({
      data: {
        clientId: client.id,
        token,
        tokenExpiresAt,
      },
    })
  }

  // In production, send email with magic link
  // For now, we'll return the token for testing
  console.log(`Magic link token for ${email}: ${token}`)

  return {
    success: true,
    message: "If an account exists, you will receive a login link.",
    // Remove this in production - only for development
    _devToken: process.env.NODE_ENV === "development" ? token : undefined,
  }
}

// Verify magic link token and create session
export async function verifyPortalToken(
  organizationId: string,
  token: string
) {
  const session = await db.customerSession.findFirst({
    where: {
      token,
      tokenExpiresAt: { gt: new Date() },
      client: { organizationId },
    },
    include: {
      client: true,
    },
  })

  if (!session) {
    return { success: false, error: "Invalid or expired link" }
  }

  // Generate session token
  const sessionToken = generateToken()
  const sessionExpiresAt = addDays(new Date(), SESSION_DURATION_DAYS)

  // Update session with new session token
  await db.customerSession.update({
    where: { id: session.id },
    data: {
      token: generateToken(), // Invalidate old token
      sessionToken,
      sessionExpiresAt,
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
    clientId: session.clientId,
  }
}

// Get current portal session
export async function getPortalSession(organizationId: string) {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(PORTAL_SESSION_COOKIE)?.value

  if (!sessionToken) {
    return null
  }

  const session = await db.customerSession.findFirst({
    where: {
      sessionToken,
      sessionExpiresAt: { gt: new Date() },
      client: { organizationId },
    },
    include: {
      client: {
        include: {
          pets: true,
        },
      },
    },
  })

  return session?.client || null
}

// Logout from portal
export async function logoutPortal() {
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get(PORTAL_SESSION_COOKIE)?.value

  if (sessionToken) {
    await db.customerSession.updateMany({
      where: { sessionToken },
      data: {
        sessionToken: null,
        sessionExpiresAt: null,
      },
    })
  }

  cookieStore.delete(PORTAL_SESSION_COOKIE)
  return { success: true }
}

// Get client's upcoming appointments
export async function getClientUpcomingAppointments(clientId: string) {
  return db.appointment.findMany({
    where: {
      clientId,
      dateTime: { gte: new Date() },
      status: { notIn: ["CANCELED", "NO_SHOW"] },
    },
    include: {
      appointmentPets: {
        include: { pet: true },
      },
      appointmentServices: {
        include: { service: true },
      },
      staff: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          photoUrl: true,
        },
      },
    },
    orderBy: { dateTime: "asc" },
    take: 10,
  })
}

// Get client's past appointments
export async function getClientPastAppointments(clientId: string, page = 1, limit = 10) {
  const skip = (page - 1) * limit

  const [appointments, total] = await Promise.all([
    db.appointment.findMany({
      where: {
        clientId,
        dateTime: { lt: new Date() },
      },
      include: {
        appointmentPets: {
          include: { pet: true },
        },
        appointmentServices: {
          include: { service: true },
        },
        staff: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
        payment: true,
      },
      orderBy: { dateTime: "desc" },
      skip,
      take: limit,
    }),
    db.appointment.count({
      where: {
        clientId,
        dateTime: { lt: new Date() },
      },
    }),
  ])

  return {
    appointments,
    total,
    pages: Math.ceil(total / limit),
    page,
  }
}

// Get client's pets
export async function getClientPetsPortal(clientId: string) {
  return db.pet.findMany({
    where: { clientId },
    include: {
      appointmentPets: {
        include: {
          appointment: {
            select: {
              id: true,
              dateTime: true,
              status: true,
            },
          },
        },
        orderBy: { appointment: { dateTime: "desc" } },
        take: 1,
      },
      _count: {
        select: {
          appointmentPets: true,
        },
      },
    },
    orderBy: { name: "asc" },
  })
}

// Cancel an appointment (if within cancellation window)
export async function cancelAppointment(
  clientId: string,
  appointmentId: string
) {
  const appointment = await db.appointment.findFirst({
    where: {
      id: appointmentId,
      clientId,
      status: { in: ["PENDING", "SCHEDULED", "CONFIRMED"] },
      dateTime: { gt: addHours(new Date(), 24) }, // Must be at least 24h away
    },
  })

  if (!appointment) {
    return {
      success: false,
      error: "Cannot cancel this appointment. It may be too close to the scheduled time.",
    }
  }

  await db.appointment.update({
    where: { id: appointmentId },
    data: { status: "CANCELED" },
  })

  return { success: true }
}
