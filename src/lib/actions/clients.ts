"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireOrganizationId } from "@/lib/auth"
import { clientSchema, type ClientFormData } from "@/lib/validations"

export async function getClients(search?: string) {
  const organizationId = await requireOrganizationId()

  const clients = await db.client.findMany({
    where: {
      organizationId,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
        ],
      }),
    },
    include: {
      pets: true,
      _count: {
        select: { appointments: true },
      },
    },
    orderBy: { lastName: "asc" },
  })

  return clients
}

export async function getClient(id: string) {
  const organizationId = await requireOrganizationId()

  const client = await db.client.findFirst({
    where: { id, organizationId },
    include: {
      pets: {
        include: {
          appointmentPets: {
            include: {
              appointment: {
                include: {
                  appointmentServices: {
                    include: { service: true },
                  },
                },
              },
            },
            orderBy: {
              appointment: { dateTime: "desc" },
            },
            take: 5,
          },
        },
      },
      appointments: {
        orderBy: { dateTime: "desc" },
        take: 10,
        include: {
          appointmentPets: {
            include: { pet: true },
          },
          appointmentServices: {
            include: { service: true },
          },
          payment: true,
        },
      },
    },
  })

  return client
}

export async function createClient(data: ClientFormData) {
  const organizationId = await requireOrganizationId()
  const validated = clientSchema.parse(data)

  const client = await db.client.create({
    data: {
      ...validated,
      email: validated.email || null,
      tags: validated.tags || [],
      organizationId,
    },
  })

  revalidatePath("/app/clients")
  return client
}

export async function updateClient(id: string, data: ClientFormData) {
  const organizationId = await requireOrganizationId()
  const validated = clientSchema.parse(data)

  const client = await db.client.update({
    where: { id, organizationId },
    data: {
      ...validated,
      email: validated.email || null,
      tags: validated.tags || [],
    },
  })

  revalidatePath("/app/clients")
  revalidatePath(`/app/clients/${id}`)
  return client
}

export async function deleteClient(id: string) {
  const organizationId = await requireOrganizationId()

  await db.client.delete({
    where: { id, organizationId },
  })

  revalidatePath("/app/clients")
}

export async function searchClients(query: string) {
  const organizationId = await requireOrganizationId()

  if (!query || query.length < 2) return []

  const clients = await db.client.findMany({
    where: {
      organizationId,
      OR: [
        { firstName: { contains: query, mode: "insensitive" } },
        { lastName: { contains: query, mode: "insensitive" } },
        { email: { contains: query, mode: "insensitive" } },
        { phone: { contains: query, mode: "insensitive" } },
        {
          pets: {
            some: { name: { contains: query, mode: "insensitive" } },
          },
        },
      ],
    },
    include: {
      pets: true,
    },
    take: 10,
    orderBy: { lastName: "asc" },
  })

  return clients
}
