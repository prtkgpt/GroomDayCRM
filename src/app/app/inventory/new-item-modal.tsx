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
import { createInventoryItem, type InventoryItemFormData } from "@/lib/actions/inventory"

export function NewItemModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)

    const data: InventoryItemFormData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string || undefined,
      sku: formData.get("sku") as string || undefined,
      category: formData.get("category") as string || undefined,
      quantity: parseInt(formData.get("quantity") as string) || 0,
      unit: formData.get("unit") as string || "units",
      lowStockThreshold: parseInt(formData.get("lowStockThreshold") as string) || 5,
      costPrice: parseFloat(formData.get("costPrice") as string) || undefined,
      sellPrice: parseFloat(formData.get("sellPrice") as string) || undefined,
      supplier: formData.get("supplier") as string || undefined,
      reorderUrl: formData.get("reorderUrl") as string || undefined,
    }

    startTransition(async () => {
      try {
        await createInventoryItem(data)
        toast({ title: "Item added to inventory" })
        setOpen(false)
        router.refresh()
      } catch (error) {
        toast({
          title: "Failed to add item",
          description: error instanceof Error ? error.message : "Please try again",
          variant: "destructive",
        })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Item
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Inventory Item</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Oatmeal Shampoo"
                required
              />
            </div>

            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input
                id="sku"
                name="sku"
                placeholder="e.g., SHAMP-001"
              />
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                name="category"
                placeholder="e.g., Shampoo"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Optional description..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="quantity">Initial Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="0"
                defaultValue="0"
              />
            </div>

            <div>
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                name="unit"
                placeholder="e.g., bottles"
                defaultValue="units"
              />
            </div>

            <div>
              <Label htmlFor="lowStockThreshold">Low Stock Alert</Label>
              <Input
                id="lowStockThreshold"
                name="lowStockThreshold"
                type="number"
                min="0"
                defaultValue="5"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="costPrice">Cost Price ($)</Label>
              <Input
                id="costPrice"
                name="costPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>

            <div>
              <Label htmlFor="sellPrice">Sell Price ($)</Label>
              <Input
                id="sellPrice"
                name="sellPrice"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-3">Supplier Info (optional)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <Label htmlFor="supplier">Supplier Name</Label>
                <Input
                  id="supplier"
                  name="supplier"
                  placeholder="e.g., Pet Supplies Co."
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="reorderUrl">Reorder URL</Label>
                <Input
                  id="reorderUrl"
                  name="reorderUrl"
                  type="url"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              Add Item
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
