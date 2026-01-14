"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { CalendarOff, Plus, Loader2, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { addStaffTimeOff, deleteStaffTimeOff } from "@/lib/actions/staff"

interface TimeOff {
  id: string
  startDate: Date
  endDate: Date
  reason: string | null
  notes: string | null
}

interface TimeOffSectionProps {
  staffId: string
  timeOff: TimeOff[]
}

export function TimeOffSection({ staffId, timeOff }: TimeOffSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const handleAddTimeOff = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const data = {
      startDate: formData.get("startDate") as string,
      endDate: formData.get("endDate") as string,
      reason: formData.get("reason") as string || undefined,
      notes: formData.get("notes") as string || undefined,
    }

    startTransition(async () => {
      try {
        await addStaffTimeOff(staffId, data)
        toast({ title: "Time off added" })
        setOpen(false)
        router.refresh()
      } catch (error) {
        toast({
          title: "Failed to add time off",
          variant: "destructive",
        })
      }
    })
  }

  const handleDelete = (id: string) => {
    setDeletingId(id)
    startTransition(async () => {
      try {
        await deleteStaffTimeOff(id)
        toast({ title: "Time off removed" })
        router.refresh()
      } catch (error) {
        toast({
          title: "Failed to remove time off",
          variant: "destructive",
        })
      } finally {
        setDeletingId(null)
      }
    })
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <CalendarOff className="h-5 w-5" />
          Time Off
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Time Off</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddTimeOff} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    name="startDate"
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    name="endDate"
                    type="date"
                    required
                    min={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="reason">Reason</Label>
                <Input
                  id="reason"
                  name="reason"
                  placeholder="e.g., Vacation, Sick, Personal"
                />
              </div>

              <div>
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  name="notes"
                  placeholder="Optional notes..."
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isPending}>
                  {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Add Time Off
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {timeOff.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">
            No upcoming time off scheduled
          </p>
        ) : (
          <div className="space-y-3">
            {timeOff.map((to) => (
              <div
                key={to.id}
                className="flex items-center justify-between p-3 rounded-lg border"
              >
                <div>
                  <p className="font-medium">
                    {format(new Date(to.startDate), "MMM d")} -{" "}
                    {format(new Date(to.endDate), "MMM d, yyyy")}
                  </p>
                  {to.reason && (
                    <p className="text-sm text-muted-foreground">{to.reason}</p>
                  )}
                  {to.notes && (
                    <p className="text-sm text-muted-foreground">{to.notes}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDelete(to.id)}
                  disabled={deletingId === to.id}
                >
                  {deletingId === to.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
