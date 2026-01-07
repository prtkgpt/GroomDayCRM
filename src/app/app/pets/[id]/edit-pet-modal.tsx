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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import { petSchema, type PetFormData } from "@/lib/validations"
import { updatePet, deletePet } from "@/lib/actions/pets"

interface EditPetModalProps {
  pet: {
    id: string
    name: string
    species: string
    breed: string | null
    weight: number | null
    sex: string | null
    coatType: string | null
    coatNotes: string | null
    behaviorNotes: string | null
    groomingPrefs: string | null
    vaccineNotes: string | null
    medicalNotes: string | null
    clientId: string
  }
}

export function EditPetModal({ pet }: EditPetModalProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isDeleting, setIsDeleting] = useState(false)

  const form = useForm<PetFormData>({
    resolver: zodResolver(petSchema),
    defaultValues: {
      name: pet.name,
      species: pet.species,
      breed: pet.breed || "",
      weight: pet.weight?.toString() || "",
      sex: pet.sex || "",
      coatType: pet.coatType || "",
      coatNotes: pet.coatNotes || "",
      behaviorNotes: pet.behaviorNotes || "",
      groomingPrefs: pet.groomingPrefs || "",
      vaccineNotes: pet.vaccineNotes || "",
      medicalNotes: pet.medicalNotes || "",
      clientId: pet.clientId,
    },
  })

  const onSubmit = (data: PetFormData) => {
    startTransition(async () => {
      try {
        await updatePet(pet.id, data)
        toast({ title: "Pet updated" })
        setOpen(false)
        router.refresh()
      } catch (error) {
        toast({ title: "Failed to update pet", variant: "destructive" })
      }
    })
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deletePet(pet.id)
      toast({ title: "Pet deleted" })
      router.push(`/app/clients/${pet.clientId}`)
    } catch (error) {
      toast({ title: "Failed to delete pet", variant: "destructive" })
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Edit className="h-4 w-4 mr-2" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Pet</DialogTitle>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="name">Name *</Label>
            <Input id="name" {...form.register("name")} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="breed">Breed</Label>
              <Input id="breed" {...form.register("breed")} />
            </div>
            <div>
              <Label htmlFor="weight">Weight (lbs)</Label>
              <Input id="weight" type="number" {...form.register("weight")} />
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
            <Textarea id="coatNotes" {...form.register("coatNotes")} rows={2} />
          </div>

          <div>
            <Label htmlFor="behaviorNotes">Behavior Notes</Label>
            <Textarea
              id="behaviorNotes"
              {...form.register("behaviorNotes")}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="groomingPrefs">Grooming Preferences</Label>
            <Textarea
              id="groomingPrefs"
              {...form.register("groomingPrefs")}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="vaccineNotes">Vaccine Notes</Label>
            <Textarea
              id="vaccineNotes"
              {...form.register("vaccineNotes")}
              rows={2}
            />
          </div>

          <div>
            <Label htmlFor="medicalNotes">Medical Notes</Label>
            <Textarea
              id="medicalNotes"
              {...form.register("medicalNotes")}
              rows={2}
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
                  <AlertDialogTitle>Delete pet?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will permanently delete {pet.name} and their grooming history. This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive hover:bg-destructive/90"
                    disabled={isDeleting}
                  >
                    {isDeleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
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
