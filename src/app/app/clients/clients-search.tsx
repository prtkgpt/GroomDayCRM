"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useTransition, useState, useEffect } from "react"
import { Search, X, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

export function ClientsSearch({ defaultValue }: { defaultValue?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [search, setSearch] = useState(defaultValue || "")

  useEffect(() => {
    const timer = setTimeout(() => {
      if (search !== defaultValue) {
        startTransition(() => {
          const params = new URLSearchParams()
          if (search) params.set("search", search)
          router.push(`/app/clients${params.toString() ? `?${params}` : ""}`)
        })
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [search, defaultValue, router])

  return (
    <div className="relative max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search clients, pets, or phone..."
        className="pl-9 pr-9"
      />
      {isPending && (
        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
      )}
      {search && !isPending && (
        <button
          onClick={() => setSearch("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
