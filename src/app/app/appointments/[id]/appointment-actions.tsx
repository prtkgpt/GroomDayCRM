"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  MoreVertical,
  Check,
  X,
  Clock,
  Play,
  AlertTriangle,
  Trash2,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { updateAppointmentStatus, deleteAppointment } from "@/lib/actions/appointments"

interface AppointmentActionsProps {
  appointment: {
    id: string
    status: string
  }
}

export function AppointmentActions({ appointment }: AppointmentActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)

  const updateStatus = (
    status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "NO_SHOW" | "CANCELED"
  ) => {
    startTransition(async () => {
      try {
        await updateAppointmentStatus(appointment.id, status)
        toast({ title: `Status updated to ${status.replace("_", " ").toLowerCase()}` })
        router.refresh()
      } catch (error) {
        toast({ title: "Failed to update status", variant: "destructive" })
      }
    })
  }

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        await deleteAppointment(appointment.id)
        toast({ title: "Appointment deleted" })
        router.push("/app/calendar")
      } catch (error) {
        toast({ title: "Failed to delete appointment", variant: "destructive" })
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-2">
        {appointment.status === "SCHEDULED" && (
          <Button onClick={() => updateStatus("CONFIRMED")} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Confirm
          </Button>
        )}
        {appointment.status === "CONFIRMED" && (
          <Button onClick={() => updateStatus("IN_PROGRESS")} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Play className="h-4 w-4 mr-2" />
            )}
            Start
          </Button>
        )}
        {appointment.status === "IN_PROGRESS" && (
          <Button onClick={() => updateStatus("COMPLETED")} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Complete
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={() => updateStatus("SCHEDULED")}
              disabled={isPending || appointment.status === "SCHEDULED"}
            >
              <Clock className="h-4 w-4 mr-2" />
              Mark as Scheduled
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateStatus("CONFIRMED")}
              disabled={isPending || appointment.status === "CONFIRMED"}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark as Confirmed
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateStatus("IN_PROGRESS")}
              disabled={isPending || appointment.status === "IN_PROGRESS"}
            >
              <Play className="h-4 w-4 mr-2" />
              Mark as In Progress
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateStatus("COMPLETED")}
              disabled={isPending || appointment.status === "COMPLETED"}
            >
              <Check className="h-4 w-4 mr-2" />
              Mark as Completed
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => updateStatus("NO_SHOW")}
              disabled={isPending || appointment.status === "NO_SHOW"}
              className="text-yellow-600"
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              Mark as No Show
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => updateStatus("CANCELED")}
              disabled={isPending || appointment.status === "CANCELED"}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Mark as Canceled
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Appointment
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete appointment?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this appointment. This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive hover:bg-destructive/90"
              disabled={isPending}
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
