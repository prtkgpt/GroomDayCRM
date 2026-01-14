"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { Star, Send, Loader2, CheckCircle, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { sendFeedbackRequest } from "@/lib/actions/feedback"

interface FeedbackSectionProps {
  appointment: {
    id: string
    status: string
    client: {
      email: string | null
    }
    feedbacks: {
      id: string
      rating: number
      comment: string | null
      createdAt: Date
    }[]
    feedbackRequests: {
      id: string
      usedAt: Date | null
      createdAt: Date
    }[]
  }
}

export function FeedbackSection({ appointment }: FeedbackSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const isCompleted = appointment.status === "COMPLETED"
  const hasFeedback = appointment.feedbacks.length > 0
  const latestFeedback = appointment.feedbacks[0]
  const hasPendingRequest = appointment.feedbackRequests.some(
    (req) => !req.usedAt
  )
  const latestRequest = appointment.feedbackRequests[0]

  const handleSendRequest = () => {
    startTransition(async () => {
      try {
        await sendFeedbackRequest(appointment.id)
        toast({
          title: "Feedback request sent",
          description: "The client will receive an email to leave feedback.",
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Failed to send request",
          description:
            error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        })
      }
    })
  }

  // Don't show for non-completed appointments
  if (!isCompleted) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Feedback
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasFeedback ? (
          // Show existing feedback
          <div className="p-4 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2 mb-2">
              <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-4 w-4 ${
                      star <= latestFeedback.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-muted-foreground">
                {format(latestFeedback.createdAt, "MMM d, yyyy")}
              </span>
            </div>
            {latestFeedback.comment && (
              <p className="text-sm text-muted-foreground italic">
                "{latestFeedback.comment}"
              </p>
            )}
          </div>
        ) : (
          // Show send request option
          <>
            {!appointment.client.email ? (
              <p className="text-sm text-muted-foreground text-center py-2">
                Client has no email address
              </p>
            ) : hasPendingRequest ? (
              <div className="text-center py-2">
                <div className="flex items-center justify-center gap-2 text-muted-foreground mb-2">
                  <CheckCircle className="h-4 w-4" />
                  <span className="text-sm">
                    Request sent {format(latestRequest.createdAt, "MMM d, yyyy")}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSendRequest}
                  disabled={isPending}
                >
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Resend Request
                </Button>
              </div>
            ) : (
              <div className="text-center py-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Request feedback from the client
                </p>
                <Button onClick={handleSendRequest} disabled={isPending}>
                  {isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Send Feedback Request
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
