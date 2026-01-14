import { Suspense } from "react"
import Link from "next/link"
import {
  Package,
  Plus,
  AlertTriangle,
  DollarSign,
  Search,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getInventoryItems,
  getInventoryStats,
  getLowStockItems,
} from "@/lib/actions/inventory"
import { formatCurrency } from "@/lib/utils"
import { NewItemModal } from "./new-item-modal"
import { InventorySearch } from "./inventory-search"

async function StatsCards() {
  const stats = await getInventoryStats()

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalItems}</div>
        </CardContent>
      </Card>

      <Card className={stats.lowStockItems > 0 ? "border-yellow-200 bg-yellow-50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${stats.lowStockItems > 0 ? "text-yellow-600" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.lowStockItems > 0 ? "text-yellow-600" : ""}`}>
            {stats.lowStockItems}
          </div>
        </CardContent>
      </Card>

      <Card className={stats.outOfStockItems > 0 ? "border-red-200 bg-red-50" : ""}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
          <AlertTriangle className={`h-4 w-4 ${stats.outOfStockItems > 0 ? "text-red-600" : "text-muted-foreground"}`} />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.outOfStockItems > 0 ? "text-red-600" : ""}`}>
            {stats.outOfStockItems}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Inventory Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
        </CardContent>
      </Card>
    </div>
  )
}

async function LowStockAlerts() {
  const lowStockItems = await getLowStockItems()

  if (lowStockItems.length === 0) {
    return null
  }

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-yellow-800">
          <AlertTriangle className="h-5 w-5" />
          Low Stock Alerts
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {lowStockItems.slice(0, 5).map((item) => (
            <Link
              key={item.id}
              href={`/app/inventory/${item.id}`}
              className="flex items-center justify-between p-2 rounded-lg hover:bg-yellow-100 transition-colors"
            >
              <div>
                <p className="font-medium text-yellow-800">{item.name}</p>
                <p className="text-sm text-yellow-700">
                  {item.quantity} {item.unit} remaining
                </p>
              </div>
              <Badge variant="outline" className="border-yellow-600 text-yellow-700">
                {item.quantity === 0 ? "Out of Stock" : "Low Stock"}
              </Badge>
            </Link>
          ))}
          {lowStockItems.length > 5 && (
            <p className="text-sm text-yellow-700 text-center pt-2">
              +{lowStockItems.length - 5} more items
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

async function InventoryList({ search, category }: { search?: string; category?: string }) {
  const items = await getInventoryItems({ search, category })

  if (items.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        {search ? (
          <>
            <h3 className="text-lg font-medium">No items found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms
            </p>
          </>
        ) : (
          <>
            <h3 className="text-lg font-medium">No inventory items yet</h3>
            <p className="text-muted-foreground mb-4">
              Add supplies and products to track your inventory
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((item) => {
        const isLowStock = item.quantity <= item.lowStockThreshold
        const isOutOfStock = item.quantity === 0

        return (
          <Link key={item.id} href={`/app/inventory/${item.id}`}>
            <Card className={`hover:shadow-md transition-shadow cursor-pointer h-full ${
              isOutOfStock
                ? "border-red-200"
                : isLowStock
                  ? "border-yellow-200"
                  : ""
            }`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-muted-foreground" />
                    {item.category && (
                      <Badge variant="outline" className="text-xs">
                        {item.category}
                      </Badge>
                    )}
                  </div>
                  {isOutOfStock ? (
                    <Badge variant="destructive">Out of Stock</Badge>
                  ) : isLowStock ? (
                    <Badge className="bg-yellow-500">Low Stock</Badge>
                  ) : null}
                </div>

                <h3 className="font-medium mb-1">{item.name}</h3>
                {item.sku && (
                  <p className="text-xs text-muted-foreground mb-2">
                    SKU: {item.sku}
                  </p>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div>
                    <p className="text-2xl font-bold">{item.quantity}</p>
                    <p className="text-sm text-muted-foreground">{item.unit}</p>
                  </div>
                  {item.costPrice && (
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Unit cost</p>
                      <p className="font-medium">{formatCurrency(item.costPrice)}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        )
      })}
    </div>
  )
}

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-2">
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function ListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <Skeleton className="h-5 w-24 mb-2" />
            <Skeleton className="h-4 w-32 mb-3" />
            <Skeleton className="h-8 w-16" />
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; category?: string }>
}) {
  const { search, category } = await searchParams

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-muted-foreground">
            Manage your grooming supplies and products
          </p>
        </div>
        <NewItemModal />
      </div>

      <Suspense fallback={<StatsSkeleton />}>
        <StatsCards />
      </Suspense>

      <Suspense fallback={null}>
        <LowStockAlerts />
      </Suspense>

      <div className="flex items-center gap-4">
        <InventorySearch />
      </div>

      <Suspense fallback={<ListSkeleton />}>
        <InventoryList search={search} category={category} />
      </Suspense>
    </div>
  )
}
