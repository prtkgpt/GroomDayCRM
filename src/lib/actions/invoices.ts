"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { getUser } from "@/lib/auth"

// Generate invoice number
async function generateInvoiceNumber(organizationId: string): Promise<string> {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`

  // Get the highest invoice number for this year
  const lastInvoice = await db.invoice.findFirst({
    where: {
      organizationId,
      invoiceNumber: { startsWith: prefix },
    },
    orderBy: { invoiceNumber: "desc" },
  })

  let nextNumber = 1
  if (lastInvoice) {
    const lastNumber = parseInt(lastInvoice.invoiceNumber.replace(prefix, ""), 10)
    nextNumber = lastNumber + 1
  }

  return `${prefix}${nextNumber.toString().padStart(4, "0")}`
}

// ============================================
// INVOICES
// ============================================

export async function getInvoices(filters?: {
  status?: string
  clientId?: string
  startDate?: Date
  endDate?: Date
}) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const where: Record<string, unknown> = {
    organizationId: user.organizationId,
  }

  if (filters?.status) {
    where.status = filters.status
  }
  if (filters?.clientId) {
    where.clientId = filters.clientId
  }
  if (filters?.startDate || filters?.endDate) {
    where.issueDate = {}
    if (filters?.startDate) {
      (where.issueDate as Record<string, Date>).gte = filters.startDate
    }
    if (filters?.endDate) {
      (where.issueDate as Record<string, Date>).lte = filters.endDate
    }
  }

  return db.invoice.findMany({
    where,
    include: {
      client: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
      lineItems: true,
    },
    orderBy: { createdAt: "desc" },
  })
}

export async function getInvoice(id: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  return db.invoice.findFirst({
    where: { id, organizationId: user.organizationId },
    include: {
      client: true,
      appointment: {
        include: {
          appointmentServices: { include: { service: true } },
          appointmentPets: { include: { pet: true } },
        },
      },
      lineItems: { orderBy: { sortOrder: "asc" } },
      organization: {
        select: {
          name: true,
          email: true,
          phone: true,
          address: true,
          city: true,
          state: true,
          zipCode: true,
          logoUrl: true,
        },
      },
    },
  })
}

export async function createInvoice(data: {
  clientId: string
  appointmentId?: string
  dueDate?: Date
  notes?: string
  lineItems: Array<{
    description: string
    quantity: number
    unitPrice: number
  }>
  taxRate?: number
  discountAmount?: number
}) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const invoiceNumber = await generateInvoiceNumber(user.organizationId)

  // Calculate totals
  const subtotal = data.lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const taxRate = data.taxRate ?? 0
  const taxAmount = subtotal * (taxRate / 100)
  const discountAmount = data.discountAmount ?? 0
  const totalAmount = subtotal + taxAmount - discountAmount

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      clientId: data.clientId,
      appointmentId: data.appointmentId,
      dueDate: data.dueDate,
      notes: data.notes,
      subtotal,
      taxRate,
      taxAmount,
      discountAmount,
      totalAmount,
      balanceDue: totalAmount,
      organizationId: user.organizationId,
      lineItems: {
        create: data.lineItems.map((item, index) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          amount: item.quantity * item.unitPrice,
          sortOrder: index,
        })),
      },
    },
    include: {
      lineItems: true,
      client: true,
    },
  })

  revalidatePath("/app/invoices")
  return invoice
}

export async function createInvoiceFromAppointment(appointmentId: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  // Get appointment with services
  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, organizationId: user.organizationId },
    include: {
      client: true,
      appointmentServices: { include: { service: true } },
      appointmentPets: { include: { pet: true } },
    },
  })

  if (!appointment) throw new Error("Appointment not found")

  // Check if invoice already exists
  const existingInvoice = await db.invoice.findFirst({
    where: { appointmentId },
  })

  if (existingInvoice) {
    return existingInvoice
  }

  // Create line items from services
  const lineItems = appointment.appointmentServices.map((as, index) => ({
    description: as.service.name,
    quantity: 1,
    unitPrice: as.price,
    amount: as.price,
    sortOrder: index,
  }))

  const invoiceNumber = await generateInvoiceNumber(user.organizationId)
  const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0)

  const invoice = await db.invoice.create({
    data: {
      invoiceNumber,
      clientId: appointment.clientId,
      appointmentId,
      subtotal,
      totalAmount: subtotal,
      balanceDue: subtotal,
      organizationId: user.organizationId,
      lineItems: {
        create: lineItems,
      },
    },
    include: {
      lineItems: true,
      client: true,
    },
  })

  revalidatePath("/app/invoices")
  revalidatePath("/app/calendar")
  return invoice
}

export async function updateInvoice(
  id: string,
  data: {
    dueDate?: Date
    notes?: string
    internalNotes?: string
    taxRate?: number
    discountAmount?: number
    lineItems?: Array<{
      id?: string
      description: string
      quantity: number
      unitPrice: number
    }>
  }
) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  // Get current invoice
  const invoice = await db.invoice.findFirst({
    where: { id, organizationId: user.organizationId },
    include: { lineItems: true },
  })

  if (!invoice) throw new Error("Invoice not found")

  // If updating line items, delete old ones and create new ones
  if (data.lineItems) {
    await db.invoiceLineItem.deleteMany({
      where: { invoiceId: id },
    })

    await db.invoiceLineItem.createMany({
      data: data.lineItems.map((item, index) => ({
        invoiceId: id,
        description: item.description,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        amount: item.quantity * item.unitPrice,
        sortOrder: index,
      })),
    })
  }

  // Recalculate totals
  const lineItems = data.lineItems ?? invoice.lineItems
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.quantity * item.unitPrice,
    0
  )
  const taxRate = data.taxRate ?? invoice.taxRate
  const taxAmount = subtotal * (taxRate / 100)
  const discountAmount = data.discountAmount ?? invoice.discountAmount
  const totalAmount = subtotal + taxAmount - discountAmount
  const balanceDue = totalAmount - invoice.amountPaid

  const updated = await db.invoice.update({
    where: { id },
    data: {
      dueDate: data.dueDate,
      notes: data.notes,
      internalNotes: data.internalNotes,
      taxRate,
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      balanceDue,
    },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      client: true,
    },
  })

  revalidatePath("/app/invoices")
  return updated
}

export async function updateInvoiceStatus(
  id: string,
  status: "DRAFT" | "SENT" | "VIEWED" | "PAID" | "PARTIALLY_PAID" | "OVERDUE" | "CANCELLED" | "REFUNDED"
) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const updateData: Record<string, unknown> = { status }

  if (status === "PAID") {
    const invoice = await db.invoice.findFirst({
      where: { id, organizationId: user.organizationId },
    })
    if (invoice) {
      updateData.amountPaid = invoice.totalAmount
      updateData.balanceDue = 0
      updateData.paidDate = new Date()
    }
  }

  const updated = await db.invoice.update({
    where: { id },
    data: updateData,
  })

  revalidatePath("/app/invoices")
  return updated
}

export async function recordInvoicePayment(
  id: string,
  amount: number
) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const invoice = await db.invoice.findFirst({
    where: { id, organizationId: user.organizationId },
  })

  if (!invoice) throw new Error("Invoice not found")

  const newAmountPaid = invoice.amountPaid + amount
  const newBalanceDue = invoice.totalAmount - newAmountPaid
  const isPaid = newBalanceDue <= 0

  const updated = await db.invoice.update({
    where: { id },
    data: {
      amountPaid: newAmountPaid,
      balanceDue: Math.max(0, newBalanceDue),
      status: isPaid ? "PAID" : "PARTIALLY_PAID",
      paidDate: isPaid ? new Date() : null,
    },
  })

  revalidatePath("/app/invoices")
  return updated
}

export async function deleteInvoice(id: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  // Only allow deleting draft invoices
  const invoice = await db.invoice.findFirst({
    where: { id, organizationId: user.organizationId },
  })

  if (!invoice) throw new Error("Invoice not found")
  if (invoice.status !== "DRAFT") {
    throw new Error("Only draft invoices can be deleted")
  }

  await db.invoice.delete({
    where: { id },
  })

  revalidatePath("/app/invoices")
  return { success: true }
}

// Get invoice statistics
export async function getInvoiceStats() {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const [
    totalOutstanding,
    totalPaidThisMonth,
    overdueCount,
    draftCount,
  ] = await Promise.all([
    db.invoice.aggregate({
      where: {
        organizationId: user.organizationId,
        status: { in: ["SENT", "VIEWED", "PARTIALLY_PAID", "OVERDUE"] },
      },
      _sum: { balanceDue: true },
    }),
    db.invoice.aggregate({
      where: {
        organizationId: user.organizationId,
        status: "PAID",
        paidDate: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        },
      },
      _sum: { totalAmount: true },
    }),
    db.invoice.count({
      where: {
        organizationId: user.organizationId,
        status: "OVERDUE",
      },
    }),
    db.invoice.count({
      where: {
        organizationId: user.organizationId,
        status: "DRAFT",
      },
    }),
  ])

  return {
    totalOutstanding: totalOutstanding._sum.balanceDue ?? 0,
    totalPaidThisMonth: totalPaidThisMonth._sum.totalAmount ?? 0,
    overdueCount,
    draftCount,
  }
}
