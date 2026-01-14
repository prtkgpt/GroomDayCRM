import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  ArrowLeft,
  User,
  Mail,
  Phone,
  Calendar,
  Clock,
  DollarSign,
  Award,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { getStaffMember } from "@/lib/actions/staff"
import { getInitials, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils"
import { StaffActions } from "./staff-actions"
import { ScheduleEditor } from "./schedule-editor"
import { TimeOffSection } from "./time-off-section"

const dayLabels = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

export default async function StaffDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const staff = await getStaffMember(id)

  if (!staff) {
    notFound()
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/staff">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Avatar className="h-16 w-16">
            <AvatarImage src={staff.photoUrl || undefined} />
            <AvatarFallback
              style={{ backgroundColor: staff.color + "20", color: staff.color }}
              className="font-medium text-xl"
            >
              {getInitials(staff.firstName, staff.lastName)}
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">
                {staff.firstName} {staff.lastName}
              </h1>
              <div
                className="h-4 w-4 rounded-full"
                style={{ backgroundColor: staff.color }}
              />
              <Badge variant={staff.isActive ? "default" : "secondary"}>
                {staff.isActive ? "Active" : "Inactive"}
              </Badge>
            </div>
            {staff.title && (
              <p className="text-muted-foreground">{staff.title}</p>
            )}
          </div>
        </div>
        <StaffActions staff={staff} />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Schedule */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Weekly Schedule
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScheduleEditor staffId={staff.id} schedules={staff.schedules} />
            </CardContent>
          </Card>

          {/* Time Off */}
          <TimeOffSection staffId={staff.id} timeOff={staff.timeOff} />

          {/* Upcoming Appointments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Upcoming Appointments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {staff.appointments.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No upcoming appointments
                </p>
              ) : (
                <div className="space-y-3">
                  {staff.appointments.map((apt) => (
                    <Link
                      key={apt.id}
                      href={`/app/appointments/${apt.id}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="font-medium">
                          {apt.client.firstName} {apt.client.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {apt.appointmentPets.map((p) => p.pet.name).join(", ")}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(apt.dateTime), "EEEE, MMM d 'at' h:mm a")}
                        </p>
                      </div>
                      <Badge className={getStatusColor(apt.status)}>
                        {getStatusLabel(apt.status)}
                      </Badge>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {staff.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${staff.email}`} className="text-sm hover:underline">
                    {staff.email}
                  </a>
                </div>
              )}
              {staff.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${staff.phone}`} className="text-sm hover:underline">
                    {staff.phone}
                  </a>
                </div>
              )}
              {!staff.email && !staff.phone && (
                <p className="text-sm text-muted-foreground">No contact info</p>
              )}
            </CardContent>
          </Card>

          {/* Specialties */}
          {staff.specialties.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Specialties
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {staff.specialties.map((specialty) => (
                    <Badge key={specialty} variant="secondary">
                      {specialty}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bio */}
          {staff.bio && (
            <Card>
              <CardHeader>
                <CardTitle>About</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{staff.bio}</p>
              </CardContent>
            </Card>
          )}

          {/* Employment Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Employment
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {staff.hireDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hire Date</span>
                  <span>{format(new Date(staff.hireDate), "MMM d, yyyy")}</span>
                </div>
              )}
              {staff.hourlyRate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Hourly Rate</span>
                  <span>{formatCurrency(staff.hourlyRate)}/hr</span>
                </div>
              )}
              {staff.commissionRate && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Commission</span>
                  <span>{staff.commissionRate}%</span>
                </div>
              )}
              {!staff.hireDate && !staff.hourlyRate && !staff.commissionRate && (
                <p className="text-sm text-muted-foreground">No employment info</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
