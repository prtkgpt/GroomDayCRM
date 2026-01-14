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
  Bell,
  Users,
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { updateAppointmentStatus, deleteAppointment, cancelAppointment } from "@/lib/actions/appointments"

interface AppointmentActionsProps {
  appointment: {
    id: string
    status: string
    dateTime: Date
    duration: number
  }
}

export function AppointmentActions({ appointment }: AppointmentActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [notifyClient, setNotifyClient] = useState(true)
  const [autoNotifyWaitlist, setAutoNotifyWaitlist] = useState(true)
  const [cancelResult, setCancelResult] = useState<{
    matchingWaitlistEntries: any[]
    notifiedCount: number
  } | null>(null)

  const handleCancel = async () => {
    startTransition(async () => {
      try {
        const result = await cancelAppointment(appointment.id, {
          reason: cancelReason || undefined,
          notifyClient,
          notifyWaitlist: true,
          autoNotifyTopMatch: autoNotifyWaitlist,
        })

        setCancelResult({
          matchingWaitlistEntries: result.matchingWaitlistEntries,
          notifiedCount: result.notifiedCount,
        })

        if (result.notifiedCount > 0) {
          toast({
            title: "Appointment cancelled",
            description: `Notified ${result.notifiedCount} waitlisted client(s) about the available slot.`,
          })
        } else if (result.matchingWaitlistEntries.length > 0) {
          toast({
            title: "Appointment cancelled",
            description: `Found ${result.matchingWaitlistEntries.length} potential waitlist match(es). Visit the Waitlist page to notify them.`,
          })
        } else {
          toast({ title: "Appointment cancelled" })
        }

        setShowCancelDialog(false)
        router.refresh()
      } catch (error) {
        toast({ title: "Failed to cancel appointment", variant: "destructive" })
      }
    })
  }

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
              onClick={() => setShowCancelDialog(true)}
              disabled={isPending || appointment.status === "CANCELED"}
              className="text-muted-foreground"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel Appointment
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

      {/* Cancel Dialog with Waitlist Notification */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Appointment</DialogTitle>
            <DialogDescription>
              Cancel this appointment and optionally notify waitlisted clients about the available slot.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Cancellation Reason (optional)</Label>
              <Input
                id="cancel-reason"
                placeholder="e.g., Client requested, Schedule conflict..."
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>

            <div className="space-y-3 pt-2 border-t">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-client">Notify Client</Label>
                  <p className="text-xs text-muted-foreground">
                    Send cancellation email to the client
                  </p>
                </div>
                <Switch
                  id="notify-client"
                  checked={notifyClient}
                  onCheckedChange={setNotifyClient}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="notify-waitlist" className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Auto-Notify Waitlist
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Automatically notify the top matching waitlist client
                  </p>
                </div>
                <Switch
                  id="notify-waitlist"
                  checked={autoNotifyWaitlist}
                  onCheckedChange={setAutoNotifyWaitlist}
                />
              </div>
            </div>

            {new Date(appointment.dateTime) > new Date() && (
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-lg p-3 flex items-start gap-2">
                <Users className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  This slot will be offered to waitlisted clients who match the date/time preferences.
                  {autoNotifyWaitlist
                    ? " The highest priority match will be automatically notified."
                    : " You can manually notify clients from the Waitlist page."
                  }
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
            >
              Keep Appointment
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancel}
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Cancelling...
                </>
              ) : (
                "Cancel Appointment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
