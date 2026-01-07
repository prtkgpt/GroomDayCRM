"use client"

import { useState } from "react"
import { Sidebar } from "./sidebar"
import { NewBookingModal } from "@/components/booking/new-booking-modal"

interface AppShellProps {
  children: React.ReactNode
  orgName: string
}

export function AppShell({ children, orgName }: AppShellProps) {
  const [bookingModalOpen, setBookingModalOpen] = useState(false)

  return (
    <>
      <Sidebar orgName={orgName} onNewBooking={() => setBookingModalOpen(true)} />
      <main className="lg:pl-64">
        <div className="pt-16 lg:pt-0">
          {children}
        </div>
      </main>
      <NewBookingModal
        open={bookingModalOpen}
        onOpenChange={setBookingModalOpen}
      />
    </>
  )
}
