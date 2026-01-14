"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireOrganizationId } from "@/lib/auth"
import { z } from "zod"

// Validation schemas
const inventoryItemSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  sku: z.string().optional(),
  category: z.string().optional(),
  quantity: z.number().min(0).default(0),
  unit: z.string().default("units"),
  lowStockThreshold: z.number().min(0).default(5),
  costPrice: z.number().min(0).optional(),
  sellPrice: z.number().min(0).optional(),
  supplier: z.string().optional(),
  supplierSku: z.string().optional(),
  reorderUrl: z.string().optional(),
})

export type InventoryItemFormData = z.infer<typeof inventoryItemSchema>

const transactionSchema = z.object({
  itemId: z.string(),
  type: z.enum(["PURCHASE", "ADJUSTMENT", "RETURN", "DAMAGED", "USED", "SOLD"]),
  quantity: z.number(),
  notes: z.string().optional(),
  unitCost: z.number().optional(),
  totalCost: z.number().optional(),
  invoiceNumber: z.string().optional(),
})

export type TransactionFormData = z.infer<typeof transactionSchema>

export async function getInventoryItems(options?: {
  category?: string
  lowStockOnly?: boolean
  search?: string
}) {
  const organizationId = await requireOrganizationId()

  const items = await db.inventoryItem.findMany({
    where: {
      organizationId,
      isActive: true,
      ...(options?.category && { category: options.category }),
      ...(options?.search && {
        OR: [
          { name: { contains: options.search, mode: "insensitive" as const } },
          { sku: { contains: options.search, mode: "insensitive" as const } },
          { description: { contains: options.search, mode: "insensitive" as const } },
        ],
      }),
    },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 5,
      },
    },
    orderBy: { name: "asc" },
  })

  // Filter low stock items client-side if requested
  if (options?.lowStockOnly) {
    return items.filter((item) => item.quantity <= item.lowStockThreshold)
  }

  return items
}

export async function getLowStockItems() {
  const organizationId = await requireOrganizationId()

  const items = await db.inventoryItem.findMany({
    where: {
      organizationId,
      isActive: true,
    },
    orderBy: { name: "asc" },
  })

  // Filter items where quantity is at or below threshold
  return items.filter((item) => item.quantity <= item.lowStockThreshold)
}

export async function getInventoryItem(id: string) {
  const organizationId = await requireOrganizationId()

  const item = await db.inventoryItem.findFirst({
    where: { id, organizationId },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      usageRecords: {
        orderBy: { createdAt: "desc" },
        take: 20,
        include: {
          appointment: {
            include: {
              client: true,
            },
          },
        },
      },
    },
  })

  return item
}

export async function createInventoryItem(data: InventoryItemFormData) {
  const organizationId = await requireOrganizationId()
  const validated = inventoryItemSchema.parse(data)

  const item = await db.inventoryItem.create({
    data: {
      ...validated,
      organizationId,
    },
  })

  // Create initial stock transaction if quantity > 0
  if (validated.quantity > 0) {
    await db.inventoryTransaction.create({
      data: {
        itemId: item.id,
        type: "PURCHASE",
        quantity: validated.quantity,
        notes: "Initial stock",
        unitCost: validated.costPrice,
        totalCost: validated.costPrice
          ? validated.costPrice * validated.quantity
          : undefined,
      },
    })
  }

  revalidatePath("/app/inventory")
  return item
}

export async function updateInventoryItem(id: string, data: Partial<InventoryItemFormData>) {
  const organizationId = await requireOrganizationId()

  const updateData: any = {}

  if (data.name !== undefined) updateData.name = data.name
  if (data.description !== undefined) updateData.description = data.description
  if (data.sku !== undefined) updateData.sku = data.sku
  if (data.category !== undefined) updateData.category = data.category
  if (data.unit !== undefined) updateData.unit = data.unit
  if (data.lowStockThreshold !== undefined) updateData.lowStockThreshold = data.lowStockThreshold
  if (data.costPrice !== undefined) updateData.costPrice = data.costPrice
  if (data.sellPrice !== undefined) updateData.sellPrice = data.sellPrice
  if (data.supplier !== undefined) updateData.supplier = data.supplier
  if (data.supplierSku !== undefined) updateData.supplierSku = data.supplierSku
  if (data.reorderUrl !== undefined) updateData.reorderUrl = data.reorderUrl

  const item = await db.inventoryItem.update({
    where: { id, organizationId },
    data: updateData,
  })

  revalidatePath("/app/inventory")
  revalidatePath(`/app/inventory/${id}`)
  return item
}

export async function deleteInventoryItem(id: string) {
  const organizationId = await requireOrganizationId()

  // Soft delete by setting isActive to false
  await db.inventoryItem.update({
    where: { id, organizationId },
    data: { isActive: false },
  })

  revalidatePath("/app/inventory")
}

export async function addInventoryTransaction(data: TransactionFormData) {
  const organizationId = await requireOrganizationId()
  const validated = transactionSchema.parse(data)

  // Verify item belongs to organization
  const item = await db.inventoryItem.findFirst({
    where: { id: validated.itemId, organizationId },
  })

  if (!item) {
    throw new Error("Item not found")
  }

  // Create transaction
  const transaction = await db.inventoryTransaction.create({
    data: {
      itemId: validated.itemId,
      type: validated.type,
      quantity: validated.quantity,
      notes: validated.notes,
      unitCost: validated.unitCost,
      totalCost: validated.totalCost,
      invoiceNumber: validated.invoiceNumber,
    },
  })

  // Update item quantity
  await db.inventoryItem.update({
    where: { id: validated.itemId },
    data: {
      quantity: { increment: validated.quantity },
    },
  })

  revalidatePath("/app/inventory")
  revalidatePath(`/app/inventory/${validated.itemId}`)
  return transaction
}

export async function recordInventoryUsage(
  appointmentId: string,
  items: { itemId: string; quantity: number }[]
) {
  const organizationId = await requireOrganizationId()

  // Verify appointment belongs to organization
  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, organizationId },
  })

  if (!appointment) {
    throw new Error("Appointment not found")
  }

  // Create usage records and update quantities
  for (const usage of items) {
    await db.inventoryUsage.create({
      data: {
        itemId: usage.itemId,
        appointmentId,
        quantity: usage.quantity,
      },
    })

    // Create transaction
    await db.inventoryTransaction.create({
      data: {
        itemId: usage.itemId,
        type: "USED",
        quantity: -usage.quantity,
        notes: `Used in appointment ${appointmentId}`,
      },
    })

    // Update item quantity
    await db.inventoryItem.update({
      where: { id: usage.itemId },
      data: {
        quantity: { decrement: usage.quantity },
      },
    })
  }

  revalidatePath("/app/inventory")
  revalidatePath(`/app/appointments/${appointmentId}`)
}

export async function getInventoryCategories() {
  const organizationId = await requireOrganizationId()

  const categories = await db.inventoryItem.findMany({
    where: { organizationId, isActive: true, category: { not: null } },
    select: { category: true },
    distinct: ["category"],
  })

  return categories.map((c) => c.category).filter(Boolean) as string[]
}

export async function getInventoryStats() {
  const organizationId = await requireOrganizationId()

  const items = await db.inventoryItem.findMany({
    where: { organizationId, isActive: true },
  })

  const totalItems = items.length
  const lowStockItems = items.filter((item) => item.quantity <= item.lowStockThreshold).length
  const outOfStockItems = items.filter((item) => item.quantity === 0).length
  const totalValue = items.reduce(
    (sum, item) => sum + (item.costPrice || 0) * item.quantity,
    0
  )

  return {
    totalItems,
    lowStockItems,
    outOfStockItems,
    totalValue,
  }
}
