"use server"

import { db } from "@/lib/db"
import { revalidatePath } from "next/cache"
import { Resend } from "resend"

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null

export async function getOrganizationBySlug(slug: string) {
  const organization = await db.organization.findUnique({
    where: { slug },
    include: {
      services: {
        where: { isActive: true, isAddOn: false },
        orderBy: { sortOrder: "asc" },
      },
    },
  })

  return organization
}

export async function getAvailableSlots(
  organizationId: string,
  date: string,
  duration: number
) {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
  })

  if (!organization) {
    throw new Error("Organization not found")
  }

  const selectedDate = new Date(date)
  const dayStart = new Date(selectedDate)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(selectedDate)
  dayEnd.setHours(23, 59, 59, 999)

  // Get existing appointments for the day
  const existingAppointments = await db.appointment.findMany({
    where: {
      organizationId,
      dateTime: {
        gte: dayStart,
        lte: dayEnd,
      },
      status: {
        notIn: ["CANCELED", "NO_SHOW"],
      },
    },
    orderBy: { dateTime: "asc" },
  })

  // Parse business hours
  const [startHour, startMin] = organization.businessHoursStart.split(":").map(Number)
  const [endHour, endMin] = organization.businessHoursEnd.split(":").map(Number)
  const buffer = organization.appointmentBuffer

  // Generate available slots
  const slots: string[] = []
  const slotDate = new Date(selectedDate)
  slotDate.setHours(startHour, startMin, 0, 0)

  const endTime = new Date(selectedDate)
  endTime.setHours(endHour, endMin, 0, 0)

  while (slotDate < endTime) {
    const slotEnd = new Date(slotDate.getTime() + duration * 60000)

    // Check if slot conflicts with existing appointments
    const hasConflict = existingAppointments.some((apt) => {
      const aptStart = new Date(apt.dateTime)
      const aptEnd = new Date(aptStart.getTime() + apt.duration * 60000 + buffer * 60000)
      const slotStartWithBuffer = new Date(slotDate.getTime() - buffer * 60000)

      return (
        (slotStartWithBuffer < aptEnd && slotEnd > aptStart)
      )
    })

    if (!hasConflict && slotEnd <= endTime) {
      slots.push(slotDate.toISOString())
    }

    // Move to next slot (30-minute intervals)
    slotDate.setMinutes(slotDate.getMinutes() + 30)
  }

  return slots
}

export async function createPublicBooking(data: {
  organizationId: string
  // Client info
  firstName: string
  lastName: string
  email: string
  phone?: string
  address?: string
  // Pet info
  petName: string
  species: string
  breed?: string
  weight?: number
  notes?: string
  // Appointment info
  serviceId: string
  dateTime: string
  locationNotes?: string
}) {
  const organization = await db.organization.findUnique({
    where: { id: data.organizationId },
  })

  if (!organization) {
    throw new Error("Organization not found")
  }

  const service = await db.service.findFirst({
    where: { id: data.serviceId, organizationId: data.organizationId },
  })

  if (!service) {
    throw new Error("Service not found")
  }

  // Check if client already exists by email
  let client = await db.client.findFirst({
    where: {
      email: data.email,
      organizationId: data.organizationId,
    },
  })

  if (!client) {
    // Create new client
    client = await db.client.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        organizationId: data.organizationId,
      },
    })
  }

  // Check if pet already exists for this client
  let pet = await db.pet.findFirst({
    where: {
      name: data.petName,
      clientId: client.id,
    },
  })

  if (!pet) {
    // Create new pet
    pet = await db.pet.create({
      data: {
        name: data.petName,
        species: data.species,
        breed: data.breed,
        weight: data.weight,
        clientId: client.id,
      },
    })
  }

  // Create appointment with PENDING status for approval
  const appointment = await db.appointment.create({
    data: {
      dateTime: new Date(data.dateTime),
      duration: service.defaultDuration,
      status: "PENDING",
      locationType: "CLIENT_HOME",
      locationAddress: data.address,
      locationNotes: data.locationNotes,
      notes: data.notes,
      subtotal: service.defaultPrice,
      totalAmount: service.defaultPrice,
      clientId: client.id,
      organizationId: data.organizationId,
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
    include: {
      client: true,
      appointmentPets: { include: { pet: true } },
      appointmentServices: { include: { service: true } },
    },
  })

  // Send notification email to organization
  if (resend && organization.email) {
    const appointmentDate = new Date(data.dateTime).toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    })
    const appointmentTime = new Date(data.dateTime).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    })
    const fromEmail = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev"

    try {
      await resend.emails.send({
        from: fromEmail,
        to: organization.email,
        subject: `New Booking Request - ${client.firstName} ${client.lastName}`,
        html: `
          <h2>New Online Booking Request</h2>
          <p>You have a new booking request that needs your approval:</p>

          <h3>Customer Details</h3>
          <p><strong>Name:</strong> ${client.firstName} ${client.lastName}</p>
          <p><strong>Email:</strong> ${client.email}</p>
          ${client.phone ? `<p><strong>Phone:</strong> ${client.phone}</p>` : ""}
          ${data.address ? `<p><strong>Address:</strong> ${data.address}</p>` : ""}

          <h3>Pet Details</h3>
          <p><strong>Name:</strong> ${pet.name}</p>
          <p><strong>Species:</strong> ${pet.species}</p>
          ${pet.breed ? `<p><strong>Breed:</strong> ${pet.breed}</p>` : ""}

          <h3>Appointment Details</h3>
          <p><strong>Service:</strong> ${service.name}</p>
          <p><strong>Date:</strong> ${appointmentDate}</p>
          <p><strong>Time:</strong> ${appointmentTime}</p>
          <p><strong>Duration:</strong> ${service.defaultDuration} minutes</p>
          <p><strong>Price:</strong> $${service.defaultPrice.toFixed(2)}</p>
          ${data.notes ? `<p><strong>Notes:</strong> ${data.notes}</p>` : ""}

          <p style="margin-top: 20px;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || "https://groomdaycrm.com"}/app/appointments"
               style="background-color: #0066cc; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Review & Approve
            </a>
          </p>
        `,
      })
    } catch (error) {
      console.error("Failed to send booking notification:", error)
    }
  }

  revalidatePath("/app/calendar")
  revalidatePath("/app/appointments")
  revalidatePath("/app")

  return {
    success: true,
    appointmentId: appointment.id,
    clientName: `${client.firstName} ${client.lastName}`,
    petName: pet.name,
    dateTime: appointment.dateTime,
    serviceName: service.name,
    status: "pending",
  }
}
