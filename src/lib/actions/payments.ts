"use server"

import { revalidatePath } from "next/cache"
import { db } from "@/lib/db"
import { requireOrganizationId } from "@/lib/auth"
import { paymentSchema, type PaymentFormData } from "@/lib/validations"

export async function recordPayment(data: PaymentFormData) {
  const organizationId = await requireOrganizationId()
  const validated = paymentSchema.parse(data)

  // Verify appointment belongs to organization
  const appointment = await db.appointment.findFirst({
    where: { id: validated.appointmentId, organizationId },
  })

  if (!appointment) {
    throw new Error("Appointment not found")
  }

  const totalAmount = validated.amount + validated.tipAmount

  const payment = await db.payment.create({
    data: {
      appointmentId: validated.appointmentId,
      amount: validated.amount,
      tipAmount: validated.tipAmount,
      totalAmount,
      method: validated.method,
      status: "PAID",
      paidAt: new Date(),
      receiptNote: validated.receiptNote || null,
    },
  })

  // Update appointment totals
  await db.appointment.update({
    where: { id: validated.appointmentId },
    data: {
      tipAmount: validated.tipAmount,
      totalAmount,
    },
  })

  revalidatePath("/app")
  revalidatePath("/app/calendar")
  revalidatePath(`/app/appointments/${validated.appointmentId}`)
  return payment
}

export async function updatePayment(id: string, data: Partial<PaymentFormData>) {
  const organizationId = await requireOrganizationId()

  const payment = await db.payment.findFirst({
    where: { id },
    include: { appointment: true },
  })

  if (!payment || payment.appointment.organizationId !== organizationId) {
    throw new Error("Payment not found")
  }

  const updatedPayment = await db.payment.update({
    where: { id },
    data: {
      ...(data.amount !== undefined && { amount: data.amount }),
      ...(data.tipAmount !== undefined && { tipAmount: data.tipAmount }),
      ...(data.method && { method: data.method }),
      ...(data.receiptNote !== undefined && { receiptNote: data.receiptNote }),
      totalAmount:
        (data.amount ?? payment.amount) + (data.tipAmount ?? payment.tipAmount),
    },
  })

  revalidatePath("/app")
  revalidatePath(`/app/appointments/${payment.appointmentId}`)
  return updatedPayment
}

export async function deletePayment(id: string) {
  const organizationId = await requireOrganizationId()

  const payment = await db.payment.findFirst({
    where: { id },
    include: { appointment: true },
  })

  if (!payment || payment.appointment.organizationId !== organizationId) {
    throw new Error("Payment not found")
  }

  await db.payment.delete({ where: { id } })

  // Reset appointment totals
  await db.appointment.update({
    where: { id: payment.appointmentId },
    data: {
      tipAmount: 0,
      totalAmount: payment.appointment.subtotal,
    },
  })

  revalidatePath("/app")
  revalidatePath(`/app/appointments/${payment.appointmentId}`)
}

export async function getRevenueStats(startDate: Date, endDate: Date) {
  const organizationId = await requireOrganizationId()

  const payments = await db.payment.findMany({
    where: {
      status: "PAID",
      paidAt: {
        gte: startDate,
        lte: endDate,
      },
      appointment: { organizationId },
    },
  })

  const totalRevenue = payments.reduce((sum, p) => sum + p.amount, 0)
  const totalTips = payments.reduce((sum, p) => sum + p.tipAmount, 0)
  const appointmentCount = payments.length

  return {
    totalRevenue,
    totalTips,
    appointmentCount,
    averageTicket: appointmentCount > 0 ? totalRevenue / appointmentCount : 0,
  }
}
