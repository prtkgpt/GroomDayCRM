"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  MoreVertical,
  Bell,
  Calendar,
  Trash2,
  XCircle,
  CheckCircle,
  Clock,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { toast } from "@/components/ui/use-toast"
import {
  notifyWaitlistClient,
  convertWaitlistToAppointment,
  cancelWaitlistEntry,
  deleteWaitlistEntry,
} from "@/lib/actions/waitlist"

interface WaitlistEntry {
  id: string
  status: string
  client: {
    id: string
    firstName: string
    lastName: string
    email: string | null
  }
  pets: Array<{ pet: { id: string; name: string } }>
  services: Array<{ service: { id: string; name: string; defaultDuration: number } }>
}

interface WaitlistActionsProps {
  entry: WaitlistEntry
}

export function WaitlistActions({ entry }: WaitlistActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [notifyDialogOpen, setNotifyDialogOpen] = useState(false)
  const [bookDialogOpen, setBookDialogOpen] = useState(false)
  const [slotDate, setSlotDate] = useState("")
  const [slotTime, setSlotTime] = useState("")

  const handleNotify = () => {
    if (!slotDate || !slotTime) {
      toast({ title: "Please select date and time", variant: "destructive" })
      return
    }

    const dateTime = new Date(`${slotDate}T${slotTime}`)

    startTransition(async () => {
      try {
        await notifyWaitlistClient(entry.id, dateTime)
        toast({ title: "Client notified of available slot" })
        setNotifyDialogOpen(false)
        router.refresh()
      } catch (error) {
        toast({ title: "Error notifying client", variant: "destructive" })
      }
    })
  }

  const handleBook = () => {
    if (!slotDate || !slotTime) {
      toast({ title: "Please select date and time", variant: "destructive" })
      return
    }

    const dateTime = new Date(`${slotDate}T${slotTime}`)

    startTransition(async () => {
      try {
        await convertWaitlistToAppointment(entry.id, dateTime)
        toast({ title: "Appointment booked from waitlist" })
        setBookDialogOpen(false)
        router.refresh()
      } catch (error) {
        toast({ title: "Error creating appointment", variant: "destructive" })
      }
    })
  }

  const handleCancel = () => {
    startTransition(async () => {
      try {
        await cancelWaitlistEntry(entry.id)
        toast({ title: "Waitlist entry cancelled" })
        router.refresh()
      } catch (error) {
        toast({ title: "Error cancelling entry", variant: "destructive" })
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteWaitlistEntry(entry.id)
        toast({ title: "Waitlist entry deleted" })
        router.refresh()
      } catch (error) {
        toast({ title: "Error deleting entry", variant: "destructive" })
      }
    })
  }

  const totalDuration = entry.services.reduce(
    (sum, s) => sum + s.service.defaultDuration,
    0
  )

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreVertical className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {entry.status === "ACTIVE" && (
            <>
              <DropdownMenuItem onClick={() => setNotifyDialogOpen(true)}>
                <Bell className="h-4 w-4 mr-2" />
                Notify of Opening
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setBookDialogOpen(true)}>
                <Calendar className="h-4 w-4 mr-2" />
                Book Directly
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          {entry.status === "NOTIFIED" && (
            <>
              <DropdownMenuItem onClick={() => setBookDialogOpen(true)}>
                <CheckCircle className="h-4 w-4 mr-2" />
                Confirm Booking
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem onClick={handleCancel} className="text-amber-600">
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Request
          </DropdownMenuItem>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Entry
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete waitlist entry?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove {entry.client.firstName} {entry.client.lastName} from the waitlist.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Notify Dialog */}
      <Dialog open={notifyDialogOpen} onOpenChange={setNotifyDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notify of Available Slot</DialogTitle>
            <DialogDescription>
              Send {entry.client.firstName} a notification about an available appointment time.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium">{entry.client.firstName} {entry.client.lastName}</p>
              <p className="text-sm text-muted-foreground">
                {entry.pets.map((p) => p.pet.name).join(", ")} • {entry.services.map((s) => s.service.name).join(", ")}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3.5 w-3.5" />
                {totalDuration} minutes needed
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Available Date</Label>
                <Input
                  type="date"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Available Time</Label>
                <Input
                  type="time"
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                />
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Client will have 24 hours to respond before the offer expires.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNotifyDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleNotify} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Bell className="h-4 w-4 mr-2" />
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Book Dialog */}
      <Dialog open={bookDialogOpen} onOpenChange={setBookDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Book Appointment</DialogTitle>
            <DialogDescription>
              Create an appointment directly from this waitlist request.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="font-medium">{entry.client.firstName} {entry.client.lastName}</p>
              <p className="text-sm text-muted-foreground">
                {entry.pets.map((p) => p.pet.name).join(", ")} • {entry.services.map((s) => s.service.name).join(", ")}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1 mt-1">
                <Clock className="h-3.5 w-3.5" />
                {totalDuration} minutes
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Appointment Date</Label>
                <Input
                  type="date"
                  value={slotDate}
                  onChange={(e) => setSlotDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Appointment Time</Label>
                <Input
                  type="time"
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleBook} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <Calendar className="h-4 w-4 mr-2" />
              Create Appointment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
