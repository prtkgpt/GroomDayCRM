"use server"

import { db } from "@/lib/db"
import { requireOrganizationId } from "@/lib/auth"
import { getStripeClient, getStripeClientBySlug } from "@/lib/stripe"
import { revalidatePath } from "next/cache"

// Create a checkout session for an appointment
export async function createCheckoutSession(appointmentId: string) {
  const organizationId = await requireOrganizationId()

  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, organizationId },
    include: {
      client: true,
      appointmentPets: { include: { pet: true } },
      appointmentServices: { include: { service: true } },
      organization: true,
      payment: true,
    },
  })

  if (!appointment) {
    throw new Error("Appointment not found")
  }

  if (appointment.payment) {
    throw new Error("Appointment already has a payment")
  }

  const stripe = await getStripeClient(organizationId)
  if (!stripe) {
    throw new Error("Stripe is not configured. Add your Stripe keys in Settings > Integrations.")
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.groomdaycrm.com"
  const petNames = appointment.appointmentPets.map((ap) => ap.pet.name).join(", ")

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: appointment.appointmentServices.map((as) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: as.service.name,
          description: `Grooming service for ${petNames}`,
        },
        unit_amount: Math.round(as.price * 100), // Stripe uses cents
      },
      quantity: 1,
    })),
    mode: "payment",
    success_url: `${baseUrl}/app/appointments/${appointmentId}?payment=success`,
    cancel_url: `${baseUrl}/app/appointments/${appointmentId}?payment=cancelled`,
    customer_email: appointment.client.email || undefined,
    metadata: {
      appointmentId: appointment.id,
      organizationId: organizationId,
      type: "appointment_payment",
    },
  })

  return { url: session.url }
}

// Create a payment link to send to customer
export async function createPaymentLink(appointmentId: string) {
  const organizationId = await requireOrganizationId()

  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, organizationId },
    include: {
      client: true,
      appointmentPets: { include: { pet: true } },
      appointmentServices: { include: { service: true } },
      organization: true,
    },
  })

  if (!appointment) {
    throw new Error("Appointment not found")
  }

  const stripe = await getStripeClient(organizationId)
  if (!stripe) {
    throw new Error("Stripe is not configured")
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.groomdaycrm.com"
  const petNames = appointment.appointmentPets.map((ap) => ap.pet.name).join(", ")

  // Create a price for the total amount
  const price = await stripe.prices.create({
    currency: "usd",
    unit_amount: Math.round(appointment.totalAmount * 100),
    product_data: {
      name: `Grooming Services - ${petNames}`,
      metadata: {
        appointmentId: appointment.id,
      },
    },
  })

  // Create payment link
  const paymentLink = await stripe.paymentLinks.create({
    line_items: [{ price: price.id, quantity: 1 }],
    metadata: {
      appointmentId: appointment.id,
      organizationId: organizationId,
      type: "appointment_payment",
    },
    after_completion: {
      type: "redirect",
      redirect: {
        url: `${baseUrl}/${appointment.organization.slug}/portal/dashboard?payment=success`,
      },
    },
  })

  return { url: paymentLink.url }
}

// Create checkout session for public booking with deposit/prepayment
export async function createBookingCheckoutSession(
  slug: string,
  appointmentId: string,
  amount: number
) {
  const { stripe, organization } = await getStripeClientBySlug(slug)

  if (!stripe || !organization) {
    throw new Error("Payment processing is not available")
  }

  const appointment = await db.appointment.findFirst({
    where: { id: appointmentId, organizationId: organization.id },
    include: {
      client: true,
      appointmentPets: { include: { pet: true } },
      appointmentServices: { include: { service: true } },
    },
  })

  if (!appointment) {
    throw new Error("Appointment not found")
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.groomdaycrm.com"
  const petNames = appointment.appointmentPets.map((ap) => ap.pet.name).join(", ")

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [{
      price_data: {
        currency: "usd",
        product_data: {
          name: `Grooming Appointment - ${petNames}`,
          description: appointment.appointmentServices.map((as) => as.service.name).join(", "),
        },
        unit_amount: Math.round(amount * 100),
      },
      quantity: 1,
    }],
    mode: "payment",
    success_url: `${baseUrl}/${slug}/book/confirmation?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/${slug}/book?cancelled=true`,
    customer_email: appointment.client.email || undefined,
    metadata: {
      appointmentId: appointment.id,
      organizationId: organization.id,
      type: "booking_payment",
    },
  })

  return { url: session.url, sessionId: session.id }
}

// Verify a checkout session was paid (for confirmation page)
export async function verifyCheckoutSession(slug: string, sessionId: string) {
  const { stripe, organization } = await getStripeClientBySlug(slug)

  if (!stripe || !organization) {
    return { success: false, error: "Payment verification unavailable" }
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    if (session.payment_status === "paid") {
      // Record payment if not already recorded
      const appointmentId = session.metadata?.appointmentId
      if (appointmentId) {
        const existingPayment = await db.payment.findUnique({
          where: { appointmentId },
        })

        if (!existingPayment) {
          await db.payment.create({
            data: {
              appointmentId,
              amount: (session.amount_total || 0) / 100,
              tipAmount: 0,
              totalAmount: (session.amount_total || 0) / 100,
              method: "CARD",
              status: "PAID",
              paidAt: new Date(),
              stripePaymentId: session.payment_intent as string,
            },
          })
        }
      }

      return { success: true }
    }

    return { success: false, error: "Payment not completed" }
  } catch (error) {
    console.error("Failed to verify checkout session:", error)
    return { success: false, error: "Failed to verify payment" }
  }
}

// Handle Stripe webhook event
export async function handleStripeWebhook(
  organizationId: string,
  event: {
    type: string
    data: {
      object: {
        id: string
        metadata?: { appointmentId?: string; organizationId?: string }
        amount_total?: number
        payment_intent?: string | { id: string }
        payment_status?: string
      }
    }
  }
) {
  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    const appointmentId = session.metadata?.appointmentId

    if (appointmentId && session.payment_status === "paid") {
      // Check if payment already exists
      const existingPayment = await db.payment.findUnique({
        where: { appointmentId },
      })

      if (!existingPayment) {
        const paymentIntentId = typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id

        await db.payment.create({
          data: {
            appointmentId,
            amount: (session.amount_total || 0) / 100,
            tipAmount: 0,
            totalAmount: (session.amount_total || 0) / 100,
            method: "CARD",
            status: "PAID",
            paidAt: new Date(),
            stripePaymentId: paymentIntentId || null,
          },
        })

        // Update appointment total
        await db.appointment.update({
          where: { id: appointmentId },
          data: {
            totalAmount: (session.amount_total || 0) / 100,
          },
        })

        revalidatePath(`/app/appointments/${appointmentId}`)
      }
    }
  }
}
