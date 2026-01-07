"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Mail, MessageSquare, Send, Copy, Check, Loader2, Navigation } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/components/ui/use-toast"
import { sendAppointmentEmail, getOnMyWayText } from "@/lib/actions/messaging"

interface MessageSectionProps {
  appointment: {
    id: string
    status: string
    client: {
      email: string | null
      phone: string | null
    }
    messageLogs: {
      id: string
      type: string
      subject: string | null
      status: string
      sentAt: Date
    }[]
  }
}

export function MessageSection({ appointment }: MessageSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [sendingType, setSendingType] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSendEmail = (
    type: "BOOKING_CONFIRMATION" | "REMINDER_24H" | "ON_MY_WAY" | "THANK_YOU"
  ) => {
    if (!appointment.client.email) {
      toast({ title: "Client has no email address", variant: "destructive" })
      return
    }

    setSendingType(type)
    startTransition(async () => {
      try {
        await sendAppointmentEmail(appointment.id, type)
        toast({ title: "Email sent!" })
        router.refresh()
      } catch (error: any) {
        toast({ title: error.message || "Failed to send email", variant: "destructive" })
      } finally {
        setSendingType(null)
      }
    })
  }

  const handleCopyOnMyWay = async () => {
    try {
      const text = await getOnMyWayText(appointment.id)
      await navigator.clipboard.writeText(text)
      setCopied(true)
      toast({ title: "Message copied to clipboard!" })
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({ title: "Failed to copy message", variant: "destructive" })
    }
  }

  const messageTypes = [
    {
      type: "BOOKING_CONFIRMATION" as const,
      label: "Confirmation",
      icon: Mail,
      show: appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED",
    },
    {
      type: "REMINDER_24H" as const,
      label: "24h Reminder",
      icon: Mail,
      show: appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED",
    },
    {
      type: "ON_MY_WAY" as const,
      label: "On My Way",
      icon: Navigation,
      show: appointment.status === "CONFIRMED" || appointment.status === "SCHEDULED",
    },
    {
      type: "THANK_YOU" as const,
      label: "Thank You",
      icon: Mail,
      show: appointment.status === "COMPLETED",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Messages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2">
          {messageTypes
            .filter((m) => m.show)
            .map((msg) => (
              <Button
                key={msg.type}
                variant="outline"
                size="sm"
                onClick={() =>
                  msg.type === "ON_MY_WAY"
                    ? handleCopyOnMyWay()
                    : handleSendEmail(msg.type)
                }
                disabled={isPending}
              >
                {sendingType === msg.type ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : msg.type === "ON_MY_WAY" ? (
                  copied ? (
                    <Check className="h-4 w-4 mr-2" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )
                ) : (
                  <msg.icon className="h-4 w-4 mr-2" />
                )}
                {msg.type === "ON_MY_WAY"
                  ? copied
                    ? "Copied!"
                    : "Copy 'On My Way'"
                  : `Send ${msg.label}`}
              </Button>
            ))}
        </div>

        {!appointment.client.email && !appointment.client.phone && (
          <p className="text-sm text-muted-foreground">
            Add an email or phone to this client to send messages.
          </p>
        )}

        {/* Message History */}
        {appointment.messageLogs.length > 0 && (
          <>
            <Separator />
            <div>
              <h4 className="text-sm font-medium mb-3">Message History</h4>
              <div className="space-y-2">
                {appointment.messageLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted text-sm"
                  >
                    <div className="flex items-center gap-2">
                      {log.type === "EMAIL" ? (
                        <Mail className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-muted-foreground" />
                      )}
                      <span>{log.subject || log.type}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={log.status === "SENT" ? "success" : "destructive"}
                        className="text-xs"
                      >
                        {log.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.sentAt), "MMM d, h:mm a")}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}
