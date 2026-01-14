import { Suspense } from "react"
import Link from "next/link"
import { Users, Plus, Phone, Mail, Calendar } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Skeleton } from "@/components/ui/skeleton"
import { getStaffMembers } from "@/lib/actions/staff"
import { getInitials } from "@/lib/utils"
import { NewStaffModal } from "./new-staff-modal"

const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

async function StaffList() {
  const staff = await getStaffMembers({ isActive: true })

  if (staff.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        <h3 className="text-lg font-medium">No staff members yet</h3>
        <p className="text-muted-foreground mb-4">
          Add your team members to manage schedules and assignments
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {staff.map((member) => {
        const workingDays = member.schedules
          .filter((s) => s.isWorking)
          .map((s) => dayLabels[s.dayOfWeek])
          .join(", ")

        return (
          <Link key={member.id} href={`/app/staff/${member.id}`}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
              <CardContent className="p-4">
                <div className="flex items-start gap-4">
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={member.photoUrl || undefined} />
                    <AvatarFallback
                      style={{ backgroundColor: member.color + "20", color: member.color }}
                      className="font-medium text-lg"
                    >
                      {getInitials(member.firstName, member.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium truncate">
                        {member.firstName} {member.lastName}
                      </h3>
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: member.color }}
                      />
                    </div>
                    {member.title && (
                      <p className="text-sm text-muted-foreground">{member.title}</p>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{member._count.appointments} upcoming</span>
                    </div>

                    {workingDays && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Works: {workingDays}
                      </p>
                    )}

                    {member.specialties.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {member.specialties.slice(0, 2).map((specialty) => (
                          <Badge key={specialty} variant="secondary" className="text-xs">
                            {specialty}
                          </Badge>
                        ))}
                        {member.specialties.length > 2 && (
                          <Badge variant="secondary" className="text-xs">
                            +{member.specialties.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

function StaffListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-14 w-14 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default function StaffPage() {
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Staff</h1>
          <p className="text-muted-foreground">
            Manage your team members and schedules
          </p>
        </div>
        <NewStaffModal />
      </div>

      <Suspense fallback={<StaffListSkeleton />}>
        <StaffList />
      </Suspense>
    </div>
  )
}
