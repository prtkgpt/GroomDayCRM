"use client"

import { formatCurrency } from "@/lib/utils"

interface ChartData {
  period: string
  revenue: number
  appointments: number
}

interface RevenueChartProps {
  data: ChartData[]
}

export function RevenueChart({ data }: RevenueChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[300px] text-muted-foreground">
        No data available
      </div>
    )
  }

  const maxRevenue = Math.max(...data.map((d) => d.revenue), 1)
  const maxAppointments = Math.max(...data.map((d) => d.appointments), 1)

  return (
    <div className="space-y-4">
      {/* Simple bar chart */}
      <div className="h-[250px] flex items-end gap-1">
        {data.map((item, index) => {
          const revenueHeight = (item.revenue / maxRevenue) * 100
          const appointmentHeight = (item.appointments / maxAppointments) * 100

          return (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-1 group relative"
            >
              {/* Tooltip */}
              <div className="absolute bottom-full mb-2 hidden group-hover:block z-10">
                <div className="bg-popover text-popover-foreground text-xs rounded-lg shadow-lg p-2 whitespace-nowrap">
                  <p className="font-medium">{item.period}</p>
                  <p>Revenue: {formatCurrency(item.revenue)}</p>
                  <p>Appointments: {item.appointments}</p>
                </div>
              </div>

              {/* Bars */}
              <div className="w-full flex gap-0.5 items-end h-full">
                <div
                  className="flex-1 bg-primary rounded-t transition-all duration-300 hover:bg-primary/80"
                  style={{ height: `${Math.max(revenueHeight, 2)}%` }}
                />
                <div
                  className="flex-1 bg-primary/30 rounded-t transition-all duration-300 hover:bg-primary/50"
                  style={{ height: `${Math.max(appointmentHeight, 2)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* X-axis labels */}
      <div className="flex gap-1 text-xs text-muted-foreground">
        {data.map((item, index) => (
          <div key={index} className="flex-1 text-center truncate">
            {/* Only show every nth label for readability */}
            {data.length <= 7 || index % Math.ceil(data.length / 7) === 0
              ? item.period
              : ""}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center justify-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-primary" />
          <span className="text-muted-foreground">Revenue</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded bg-primary/30" />
          <span className="text-muted-foreground">Appointments</span>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-2xl font-bold">
            {formatCurrency(data.reduce((sum, d) => sum + d.revenue, 0))}
          </p>
          <p className="text-sm text-muted-foreground">Total Revenue</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">
            {data.reduce((sum, d) => sum + d.appointments, 0)}
          </p>
          <p className="text-sm text-muted-foreground">Total Appointments</p>
        </div>
      </div>
    </div>
  )
}
