import { Suspense } from "react"
import {
  DollarSign,
  Calendar,
  Users,
  TrendingUp,
  CreditCard,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getDashboardStats,
  getRevenueChart,
  getServiceStats,
  getPaymentMethodStats,
  getTopClients,
} from "@/lib/actions/reports"
import { formatCurrency } from "@/lib/utils"
import { RevenueChart } from "./revenue-chart"
import { TimeframeSelector } from "./timeframe-selector"

async function StatsCards() {
  const stats = await getDashboardStats()

  const revenueChange = stats.revenue.lastMonth > 0
    ? ((stats.revenue.thisMonth - stats.revenue.lastMonth) / stats.revenue.lastMonth) * 100
    : 0

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Revenue (This Month)</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.revenue.thisMonth)}</div>
          <p className="text-xs text-muted-foreground">
            {revenueChange >= 0 ? "+" : ""}{revenueChange.toFixed(1)}% from last month
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Appointments</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.appointments.completed}</div>
          <p className="text-xs text-muted-foreground">
            {stats.appointments.cancelled} cancelled, {stats.appointments.noShow} no-shows
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Active Clients</CardTitle>
          <Users className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.clients.active}</div>
          <p className="text-xs text-muted-foreground">
            {stats.clients.newThisMonth} new this month ({stats.clients.total} total)
          </p>
        </CardContent>
      </Card>

      <Card className={stats.unpaidAmount > 0 ? "border-yellow-200 bg-yellow-50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Unpaid Balance</CardTitle>
          <AlertCircle className={`h-4 w-4 ${stats.unpaidAmount > 0 ? "text-yellow-600" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.unpaidAmount > 0 ? "text-yellow-600" : ""}`}>
            {formatCurrency(stats.unpaidAmount)}
          </div>
          <p className="text-xs text-muted-foreground">
            From completed appointments
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

async function ServiceStatsCard() {
  const services = await getServiceStats()

  if (services.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Popular Services</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No service data yet
          </p>
        </CardContent>
      </Card>
    )
  }

  const maxCount = Math.max(...services.map((s) => s.count))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Popular Services (This Month)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {services.slice(0, 5).map((service) => (
            <div key={service.serviceId} className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">{service.serviceName}</span>
                <span className="text-muted-foreground">
                  {service.count} ({formatCurrency(service.revenue)})
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full"
                  style={{ width: `${(service.count / maxCount) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

async function PaymentMethodsCard() {
  const methods = await getPaymentMethodStats()

  if (methods.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No payment data yet
          </p>
        </CardContent>
      </Card>
    )
  }

  const total = methods.reduce((sum, m) => sum + m.amount, 0)

  const methodColors: Record<string, string> = {
    CASH: "bg-green-500",
    CARD: "bg-blue-500",
    CHECK: "bg-yellow-500",
    VENMO: "bg-purple-500",
    ZELLE: "bg-indigo-500",
    OTHER: "bg-gray-500",
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Methods (This Month)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {methods.map((method) => (
            <div key={method.method} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`h-3 w-3 rounded-full ${methodColors[method.method] || "bg-gray-500"}`} />
                <span className="text-sm font-medium">{method.method}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{formatCurrency(method.amount)}</p>
                <p className="text-xs text-muted-foreground">
                  {((method.amount / total) * 100).toFixed(1)}%
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

async function TopClientsCard() {
  const clients = await getTopClients(5)

  if (clients.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Clients</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            No client data yet
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Top Clients (Last 3 Months)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {clients.map((client, index) => (
            <div key={client.clientId} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                  {index + 1}
                </div>
                <div>
                  <p className="text-sm font-medium">{client.clientName}</p>
                  <p className="text-xs text-muted-foreground">
                    {client.appointmentCount} appointments
                  </p>
                </div>
              </div>
              <span className="text-sm font-bold">{formatCurrency(client.totalSpent)}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function StatsCardsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-20 mb-1" />
            <Skeleton className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ChartSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-[300px] w-full" />
      </CardContent>
    </Card>
  )
}

function ListCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex items-center justify-between">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<{ timeframe?: string }>
}) {
  const { timeframe = "30days" } = await searchParams
  const validTimeframe = ["7days", "30days", "12months"].includes(timeframe)
    ? (timeframe as "7days" | "30days" | "12months")
    : "30days"

  const chartData = await getRevenueChart(validTimeframe)

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground">
            Track your business performance
          </p>
        </div>
      </div>

      <Suspense fallback={<StatsCardsSkeleton />}>
        <StatsCards />
      </Suspense>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Revenue Overview</CardTitle>
              <TimeframeSelector currentTimeframe={validTimeframe} />
            </CardHeader>
            <CardContent>
              <RevenueChart data={chartData} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Suspense fallback={<ListCardSkeleton />}>
            <PaymentMethodsCard />
          </Suspense>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Suspense fallback={<ListCardSkeleton />}>
          <ServiceStatsCard />
        </Suspense>
        <Suspense fallback={<ListCardSkeleton />}>
          <TopClientsCard />
        </Suspense>
      </div>
    </div>
  )
}
