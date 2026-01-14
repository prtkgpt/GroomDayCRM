"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  Syringe,
  Plus,
  FileUp,
  Trash2,
  Edit,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Eye,
  Download,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { toast } from "@/components/ui/use-toast"
import {
  createVaccinationRecord,
  updateVaccinationRecord,
  deleteVaccinationRecord,
} from "@/lib/actions/documents"

interface VaccinationRecord {
  id: string
  name: string
  dateAdministered: Date
  expirationDate: Date | null
  documentUrl: string | null
  documentName: string | null
  notes: string | null
}

interface VaccinationManagerProps {
  petId: string
  petName: string
  vaccinations: VaccinationRecord[]
}

export function VaccinationManager({ petId, petName, vaccinations }: VaccinationManagerProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingRecord, setEditingRecord] = useState<VaccinationRecord | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    dateAdministered: "",
    expirationDate: "",
    notes: "",
    documentUrl: "",
    documentName: "",
  })

  const resetForm = () => {
    setFormData({
      name: "",
      dateAdministered: "",
      expirationDate: "",
      notes: "",
      documentUrl: "",
      documentName: "",
    })
    setEditingRecord(null)
  }

  const openEdit = (record: VaccinationRecord) => {
    setEditingRecord(record)
    setFormData({
      name: record.name,
      dateAdministered: format(new Date(record.dateAdministered), "yyyy-MM-dd"),
      expirationDate: record.expirationDate
        ? format(new Date(record.expirationDate), "yyyy-MM-dd")
        : "",
      notes: record.notes || "",
      documentUrl: record.documentUrl || "",
      documentName: record.documentName || "",
    })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    if (!formData.name || !formData.dateAdministered) {
      toast({ title: "Please fill in required fields", variant: "destructive" })
      return
    }

    startTransition(async () => {
      try {
        if (editingRecord) {
          await updateVaccinationRecord(editingRecord.id, {
            name: formData.name,
            dateAdministered: new Date(formData.dateAdministered),
            expirationDate: formData.expirationDate ? new Date(formData.expirationDate) : undefined,
            notes: formData.notes || undefined,
            documentUrl: formData.documentUrl || undefined,
            documentName: formData.documentName || undefined,
          })
          toast({ title: "Vaccination record updated" })
        } else {
          await createVaccinationRecord({
            petId,
            name: formData.name,
            dateAdministered: new Date(formData.dateAdministered),
            expirationDate: formData.expirationDate ? new Date(formData.expirationDate) : undefined,
            notes: formData.notes || undefined,
            documentUrl: formData.documentUrl || undefined,
            documentName: formData.documentName || undefined,
          })
          toast({ title: "Vaccination record added" })
        }
        setDialogOpen(false)
        resetForm()
        router.refresh()
      } catch (error) {
        toast({ title: "Error saving record", variant: "destructive" })
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteVaccinationRecord(id)
        toast({ title: "Vaccination record deleted" })
        router.refresh()
      } catch (error) {
        toast({ title: "Error deleting record", variant: "destructive" })
      }
    })
  }

  // Handle file upload (stores URL - in production would upload to S3/Cloudinary)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // In production, upload to cloud storage and get URL
      // For now, we'll use a placeholder
      setFormData({
        ...formData,
        documentName: file.name,
        documentUrl: URL.createObjectURL(file), // Temporary local URL
      })
      toast({
        title: "File selected",
        description: "In production, this would upload to cloud storage.",
      })
    }
  }

  const getExpirationStatus = (expirationDate: Date | null) => {
    if (!expirationDate) return null
    const now = new Date()
    const expDate = new Date(expirationDate)
    const daysUntilExpiration = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    if (daysUntilExpiration < 0) {
      return { status: "expired", label: "Expired", color: "bg-red-100 text-red-700" }
    }
    if (daysUntilExpiration <= 30) {
      return { status: "expiring", label: `Expires in ${daysUntilExpiration} days`, color: "bg-amber-100 text-amber-700" }
    }
    return { status: "valid", label: "Valid", color: "bg-emerald-100 text-emerald-700" }
  }

  const commonVaccines = ["Rabies", "DHPP", "Bordetella", "Leptospirosis", "Lyme", "Canine Influenza", "FVRCP", "FeLV"]

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Syringe className="h-5 w-5 text-emerald-600" />
          </div>
          <div>
            <CardTitle className="text-lg">Vaccination Records</CardTitle>
            <p className="text-sm text-muted-foreground">{petName}&apos;s vaccine history</p>
          </div>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          setDialogOpen(open)
          if (!open) resetForm()
        }}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Add Record
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingRecord ? "Edit Vaccination" : "Add Vaccination Record"}</DialogTitle>
              <DialogDescription>
                Record vaccination details and upload documentation.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Vaccine Name *</Label>
                <Input
                  placeholder="e.g., Rabies"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  list="vaccine-suggestions"
                />
                <datalist id="vaccine-suggestions">
                  {commonVaccines.map((v) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date Administered *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-9"
                      value={formData.dateAdministered}
                      onChange={(e) => setFormData({ ...formData, dateAdministered: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Expiration Date</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="date"
                      className="pl-9"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Upload Document</Label>
                <div className="border-2 border-dashed rounded-xl p-4 text-center hover:border-primary/50 transition-colors">
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    id="vaccine-doc"
                    onChange={handleFileChange}
                  />
                  <label htmlFor="vaccine-doc" className="cursor-pointer">
                    {formData.documentName ? (
                      <div className="flex items-center justify-center gap-2">
                        <CheckCircle className="h-5 w-5 text-emerald-600" />
                        <span className="text-sm">{formData.documentName}</span>
                      </div>
                    ) : (
                      <>
                        <FileUp className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to upload vaccine certificate
                        </p>
                        <p className="text-xs text-muted-foreground">PDF, JPG, PNG</p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  placeholder="Any additional notes..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                {editingRecord ? "Update" : "Add Record"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        {vaccinations.length === 0 ? (
          <div className="text-center py-8">
            <Syringe className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No vaccination records</p>
            <p className="text-sm text-muted-foreground">Add {petName}&apos;s vaccination history</p>
          </div>
        ) : (
          <div className="space-y-3">
            {vaccinations.map((record) => {
              const expStatus = getExpirationStatus(record.expirationDate)
              return (
                <div
                  key={record.id}
                  className="flex items-center justify-between p-3 rounded-xl border bg-card hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-emerald-50 flex items-center justify-center">
                      <Syringe className="h-4 w-4 text-emerald-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{record.name}</p>
                        {expStatus && (
                          <Badge className={expStatus.color}>{expStatus.label}</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Given: {format(new Date(record.dateAdministered), "MMM d, yyyy")}
                        {record.expirationDate && (
                          <> • Expires: {format(new Date(record.expirationDate), "MMM d, yyyy")}</>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {record.documentUrl && (
                      <Button variant="ghost" size="icon" asChild>
                        <a href={record.documentUrl} target="_blank" rel="noopener noreferrer">
                          <Eye className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => openEdit(record)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete vaccination record?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete the {record.name} record.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDelete(record.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
