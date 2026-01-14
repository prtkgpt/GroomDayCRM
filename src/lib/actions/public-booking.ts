"use server"

import { db } from "@/lib/db"
import { addDays, addHours, format, parse, setHours, setMinutes, startOfDay, isBefore, isAfter, addMinutes } from "date-fns"
import { toZonedTime, fromZonedTime } from "date-fns-tz"

// Business timezone (PST/PDT)
const BUSINESS_TIMEZONE = "America/Los_Angeles"

// Business hours in PST
const BUSINESS_START_HOUR = 8  // 8:00 AM PST - earliest start time
const BUSINESS_END_START_HOUR = 17  // 5:00 PM PST - latest start time
const BUSINESS_HARD_END_HOUR = 20  // 8:00 PM PST - latest end time

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
// Business hours: Start between 8am-5pm PST, End no later than 8pm PST
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
      timezone: true,
    },
  })

  if (!org) return []

  // Convert the input date to PST timezone
  const dateInPST = toZonedTime(date, BUSINESS_TIMEZONE)
  const dayStartPST = startOfDay(dateInPST)

  // Set business hours in PST
  // Appointments can START between 8am-5pm PST
  const businessStartPST = setMinutes(setHours(dayStartPST, BUSINESS_START_HOUR), 0)
  const latestStartTimePST = setMinutes(setHours(dayStartPST, BUSINESS_END_START_HOUR), 0)
  // Appointments must END by 8pm PST
  const hardEndTimePST = setMinutes(setHours(dayStartPST, BUSINESS_HARD_END_HOUR), 0)

  // Convert PST times to UTC for database queries
  const dayStartUTC = fromZonedTime(dayStartPST, BUSINESS_TIMEZONE)
  const dayEndUTC = fromZonedTime(addDays(dayStartPST, 1), BUSINESS_TIMEZONE)

  // Get existing appointments for this day
  const existingAppointments = await db.appointment.findMany({
    where: {
      organizationId,
      dateTime: {
        gte: dayStartUTC,
        lt: dayEndUTC,
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

  // Calculate minimum booking time (current time + lead time) in PST
  const nowInPST = toZonedTime(new Date(), BUSINESS_TIMEZONE)
  const minBookingTimePST = addHours(nowInPST, org.bookingLeadTime)

  // Generate all possible slots (every 30 minutes)
  const slots: { time: string; available: boolean }[] = []
  let currentSlotPST = businessStartPST

  // Loop through all slots from 8am to 5pm PST (latest start time)
  while (isBefore(currentSlotPST, latestStartTimePST) ||
         currentSlotPST.getTime() === latestStartTimePST.getTime()) {

    // Calculate when this appointment would end (including buffer)
    const slotEndPST = addMinutes(currentSlotPST, duration + org.appointmentBuffer)

    // Skip if appointment would end after 8pm PST
    if (isAfter(slotEndPST, hardEndTimePST)) {
      currentSlotPST = addMinutes(currentSlotPST, 30)
      continue
    }

    // Check if slot is in the past or before lead time
    const isPastLeadTime = isAfter(currentSlotPST, minBookingTimePST)

    // Convert current slot to UTC for comparison with existing appointments
    const currentSlotUTC = fromZonedTime(currentSlotPST, BUSINESS_TIMEZONE)

    // Check if slot conflicts with existing appointments
    const hasConflict = existingAppointments.some((appt) => {
      const apptStartUTC = new Date(appt.dateTime)
      const apptEndUTC = addMinutes(apptStartUTC, appt.duration + org.appointmentBuffer)

      // Convert to PST for comparison
      const slotEndUTC = fromZonedTime(slotEndPST, BUSINESS_TIMEZONE)

      // Check for overlap
      return (
        isBefore(currentSlotUTC, apptEndUTC) && isAfter(slotEndUTC, apptStartUTC)
      )
    })

    slots.push({
      time: format(currentSlotPST, "HH:mm"),
      available: isPastLeadTime && !hasConflict,
    })

    // Move to next slot (30-minute intervals)
    currentSlotPST = addMinutes(currentSlotPST, 30)
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

// Validate appointment time is within business hours (PST)
function validateBusinessHours(
  dateTimePST: Date,
  durationMinutes: number,
  bufferMinutes: number
): { valid: boolean; error?: string } {
  const hour = dateTimePST.getHours()
  const endTime = addMinutes(dateTimePST, durationMinutes + bufferMinutes)
  const endHour = endTime.getHours()
  const endMinute = endTime.getMinutes()

  // Check if start time is between 8am and 5pm PST
  if (hour < BUSINESS_START_HOUR) {
    return { valid: false, error: "Appointments cannot start before 8:00 AM PST" }
  }
  if (hour >= BUSINESS_END_START_HOUR && !(hour === BUSINESS_END_START_HOUR && dateTimePST.getMinutes() === 0)) {
    return { valid: false, error: "Appointments cannot start after 5:00 PM PST" }
  }

  // Check if end time is by 8pm PST
  if (endHour > BUSINESS_HARD_END_HOUR || (endHour === BUSINESS_HARD_END_HOUR && endMinute > 0)) {
    return { valid: false, error: "Appointments must end by 8:00 PM PST" }
  }

  return { valid: true }
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
      appointmentBuffer: true,
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

  // Parse date and time as PST
  const dateTimePST = parse(
    `${data.date} ${data.time}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  )

  // Validate business hours
  const validation = validateBusinessHours(dateTimePST, totalDuration, org.appointmentBuffer)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

  // Convert PST time to UTC for storage
  const dateTime = fromZonedTime(dateTimePST, BUSINESS_TIMEZONE)

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
