"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
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
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { serviceSchema, type ServiceFormData } from "@/lib/validations"
import { createService } from "@/lib/actions/services"

export function NewServiceModal() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<ServiceFormData>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: "",
      description: "",
      defaultPrice: 0,
      defaultDuration: 60,
      isAddOn: false,
      isActive: true,
    },
  })

  const onSubmit = (data: ServiceFormData) => {
    startTransition(async () => {
      try {
        await createService(data)
        toast({ title: "Service created" })
        setOpen(false)
        form.reset()
        router.refresh()
      } catch (error) {
        toast({ title: "Failed to create service", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          New Service
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Service</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Service Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Full Groom"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...form.register("description")}
              placeholder="What's included in this service"
              rows={2}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="defaultPrice">Price ($)</Label>
              <Input
                id="defaultPrice"
                type="number"
                step="0.01"
                {...form.register("defaultPrice")}
              />
            </div>
            <div>
              <Label htmlFor="defaultDuration">Duration (minutes)</Label>
              <Input
                id="defaultDuration"
                type="number"
                {...form.register("defaultDuration")}
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label htmlFor="isAddOn">Add-on Service</Label>
              <p className="text-sm text-muted-foreground">
                Add-ons are extra services added to main services
              </p>
            </div>
            <Switch
              id="isAddOn"
              checked={form.watch("isAddOn")}
              onCheckedChange={(checked) => form.setValue("isAddOn", checked)}
            />
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
              Create Service
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
