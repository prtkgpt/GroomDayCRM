"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireOrganizationId } from "@/lib/auth"
import { appointmentSchema, type AppointmentFormData } from "@/lib/validations"
import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function getAppointments(options?: {
  startDate?: Date
  endDate?: Date
  status?: string
  clientId?: string
}) {
  const organizationId = await requireOrganizationId()

  const appointments = await db.appointment.findMany({
    where: {
      organizationId,
      ...(options?.startDate && options?.endDate && {
        dateTime: {
          gte: options.startDate,
          lte: options.endDate,
        },
      }),
      ...(options?.status && { status: options.status as any }),
      ...(options?.clientId && { clientId: options.clientId }),
    },
    include: {
      client: true,
      appointmentPets: {
        include: { pet: true },
      },
      appointmentServices: {
        include: { service: true },
      },
      payment: true,
    },
    orderBy: { dateTime: "asc" },
  })

  return appointments
}

export async function getAppointment(id: string) {
  const organizationId = await requireOrganizationId()

  const appointment = await db.appointment.findFirst({
    where: { id, organizationId },
    include: {
      client: {
        include: { pets: true },
      },
      appointmentPets: {
        include: { pet: true },
      },
      appointmentServices: {
        include: { service: true },
      },
      payment: true,
      messageLogs: {
        orderBy: { sentAt: "desc" },
      },
      feedbacks: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      feedbackRequests: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  })

  return appointment
}

export async function getTodayAppointments() {
  const organizationId = await requireOrganizationId()
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  return getAppointments({
    startDate: today,
    endDate: tomorrow,
  })
}

export async function getUpcomingAppointments(limit = 5) {
  const organizationId = await requireOrganizationId()
  const now = new Date()

  const appointments = await db.appointment.findMany({
    where: {
      organizationId,
      dateTime: { gte: now },
      status: { in: ["SCHEDULED", "CONFIRMED"] },
    },
    include: {
      client: true,
      appointmentPets: {
        include: { pet: true },
      },
      appointmentServices: {
        include: { service: true },
      },
    },
    orderBy: { dateTime: "asc" },
    take: limit,
  })

  return appointments
}

export async function getUnpaidAppointments() {
  const organizationId = await requireOrganizationId()

  const appointments = await db.appointment.findMany({
    where: {
      organizationId,
      status: "COMPLETED",
      payment: null,
    },
    include: {
      client: true,
      appointmentPets: {
        include: { pet: true },
      },
      appointmentServices: {
        include: { service: true },
      },
    },
    orderBy: { dateTime: "desc" },
  })

  return appointments
}

export async function createAppointment(data: AppointmentFormData) {
  const organizationId = await requireOrganizationId()
  const validated = appointmentSchema.parse(data)

  // Get services to calculate prices
  const services = await db.service.findMany({
    where: {
      id: { in: validated.serviceIds },
      organizationId,
    },
  })

  // Calculate total
  const subtotal = services.reduce((sum, s) => sum + s.defaultPrice, 0)
  const duration = services.reduce((sum, s) => sum + s.defaultDuration, 0)

  const appointment = await db.appointment.create({
    data: {
      dateTime: new Date(validated.dateTime),
      duration: validated.duration || duration,
      locationType: validated.locationType,
      locationAddress: validated.locationAddress || null,
      locationNotes: validated.locationNotes || null,
      notes: validated.notes || null,
      internalNotes: validated.internalNotes || null,
      subtotal: validated.subtotal || subtotal,
      totalAmount: validated.subtotal || subtotal,
      clientId: validated.clientId,
      organizationId,
      appointmentPets: {
        create: validated.petIds.map((petId) => ({ petId })),
      },
      appointmentServices: {
        create: services.map((service) => ({
          serviceId: service.id,
          price: service.defaultPrice,
          duration: service.defaultDuration,
        })),
      },
    },
    include: {
      client: true,
      appointmentPets: {
        include: { pet: true },
      },
      appointmentServices: {
        include: { service: true },
      },
    },
  })

  revalidatePath("/app")
  revalidatePath("/app/calendar")
  revalidatePath(`/app/clients/${validated.clientId}`)
  return appointment
}

export async function updateAppointmentStatus(
  id: string,
  status: "PENDING" | "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "NO_SHOW" | "CANCELED"
) {
  const organizationId = await requireOrganizationId()

  const appointment = await db.appointment.update({
    where: { id, organizationId },
    data: { status },
  })

  revalidatePath("/app")
  revalidatePath("/app/calendar")
  revalidatePath(`/app/appointments/${id}`)
  return appointment
}

export async function getPendingAppointments() {
  const organizationId = await requireOrganizationId()

  const appointments = await db.appointment.findMany({
    where: {
      organizationId,
      status: "PENDING",
    },
    include: {
      client: true,
      appointmentPets: {
        include: { pet: true },
      },
      appointmentServices: {
        include: { service: true },
      },
    },
    orderBy: { dateTime: "asc" },
  })

  return appointments
}

export async function approveBooking(id: string) {
  const organizationId = await requireOrganizationId()

  const appointment = await db.appointment.update({
    where: { id, organizationId, status: "PENDING" },
    data: { status: "CONFIRMED" },
    include: {
      client: true,
      appointmentPets: { include: { pet: true } },
      appointmentServices: { include: { service: true } },
      organization: { include: { messageTemplates: true } },
    },
  })

  // Send confirmation email to customer
  if (resend && appointment.client.email) {
    const appointmentDate = new Date(appointment.dateTime).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    const appointmentTime = new Date(appointment.dateTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"
    const petNames = appointment.appointmentPets.map((ap) => ap.pet.name).join(", ")
    const services = appointment.appointmentServices.map((as) => as.service.name).join(", ")

    try {
      // Use template if available, otherwise use default
      const template = appointment.organization.messageTemplates.find(
        (t) => t.type === "BOOKING_CONFIRMATION"
      )

      const htmlContent = template
        ? template.body
            .replace(/{{clientName}}/g, `${appointment.client.firstName} ${appointment.client.lastName}`)
            .replace(/{{petNames}}/g, petNames)
            .replace(/{{appointmentDate}}/g, appointmentDate)
            .replace(/{{appointmentTime}}/g, appointmentTime)
            .replace(/{{services}}/g, services)
            .replace(/{{location}}/g, appointment.locationAddress || "To be confirmed")
            .replace(/{{businessName}}/g, appointment.organization.name)
            .replace(/\n/g, "<br>")
        : `
          <h2>Booking Confirmed!</h2>
          <p>Hi ${appointment.client.firstName},</p>
          <p>Great news! Your grooming appointment has been confirmed.</p>

          <h3>Appointment Details</h3>
          <p><strong>Pet(s):</strong> ${petNames}</p>
          <p><strong>Service(s):</strong> ${services}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentTime}</p>
          <p><strong>Duration:</strong> ${appointment.duration} minutes</p>
          <p><strong>Total:</strong> $${appointment.totalAmount.toFixed(2)}</p>

          <p>We look forward to seeing you and ${petNames}!</p>
          <p>Best regards,<br>${appointment.organization.name}</p>
        `

      await resend.emails.send({
        from: fromEmail,
        to: appointment.client.email,
        subject: template?.subject?.replace(/{{businessName}}/g, appointment.organization.name)
          || `Appointment Confirmed - ${appointment.organization.name}`,
        html: htmlContent,
      })
    } catch (error) {
      console.error("Failed to send confirmation email:", error)
    }
  }

  revalidatePath("/app")
  revalidatePath("/app/calendar")
  revalidatePath("/app/appointments")
  return appointment
}

export async function declineBooking(id: string, reason?: string) {
  const organizationId = await requireOrganizationId()

  const appointment = await db.appointment.update({
    where: { id, organizationId, status: "PENDING" },
    data: {
      status: "CANCELED",
      internalNotes: reason ? `Declined: ${reason}` : "Declined by groomer",
    },
    include: {
      client: true,
      appointmentPets: { include: { pet: true } },
      appointmentServices: { include: { service: true } },
      organization: true,
    },
  })

  // Send decline notification to customer
  if (resend && appointment.client.email) {
    const appointmentDate = new Date(appointment.dateTime).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

    try {
      await resend.emails.send({
        from: fromEmail,
        to: appointment.client.email,
        subject: `Booking Update - ${appointment.organization.name}`,
        html: `
          <h2>Booking Update</h2>
          <p>Hi ${appointment.client.firstName},</p>
          <p>Unfortunately, we're unable to accommodate your booking request for ${appointmentDate}.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ""}
          <p>Please feel free to book another time slot that works better for both of us.</p>
          <p>We apologize for any inconvenience.</p>
          <p>Best regards,<br>${appointment.organization.name}</p>
        `,
      })
    } catch (error) {
      console.error("Failed to send decline email:", error)
    }
  }

  revalidatePath("/app")
  revalidatePath("/app/calendar")
  revalidatePath("/app/appointments")
  return appointment
}

export async function updateAppointment(id: string, data: Partial<AppointmentFormData>) {
  const organizationId = await requireOrganizationId()

  const updateData: any = {}

  if (data.dateTime) updateData.dateTime = new Date(data.dateTime)
  if (data.duration) updateData.duration = data.duration
  if (data.locationType) updateData.locationType = data.locationType
  if (data.locationAddress !== undefined) updateData.locationAddress = data.locationAddress
  if (data.locationNotes !== undefined) updateData.locationNotes = data.locationNotes
  if (data.notes !== undefined) updateData.notes = data.notes
  if (data.internalNotes !== undefined) updateData.internalNotes = data.internalNotes
  if (data.subtotal !== undefined) {
    updateData.subtotal = data.subtotal
    updateData.totalAmount = data.subtotal
  }

  const appointment = await db.appointment.update({
    where: { id, organizationId },
    data: updateData,
  })

  revalidatePath("/app")
  revalidatePath("/app/calendar")
  revalidatePath(`/app/appointments/${id}`)
  return appointment
}

export async function deleteAppointment(id: string) {
  const organizationId = await requireOrganizationId()

  await db.appointment.delete({
    where: { id, organizationId },
  })

  revalidatePath("/app")
  revalidatePath("/app/calendar")
}

export async function checkForConflicts(dateTime: Date, duration: number, excludeId?: string) {
  const organizationId = await requireOrganizationId()

  const endTime = new Date(dateTime.getTime() + duration * 60000)

  const conflicts = await db.appointment.findMany({
    where: {
      organizationId,
      id: excludeId ? { not: excludeId } : undefined,
      status: { in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"] },
      OR: [
        {
          dateTime: {
            gte: dateTime,
            lt: endTime,
          },
        },
        {
          AND: [
            { dateTime: { lte: dateTime } },
            {
              dateTime: {
                gt: new Date(dateTime.getTime() - 24 * 60 * 60000), // Within 24 hours before
              },
            },
          ],
        },
      ],
    },
    include: {
      client: true,
      appointmentPets: {
        include: { pet: true },
      },
    },
  })

  // Filter to actual conflicts (appointments that overlap)
  return conflicts.filter((appt) => {
    const apptEnd = new Date(appt.dateTime.getTime() + appt.duration * 60000)
    return appt.dateTime < endTime && apptEnd > dateTime
  })
}
