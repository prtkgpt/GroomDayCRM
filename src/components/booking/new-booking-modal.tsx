"use client"

import { useState, useEffect, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { format, addMinutes, setHours, setMinutes } from "date-fns"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { cn, formatCurrency, formatDuration } from "@/lib/utils"
import { appointmentSchema, type AppointmentFormData } from "@/lib/validations"
import { searchClients, createClient } from "@/lib/actions/clients"
import { createPet } from "@/lib/actions/pets"
import { getServices } from "@/lib/actions/services"
import { createAppointment } from "@/lib/actions/appointments"
import {
  CalendarIcon,
  Search,
  Plus,
  User,
  MapPin,
  Clock,
  DollarSign,
  PawPrint,
  X,
  Loader2,
} from "lucide-react"

interface NewBookingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialDate?: Date
}

type Step = "client" | "pets" | "services" | "schedule" | "confirm"

export function NewBookingModal({
  open,
  onOpenChange,
  initialDate,
}: NewBookingModalProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [step, setStep] = useState<Step>("client")

  // Client state
  const [clientSearch, setClientSearch] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<any>(null)
  const [isSearching, setIsSearching] = useState(false)
  const [showNewClientForm, setShowNewClientForm] = useState(false)
  const [newClientData, setNewClientData] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    address: "",
  })

  // Pet state
  const [selectedPets, setSelectedPets] = useState<string[]>([])
  const [showNewPetForm, setShowNewPetForm] = useState(false)
  const [newPetData, setNewPetData] = useState({
    name: "",
    breed: "",
    weight: "",
  })

  // Services state
  const [services, setServices] = useState<any[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])

  // Schedule state
  const [selectedDate, setSelectedDate] = useState<Date>(initialDate || new Date())
  const [selectedTime, setSelectedTime] = useState("09:00")
  const [locationType, setLocationType] = useState<"CLIENT_HOME" | "BUSINESS" | "OTHER">("CLIENT_HOME")
  const [locationAddress, setLocationAddress] = useState("")
  const [notes, setNotes] = useState("")

  // Load services on mount
  useEffect(() => {
    if (open) {
      getServices().then(setServices)
    }
  }, [open])

  // Search clients
  useEffect(() => {
    if (clientSearch.length >= 2) {
      setIsSearching(true)
      const timer = setTimeout(async () => {
        const results = await searchClients(clientSearch)
        setSearchResults(results)
        setIsSearching(false)
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setSearchResults([])
    }
  }, [clientSearch])

  // Auto-fill address
  useEffect(() => {
    if (selectedClient && locationType === "CLIENT_HOME") {
      const parts = [
        selectedClient.address,
        selectedClient.city,
        selectedClient.state,
        selectedClient.zipCode,
      ].filter(Boolean)
      setLocationAddress(parts.join(", "))
    }
  }, [selectedClient, locationType])

  // Calculate totals
  const selectedServiceDetails = services.filter((s) =>
    selectedServices.includes(s.id)
  )
  const totalDuration = selectedServiceDetails.reduce(
    (sum, s) => sum + s.defaultDuration,
    0
  )
  const totalPrice = selectedServiceDetails.reduce(
    (sum, s) => sum + s.defaultPrice,
    0
  )

  const resetModal = () => {
    setStep("client")
    setClientSearch("")
    setSearchResults([])
    setSelectedClient(null)
    setShowNewClientForm(false)
    setNewClientData({ firstName: "", lastName: "", phone: "", email: "", address: "" })
    setSelectedPets([])
    setShowNewPetForm(false)
    setNewPetData({ name: "", breed: "", weight: "" })
    setSelectedServices([])
    setSelectedDate(initialDate || new Date())
    setSelectedTime("09:00")
    setLocationType("CLIENT_HOME")
    setLocationAddress("")
    setNotes("")
  }

  const handleCreateClient = async () => {
    if (!newClientData.firstName || !newClientData.lastName) {
      toast({ title: "Please enter first and last name", variant: "destructive" })
      return
    }

    startTransition(async () => {
      try {
        const client = await createClient({
          firstName: newClientData.firstName,
          lastName: newClientData.lastName,
          phone: newClientData.phone || undefined,
          email: newClientData.email || undefined,
          address: newClientData.address || undefined,
        })
        setSelectedClient({ ...client, pets: [] })
        setShowNewClientForm(false)
        toast({ title: "Client created!" })
      } catch (error) {
        toast({ title: "Failed to create client", variant: "destructive" })
      }
    })
  }

  const handleCreatePet = async () => {
    if (!newPetData.name || !selectedClient) {
      toast({ title: "Please enter pet name", variant: "destructive" })
      return
    }

    startTransition(async () => {
      try {
        const pet = await createPet({
          name: newPetData.name,
          breed: newPetData.breed || undefined,
          weight: newPetData.weight ? parseFloat(newPetData.weight) : undefined,
          clientId: selectedClient.id,
        })
        setSelectedClient({
          ...selectedClient,
          pets: [...(selectedClient.pets || []), pet],
        })
        setSelectedPets([...selectedPets, pet.id])
        setShowNewPetForm(false)
        setNewPetData({ name: "", breed: "", weight: "" })
        toast({ title: "Pet added!" })
      } catch (error) {
        toast({ title: "Failed to add pet", variant: "destructive" })
      }
    })
  }

  const handleSubmit = async () => {
    if (!selectedClient || selectedPets.length === 0 || selectedServices.length === 0) {
      toast({ title: "Please complete all required fields", variant: "destructive" })
      return
    }

    const [hours, minutes] = selectedTime.split(":").map(Number)
    const dateTime = setMinutes(setHours(selectedDate, hours), minutes)

    startTransition(async () => {
      try {
        await createAppointment({
          clientId: selectedClient.id,
          petIds: selectedPets,
          serviceIds: selectedServices,
          dateTime: dateTime.toISOString(),
          duration: totalDuration,
          locationType,
          locationAddress: locationAddress || undefined,
          notes: notes || undefined,
          subtotal: totalPrice,
        })
        toast({ title: "Appointment booked!", variant: "default" })
        onOpenChange(false)
        resetModal()
        router.refresh()
      } catch (error) {
        toast({ title: "Failed to create appointment", variant: "destructive" })
      }
    })
  }

  const canProceed = () => {
    switch (step) {
      case "client":
        return !!selectedClient
      case "pets":
        return selectedPets.length > 0
      case "services":
        return selectedServices.length > 0
      case "schedule":
        return !!selectedDate && !!selectedTime
      default:
        return true
    }
  }

  const nextStep = () => {
    const steps: Step[] = ["client", "pets", "services", "schedule", "confirm"]
    const currentIndex = steps.indexOf(step)
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1])
    }
  }

  const prevStep = () => {
    const steps: Step[] = ["client", "pets", "services", "schedule", "confirm"]
    const currentIndex = steps.indexOf(step)
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1])
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) resetModal(); onOpenChange(o) }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New Booking</DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-1 mb-4">
          {["client", "pets", "services", "schedule", "confirm"].map((s, i) => (
            <div
              key={s}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                ["client", "pets", "services", "schedule", "confirm"].indexOf(step) >= i
                  ? "bg-primary"
                  : "bg-muted"
              )}
            />
          ))}
        </div>

        {/* Step 1: Client */}
        {step === "client" && (
          <div className="space-y-4">
            <Label>Select Client</Label>

            {selectedClient ? (
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">
                      {selectedClient.firstName} {selectedClient.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedClient.pets?.length || 0} pet(s)
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setSelectedClient(null)
                    setSelectedPets([])
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : showNewClientForm ? (
              <div className="space-y-3 p-4 border rounded-lg">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>First Name *</Label>
                    <Input
                      value={newClientData.firstName}
                      onChange={(e) =>
                        setNewClientData({ ...newClientData, firstName: e.target.value })
                      }
                      placeholder="John"
                    />
                  </div>
                  <div>
                    <Label>Last Name *</Label>
                    <Input
                      value={newClientData.lastName}
                      onChange={(e) =>
                        setNewClientData({ ...newClientData, lastName: e.target.value })
                      }
                      placeholder="Doe"
                    />
                  </div>
                </div>
                <div>
                  <Label>Phone</Label>
                  <Input
                    value={newClientData.phone}
                    onChange={(e) =>
                      setNewClientData({ ...newClientData, phone: e.target.value })
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={newClientData.email}
                    onChange={(e) =>
                      setNewClientData({ ...newClientData, email: e.target.value })
                    }
                    placeholder="john@email.com"
                  />
                </div>
                <div>
                  <Label>Address</Label>
                  <Input
                    value={newClientData.address}
                    onChange={(e) =>
                      setNewClientData({ ...newClientData, address: e.target.value })
                    }
                    placeholder="123 Main St, City, ST 12345"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewClientForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreateClient}
                    disabled={isPending}
                    className="flex-1"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={clientSearch}
                    onChange={(e) => setClientSearch(e.target.value)}
                    placeholder="Search clients or pets..."
                    className="pl-9"
                  />
                </div>

                {isSearching && (
                  <div className="text-center py-4 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                  </div>
                )}

                {searchResults.length > 0 && (
                  <div className="border rounded-lg max-h-48 overflow-y-auto">
                    {searchResults.map((client) => (
                      <button
                        key={client.id}
                        onClick={() => {
                          setSelectedClient(client)
                          setClientSearch("")
                          setSearchResults([])
                        }}
                        className="w-full p-3 text-left hover:bg-accent transition-colors border-b last:border-0"
                      >
                        <p className="font-medium">
                          {client.firstName} {client.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {client.pets?.map((p: any) => p.name).join(", ") || "No pets"}
                        </p>
                      </button>
                    ))}
                  </div>
                )}

                <Button
                  variant="outline"
                  onClick={() => setShowNewClientForm(true)}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Client
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Pets */}
        {step === "pets" && selectedClient && (
          <div className="space-y-4">
            <Label>Select Pet(s)</Label>

            {(selectedClient.pets || []).length > 0 ? (
              <div className="space-y-2">
                {selectedClient.pets.map((pet: any) => (
                  <label
                    key={pet.id}
                    className={cn(
                      "flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors",
                      selectedPets.includes(pet.id)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent"
                    )}
                  >
                    <Checkbox
                      checked={selectedPets.includes(pet.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedPets([...selectedPets, pet.id])
                        } else {
                          setSelectedPets(selectedPets.filter((id) => id !== pet.id))
                        }
                      }}
                    />
                    <PawPrint className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{pet.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {[pet.breed, pet.weight && `${pet.weight} lbs`]
                          .filter(Boolean)
                          .join(" • ") || "No details"}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No pets on file.</p>
            )}

            {showNewPetForm ? (
              <div className="space-y-3 p-4 border rounded-lg">
                <div>
                  <Label>Pet Name *</Label>
                  <Input
                    value={newPetData.name}
                    onChange={(e) =>
                      setNewPetData({ ...newPetData, name: e.target.value })
                    }
                    placeholder="Buddy"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Breed</Label>
                    <Input
                      value={newPetData.breed}
                      onChange={(e) =>
                        setNewPetData({ ...newPetData, breed: e.target.value })
                      }
                      placeholder="Golden Retriever"
                    />
                  </div>
                  <div>
                    <Label>Weight (lbs)</Label>
                    <Input
                      type="number"
                      value={newPetData.weight}
                      onChange={(e) =>
                        setNewPetData({ ...newPetData, weight: e.target.value })
                      }
                      placeholder="50"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowNewPetForm(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleCreatePet}
                    disabled={isPending}
                    className="flex-1"
                  >
                    {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Add Pet"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => setShowNewPetForm(true)}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add New Pet
              </Button>
            )}
          </div>
        )}

        {/* Step 3: Services */}
        {step === "services" && (
          <div className="space-y-4">
            <Label>Select Service(s)</Label>

            <div className="space-y-2">
              {services
                .filter((s) => !s.isAddOn)
                .map((service) => (
                  <label
                    key={service.id}
                    className={cn(
                      "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                      selectedServices.includes(service.id)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-accent"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={selectedServices.includes(service.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedServices([...selectedServices, service.id])
                          } else {
                            setSelectedServices(
                              selectedServices.filter((id) => id !== service.id)
                            )
                          }
                        }}
                      />
                      <div>
                        <p className="font-medium">{service.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDuration(service.defaultDuration)}
                        </p>
                      </div>
                    </div>
                    <span className="font-medium">
                      {formatCurrency(service.defaultPrice)}
                    </span>
                  </label>
                ))}
            </div>

            {services.some((s) => s.isAddOn) && (
              <>
                <Separator />
                <Label>Add-ons</Label>
                <div className="space-y-2">
                  {services
                    .filter((s) => s.isAddOn)
                    .map((service) => (
                      <label
                        key={service.id}
                        className={cn(
                          "flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors",
                          selectedServices.includes(service.id)
                            ? "border-primary bg-primary/5"
                            : "hover:bg-accent"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedServices.includes(service.id)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedServices([...selectedServices, service.id])
                              } else {
                                setSelectedServices(
                                  selectedServices.filter((id) => id !== service.id)
                                )
                              }
                            }}
                          />
                          <div>
                            <p className="font-medium">{service.name}</p>
                            <p className="text-sm text-muted-foreground">
                              +{formatDuration(service.defaultDuration)}
                            </p>
                          </div>
                        </div>
                        <span className="font-medium">
                          +{formatCurrency(service.defaultPrice)}
                        </span>
                      </label>
                    ))}
                </div>
              </>
            )}

            {selectedServices.length > 0 && (
              <div className="p-3 bg-muted rounded-lg flex justify-between">
                <span>
                  Total: {formatDuration(totalDuration)}
                </span>
                <span className="font-bold">{formatCurrency(totalPrice)}</span>
              </div>
            )}
          </div>
        )}

        {/* Step 4: Schedule */}
        {step === "schedule" && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {format(selectedDate, "MMM d, yyyy")}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      selected={selectedDate}
                      onSelect={(date) => date && setSelectedDate(date)}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <Label>Time</Label>
                <Select value={selectedTime} onValueChange={setSelectedTime}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 20 }, (_, i) => {
                      const hour = Math.floor(i / 2) + 8
                      const min = i % 2 === 0 ? "00" : "30"
                      const time = `${hour.toString().padStart(2, "0")}:${min}`
                      const display = format(
                        setMinutes(setHours(new Date(), hour), parseInt(min)),
                        "h:mm a"
                      )
                      return (
                        <SelectItem key={time} value={time}>
                          {display}
                        </SelectItem>
                      )
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Location</Label>
              <Select
                value={locationType}
                onValueChange={(v: any) => setLocationType(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CLIENT_HOME">Client's Home</SelectItem>
                  <SelectItem value="BUSINESS">My Location</SelectItem>
                  <SelectItem value="OTHER">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Address</Label>
              <Input
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="123 Main St, City, ST 12345"
              />
            </div>

            <div>
              <Label>Notes (optional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Gate code, parking instructions, etc."
                rows={2}
              />
            </div>
          </div>
        )}

        {/* Step 5: Confirm */}
        {step === "confirm" && selectedClient && (
          <div className="space-y-4">
            <div className="p-4 border rounded-lg space-y-3">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {selectedClient.firstName} {selectedClient.lastName}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {selectedClient.phone || selectedClient.email}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <PawPrint className="h-5 w-5 text-muted-foreground" />
                <p>
                  {selectedClient.pets
                    ?.filter((p: any) => selectedPets.includes(p.id))
                    .map((p: any) => p.name)
                    .join(", ")}
                </p>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">
                    {format(selectedDate, "EEEE, MMMM d, yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {format(
                      setMinutes(
                        setHours(new Date(), parseInt(selectedTime.split(":")[0])),
                        parseInt(selectedTime.split(":")[1])
                      ),
                      "h:mm a"
                    )}{" "}
                    • {formatDuration(totalDuration)}
                  </p>
                </div>
              </div>

              <Separator />

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <p className="text-sm">{locationAddress || "No address"}</p>
              </div>

              <Separator />

              <div className="space-y-1">
                {selectedServiceDetails.map((service) => (
                  <div key={service.id} className="flex justify-between text-sm">
                    <span>{service.name}</span>
                    <span>{formatCurrency(service.defaultPrice)}</span>
                  </div>
                ))}
                <div className="flex justify-between font-bold pt-2 border-t">
                  <span>Total</span>
                  <span>{formatCurrency(totalPrice)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between pt-4 border-t">
          {step !== "client" ? (
            <Button variant="outline" onClick={prevStep}>
              Back
            </Button>
          ) : (
            <div />
          )}

          {step === "confirm" ? (
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Book Appointment
            </Button>
          ) : (
            <Button onClick={nextStep} disabled={!canProceed()}>
              Continue
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
