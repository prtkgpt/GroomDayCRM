"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  MoreVertical,
  Send,
  Eye,
  Trash2,
  DollarSign,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "@/components/ui/use-toast"
import { updateInvoiceStatus, deleteInvoice } from "@/lib/actions/invoices"
import { sendInvoiceEmail } from "@/lib/actions/emails"

interface Invoice {
  id: string
  invoiceNumber: string
  status: string
  client: {
    email: string | null
  }
}

interface InvoiceActionsProps {
  invoice: Invoice
}

export function InvoiceActions({ invoice }: InvoiceActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleSendEmail = () => {
    if (!invoice.client.email) {
      toast({
        title: "No email address",
        description: "This client doesn't have an email address.",
        variant: "destructive",
      })
      return
    }

    startTransition(async () => {
      try {
        const result = await sendInvoiceEmail(invoice.id)
        if (result.success) {
          toast({ title: "Invoice sent successfully" })
          router.refresh()
        } else {
          toast({
            title: result.error || "Failed to send invoice",
            variant: "destructive",
          })
        }
      } catch (error) {
        toast({ title: "Error sending invoice", variant: "destructive" })
      }
    })
  }

  const handleMarkPaid = () => {
    startTransition(async () => {
      try {
        await updateInvoiceStatus(invoice.id, "PAID")
        toast({ title: "Invoice marked as paid" })
        router.refresh()
      } catch (error) {
        toast({ title: "Error updating invoice", variant: "destructive" })
      }
    })
  }

  const handleCancel = () => {
    startTransition(async () => {
      try {
        await updateInvoiceStatus(invoice.id, "CANCELLED")
        toast({ title: "Invoice cancelled" })
        router.refresh()
      } catch (error) {
        toast({ title: "Error cancelling invoice", variant: "destructive" })
      }
    })
  }

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteInvoice(invoice.id)
        toast({ title: "Invoice deleted" })
        router.refresh()
      } catch (error) {
        toast({
          title: "Cannot delete invoice",
          description: "Only draft invoices can be deleted.",
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
            <MoreVertical className="h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/app/invoices/${invoice.id}`}>
            <Eye className="h-4 w-4 mr-2" />
            View Invoice
          </Link>
        </DropdownMenuItem>

        {invoice.status !== "PAID" && invoice.status !== "CANCELLED" && (
          <>
            <DropdownMenuItem onClick={handleSendEmail}>
              <Send className="h-4 w-4 mr-2" />
              Send to Client
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleMarkPaid}>
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Paid
            </DropdownMenuItem>
          </>
        )}

        <DropdownMenuSeparator />

        {invoice.status !== "CANCELLED" && invoice.status !== "PAID" && (
          <DropdownMenuItem onClick={handleCancel} className="text-amber-600">
            <XCircle className="h-4 w-4 mr-2" />
            Cancel Invoice
          </DropdownMenuItem>
        )}

        {invoice.status === "DRAFT" && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="text-destructive"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete Invoice
              </DropdownMenuItem>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete invoice?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently delete invoice {invoice.invoiceNumber}. This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Delete
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
