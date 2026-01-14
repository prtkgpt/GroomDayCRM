"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Plus, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "@/components/ui/use-toast"
import { addInventoryTransaction } from "@/lib/actions/inventory"

interface AddStockModalProps {
  itemId: string
  itemName: string
}

export function AddStockModal({ itemId, itemName }: AddStockModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [quantity, setQuantity] = useState("")
  const [unitCost, setUnitCost] = useState("")
  const [invoiceNumber, setInvoiceNumber] = useState("")
  const [notes, setNotes] = useState("")

  const handleSubmit = () => {
    const qty = parseInt(quantity)
    if (isNaN(qty) || qty <= 0) {
      toast({ title: "Please enter a valid quantity", variant: "destructive" })
      return
    }

    const cost = parseFloat(unitCost) || undefined
    const totalCost = cost ? cost * qty : undefined

    startTransition(async () => {
      try {
        await addInventoryTransaction({
          itemId,
          type: "PURCHASE",
          quantity: qty,
          unitCost: cost,
          totalCost,
          invoiceNumber: invoiceNumber || undefined,
          notes: notes || undefined,
        })
        toast({ title: "Stock added successfully" })
        setOpen(false)
        resetForm()
        router.refresh()
      } catch (error) {
        toast({
          title: "Failed to add stock",
          variant: "destructive",
        })
      }
    })
  }

  const resetForm = () => {
    setQuantity("")
    setUnitCost("")
    setInvoiceNumber("")
    setNotes("")
  }

  const qty = parseInt(quantity) || 0
  const cost = parseFloat(unitCost) || 0
  const totalCost = qty * cost

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Stock
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Stock - {itemName}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="10"
              />
            </div>

            <div>
              <Label htmlFor="unitCost">Unit Cost ($)</Label>
              <Input
                id="unitCost"
                type="number"
                min="0"
                step="0.01"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="9.99"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="invoiceNumber">Invoice Number</Label>
            <Input
              id="invoiceNumber"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              placeholder="INV-12345"
            />
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes about this purchase..."
              rows={2}
            />
          </div>

          {totalCost > 0 && (
            <div className="flex justify-between p-3 bg-muted rounded-lg">
              <span className="font-medium">Total Cost</span>
              <span className="font-bold">
                ${totalCost.toFixed(2)}
              </span>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isPending || qty <= 0}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Stock
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
