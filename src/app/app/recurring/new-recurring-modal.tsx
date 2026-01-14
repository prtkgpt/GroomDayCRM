"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { toast } from "@/components/ui/use-toast"
import { createRecurringSchedule, type RecurringScheduleFormData } from "@/lib/actions/recurring"
import { getClients } from "@/lib/actions/clients"
import { getServices } from "@/lib/actions/services"

const dayOfWeekOptions = [
  { value: "0", label: "Sunday" },
  { value: "1", label: "Monday" },
  { value: "2", label: "Tuesday" },
  { value: "3", label: "Wednesday" },
  { value: "4", label: "Thursday" },
  { value: "5", label: "Friday" },
  { value: "6", label: "Saturday" },
]

export function NewRecurringModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [clients, setClients] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [selectedClient, setSelectedClient] = useState<string>("")
  const [selectedPets, setSelectedPets] = useState<string[]>([])
  const [selectedServices, setSelectedServices] = useState<string[]>([])
  const [frequency, setFrequency] = useState<"WEEKLY" | "BIWEEKLY" | "MONTHLY">("WEEKLY")

  useEffect(() => {
    if (open) {
      loadData()
    }
  }, [open])

  const loadData = async () => {
    const [clientsData, servicesData] = await Promise.all([
      getClients(),
      getServices(),
    ])
    setClients(clientsData)
    setServices(servicesData.filter((s: any) => s.isActive))
  }

  const selectedClientData = clients.find((c) => c.id === selectedClient)

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const data: RecurringScheduleFormData = {
      name: formData.get("name") as string || undefined,
      frequency,
      dayOfWeek: frequency !== "MONTHLY" ? parseInt(formData.get("dayOfWeek") as string) : undefined,
      dayOfMonth: frequency === "MONTHLY" ? parseInt(formData.get("dayOfMonth") as string) : undefined,
      time: formData.get("time") as string,
      duration: parseInt(formData.get("duration") as string) || 60,
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string || undefined,
      locationType: formData.get("locationType") as any || "CLIENT_HOME",
      locationAddress: formData.get("locationAddress") as string || undefined,
      notes: formData.get("notes") as string || undefined,
      clientId: selectedClient,
      petIds: selectedPets,
      serviceIds: selectedServices,
    }

    if (!data.clientId || data.petIds.length === 0 || data.serviceIds.length === 0) {
      toast({
        title: "Missing required fields",
        description: "Please select a client, at least one pet, and at least one service.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        await createRecurringSchedule(data)
        toast({ title: "Recurring schedule created" })
        setOpen(false)
        resetForm()
        router.refresh()
      } catch (error) {
        toast({
          title: "Failed to create schedule",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        })
      }
    })
  }

  const resetForm = () => {
    setSelectedClient("")
    setSelectedPets([])
    setSelectedServices([])
    setFrequency("WEEKLY")
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Schedule
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Recurring Schedule</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Schedule Name (optional)</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Max's monthly groom"
              />
            </div>

            <div>
              <Label>Client</Label>
              <Select value={selectedClient} onValueChange={(v) => {
                setSelectedClient(v)
                setSelectedPets([])
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.firstName} {client.lastName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedClientData && selectedClientData.pets.length > 0 && (
              <div>
                <Label>Pets</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {selectedClientData.pets.map((pet: any) => (
                    <label
                      key={pet.id}
                      className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-accent"
                    >
                      <Checkbox
                        checked={selectedPets.includes(pet.id)}
                        onCheckedChange={(checked) => {
                          setSelectedPets(
                            checked
                              ? [...selectedPets, pet.id]
                              : selectedPets.filter((id) => id !== pet.id)
                          )
                        }}
                      />
                      <span>{pet.name}</span>
                      {pet.breed && (
                        <span className="text-sm text-muted-foreground">({pet.breed})</span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Services</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {services.map((service) => (
                  <label
                    key={service.id}
                    className="flex items-center gap-2 p-2 border rounded-lg cursor-pointer hover:bg-accent"
                  >
                    <Checkbox
                      checked={selectedServices.includes(service.id)}
                      onCheckedChange={(checked) => {
                        setSelectedServices(
                          checked
                            ? [...selectedServices, service.id]
                            : selectedServices.filter((id) => id !== service.id)
                        )
                      }}
                    />
                    <span>{service.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ${service.defaultPrice}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium">Schedule Pattern</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frequency</Label>
                <Select value={frequency} onValueChange={(v: any) => setFrequency(v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                    <SelectItem value="BIWEEKLY">Every 2 Weeks</SelectItem>
                    <SelectItem value="MONTHLY">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {frequency !== "MONTHLY" ? (
                <div>
                  <Label>Day of Week</Label>
                  <Select name="dayOfWeek" defaultValue="1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {dayOfWeekOptions.map((day) => (
                        <SelectItem key={day.value} value={day.value}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div>
                  <Label>Day of Month</Label>
                  <Select name="dayOfMonth" defaultValue="1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[...Array(28)].map((_, i) => (
                        <SelectItem key={i + 1} value={(i + 1).toString()}>
                          {i + 1}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  name="time"
                  type="time"
                  defaultValue="10:00"
                  required
                />
              </div>

              <div>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Input
                  id="duration"
                  name="duration"
                  type="number"
                  defaultValue="60"
                  min="15"
                  step="15"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  name="startDate"
                  type="date"
                  defaultValue={new Date().toISOString().split("T")[0]}
                  required
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date (optional)</Label>
                <Input
                  id="endDate"
                  name="endDate"
                  type="date"
                />
              </div>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <h4 className="font-medium">Location</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Location Type</Label>
                <Select name="locationType" defaultValue="CLIENT_HOME">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLIENT_HOME">Client's Home</SelectItem>
                    <SelectItem value="BUSINESS">Business Location</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="locationAddress">Address</Label>
                <Input
                  id="locationAddress"
                  name="locationAddress"
                  placeholder="123 Main St"
                  defaultValue={selectedClientData?.address || ""}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Any special instructions..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Create Schedule
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
