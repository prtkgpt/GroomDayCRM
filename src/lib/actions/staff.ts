"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireOrganizationId } from "@/lib/auth"
import { z } from "zod"

// Validation schemas
const staffSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  photoUrl: z.string().optional(),
  title: z.string().optional(),
  bio: z.string().optional(),
  specialties: z.array(z.string()).default([]),
  hireDate: z.string().optional(),
  hourlyRate: z.number().min(0).optional(),
  commissionRate: z.number().min(0).max(100).optional(),
  color: z.string().default("#3b82f6"),
})

export type StaffFormData = z.infer<typeof staffSchema>

const scheduleSchema = z.object({
  dayOfWeek: z.number().min(0).max(6),
  startTime: z.string(),
  endTime: z.string(),
  isWorking: z.boolean().default(true),
})

const timeOffSchema = z.object({
  startDate: z.string(),
  endDate: z.string(),
  reason: z.string().optional(),
  notes: z.string().optional(),
})

// Get all staff members
export async function getStaffMembers(options?: { isActive?: boolean }) {
  const organizationId = await requireOrganizationId()

  const staff = await db.staff.findMany({
    where: {
      organizationId,
      ...(options?.isActive !== undefined && { isActive: options.isActive }),
    },
    include: {
      schedules: {
        orderBy: { dayOfWeek: "asc" },
      },
      _count: {
        select: {
          appointments: {
            where: {
              status: { in: ["SCHEDULED", "CONFIRMED", "IN_PROGRESS"] },
            },
          },
        },
      },
    },
    orderBy: { firstName: "asc" },
  })

  return staff
}

// Get single staff member
export async function getStaffMember(id: string) {
  const organizationId = await requireOrganizationId()

  const staff = await db.staff.findFirst({
    where: { id, organizationId },
    include: {
      schedules: {
        orderBy: { dayOfWeek: "asc" },
      },
      timeOff: {
        where: {
          endDate: { gte: new Date() },
        },
        orderBy: { startDate: "asc" },
      },
      appointments: {
        where: {
          dateTime: { gte: new Date() },
        },
        orderBy: { dateTime: "asc" },
        take: 10,
        include: {
          client: true,
          appointmentPets: { include: { pet: true } },
        },
      },
      user: {
        select: { id: true, email: true, firstName: true, lastName: true },
      },
    },
  })

  return staff
}

// Create staff member
export async function createStaffMember(data: StaffFormData) {
  const organizationId = await requireOrganizationId()
  const validated = staffSchema.parse(data)

  const staff = await db.staff.create({
    data: {
      firstName: validated.firstName,
      lastName: validated.lastName,
      email: validated.email || null,
      phone: validated.phone || null,
      photoUrl: validated.photoUrl || null,
      title: validated.title || null,
      bio: validated.bio || null,
      specialties: validated.specialties,
      hireDate: validated.hireDate ? new Date(validated.hireDate) : null,
      hourlyRate: validated.hourlyRate,
      commissionRate: validated.commissionRate,
      color: validated.color,
      organizationId,
    },
  })

  // Create default schedule (Mon-Fri 9-5)
  const defaultSchedule = [
    { dayOfWeek: 0, isWorking: false, startTime: "09:00", endTime: "17:00" }, // Sunday
    { dayOfWeek: 1, isWorking: true, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 2, isWorking: true, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 3, isWorking: true, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 4, isWorking: true, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 5, isWorking: true, startTime: "09:00", endTime: "17:00" },
    { dayOfWeek: 6, isWorking: false, startTime: "09:00", endTime: "17:00" }, // Saturday
  ]

  await db.staffSchedule.createMany({
    data: defaultSchedule.map((s) => ({
      ...s,
      staffId: staff.id,
    })),
  })

  revalidatePath("/app/staff")
  return staff
}

// Update staff member
export async function updateStaffMember(id: string, data: Partial<StaffFormData>) {
  const organizationId = await requireOrganizationId()

  const updateData: any = {}

  if (data.firstName !== undefined) updateData.firstName = data.firstName
  if (data.lastName !== undefined) updateData.lastName = data.lastName
  if (data.email !== undefined) updateData.email = data.email || null
  if (data.phone !== undefined) updateData.phone = data.phone || null
  if (data.photoUrl !== undefined) updateData.photoUrl = data.photoUrl || null
  if (data.title !== undefined) updateData.title = data.title || null
  if (data.bio !== undefined) updateData.bio = data.bio || null
  if (data.specialties !== undefined) updateData.specialties = data.specialties
  if (data.hireDate !== undefined) updateData.hireDate = data.hireDate ? new Date(data.hireDate) : null
  if (data.hourlyRate !== undefined) updateData.hourlyRate = data.hourlyRate
  if (data.commissionRate !== undefined) updateData.commissionRate = data.commissionRate
  if (data.color !== undefined) updateData.color = data.color

  const staff = await db.staff.update({
    where: { id, organizationId },
    data: updateData,
  })

  revalidatePath("/app/staff")
  revalidatePath(`/app/staff/${id}`)
  return staff
}

// Toggle staff active status
export async function toggleStaffActive(id: string, isActive: boolean) {
  const organizationId = await requireOrganizationId()

  const staff = await db.staff.update({
    where: { id, organizationId },
    data: { isActive },
  })

  revalidatePath("/app/staff")
  revalidatePath(`/app/staff/${id}`)
  return staff
}

// Delete staff member
export async function deleteStaffMember(id: string) {
  const organizationId = await requireOrganizationId()

  await db.staff.delete({
    where: { id, organizationId },
  })

  revalidatePath("/app/staff")
}

// Update staff schedule
export async function updateStaffSchedule(
  staffId: string,
  schedules: Array<{
    dayOfWeek: number
    startTime: string
    endTime: string
    isWorking: boolean
  }>
) {
  const organizationId = await requireOrganizationId()

  // Verify staff belongs to organization
  const staff = await db.staff.findFirst({
    where: { id: staffId, organizationId },
  })

  if (!staff) {
    throw new Error("Staff member not found")
  }

  // Upsert schedules
  for (const schedule of schedules) {
    await db.staffSchedule.upsert({
      where: {
        staffId_dayOfWeek: {
          staffId,
          dayOfWeek: schedule.dayOfWeek,
        },
      },
      update: {
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isWorking: schedule.isWorking,
      },
      create: {
        staffId,
        dayOfWeek: schedule.dayOfWeek,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        isWorking: schedule.isWorking,
      },
    })
  }

  revalidatePath(`/app/staff/${staffId}`)
  return { success: true }
}

// Add time off
export async function addStaffTimeOff(
  staffId: string,
  data: { startDate: string; endDate: string; reason?: string; notes?: string }
) {
  const organizationId = await requireOrganizationId()

  // Verify staff belongs to organization
  const staff = await db.staff.findFirst({
    where: { id: staffId, organizationId },
  })

  if (!staff) {
    throw new Error("Staff member not found")
  }

  const timeOff = await db.staffTimeOff.create({
    data: {
      staffId,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
      reason: data.reason || null,
      notes: data.notes || null,
    },
  })

  revalidatePath(`/app/staff/${staffId}`)
  return timeOff
}

// Delete time off
export async function deleteStaffTimeOff(timeOffId: string) {
  const organizationId = await requireOrganizationId()

  const timeOff = await db.staffTimeOff.findFirst({
    where: { id: timeOffId },
    include: { staff: true },
  })

  if (!timeOff || timeOff.staff.organizationId !== organizationId) {
    throw new Error("Time off record not found")
  }

  await db.staffTimeOff.delete({
    where: { id: timeOffId },
  })

  revalidatePath(`/app/staff/${timeOff.staffId}`)
}

// Get available staff for a time slot
export async function getAvailableStaff(dateTime: Date, duration: number) {
  const organizationId = await requireOrganizationId()

  const dayOfWeek = dateTime.getDay()
  const timeStr = dateTime.toTimeString().slice(0, 5)
  const endTime = new Date(dateTime.getTime() + duration * 60000)
  const endTimeStr = endTime.toTimeString().slice(0, 5)

  // Get all active staff
  const allStaff = await db.staff.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    include: {
      schedules: {
        where: { dayOfWeek },
      },
      timeOff: {
        where: {
          startDate: { lte: dateTime },
          endDate: { gte: dateTime },
        },
      },
      appointments: {
        where: {
          dateTime: {
            gte: new Date(dateTime.getTime() - 24 * 60 * 60 * 1000),
            lte: new Date(dateTime.getTime() + 24 * 60 * 60 * 1000),
          },
          status: { notIn: ["CANCELED", "NO_SHOW"] },
        },
      },
    },
  })

  // Filter available staff
  const availableStaff = allStaff.filter((staff) => {
    // Check if working on this day
    const schedule = staff.schedules[0]
    if (!schedule || !schedule.isWorking) return false

    // Check if time is within working hours
    if (timeStr < schedule.startTime || endTimeStr > schedule.endTime) return false

    // Check if not on time off
    if (staff.timeOff.length > 0) return false

    // Check for appointment conflicts
    const hasConflict = staff.appointments.some((apt) => {
      const aptStart = new Date(apt.dateTime)
      const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000)
      return dateTime < aptEnd && endTime > aptStart
    })

    return !hasConflict
  })

  return availableStaff.map((s) => ({
    id: s.id,
    firstName: s.firstName,
    lastName: s.lastName,
    color: s.color,
    title: s.title,
  }))
}

// Assign staff to appointment
export async function assignStaffToAppointment(appointmentId: string, staffId: string | null) {
  const organizationId = await requireOrganizationId()

  const appointment = await db.appointment.update({
    where: { id: appointmentId, organizationId },
    data: { staffId },
  })

  revalidatePath("/app/calendar")
  revalidatePath(`/app/appointments/${appointmentId}`)
  return appointment
}
