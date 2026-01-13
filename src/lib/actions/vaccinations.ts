"use server"

import { db } from "@/lib/db"
import { requireOrganizationId } from "@/lib/auth"
import { revalidatePath } from "next/cache"

export async function getVaccinationsForPet(petId: string) {
  const organizationId = await requireOrganizationId()

  // Verify pet belongs to this organization
  const pet = await db.pet.findFirst({
    where: {
      id: petId,
      client: { organizationId },
    },
  })

  if (!pet) {
    throw new Error("Pet not found")
  }

  const vaccinations = await db.vaccinationRecord.findMany({
    where: { petId },
    orderBy: { expirationDate: "asc" },
  })

  return vaccinations
}

export async function createVaccination(data: {
  petId: string
  name: string
  dateAdministered: string
  expirationDate?: string
  documentUrl?: string
  documentName?: string
  notes?: string
}) {
  const organizationId = await requireOrganizationId()

  // Verify pet belongs to this organization
  const pet = await db.pet.findFirst({
    where: {
      id: data.petId,
      client: { organizationId },
    },
  })

  if (!pet) {
    throw new Error("Pet not found")
  }

  const vaccination = await db.vaccinationRecord.create({
    data: {
      name: data.name,
      dateAdministered: new Date(data.dateAdministered),
      expirationDate: data.expirationDate ? new Date(data.expirationDate) : null,
      documentUrl: data.documentUrl,
      documentName: data.documentName,
      notes: data.notes,
      petId: data.petId,
    },
  })

  revalidatePath(`/app/pets/${data.petId}`)
  return vaccination
}

export async function updateVaccination(
  id: string,
  data: {
    name?: string
    dateAdministered?: string
    expirationDate?: string | null
    documentUrl?: string | null
    documentName?: string | null
    notes?: string | null
  }
) {
  const organizationId = await requireOrganizationId()

  // Verify vaccination belongs to this organization
  const vaccination = await db.vaccinationRecord.findFirst({
    where: {
      id,
      pet: { client: { organizationId } },
    },
  })

  if (!vaccination) {
    throw new Error("Vaccination record not found")
  }

  const updated = await db.vaccinationRecord.update({
    where: { id },
    data: {
      name: data.name,
      dateAdministered: data.dateAdministered ? new Date(data.dateAdministered) : undefined,
      expirationDate: data.expirationDate ? new Date(data.expirationDate) : data.expirationDate === null ? null : undefined,
      documentUrl: data.documentUrl,
      documentName: data.documentName,
      notes: data.notes,
    },
  })

  revalidatePath(`/app/pets/${vaccination.petId}`)
  return updated
}

export async function deleteVaccination(id: string) {
  const organizationId = await requireOrganizationId()

  // Verify vaccination belongs to this organization
  const vaccination = await db.vaccinationRecord.findFirst({
    where: {
      id,
      pet: { client: { organizationId } },
    },
  })

  if (!vaccination) {
    throw new Error("Vaccination record not found")
  }

  await db.vaccinationRecord.delete({
    where: { id },
  })

  revalidatePath(`/app/pets/${vaccination.petId}`)
}

export async function getExpiringVaccinations(daysAhead: number = 30) {
  const organizationId = await requireOrganizationId()

  const futureDate = new Date()
  futureDate.setDate(futureDate.getDate() + daysAhead)

  const expiring = await db.vaccinationRecord.findMany({
    where: {
      pet: { client: { organizationId } },
      expirationDate: {
        lte: futureDate,
        gte: new Date(),
      },
    },
    include: {
      pet: {
        include: {
          client: true,
        },
      },
    },
    orderBy: { expirationDate: "asc" },
  })

  return expiring
}

export async function getExpiredVaccinations() {
  const organizationId = await requireOrganizationId()

  const expired = await db.vaccinationRecord.findMany({
    where: {
      pet: { client: { organizationId } },
      expirationDate: {
        lt: new Date(),
      },
    },
    include: {
      pet: {
        include: {
          client: true,
        },
      },
    },
    orderBy: { expirationDate: "asc" },
  })

  return expired
}
