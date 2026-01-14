"use server"

import { db } from "@/lib/db"
import { getUser } from "@/lib/auth"
import { formatCurrency } from "@/lib/utils"
import { format } from "date-fns"

// Email configuration (using Resend in production)
const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = process.env.FROM_EMAIL || "noreply@groomdaycrm.com"

interface EmailOptions {
  to: string
  subject: string
  html: string
  from?: string
}

async function sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // In development, log to console
  if (!RESEND_API_KEY) {
    console.log("📧 Email would be sent:")
    console.log(`  To: ${options.to}`)
    console.log(`  Subject: ${options.subject}`)
    console.log(`  From: ${options.from || FROM_EMAIL}`)
    return { success: true, messageId: "dev-" + Date.now() }
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: options.from || FROM_EMAIL,
        to: options.to,
        subject: options.subject,
        html: options.html,
      }),
    })

    const data = await response.json()

    if (!response.ok) {
      return { success: false, error: data.message || "Failed to send email" }
    }

    return { success: true, messageId: data.id }
  } catch (error) {
    console.error("Email send error:", error)
    return { success: false, error: "Failed to send email" }
  }
}

// Generate receipt email HTML
function generateReceiptHtml(data: {
  orgName: string
  orgEmail?: string
  orgPhone?: string
  orgAddress?: string
  clientName: string
  appointmentDate: Date
  services: Array<{ name: string; price: number }>
  subtotal: number
  tip: number
  total: number
  paymentMethod: string
  receiptNumber: string
}): string {
  const servicesHtml = data.services
    .map(
      (s) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${s.name}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(s.price)}</td>
      </tr>
    `
    )
    .join("")

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Receipt from ${data.orgName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 24px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">${data.orgName}</h1>
      <p style="color: #6b7280; margin: 0;">Payment Receipt</p>
    </div>

    <!-- Receipt Card -->
    <div style="background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 32px; margin-bottom: 24px;">
      <!-- Receipt Info -->
      <div style="margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
        <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Receipt #${data.receiptNumber}</p>
        <p style="margin: 0 0 8px 0; color: #111827; font-size: 16px;"><strong>${data.clientName}</strong></p>
        <p style="margin: 0; color: #6b7280; font-size: 14px;">${format(data.appointmentDate, "EEEE, MMMM d, yyyy 'at' h:mm a")}</p>
      </div>

      <!-- Services -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 12px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 500; font-size: 14px;">Service</th>
            <th style="text-align: right; padding: 12px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 500; font-size: 14px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${servicesHtml}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="margin-bottom: 24px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #6b7280;">Subtotal</span>
          <span style="color: #111827;">${formatCurrency(data.subtotal)}</span>
        </div>
        ${
          data.tip > 0
            ? `
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #6b7280;">Tip</span>
          <span style="color: #111827;">${formatCurrency(data.tip)}</span>
        </div>
        `
            : ""
        }
        <div style="display: flex; justify-content: space-between; padding: 16px 0; border-top: 2px solid #111827; margin-top: 8px;">
          <span style="font-weight: 600; font-size: 18px; color: #111827;">Total</span>
          <span style="font-weight: 600; font-size: 18px; color: #111827;">${formatCurrency(data.total)}</span>
        </div>
      </div>

      <!-- Payment Method -->
      <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">Paid via <strong style="color: #111827;">${data.paymentMethod}</strong></p>
      </div>
    </div>

    <!-- Footer -->
    <div style="text-align: center; color: #9ca3af; font-size: 14px;">
      <p style="margin: 0 0 8px 0;">Thank you for your business!</p>
      ${data.orgEmail ? `<p style="margin: 0 0 4px 0;">${data.orgEmail}</p>` : ""}
      ${data.orgPhone ? `<p style="margin: 0 0 4px 0;">${data.orgPhone}</p>` : ""}
      ${data.orgAddress ? `<p style="margin: 0;">${data.orgAddress}</p>` : ""}
    </div>
  </div>
</body>
</html>
`
}

// Send receipt email after payment
export async function sendReceiptEmail(paymentId: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const payment = await db.payment.findFirst({
    where: { id: paymentId },
    include: {
      appointment: {
        include: {
          client: true,
          appointmentServices: { include: { service: true } },
          organization: true,
        },
      },
    },
  })

  if (!payment || !payment.appointment) {
    throw new Error("Payment not found")
  }

  const { appointment } = payment
  const { client, organization } = appointment

  if (!client.email) {
    return { success: false, error: "Client has no email address" }
  }

  const services = appointment.appointmentServices.map((as) => ({
    name: as.service.name,
    price: as.price,
  }))

  const html = generateReceiptHtml({
    orgName: organization.name,
    orgEmail: organization.email || undefined,
    orgPhone: organization.phone || undefined,
    orgAddress: organization.address
      ? `${organization.address}, ${organization.city}, ${organization.state} ${organization.zipCode}`
      : undefined,
    clientName: `${client.firstName} ${client.lastName}`,
    appointmentDate: appointment.dateTime,
    services,
    subtotal: payment.amount,
    tip: payment.tipAmount,
    total: payment.totalAmount,
    paymentMethod: payment.method,
    receiptNumber: payment.id.slice(-8).toUpperCase(),
  })

  const result = await sendEmail({
    to: client.email,
    subject: `Receipt from ${organization.name}`,
    html,
  })

  // Log the email
  if (result.success) {
    await db.messageLog.create({
      data: {
        type: "EMAIL",
        recipient: client.email,
        subject: `Receipt from ${organization.name}`,
        body: "Payment receipt",
        status: "SENT",
        appointmentId: appointment.id,
        organizationId: organization.id,
        providerId: result.messageId,
      },
    })
  }

  return result
}

// Send invoice email
export async function sendInvoiceEmail(invoiceId: string) {
  const user = await getUser()
  if (!user) throw new Error("Unauthorized")

  const invoice = await db.invoice.findFirst({
    where: { id: invoiceId, organizationId: user.organizationId },
    include: {
      client: true,
      lineItems: { orderBy: { sortOrder: "asc" } },
      organization: true,
    },
  })

  if (!invoice) {
    throw new Error("Invoice not found")
  }

  if (!invoice.client.email) {
    return { success: false, error: "Client has no email address" }
  }

  const { client, organization } = invoice

  const lineItemsHtml = invoice.lineItems
    .map(
      (item) => `
      <tr>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb;">${item.description}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.unitPrice)}</td>
        <td style="padding: 12px 0; border-bottom: 1px solid #e5e7eb; text-align: right;">${formatCurrency(item.amount)}</td>
      </tr>
    `
    )
    .join("")

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invoice from ${organization.name}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <h1 style="font-size: 24px; font-weight: 600; color: #111827; margin: 0 0 8px 0;">${organization.name}</h1>
      <p style="color: #6b7280; margin: 0;">Invoice</p>
    </div>

    <!-- Invoice Card -->
    <div style="background: white; border-radius: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); padding: 32px; margin-bottom: 24px;">
      <!-- Invoice Info -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 24px; padding-bottom: 24px; border-bottom: 1px solid #e5e7eb;">
        <div>
          <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Bill To:</p>
          <p style="margin: 0; color: #111827; font-size: 16px;"><strong>${client.firstName} ${client.lastName}</strong></p>
          ${client.email ? `<p style="margin: 4px 0 0 0; color: #6b7280; font-size: 14px;">${client.email}</p>` : ""}
        </div>
        <div style="text-align: right;">
          <p style="margin: 0 0 4px 0; color: #111827; font-weight: 600;">${invoice.invoiceNumber}</p>
          <p style="margin: 0 0 4px 0; color: #6b7280; font-size: 14px;">Issued: ${format(invoice.issueDate, "MMM d, yyyy")}</p>
          ${invoice.dueDate ? `<p style="margin: 0; color: #6b7280; font-size: 14px;">Due: ${format(invoice.dueDate, "MMM d, yyyy")}</p>` : ""}
        </div>
      </div>

      <!-- Line Items -->
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
        <thead>
          <tr>
            <th style="text-align: left; padding: 12px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 500; font-size: 14px;">Description</th>
            <th style="text-align: center; padding: 12px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 500; font-size: 14px;">Qty</th>
            <th style="text-align: right; padding: 12px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 500; font-size: 14px;">Price</th>
            <th style="text-align: right; padding: 12px 0; border-bottom: 2px solid #e5e7eb; color: #6b7280; font-weight: 500; font-size: 14px;">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${lineItemsHtml}
        </tbody>
      </table>

      <!-- Totals -->
      <div style="margin-left: auto; max-width: 250px;">
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #6b7280;">Subtotal</span>
          <span style="color: #111827;">${formatCurrency(invoice.subtotal)}</span>
        </div>
        ${
          invoice.taxAmount > 0
            ? `
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #6b7280;">Tax (${invoice.taxRate}%)</span>
          <span style="color: #111827;">${formatCurrency(invoice.taxAmount)}</span>
        </div>
        `
            : ""
        }
        ${
          invoice.discountAmount > 0
            ? `
        <div style="display: flex; justify-content: space-between; padding: 8px 0;">
          <span style="color: #6b7280;">Discount</span>
          <span style="color: #10b981;">-${formatCurrency(invoice.discountAmount)}</span>
        </div>
        `
            : ""
        }
        <div style="display: flex; justify-content: space-between; padding: 16px 0; border-top: 2px solid #111827; margin-top: 8px;">
          <span style="font-weight: 600; font-size: 18px; color: #111827;">Total Due</span>
          <span style="font-weight: 600; font-size: 18px; color: #111827;">${formatCurrency(invoice.balanceDue)}</span>
        </div>
      </div>

      ${
        invoice.notes
          ? `
      <div style="margin-top: 24px; padding: 16px; background: #f3f4f6; border-radius: 8px;">
        <p style="margin: 0; color: #6b7280; font-size: 14px;">${invoice.notes}</p>
      </div>
      `
          : ""
      }
    </div>

    <!-- Footer -->
    <div style="text-align: center; color: #9ca3af; font-size: 14px;">
      <p style="margin: 0 0 8px 0;">Thank you for your business!</p>
      ${organization.email ? `<p style="margin: 0 0 4px 0;">${organization.email}</p>` : ""}
      ${organization.phone ? `<p style="margin: 0;">${organization.phone}</p>` : ""}
    </div>
  </div>
</body>
</html>
`

  const result = await sendEmail({
    to: client.email,
    subject: `Invoice ${invoice.invoiceNumber} from ${organization.name}`,
    html,
  })

  // Update invoice status to SENT
  if (result.success && invoice.status === "DRAFT") {
    await db.invoice.update({
      where: { id: invoiceId },
      data: { status: "SENT" },
    })
  }

  // Log the email
  if (result.success) {
    await db.messageLog.create({
      data: {
        type: "EMAIL",
        recipient: client.email,
        subject: `Invoice ${invoice.invoiceNumber} from ${organization.name}`,
        body: "Invoice",
        status: "SENT",
        organizationId: organization.id,
        providerId: result.messageId,
      },
    })
  }

  return result
}
