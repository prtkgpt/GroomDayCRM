"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format, isPast, isFuture, addDays } from "date-fns"
import {
  Syringe,
  Plus,
  AlertTriangle,
  CheckCircle,
  Clock,
  Trash2,
  FileText,
  ExternalLink,
  Loader2,
} from "lucide-react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { toast } from "@/components/ui/use-toast"
import { createVaccination, deleteVaccination } from "@/lib/actions/vaccinations"

interface Vaccination {
  id: string
  name: string
  dateAdministered: Date
  expirationDate: Date | null
  documentUrl: string | null
  documentName: string | null
  notes: string | null
}

interface VaccinationTrackerProps {
  petId: string
  petName: string
  vaccinations: Vaccination[]
}

function getVaccinationStatus(expirationDate: Date | null) {
  if (!expirationDate) return "unknown"
  if (isPast(expirationDate)) return "expired"
  if (isFuture(addDays(new Date(), 30)) && isPast(addDays(expirationDate, -30))) {
    return "expiring"
  }
  return "valid"
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "expired":
      return (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Expired
        </Badge>
      )
    case "expiring":
      return (
        <Badge className="bg-yellow-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Expiring Soon
        </Badge>
      )
    case "valid":
      return (
        <Badge className="bg-green-500 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Valid
        </Badge>
      )
    default:
      return (
        <Badge variant="secondary">No Expiration</Badge>
      )
  }
}

export function VaccinationTracker({ petId, petName, vaccinations }: VaccinationTrackerProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    name: "",
    dateAdministered: "",
    expirationDate: "",
    documentUrl: "",
    notes: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name || !formData.dateAdministered) {
      toast({ title: "Please fill in required fields", variant: "destructive" })
      return
    }

    startTransition(async () => {
      try {
        await createVaccination({
          petId,
          name: formData.name,
          dateAdministered: formData.dateAdministered,
          expirationDate: formData.expirationDate || undefined,
          documentUrl: formData.documentUrl || undefined,
          notes: formData.notes || undefined,
        })
        toast({ title: "Vaccination record added" })
        setOpen(false)
        setFormData({
          name: "",
          dateAdministered: "",
          expirationDate: "",
          documentUrl: "",
          notes: "",
        })
        router.refresh()
      } catch (error) {
        toast({ title: "Failed to add vaccination", variant: "destructive" })
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteVaccination(id)
        toast({ title: "Vaccination record deleted" })
        router.refresh()
      } catch (error) {
        toast({ title: "Failed to delete", variant: "destructive" })
      }
    })
  }

  const expiredCount = vaccinations.filter(
    (v) => v.expirationDate && isPast(new Date(v.expirationDate))
  ).length

  const expiringCount = vaccinations.filter((v) => {
    if (!v.expirationDate) return false
    const exp = new Date(v.expirationDate)
    return !isPast(exp) && isPast(addDays(exp, -30))
  }).length

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Syringe className="h-5 w-5" />
            Vaccinations
          </CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Vaccination Record</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="name">Vaccine Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Rabies, DHPP, Bordetella"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dateAdministered">Date Given *</Label>
                    <Input
                      id="dateAdministered"
                      type="date"
                      value={formData.dateAdministered}
                      onChange={(e) => setFormData({ ...formData, dateAdministered: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="expirationDate">Expiration Date</Label>
                    <Input
                      id="expirationDate"
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="documentUrl">Document Link (optional)</Label>
                  <Input
                    id="documentUrl"
                    type="url"
                    value={formData.documentUrl}
                    onChange={(e) => setFormData({ ...formData, documentUrl: e.target.value })}
                    placeholder="https://drive.google.com/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Link to vaccination certificate (Google Drive, Dropbox, etc.)
                  </p>
                </div>
                <div>
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Vet name, any reactions, etc."
                    rows={2}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isPending}>
                    {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Add Record
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {/* Alerts */}
        {(expiredCount > 0 || expiringCount > 0) && (
          <div className="mb-4 space-y-2">
            {expiredCount > 0 && (
              <div className="flex items-center gap-2 p-2 bg-red-50 text-red-700 rounded-lg text-sm">
                <AlertTriangle className="h-4 w-4" />
                {expiredCount} expired vaccination{expiredCount !== 1 && "s"}
              </div>
            )}
            {expiringCount > 0 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 text-yellow-700 rounded-lg text-sm">
                <Clock className="h-4 w-4" />
                {expiringCount} vaccination{expiringCount !== 1 && "s"} expiring within 30 days
              </div>
            )}
          </div>
        )}

        {/* List */}
        {vaccinations.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">
            No vaccination records yet
          </p>
        ) : (
          <div className="space-y-3">
            {vaccinations.map((vax) => {
              const status = getVaccinationStatus(
                vax.expirationDate ? new Date(vax.expirationDate) : null
              )
              return (
                <div
                  key={vax.id}
                  className="p-3 border rounded-lg space-y-2"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{vax.name}</p>
                      <p className="text-sm text-muted-foreground">
                        Given: {format(new Date(vax.dateAdministered), "MMM d, yyyy")}
                      </p>
                      {vax.expirationDate && (
                        <p className="text-sm text-muted-foreground">
                          Expires: {format(new Date(vax.expirationDate), "MMM d, yyyy")}
                        </p>
                      )}
                    </div>
                    <StatusBadge status={status} />
                  </div>

                  {vax.notes && (
                    <p className="text-sm text-muted-foreground">{vax.notes}</p>
                  )}

                  <div className="flex items-center justify-between pt-2">
                    {vax.documentUrl ? (
                      <a
                        href={vax.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-sm text-primary hover:underline"
                      >
                        <FileText className="h-4 w-4" />
                        View Document
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : (
                      <span className="text-sm text-muted-foreground">No document</span>
                    )}

                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="sm" className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete vaccination record?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the {vax.name} vaccination record.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(vax.id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
