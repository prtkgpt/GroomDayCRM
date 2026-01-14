"use client"

import { useRouter, useSearchParams } from "next/navigation"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface TimeframeSelectorProps {
  currentTimeframe: string
}

export function TimeframeSelector({ currentTimeframe }: TimeframeSelectorProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const handleChange = (value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set("timeframe", value)
    router.push(`/app/reports?${params.toString()}`)
  }

  return (
    <Select value={currentTimeframe} onValueChange={handleChange}>
      <SelectTrigger className="w-[140px]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="7days">Last 7 Days</SelectItem>
        <SelectItem value="30days">Last 30 Days</SelectItem>
        <SelectItem value="12months">Last 12 Months</SelectItem>
      </SelectContent>
    </Select>
  )
}
