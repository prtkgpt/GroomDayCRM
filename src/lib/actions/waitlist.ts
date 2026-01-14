"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getUser, requireOrganizationId } from "@/lib/auth"
import { addHours, addDays, isWithinInterval, startOfDay, endOfDay } from "date-fns"

// ============================================
// WAITLIST ENTRIES
// ============================================

export async function getWaitlistEntries(filters?: {
  status?: string
  urgency?: string
  clientId?: string
}) {
  const organizationId = await requireOrganizationId()

  const where: Record<string, unknown> = {
    organizationId,
    status: filters?.status || "ACTIVE",
  }

  if (filters?.urgency) {
    where.urgency = filters.urgency
  }
  if (filters?.clientId) {
    where.clientId = filters.clientId
  }

  return db.waitlistEntry.findMany({
    where,
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      pets: {
        include: {
          pet: {
            select: { id: true, name: true, species: true, breed: true },
          },
        },
      },
      services: {
        include: {
          service: {
            select: { id: true, name: true, defaultDuration: true, defaultPrice: true },
          },
        },
      },
      preferredStaff: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: [
      { urgency: "desc" },
      { createdAt: "asc" },
    ],
  })
}

export async function getWaitlistEntry(id: string) {
  const organizationId = await requireOrganizationId()

  return db.waitlistEntry.findFirst({
    where: { id, organizationId },
    include: {
      client: true,
      pets: { include: { pet: true } },
      services: { include: { service: true } },
      preferredStaff: true,
    },
  })
}

export async function createWaitlistEntry(data: {
  clientId: string
  petIds: string[]
  serviceIds: string[]
  preferredDate?: Date
  preferredDayOfWeek?: number[]
  preferredTimeStart?: string
  preferredTimeEnd?: string
  isFlexibleDate?: boolean
  isFlexibleTime?: boolean
  preferredStaffId?: string
  urgency?: "LOW" | "NORMAL" | "HIGH" | "URGENT"
  notes?: string
}) {
  const organizationId = await requireOrganizationId()

  const entry = await db.waitlistEntry.create({
    data: {
      clientId: data.clientId,
      preferredDate: data.preferredDate,
      preferredDayOfWeek: data.preferredDayOfWeek || [],
      preferredTimeStart: data.preferredTimeStart,
      preferredTimeEnd: data.preferredTimeEnd,
      isFlexibleDate: data.isFlexibleDate ?? false,
      isFlexibleTime: data.isFlexibleTime ?? false,
      preferredStaffId: data.preferredStaffId,
      urgency: data.urgency || "NORMAL",
      notes: data.notes,
      organizationId,
      pets: {
        create: data.petIds.map((petId) => ({ petId })),
      },
      services: {
        create: data.serviceIds.map((serviceId) => ({ serviceId })),
      },
    },
    include: {
      client: true,
      pets: { include: { pet: true } },
      services: { include: { service: true } },
    },
  })

  revalidatePath("/app/waitlist")
  return entry
}

export async function updateWaitlistEntry(
  id: string,
  data: {
    preferredDate?: Date
    preferredDayOfWeek?: number[]
    preferredTimeStart?: string
    preferredTimeEnd?: string
    isFlexibleDate?: boolean
    isFlexibleTime?: boolean
    preferredStaffId?: string | null
    urgency?: "LOW" | "NORMAL" | "HIGH" | "URGENT"
    notes?: string
    status?: "ACTIVE" | "NOTIFIED" | "BOOKED" | "EXPIRED" | "CANCELLED"
  }
) {
  const organizationId = await requireOrganizationId()

  const entry = await db.waitlistEntry.update({
    where: { id },
    data,
  })

  revalidatePath("/app/waitlist")
  return entry
}

export async function deleteWaitlistEntry(id: string) {
  const organizationId = await requireOrganizationId()

  await db.waitlistEntry.delete({
    where: { id },
  })

  revalidatePath("/app/waitlist")
  return { success: true }
}

// Cancel a waitlist entry
export async function cancelWaitlistEntry(id: string) {
  const organizationId = await requireOrganizationId()

  const entry = await db.waitlistEntry.update({
    where: { id },
    data: { status: "CANCELLED" },
  })

  revalidatePath("/app/waitlist")
  return entry
}

// ============================================
// MATCHING & NOTIFICATIONS
// ============================================

// Find waitlist entries that match a cancelled slot
export async function findMatchingWaitlistEntries(
  cancelledDate: Date,
  duration: number,
  staffId?: string
) {
  const organizationId = await requireOrganizationId()
  const dayOfWeek = cancelledDate.getDay()
  const timeString = cancelledDate.toTimeString().slice(0, 5) // HH:MM

  // Find active waitlist entries that could fit this slot
  const entries = await db.waitlistEntry.findMany({
    where: {
      organizationId,
      status: "ACTIVE",
      OR: [
        // Flexible on everything
        { isFlexibleDate: true, isFlexibleTime: true },
        // Matches specific date
        {
          preferredDate: {
            gte: startOfDay(cancelledDate),
            lte: endOfDay(cancelledDate),
          },
        },
        // Matches day of week
        { preferredDayOfWeek: { has: dayOfWeek } },
      ],
    },
    include: {
      client: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      pets: {
        include: { pet: { select: { id: true, name: true } } },
      },
      services: {
        include: {
          service: { select: { id: true, name: true, defaultDuration: true } },
        },
      },
      preferredStaff: {
        select: { id: true, firstName: true, lastName: true },
      },
    },
    orderBy: [
      { urgency: "desc" },
      { createdAt: "asc" },
    ],
  })

  // Filter by time preference and staff preference
  return entries.filter((entry) => {
    // Check time preference
    if (!entry.isFlexibleTime && entry.preferredTimeStart && entry.preferredTimeEnd) {
      if (timeString < entry.preferredTimeStart || timeString > entry.preferredTimeEnd) {
        return false
      }
    }

    // Check staff preference
    if (entry.preferredStaffId && staffId && entry.preferredStaffId !== staffId) {
      return false
    }

    // Check if services would fit in the slot
    const totalDuration = entry.services.reduce(
      (sum, s) => sum + s.service.defaultDuration,
      0
    )
    if (totalDuration > duration + 15) {
      // Allow some buffer
      return false
    }

    return true
  })
}

// Notify waitlist client about available slot
export async function notifyWaitlistClient(
  entryId: string,
  slotDate: Date,
  expiresInHours: number = 24
) {
  const organizationId = await requireOrganizationId()

  const entry = await db.waitlistEntry.findFirst({
    where: { id: entryId, organizationId },
    include: {
      client: true,
      pets: { include: { pet: true } },
      services: { include: { service: true } },
      organization: true,
    },
  })

  if (!entry) throw new Error("Waitlist entry not found")

  const respondByDate = addHours(new Date(), expiresInHours)

  // Update entry status
  await db.waitlistEntry.update({
    where: { id: entryId },
    data: {
      status: "NOTIFIED",
      notifiedAt: new Date(),
      notificationCount: { increment: 1 },
      offeredSlotDate: slotDate,
      respondByDate,
    },
  })

  // In production, send email/SMS notification here
  // For now, log it
  console.log(`[WAITLIST] Notifying ${entry.client.email} about slot on ${slotDate}`)

  revalidatePath("/app/waitlist")
  return { success: true, respondByDate }
}

// Convert waitlist entry to appointment
export async function convertWaitlistToAppointment(
  entryId: string,
  appointmentDate: Date,
  staffId?: string
) {
  const organizationId = await requireOrganizationId()

  const entry = await db.waitlistEntry.findFirst({
    where: { id: entryId, organizationId },
    include: {
      pets: { include: { pet: true } },
      services: { include: { service: true } },
    },
  })

  if (!entry) throw new Error("Waitlist entry not found")

  // Calculate duration and total
  const totalDuration = entry.services.reduce(
    (sum, s) => sum + s.service.defaultDuration,
    0
  )
  const totalAmount = entry.services.reduce(
    (sum, s) => sum + s.service.defaultPrice,
    0
  )

  // Create the appointment
  const appointment = await db.appointment.create({
    data: {
      dateTime: appointmentDate,
      duration: totalDuration,
      status: "SCHEDULED",
      subtotal: totalAmount,
      totalAmount: totalAmount,
      clientId: entry.clientId,
      staffId: staffId || entry.preferredStaffId,
      organizationId,
      appointmentPets: {
        create: entry.pets.map((p) => ({ petId: p.petId })),
      },
      appointmentServices: {
        create: entry.services.map((s) => ({
          serviceId: s.serviceId,
          price: s.service.defaultPrice,
          duration: s.service.defaultDuration,
        })),
      },
    },
  })

  // Update waitlist entry status
  await db.waitlistEntry.update({
    where: { id: entryId },
    data: { status: "BOOKED" },
  })

  revalidatePath("/app/waitlist")
  revalidatePath("/app/calendar")
  return appointment
}

// ============================================
// STATS & HELPERS
// ============================================

export async function getWaitlistStats() {
  const organizationId = await requireOrganizationId()

  const [
    activeCount,
    notifiedCount,
    urgentCount,
    bookedThisWeek,
  ] = await Promise.all([
    db.waitlistEntry.count({
      where: { organizationId, status: "ACTIVE" },
    }),
    db.waitlistEntry.count({
      where: { organizationId, status: "NOTIFIED" },
    }),
    db.waitlistEntry.count({
      where: { organizationId, status: "ACTIVE", urgency: "URGENT" },
    }),
    db.waitlistEntry.count({
      where: {
        organizationId,
        status: "BOOKED",
        updatedAt: { gte: addDays(new Date(), -7) },
      },
    }),
  ])

  return {
    activeCount,
    notifiedCount,
    urgentCount,
    bookedThisWeek,
  }
}

// Expire old notifications that weren't responded to
export async function expireOldNotifications() {
  const organizationId = await requireOrganizationId()

  const expired = await db.waitlistEntry.updateMany({
    where: {
      organizationId,
      status: "NOTIFIED",
      respondByDate: { lt: new Date() },
    },
    data: {
      status: "ACTIVE", // Back to active so they can be notified again
      offeredSlotDate: null,
      respondByDate: null,
    },
  })

  revalidatePath("/app/waitlist")
  return { expiredCount: expired.count }
}

// ============================================
// PUBLIC WAITLIST (for booking portal)
// ============================================

export async function addToPublicWaitlist(data: {
  organizationId: string
  clientEmail: string
  clientFirstName: string
  clientLastName: string
  clientPhone?: string
  petName: string
  petSpecies: string
  petBreed?: string
  serviceIds: string[]
  preferredDate?: Date
  preferredDayOfWeek?: number[]
  preferredTimeStart?: string
  preferredTimeEnd?: string
  isFlexibleDate?: boolean
  isFlexibleTime?: boolean
  notes?: string
}) {
  // Find or create client
  let client = await db.client.findFirst({
    where: {
      organizationId: data.organizationId,
      email: data.clientEmail.toLowerCase(),
    },
  })

  if (!client) {
    client = await db.client.create({
      data: {
        firstName: data.clientFirstName,
        lastName: data.clientLastName,
        email: data.clientEmail.toLowerCase(),
        phone: data.clientPhone,
        organizationId: data.organizationId,
      },
    })
  }

  // Find or create pet
  let pet = await db.pet.findFirst({
    where: {
      clientId: client.id,
      name: data.petName,
    },
  })

  if (!pet) {
    pet = await db.pet.create({
      data: {
        name: data.petName,
        species: data.petSpecies,
        breed: data.petBreed,
        clientId: client.id,
      },
    })
  }

  // Create waitlist entry
  const entry = await db.waitlistEntry.create({
    data: {
      clientId: client.id,
      preferredDate: data.preferredDate,
      preferredDayOfWeek: data.preferredDayOfWeek || [],
      preferredTimeStart: data.preferredTimeStart,
      preferredTimeEnd: data.preferredTimeEnd,
      isFlexibleDate: data.isFlexibleDate ?? false,
      isFlexibleTime: data.isFlexibleTime ?? false,
      notes: data.notes,
      organizationId: data.organizationId,
      pets: {
        create: [{ petId: pet.id }],
      },
      services: {
        create: data.serviceIds.map((serviceId) => ({ serviceId })),
      },
    },
  })

  return { success: true, entryId: entry.id }
}
