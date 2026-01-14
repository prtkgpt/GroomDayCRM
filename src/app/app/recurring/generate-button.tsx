"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Calendar, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
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
import { generateAllUpcomingAppointments } from "@/lib/actions/recurring"

export function GenerateButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [weeksAhead, setWeeksAhead] = useState("4")

  const handleGenerate = () => {
    startTransition(async () => {
      try {
        const result = await generateAllUpcomingAppointments(parseInt(weeksAhead))
        toast({
          title: "Appointments Generated",
          description: `Created ${result.totalCreated} appointments from ${result.schedulesProcessed} schedules.`,
        })
        setOpen(false)
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
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Calendar className="h-4 w-4 mr-2" />
        Generate Appointments
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Upcoming Appointments</DialogTitle>
            <DialogDescription>
              Create appointments from all active recurring schedules for the specified time period.
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
            <Button variant="outline" onClick={() => setOpen(false)}>
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
