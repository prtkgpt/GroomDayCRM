"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Check, X, Eye, EyeOff, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { toast } from "@/components/ui/use-toast"
import { toggleFeedbackApproval, toggleFeedbackPublic } from "@/lib/actions/feedback"

interface ReviewActionsProps {
  feedback: {
    id: string
    isApproved: boolean
    isPublic: boolean
  }
}

export function ReviewActions({ feedback }: ReviewActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleToggleApproval = () => {
    startTransition(async () => {
      try {
        await toggleFeedbackApproval(feedback.id)
        toast({
          title: feedback.isApproved ? "Approval removed" : "Review approved",
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Failed to update review",
          variant: "destructive",
        })
      }
    })
  }

  const handleTogglePublic = () => {
    startTransition(async () => {
      try {
        await toggleFeedbackPublic(feedback.id)
        toast({
          title: feedback.isPublic ? "Review hidden" : "Review made public",
        })
        router.refresh()
      } catch (error) {
        toast({
          title: "Failed to update review",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <MoreHorizontal className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={handleToggleApproval}>
          {feedback.isApproved ? (
            <>
              <X className="h-4 w-4 mr-2" />
              Remove Approval
            </>
          ) : (
            <>
              <Check className="h-4 w-4 mr-2" />
              Approve Review
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleTogglePublic}>
          {feedback.isPublic ? (
            <>
              <EyeOff className="h-4 w-4 mr-2" />
              Make Private
            </>
          ) : (
            <>
              <Eye className="h-4 w-4 mr-2" />
              Make Public
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
