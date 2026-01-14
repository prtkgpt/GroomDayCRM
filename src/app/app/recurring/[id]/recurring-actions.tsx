"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  MoreHorizontal,
  Loader2,
  Calendar,
  Pause,
  Play,
  Trash2,
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import {
  toggleRecurringSchedule,
  deleteRecurringSchedule,
  generateAppointmentsFromSchedule,
} from "@/lib/actions/recurring"

interface RecurringActionsProps {
  schedule: {
    id: string
    isActive: boolean
    name: string | null
  }
}

export function RecurringActions({ schedule }: RecurringActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showGenerateDialog, setShowGenerateDialog] = useState(false)
  const [weeksAhead, setWeeksAhead] = useState("4")

  const handleToggle = () => {
    startTransition(async () => {
      try {
        await toggleRecurringSchedule(schedule.id, !schedule.isActive)
        toast({
          title: schedule.isActive ? "Schedule paused" : "Schedule activated",
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Failed to update schedule",
          variant: "destructive",
        })
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteRecurringSchedule(schedule.id)
        toast({ title: "Schedule deleted" })
        router.push("/app/recurring")
      } catch (error) {
        toast({
          title: "Failed to delete schedule",
          variant: "destructive",
        })
      }
    })
  }

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        const appointments = await generateAppointmentsFromSchedule(
          schedule.id,
          parseInt(weeksAhead)
        )
        toast({
          title: "Appointments generated",
          description: `Created ${appointments.length} appointments`,
        })
        setShowGenerateDialog(false)
        router.refresh()
      } catch (error) {
        toast({
          title: "Failed to generate appointments",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          onClick={() => setShowGenerateDialog(true)}
          disabled={isPending || !schedule.isActive}
        >
          <Calendar className="h-4 w-4 mr-2" />
          Generate
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <MoreHorizontal className="h-4 w-4" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleToggle}>
              {schedule.isActive ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause Schedule
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Activate Schedule
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => setShowDeleteDialog(true)}
              className="text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Schedule
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Recurring Schedule?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete the recurring schedule. Existing appointments created
              from this schedule will not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showGenerateDialog} onOpenChange={setShowGenerateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Appointments</DialogTitle>
            <DialogDescription>
              Create appointments from this recurring schedule for the specified time period.
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <Label htmlFor="weeksAhead">Generate appointments for the next</Label>
            <Select value={weeksAhead} onValueChange={setWeeksAhead}>
              <SelectTrigger className="mt-2">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 weeks</SelectItem>
                <SelectItem value="4">4 weeks</SelectItem>
                <SelectItem value="8">8 weeks</SelectItem>
                <SelectItem value="12">12 weeks</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGenerateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleGenerate} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Generate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
