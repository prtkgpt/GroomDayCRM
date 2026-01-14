import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { db } from "@/lib/db"
import { handleStripeWebhook } from "@/lib/actions/stripe"

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe signature" }, { status: 400 })
  }

  // Get organization ID from the event metadata
  // We need to parse the event first to get the org ID
  let event: Stripe.Event

  try {
    // First, parse without verification to get the org ID
    const rawEvent = JSON.parse(body)
    const organizationId = rawEvent.data?.object?.metadata?.organizationId

    if (!organizationId) {
      // If no org ID in metadata, try to handle generically
      console.log("No organization ID in webhook metadata")
      return NextResponse.json({ received: true })
    }

    // Get the organization's Stripe secret key for webhook verification
    const organization = await db.organization.findUnique({
      where: { id: organizationId },
      select: { stripeSecretKey: true },
    })

    if (!organization?.stripeSecretKey) {
      return NextResponse.json({ error: "Organization not found or Stripe not configured" }, { status: 400 })
    }

    // Create Stripe client with org's key
    const stripe = new Stripe(organization.stripeSecretKey, {
      apiVersion: "2025-12-15.clover",
    })

    // Get webhook secret from env (org could have their own, but for now use platform's)
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

    if (webhookSecret) {
      // Verify the event
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } else {
      // If no webhook secret, trust the event (not recommended for production)
      event = rawEvent as Stripe.Event
    }

    // Handle the event
    await handleStripeWebhook(organizationId, {
      type: event.type,
      data: {
        object: event.data.object as any,
      },
    })

    return NextResponse.json({ received: true })
  } catch (err) {
    console.error("Stripe webhook error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Webhook error" },
      { status: 400 }
    )
  }
}
