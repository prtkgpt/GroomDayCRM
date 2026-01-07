"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import {
  format,
  startOfWeek,
  endOfWeek,
  addDays,
  addWeeks,
  subWeeks,
  isSameDay,
  isToday,
  setHours,
  setMinutes,
} from "date-fns"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  PawPrint,
  MapPin,
  Clock,
  User,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn, formatTime, formatCurrency, getStatusColor, getStatusLabel } from "@/lib/utils"
import { getAppointments } from "@/lib/actions/appointments"
import { NewBookingModal } from "@/components/booking/new-booking-modal"

type ViewMode = "day" | "week"

interface Appointment {
  id: string
  dateTime: Date
  duration: number
  status: string
  totalAmount: number
  locationAddress: string | null
  client: { firstName: string; lastName: string }
  appointmentPets: { pet: { name: string } }[]
  appointmentServices: { service: { name: string } }[]
}

export default function CalendarPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [view, setView] = useState<ViewMode>("week")
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [bookingModalOpen, setBookingModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<Date | undefined>()

  const weekStart = startOfWeek(currentDate)
  const weekEnd = endOfWeek(currentDate)
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  useEffect(() => {
    const fetchAppointments = async () => {
      setIsLoading(true)
      try {
        let start: Date, end: Date
        if (view === "day") {
          start = new Date(currentDate)
          start.setHours(0, 0, 0, 0)
          end = new Date(currentDate)
          end.setHours(23, 59, 59, 999)
        } else {
          start = weekStart
          end = weekEnd
        }

        const data = await getAppointments({ startDate: start, endDate: end })
        setAppointments(data as Appointment[])
      } catch (error) {
        console.error("Failed to fetch appointments:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchAppointments()
  }, [currentDate, view])

  const goToToday = () => setCurrentDate(new Date())
  const goPrev = () =>
    setCurrentDate(view === "day" ? addDays(currentDate, -1) : subWeeks(currentDate, 1))
  const goNext = () =>
    setCurrentDate(view === "day" ? addDays(currentDate, 1) : addWeeks(currentDate, 1))

  const getAppointmentsForDay = (date: Date) =>
    appointments.filter((a) => isSameDay(new Date(a.dateTime), date))

  const hours = Array.from({ length: 12 }, (_, i) => i + 7) // 7 AM to 6 PM

  const openBookingForDate = (date: Date) => {
    setSelectedDate(date)
    setBookingModalOpen(true)
  }

  return (
    <div className="h-[calc(100vh-4rem)] lg:h-screen flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold hidden sm:block">Calendar</h1>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={goPrev}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={goNext}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <span className="font-medium">
            {view === "day"
              ? format(currentDate, "EEEE, MMMM d, yyyy")
              : `${format(weekStart, "MMM d")} - ${format(weekEnd, "MMM d, yyyy")}`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Tabs value={view} onValueChange={(v) => setView(v as ViewMode)}>
            <TabsList>
              <TabsTrigger value="day">Day</TabsTrigger>
              <TabsTrigger value="week">Week</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={() => openBookingForDate(new Date())}>
            <Plus className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Book</span>
          </Button>
        </div>
      </div>

      {/* Calendar View */}
      <div className="flex-1 overflow-auto">
        {view === "week" ? (
          // Week View
          <div className="min-h-full">
            {/* Week header */}
            <div className="grid grid-cols-7 border-b sticky top-0 bg-background z-10">
              {weekDays.map((day) => (
                <button
                  key={day.toISOString()}
                  onClick={() => {
                    setCurrentDate(day)
                    setView("day")
                  }}
                  className={cn(
                    "p-2 text-center border-r last:border-r-0 hover:bg-accent transition-colors",
                    isToday(day) && "bg-primary/5"
                  )}
                >
                  <div className="text-sm text-muted-foreground">
                    {format(day, "EEE")}
                  </div>
                  <div
                    className={cn(
                      "text-lg font-medium w-8 h-8 mx-auto flex items-center justify-center rounded-full",
                      isToday(day) && "bg-primary text-primary-foreground"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                </button>
              ))}
            </div>

            {/* Week body */}
            <div className="grid grid-cols-7 divide-x min-h-[500px]">
              {weekDays.map((day) => {
                const dayAppointments = getAppointmentsForDay(day)
                return (
                  <div
                    key={day.toISOString()}
                    className={cn(
                      "min-h-full p-1",
                      isToday(day) && "bg-primary/5"
                    )}
                  >
                    {dayAppointments.length === 0 ? (
                      <button
                        onClick={() => openBookingForDate(day)}
                        className="w-full h-16 flex items-center justify-center text-muted-foreground hover:bg-accent rounded transition-colors text-sm"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    ) : (
                      <div className="space-y-1">
                        {dayAppointments.map((appt) => (
                          <Link
                            key={appt.id}
                            href={`/app/appointments/${appt.id}`}
                            className={cn(
                              "block p-2 rounded text-xs hover:opacity-80 transition-opacity",
                              appt.status === "COMPLETED"
                                ? "bg-gray-100 text-gray-700"
                                : appt.status === "CANCELED"
                                ? "bg-gray-50 text-gray-400 line-through"
                                : appt.status === "NO_SHOW"
                                ? "bg-red-50 text-red-700"
                                : "bg-primary/10 text-primary"
                            )}
                          >
                            <div className="font-medium">
                              {formatTime(appt.dateTime)}
                            </div>
                            <div className="truncate">
                              {appt.client.firstName} {appt.client.lastName[0]}.
                            </div>
                            <div className="truncate text-muted-foreground">
                              {appt.appointmentPets.map((ap) => ap.pet.name).join(", ")}
                            </div>
                          </Link>
                        ))}
                        <button
                          onClick={() => openBookingForDate(day)}
                          className="w-full p-1 flex items-center justify-center text-muted-foreground hover:bg-accent rounded transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          // Day View
          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading...
              </div>
            ) : getAppointmentsForDay(currentDate).length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <h3 className="text-lg font-medium">No appointments</h3>
                <p className="text-muted-foreground mb-4">
                  {format(currentDate, "EEEE, MMMM d")} is free
                </p>
                <Button onClick={() => openBookingForDate(currentDate)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Book Appointment
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {getAppointmentsForDay(currentDate)
                  .sort(
                    (a, b) =>
                      new Date(a.dateTime).getTime() -
                      new Date(b.dateTime).getTime()
                  )
                  .map((appt) => (
                    <Link
                      key={appt.id}
                      href={`/app/appointments/${appt.id}`}
                      className="block p-4 rounded-lg border hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-medium">
                              {formatTime(appt.dateTime)}
                            </span>
                            <Badge className={getStatusColor(appt.status)}>
                              {getStatusLabel(appt.status)}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">
                              {appt.client.firstName} {appt.client.lastName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <PawPrint className="h-4 w-4" />
                            {appt.appointmentPets.map((ap) => ap.pet.name).join(", ")}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {appt.appointmentServices
                              .map((as) => as.service.name)
                              .join(", ")}
                          </div>
                          {appt.locationAddress && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              {appt.locationAddress}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <span className="text-lg font-bold">
                            {formatCurrency(appt.totalAmount)}
                          </span>
                          <div className="text-sm text-muted-foreground">
                            {appt.duration} min
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      <NewBookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
        initialDate={selectedDate}
      />
    </div>
  )
}
