import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export async function getUser() {
  const { userId } = await auth()
  if (!userId) return null

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { organization: true },
  })

  return user
}

export async function getUserOrRedirect() {
  const { userId, redirectToSignIn } = await auth()
  if (!userId) {
    redirectToSignIn()
    return null
  }

  const user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { organization: true },
  })

  return user
}

export async function getOrganizationId(): Promise<string | null> {
  const user = await getUser()
  return user?.organizationId ?? null
}

export async function requireOrganizationId(): Promise<string> {
  const organizationId = await getOrganizationId()
  if (!organizationId) {
    throw new Error("Organization not found. Please complete setup.")
  }
  return organizationId
}

export async function ensureUserAndOrg() {
  const { userId } = await auth()
  if (!userId) {
    throw new Error("Not authenticated")
  }

  const clerkUser = await currentUser()
  if (!clerkUser) {
    throw new Error("User not found")
  }

  // Check if user exists in our database
  let user = await db.user.findUnique({
    where: { clerkId: userId },
    include: { organization: true },
  })

  // If not, create user and organization
  if (!user) {
    const org = await db.organization.create({
      data: {
        name: `${clerkUser.firstName}'s Grooming Business`,
        email: clerkUser.emailAddresses[0]?.emailAddress,
      },
    })

    user = await db.user.create({
      data: {
        clerkId: userId,
        email: clerkUser.emailAddresses[0]?.emailAddress ?? "",
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        organizationId: org.id,
        role: "OWNER",
      },
      include: { organization: true },
    })

    // Create default services for the organization
    await db.service.createMany({
      data: [
        {
          name: "Full Groom",
          description: "Complete grooming service including bath, haircut, nails, and ear cleaning",
          defaultPrice: 75,
          defaultDuration: 90,
          isAddOn: false,
          sortOrder: 1,
          organizationId: org.id,
        },
        {
          name: "Bath & Brush",
          description: "Bath, blow dry, and brush out",
          defaultPrice: 45,
          defaultDuration: 45,
          isAddOn: false,
          sortOrder: 2,
          organizationId: org.id,
        },
        {
          name: "Nail Trim",
          description: "Nail clipping and filing",
          defaultPrice: 15,
          defaultDuration: 15,
          isAddOn: true,
          sortOrder: 3,
          organizationId: org.id,
        },
        {
          name: "Teeth Brushing",
          description: "Teeth cleaning with pet-safe toothpaste",
          defaultPrice: 10,
          defaultDuration: 10,
          isAddOn: true,
          sortOrder: 4,
          organizationId: org.id,
        },
        {
          name: "Deshedding Treatment",
          description: "Special deshedding shampoo and thorough brush out",
          defaultPrice: 25,
          defaultDuration: 30,
          isAddOn: true,
          sortOrder: 5,
          organizationId: org.id,
        },
        {
          name: "Flea Treatment",
          description: "Flea bath with medicated shampoo",
          defaultPrice: 20,
          defaultDuration: 20,
          isAddOn: true,
          sortOrder: 6,
          organizationId: org.id,
        },
      ],
    })

    // Create default message templates
    await db.messageTemplate.createMany({
      data: [
        {
          name: "Booking Confirmation",
          type: "BOOKING_CONFIRMATION",
          subject: "Appointment Confirmed - {{businessName}}",
          body: `Hi {{clientName}},

Your grooming appointment has been confirmed!

Date: {{appointmentDate}}
Time: {{appointmentTime}}
Pet(s): {{petNames}}
Services: {{services}}

Location: {{location}}

If you need to reschedule, please contact us.

Thanks,
{{businessName}}`,
          organizationId: org.id,
        },
        {
          name: "24 Hour Reminder",
          type: "REMINDER_24H",
          subject: "Reminder: Grooming Appointment Tomorrow - {{businessName}}",
          body: `Hi {{clientName}},

This is a friendly reminder that {{petNames}} has a grooming appointment tomorrow!

Date: {{appointmentDate}}
Time: {{appointmentTime}}

Please ensure your pet is ready for pickup/arrival at the scheduled time.

See you soon!
{{businessName}}`,
          organizationId: org.id,
        },
        {
          name: "On My Way",
          type: "ON_MY_WAY",
          subject: "On My Way! - {{businessName}}",
          body: `Hi {{clientName}},

I'm on my way to groom {{petNames}}! I should arrive in approximately 15-20 minutes.

Please have your pet ready.

See you soon!
{{businessName}}`,
          organizationId: org.id,
        },
        {
          name: "Thank You",
          type: "THANK_YOU",
          subject: "Thank You! - {{businessName}}",
          body: `Hi {{clientName}},

Thank you for choosing {{businessName}} for {{petNames}}'s grooming today!

We hope you're happy with the results. If you have any questions or concerns, please don't hesitate to reach out.

We'd love to see you again soon!

Best,
{{businessName}}`,
          organizationId: org.id,
        },
      ],
    })
  }

  return user
}
