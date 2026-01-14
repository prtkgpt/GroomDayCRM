"use server"

import { db } from "@/lib/db"
import { addDays, addHours, format, parse, setHours, setMinutes, startOfDay, isBefore, isAfter, addMinutes } from "date-fns"

// Get organization by slug for public booking page
export async function getOrganizationBySlug(slug: string) {
  return db.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      theme: true,
      logoUrl: true,
      email: true,
      phone: true,
      address: true,
      city: true,
      state: true,
      zipCode: true,
      timezone: true,
      businessHoursStart: true,
      businessHoursEnd: true,
      appointmentBuffer: true,
      bookingEnabled: true,
      bookingLeadTime: true,
      bookingMaxDaysAhead: true,
      bookingRequiresApproval: true,
    },
  })
}

// Get active services for the organization
export async function getPublicServices(organizationId: string) {
  return db.service.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    orderBy: [
      { isAddOn: "asc" },
      { sortOrder: "asc" },
      { name: "asc" },
    ],
    select: {
      id: true,
      name: true,
      description: true,
      defaultPrice: true,
      defaultDuration: true,
      isAddOn: true,
    },
  })
}

// Get available time slots for a given date
export async function getAvailableSlots(
  organizationId: string,
  date: Date,
  duration: number // total duration in minutes
) {
  const org = await db.organization.findUnique({
    where: { id: organizationId },
    select: {
      businessHoursStart: true,
      businessHoursEnd: true,
      appointmentBuffer: true,
      bookingLeadTime: true,
    },
  })

  if (!org) return []

  const dayStart = startOfDay(date)
  const dayEnd = addDays(dayStart, 1)

  // Get existing appointments for this day
  const existingAppointments = await db.appointment.findMany({
    where: {
      organizationId,
      dateTime: {
        gte: dayStart,
        lt: dayEnd,
      },
      status: {
        notIn: ["CANCELED", "NO_SHOW"],
      },
    },
    select: {
      dateTime: true,
      duration: true,
    },
    orderBy: { dateTime: "asc" },
  })

  // Parse business hours
  const [startHour, startMin] = org.businessHoursStart.split(":").map(Number)
  const [endHour, endMin] = org.businessHoursEnd.split(":").map(Number)

  const businessStart = setMinutes(setHours(dayStart, startHour), startMin)
  const businessEnd = setMinutes(setHours(dayStart, endHour), endMin)

  // Calculate minimum booking time (current time + lead time)
  const minBookingTime = addHours(new Date(), org.bookingLeadTime)

  // Generate all possible slots (every 30 minutes)
  const slots: { time: string; available: boolean }[] = []
  let currentSlot = businessStart

  while (isBefore(currentSlot, businessEnd)) {
    // Check if slot end time is within business hours
    const slotEnd = addMinutes(currentSlot, duration + org.appointmentBuffer)

    if (isAfter(slotEnd, businessEnd)) {
      break
    }

    // Check if slot is in the past or before lead time
    const isPastLeadTime = isAfter(currentSlot, minBookingTime)

    // Check if slot conflicts with existing appointments
    const hasConflict = existingAppointments.some((appt) => {
      const apptStart = new Date(appt.dateTime)
      const apptEnd = addMinutes(apptStart, appt.duration + org.appointmentBuffer)

      // Check for overlap
      return (
        (isBefore(currentSlot, apptEnd) && isAfter(addMinutes(currentSlot, duration), apptStart))
      )
    })

    slots.push({
      time: format(currentSlot, "HH:mm"),
      available: isPastLeadTime && !hasConflict,
    })

    // Move to next slot (30-minute intervals)
    currentSlot = addMinutes(currentSlot, 30)
  }

  return slots
}

// Find or create a client
async function findOrCreateClient(
  organizationId: string,
  data: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
) {
  // Try to find existing client by email or phone
  let client = await db.client.findFirst({
    where: {
      organizationId,
      OR: [
        { email: data.email },
        { phone: data.phone },
      ],
    },
    include: {
      pets: true,
    },
  })

  if (client) {
    // Update client info if needed
    client = await db.client.update({
      where: { id: client.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      },
      include: {
        pets: true,
      },
    })
  } else {
    // Create new client
    client = await db.client.create({
      data: {
        organizationId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
      },
      include: {
        pets: true,
      },
    })
  }

  return client
}

// Create or update a pet
async function createOrUpdatePet(
  clientId: string,
  data: {
    id?: string
    name: string
    species: string
    breed?: string
    weight?: number
    notes?: string
  }
) {
  if (data.id) {
    // Update existing pet
    return db.pet.update({
      where: { id: data.id },
      data: {
        name: data.name,
        species: data.species,
        breed: data.breed,
        weight: data.weight,
        behaviorNotes: data.notes,
      },
    })
  } else {
    // Create new pet
    return db.pet.create({
      data: {
        clientId,
        name: data.name,
        species: data.species,
        breed: data.breed,
        weight: data.weight,
        behaviorNotes: data.notes,
      },
    })
  }
}

// Submit a booking
export async function submitBooking(data: {
  organizationId: string
  services: string[] // service IDs
  date: string // YYYY-MM-DD
  time: string // HH:mm
  client: {
    firstName: string
    lastName: string
    email: string
    phone: string
  }
  pet: {
    id?: string
    name: string
    species: string
    breed?: string
    weight?: number
    notes?: string
  }
  notes?: string
}) {
  const org = await db.organization.findUnique({
    where: { id: data.organizationId },
    select: {
      bookingRequiresApproval: true,
    },
  })

  if (!org) {
    return { success: false, error: "Organization not found" }
  }

  // Get services
  const services = await db.service.findMany({
    where: {
      id: { in: data.services },
      organizationId: data.organizationId,
    },
  })

  if (services.length === 0) {
    return { success: false, error: "No valid services selected" }
  }

  // Calculate totals
  const totalDuration = services.reduce((sum, s) => sum + s.defaultDuration, 0)
  const subtotal = services.reduce((sum, s) => sum + s.defaultPrice, 0)

  // Parse date and time
  const dateTime = parse(
    `${data.date} ${data.time}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  )

  try {
    // Find or create client
    const client = await findOrCreateClient(data.organizationId, data.client)

    // Create or update pet
    const pet = await createOrUpdatePet(client.id, data.pet)

    // Create appointment
    const appointment = await db.appointment.create({
      data: {
        organizationId: data.organizationId,
        clientId: client.id,
        dateTime,
        duration: totalDuration,
        status: org.bookingRequiresApproval ? "PENDING" : "SCHEDULED",
        notes: data.notes,
        subtotal,
        totalAmount: subtotal,
        appointmentPets: {
          create: {
            petId: pet.id,
          },
        },
        appointmentServices: {
          create: services.map((s) => ({
            serviceId: s.id,
            price: s.defaultPrice,
            duration: s.defaultDuration,
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

    return {
      success: true,
      appointmentId: appointment.id,
      status: appointment.status,
      dateTime: appointment.dateTime.toISOString(),
    }
  } catch (error) {
    console.error("Error creating booking:", error)
    return { success: false, error: "Failed to create booking" }
  }
}

// Get client's pets by email or phone (for returning customers)
export async function getClientPets(
  organizationId: string,
  email?: string,
  phone?: string
) {
  if (!email && !phone) return []

  const client = await db.client.findFirst({
    where: {
      organizationId,
      OR: [
        email ? { email } : {},
        phone ? { phone } : {},
      ].filter((c) => Object.keys(c).length > 0),
    },
    include: {
      pets: {
        select: {
          id: true,
          name: true,
          species: true,
          breed: true,
          weight: true,
          behaviorNotes: true,
        },
      },
    },
  })

  return client?.pets || []
}
