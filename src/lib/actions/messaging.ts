"use server"

import { db } from "@/lib/db"
import { requireOrganizationId } from "@/lib/auth"
import { revalidatePath } from "next/cache"
import { sendEmail } from "@/lib/email"

interface TemplateVariables {
  clientName: string
  petNames: string
  appointmentDate: string
  appointmentTime: string
  services: string
  location: string
  businessName: string
  totalAmount?: string
}

function replaceTemplateVariables(
  template: string,
  variables: TemplateVariables
): string {
  let result = template
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`{{${key}}}`, "g"), value || "")
  }
  return result
}

export async function sendAppointmentEmail(
  appointmentId: string,
  templateType: "BOOKING_CONFIRMATION" | "REMINDER_24H" | "ON_MY_WAY" | "THANK_YOU"
) {
  const organizationId = await requireOrganizationId()

  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, organizationId },
    include: {
      client: true,
      appointmentPets: { include: { pet: true } },
      appointmentServices: { include: { service: true } },
      organization: {
        include: { messageTemplates: true },
      },
    },
  })

  if (!appointment) {
    throw new Error("Appointment not found")
  }

  if (!appointment.client.email) {
    throw new Error("Client has no email address")
  }

  const template = appointment.organization.messageTemplates.find(
    (t) => t.type === templateType
  )

  if (!template) {
    throw new Error("Template not found")
  }

  const variables: TemplateVariables = {
    clientName: `${appointment.client.firstName} ${appointment.client.lastName}`,
    petNames: appointment.appointmentPets.map((ap) => ap.pet.name).join(", "),
    appointmentDate: new Date(appointment.dateTime).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
    appointmentTime: new Date(appointment.dateTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    }),
    services: appointment.appointmentServices
      .map((as) => as.service.name)
      .join(", "),
    location:
      appointment.locationAddress || appointment.organization.address || "TBD",
    businessName: appointment.organization.name,
    totalAmount: `$${appointment.totalAmount.toFixed(2)}`,
  }

  const subject = replaceTemplateVariables(template.subject || "", variables)
  const body = replaceTemplateVariables(template.body, variables)

  // Send email via centralized email service (uses org's Resend key if available)
  const emailResult = await sendEmail({
    organizationId,
    to: appointment.client.email,
    subject: subject || `Message from ${appointment.organization.name}`,
    text: body,
  })

  const providerId = emailResult.id || null
  const status: "SENT" | "FAILED" = emailResult.success ? "SENT" : "FAILED"

  // Log the message
  const messageLog = await db.messageLog.create({
    data: {
      type: "EMAIL",
      recipient: appointment.client.email,
      subject,
      body,
      status,
      providerId,
      appointmentId,
      organizationId,
    },
  })

  revalidatePath(`/app/appointments/${appointmentId}`)
  return { success: status === "SENT", messageLog }
}

export async function getOnMyWayText(appointmentId: string) {
  const organizationId = await requireOrganizationId()

  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, organizationId },
    include: {
      client: true,
      appointmentPets: { include: { pet: true } },
      organization: {
        include: { messageTemplates: true },
      },
    },
  })

  if (!appointment) {
    throw new Error("Appointment not found")
  }

  const template = appointment.organization.messageTemplates.find(
    (t) => t.type === "ON_MY_WAY"
  )

  if (!template) {
    return `Hi ${appointment.client.firstName}, I'm on my way to groom ${appointment.appointmentPets.map((ap) => ap.pet.name).join(" and ")}! See you soon!`
  }

  const variables: TemplateVariables = {
    clientName: `${appointment.client.firstName}`,
    petNames: appointment.appointmentPets.map((ap) => ap.pet.name).join(" and "),
    appointmentDate: "",
    appointmentTime: "",
    services: "",
    location: "",
    businessName: appointment.organization.name,
  }

  return replaceTemplateVariables(template.body, variables)
}

export async function logSmsMessage(
  appointmentId: string,
  recipient: string,
  body: string
) {
  const organizationId = await requireOrganizationId()

  const messageLog = await db.messageLog.create({
    data: {
      type: "SMS",
      recipient,
      body,
      status: "SENT",
      appointmentId,
      organizationId,
    },
  })

  revalidatePath(`/app/appointments/${appointmentId}`)
  return messageLog
}
