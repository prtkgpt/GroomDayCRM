"use client"

import { useState, useTransition } from "react"
import { format } from "date-fns"
import { Bell, Check, X, PawPrint, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/use-toast"
import { approveBooking, declineBooking } from "@/lib/actions/appointments"
import { formatCurrency } from "@/lib/utils"

interface Appointment {
  id: string
  dateTime: Date
  duration: number
  totalAmount: number
  client: {
    firstName: string
    lastName: string
    email: string | null
    phone: string | null
  }
  appointmentPets: {
    pet: {
      name: string
      species: string
      breed: string | null
    }
  }[]
  appointmentServices: {
    service: {
      name: string
    }
  }[]
}

interface PendingBookingsCardProps {
  appointments: Appointment[]
}

export function PendingBookingsCard({ appointments }: PendingBookingsCardProps) {
  const [isPending, startTransition] = useTransition()
  const [processingId, setProcessingId] = useState<string | null>(null)

  const handleApprove = (id: string) => {
    setProcessingId(id)
    startTransition(async () => {
      try {
        await approveBooking(id)
        toast({
          title: "Booking approved",
          description: "Confirmation email sent to customer",
        })
      } catch (error) {
        toast({
          title: "Failed to approve booking",
          variant: "destructive",
        })
      } finally {
        setProcessingId(null)
      }
    })
  }

  const handleDecline = (id: string) => {
    setProcessingId(id)
    startTransition(async () => {
      try {
        await declineBooking(id)
        toast({
          title: "Booking declined",
          description: "Customer has been notified",
        })
      } catch (error) {
        toast({
          title: "Failed to decline booking",
          variant: "destructive",
        })
      } finally {
        setProcessingId(null)
      }
    })
  }

  return (
    <Card className="border-blue-500 bg-blue-50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-blue-800">
            {appointments.length} New Booking Request{appointments.length !== 1 && "s"}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {appointments.map((appt) => (
          <div
            key={appt.id}
            className="p-4 bg-white rounded-lg border border-blue-200"
          >
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="space-y-1">
                <p className="font-medium">
                  {appt.client.firstName} {appt.client.lastName}
                </p>
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  <PawPrint className="h-3 w-3" />
                  {appt.appointmentPets.map((ap) => ap.pet.name).join(", ")}
                  {appt.appointmentPets[0]?.pet.breed && (
                    <span> ({appt.appointmentPets[0].pet.breed})</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  {appt.appointmentServices.map((as) => as.service.name).join(", ")}
                </p>
                <p className="text-sm">
                  <span className="font-medium">
                    {format(new Date(appt.dateTime), "EEE, MMM d")}
                  </span>{" "}
                  at {format(new Date(appt.dateTime), "h:mm a")} •{" "}
                  {formatCurrency(appt.totalAmount)}
                </p>
                {appt.client.email && (
                  <p className="text-xs text-muted-foreground">
                    {appt.client.email}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDecline(appt.id)}
                  disabled={isPending && processingId === appt.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  {isPending && processingId === appt.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <X className="h-4 w-4 mr-1" />
                      Decline
                    </>
                  )}
                </Button>
                <Button
                  size="sm"
                  onClick={() => handleApprove(appt.id)}
                  disabled={isPending && processingId === appt.id}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isPending && processingId === appt.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Approve
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
