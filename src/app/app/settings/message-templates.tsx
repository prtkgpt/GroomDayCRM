"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Mail, MessageSquare, Info } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { toast } from "@/components/ui/use-toast"
import { updateMessageTemplate } from "@/lib/actions/organization"

interface MessageTemplatesProps {
  templates: {
    id: string
    name: string
    type: string
    subject: string | null
    body: string
    isActive: boolean
  }[]
}

const typeLabels: Record<string, string> = {
  BOOKING_CONFIRMATION: "Booking Confirmation",
  REMINDER_24H: "24 Hour Reminder",
  ON_MY_WAY: "On My Way",
  THANK_YOU: "Thank You",
  CUSTOM: "Custom",
}

const availableVariables = [
  { var: "{{clientName}}", desc: "Client's full name" },
  { var: "{{petNames}}", desc: "Names of pets being groomed" },
  { var: "{{appointmentDate}}", desc: "Full date of appointment" },
  { var: "{{appointmentTime}}", desc: "Time of appointment" },
  { var: "{{services}}", desc: "List of services booked" },
  { var: "{{location}}", desc: "Appointment location" },
  { var: "{{businessName}}", desc: "Your business name" },
  { var: "{{totalAmount}}", desc: "Total appointment amount" },
]

export function MessageTemplates({ templates }: MessageTemplatesProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [editingTemplate, setEditingTemplate] = useState<typeof templates[0] | null>(null)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")

  const openEditDialog = (template: typeof templates[0]) => {
    setEditingTemplate(template)
    setSubject(template.subject || "")
    setBody(template.body)
  }

  const handleSave = () => {
    if (!editingTemplate) return

    startTransition(async () => {
      try {
        await updateMessageTemplate(editingTemplate.id, { subject, body })
        toast({ title: "Template saved" })
        setEditingTemplate(null)
        router.refresh()
      } catch (error) {
        toast({ title: "Failed to save template", variant: "destructive" })
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Message Templates</CardTitle>
              <CardDescription>
                Customize the messages sent to your clients
              </CardDescription>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="outline" size="icon">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="font-medium mb-2">Available Variables:</p>
                <ul className="text-xs space-y-1">
                  {availableVariables.map((v) => (
                    <li key={v.var}>
                      <code>{v.var}</code> - {v.desc}
                    </li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-start justify-between p-4 rounded-lg border"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <h4 className="font-medium">{template.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {typeLabels[template.type] || template.type}
                    </Badge>
                  </div>
                  {template.subject && (
                    <p className="text-sm text-muted-foreground mb-1">
                      Subject: {template.subject}
                    </p>
                  )}
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {template.body}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openEditDialog(template)}
                >
                  Edit
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingTemplate}
        onOpenChange={(open) => !open && setEditingTemplate(null)}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Template: {editingTemplate?.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="subject">Subject Line</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject..."
              />
            </div>

            <div>
              <Label htmlFor="body">Message Body</Label>
              <Textarea
                id="body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
            </div>

            <div className="bg-muted p-3 rounded-lg">
              <p className="text-xs font-medium mb-2">Available Variables:</p>
              <div className="flex flex-wrap gap-1">
                {availableVariables.map((v) => (
                  <button
                    key={v.var}
                    type="button"
                    onClick={() => setBody(body + v.var)}
                    className="text-xs px-2 py-1 bg-background rounded border hover:bg-accent transition-colors"
                  >
                    {v.var}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                Save Template
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
