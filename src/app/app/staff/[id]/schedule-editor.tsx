"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/components/ui/use-toast"
import { updateStaffSchedule } from "@/lib/actions/staff"

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

interface Schedule {
  id: string
  dayOfWeek: number
  startTime: string
  endTime: string
  isWorking: boolean
}

interface ScheduleEditorProps {
  staffId: string
  schedules: Schedule[]
}

export function ScheduleEditor({ staffId, schedules }: ScheduleEditorProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editedSchedules, setEditedSchedules] = useState<Schedule[]>(schedules)
  const [hasChanges, setHasChanges] = useState(false)

  const handleToggleDay = (dayOfWeek: number, isWorking: boolean) => {
    setEditedSchedules((prev) =>
      prev.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, isWorking } : s
      )
    )
    setHasChanges(true)
  }

  const handleTimeChange = (dayOfWeek: number, field: "startTime" | "endTime", value: string) => {
    setEditedSchedules((prev) =>
      prev.map((s) =>
        s.dayOfWeek === dayOfWeek ? { ...s, [field]: value } : s
      )
    )
    setHasChanges(true)
  }

  const handleSave = () => {
    startTransition(async () => {
      try {
        await updateStaffSchedule(
          staffId,
          editedSchedules.map((s) => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            isWorking: s.isWorking,
          }))
        )
        toast({ title: "Schedule updated" })
        setHasChanges(false)
        router.refresh()
      } catch (error) {
        toast({
          title: "Failed to update schedule",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {dayLabels.map((day, index) => {
          const schedule = editedSchedules.find((s) => s.dayOfWeek === index)
          if (!schedule) return null

          return (
            <div
              key={day}
              className={`flex items-center gap-4 p-3 rounded-lg border ${
                schedule.isWorking ? "bg-background" : "bg-muted/50"
              }`}
            >
              <div className="w-24">
                <Label className="font-medium">{day}</Label>
              </div>
              <Switch
                checked={schedule.isWorking}
                onCheckedChange={(checked) => handleToggleDay(index, checked)}
              />
              {schedule.isWorking ? (
                <div className="flex items-center gap-2 flex-1">
                  <Input
                    type="time"
                    value={schedule.startTime}
                    onChange={(e) => handleTimeChange(index, "startTime", e.target.value)}
                    className="w-32"
                  />
                  <span className="text-muted-foreground">to</span>
                  <Input
                    type="time"
                    value={schedule.endTime}
                    onChange={(e) => handleTimeChange(index, "endTime", e.target.value)}
                    className="w-32"
                  />
                </div>
              ) : (
                <span className="text-muted-foreground text-sm">Off</span>
              )}
            </div>
          )
        })}
      </div>

      {hasChanges && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={isPending}>
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            Save Changes
          </Button>
        </div>
      )}
    </div>
  )
}
