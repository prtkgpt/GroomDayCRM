"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Search,
  Calendar,
  Clock,
  Loader2,
  PawPrint,
  Check,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { getClients } from "@/lib/actions/clients"
import { getServices } from "@/lib/actions/services"
import { createWaitlistEntry } from "@/lib/actions/waitlist"

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
]

interface Client {
  id: string
  firstName: string
  lastName: string
  email: string | null
  pets: Array<{ id: string; name: string; species: string }>
}

interface Service {
  id: string
  name: string
  defaultPrice: number
  defaultDuration: number
  isAddOn: boolean
}

export default function NewWaitlistEntryPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Client selection
  const [clientSearch, setClientSearch] = useState("")
  const [clientOpen, setClientOpen] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)

  // Form state
  const [selectedPetIds, setSelectedPetIds] = useState<string[]>([])
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [services, setServices] = useState<Service[]>([])

  // Scheduling preferences
  const [preferredDate, setPreferredDate] = useState("")
  const [selectedDays, setSelectedDays] = useState<number[]>([])
  const [preferredTimeStart, setPreferredTimeStart] = useState("")
  const [preferredTimeEnd, setPreferredTimeEnd] = useState("")
  const [isFlexibleDate, setIsFlexibleDate] = useState(false)
  const [isFlexibleTime, setIsFlexibleTime] = useState(false)

  // Other
  const [urgency, setUrgency] = useState<"LOW" | "NORMAL" | "HIGH" | "URGENT">("NORMAL")
  const [notes, setNotes] = useState("")

  // Load services
  useEffect(() => {
    async function loadServices() {
      try {
        const serviceList = await getServices()
        setServices(serviceList)
      } catch (error) {
        console.error("Error loading services:", error)
      }
    }
    loadServices()
  }, [])

  // Search clients
  const searchClients = async (query: string) => {
    try {
      const result = await getClients(query)
      setClients(result.slice(0, 10) as Client[])
    } catch (error) {
      console.error("Error searching clients:", error)
    }
  }

  const toggleDay = (day: number) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    )
  }

  const togglePet = (petId: string) => {
    setSelectedPetIds((prev) =>
      prev.includes(petId) ? prev.filter((id) => id !== petId) : [...prev, petId]
    )
  }

  const toggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    )
  }

  const handleSubmit = () => {
    if (!selectedClient) {
      toast({ title: "Please select a client", variant: "destructive" })
      return
    }
    if (selectedPetIds.length === 0) {
      toast({ title: "Please select at least one pet", variant: "destructive" })
      return
    }
    if (selectedServiceIds.length === 0) {
      toast({ title: "Please select at least one service", variant: "destructive" })
      return
    }

    startTransition(async () => {
      try {
        await createWaitlistEntry({
          clientId: selectedClient.id,
          petIds: selectedPetIds,
          serviceIds: selectedServiceIds,
          preferredDate: preferredDate ? new Date(preferredDate) : undefined,
          preferredDayOfWeek: selectedDays.length > 0 ? selectedDays : undefined,
          preferredTimeStart: preferredTimeStart || undefined,
          preferredTimeEnd: preferredTimeEnd || undefined,
          isFlexibleDate,
          isFlexibleTime,
          urgency,
          notes: notes || undefined,
        })
        toast({ title: "Added to waitlist" })
        router.push("/app/waitlist")
      } catch (error) {
        toast({ title: "Error adding to waitlist", variant: "destructive" })
      }
    })
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/waitlist">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Add to Waitlist</h1>
          <p className="text-muted-foreground">
            Add a client to the waitlist for appointment openings
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Client Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Client</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Popover open={clientOpen} onOpenChange={setClientOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                  {selectedClient
                    ? `${selectedClient.firstName} ${selectedClient.lastName}`
                    : "Search for a client..."}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[400px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search clients..."
                    value={clientSearch}
                    onChange={(e) => {
                      const value = e.target.value
                      setClientSearch(value)
                      if (value.length > 1) {
                        searchClients(value)
                      }
                    }}
                  />
                  <CommandList>
                    <CommandEmpty>No clients found.</CommandEmpty>
                    <CommandGroup>
                      {clients.map((client) => (
                        <CommandItem
                          key={client.id}
                          onSelect={() => {
                            setSelectedClient(client)
                            setSelectedPetIds([])
                            setClientOpen(false)
                          }}
                        >
                          <div>
                            <p className="font-medium">
                              {client.firstName} {client.lastName}
                            </p>
                            {client.email && (
                              <p className="text-sm text-muted-foreground">{client.email}</p>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Pet Selection */}
            {selectedClient && selectedClient.pets.length > 0 && (
              <div className="space-y-3">
                <Label>Select Pet(s)</Label>
                <div className="grid gap-2">
                  {selectedClient.pets.map((pet) => (
                    <div
                      key={pet.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                        selectedPetIds.includes(pet.id)
                          ? "border-primary bg-primary/5"
                          : "hover:bg-muted/50"
                      }`}
                      onClick={() => togglePet(pet.id)}
                    >
                      <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center">
                        <PawPrint className="h-4 w-4 text-amber-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{pet.name}</p>
                        <p className="text-sm text-muted-foreground">{pet.species}</p>
                      </div>
                      {selectedPetIds.includes(pet.id) && (
                        <Check className="h-5 w-5 text-primary" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Service Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Services Needed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2">
              {services
                .filter((s) => !s.isAddOn)
                .map((service) => (
                  <div
                    key={service.id}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                      selectedServiceIds.includes(service.id)
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                    onClick={() => toggleService(service.id)}
                  >
                    <div>
                      <p className="font-medium">{service.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {service.defaultDuration} min • ${service.defaultPrice}
                      </p>
                    </div>
                    {selectedServiceIds.includes(service.id) && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Scheduling Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scheduling Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Date Preferences */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Flexible on Date</Label>
                  <p className="text-sm text-muted-foreground">Any available date works</p>
                </div>
                <Switch checked={isFlexibleDate} onCheckedChange={setIsFlexibleDate} />
              </div>

              {!isFlexibleDate && (
                <>
                  <div className="space-y-2">
                    <Label>Specific Date Preferred</Label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="date"
                        className="pl-9"
                        value={preferredDate}
                        onChange={(e) => setPreferredDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Or Available Days</Label>
                    <div className="flex flex-wrap gap-2">
                      {DAYS_OF_WEEK.map((day) => (
                        <Button
                          key={day.value}
                          type="button"
                          size="sm"
                          variant={selectedDays.includes(day.value) ? "default" : "outline"}
                          onClick={() => toggleDay(day.value)}
                        >
                          {day.label.slice(0, 3)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Time Preferences */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label>Flexible on Time</Label>
                  <p className="text-sm text-muted-foreground">Any available time works</p>
                </div>
                <Switch checked={isFlexibleTime} onCheckedChange={setIsFlexibleTime} />
              </div>

              {!isFlexibleTime && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Earliest Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        className="pl-9"
                        value={preferredTimeStart}
                        onChange={(e) => setPreferredTimeStart(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Latest Time</Label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        className="pl-9"
                        value={preferredTimeEnd}
                        onChange={(e) => setPreferredTimeEnd(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Urgency & Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Additional Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Urgency Level</Label>
              <Select value={urgency} onValueChange={(v) => setUrgency(v as typeof urgency)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low - No rush</SelectItem>
                  <SelectItem value="NORMAL">Normal - Standard priority</SelectItem>
                  <SelectItem value="HIGH">High - Needs appointment soon</SelectItem>
                  <SelectItem value="URGENT">Urgent - ASAP (vaccine expiring, etc.)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Any special requests or notes..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Link href="/app/waitlist" className="flex-1">
            <Button variant="outline" className="w-full">
              Cancel
            </Button>
          </Link>
          <Button className="flex-1" onClick={handleSubmit} disabled={isPending}>
            {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Add to Waitlist
          </Button>
        </div>
      </div>
    </div>
  )
}
