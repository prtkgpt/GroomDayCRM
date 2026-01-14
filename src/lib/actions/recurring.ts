"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireOrganizationId } from "@/lib/auth"
import { z } from "zod"
import { addDays, addWeeks, addMonths, setDay, setDate, startOfDay, isBefore, isAfter, parseISO } from "date-fns"

// Validation schema
const recurringScheduleSchema = z.object({
  name: z.string().optional(),
  frequency: z.enum(["WEEKLY", "BIWEEKLY", "MONTHLY"]),
  dayOfWeek: z.number().min(0).max(6).optional(),
  dayOfMonth: z.number().min(1).max(31).optional(),
  time: z.string().regex(/^\d{2}:\d{2}$/),
  duration: z.number().min(15),
  startDate: z.string(),
  endDate: z.string().optional(),
  locationType: z.enum(["CLIENT_HOME", "BUSINESS", "OTHER"]).default("CLIENT_HOME"),
  locationAddress: z.string().optional(),
  locationNotes: z.string().optional(),
  notes: z.string().optional(),
  clientId: z.string(),
  petIds: z.array(z.string()).min(1),
  serviceIds: z.array(z.string()).min(1),
})

export type RecurringScheduleFormData = z.infer<typeof recurringScheduleSchema>

export async function getRecurringSchedules(options?: { clientId?: string; isActive?: boolean }) {
  const organizationId = await requireOrganizationId()

  const schedules = await db.recurringSchedule.findMany({
    where: {
      organizationId,
      ...(options?.clientId && { clientId: options.clientId }),
      ...(options?.isActive !== undefined && { isActive: options.isActive }),
    },
    include: {
      client: true,
      pets: { include: { pet: true } },
      services: { include: { service: true } },
      appointments: {
        orderBy: { dateTime: "desc" },
        take: 5,
      },
    },
    orderBy: { createdAt: "desc" },
  })

  return schedules
}

export async function getRecurringSchedule(id: string) {
  const organizationId = await requireOrganizationId()

  const schedule = await db.recurringSchedule.findFirst({
    where: { id, organizationId },
    include: {
      client: { include: { pets: true } },
      pets: { include: { pet: true } },
      services: { include: { service: true } },
      appointments: {
        orderBy: { dateTime: "desc" },
        take: 10,
      },
    },
  })

  return schedule
}

export async function createRecurringSchedule(data: RecurringScheduleFormData) {
  const organizationId = await requireOrganizationId()
  const validated = recurringScheduleSchema.parse(data)

  // Get services to calculate total duration and price
  const services = await db.service.findMany({
    where: {
      id: { in: validated.serviceIds },
      organizationId,
    },
  })

  const totalDuration = validated.duration || services.reduce((sum, s) => sum + s.defaultDuration, 0)

  const schedule = await db.recurringSchedule.create({
    data: {
      name: validated.name,
      frequency: validated.frequency,
      dayOfWeek: validated.dayOfWeek,
      dayOfMonth: validated.dayOfMonth,
      time: validated.time,
      duration: totalDuration,
      startDate: new Date(validated.startDate),
      endDate: validated.endDate ? new Date(validated.endDate) : null,
      locationType: validated.locationType,
      locationAddress: validated.locationAddress || null,
      locationNotes: validated.locationNotes || null,
      notes: validated.notes || null,
      clientId: validated.clientId,
      organizationId,
      pets: {
        create: validated.petIds.map((petId) => ({ petId })),
      },
      services: {
        create: services.map((service) => ({
          serviceId: service.id,
          price: service.defaultPrice,
          duration: service.defaultDuration,
        })),
      },
    },
    include: {
      client: true,
      pets: { include: { pet: true } },
      services: { include: { service: true } },
    },
  })

  revalidatePath("/app/recurring")
  revalidatePath(`/app/clients/${validated.clientId}`)
  return schedule
}

export async function updateRecurringSchedule(id: string, data: Partial<RecurringScheduleFormData>) {
  const organizationId = await requireOrganizationId()

  const updateData: any = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.frequency) updateData.frequency = data.frequency
  if (data.dayOfWeek !== undefined) updateData.dayOfWeek = data.dayOfWeek
  if (data.dayOfMonth !== undefined) updateData.dayOfMonth = data.dayOfMonth
  if (data.time) updateData.time = data.time
  if (data.duration) updateData.duration = data.duration
  if (data.startDate) updateData.startDate = new Date(data.startDate)
  if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null
  if (data.locationType) updateData.locationType = data.locationType
  if (data.locationAddress !== undefined) updateData.locationAddress = data.locationAddress
  if (data.locationNotes !== undefined) updateData.locationNotes = data.locationNotes
  if (data.notes !== undefined) updateData.notes = data.notes

  const schedule = await db.recurringSchedule.update({
    where: { id, organizationId },
    data: updateData,
  })

  revalidatePath("/app/recurring")
  revalidatePath(`/app/recurring/${id}`)
  return schedule
}

export async function toggleRecurringSchedule(id: string, isActive: boolean) {
  const organizationId = await requireOrganizationId()

  const schedule = await db.recurringSchedule.update({
    where: { id, organizationId },
    data: { isActive },
  })

  revalidatePath("/app/recurring")
  revalidatePath(`/app/recurring/${id}`)
  return schedule
}

export async function deleteRecurringSchedule(id: string) {
  const organizationId = await requireOrganizationId()

  await db.recurringSchedule.delete({
    where: { id, organizationId },
  })

  revalidatePath("/app/recurring")
}

// Calculate the next occurrence date based on recurrence rules
function getNextOccurrence(
  frequency: "WEEKLY" | "BIWEEKLY" | "MONTHLY",
  fromDate: Date,
  dayOfWeek?: number | null,
  dayOfMonth?: number | null
): Date {
  const date = startOfDay(fromDate)

  if (frequency === "WEEKLY" && dayOfWeek !== null && dayOfWeek !== undefined) {
    // Get next occurrence of the specified day
    let nextDate = setDay(date, dayOfWeek, { weekStartsOn: 0 })
    if (isBefore(nextDate, date) || nextDate.getTime() === date.getTime()) {
      nextDate = addWeeks(nextDate, 1)
    }
    return nextDate
  }

  if (frequency === "BIWEEKLY" && dayOfWeek !== null && dayOfWeek !== undefined) {
    // Get next occurrence of the specified day, then add another week
    let nextDate = setDay(date, dayOfWeek, { weekStartsOn: 0 })
    if (isBefore(nextDate, date) || nextDate.getTime() === date.getTime()) {
      nextDate = addWeeks(nextDate, 2)
    }
    return nextDate
  }

  if (frequency === "MONTHLY" && dayOfMonth !== null && dayOfMonth !== undefined) {
    // Get next occurrence of the specified day of month
    let nextDate = setDate(date, dayOfMonth)
    if (isBefore(nextDate, date) || nextDate.getTime() === date.getTime()) {
      nextDate = addMonths(nextDate, 1)
      nextDate = setDate(nextDate, dayOfMonth)
    }
    return nextDate
  }

  // Default: add one week
  return addWeeks(date, 1)
}

// Generate upcoming appointments from a recurring schedule
export async function generateAppointmentsFromSchedule(scheduleId: string, weeksAhead: number = 4) {
  const organizationId = await requireOrganizationId()

  const schedule = await db.recurringSchedule.findFirst({
    where: { id: scheduleId, organizationId, isActive: true },
    include: {
      pets: true,
      services: { include: { service: true } },
    },
  })

  if (!schedule) {
    throw new Error("Schedule not found or inactive")
  }

  const now = new Date()
  const endDate = schedule.endDate || addWeeks(now, weeksAhead)
  const startFrom = schedule.lastGeneratedDate
    ? addDays(new Date(schedule.lastGeneratedDate), 1)
    : new Date(schedule.startDate)

  const appointmentsToCreate: Date[] = []
  let currentDate = getNextOccurrence(
    schedule.frequency,
    startFrom,
    schedule.dayOfWeek,
    schedule.dayOfMonth
  )

  // Generate dates until we reach the end date or weeks ahead limit
  const maxDate = schedule.endDate
    ? (isBefore(schedule.endDate, addWeeks(now, weeksAhead)) ? schedule.endDate : addWeeks(now, weeksAhead))
    : addWeeks(now, weeksAhead)

  while (isBefore(currentDate, maxDate) && appointmentsToCreate.length < 12) {
    if (isAfter(currentDate, now)) {
      appointmentsToCreate.push(currentDate)
    }

    // Move to next occurrence
    if (schedule.frequency === "WEEKLY") {
      currentDate = addWeeks(currentDate, 1)
    } else if (schedule.frequency === "BIWEEKLY") {
      currentDate = addWeeks(currentDate, 2)
    } else if (schedule.frequency === "MONTHLY") {
      currentDate = addMonths(currentDate, 1)
    }
  }

  // Create appointments
  const createdAppointments = []
  const [hours, minutes] = schedule.time.split(":").map(Number)

  for (const date of appointmentsToCreate) {
    const dateTime = new Date(date)
    dateTime.setHours(hours, minutes, 0, 0)

    // Check for conflicts
    const existingAppointment = await db.appointment.findFirst({
      where: {
        organizationId,
        dateTime,
        status: { in: ["SCHEDULED", "CONFIRMED"] },
      },
    })

    if (existingAppointment) {
      continue // Skip this date if there's a conflict
    }

    // Calculate totals from services
    const subtotal = schedule.services.reduce(
      (sum, s) => sum + (s.price || s.service.defaultPrice),
      0
    )

    const appointment = await db.appointment.create({
      data: {
        dateTime,
        duration: schedule.duration,
        status: "SCHEDULED",
        locationType: schedule.locationType,
        locationAddress: schedule.locationAddress,
        locationNotes: schedule.locationNotes,
        notes: schedule.notes,
        subtotal,
        totalAmount: subtotal,
        clientId: schedule.clientId,
        organizationId,
        recurringScheduleId: schedule.id,
        appointmentPets: {
          create: schedule.pets.map((p) => ({ petId: p.petId })),
        },
        appointmentServices: {
          create: schedule.services.map((s) => ({
            serviceId: s.serviceId,
            price: s.price || s.service.defaultPrice,
            duration: s.duration || s.service.defaultDuration,
          })),
        },
      },
    })

    createdAppointments.push(appointment)
  }

  // Update last generated date
  if (appointmentsToCreate.length > 0) {
    await db.recurringSchedule.update({
      where: { id: scheduleId },
      data: {
        lastGeneratedDate: appointmentsToCreate[appointmentsToCreate.length - 1],
      },
    })
  }

  revalidatePath("/app/calendar")
  revalidatePath("/app/recurring")
  revalidatePath(`/app/recurring/${scheduleId}`)

  return createdAppointments
}

// Generate appointments for all active schedules
export async function generateAllUpcomingAppointments(weeksAhead: number = 4) {
  const organizationId = await requireOrganizationId()

  const schedules = await db.recurringSchedule.findMany({
    where: { organizationId, isActive: true },
  })

  let totalCreated = 0

  for (const schedule of schedules) {
    try {
      const created = await generateAppointmentsFromSchedule(schedule.id, weeksAhead)
      totalCreated += created.length
    } catch (error) {
      console.error(`Failed to generate appointments for schedule ${schedule.id}:`, error)
    }
  }

  return { totalCreated, schedulesProcessed: schedules.length }
}
