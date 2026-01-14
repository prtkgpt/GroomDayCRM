import { z } from "zod"

export const clientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export type ClientFormData = z.infer<typeof clientSchema>

export const petSchema = z.object({
  name: z.string().min(1, "Pet name is required"),
  species: z.string().min(1, "Species is required"),
  breed: z.string().optional(),
  color: z.string().optional(),
  birthDate: z.string().optional(),
  weight: z.union([z.coerce.number().positive(), z.literal("")]).optional(),
  sex: z.string().optional(),
  coatType: z.string().optional(),
  coatNotes: z.string().optional(),
  behaviorNotes: z.string().optional(),
  groomingPrefs: z.string().optional(),
  vaccineNotes: z.string().optional(),
  medicalNotes: z.string().optional(),
  clientId: z.string().min(1, "Client is required"),
})

export type PetFormData = z.input<typeof petSchema>

export const appointmentSchema = z.object({
  clientId: z.string().min(1, "Client is required"),
  petIds: z.array(z.string()).min(1, "At least one pet is required"),
  serviceIds: z.array(z.string()).min(1, "At least one service is required"),
  dateTime: z.string().min(1, "Date and time are required"),
  duration: z.coerce.number().positive("Duration must be positive"),
  locationType: z.enum(["CLIENT_HOME", "BUSINESS", "OTHER"]),
  locationAddress: z.string().optional(),
  locationNotes: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  subtotal: z.coerce.number().nonnegative(),
})

export type AppointmentFormData = z.infer<typeof appointmentSchema>

export const serviceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  defaultPrice: z.coerce.number().nonnegative("Price must be positive"),
  defaultDuration: z.coerce.number().positive("Duration must be positive"),
  isAddOn: z.boolean().default(false),
  isActive: z.boolean().default(true),
})

export type ServiceFormData = z.infer<typeof serviceSchema>

export const paymentSchema = z.object({
  appointmentId: z.string().min(1, "Appointment is required"),
  amount: z.coerce.number().nonnegative(),
  tipAmount: z.coerce.number().nonnegative().default(0),
  method: z.enum(["CASH", "CHECK", "CARD", "VENMO", "ZELLE", "OTHER"]),
  receiptNote: z.string().optional(),
})

export type PaymentFormData = z.infer<typeof paymentSchema>

export const organizationSchema = z.object({
  name: z.string().min(1, "Business name is required"),
  slug: z.string().min(1, "Booking URL is required").regex(/^[a-z0-9-]+$/, "Only lowercase letters, numbers, and hyphens allowed"),
  description: z.string().optional(),
  email: z.string().email("Invalid email").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  zipCode: z.string().optional(),
  timezone: z.string().default("America/New_York"),
  businessHoursStart: z.string().default("09:00"),
  businessHoursEnd: z.string().default("17:00"),
  appointmentBuffer: z.coerce.number().nonnegative().default(15),
})

export type OrganizationFormData = z.infer<typeof organizationSchema>

export const messageTemplateSchema = z.object({
  name: z.string().min(1, "Template name is required"),
  type: z.enum(["BOOKING_CONFIRMATION", "REMINDER_24H", "ON_MY_WAY", "THANK_YOU", "CUSTOM"]),
  subject: z.string().optional(),
  body: z.string().min(1, "Message body is required"),
})

export type MessageTemplateFormData = z.infer<typeof messageTemplateSchema>
