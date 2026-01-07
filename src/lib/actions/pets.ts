"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireOrganizationId } from "@/lib/auth"
import { petSchema, type PetFormData } from "@/lib/validations"

export async function getPet(id: string) {
  const organizationId = await requireOrganizationId()

  const pet = await db.pet.findFirst({
    where: {
      id,
      client: { organizationId },
    },
    include: {
      client: true,
      appointmentPets: {
        include: {
          appointment: {
            include: {
              appointmentServices: {
                include: { service: true },
              },
              payment: true,
            },
          },
        },
        orderBy: {
          appointment: { dateTime: "desc" },
        },
        take: 10,
      },
    },
  })

  return pet
}

export async function createPet(data: PetFormData) {
  const organizationId = await requireOrganizationId()
  const validated = petSchema.parse(data)

  // Verify client belongs to organization
  const client = await db.client.findFirst({
    where: { id: validated.clientId, organizationId },
  })

  if (!client) {
    throw new Error("Client not found")
  }

  const pet = await db.pet.create({
    data: {
      name: validated.name,
      species: validated.species,
      breed: validated.breed || null,
      color: validated.color || null,
      birthDate: validated.birthDate ? new Date(validated.birthDate) : null,
      weight: typeof validated.weight === "number" ? validated.weight : null,
      sex: validated.sex || null,
      coatType: validated.coatType || null,
      coatNotes: validated.coatNotes || null,
      behaviorNotes: validated.behaviorNotes || null,
      groomingPrefs: validated.groomingPrefs || null,
      vaccineNotes: validated.vaccineNotes || null,
      medicalNotes: validated.medicalNotes || null,
      clientId: validated.clientId,
    },
  })

  revalidatePath(`/app/clients/${validated.clientId}`)
  return pet
}

export async function updatePet(id: string, data: PetFormData) {
  const organizationId = await requireOrganizationId()
  const validated = petSchema.parse(data)

  // Verify pet's client belongs to organization
  const existingPet = await db.pet.findFirst({
    where: {
      id,
      client: { organizationId },
    },
  })

  if (!existingPet) {
    throw new Error("Pet not found")
  }

  const pet = await db.pet.update({
    where: { id },
    data: {
      name: validated.name,
      species: validated.species,
      breed: validated.breed || null,
      color: validated.color || null,
      birthDate: validated.birthDate ? new Date(validated.birthDate) : null,
      weight: typeof validated.weight === "number" ? validated.weight : null,
      sex: validated.sex || null,
      coatType: validated.coatType || null,
      coatNotes: validated.coatNotes || null,
      behaviorNotes: validated.behaviorNotes || null,
      groomingPrefs: validated.groomingPrefs || null,
      vaccineNotes: validated.vaccineNotes || null,
      medicalNotes: validated.medicalNotes || null,
    },
  })

  revalidatePath(`/app/pets/${id}`)
  revalidatePath(`/app/clients/${validated.clientId}`)
  return pet
}

export async function deletePet(id: string) {
  const organizationId = await requireOrganizationId()

  const pet = await db.pet.findFirst({
    where: {
      id,
      client: { organizationId },
    },
  })

  if (!pet) {
    throw new Error("Pet not found")
  }

  await db.pet.delete({
    where: { id },
  })

  revalidatePath(`/app/clients/${pet.clientId}`)
}
