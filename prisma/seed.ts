import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seeding database...')

  // Create demo organization
  const org = await prisma.organization.upsert({
    where: { id: 'demo-org' },
    update: {},
    create: {
      id: 'demo-org',
      name: "Pawfect Grooming",
      email: "hello@pawfectgrooming.com",
      phone: "(555) 123-4567",
      address: "123 Main Street",
      city: "Austin",
      state: "TX",
      zipCode: "78701",
      timezone: "America/Chicago",
      businessHoursStart: "08:00",
      businessHoursEnd: "18:00",
      appointmentBuffer: 15,
    },
  })

  console.log('Created organization:', org.name)

  // Create services
  const services = await Promise.all([
    prisma.service.upsert({
      where: { id: 'service-1' },
      update: {},
      create: {
        id: 'service-1',
        name: "Full Groom",
        description: "Complete grooming including bath, haircut, nails, and ear cleaning",
        defaultPrice: 75,
        defaultDuration: 90,
        isAddOn: false,
        sortOrder: 1,
        organizationId: org.id,
      },
    }),
    prisma.service.upsert({
      where: { id: 'service-2' },
      update: {},
      create: {
        id: 'service-2',
        name: "Bath & Brush",
        description: "Bath, blow dry, and brush out",
        defaultPrice: 45,
        defaultDuration: 45,
        isAddOn: false,
        sortOrder: 2,
        organizationId: org.id,
      },
    }),
    prisma.service.upsert({
      where: { id: 'service-3' },
      update: {},
      create: {
        id: 'service-3',
        name: "Puppy Groom",
        description: "Gentle first groom for puppies under 6 months",
        defaultPrice: 55,
        defaultDuration: 60,
        isAddOn: false,
        sortOrder: 3,
        organizationId: org.id,
      },
    }),
    prisma.service.upsert({
      where: { id: 'service-4' },
      update: {},
      create: {
        id: 'service-4',
        name: "Nail Trim",
        description: "Nail clipping and filing",
        defaultPrice: 15,
        defaultDuration: 15,
        isAddOn: true,
        sortOrder: 4,
        organizationId: org.id,
      },
    }),
    prisma.service.upsert({
      where: { id: 'service-5' },
      update: {},
      create: {
        id: 'service-5',
        name: "Teeth Brushing",
        description: "Teeth cleaning with pet-safe toothpaste",
        defaultPrice: 10,
        defaultDuration: 10,
        isAddOn: true,
        sortOrder: 5,
        organizationId: org.id,
      },
    }),
    prisma.service.upsert({
      where: { id: 'service-6' },
      update: {},
      create: {
        id: 'service-6',
        name: "Deshedding Treatment",
        description: "Special deshedding shampoo and thorough brush out",
        defaultPrice: 25,
        defaultDuration: 30,
        isAddOn: true,
        sortOrder: 6,
        organizationId: org.id,
      },
    }),
  ])

  console.log('Created', services.length, 'services')

  // Create message templates
  const templates = await Promise.all([
    prisma.messageTemplate.upsert({
      where: { id: 'template-1' },
      update: {},
      create: {
        id: 'template-1',
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
    }),
    prisma.messageTemplate.upsert({
      where: { id: 'template-2' },
      update: {},
      create: {
        id: 'template-2',
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
    }),
    prisma.messageTemplate.upsert({
      where: { id: 'template-3' },
      update: {},
      create: {
        id: 'template-3',
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
    }),
    prisma.messageTemplate.upsert({
      where: { id: 'template-4' },
      update: {},
      create: {
        id: 'template-4',
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
    }),
  ])

  console.log('Created', templates.length, 'message templates')

  // Create demo clients
  const clients = await Promise.all([
    prisma.client.upsert({
      where: { id: 'client-1' },
      update: {},
      create: {
        id: 'client-1',
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@email.com",
        phone: "(555) 234-5678",
        address: "456 Oak Avenue",
        city: "Austin",
        state: "TX",
        zipCode: "78702",
        notes: "Prefers morning appointments. Gate code: 1234",
        tags: ["VIP", "Regular"],
        organizationId: org.id,
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-2' },
      update: {},
      create: {
        id: 'client-2',
        firstName: "Michael",
        lastName: "Chen",
        email: "michael.chen@email.com",
        phone: "(555) 345-6789",
        address: "789 Elm Street",
        city: "Austin",
        state: "TX",
        zipCode: "78703",
        tags: ["Regular"],
        organizationId: org.id,
      },
    }),
    prisma.client.upsert({
      where: { id: 'client-3' },
      update: {},
      create: {
        id: 'client-3',
        firstName: "Emily",
        lastName: "Davis",
        email: "emily.davis@email.com",
        phone: "(555) 456-7890",
        address: "321 Pine Road",
        city: "Austin",
        state: "TX",
        zipCode: "78704",
        notes: "Has two dogs that need to be groomed together",
        organizationId: org.id,
      },
    }),
  ])

  console.log('Created', clients.length, 'clients')

  // Create demo pets
  const pets = await Promise.all([
    prisma.pet.upsert({
      where: { id: 'pet-1' },
      update: {},
      create: {
        id: 'pet-1',
        name: "Bella",
        species: "Dog",
        breed: "Golden Retriever",
        weight: 65,
        sex: "Female",
        coatType: "Long",
        coatNotes: "Prone to matting behind ears",
        behaviorNotes: "Very friendly, loves treats",
        groomingPrefs: "Prefers shorter summer cut",
        clientId: clients[0].id,
      },
    }),
    prisma.pet.upsert({
      where: { id: 'pet-2' },
      update: {},
      create: {
        id: 'pet-2',
        name: "Max",
        species: "Dog",
        breed: "French Bulldog",
        weight: 28,
        sex: "Male",
        coatType: "Short",
        behaviorNotes: "Can be nervous with nail trims",
        clientId: clients[1].id,
      },
    }),
    prisma.pet.upsert({
      where: { id: 'pet-3' },
      update: {},
      create: {
        id: 'pet-3',
        name: "Luna",
        species: "Dog",
        breed: "Poodle",
        weight: 45,
        sex: "Female",
        coatType: "Curly",
        groomingPrefs: "Teddy bear cut",
        clientId: clients[2].id,
      },
    }),
    prisma.pet.upsert({
      where: { id: 'pet-4' },
      update: {},
      create: {
        id: 'pet-4',
        name: "Charlie",
        species: "Dog",
        breed: "Labradoodle",
        weight: 55,
        sex: "Male",
        coatType: "Curly",
        behaviorNotes: "High energy, may need breaks",
        clientId: clients[2].id,
      },
    }),
  ])

  console.log('Created', pets.length, 'pets')

  console.log('Seeding completed!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
