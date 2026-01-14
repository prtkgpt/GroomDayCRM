"use server"

import { db } from "@/lib/db"
import { requireOrganizationId } from "@/lib/auth"
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  subDays,
  subMonths,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
} from "date-fns"

export interface DashboardStats {
  revenue: {
    today: number
    thisWeek: number
    thisMonth: number
    lastMonth: number
  }
  appointments: {
    today: number
    thisWeek: number
    completed: number
    cancelled: number
    noShow: number
  }
  clients: {
    total: number
    newThisMonth: number
    active: number
  }
  unpaidAmount: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const organizationId = await requireOrganizationId()

  const now = new Date()
  const todayStart = startOfDay(now)
  const todayEnd = endOfDay(now)
  const weekStart = startOfWeek(now)
  const weekEnd = endOfWeek(now)
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)
  const lastMonthStart = startOfMonth(subMonths(now, 1))
  const lastMonthEnd = endOfMonth(subMonths(now, 1))

  // Revenue queries
  const [todayRevenue, weekRevenue, monthRevenue, lastMonthRevenue] = await Promise.all([
    db.payment.aggregate({
      where: {
        appointment: { organizationId },
        status: "PAID",
        paidAt: { gte: todayStart, lte: todayEnd },
      },
      _sum: { totalAmount: true },
    }),
    db.payment.aggregate({
      where: {
        appointment: { organizationId },
        status: "PAID",
        paidAt: { gte: weekStart, lte: weekEnd },
      },
      _sum: { totalAmount: true },
    }),
    db.payment.aggregate({
      where: {
        appointment: { organizationId },
        status: "PAID",
        paidAt: { gte: monthStart, lte: monthEnd },
      },
      _sum: { totalAmount: true },
    }),
    db.payment.aggregate({
      where: {
        appointment: { organizationId },
        status: "PAID",
        paidAt: { gte: lastMonthStart, lte: lastMonthEnd },
      },
      _sum: { totalAmount: true },
    }),
  ])

  // Appointment counts
  const [todayAppts, weekAppts, completedAppts, cancelledAppts, noShowAppts] = await Promise.all([
    db.appointment.count({
      where: {
        organizationId,
        dateTime: { gte: todayStart, lte: todayEnd },
      },
    }),
    db.appointment.count({
      where: {
        organizationId,
        dateTime: { gte: weekStart, lte: weekEnd },
      },
    }),
    db.appointment.count({
      where: {
        organizationId,
        status: "COMPLETED",
        dateTime: { gte: monthStart, lte: monthEnd },
      },
    }),
    db.appointment.count({
      where: {
        organizationId,
        status: "CANCELED",
        dateTime: { gte: monthStart, lte: monthEnd },
      },
    }),
    db.appointment.count({
      where: {
        organizationId,
        status: "NO_SHOW",
        dateTime: { gte: monthStart, lte: monthEnd },
      },
    }),
  ])

  // Client counts
  const [totalClients, newClients, activeClients] = await Promise.all([
    db.client.count({ where: { organizationId } }),
    db.client.count({
      where: {
        organizationId,
        createdAt: { gte: monthStart, lte: monthEnd },
      },
    }),
    db.client.count({
      where: {
        organizationId,
        appointments: {
          some: {
            dateTime: { gte: subMonths(now, 3) },
          },
        },
      },
    }),
  ])

  // Unpaid amount
  const unpaidAppts = await db.appointment.aggregate({
    where: {
      organizationId,
      status: "COMPLETED",
      payment: null,
    },
    _sum: { totalAmount: true },
  })

  return {
    revenue: {
      today: todayRevenue._sum.totalAmount || 0,
      thisWeek: weekRevenue._sum.totalAmount || 0,
      thisMonth: monthRevenue._sum.totalAmount || 0,
      lastMonth: lastMonthRevenue._sum.totalAmount || 0,
    },
    appointments: {
      today: todayAppts,
      thisWeek: weekAppts,
      completed: completedAppts,
      cancelled: cancelledAppts,
      noShow: noShowAppts,
    },
    clients: {
      total: totalClients,
      newThisMonth: newClients,
      active: activeClients,
    },
    unpaidAmount: unpaidAppts._sum.totalAmount || 0,
  }
}

export interface RevenueChartData {
  period: string
  revenue: number
  appointments: number
}

export async function getRevenueChart(
  timeframe: "7days" | "30days" | "12months"
): Promise<RevenueChartData[]> {
  const organizationId = await requireOrganizationId()

  const now = new Date()
  let startDate: Date
  let intervals: Date[]
  let dateFormat: string

  if (timeframe === "7days") {
    startDate = subDays(now, 6)
    intervals = eachDayOfInterval({ start: startDate, end: now })
    dateFormat = "EEE"
  } else if (timeframe === "30days") {
    startDate = subDays(now, 29)
    intervals = eachDayOfInterval({ start: startDate, end: now })
    dateFormat = "MMM d"
  } else {
    startDate = subMonths(now, 11)
    intervals = eachMonthOfInterval({ start: startOfMonth(startDate), end: startOfMonth(now) })
    dateFormat = "MMM yyyy"
  }

  const data: RevenueChartData[] = []

  for (const date of intervals) {
    const periodStart = timeframe === "12months" ? startOfMonth(date) : startOfDay(date)
    const periodEnd = timeframe === "12months" ? endOfMonth(date) : endOfDay(date)

    const [revenue, appointments] = await Promise.all([
      db.payment.aggregate({
        where: {
          appointment: { organizationId },
          status: "PAID",
          paidAt: { gte: periodStart, lte: periodEnd },
        },
        _sum: { totalAmount: true },
      }),
      db.appointment.count({
        where: {
          organizationId,
          dateTime: { gte: periodStart, lte: periodEnd },
          status: "COMPLETED",
        },
      }),
    ])

    data.push({
      period: format(date, dateFormat),
      revenue: revenue._sum.totalAmount || 0,
      appointments,
    })
  }

  return data
}

export interface ServiceStats {
  serviceId: string
  serviceName: string
  count: number
  revenue: number
}

export async function getServiceStats(): Promise<ServiceStats[]> {
  const organizationId = await requireOrganizationId()

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const serviceData = await db.appointmentService.groupBy({
    by: ["serviceId"],
    where: {
      appointment: {
        organizationId,
        status: "COMPLETED",
        dateTime: { gte: monthStart, lte: monthEnd },
      },
    },
    _count: { id: true },
    _sum: { price: true },
  })

  // Get service names
  const serviceIds = serviceData.map((s) => s.serviceId)
  const services = await db.service.findMany({
    where: { id: { in: serviceIds } },
    select: { id: true, name: true },
  })

  const serviceMap = new Map(services.map((s) => [s.id, s.name]))

  return serviceData
    .map((s) => ({
      serviceId: s.serviceId,
      serviceName: serviceMap.get(s.serviceId) || "Unknown",
      count: s._count.id,
      revenue: s._sum.price || 0,
    }))
    .sort((a, b) => b.count - a.count)
}

export interface PaymentMethodStats {
  method: string
  count: number
  amount: number
}

export async function getPaymentMethodStats(): Promise<PaymentMethodStats[]> {
  const organizationId = await requireOrganizationId()

  const now = new Date()
  const monthStart = startOfMonth(now)
  const monthEnd = endOfMonth(now)

  const methodData = await db.payment.groupBy({
    by: ["method"],
    where: {
      appointment: { organizationId },
      status: "PAID",
      paidAt: { gte: monthStart, lte: monthEnd },
    },
    _count: { id: true },
    _sum: { totalAmount: true },
  })

  return methodData.map((m) => ({
    method: m.method,
    count: m._count.id,
    amount: m._sum.totalAmount || 0,
  }))
}

export interface TopClient {
  clientId: string
  clientName: string
  totalSpent: number
  appointmentCount: number
}

export async function getTopClients(limit: number = 10): Promise<TopClient[]> {
  const organizationId = await requireOrganizationId()

  const now = new Date()
  const threeMonthsAgo = subMonths(now, 3)

  // Get clients with their appointment and payment data
  const clients = await db.client.findMany({
    where: {
      organizationId,
      appointments: {
        some: {
          status: "COMPLETED",
          dateTime: { gte: threeMonthsAgo },
        },
      },
    },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      appointments: {
        where: {
          status: "COMPLETED",
          dateTime: { gte: threeMonthsAgo },
        },
        select: {
          id: true,
          payment: {
            select: {
              totalAmount: true,
            },
          },
        },
      },
    },
  })

  const topClients = clients
    .map((client) => ({
      clientId: client.id,
      clientName: `${client.firstName} ${client.lastName}`,
      totalSpent: client.appointments.reduce(
        (sum, apt) => sum + (apt.payment?.totalAmount || 0),
        0
      ),
      appointmentCount: client.appointments.length,
    }))
    .sort((a, b) => b.totalSpent - a.totalSpent)
    .slice(0, limit)

  return topClients
}
