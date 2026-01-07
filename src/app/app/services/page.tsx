import { Scissors, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getServices } from "@/lib/actions/services"
import { formatCurrency, formatDuration } from "@/lib/utils"
import { NewServiceModal } from "./new-service-modal"
import { EditServiceModal } from "./edit-service-modal"

export default async function ServicesPage() {
  const services = await getServices(true) // Include inactive

  const mainServices = services.filter((s) => !s.isAddOn && s.isActive)
  const addOns = services.filter((s) => s.isAddOn && s.isActive)
  const inactive = services.filter((s) => !s.isActive)

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Services</h1>
          <p className="text-muted-foreground">
            Manage your service catalog and pricing
          </p>
        </div>
        <NewServiceModal />
      </div>

      {/* Main Services */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scissors className="h-5 w-5" />
            Main Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          {mainServices.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              No services yet. Add your first service to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {mainServices.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <h4 className="font-medium">{service.name}</h4>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {service.description}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDuration(service.defaultDuration)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold">
                      {formatCurrency(service.defaultPrice)}
                    </span>
                    <EditServiceModal service={service} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add-ons */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Add-on Services
          </CardTitle>
        </CardHeader>
        <CardContent>
          {addOns.length === 0 ? (
            <p className="text-muted-foreground text-center py-6">
              No add-on services yet.
            </p>
          ) : (
            <div className="space-y-3">
              {addOns.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 rounded-lg border hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{service.name}</h4>
                      <Badge variant="secondary" className="text-xs">
                        Add-on
                      </Badge>
                    </div>
                    {service.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {service.description}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      +{formatDuration(service.defaultDuration)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-bold">
                      +{formatCurrency(service.defaultPrice)}
                    </span>
                    <EditServiceModal service={service} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Inactive Services */}
      {inactive.length > 0 && (
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle>Inactive Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {inactive.map((service) => (
                <div
                  key={service.id}
                  className="flex items-center justify-between p-4 rounded-lg border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium">{service.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        Inactive
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {formatDuration(service.defaultDuration)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-lg font-medium text-muted-foreground">
                      {formatCurrency(service.defaultPrice)}
                    </span>
                    <EditServiceModal service={service} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
