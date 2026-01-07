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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { petSchema, type PetFormData } from "@/lib/validations"
import { createPet } from "@/lib/actions/pets"

interface AddPetModalProps {
  clientId: string
}

export function AddPetModal({ clientId }: AddPetModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  const form = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: "",
      species: "Dog",
      breed: "",
      weight: "",
      sex: "",
      coatType: "",
      coatNotes: "",
      behaviorNotes: "",
      groomingPrefs: "",
      clientId,
    },
  })

  const onSubmit = (data: PetFormData) => {
    startTransition(async () => {
      try {
        const pet = await createPet({ ...data, clientId })
        toast({ title: "Pet added successfully" })
        setOpen(false)
        form.reset({ ...form.formState.defaultValues, clientId })
        router.push(`/app/pets/${pet.id}`)
      } catch (error) {
        toast({ title: "Failed to add pet", variant: "destructive" })
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Add Pet
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Pet</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              {...form.register("name")}
              placeholder="Buddy"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-destructive mt-1">
                {form.formState.errors.name.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="breed">Breed</Label>
              <Input
                id="breed"
                {...form.register("breed")}
                placeholder="Golden Retriever"
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input
                id="weight"
                type="number"
                {...form.register("weight")}
                placeholder="50"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sex">Sex</Label>
              <Select
                value={form.watch("sex") || ""}
                onValueChange={(v) => form.setValue("sex", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Unknown">Unknown</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="coatType">Coat Type</Label>
              <Select
                value={form.watch("coatType") || ""}
                onValueChange={(v) => form.setValue("coatType", v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Short">Short</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Long">Long</SelectItem>
                  <SelectItem value="Double">Double</SelectItem>
                  <SelectItem value="Wire">Wire</SelectItem>
                  <SelectItem value="Curly">Curly</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="coatNotes">Coat Notes</Label>
            <Textarea
              id="coatNotes"
              {...form.register("coatNotes")}
              placeholder="Matting issues, preferred style, etc."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="behaviorNotes">Behavior Notes</Label>
            <Textarea
              id="behaviorNotes"
              {...form.register("behaviorNotes")}
              placeholder="Anxiety, biting, special handling, etc."
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="groomingPrefs">Grooming Preferences</Label>
            <Textarea
              id="groomingPrefs"
              {...form.register("groomingPrefs")}
              placeholder="Cut style, special requests, etc."
              rows={2}
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
              Add Pet
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
