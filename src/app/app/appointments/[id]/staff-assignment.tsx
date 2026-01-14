"use client"

import { useState, useTransition, useEffect } from "react"
import { useRouter } from "next/navigation"
import { UserCog, Loader2, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { getInitials } from "@/lib/utils"
import { getStaffMembers, assignStaffToAppointment } from "@/lib/actions/staff"

interface StaffMember {
  id: string
  firstName: string
  lastName: string
  title: string | null
  color: string
  photoUrl: string | null
}

interface StaffAssignmentProps {
  appointmentId: string
  currentStaff: StaffMember | null
}

export function StaffAssignment({ appointmentId, currentStaff }: StaffAssignmentProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [staffList, setStaffList] = useState<StaffMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadStaff()
  }, [])

  const loadStaff = async () => {
    try {
      const staff = await getStaffMembers({ isActive: true })
      setStaffList(staff.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        title: s.title,
        color: s.color,
        photoUrl: s.photoUrl,
      })))
    } catch (error) {
      console.error("Failed to load staff:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleAssign = (staffId: string) => {
    startTransition(async () => {
      try {
        await assignStaffToAppointment(appointmentId, staffId || null)
        toast({ title: staffId ? "Staff assigned" : "Staff unassigned" })
        router.refresh()
      } catch (error) {
        toast({
          title: "Failed to assign staff",
          variant: "destructive",
        })
      }
    })
  }

  const handleUnassign = () => {
    startTransition(async () => {
      try {
        await assignStaffToAppointment(appointmentId, null)
        toast({ title: "Staff unassigned" })
        router.refresh()
      } catch (error) {
        toast({
          title: "Failed to unassign staff",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Assigned Staff
        </CardTitle>
      </CardHeader>
      <CardContent>
        {currentStaff ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={currentStaff.photoUrl || undefined} />
                <AvatarFallback
                  style={{ backgroundColor: currentStaff.color + "20", color: currentStaff.color }}
                >
                  {getInitials(currentStaff.firstName, currentStaff.lastName)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">
                  {currentStaff.firstName} {currentStaff.lastName}
                </p>
                {currentStaff.title && (
                  <p className="text-sm text-muted-foreground">{currentStaff.title}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleUnassign}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">No staff assigned</p>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm">Loading staff...</span>
              </div>
            ) : staffList.length > 0 ? (
              <Select onValueChange={handleAssign} disabled={isPending}>
                <SelectTrigger>
                  <SelectValue placeholder="Assign staff member" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((staff) => (
                    <SelectItem key={staff.id} value={staff.id}>
                      <div className="flex items-center gap-2">
                        <div
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: staff.color }}
                        />
                        {staff.firstName} {staff.lastName}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <p className="text-sm text-muted-foreground">
                No staff members available.{" "}
                <a href="/app/staff" className="text-primary hover:underline">
                  Add staff
                </a>
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
