"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireOrganizationId } from "@/lib/auth"
import { serviceSchema, type ServiceFormData } from "@/lib/validations"

export async function getServices(includeInactive = false) {
  const organizationId = await requireOrganizationId()

  const services = await db.service.findMany({
    where: {
      organizationId,
      ...(includeInactive ? {} : { isActive: true }),
    },
    orderBy: [{ isAddOn: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  })

  return services
}

export async function getService(id: string) {
  const organizationId = await requireOrganizationId()

  const service = await db.service.findFirst({
    where: { id, organizationId },
  })

  return service
}

export async function createService(data: ServiceFormData) {
  const organizationId = await requireOrganizationId()
  const validated = serviceSchema.parse(data)

  // Get max sort order
  const maxOrder = await db.service.findFirst({
    where: { organizationId },
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  })

  const service = await db.service.create({
    data: {
      ...validated,
      sortOrder: (maxOrder?.sortOrder ?? 0) + 1,
      organizationId,
    },
  })

  revalidatePath("/app/services")
  return service
}

export async function updateService(id: string, data: ServiceFormData) {
  const organizationId = await requireOrganizationId()
  const validated = serviceSchema.parse(data)

  const service = await db.service.update({
    where: { id, organizationId },
    data: validated,
  })

  revalidatePath("/app/services")
  return service
}

export async function deleteService(id: string) {
  const organizationId = await requireOrganizationId()

  // Check if service is used in any appointments
  const usageCount = await db.appointmentService.count({
    where: { serviceId: id },
  })

  if (usageCount > 0) {
    // Soft delete - just mark as inactive
    await db.service.update({
      where: { id, organizationId },
      data: { isActive: false },
    })
  } else {
    await db.service.delete({
      where: { id, organizationId },
    })
  }

  revalidatePath("/app/services")
}

export async function reorderServices(orderedIds: string[]) {
  const organizationId = await requireOrganizationId()

  await Promise.all(
    orderedIds.map((id, index) =>
      db.service.update({
        where: { id, organizationId },
        data: { sortOrder: index },
      })
    )
  )

  revalidatePath("/app/services")
}
