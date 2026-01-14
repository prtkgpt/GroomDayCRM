"use client"

import { useState, useTransition } from "react"
import { format, addDays } from "date-fns"
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  PawPrint,
  CheckCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { getAvailableSlots, createPublicBooking } from "@/lib/actions/public-booking"

interface Service {
  id: string
  name: string
  description: string | null
  price: number
  duration: number
}

interface Organization {
  id: string
  name: string
  address: string | null
  phone: string | null
  email: string | null
}

interface BookingFormProps {
  organization: Organization
  services: Service[]
}

type Step = "service" | "datetime" | "info" | "confirm"

export function BookingForm({ organization, services }: BookingFormProps) {
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>("service")
  const [selectedService, setSelectedService] = useState<Service | null>(null)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined)
  const [availableSlots, setAvailableSlots] = useState<string[]>([])
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [bookingComplete, setBookingComplete] = useState(false)
  const [bookingResult, setBookingResult] = useState<{
    clientName: string
    petName: string
    dateTime: Date
    serviceName: string
  } | null>(null)

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    petName: "",
    species: "Dog",
    breed: "",
    weight: "",
    notes: "",
  })

  const handleDateSelect = async (date: Date) => {
    setSelectedDate(date)
    setSelectedSlot(null)

    if (selectedService) {
      setLoadingSlots(true)
      try {
        const slots = await getAvailableSlots(
          organization.id,
          date.toISOString(),
          selectedService.duration
        )
        setAvailableSlots(slots)
      } catch (error) {
        console.error("Failed to load slots:", error)
        setAvailableSlots([])
      } finally {
        setLoadingSlots(false)
      }
    }
  }

  const handleSubmit = () => {
    if (!selectedService || !selectedSlot) return

    startTransition(async () => {
      try {
        const result = await createPublicBooking({
          organizationId: organization.id,
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone || undefined,
          address: formData.address || undefined,
          petName: formData.petName,
          species: formData.species,
          breed: formData.breed || undefined,
          weight: formData.weight ? parseFloat(formData.weight) : undefined,
          notes: formData.notes || undefined,
          serviceId: selectedService.id,
          dateTime: selectedSlot,
        })

        setBookingResult({
          clientName: result.clientName,
          petName: result.petName,
          dateTime: new Date(result.dateTime),
          serviceName: result.serviceName,
        })
        setBookingComplete(true)
      } catch (error) {
        console.error("Booking failed:", error)
        alert("Failed to book appointment. Please try again.")
      }
    })
  }

  const canProceed = () => {
    switch (step) {
      case "service":
        return selectedService !== null
      case "datetime":
        return selectedSlot !== null
      case "info":
        return (
          formData.firstName.trim() !== "" &&
          formData.lastName.trim() !== "" &&
          formData.email.trim() !== "" &&
          formData.petName.trim() !== ""
        )
      default:
        return true
    }
  }

  const nextStep = () => {
    switch (step) {
      case "service":
        setStep("datetime")
        break
      case "datetime":
        setStep("info")
        break
      case "info":
        setStep("confirm")
        break
    }
  }

  const prevStep = () => {
    switch (step) {
      case "datetime":
        setStep("service")
        break
      case "info":
        setStep("datetime")
        break
      case "confirm":
        setStep("info")
        break
    }
  }

  if (bookingComplete && bookingResult) {
    return (
      <Card>
        <CardContent className="pt-8 pb-8 text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center">
              <Clock className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-2">Booking Request Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Your appointment request is pending approval. You&apos;ll receive a confirmation email once approved.
          </p>
          <div className="bg-muted rounded-lg p-4 text-left space-y-2">
            <p>
              <span className="font-medium">Service:</span> {bookingResult.serviceName}
            </p>
            <p>
              <span className="font-medium">Pet:</span> {bookingResult.petName}
            </p>
            <p>
              <span className="font-medium">Requested Date:</span>{" "}
              {format(bookingResult.dateTime, "EEEE, MMMM d, yyyy")}
            </p>
            <p>
              <span className="font-medium">Requested Time:</span>{" "}
              {format(bookingResult.dateTime, "h:mm a")}
            </p>
          </div>
          <p className="mt-6 text-sm text-muted-foreground">
            We&apos;ll send a confirmation to {formData.email} once your booking is approved.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      {/* Progress Steps */}
      <div className="border-b px-6 py-4">
        <div className="flex justify-between">
          {[
            { key: "service", label: "Service", icon: PawPrint },
            { key: "datetime", label: "Date & Time", icon: CalendarIcon },
            { key: "info", label: "Your Info", icon: User },
            { key: "confirm", label: "Confirm", icon: CheckCircle },
          ].map((s, i) => {
            const Icon = s.icon
            const isActive = step === s.key
            const isPast = ["service", "datetime", "info", "confirm"].indexOf(step) > i
            return (
              <div
                key={s.key}
                className={cn(
                  "flex items-center gap-2",
                  isActive && "text-primary",
                  isPast && "text-primary",
                  !isActive && !isPast && "text-muted-foreground"
                )}
              >
                <div
                  className={cn(
                    "h-8 w-8 rounded-full flex items-center justify-center text-sm",
                    isActive && "bg-primary text-primary-foreground",
                    isPast && "bg-primary/20 text-primary",
                    !isActive && !isPast && "bg-muted"
                  )}
                >
                  {isPast ? <CheckCircle className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                <span className="hidden sm:inline text-sm font-medium">{s.label}</span>
              </div>
            )
          })}
        </div>
      </div>

      <CardContent className="pt-6">
        {/* Step 1: Select Service */}
        {step === "service" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select a Service</h3>
            <div className="grid gap-3">
              {services.map((service) => (
                <div
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={cn(
                    "p-4 border rounded-lg cursor-pointer transition-colors",
                    selectedService?.id === service.id
                      ? "border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {service.description}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {service.duration} minutes
                      </p>
                    </div>
                    <p className="font-semibold text-primary">
                      ${service.price.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Select Date & Time */}
        {step === "datetime" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Select Date & Time</h3>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <Label className="mb-2 block">Select a Date</Label>
                <Calendar
                  selected={selectedDate}
                  onSelect={handleDateSelect}
                  disabled={(date) => date < new Date() || date > addDays(new Date(), 60)}
                  className="rounded-md border"
                />
              </div>
              <div>
                <Label className="mb-2 block">Available Times</Label>
                {!selectedDate ? (
                  <p className="text-muted-foreground text-sm">
                    Please select a date first
                  </p>
                ) : loadingSlots ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : availableSlots.length === 0 ? (
                  <p className="text-muted-foreground text-sm">
                    No available slots for this date. Please try another date.
                  </p>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-[300px] overflow-y-auto">
                    {availableSlots.map((slot) => (
                      <Button
                        key={slot}
                        variant={selectedSlot === slot ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedSlot(slot)}
                      >
                        {format(new Date(slot), "h:mm a")}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Your Information */}
        {step === "info" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Your Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="address">Address (for mobile grooming)</Label>
                  <Input
                    id="address"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    placeholder="123 Main St, City, State ZIP"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4">Pet Information</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="petName">Pet Name *</Label>
                  <Input
                    id="petName"
                    value={formData.petName}
                    onChange={(e) =>
                      setFormData({ ...formData, petName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="species">Species</Label>
                  <Select
                    value={formData.species}
                    onValueChange={(value) =>
                      setFormData({ ...formData, species: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dog">Dog</SelectItem>
                      <SelectItem value="Cat">Cat</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="breed">Breed</Label>
                  <Input
                    id="breed"
                    value={formData.breed}
                    onChange={(e) =>
                      setFormData({ ...formData, breed: e.target.value })
                    }
                    placeholder="e.g., Golden Retriever"
                  />
                </div>
                <div>
                  <Label htmlFor="weight">Weight (lbs)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) =>
                      setFormData({ ...formData, weight: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="notes">Special Notes or Requests</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Any special needs, behavioral notes, or requests..."
                    rows={3}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === "confirm" && selectedService && selectedSlot && (
          <div className="space-y-6">
            <h3 className="text-lg font-semibold">Confirm Your Booking</h3>

            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Appointment Details</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-muted-foreground">Service:</span>{" "}
                    {selectedService.name}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Date:</span>{" "}
                    {format(new Date(selectedSlot), "EEEE, MMMM d, yyyy")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Time:</span>{" "}
                    {format(new Date(selectedSlot), "h:mm a")}
                  </p>
                  <p>
                    <span className="text-muted-foreground">Duration:</span>{" "}
                    {selectedService.duration} minutes
                  </p>
                  <p className="font-medium mt-2">
                    <span className="text-muted-foreground">Total:</span>{" "}
                    ${selectedService.price.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Your Information</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    {formData.firstName} {formData.lastName}
                  </p>
                  <p>{formData.email}</p>
                  {formData.phone && <p>{formData.phone}</p>}
                  {formData.address && <p>{formData.address}</p>}
                </div>
              </div>

              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Pet Information</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    {formData.petName} ({formData.species})
                  </p>
                  {formData.breed && <p>Breed: {formData.breed}</p>}
                  {formData.weight && <p>Weight: {formData.weight} lbs</p>}
                  {formData.notes && (
                    <p className="mt-2">
                      <span className="text-muted-foreground">Notes:</span> {formData.notes}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between mt-6 pt-6 border-t">
          {step !== "service" ? (
            <Button variant="outline" onClick={prevStep}>
              <ChevronLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          ) : (
            <div />
          )}

          {step !== "confirm" ? (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Next
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Confirm Booking
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
