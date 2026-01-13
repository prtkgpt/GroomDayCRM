"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import {
  addMonths,
  subMonths,
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface CalendarProps {
  selected?: Date
  onSelect?: (date: Date) => void
  disabled?: (date: Date) => boolean
  className?: string
}

function Calendar({ selected, onSelect, disabled, className }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(selected || new Date())

  const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1))
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1))

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(monthStart)
  const startDate = startOfWeek(monthStart)
  const endDate = endOfWeek(monthEnd)

  const days: Date[] = []
  let day = startDate
  while (day <= endDate) {
    days.push(day)
    day = addDays(day, 1)
  }

  const weeks: Date[][] = []
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7))
  }

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={prevMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-sm font-medium">
          {format(currentMonth, "MMMM yyyy")}
        </h2>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={nextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((dayName) => (
          <div
            key={dayName}
            className="text-center text-xs font-medium text-muted-foreground"
          >
            {dayName}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {weeks.map((week, weekIndex) => (
          <React.Fragment key={weekIndex}>
            {week.map((dayDate, dayIndex) => {
              const isCurrentMonth = isSameMonth(dayDate, currentMonth)
              const isSelected = selected && isSameDay(dayDate, selected)
              const isTodayDate = isToday(dayDate)
              const isDisabled = disabled?.(dayDate) ?? false

              return (
                <button
                  key={dayIndex}
                  onClick={() => !isDisabled && onSelect?.(dayDate)}
                  disabled={isDisabled}
                  className={cn(
                    "h-9 w-9 text-center text-sm p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground transition-colors",
                    !isCurrentMonth && "text-muted-foreground opacity-50",
                    isSelected &&
                      "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                    isTodayDate && !isSelected && "bg-accent text-accent-foreground",
                    isDisabled && "opacity-30 cursor-not-allowed hover:bg-transparent hover:text-inherit"
                  )}
                >
                  {format(dayDate, "d")}
                </button>
              )
            })}
          </React.Fragment>
        ))}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
