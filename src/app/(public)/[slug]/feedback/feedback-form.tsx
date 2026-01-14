"use client"

import { useState, useTransition } from "react"
import { Star, CheckCircle, Loader2, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { submitFeedback } from "@/lib/actions/feedback"
import { getTheme } from "@/lib/themes"

interface FeedbackFormProps {
  token: string
  theme: ReturnType<typeof getTheme>
  organization: {
    name: string
    slug: string
    googleReviewUrl: string | null
    yelpUrl: string | null
  }
}

export function FeedbackForm({ token, theme, organization }: FeedbackFormProps) {
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState("")
  const [isPending, startTransition] = useTransition()
  const [submitted, setSubmitted] = useState(false)
  const [submittedRating, setSubmittedRating] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      setError("Please select a rating")
      return
    }

    startTransition(async () => {
      try {
        const result = await submitFeedback(token, { rating, comment })
        if (result.success) {
          setSubmitted(true)
          setSubmittedRating(rating)
        } else {
          setError(result.error || "Failed to submit feedback")
        }
      } catch (err) {
        setError("An error occurred. Please try again.")
      }
    })
  }

  if (submitted) {
    const isPositive = submittedRating >= 4
    const hasExternalReviews = organization.googleReviewUrl || organization.yelpUrl

    return (
      <div className="text-center space-y-6">
        <div className={cn(
          "w-16 h-16 rounded-full mx-auto flex items-center justify-center",
          theme.colors.accent
        )}>
          <CheckCircle className={cn("h-8 w-8", theme.colors.badgeText)} />
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-2">Thank you!</h2>
          <p className="text-muted-foreground">
            We appreciate you taking the time to share your feedback.
          </p>
        </div>

        {isPositive && hasExternalReviews && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <p className="text-sm font-medium">
              Would you mind leaving us a public review?
            </p>
            <p className="text-xs text-muted-foreground">
              It helps other pet owners find us!
            </p>
            <div className="flex flex-col gap-2">
              {organization.googleReviewUrl && (
                <a
                  href={organization.googleReviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-center gap-2"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Review on Google
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              )}
              {organization.yelpUrl && (
                <a
                  href={organization.yelpUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button
                    variant="outline"
                    className="w-full justify-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.16 12.594l-4.995 1.433c-.96.276-1.74-.8-1.176-1.63l2.905-4.308a1.072 1.072 0 0 1 1.596-.206 9.194 9.194 0 0 1 2.364 3.252 1.073 1.073 0 0 1-.694 1.459zm-3.22 5.106l-5.05-1.225c-.976-.237-1.143-1.597-.254-2.054l4.611-2.373a1.072 1.072 0 0 1 1.483.501 9.2 9.2 0 0 1 .472 3.947 1.073 1.073 0 0 1-1.262 1.204zm-5.55 1.172l-3.38-3.953c-.654-.764.122-1.85 1.173-1.638l5.428 1.09a1.072 1.072 0 0 1 .787 1.37 9.192 9.192 0 0 1-2.476 3.477 1.073 1.073 0 0 1-1.532-.346zm-4.95-14.89l1.772 5.125c.343.99-.693 1.9-1.566 1.373L2.173 7.64a1.072 1.072 0 0 1-.262-1.583 9.194 9.194 0 0 1 3.232-2.48 1.073 1.073 0 0 1 1.297.405zm3.472 6.16L6.18 5.024c-.587-.858.218-1.937 1.217-1.63l5.168 1.587c.8.246 1.008 1.263.382 1.868a9.194 9.194 0 0 1-3.512 2.244 1.073 1.073 0 0 1-1.353-.549z" />
                    </svg>
                    Review on Yelp
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Star Rating */}
      <div className="space-y-2">
        <Label className="text-center block">Tap to rate your experience</Label>
        <div className="flex justify-center gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="p-1 transition-transform hover:scale-110"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => {
                setRating(star)
                setError(null)
              }}
            >
              <Star
                className={cn(
                  "h-10 w-10 transition-colors",
                  (hoveredRating || rating) >= star
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                )}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="text-center text-sm text-muted-foreground">
            {rating === 1 && "Poor"}
            {rating === 2 && "Fair"}
            {rating === 3 && "Good"}
            {rating === 4 && "Very Good"}
            {rating === 5 && "Excellent!"}
          </p>
        )}
      </div>

      {/* Comment */}
      <div className="space-y-2">
        <Label htmlFor="comment">Tell us more (optional)</Label>
        <Textarea
          id="comment"
          placeholder="What did you like? What could we improve?"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
        />
      </div>

      {error && (
        <p className="text-sm text-destructive text-center">{error}</p>
      )}

      <Button
        type="submit"
        disabled={isPending || rating === 0}
        className={cn(
          "w-full",
          theme.colors.primary,
          theme.colors.primaryForeground,
          theme.colors.buttonHover
        )}
      >
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            Submitting...
          </>
        ) : (
          "Submit Feedback"
        )}
      </Button>
    </form>
  )
}
