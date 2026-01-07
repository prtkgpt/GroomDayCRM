"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { DollarSign, Check, Loader2 } from "lucide-react"
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

interface PaymentSectionProps {
  appointment: {
    id: string
    status: string
    subtotal: number
    tipAmount: number
    totalAmount: number
    payment: {
      id: string
      amount: number
      tipAmount: number
      totalAmount: number
      method: string
      status: string
      paidAt: Date | null
    } | null
  }
}

export function PaymentSection({ appointment }: PaymentSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [open, setOpen] = useState(false)
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

          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="w-full">
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
