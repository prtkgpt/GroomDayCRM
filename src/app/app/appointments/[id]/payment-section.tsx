"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { DollarSign, Check, Loader2, CreditCard, Send, Copy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { formatCurrency } from "@/lib/utils"
import { recordPayment } from "@/lib/actions/payments"
import { createPaymentLink, createCheckoutSession } from "@/lib/actions/stripe"

interface PaymentSectionProps {
  appointment: {
    id: string
    status: string
    subtotal: number
    tipAmount: number
    totalAmount: number
    client: {
      email: string | null
    }
    payment: {
      id: string
      amount: number
      tipAmount: number
      totalAmount: number
      method: string
      status: string
      paidAt: Date | null
      stripePaymentId: string | null
    } | null
  }
  hasStripe?: boolean
}

export function PaymentSection({ appointment, hasStripe = false }: PaymentSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [isStripeLoading, setIsStripeLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const [paymentLinkUrl, setPaymentLinkUrl] = useState<string | null>(null)
  const [amount, setAmount] = useState(appointment.subtotal.toString())
  const [tipAmount, setTipAmount] = useState("0")
  const [method, setMethod] = useState<string>("CASH")

  const handleRecordPayment = () => {
    startTransition(async () => {
      try {
        await recordPayment({
          appointmentId: appointment.id,
          amount: parseFloat(amount),
          tipAmount: parseFloat(tipAmount || "0"),
          method: method as any,
        })
        toast({ title: "Payment recorded" })
        setOpen(false)
        router.refresh()
      } catch (error) {
        toast({ title: "Failed to record payment", variant: "destructive" })
      }
    })
  }

  const handleStripeCheckout = async () => {
    setIsStripeLoading(true)
    try {
      const result = await createCheckoutSession(appointment.id)
      if (result.url) {
        window.open(result.url, "_blank")
      }
    } catch (error) {
      toast({
        title: "Failed to create checkout",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsStripeLoading(false)
    }
  }

  const handleCreatePaymentLink = async () => {
    setIsStripeLoading(true)
    try {
      const result = await createPaymentLink(appointment.id)
      if (result.url) {
        setPaymentLinkUrl(result.url)
        toast({ title: "Payment link created" })
      }
    } catch (error) {
      toast({
        title: "Failed to create payment link",
        description: error instanceof Error ? error.message : "Please try again",
        variant: "destructive",
      })
    } finally {
      setIsStripeLoading(false)
    }
  }

  const copyPaymentLink = () => {
    if (paymentLinkUrl) {
      navigator.clipboard.writeText(paymentLinkUrl)
      toast({ title: "Link copied to clipboard" })
    }
  }

  if (appointment.payment) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-800">
            <Check className="h-5 w-5" />
            Payment Received
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 text-green-800">
            <div className="flex justify-between">
              <span>Amount</span>
              <span className="font-medium">
                {formatCurrency(appointment.payment.amount)}
              </span>
            </div>
            {appointment.payment.tipAmount > 0 && (
              <div className="flex justify-between">
                <span>Tip</span>
                <span className="font-medium">
                  {formatCurrency(appointment.payment.tipAmount)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold">
              <span>Total Paid</span>
              <span>{formatCurrency(appointment.payment.totalAmount)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Method</span>
              <Badge variant="outline">{appointment.payment.method}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (appointment.status !== "COMPLETED") {
    return null
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <DollarSign className="h-5 w-5" />
          Payment Pending
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between text-yellow-800">
            <span>Amount Due</span>
            <span className="font-bold text-lg">
              {formatCurrency(appointment.totalAmount)}
            </span>
          </div>

          {/* Stripe Payment Options */}
          {hasStripe && (
            <div className="space-y-2">
              <Button
                onClick={handleStripeCheckout}
                disabled={isStripeLoading}
                className="w-full bg-[#635bff] hover:bg-[#5851ea]"
              >
                {isStripeLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <CreditCard className="h-4 w-4 mr-2" />
                )}
                Pay with Stripe
              </Button>

              {!paymentLinkUrl ? (
                <Button
                  variant="outline"
                  onClick={handleCreatePaymentLink}
                  disabled={isStripeLoading}
                  className="w-full"
                >
                  {isStripeLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Create Payment Link
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Input value={paymentLinkUrl} readOnly className="text-xs" />
                  <Button variant="outline" size="icon" onClick={copyPaymentLink}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              )}

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-yellow-300" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-yellow-50 px-2 text-yellow-700">or record manually</span>
                </div>
              </div>
            </div>
          )}

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant={hasStripe ? "outline" : "default"} className="w-full">
                <DollarSign className="h-4 w-4 mr-2" />
                Record Payment
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Record Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="tip">Tip (optional)</Label>
                  <Input
                    id="tip"
                    type="number"
                    step="0.01"
                    value={tipAmount}
                    onChange={(e) => setTipAmount(e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="method">Payment Method</Label>
                  <Select value={method} onValueChange={setMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CASH">Cash</SelectItem>
                      <SelectItem value="CARD">Card</SelectItem>
                      <SelectItem value="CHECK">Check</SelectItem>
                      <SelectItem value="VENMO">Venmo</SelectItem>
                      <SelectItem value="ZELLE">Zelle</SelectItem>
                      <SelectItem value="OTHER">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-between p-3 bg-muted rounded-lg">
                  <span className="font-medium">Total</span>
                  <span className="font-bold">
                    {formatCurrency(
                      parseFloat(amount || "0") + parseFloat(tipAmount || "0")
                    )}
                  </span>
                </div>
                <Button
                  onClick={handleRecordPayment}
                  disabled={isPending}
                  className="w-full"
                >
                  {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                  Record Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  )
}
