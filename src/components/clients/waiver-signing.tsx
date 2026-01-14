"use client"

import { useState, useRef, useTransition } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import {
  FileSignature,
  Check,
  AlertCircle,
  Loader2,
  PenLine,
  Type,
  Eraser,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/components/ui/use-toast"
import { signWaiver } from "@/lib/actions/documents"

interface WaiverTemplate {
  id: string
  name: string
  content: string
  isRequired: boolean
}

interface ClientWaiver {
  id: string
  signedAt: Date
  signatureType: "TYPED" | "DRAWN"
  template: {
    id: string
    name: string
  }
}

interface WaiverSigningProps {
  clientId: string
  clientName: string
  unsignedWaivers: WaiverTemplate[]
  signedWaivers: ClientWaiver[]
}

export function WaiverSigning({
  clientId,
  clientName,
  unsignedWaivers,
  signedWaivers,
}: WaiverSigningProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [selectedWaiver, setSelectedWaiver] = useState<WaiverTemplate | null>(null)
  const [signatureType, setSignatureType] = useState<"typed" | "drawn">("typed")
  const [typedSignature, setTypedSignature] = useState("")
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    setIsDrawing(true)
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = "touches" in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left
    const y = "touches" in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top

    ctx.strokeStyle = "#1f2937"
    ctx.lineWidth = 2
    ctx.lineCap = "round"
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const handleSign = () => {
    if (!selectedWaiver) return

    let signatureData = ""
    if (signatureType === "typed") {
      if (!typedSignature.trim()) {
        toast({ title: "Please enter your name", variant: "destructive" })
        return
      }
      signatureData = typedSignature.trim()
    } else {
      const canvas = canvasRef.current
      if (!canvas) return
      signatureData = canvas.toDataURL("image/png")
      // Check if canvas is empty
      const ctx = canvas.getContext("2d")
      if (ctx) {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const hasSignature = imageData.data.some((pixel, i) => i % 4 === 3 && pixel !== 0)
        if (!hasSignature) {
          toast({ title: "Please draw your signature", variant: "destructive" })
          return
        }
      }
    }

    startTransition(async () => {
      try {
        await signWaiver({
          clientId,
          templateId: selectedWaiver.id,
          signatureData,
          signatureType: signatureType === "typed" ? "TYPED" : "DRAWN",
        })
        toast({ title: "Waiver signed successfully" })
        setSelectedWaiver(null)
        setTypedSignature("")
        clearCanvas()
        router.refresh()
      } catch (error) {
        toast({ title: "Error signing waiver", variant: "destructive" })
      }
    })
  }

  const hasUnsignedRequired = unsignedWaivers.some((w) => w.isRequired)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center">
              <FileSignature className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Waivers & Consent</CardTitle>
              <p className="text-sm text-muted-foreground">
                {signedWaivers.length} signed • {unsignedWaivers.length} pending
              </p>
            </div>
          </div>
          {hasUnsignedRequired && (
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="h-3 w-3" />
              Required
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Unsigned Waivers */}
        {unsignedWaivers.length > 0 && (
          <div className="space-y-3 mb-6">
            <p className="text-sm font-medium text-muted-foreground">Pending Signatures</p>
            {unsignedWaivers.map((waiver) => (
              <div
                key={waiver.id}
                className="flex items-center justify-between p-3 rounded-xl border border-amber-200 bg-amber-50/50"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-amber-100 flex items-center justify-center">
                    <FileSignature className="h-4 w-4 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium">{waiver.name}</p>
                    {waiver.isRequired && (
                      <p className="text-xs text-amber-600">Required before first appointment</p>
                    )}
                  </div>
                </div>
                <Button size="sm" onClick={() => setSelectedWaiver(waiver)}>
                  Sign Now
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Signed Waivers */}
        {signedWaivers.length > 0 && (
          <div className="space-y-3">
            <p className="text-sm font-medium text-muted-foreground">Signed Documents</p>
            {signedWaivers.map((waiver) => (
              <div
                key={waiver.id}
                className="flex items-center justify-between p-3 rounded-xl border bg-card"
              >
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                    <Check className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="font-medium">{waiver.template.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Signed {format(new Date(waiver.signedAt), "MMM d, yyyy")}
                      {" • "}
                      {waiver.signatureType === "TYPED" ? "Typed" : "Drawn"} signature
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
                  Signed
                </Badge>
              </div>
            ))}
          </div>
        )}

        {unsignedWaivers.length === 0 && signedWaivers.length === 0 && (
          <div className="text-center py-6">
            <FileSignature className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No waivers configured</p>
            <p className="text-sm text-muted-foreground">
              Set up waiver templates in Settings
            </p>
          </div>
        )}
      </CardContent>

      {/* Signing Dialog */}
      <Dialog open={!!selectedWaiver} onOpenChange={(open) => !open && setSelectedWaiver(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Sign {selectedWaiver?.name}</DialogTitle>
            <DialogDescription>
              Please read the waiver carefully and sign below.
            </DialogDescription>
          </DialogHeader>

          {/* Waiver Content */}
          <ScrollArea className="flex-1 max-h-[300px] border rounded-xl p-4 bg-muted/30">
            <div
              className="prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{
                __html: selectedWaiver?.content.replace(/\{clientName\}/g, clientName) || "",
              }}
            />
          </ScrollArea>

          {/* Signature Section */}
          <div className="space-y-4 pt-4">
            <Tabs value={signatureType} onValueChange={(v) => setSignatureType(v as "typed" | "drawn")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="typed" className="gap-2">
                  <Type className="h-4 w-4" />
                  Type Name
                </TabsTrigger>
                <TabsTrigger value="drawn" className="gap-2">
                  <PenLine className="h-4 w-4" />
                  Draw Signature
                </TabsTrigger>
              </TabsList>

              <TabsContent value="typed" className="mt-4">
                <div className="space-y-2">
                  <Label>Full Legal Name</Label>
                  <Input
                    placeholder="Enter your full name"
                    value={typedSignature}
                    onChange={(e) => setTypedSignature(e.target.value)}
                    className="text-lg"
                  />
                  {typedSignature && (
                    <div className="p-4 border rounded-xl bg-muted/30">
                      <p className="font-signature text-2xl italic">{typedSignature}</p>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="drawn" className="mt-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Draw Your Signature</Label>
                    <Button variant="ghost" size="sm" onClick={clearCanvas}>
                      <Eraser className="h-4 w-4 mr-1" />
                      Clear
                    </Button>
                  </div>
                  <div className="border-2 border-dashed rounded-xl bg-white p-1">
                    <canvas
                      ref={canvasRef}
                      width={500}
                      height={150}
                      className="w-full touch-none cursor-crosshair"
                      onMouseDown={startDrawing}
                      onMouseMove={draw}
                      onMouseUp={stopDrawing}
                      onMouseLeave={stopDrawing}
                      onTouchStart={startDrawing}
                      onTouchMove={draw}
                      onTouchEnd={stopDrawing}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground text-center">
                    Sign using your mouse or finger on touch devices
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          <DialogFooter className="pt-4">
            <Button variant="outline" onClick={() => setSelectedWaiver(null)}>
              Cancel
            </Button>
            <Button onClick={handleSign} disabled={isPending}>
              {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              <FileSignature className="h-4 w-4 mr-2" />
              Sign Waiver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  )
}
