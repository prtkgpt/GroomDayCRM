"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import {
  FileText,
  ClipboardList,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Star,
  Check,
  FileSignature,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import {
  createWaiverTemplate,
  updateWaiverTemplate,
  deleteWaiverTemplate,
  createGroomingNoteTemplate,
  updateGroomingNoteTemplate,
  deleteGroomingNoteTemplate,
} from "@/lib/actions/documents"

interface WaiverTemplate {
  id: string
  name: string
  content: string
  isRequired: boolean
  isActive: boolean
  _count: { signatures: number }
}

interface GroomingNoteTemplate {
  id: string
  name: string
  description: string | null
  fields: TemplateField[]
  isDefault: boolean
  isActive: boolean
}

interface TemplateField {
  name: string
  type: "text" | "textarea" | "select" | "checkbox" | "number" | "rating"
  options?: string[]
  required?: boolean
}

interface DocumentsSettingsProps {
  waiverTemplates: WaiverTemplate[]
  groomingNoteTemplates: GroomingNoteTemplate[]
}

export function DocumentsSettings({ waiverTemplates, groomingNoteTemplates }: DocumentsSettingsProps) {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="waivers" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="waivers" className="gap-2">
            <FileSignature className="h-4 w-4" />
            Waivers
          </TabsTrigger>
          <TabsTrigger value="grooming-notes" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            Grooming Notes
          </TabsTrigger>
        </TabsList>

        <TabsContent value="waivers">
          <WaiversSection templates={waiverTemplates} />
        </TabsContent>

        <TabsContent value="grooming-notes">
          <GroomingNotesSection templates={groomingNoteTemplates} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

// ============================================
// WAIVERS SECTION
// ============================================

function WaiversSection({ templates }: { templates: WaiverTemplate[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<WaiverTemplate | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    content: "",
    isRequired: false,
  })

  const resetForm = () => {
    setFormData({ name: "", content: "", isRequired: false })
    setEditingTemplate(null)
  }

  const openEdit = (template: WaiverTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      content: template.content,
      isRequired: template.isRequired,
    })
    setDialogOpen(true)
  }

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        if (editingTemplate) {
          await updateWaiverTemplate(editingTemplate.id, formData)
          toast({ title: "Waiver template updated" })
        } else {
          await createWaiverTemplate(formData)
          toast({ title: "Waiver template created" })
        }
        setDialogOpen(false)
        resetForm()
        router.refresh()
      } catch (error) {
        toast({ title: "Error saving template", variant: "destructive" })
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteWaiverTemplate(id)
        toast({ title: "Waiver template deleted" })
        router.refresh()
      } catch (error) {
        toast({ title: "Error deleting template", variant: "destructive" })
      }
    })
  }

  const handleToggleActive = (template: WaiverTemplate) => {
    startTransition(async () => {
      try {
        await updateWaiverTemplate(template.id, { isActive: !template.isActive })
        router.refresh()
      } catch (error) {
        toast({ title: "Error updating template", variant: "destructive" })
      }
    })
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-violet-50 to-transparent pb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-12 w-12 rounded-2xl bg-violet-100 flex items-center justify-center mb-4">
              <FileSignature className="h-6 w-6 text-violet-600" />
            </div>
            <CardTitle>Digital Waivers</CardTitle>
            <CardDescription className="text-base">
              Create liability waivers for clients to sign electronically
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Waiver
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? "Edit Waiver" : "Create Waiver Template"}</DialogTitle>
                <DialogDescription>
                  Create a waiver that clients can sign electronically.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    placeholder="e.g., Liability Waiver"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Waiver Content</Label>
                  <Textarea
                    placeholder="Enter the full text of your waiver..."
                    className="min-h-[200px]"
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Tip: Use {"{clientName}"} to insert the client&apos;s name.
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label>Required for all clients</Label>
                    <p className="text-sm text-muted-foreground">
                      All clients must sign before their first appointment
                    </p>
                  </div>
                  <Switch
                    checked={formData.isRequired}
                    onCheckedChange={(checked) => setFormData({ ...formData, isRequired: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isPending || !formData.name || !formData.content}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingTemplate ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {templates.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No waiver templates yet</p>
            <p className="text-sm text-muted-foreground">Create your first waiver template above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-4 rounded-xl border bg-card"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
                    <FileSignature className="h-5 w-5 text-violet-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{template.name}</p>
                      {template.isRequired && (
                        <Badge variant="secondary" className="text-xs">Required</Badge>
                      )}
                      {!template.isActive && (
                        <Badge variant="outline" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template._count.signatures} signature{template._count.signatures !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={template.isActive}
                    onCheckedChange={() => handleToggleActive(template)}
                    disabled={isPending}
                  />
                  <Button variant="ghost" size="icon" onClick={() => openEdit(template)}>
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
                        <AlertDialogTitle>Delete waiver template?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &quot;{template.name}&quot;. Existing signatures will be preserved.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(template.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// ============================================
// GROOMING NOTES SECTION
// ============================================

const FIELD_TYPES = [
  { value: "text", label: "Short Text" },
  { value: "textarea", label: "Long Text" },
  { value: "select", label: "Dropdown" },
  { value: "checkbox", label: "Checkbox" },
  { value: "number", label: "Number" },
  { value: "rating", label: "Rating (1-5)" },
]

function GroomingNotesSection({ templates }: { templates: GroomingNoteTemplate[] }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<GroomingNoteTemplate | null>(null)
  const [formData, setFormData] = useState<{
    name: string
    description: string
    fields: TemplateField[]
    isDefault: boolean
  }>({
    name: "",
    description: "",
    fields: [],
    isDefault: false,
  })

  const resetForm = () => {
    setFormData({ name: "", description: "", fields: [], isDefault: false })
    setEditingTemplate(null)
  }

  const openEdit = (template: GroomingNoteTemplate) => {
    setEditingTemplate(template)
    setFormData({
      name: template.name,
      description: template.description || "",
      fields: template.fields,
      isDefault: template.isDefault,
    })
    setDialogOpen(true)
  }

  const addField = () => {
    setFormData({
      ...formData,
      fields: [...formData.fields, { name: "", type: "text", required: false }],
    })
  }

  const updateField = (index: number, updates: Partial<TemplateField>) => {
    const newFields = [...formData.fields]
    newFields[index] = { ...newFields[index], ...updates }
    setFormData({ ...formData, fields: newFields })
  }

  const removeField = (index: number) => {
    setFormData({
      ...formData,
      fields: formData.fields.filter((_, i) => i !== index),
    })
  }

  const handleSubmit = () => {
    startTransition(async () => {
      try {
        if (editingTemplate) {
          await updateGroomingNoteTemplate(editingTemplate.id, formData)
          toast({ title: "Template updated" })
        } else {
          await createGroomingNoteTemplate(formData)
          toast({ title: "Template created" })
        }
        setDialogOpen(false)
        resetForm()
        router.refresh()
      } catch (error) {
        toast({ title: "Error saving template", variant: "destructive" })
      }
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      try {
        await deleteGroomingNoteTemplate(id)
        toast({ title: "Template deleted" })
        router.refresh()
      } catch (error) {
        toast({ title: "Error deleting template", variant: "destructive" })
      }
    })
  }

  const handleSetDefault = (template: GroomingNoteTemplate) => {
    startTransition(async () => {
      try {
        await updateGroomingNoteTemplate(template.id, { isDefault: true })
        router.refresh()
      } catch (error) {
        toast({ title: "Error updating template", variant: "destructive" })
      }
    })
  }

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-br from-amber-50 to-transparent pb-8">
        <div className="flex items-start justify-between">
          <div>
            <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
              <ClipboardList className="h-6 w-6 text-amber-600" />
            </div>
            <CardTitle>Grooming Note Templates</CardTitle>
            <CardDescription className="text-base">
              Create standardized templates for documenting grooming sessions
            </CardDescription>
          </div>
          <Dialog open={dialogOpen} onOpenChange={(open) => {
            setDialogOpen(open)
            if (!open) resetForm()
          }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingTemplate ? "Edit Template" : "Create Grooming Note Template"}</DialogTitle>
                <DialogDescription>
                  Define custom fields for documenting grooming sessions.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Template Name</Label>
                  <Input
                    placeholder="e.g., Full Groom Checklist"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input
                    placeholder="Brief description of when to use this template"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Fields</Label>
                    <Button type="button" variant="outline" size="sm" onClick={addField}>
                      <Plus className="h-4 w-4 mr-1" />
                      Add Field
                    </Button>
                  </div>

                  {formData.fields.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg bg-muted/20">
                      <p className="text-muted-foreground">No fields yet. Add fields to build your template.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {formData.fields.map((field, index) => (
                        <div key={index} className="p-4 border rounded-lg space-y-3 bg-muted/20">
                          <div className="flex items-center gap-2">
                            <Input
                              placeholder="Field name"
                              value={field.name}
                              onChange={(e) => updateField(index, { name: e.target.value })}
                              className="flex-1"
                            />
                            <Select
                              value={field.type}
                              onValueChange={(value) => updateField(index, { type: value as TemplateField["type"] })}
                            >
                              <SelectTrigger className="w-[140px]">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {FIELD_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeField(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>

                          {field.type === "select" && (
                            <div className="space-y-2">
                              <Label className="text-sm">Options (comma-separated)</Label>
                              <Input
                                placeholder="Option 1, Option 2, Option 3"
                                value={field.options?.join(", ") || ""}
                                onChange={(e) =>
                                  updateField(index, {
                                    options: e.target.value.split(",").map((o) => o.trim()).filter(Boolean),
                                  })
                                }
                              />
                            </div>
                          )}

                          <div className="flex items-center gap-2">
                            <Switch
                              id={`required-${index}`}
                              checked={field.required}
                              onCheckedChange={(checked) => updateField(index, { required: checked })}
                            />
                            <Label htmlFor={`required-${index}`} className="text-sm">
                              Required field
                            </Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between rounded-lg border p-4">
                  <div>
                    <Label>Set as default template</Label>
                    <p className="text-sm text-muted-foreground">
                      Auto-apply to all new appointments
                    </p>
                  </div>
                  <Switch
                    checked={formData.isDefault}
                    onCheckedChange={(checked) => setFormData({ ...formData, isDefault: checked })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSubmit} disabled={isPending || !formData.name}>
                  {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  {editingTemplate ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {templates.length === 0 ? (
          <div className="text-center py-8">
            <ClipboardList className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
            <p className="text-muted-foreground">No grooming note templates yet</p>
            <p className="text-sm text-muted-foreground">Create your first template above</p>
          </div>
        ) : (
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between p-4 rounded-xl border bg-card"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center">
                    <ClipboardList className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{template.name}</p>
                      {template.isDefault && (
                        <Badge className="text-xs bg-amber-100 text-amber-700 hover:bg-amber-100">
                          <Star className="h-3 w-3 mr-1" />
                          Default
                        </Badge>
                      )}
                      {!template.isActive && (
                        <Badge variant="outline" className="text-xs">Inactive</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {template.fields.length} field{template.fields.length !== 1 ? "s" : ""}
                      {template.description && ` • ${template.description}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!template.isDefault && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleSetDefault(template)}
                      disabled={isPending}
                    >
                      <Star className="h-4 w-4 mr-1" />
                      Set Default
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={() => openEdit(template)}>
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
                        <AlertDialogTitle>Delete template?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete &quot;{template.name}&quot;. Existing notes using this template will be preserved.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(template.id)}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
