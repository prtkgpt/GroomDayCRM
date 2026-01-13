"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Edit, Loader2, Trash2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/components/ui/use-toast"
import { serviceSchema, type ServiceFormData } from "@/lib/validations"
import { updateService, deleteService } from "@/lib/actions/services"

interface EditServiceModalProps {
  service: {
    id: string
    name: string
    description: string | null
    defaultPrice: number
    defaultDuration: number
    isAddOn: boolean
    isActive: boolean
  }
}

export function EditServiceModal({ service }: EditServiceModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      name: service.name,
      description: service.description || "",
      defaultPrice: service.defaultPrice,
      defaultDuration: service.defaultDuration,
      isAddOn: service.isAddOn,
      isActive: service.isActive,
    },
  })

  const onSubmit = (data: ServiceFormData) => {
    startTransition(async () => {
      try {
        await updateService(service.id, data)
        toast({ title: "Service updated" })
        setOpen(false)
        router.refresh()
      } catch (error) {
        toast({ title: "Failed to update service", variant: "destructive" })
      }
    })
  }

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        await deleteService(service.id)
        toast({ title: "Service deleted" })
        setOpen(false)
        router.refresh()
      } catch (error) {
        toast({ title: "Failed to delete service", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm">
          <Edit className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Service</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Service Name *</Label>
            <Input id="name" {...form.register("name")} />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" {...form.register("description")} rows={2} />
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
                Add-ons are extra services
              </p>
            </div>
            <Switch
              id="isAddOn"
              checked={form.watch("isAddOn")}
              onCheckedChange={(checked) => form.setValue("isAddOn", checked)}
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg border">
            <div>
              <Label htmlFor="isActive">Active</Label>
              <p className="text-sm text-muted-foreground">
                Inactive services won't appear in booking
              </p>
            </div>
            <Switch
              id="isActive"
              checked={form.watch("isActive")}
              onCheckedChange={(checked) => form.setValue("isActive", checked)}
            />
          </div>

          <div className="flex justify-between pt-4">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button type="button" variant="destructive" size="sm">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete service?</AlertDialogTitle>
                  <AlertDialogDescription>
                    {service.name} will be removed from your catalog. If it's been
                    used in appointments, it will be marked as inactive instead.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
