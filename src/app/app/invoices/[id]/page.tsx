import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  ArrowLeft,
  Send,
  Printer,
  Download,
  CheckCircle,
  Clock,
  Building,
  User,
  Calendar,
  FileText,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getInvoice } from "@/lib/actions/invoices"
import { formatCurrency } from "@/lib/utils"
import { InvoiceActions } from "../invoice-actions"

interface InvoiceDetailPageProps {
  params: Promise<{ id: string }>
}

function getStatusBadge(status: string) {
  switch (status) {
    case "DRAFT":
      return <Badge variant="outline" className="bg-gray-50 text-base px-3 py-1">Draft</Badge>
    case "SENT":
      return <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 text-base px-3 py-1">Sent</Badge>
    case "VIEWED":
      return <Badge className="bg-purple-100 text-purple-700 hover:bg-purple-100 text-base px-3 py-1">Viewed</Badge>
    case "PAID":
      return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 text-base px-3 py-1">Paid</Badge>
    case "PARTIALLY_PAID":
      return <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100 text-base px-3 py-1">Partial</Badge>
    case "OVERDUE":
      return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 text-base px-3 py-1">Overdue</Badge>
    case "CANCELLED":
      return <Badge variant="outline" className="text-muted-foreground text-base px-3 py-1">Cancelled</Badge>
    default:
      return <Badge variant="outline" className="text-base px-3 py-1">{status}</Badge>
  }
}

export default async function InvoiceDetailPage({ params }: InvoiceDetailPageProps) {
  const { id } = await params
  const invoice = await getInvoice(id)

  if (!invoice) {
    notFound()
  }

  const { client, organization, lineItems } = invoice

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/invoices">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-semibold tracking-tight">{invoice.invoiceNumber}</h1>
              {getStatusBadge(invoice.status)}
            </div>
            <p className="text-muted-foreground">
              Created {format(new Date(invoice.createdAt), "MMMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <Printer className="h-4 w-4" />
          </Button>
          <InvoiceActions
            invoice={{
              id: invoice.id,
              invoiceNumber: invoice.invoiceNumber,
              status: invoice.status,
              client: { email: invoice.client.email },
            }}
          />
        </div>
      </div>

      {/* Invoice Preview */}
      <Card className="overflow-hidden">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-primary mb-2">{organization.name}</h2>
              {organization.address && (
                <div className="text-sm text-muted-foreground">
                  <p>{organization.address}</p>
                  <p>{organization.city}, {organization.state} {organization.zipCode}</p>
                </div>
              )}
              {organization.email && <p className="text-sm text-muted-foreground mt-1">{organization.email}</p>}
              {organization.phone && <p className="text-sm text-muted-foreground">{organization.phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-muted-foreground/30 mb-2">INVOICE</p>
              <p className="font-medium">{invoice.invoiceNumber}</p>
              <p className="text-sm text-muted-foreground">
                Issued: {format(new Date(invoice.issueDate), "MMM d, yyyy")}
              </p>
              {invoice.dueDate && (
                <p className="text-sm text-muted-foreground">
                  Due: {format(new Date(invoice.dueDate), "MMM d, yyyy")}
                </p>
              )}
            </div>
          </div>

          {/* Bill To */}
          <div className="mb-8 p-4 bg-muted/30 rounded-xl">
            <p className="text-sm font-medium text-muted-foreground mb-2">Bill To:</p>
            <p className="font-semibold text-lg">{client.firstName} {client.lastName}</p>
            {client.email && <p className="text-muted-foreground">{client.email}</p>}
            {client.phone && <p className="text-muted-foreground">{client.phone}</p>}
            {client.address && (
              <p className="text-muted-foreground">
                {client.address}, {client.city}, {client.state} {client.zipCode}
              </p>
            )}
          </div>

          {/* Line Items */}
          <div className="mb-8">
            <table className="w-full">
              <thead>
                <tr className="border-b-2">
                  <th className="text-left py-3 font-medium text-muted-foreground">Description</th>
                  <th className="text-center py-3 font-medium text-muted-foreground w-20">Qty</th>
                  <th className="text-right py-3 font-medium text-muted-foreground w-28">Price</th>
                  <th className="text-right py-3 font-medium text-muted-foreground w-28">Amount</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-4">{item.description}</td>
                    <td className="py-4 text-center">{item.quantity}</td>
                    <td className="py-4 text-right">{formatCurrency(item.unitPrice)}</td>
                    <td className="py-4 text-right font-medium">{formatCurrency(item.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="flex justify-end">
            <div className="w-72 space-y-2">
              <div className="flex justify-between py-2">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.taxAmount > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span>
                  <span>{formatCurrency(invoice.taxAmount)}</span>
                </div>
              )}
              {invoice.discountAmount > 0 && (
                <div className="flex justify-between py-2">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-emerald-600">-{formatCurrency(invoice.discountAmount)}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between py-2 text-lg font-semibold">
                <span>Total</span>
                <span>{formatCurrency(invoice.totalAmount)}</span>
              </div>
              {invoice.amountPaid > 0 && (
                <>
                  <div className="flex justify-between py-2 text-emerald-600">
                    <span>Paid</span>
                    <span>-{formatCurrency(invoice.amountPaid)}</span>
                  </div>
                  <div className="flex justify-between py-2 text-lg font-bold border-t-2">
                    <span>Balance Due</span>
                    <span>{formatCurrency(invoice.balanceDue)}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="mt-8 p-4 bg-muted/30 rounded-xl">
              <p className="text-sm font-medium text-muted-foreground mb-2">Notes:</p>
              <p className="text-sm">{invoice.notes}</p>
            </div>
          )}

          {/* Payment Status */}
          {invoice.status === "PAID" && invoice.paidDate && (
            <div className="mt-8 p-4 bg-emerald-50 rounded-xl flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-medium text-emerald-800">Payment Received</p>
                <p className="text-sm text-emerald-600">
                  Paid on {format(new Date(invoice.paidDate), "MMMM d, yyyy")}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
