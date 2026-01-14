"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireOrganizationId } from "@/lib/auth"
import { sendEmail } from "@/lib/email"

// Generate a random token
function generateToken(): string {
  const array = new Uint8Array(32)
  crypto.getRandomValues(array)
  return Array.from(array, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

// Send feedback request email after appointment
export async function sendFeedbackRequest(appointmentId: string) {
  const organizationId = await requireOrganizationId()

  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, organizationId },
    include: {
      client: true,
      appointmentPets: { include: { pet: true } },
      organization: true,
    },
  })

  if (!appointment) {
    throw new Error("Appointment not found")
  }

  if (!appointment.client.email) {
    throw new Error("Client has no email address")
  }

  // Check if feedback request already sent for this appointment
  const existingRequest = await db.feedbackRequest.findFirst({
    where: { appointmentId },
  })

  if (existingRequest && !existingRequest.usedAt) {
    // Resend the existing request
    const token = existingRequest.token
    await sendFeedbackEmail(appointment, token)
    return { success: true, message: "Feedback request resent" }
  }

  // Create new feedback request
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  await db.feedbackRequest.create({
    data: {
      token,
      expiresAt,
      appointmentId,
      clientId: appointment.clientId,
      organizationId,
    },
  })

  await sendFeedbackEmail(appointment, token)

  // Log the message
  await db.messageLog.create({
    data: {
      type: "EMAIL",
      recipient: appointment.client.email,
      subject: `How was your visit to ${appointment.organization.name}?`,
      body: "Feedback request email",
      status: "SENT",
      appointmentId,
      organizationId,
    },
  })

  revalidatePath(`/app/appointments/${appointmentId}`)
  return { success: true }
}

async function sendFeedbackEmail(
  appointment: {
    id: string
    client: { email: string | null; firstName: string }
    appointmentPets: { pet: { name: string } }[]
    organization: { id: string; name: string; slug: string; googleReviewUrl: string | null; yelpUrl: string | null }
  },
  token: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.groomdaycrm.com"
  const feedbackUrl = `${baseUrl}/${appointment.organization.slug}/feedback?token=${token}`

  const petNames = appointment.appointmentPets.map((ap) => ap.pet.name).join(" and ")
  const hasExternalReviews = appointment.organization.googleReviewUrl || appointment.organization.yelpUrl

  await sendEmail({
    organizationId: appointment.organization.id,
    to: appointment.client.email!,
    subject: `How was your visit to ${appointment.organization.name}?`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Hi ${appointment.client.firstName}!</h2>
        <p>Thank you for bringing ${petNames} to ${appointment.organization.name}! We hope you both had a great experience.</p>

        <p>We'd love to hear your feedback:</p>

        <p style="margin: 30px 0;">
          <a href="${feedbackUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Leave Feedback
          </a>
        </p>

        ${hasExternalReviews ? `
        <p style="color: #666;">
          If you had a great experience, we'd also appreciate a review on:
          ${appointment.organization.googleReviewUrl ? `<a href="${appointment.organization.googleReviewUrl}" style="color: #2563eb;">Google</a>` : ''}
          ${appointment.organization.googleReviewUrl && appointment.organization.yelpUrl ? ' or ' : ''}
          ${appointment.organization.yelpUrl ? `<a href="${appointment.organization.yelpUrl}" style="color: #2563eb;">Yelp</a>` : ''}
        </p>
        ` : ''}

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        <p style="color: #999; font-size: 12px;">
          This link expires in 7 days.
        </p>
      </div>
    `,
  })
}

// Submit feedback via token
export async function submitFeedback(
  token: string,
  data: { rating: number; comment?: string }
) {
  const request = await db.feedbackRequest.findUnique({
    where: { token },
    include: {
      client: true,
      organization: true,
      appointment: true,
    },
  })

  if (!request) {
    return { success: false, error: "Invalid feedback link" }
  }

  if (request.usedAt) {
    return { success: false, error: "Feedback already submitted" }
  }

  if (request.expiresAt < new Date()) {
    return { success: false, error: "This feedback link has expired" }
  }

  // Create feedback
  await db.feedback.create({
    data: {
      rating: data.rating,
      comment: data.comment || null,
      appointmentId: request.appointmentId,
      clientId: request.clientId,
      organizationId: request.organizationId,
      isPublic: data.rating >= 4, // Auto-public for good reviews
      isApproved: false, // Requires owner approval
    },
  })

  // Mark request as used
  await db.feedbackRequest.update({
    where: { id: request.id },
    data: { usedAt: new Date() },
  })

  return {
    success: true,
    organization: request.organization,
    rating: data.rating,
  }
}

// Get feedback request details
export async function getFeedbackRequest(token: string) {
  const request = await db.feedbackRequest.findUnique({
    where: { token },
    include: {
      client: { select: { firstName: true } },
      organization: {
        select: {
          name: true,
          slug: true,
          theme: true,
          googleReviewUrl: true,
          yelpUrl: true,
        },
      },
      appointment: {
        include: {
          appointmentPets: { include: { pet: { select: { name: true } } } },
        },
      },
    },
  })

  if (!request) {
    return null
  }

  return {
    isExpired: request.expiresAt < new Date(),
    isUsed: !!request.usedAt,
    client: request.client,
    organization: request.organization,
    petNames: request.appointment.appointmentPets.map((ap) => ap.pet.name),
  }
}

// Get all feedback for organization (admin)
export async function getOrganizationFeedback() {
  const organizationId = await requireOrganizationId()

  const feedback = await db.feedback.findMany({
    where: { organizationId },
    include: {
      client: { select: { firstName: true, lastName: true } },
      appointment: {
        include: {
          appointmentPets: { include: { pet: { select: { name: true } } } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return feedback
}

// Toggle feedback approval
export async function toggleFeedbackApproval(feedbackId: string) {
  const organizationId = await requireOrganizationId()

  const feedback = await db.feedback.findFirst({
    where: { id: feedbackId, organizationId },
  })

  if (!feedback) {
    throw new Error("Feedback not found")
  }

  await db.feedback.update({
    where: { id: feedbackId },
    data: { isApproved: !feedback.isApproved },
  })

  revalidatePath("/app/reviews")
  return { success: true }
}

// Toggle feedback public visibility
export async function toggleFeedbackPublic(feedbackId: string) {
  const organizationId = await requireOrganizationId()

  const feedback = await db.feedback.findFirst({
    where: { id: feedbackId, organizationId },
  })

  if (!feedback) {
    throw new Error("Feedback not found")
  }

  await db.feedback.update({
    where: { id: feedbackId },
    data: { isPublic: !feedback.isPublic },
  })

  revalidatePath("/app/reviews")
  return { success: true }
}

// Get public approved feedback for landing page
export async function getPublicFeedback(slug: string) {
  const organization = await db.organization.findUnique({
    where: { slug },
    select: { id: true },
  })

  if (!organization) {
    return []
  }

  const feedback = await db.feedback.findMany({
    where: {
      organizationId: organization.id,
      isPublic: true,
      isApproved: true,
    },
    include: {
      client: { select: { firstName: true, lastName: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  })

  return feedback
}

// Get feedback stats for organization
export async function getFeedbackStats() {
  const organizationId = await requireOrganizationId()

  const [total, avgRating, distribution] = await Promise.all([
    db.feedback.count({ where: { organizationId } }),
    db.feedback.aggregate({
      where: { organizationId },
      _avg: { rating: true },
    }),
    db.feedback.groupBy({
      by: ["rating"],
      where: { organizationId },
      _count: true,
    }),
  ])

  return {
    total,
    avgRating: avgRating._avg.rating || 0,
    distribution: distribution.reduce(
      (acc, d) => ({ ...acc, [d.rating]: d._count }),
      { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    ),
  }
}
