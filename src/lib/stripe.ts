import Stripe from "stripe"
import { db } from "@/lib/db"

// Get Stripe client for an organization
export async function getStripeClient(organizationId: string): Promise<Stripe | null> {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { stripeSecretKey: true },
  })

  if (!organization?.stripeSecretKey) {
    return null
  }

  return new Stripe(organization.stripeSecretKey, {
    apiVersion: "2025-12-15.clover",
  })
}

// Get Stripe client by organization slug
export async function getStripeClientBySlug(slug: string): Promise<{
  stripe: Stripe | null
  organization: { id: string; name: string; stripePublishableKey: string | null } | null
}> {
  const organization = await db.organization.findUnique({
    where: { slug },
    select: {
      id: true,
      name: true,
      stripeSecretKey: true,
      stripePublishableKey: true,
    },
  })

  if (!organization) {
    return { stripe: null, organization: null }
  }

  const stripe = organization.stripeSecretKey
    ? new Stripe(organization.stripeSecretKey, { apiVersion: "2025-12-15.clover" })
    : null

  return {
    stripe,
    organization: {
      id: organization.id,
      name: organization.name,
      stripePublishableKey: organization.stripePublishableKey,
    },
  }
}

// Check if organization has Stripe configured
export async function hasStripeConfigured(organizationId: string): Promise<boolean> {
  const organization = await db.organization.findUnique({
    where: { id: organizationId },
    select: { stripeSecretKey: true, stripePublishableKey: true },
  })

  return !!(organization?.stripeSecretKey && organization?.stripePublishableKey)
}
