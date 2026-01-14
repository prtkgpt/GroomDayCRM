"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Search,
  Calendar,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { toast } from "@/components/ui/use-toast"
import { createInvoice } from "@/lib/actions/invoices"
import { getClients } from "@/lib/actions/clients"
import { formatCurrency } from "@/lib/utils"

interface LineItem {
  description: string
  quantity: number
  unitPrice: number
}

export default function NewInvoicePage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [clientSearch, setClientSearch] = useState("")
  const [clientOpen, setClientOpen] = useState(false)
  const [clients, setClients] = useState<Array<{ id: string; firstName: string; lastName: string; email: string | null }>>([])
  const [selectedClient, setSelectedClient] = useState<{ id: string; name: string } | null>(null)
  const [lineItems, setLineItems] = useState<LineItem[]>([
    { description: "", quantity: 1, unitPrice: 0 },
  ])
  const [dueDate, setDueDate] = useState("")
  const [notes, setNotes] = useState("")
  const [taxRate, setTaxRate] = useState(0)
  const [discountAmount, setDiscountAmount] = useState(0)

  // Search clients
  const searchClients = async (query: string) => {
    try {
      const result = await getClients(query)
      setClients(result.slice(0, 10))
    } catch (error) {
      console.error("Error searching clients:", error)
    }
  }

  const addLineItem = () => {
    setLineItems([...lineItems, { description: "", quantity: 1, unitPrice: 0 }])
  }

  const updateLineItem = (index: number, updates: Partial<LineItem>) => {
    const newItems = [...lineItems]
    newItems[index] = { ...newItems[index], ...updates }
    setLineItems(newItems)
  }

  const removeLineItem = (index: number) => {
    if (lineItems.length > 1) {
      setLineItems(lineItems.filter((_, i) => i !== index))
    }
  }

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0)
  const taxAmount = subtotal * (taxRate / 100)
  const total = subtotal + taxAmount - discountAmount

  const handleSubmit = () => {
    if (!selectedClient) {
      toast({ title: "Please select a client", variant: "destructive" })
      return
    }

    const validLineItems = lineItems.filter((item) => item.description && item.unitPrice > 0)
    if (validLineItems.length === 0) {
      toast({ title: "Please add at least one line item", variant: "destructive" })
      return
    }

    startTransition(async () => {
      try {
        const invoice = await createInvoice({
          clientId: selectedClient.id,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          notes: notes || undefined,
          lineItems: validLineItems,
          taxRate,
          discountAmount,
        })
        toast({ title: "Invoice created" })
        router.push(`/app/invoices/${invoice.id}`)
      } catch (error) {
        toast({ title: "Error creating invoice", variant: "destructive" })
      }
    })
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/app/invoices">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">New Invoice</h1>
          <p className="text-muted-foreground">
            Create a new invoice for a client
          </p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Main Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Client Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Client</CardTitle>
            </CardHeader>
            <CardContent>
              <Popover open={clientOpen} onOpenChange={setClientOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <Search className="h-4 w-4 mr-2 text-muted-foreground" />
                    {selectedClient ? selectedClient.name : "Search for a client..."}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[400px] p-0" align="start">
                  <Command>
                    <CommandInput
                      placeholder="Search clients..."
                      value={clientSearch}
                      onValueChange={(value) => {
                        setClientSearch(value)
                        if (value.length > 1) {
                          searchClients(value)
                        }
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>No clients found.</CommandEmpty>
                      <CommandGroup>
                        {clients.map((client) => (
                          <CommandItem
                            key={client.id}
                            onSelect={() => {
                              setSelectedClient({
                                id: client.id,
                                name: `${client.firstName} ${client.lastName}`,
                              })
                              setClientOpen(false)
                            }}
                          >
                            <div>
                              <p className="font-medium">
                                {client.firstName} {client.lastName}
                              </p>
                              {client.email && (
                                <p className="text-sm text-muted-foreground">{client.email}</p>
                              )}
                            </div>
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </CardContent>
          </Card>

          {/* Line Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Line Items</CardTitle>
              <Button variant="outline" size="sm" onClick={addLineItem}>
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Header */}
                <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground">
                  <div className="col-span-6">Description</div>
                  <div className="col-span-2">Qty</div>
                  <div className="col-span-2">Price</div>
                  <div className="col-span-2 text-right">Amount</div>
                </div>

                {/* Items */}
                {lineItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2 items-center">
                    <div className="col-span-6">
                      <Input
                        placeholder="Service description"
                        value={item.description}
                        onChange={(e) => updateLineItem(index, { description: e.target.value })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => updateLineItem(index, { quantity: parseFloat(e.target.value) || 1 })}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={item.unitPrice}
                        onChange={(e) => updateLineItem(index, { unitPrice: parseFloat(e.target.value) || 0 })}
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-2">
                      <span className="text-sm font-medium">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </span>
                      {lineItems.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeLineItem(index)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Add any notes to display on the invoice..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Due Date */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Due Date</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="date"
                  className="pl-9"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Tax & Discount */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tax & Discount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Tax Rate (%)</Label>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={taxRate}
                  onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div className="space-y-2">
                <Label>Discount ($)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(parseFloat(e.target.value) || 0)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Totals */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {taxRate > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tax ({taxRate}%)</span>
                  <span>{formatCurrency(taxAmount)}</span>
                </div>
              )}
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-emerald-600">-{formatCurrency(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between pt-3 border-t font-semibold text-lg">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-2">
            <Button className="w-full" onClick={handleSubmit} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Create Invoice
            </Button>
            <Link href="/app/invoices" className="block">
              <Button variant="outline" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
