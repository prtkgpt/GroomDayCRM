"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getUser } from "@/lib/auth"

// ============================================
// WAIVER TEMPLATES
// ============================================

export async function getWaiverTemplates() {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  return db.waiverTemplate.findMany({
    where: { organizationId: user.organizationId },
    include: {
      _count: { select: { signatures: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getWaiverTemplate(id: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  return db.waiverTemplate.findFirst({
    where: { id, organizationId: user.organizationId },
  })
}

export async function createWaiverTemplate(data: {
  name: string
  content: string
  isRequired?: boolean
}) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const template = await db.waiverTemplate.create({
    data: {
      name: data.name,
      content: data.content,
      isRequired: data.isRequired ?? false,
      organizationId: user.organizationId,
    },
  })

  revalidatePath("/app/settings")
  return template
}

export async function updateWaiverTemplate(
  id: string,
  data: {
    name?: string
    content?: string
    isRequired?: boolean
    isActive?: boolean
  }
) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const template = await db.waiverTemplate.update({
    where: { id },
    data,
  })

  revalidatePath("/app/settings")
  return template
}

export async function deleteWaiverTemplate(id: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  await db.waiverTemplate.delete({
    where: { id },
  })

  revalidatePath("/app/settings")
  return { success: true }
}

// ============================================
// CLIENT WAIVERS (SIGNATURES)
// ============================================

export async function getClientWaivers(clientId: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  return db.clientWaiver.findMany({
    where: {
      clientId,
      template: { organizationId: user.organizationId },
    },
    include: {
      template: { select: { id: true, name: true } },
    },
    orderBy: { signedAt: "desc" },
  })
}

export async function getUnsignedWaivers(clientId: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  // Get all active templates
  const templates = await db.waiverTemplate.findMany({
    where: {
      organizationId: user.organizationId,
      isActive: true,
    },
  })

  // Get signed waivers for this client
  const signedWaivers = await db.clientWaiver.findMany({
    where: {
      clientId,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } },
      ],
    },
    select: { templateId: true },
  })

  const signedTemplateIds = new Set(signedWaivers.map((w) => w.templateId))

  // Return unsigned templates
  return templates.filter((t) => !signedTemplateIds.has(t.id))
}

export async function signWaiver(data: {
  clientId: string
  templateId: string
  signatureData: string
  signatureType: "TYPED" | "DRAWN"
  ipAddress?: string
  userAgent?: string
  expiresAt?: Date
}) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  // Verify template belongs to organization
  const template = await db.waiverTemplate.findFirst({
    where: {
      id: data.templateId,
      organizationId: user.organizationId,
    },
  })

  if (!template) throw new Error("Waiver template not found")

  const waiver = await db.clientWaiver.create({
    data: {
      clientId: data.clientId,
      templateId: data.templateId,
      signatureData: data.signatureData,
      signatureType: data.signatureType,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent,
      expiresAt: data.expiresAt,
    },
  })

  revalidatePath(`/app/clients/${data.clientId}`)
  return waiver
}

// ============================================
// GROOMING NOTE TEMPLATES
// ============================================

export async function getGroomingNoteTemplates() {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  return db.groomingNoteTemplate.findMany({
    where: { organizationId: user.organizationId },
    orderBy: [{ isDefault: "desc" }, { name: "asc" }],
  })
}

export async function getGroomingNoteTemplate(id: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  return db.groomingNoteTemplate.findFirst({
    where: { id, organizationId: user.organizationId },
  })
}

export async function createGroomingNoteTemplate(data: {
  name: string
  description?: string
  fields: Array<{
    name: string
    type: "text" | "textarea" | "select" | "checkbox" | "number" | "rating"
    options?: string[]
    required?: boolean
  }>
  isDefault?: boolean
}) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await db.groomingNoteTemplate.updateMany({
      where: { organizationId: user.organizationId },
      data: { isDefault: false },
    })
  }

  const template = await db.groomingNoteTemplate.create({
    data: {
      name: data.name,
      description: data.description,
      fields: data.fields,
      isDefault: data.isDefault ?? false,
      organizationId: user.organizationId,
    },
  })

  revalidatePath("/app/settings")
  return template
}

export async function updateGroomingNoteTemplate(
  id: string,
  data: {
    name?: string
    description?: string
    fields?: Array<{
      name: string
      type: string
      options?: string[]
      required?: boolean
    }>
    isDefault?: boolean
    isActive?: boolean
  }
) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  // If setting as default, unset other defaults
  if (data.isDefault) {
    await db.groomingNoteTemplate.updateMany({
      where: {
        organizationId: user.organizationId,
        id: { not: id },
      },
      data: { isDefault: false },
    })
  }

  const template = await db.groomingNoteTemplate.update({
    where: { id },
    data,
  })

  revalidatePath("/app/settings")
  return template
}

export async function deleteGroomingNoteTemplate(id: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  await db.groomingNoteTemplate.delete({
    where: { id },
  })

  revalidatePath("/app/settings")
  return { success: true }
}

// ============================================
// GROOMING NOTES
// ============================================

export async function getGroomingNotes(appointmentId: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  return db.groomingNote.findMany({
    where: {
      appointmentId,
      appointment: { organizationId: user.organizationId },
    },
    include: {
      pet: { select: { id: true, name: true } },
      template: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getPetGroomingHistory(petId: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  return db.groomingNote.findMany({
    where: {
      petId,
      pet: { client: { organizationId: user.organizationId } },
    },
    include: {
      appointment: {
        select: { id: true, dateTime: true },
      },
      template: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  })
}

export async function createGroomingNote(data: {
  appointmentId: string
  petId: string
  templateId?: string
  data: Record<string, unknown>
  additionalNotes?: string
}) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const note = await db.groomingNote.create({
    data: {
      appointmentId: data.appointmentId,
      petId: data.petId,
      templateId: data.templateId,
      data: data.data,
      additionalNotes: data.additionalNotes,
      createdById: user.id,
    },
  })

  revalidatePath(`/app/calendar`)
  return note
}

export async function updateGroomingNote(
  id: string,
  data: {
    data?: Record<string, unknown>
    additionalNotes?: string
  }
) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const note = await db.groomingNote.update({
    where: { id },
    data,
  })

  revalidatePath(`/app/calendar`)
  return note
}

// ============================================
// VACCINATION RECORDS
// ============================================

export async function getVaccinationRecords(petId: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  return db.vaccinationRecord.findMany({
    where: {
      petId,
      pet: { client: { organizationId: user.organizationId } },
    },
    orderBy: { dateAdministered: "desc" },
  })
}

export async function createVaccinationRecord(data: {
  petId: string
  name: string
  dateAdministered: Date
  expirationDate?: Date
  documentUrl?: string
  documentName?: string
  notes?: string
}) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const record = await db.vaccinationRecord.create({
    data,
  })

  revalidatePath(`/app/clients`)
  return record
}

export async function updateVaccinationRecord(
  id: string,
  data: {
    name?: string
    dateAdministered?: Date
    expirationDate?: Date
    documentUrl?: string
    documentName?: string
    notes?: string
  }
) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const record = await db.vaccinationRecord.update({
    where: { id },
    data,
  })

  revalidatePath(`/app/clients`)
  return record
}

export async function deleteVaccinationRecord(id: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  await db.vaccinationRecord.delete({
    where: { id },
  })

  revalidatePath(`/app/clients`)
  return { success: true }
}

// Get expiring vaccinations
export async function getExpiringVaccinations(daysAhead = 30) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  return db.vaccinationRecord.findMany({
    where: {
      pet: { client: { organizationId: user.organizationId } },
      expirationDate: {
        lte: futureDate,
        gte: new Date(),
      },
    },
    include: {
      pet: {
        include: {
          client: { select: { id: true, firstName: true, lastName: true, email: true } },
        },
      },
    },
    orderBy: { expirationDate: "asc" },
  })
}
