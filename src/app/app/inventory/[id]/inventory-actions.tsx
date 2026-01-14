"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { MoreHorizontal, Loader2, Edit, Trash2, MinusCircle } from "lucide-react"
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
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { deleteInventoryItem, addInventoryTransaction } from "@/lib/actions/inventory"

interface InventoryActionsProps {
  item: {
    id: string
    name: string
    quantity: number
  }
}

export function InventoryActions({ item }: InventoryActionsProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [showAdjustDialog, setShowAdjustDialog] = useState(false)
  const [adjustType, setAdjustType] = useState<"ADJUSTMENT" | "DAMAGED" | "RETURN">("ADJUSTMENT")
  const [adjustQuantity, setAdjustQuantity] = useState("")
  const [adjustNotes, setAdjustNotes] = useState("")

  const handleDelete = () => {
    startTransition(async () => {
      try {
        await deleteInventoryItem(item.id)
        toast({ title: "Item deleted" })
        router.push("/app/inventory")
      } catch (error) {
        toast({
          title: "Failed to delete item",
          variant: "destructive",
        })
      }
    })
  }

  const handleAdjust = () => {
    const quantity = parseInt(adjustQuantity)
    if (isNaN(quantity) || quantity === 0) {
      toast({ title: "Please enter a valid quantity", variant: "destructive" })
      return
    }

    startTransition(async () => {
      try {
        // For adjustments/damaged/return, use negative quantity to reduce stock
        const adjustedQuantity = adjustType === "ADJUSTMENT"
          ? quantity // Can be positive or negative
          : -Math.abs(quantity) // Always negative for damaged/return

        await addInventoryTransaction({
          itemId: item.id,
          type: adjustType,
          quantity: adjustedQuantity,
          notes: adjustNotes || undefined,
        })
        toast({ title: "Stock adjusted" })
        setShowAdjustDialog(false)
        setAdjustQuantity("")
        setAdjustNotes("")
        router.refresh()
      } catch (error) {
        toast({
          title: "Failed to adjust stock",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <MoreHorizontal className="h-4 w-4" />
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setShowAdjustDialog(true)}>
            <MinusCircle className="h-4 w-4 mr-2" />
            Adjust Stock
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => setShowDeleteDialog(true)}
            className="text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete Item
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Inventory Item?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove "{item.name}" from your inventory. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showAdjustDialog} onOpenChange={setShowAdjustDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Adjustment Type</Label>
              <Select value={adjustType} onValueChange={(v: any) => setAdjustType(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADJUSTMENT">Manual Adjustment</SelectItem>
                  <SelectItem value="DAMAGED">Mark as Damaged</SelectItem>
                  <SelectItem value="RETURN">Return to Supplier</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="adjustQuantity">
                {adjustType === "ADJUSTMENT"
                  ? "Quantity (use negative to reduce)"
                  : "Quantity to Remove"
                }
              </Label>
              <Input
                id="adjustQuantity"
                type="number"
                value={adjustQuantity}
                onChange={(e) => setAdjustQuantity(e.target.value)}
                placeholder={adjustType === "ADJUSTMENT" ? "-5 or +10" : "5"}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Current stock: {item.quantity}
              </p>
            </div>

            <div>
              <Label htmlFor="adjustNotes">Notes (optional)</Label>
              <Textarea
                id="adjustNotes"
                value={adjustNotes}
                onChange={(e) => setAdjustNotes(e.target.value)}
                placeholder="Reason for adjustment..."
                rows={2}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowAdjustDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleAdjust} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Adjust Stock
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
