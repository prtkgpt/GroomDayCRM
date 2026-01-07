import { Suspense } from "react"
import Link from "next/link"
import { Users, Plus, Search, PawPrint, Phone, Mail } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getClients } from "@/lib/actions/clients"
import { getInitials } from "@/lib/utils"
import { ClientsSearch } from "./clients-search"
import { NewClientModal } from "./new-client-modal"

async function ClientsList({ search }: { search?: string }) {
  const clients = await getClients(search)

  if (clients.length === 0) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
        {search ? (
          <>
            <h3 className="text-lg font-medium">No clients found</h3>
            <p className="text-muted-foreground">
              Try adjusting your search terms
            </p>
          </>
        ) : (
          <>
            <h3 className="text-lg font-medium">No clients yet</h3>
            <p className="text-muted-foreground mb-4">
              Add your first client to get started
            </p>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {clients.map((client) => (
        <Link key={client.id} href={`/app/clients/${client.id}`}>
          <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Avatar className="h-12 w-12">
                  <AvatarFallback className="bg-primary/10 text-primary font-medium">
                    {getInitials(client.firstName, client.lastName)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium truncate">
                    {client.firstName} {client.lastName}
                  </h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                    <PawPrint className="h-3 w-3" />
                    <span>
                      {client.pets.length} pet{client.pets.length !== 1 && "s"}
                    </span>
                    <span className="text-muted-foreground/50">|</span>
                    <span>
                      {client._count.appointments} appt{client._count.appointments !== 1 && "s"}
                    </span>
                  </div>
                  {client.pets.length > 0 && (
                    <p className="text-sm text-muted-foreground mt-1 truncate">
                      {client.pets.map((p) => p.name).join(", ")}
                    </p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                    {client.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {client.phone}
                      </span>
                    )}
                    {client.email && (
                      <span className="flex items-center gap-1 truncate">
                        <Mail className="h-3 w-3" />
                        {client.email}
                      </span>
                    )}
                  </div>
                  {client.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {client.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}

function ClientsListSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-24 mb-1" />
                <Skeleton className="h-4 w-40" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string }>
}) {
  const params = await searchParams
  const search = params.search

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground">Manage your clients and their pets</p>
        </div>
        <NewClientModal />
      </div>

      {/* Search */}
      <ClientsSearch defaultValue={search} />

      {/* Clients List */}
      <Suspense key={search} fallback={<ClientsListSkeleton />}>
        <ClientsList search={search} />
      </Suspense>
    </div>
  )
}
