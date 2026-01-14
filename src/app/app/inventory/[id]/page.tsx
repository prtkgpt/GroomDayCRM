import { notFound } from "next/navigation"
import Link from "next/link"
import { format } from "date-fns"
import {
  ArrowLeft,
  Package,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Clock,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { getInventoryItem } from "@/lib/actions/inventory"
import { formatCurrency } from "@/lib/utils"
import { InventoryActions } from "./inventory-actions"
import { AddStockModal } from "./add-stock-modal"

const transactionTypeLabels: Record<string, { label: string; color: string }> = {
  PURCHASE: { label: "Purchase", color: "bg-green-500" },
  ADJUSTMENT: { label: "Adjustment", color: "bg-blue-500" },
  RETURN: { label: "Return", color: "bg-yellow-500" },
  DAMAGED: { label: "Damaged", color: "bg-red-500" },
  USED: { label: "Used", color: "bg-purple-500" },
  SOLD: { label: "Sold", color: "bg-orange-500" },
}

export default async function InventoryItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const item = await getInventoryItem(id)

  if (!item) {
    notFound()
  }

  const isLowStock = item.quantity <= item.lowStockThreshold
  const isOutOfStock = item.quantity === 0
  const inventoryValue = (item.costPrice || 0) * item.quantity

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/app/inventory">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{item.name}</h1>
              {isOutOfStock ? (
                <Badge variant="destructive">Out of Stock</Badge>
              ) : isLowStock ? (
                <Badge className="bg-yellow-500">Low Stock</Badge>
              ) : (
                <Badge variant="secondary">In Stock</Badge>
              )}
            </div>
            {item.sku && (
              <p className="text-muted-foreground">SKU: {item.sku}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AddStockModal itemId={item.id} itemName={item.name} />
          <InventoryActions item={item} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stock Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Stock Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{item.quantity}</p>
                  <p className="text-sm text-muted-foreground">{item.unit}</p>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{item.lowStockThreshold}</p>
                  <p className="text-sm text-muted-foreground">Low Stock Alert</p>
                </div>
                {item.costPrice && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <p className="text-3xl font-bold">{formatCurrency(item.costPrice)}</p>
                    <p className="text-sm text-muted-foreground">Unit Cost</p>
                  </div>
                )}
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-3xl font-bold">{formatCurrency(inventoryValue)}</p>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {item.transactions.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  No transactions yet
                </p>
              ) : (
                <div className="space-y-3">
                  {item.transactions.map((tx) => {
                    const typeInfo = transactionTypeLabels[tx.type]
                    return (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-lg border"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`h-2 w-2 rounded-full ${typeInfo?.color || "bg-gray-500"}`} />
                          <div>
                            <p className="font-medium">{typeInfo?.label || tx.type}</p>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(tx.createdAt), "MMM d, yyyy h:mm a")}
                            </p>
                            {tx.notes && (
                              <p className="text-sm text-muted-foreground">{tx.notes}</p>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className={`font-bold ${tx.quantity > 0 ? "text-green-600" : "text-red-600"}`}>
                            {tx.quantity > 0 ? "+" : ""}{tx.quantity}
                          </p>
                          {tx.totalCost && (
                            <p className="text-sm text-muted-foreground">
                              {formatCurrency(tx.totalCost)}
                            </p>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Usage History */}
          {item.usageRecords.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Usage History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {item.usageRecords.map((usage) => (
                    <Link
                      key={usage.id}
                      href={`/app/appointments/${usage.appointmentId}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors"
                    >
                      <div>
                        <p className="font-medium">
                          {usage.appointment.client.firstName} {usage.appointment.client.lastName}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(usage.createdAt), "MMM d, yyyy")}
                        </p>
                      </div>
                      <Badge variant="outline">-{usage.quantity} {item.unit}</Badge>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Item Details */}
          <Card>
            <CardHeader>
              <CardTitle>Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {item.category && (
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">{item.category}</p>
                </div>
              )}
              {item.description && (
                <div>
                  <p className="text-sm text-muted-foreground">Description</p>
                  <p className="text-sm">{item.description}</p>
                </div>
              )}
              <Separator />
              {item.costPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost Price</span>
                  <span className="font-medium">{formatCurrency(item.costPrice)}</span>
                </div>
              )}
              {item.sellPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Sell Price</span>
                  <span className="font-medium">{formatCurrency(item.sellPrice)}</span>
                </div>
              )}
              {item.costPrice && item.sellPrice && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Margin</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(item.sellPrice - item.costPrice)} ({((item.sellPrice - item.costPrice) / item.costPrice * 100).toFixed(0)}%)
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Supplier Info */}
          {(item.supplier || item.reorderUrl) && (
            <Card>
              <CardHeader>
                <CardTitle>Supplier</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {item.supplier && (
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier Name</p>
                    <p className="font-medium">{item.supplier}</p>
                  </div>
                )}
                {item.supplierSku && (
                  <div>
                    <p className="text-sm text-muted-foreground">Supplier SKU</p>
                    <p className="font-medium">{item.supplierSku}</p>
                  </div>
                )}
                {item.reorderUrl && (
                  <a
                    href={item.reorderUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" className="w-full">
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Reorder
                    </Button>
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Low Stock Warning */}
          {isLowStock && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-yellow-800 mb-2">
                  <AlertTriangle className="h-5 w-5" />
                  <span className="font-medium">Low Stock Warning</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Current stock ({item.quantity} {item.unit}) is at or below your alert threshold ({item.lowStockThreshold}).
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
