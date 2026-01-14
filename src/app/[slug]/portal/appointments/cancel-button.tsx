"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { cancelAppointment } from "@/lib/actions/client-portal"
import { toast } from "@/components/ui/use-toast"

interface CancelAppointmentButtonProps {
  clientId: string
  appointmentId: string
  slug: string
}

export function CancelAppointmentButton({
  clientId,
  appointmentId,
  slug,
}: CancelAppointmentButtonProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)

  const handleCancel = () => {
    startTransition(async () => {
      try {
        const result = await cancelAppointment(clientId, appointmentId)
        if (result.success) {
          toast({ title: "Appointment cancelled" })
          setOpen(false)
          router.refresh()
        } else {
          toast({
            title: result.error || "Failed to cancel appointment",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({
          title: "Something went wrong",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="sm" className="mt-2 text-destructive hover:text-destructive">
          <X className="h-4 w-4 mr-1" />
          Cancel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Appointment?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel this appointment? This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending}>Keep Appointment</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              handleCancel()
            }}
            disabled={isPending}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Cancelling...
              </>
            ) : (
              "Yes, Cancel"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
