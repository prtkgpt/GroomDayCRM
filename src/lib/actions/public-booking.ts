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
      services: {
        where: { isActive: true },
        orderBy: [{ isAddOn: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          description: true,
          defaultPrice: true,
          defaultDuration: true,
          isAddOn: true,
        },
      },
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
// Returns time strings in "HH:mm" format (PST times)
export async function getAvailableSlots(
  organizationId: string,
  date: Date | string,
  duration: number // total duration in minutes
): Promise<string[]> {
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

  // Handle both Date object and ISO string input
  const inputDate = typeof date === 'string' ? new Date(date) : date

  // Get the date portion only (YYYY-MM-DD) to avoid timezone issues
  const dateStr = format(inputDate, "yyyy-MM-dd")

  // Create PST day boundaries for database query
  // Parse the date as PST midnight
  const dayStartPST = parse(`${dateStr} 00:00`, "yyyy-MM-dd HH:mm", new Date())
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
  const nowUTC = new Date()
  const minBookingTimeUTC = addHours(nowUTC, org.bookingLeadTime)

  // Generate slots from 8am to 5pm PST
  const availableSlots: string[] = []

  for (let hour = BUSINESS_START_HOUR; hour <= BUSINESS_END_START_HOUR; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      // Skip 5:30 PM since we only allow starts up to 5:00 PM
      if (hour === BUSINESS_END_START_HOUR && minute > 0) break

      const timeStr = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`

      // Create this slot's datetime in PST, then convert to UTC
      const slotPST = parse(`${dateStr} ${timeStr}`, "yyyy-MM-dd HH:mm", new Date())
      const slotUTC = fromZonedTime(slotPST, BUSINESS_TIMEZONE)

      // Calculate end time
      const slotEndUTC = addMinutes(slotUTC, duration + org.appointmentBuffer)
      const slotEndPST = toZonedTime(slotEndUTC, BUSINESS_TIMEZONE)

      // Check if appointment would end after 8pm PST
      if (slotEndPST.getHours() > BUSINESS_HARD_END_HOUR ||
          (slotEndPST.getHours() === BUSINESS_HARD_END_HOUR && slotEndPST.getMinutes() > 0)) {
        continue
      }

      // Check if slot is in the past or before lead time
      if (isBefore(slotUTC, minBookingTimeUTC)) {
        continue
      }

      // Check for conflicts with existing appointments
      const hasConflict = existingAppointments.some((appt) => {
        const apptStartUTC = new Date(appt.dateTime)
        const apptEndUTC = addMinutes(apptStartUTC, appt.duration + org.appointmentBuffer)
        return isBefore(slotUTC, apptEndUTC) && isAfter(slotEndUTC, apptStartUTC)
      })

      if (!hasConflict) {
        availableSlots.push(timeStr)
      }
    }
  }

  return availableSlots
}

// Get available time slots with availability info (for booking-wizard)
export async function getAvailableSlotsDetailed(
  organizationId: string,
  date: Date,
  duration: number
): Promise<{ time: string; available: boolean }[]> {
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
  const businessStartPST = setMinutes(setHours(dayStartPST, BUSINESS_START_HOUR), 0)
  const latestStartTimePST = setMinutes(setHours(dayStartPST, BUSINESS_END_START_HOUR), 0)
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

  // Calculate minimum booking time in PST
  const nowInPST = toZonedTime(new Date(), BUSINESS_TIMEZONE)
  const minBookingTimePST = addHours(nowInPST, org.bookingLeadTime)

  const slots: { time: string; available: boolean }[] = []
  let currentSlotPST = businessStartPST

  while (isBefore(currentSlotPST, latestStartTimePST) ||
         currentSlotPST.getTime() === latestStartTimePST.getTime()) {

    const slotEndPST = addMinutes(currentSlotPST, duration + org.appointmentBuffer)

    if (isAfter(slotEndPST, hardEndTimePST)) {
      currentSlotPST = addMinutes(currentSlotPST, 30)
      continue
    }

    const isPastLeadTime = isAfter(currentSlotPST, minBookingTimePST)
    const currentSlotUTC = fromZonedTime(currentSlotPST, BUSINESS_TIMEZONE)

    const hasConflict = existingAppointments.some((appt) => {
      const apptStartUTC = new Date(appt.dateTime)
      const apptEndUTC = addMinutes(apptStartUTC, appt.duration + org.appointmentBuffer)
      const slotEndUTC = fromZonedTime(slotEndPST, BUSINESS_TIMEZONE)
      return isBefore(currentSlotUTC, apptEndUTC) && isAfter(slotEndUTC, apptStartUTC)
    })

    slots.push({
      time: format(currentSlotPST, "HH:mm"),
      available: isPastLeadTime && !hasConflict,
    })

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
  dateTimeUTC: Date,
  durationMinutes: number,
  bufferMinutes: number
): { valid: boolean; error?: string } {
  // Convert UTC to PST for validation
  const dateTimePST = toZonedTime(dateTimeUTC, BUSINESS_TIMEZONE)
  const hour = dateTimePST.getHours()
  const minute = dateTimePST.getMinutes()
  const endTime = addMinutes(dateTimePST, durationMinutes + bufferMinutes)
  const endHour = endTime.getHours()
  const endMinute = endTime.getMinutes()

  // Check if start time is between 8am and 5pm PST
  if (hour < BUSINESS_START_HOUR) {
    return { valid: false, error: "Appointments cannot start before 8:00 AM PST" }
  }
  if (hour > BUSINESS_END_START_HOUR || (hour === BUSINESS_END_START_HOUR && minute > 0)) {
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

  // Parse date and time as PST, then convert to UTC
  const dateTimePST = parse(
    `${data.date} ${data.time}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  )
  // Convert PST time to UTC for storage
  const dateTime = fromZonedTime(dateTimePST, BUSINESS_TIMEZONE)

  // Validate business hours (function expects UTC and converts internally)
  const validation = validateBusinessHours(dateTime, totalDuration, org.appointmentBuffer)
  if (!validation.valid) {
    return { success: false, error: validation.error }
  }

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

// Create a public booking (used by the legacy booking form)
export async function createPublicBooking(data: {
  organizationId: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  petName: string
  species: string
  breed?: string
  weight?: number
  notes?: string
  serviceId: string
  date: string // YYYY-MM-DD format
  time: string // HH:mm format (PST time)
}) {
  const org = await db.organization.findUnique({
    where: { id: data.organizationId },
    select: {
      bookingRequiresApproval: true,
      appointmentBuffer: true,
    },
  })

  if (!org) {
    throw new Error("Organization not found")
  }

  // Get the service
  const service = await db.service.findFirst({
    where: {
      id: data.serviceId,
      organizationId: data.organizationId,
      isActive: true,
    },
  })

  if (!service) {
    throw new Error("Service not found")
  }

  // Parse date and time as PST, then convert to UTC
  const dateTimePST = parse(
    `${data.date} ${data.time}`,
    "yyyy-MM-dd HH:mm",
    new Date()
  )
  // Convert PST time to UTC for storage
  const dateTimeUTC = fromZonedTime(dateTimePST, BUSINESS_TIMEZONE)

  // Validate business hours
  const validation = validateBusinessHours(dateTimeUTC, service.defaultDuration, org.appointmentBuffer)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Find or create client
  let client = await db.client.findFirst({
    where: {
      organizationId: data.organizationId,
      OR: [{ email: data.email }, data.phone ? { phone: data.phone } : {}].filter(
        (c) => Object.keys(c).length > 0
      ),
    },
  })

  if (client) {
    client = await db.client.update({
      where: { id: client.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
      },
    })
  } else {
    client = await db.client.create({
      data: {
        organizationId: data.organizationId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
      },
    })
  }

  // Create or find pet
  let pet = await db.pet.findFirst({
    where: {
      clientId: client.id,
      name: data.petName,
    },
  })

  if (pet) {
    pet = await db.pet.update({
      where: { id: pet.id },
      data: {
        species: data.species,
        breed: data.breed,
        weight: data.weight,
        behaviorNotes: data.notes,
      },
    })
  } else {
    pet = await db.pet.create({
      data: {
        clientId: client.id,
        name: data.petName,
        species: data.species,
        breed: data.breed,
        weight: data.weight,
        behaviorNotes: data.notes,
      },
    })
  }

  // Create the appointment
  const appointment = await db.appointment.create({
    data: {
      organizationId: data.organizationId,
      clientId: client.id,
      dateTime: dateTimeUTC,
      duration: service.defaultDuration,
      status: org.bookingRequiresApproval ? "PENDING" : "SCHEDULED",
      notes: data.notes,
      subtotal: service.defaultPrice,
      totalAmount: service.defaultPrice,
      appointmentPets: {
        create: {
          petId: pet.id,
        },
      },
      appointmentServices: {
        create: {
          serviceId: service.id,
          price: service.defaultPrice,
          duration: service.defaultDuration,
        },
      },
    },
  })

  return {
    clientName: `${client.firstName} ${client.lastName}`,
    petName: pet.name,
    dateTime: appointment.dateTime.toISOString(),
    serviceName: service.name,
  }
}
