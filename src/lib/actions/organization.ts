"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireOrganizationId, getUser } from "@/lib/auth"
import { organizationSchema, type OrganizationFormData } from "@/lib/validations"

export async function getOrganization() {
  const organizationId = await requireOrganizationId()

  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    include: {
      messageTemplates: true,
    },
  })

  return organization
}

export async function updateOrganization(data: OrganizationFormData) {
  const organizationId = await requireOrganizationId()
  const validated = organizationSchema.parse(data)

  // Check if slug is already taken by another organization
  const existingSlug = await db.organization.findFirst({
    where: {
      slug: validated.slug,
      id: { not: organizationId },
    },
  })

  if (existingSlug) {
    throw new Error("This booking URL is already taken. Please choose another.")
  }

  const organization = await db.organization.update({
    where: { id: organizationId },
    data: {
      name: validated.name,
      slug: validated.slug,
      description: validated.description || null,
      email: validated.email || null,
      phone: validated.phone || null,
      address: validated.address || null,
      city: validated.city || null,
      state: validated.state || null,
      zipCode: validated.zipCode || null,
      timezone: validated.timezone,
      businessHoursStart: validated.businessHoursStart,
      businessHoursEnd: validated.businessHoursEnd,
      appointmentBuffer: validated.appointmentBuffer,
    },
  })

  revalidatePath("/app/settings")
  return organization
}

export async function getMessageTemplates() {
  const organizationId = await requireOrganizationId()

  const templates = await db.messageTemplate.findMany({
    where: { organizationId },
    orderBy: { type: "asc" },
  })

  return templates
}

export async function updateMessageTemplate(
  id: string,
  data: { subject?: string; body: string }
) {
  const organizationId = await requireOrganizationId()

  const template = await db.messageTemplate.update({
    where: { id, organizationId },
    data: {
      subject: data.subject || null,
      body: data.body,
    },
  })

  revalidatePath("/app/settings")
  return template
}

export async function getDashboardStats() {
  const organizationId = await requireOrganizationId()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const thisWeekStart = new Date(today)
  thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay())
  const thisWeekEnd = new Date(thisWeekStart)
  thisWeekEnd.setDate(thisWeekEnd.getDate() + 7)

  const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1)
  const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0)

  const [
    todayAppointments,
    weekAppointments,
    unpaidCount,
    totalClients,
    totalPets,
    monthlyRevenue,
  ] = await Promise.all([
    db.appointment.count({
      where: {
        organizationId,
        dateTime: { gte: today, lt: tomorrow },
        status: { notIn: ["CANCELED"] },
      },
    }),
    db.appointment.count({
      where: {
        organizationId,
        dateTime: { gte: thisWeekStart, lt: thisWeekEnd },
        status: { notIn: ["CANCELED"] },
      },
    }),
    db.appointment.count({
      where: {
        organizationId,
        status: "COMPLETED",
        payment: null,
      },
    }),
    db.client.count({ where: { organizationId } }),
    db.pet.count({ where: { client: { organizationId } } }),
    db.payment.aggregate({
      where: {
        status: "PAID",
        paidAt: { gte: thisMonthStart, lte: thisMonthEnd },
        appointment: { organizationId },
      },
      _sum: { totalAmount: true },
    }),
  ])

  return {
    todayAppointments,
    weekAppointments,
    unpaidCount,
    totalClients,
    totalPets,
    monthlyRevenue: monthlyRevenue._sum.totalAmount || 0,
  }
}
