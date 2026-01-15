"use client"

import { useState, useTransition } from "react"
import { format, addDays, startOfToday, parse } from "date-fns"
import {
  Sparkles,
  Calendar as CalendarIcon,
  Clock,
  User,
  PawPrint,
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Bell
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import { getAvailableSlotsDetailed, submitBooking } from "@/lib/actions/public-booking"
import { addToPublicWaitlist } from "@/lib/actions/waitlist"

interface Organization {
  id: string
  name: string
  theme: string
  bookingMaxDaysAhead: number
  bookingRequiresApproval: boolean
}

interface Service {
  id: string
  name: string
  description: string | null
  defaultPrice: number
  defaultDuration: number
  isAddOn: boolean
}

interface BookingWizardProps {
  organization: Organization
  services: Service[]
}

type Step = "services" | "datetime" | "info" | "confirm"

const steps: { id: Step; label: string; icon: React.ElementType }[] = [
  { id: "services", label: "Services", icon: Sparkles },
  { id: "datetime", label: "Date & Time", icon: CalendarIcon },
  { id: "info", label: "Your Info", icon: User },
  { id: "confirm", label: "Confirm", icon: Check },
]

function formatPrice(amount: number): string {
  return "$" + amount.toFixed(2)
}

export function BookingWizard({ organization, services }: BookingWizardProps) {
  const [currentStep, setCurrentStep] = useState<Step>("services")
  const [isPending, startTransition] = useTransition()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [bookingResult, setBookingResult] = useState<{ success: boolean; appointmentId?: string; dateTime?: string } | null>(null)

  // Form state
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [availableSlots, setAvailableSlots] = useState<{ time: string; available: boolean }[]>([])
  const [clientInfo, setClientInfo] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  })
  const [petInfo, setPetInfo] = useState({
    name: "",
    species: "Dog",
    breed: "",
    weight: "",
    notes: "",
  })
  const [notes, setNotes] = useState("")

  // Waitlist state
  const [showWaitlistForm, setShowWaitlistForm] = useState(false)
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false)
  const [waitlistSuccess, setWaitlistSuccess] = useState(false)
  const [waitlistPreferences, setWaitlistPreferences] = useState({
    isFlexibleDate: true,
    isFlexibleTime: true,
    preferredDays: [] as number[],
    preferredTimeStart: "",
    preferredTimeEnd: "",
  })

  // Calculate totals
  const selectedServiceObjects = services.filter(s => selectedServices.includes(s.id))
  const totalPrice = selectedServiceObjects.reduce((sum, s) => sum + s.defaultPrice, 0)
  const totalDuration = selectedServiceObjects.reduce((sum, s) => sum + s.defaultDuration, 0)

  // Generate available dates
  const today = startOfToday()
  const dates: Date[] = []
  for (let i = 0; i <= organization.bookingMaxDaysAhead && i <= 30; i++) {
    dates.push(addDays(today, i))
  }

  // Toggle service selection
  const toggleService = (serviceId: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  // Load available slots when date changes
  const handleDateSelect = (date: Date) => {
    setSelectedDate(date)
    setSelectedTime(null)

    startTransition(async () => {
      const slots = await getAvailableSlotsDetailed(organization.id, date, totalDuration)
      setAvailableSlots(slots)
    })
  }

  // Navigate steps
  const goToStep = (step: Step) => setCurrentStep(step)
  const goNext = () => {
    const stepIndex = steps.findIndex(s => s.id === currentStep)
    if (stepIndex < steps.length - 1) {
      setCurrentStep(steps[stepIndex + 1].id)
    }
  }
  const goBack = () => {
    const stepIndex = steps.findIndex(s => s.id === currentStep)
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id)
    }
  }

  // Validation
  const canProceed = () => {
    switch (currentStep) {
      case "services":
        return selectedServices.length > 0
      case "datetime":
        return selectedDate && selectedTime
      case "info":
        return clientInfo.firstName && clientInfo.lastName &&
               (clientInfo.email || clientInfo.phone) && petInfo.name
      case "confirm":
        return true
    }
  }

  // Submit booking
  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) return

    setIsSubmitting(true)
    try {
      const result = await submitBooking({
        organizationId: organization.id,
        services: selectedServices,
        date: format(selectedDate, "yyyy-MM-dd"),
        time: selectedTime,
        client: clientInfo,
        pet: {
          name: petInfo.name,
          species: petInfo.species,
          breed: petInfo.breed || undefined,
          weight: petInfo.weight ? parseFloat(petInfo.weight) : undefined,
          notes: petInfo.notes || undefined,
        },
        notes: notes || undefined,
      })
      setBookingResult(result)
    } catch (error) {
      console.error("Booking error:", error)
      setBookingResult({ success: false })
    } finally {
      setIsSubmitting(false)
    }
  }

  // Submit to waitlist
  const handleWaitlistSubmit = async () => {
    if (!clientInfo.firstName || !clientInfo.lastName || (!clientInfo.email && !clientInfo.phone) || !petInfo.name) {
      return
    }

    setWaitlistSubmitting(true)
    try {
      await addToPublicWaitlist({
        organizationId: organization.id,
        clientEmail: clientInfo.email,
        clientFirstName: clientInfo.firstName,
        clientLastName: clientInfo.lastName,
        clientPhone: clientInfo.phone || undefined,
        petName: petInfo.name,
        petSpecies: petInfo.species,
        petBreed: petInfo.breed || undefined,
        serviceIds: selectedServices,
        preferredDate: selectedDate || undefined,
        preferredDayOfWeek: waitlistPreferences.preferredDays.length > 0 ? waitlistPreferences.preferredDays : undefined,
        preferredTimeStart: waitlistPreferences.preferredTimeStart || undefined,
        preferredTimeEnd: waitlistPreferences.preferredTimeEnd || undefined,
        isFlexibleDate: waitlistPreferences.isFlexibleDate,
        isFlexibleTime: waitlistPreferences.isFlexibleTime,
        notes: petInfo.notes || undefined,
      })
      setWaitlistSuccess(true)
    } catch (error) {
      console.error("Waitlist error:", error)
    } finally {
      setWaitlistSubmitting(false)
    }
  }

  // Booking confirmed view
  if (bookingResult?.success) {
    return (
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-emerald-50 to-transparent p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <Check className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">Booking Confirmed!</h2>
          <p className="text-muted-foreground">
            {organization.bookingRequiresApproval
              ? "Your booking request has been submitted and is pending approval."
              : "Your appointment has been scheduled."}
          </p>
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="font-medium">
              {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
            </p>
            <p className="text-muted-foreground">
              at {selectedTime && format(parse(selectedTime, "HH:mm", new Date()), "h:mm a")}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              {selectedServiceObjects.map(s => s.name).join(", ")}
            </p>
          </div>
          <p className="text-sm text-center text-muted-foreground">
            A confirmation email will be sent to {clientInfo.email || clientInfo.phone}
          </p>
        </CardContent>
      </Card>
    )
  }

  // Waitlist success view
  if (waitlistSuccess) {
    return (
      <Card className="overflow-hidden">
        <div className="bg-gradient-to-br from-amber-50 to-transparent p-8 text-center">
          <div className="h-16 w-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-4">
            <Bell className="h-8 w-8 text-amber-600" />
          </div>
          <h2 className="text-2xl font-semibold mb-2">You're on the Waitlist!</h2>
          <p className="text-muted-foreground">
            We'll notify you as soon as a slot opens up.
          </p>
        </div>
        <CardContent className="p-6 space-y-4">
          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="font-medium">Services Requested</p>
            <p className="text-sm text-muted-foreground">
              {selectedServiceObjects.map(s => s.name).join(", ")}
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              for {petInfo.name}
            </p>
          </div>
          <p className="text-sm text-center text-muted-foreground">
            We'll contact you at {clientInfo.email || clientInfo.phone} when an opening becomes available.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const StepIcon = step.icon
          const isActive = step.id === currentStep
          const isCompleted = steps.findIndex(s => s.id === currentStep) > index

          return (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => isCompleted ? goToStep(step.id) : undefined}
                disabled={!isCompleted}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-xl transition-all",
                  isActive && "bg-primary text-primary-foreground",
                  isCompleted && "text-primary cursor-pointer hover:bg-primary/10",
                  !isActive && !isCompleted && "text-muted-foreground"
                )}
              >
                <StepIcon className="h-5 w-5" />
                <span className="hidden sm:inline text-sm font-medium">{step.label}</span>
              </button>
              {index < steps.length - 1 && (
                <ChevronRight className="h-4 w-4 mx-2 text-muted-foreground" />
              )}
            </div>
          )
        })}
      </div>

      {/* Step Content */}
      <Card>
        {/* Step 1: Services */}
        {currentStep === "services" && (
          <>
            <CardHeader>
              <CardTitle>Select Services</CardTitle>
              <CardDescription>Choose the services you would like to book</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {services.filter(s => !s.isAddOn).map(service => (
                <button
                  key={service.id}
                  onClick={() => toggleService(service.id)}
                  className={cn(
                    "w-full p-4 rounded-xl border text-left transition-all",
                    selectedServices.includes(service.id)
                      ? "border-primary bg-primary/5 ring-2 ring-primary"
                      : "hover:bg-accent"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{service.name}</p>
                      {service.description && (
                        <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {service.defaultDuration} min
                      </p>
                    </div>
                    <p className="font-semibold">{formatPrice(service.defaultPrice)}</p>
                  </div>
                </button>
              ))}

              {/* Add-ons */}
              {services.some(s => s.isAddOn) && (
                <>
                  <div className="pt-4 pb-2">
                    <p className="text-sm font-medium text-muted-foreground">Add-ons</p>
                  </div>
                  {services.filter(s => s.isAddOn).map(service => (
                    <button
                      key={service.id}
                      onClick={() => toggleService(service.id)}
                      className={cn(
                        "w-full p-4 rounded-xl border text-left transition-all",
                        selectedServices.includes(service.id)
                          ? "border-primary bg-primary/5 ring-2 ring-primary"
                          : "hover:bg-accent"
                      )}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                          )}
                        </div>
                        <p className="font-semibold">+{formatPrice(service.defaultPrice)}</p>
                      </div>
                    </button>
                  ))}
                </>
              )}
            </CardContent>
          </>
        )}

        {/* Step 2: Date & Time */}
        {currentStep === "datetime" && (
          <>
            <CardHeader>
              <CardTitle>Choose Date & Time</CardTitle>
              <CardDescription>Select your preferred appointment slot</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Date picker */}
              <div>
                <Label className="mb-3 block">Select Date</Label>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {dates.slice(0, 14).map(date => (
                    <button
                      key={date.toISOString()}
                      onClick={() => handleDateSelect(date)}
                      className={cn(
                        "flex-shrink-0 w-16 h-20 rounded-xl border flex flex-col items-center justify-center transition-all",
                        selectedDate?.toDateString() === date.toDateString()
                          ? "border-primary bg-primary text-primary-foreground"
                          : "hover:bg-accent"
                      )}
                    >
                      <span className="text-xs uppercase">{format(date, "EEE")}</span>
                      <span className="text-xl font-semibold">{format(date, "d")}</span>
                      <span className="text-xs">{format(date, "MMM")}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Time slots */}
              {selectedDate && (
                <div>
                  <Label className="mb-3 block">Select Time</Label>
                  {isPending ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="py-6">
                      {!showWaitlistForm ? (
                        <div className="text-center space-y-4">
                          <p className="text-muted-foreground">
                            No available slots for this date
                          </p>
                          <Button
                            variant="outline"
                            onClick={() => setShowWaitlistForm(true)}
                            className="gap-2"
                          >
                            <Bell className="h-4 w-4" />
                            Join Waitlist
                          </Button>
                          <p className="text-xs text-muted-foreground">
                            Get notified when a slot opens up
                          </p>
                        </div>
                      ) : (
                        <div className="space-y-4">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium">Join Waitlist</h3>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setShowWaitlistForm(false)}
                            >
                              Cancel
                            </Button>
                          </div>

                          {/* Contact Info */}
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label htmlFor="wl-firstName" className="text-xs">First Name *</Label>
                              <Input
                                id="wl-firstName"
                                value={clientInfo.firstName}
                                onChange={e => setClientInfo(prev => ({ ...prev, firstName: e.target.value }))}
                                placeholder="John"
                                className="h-9"
                              />
                            </div>
                            <div>
                              <Label htmlFor="wl-lastName" className="text-xs">Last Name *</Label>
                              <Input
                                id="wl-lastName"
                                value={clientInfo.lastName}
                                onChange={e => setClientInfo(prev => ({ ...prev, lastName: e.target.value }))}
                                placeholder="Doe"
                                className="h-9"
                              />
                            </div>
                          </div>
                          <div>
                            <Label htmlFor="wl-email" className="text-xs">Email *</Label>
                            <Input
                              id="wl-email"
                              type="email"
                              value={clientInfo.email}
                              onChange={e => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                              placeholder="john@example.com"
                              className="h-9"
                            />
                          </div>
                          <div>
                            <Label htmlFor="wl-phone" className="text-xs">Phone</Label>
                            <Input
                              id="wl-phone"
                              type="tel"
                              value={clientInfo.phone}
                              onChange={e => setClientInfo(prev => ({ ...prev, phone: e.target.value }))}
                              placeholder="(555) 123-4567"
                              className="h-9"
                            />
                          </div>

                          {/* Pet Info */}
                          <div className="pt-2 border-t">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label htmlFor="wl-petName" className="text-xs">Pet Name *</Label>
                                <Input
                                  id="wl-petName"
                                  value={petInfo.name}
                                  onChange={e => setPetInfo(prev => ({ ...prev, name: e.target.value }))}
                                  placeholder="Max"
                                  className="h-9"
                                />
                              </div>
                              <div>
                                <Label htmlFor="wl-species" className="text-xs">Species</Label>
                                <select
                                  id="wl-species"
                                  value={petInfo.species}
                                  onChange={e => setPetInfo(prev => ({ ...prev, species: e.target.value }))}
                                  className="flex h-9 w-full rounded-xl border border-input bg-background px-3 py-1 text-sm"
                                >
                                  <option value="Dog">Dog</option>
                                  <option value="Cat">Cat</option>
                                  <option value="Other">Other</option>
                                </select>
                              </div>
                            </div>
                          </div>

                          {/* Preferences */}
                          <div className="pt-2 border-t space-y-3">
                            <p className="text-xs font-medium text-muted-foreground">Scheduling Preferences</p>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="flexible-date" className="text-sm">Flexible on date</Label>
                              <Switch
                                id="flexible-date"
                                checked={waitlistPreferences.isFlexibleDate}
                                onCheckedChange={checked => setWaitlistPreferences(prev => ({ ...prev, isFlexibleDate: checked }))}
                              />
                            </div>

                            <div className="flex items-center justify-between">
                              <Label htmlFor="flexible-time" className="text-sm">Flexible on time</Label>
                              <Switch
                                id="flexible-time"
                                checked={waitlistPreferences.isFlexibleTime}
                                onCheckedChange={checked => setWaitlistPreferences(prev => ({ ...prev, isFlexibleTime: checked }))}
                              />
                            </div>

                            {!waitlistPreferences.isFlexibleTime && (
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <Label htmlFor="wl-timeStart" className="text-xs">Earliest Time</Label>
                                  <Input
                                    id="wl-timeStart"
                                    type="time"
                                    value={waitlistPreferences.preferredTimeStart}
                                    onChange={e => setWaitlistPreferences(prev => ({ ...prev, preferredTimeStart: e.target.value }))}
                                    className="h-9"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="wl-timeEnd" className="text-xs">Latest Time</Label>
                                  <Input
                                    id="wl-timeEnd"
                                    type="time"
                                    value={waitlistPreferences.preferredTimeEnd}
                                    onChange={e => setWaitlistPreferences(prev => ({ ...prev, preferredTimeEnd: e.target.value }))}
                                    className="h-9"
                                  />
                                </div>
                              </div>
                            )}
                          </div>

                          <Button
                            className="w-full"
                            onClick={handleWaitlistSubmit}
                            disabled={waitlistSubmitting || !clientInfo.firstName || !clientInfo.lastName || !clientInfo.email || !petInfo.name}
                          >
                            {waitlistSubmitting ? (
                              <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Joining...
                              </>
                            ) : (
                              <>
                                <Bell className="h-4 w-4 mr-2" />
                                Join Waitlist
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {availableSlots.map(slot => (
                        <button
                          key={slot.time}
                          onClick={() => slot.available && setSelectedTime(slot.time)}
                          disabled={!slot.available}
                          className={cn(
                            "py-3 px-4 rounded-xl border text-sm font-medium transition-all",
                            selectedTime === slot.time
                              ? "border-primary bg-primary text-primary-foreground"
                              : slot.available
                                ? "hover:bg-accent"
                                : "opacity-50 cursor-not-allowed bg-muted"
                          )}
                        >
                          {format(parse(slot.time, "HH:mm", new Date()), "h:mm a")}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </>
        )}

        {/* Step 3: Client & Pet Info */}
        {currentStep === "info" && (
          <>
            <CardHeader>
              <CardTitle>Your Information</CardTitle>
              <CardDescription>Tell us about you and your pet</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Client info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <User className="h-4 w-4" />
                  Contact Information
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input
                      id="firstName"
                      value={clientInfo.firstName}
                      onChange={e => setClientInfo(prev => ({ ...prev, firstName: e.target.value }))}
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input
                      id="lastName"
                      value={clientInfo.lastName}
                      onChange={e => setClientInfo(prev => ({ ...prev, lastName: e.target.value }))}
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={clientInfo.email}
                    onChange={e => setClientInfo(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="john@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={clientInfo.phone}
                    onChange={e => setClientInfo(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              {/* Pet info */}
              <div className="space-y-4 pt-4 border-t">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <PawPrint className="h-4 w-4" />
                  Pet Information
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="petName">Pet Name *</Label>
                    <Input
                      id="petName"
                      value={petInfo.name}
                      onChange={e => setPetInfo(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Max"
                    />
                  </div>
                  <div>
                    <Label htmlFor="species">Species</Label>
                    <select
                      id="species"
                      value={petInfo.species}
                      onChange={e => setPetInfo(prev => ({ ...prev, species: e.target.value }))}
                      className="flex h-11 w-full rounded-xl border border-input bg-background px-4 py-2 text-sm"
                    >
                      <option value="Dog">Dog</option>
                      <option value="Cat">Cat</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="breed">Breed</Label>
                    <Input
                      id="breed"
                      value={petInfo.breed}
                      onChange={e => setPetInfo(prev => ({ ...prev, breed: e.target.value }))}
                      placeholder="Golden Retriever"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight">Weight (lbs)</Label>
                    <Input
                      id="weight"
                      type="number"
                      value={petInfo.weight}
                      onChange={e => setPetInfo(prev => ({ ...prev, weight: e.target.value }))}
                      placeholder="50"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="petNotes">Special Notes</Label>
                  <Textarea
                    id="petNotes"
                    value={petInfo.notes}
                    onChange={e => setPetInfo(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any allergies, behavior notes, or special requests..."
                    rows={3}
                  />
                </div>
              </div>
            </CardContent>
          </>
        )}

        {/* Step 4: Confirm */}
        {currentStep === "confirm" && (
          <>
            <CardHeader>
              <CardTitle>Review Your Booking</CardTitle>
              <CardDescription>Please confirm your appointment details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Summary */}
              <div className="bg-muted/50 rounded-xl p-4 space-y-4">
                <div className="flex items-start gap-3">
                  <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">
                      {selectedDate && format(selectedDate, "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      at {selectedTime && format(parse(selectedTime, "HH:mm", new Date()), "h:mm a")}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">Services</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedServiceObjects.map(s => s.name).join(", ")}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Approx. {totalDuration} minutes
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <PawPrint className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{petInfo.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {petInfo.breed ? petInfo.breed + " " + petInfo.species : petInfo.species}
                      {petInfo.weight && " - " + petInfo.weight + " lbs"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="font-medium">{clientInfo.firstName} {clientInfo.lastName}</p>
                    <p className="text-sm text-muted-foreground">
                      {clientInfo.email || clientInfo.phone}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <Label htmlFor="notes">Additional Notes (optional)</Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Any additional information for your appointment..."
                  rows={2}
                />
              </div>

              {/* Total */}
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-lg font-medium">Estimated Total</span>
                <span className="text-2xl font-semibold">{formatPrice(totalPrice)}</span>
              </div>

              {organization.bookingRequiresApproval && (
                <p className="text-sm text-muted-foreground text-center">
                  Your booking will be confirmed once approved by {organization.name}
                </p>
              )}
            </CardContent>
          </>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between p-6 pt-0">
          <Button
            variant="ghost"
            onClick={goBack}
            disabled={currentStep === "services"}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back
          </Button>

          {currentStep === "confirm" ? (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[140px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Booking...
                </>
              ) : (
                <>
                  Confirm Booking
                  <Check className="h-4 w-4 ml-2" />
                </>
              )}
            </Button>
          ) : (
            <Button onClick={goNext} disabled={!canProceed()}>
              Continue
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </Card>

      {/* Price summary footer */}
      {selectedServices.length > 0 && currentStep !== "confirm" && (
        <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t p-4 lg:relative lg:bg-transparent lg:backdrop-blur-none lg:border-0 lg:p-0">
          <div className="flex items-center justify-between max-w-3xl mx-auto">
            <div>
              <p className="text-sm text-muted-foreground">
                {selectedServices.length} service{selectedServices.length !== 1 ? "s" : ""} - {totalDuration} min
              </p>
              <p className="text-lg font-semibold">{formatPrice(totalPrice)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
