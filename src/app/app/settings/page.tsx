import Link from "next/link"
import { Building, MessageSquare, Users, Plug, ArrowRight, Repeat, Package, BarChart3, FileText } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { getOrganization, getMessageTemplates, getIntegrations } from "@/lib/actions/organization"
import { getWaiverTemplates, getGroomingNoteTemplates } from "@/lib/actions/documents"
import { BusinessSettings } from "./business-settings"
import { MessageTemplates } from "./message-templates"
import { IntegrationsSettings } from "./integrations-settings"
import { DocumentsSettings } from "./documents-settings"

export default async function SettingsPage() {
  const [organization, templates, integrations, waiverTemplates, groomingNoteTemplatesRaw] = await Promise.all([
    getOrganization(),
    getMessageTemplates(),
    getIntegrations(),
    getWaiverTemplates(),
    getGroomingNoteTemplates(),
  ])

  if (!organization) {
    return <div>Organization not found</div>
  }

  // Transform grooming note templates to ensure fields is always an array
  // Cast to the expected type since Prisma returns JsonValue
  const groomingNoteTemplates = groomingNoteTemplatesRaw.map((template) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    isDefault: template.isDefault,
    isActive: template.isActive,
    fields: (Array.isArray(template.fields) ? template.fields : []) as Array<{
      name: string
      type: "text" | "textarea" | "select" | "checkbox" | "number" | "rating"
      options?: string[]
      required?: boolean
    }>,
  }))

  const orgWithDefaults = {
    ...organization,
    theme: organization.theme || "blue",
  }

  return (
    <div className="p-4 lg:p-8 space-y-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
        <p className="text-muted-foreground">
          Manage your business settings and preferences
        </p>
      </div>

      <Tabs defaultValue="business" className="space-y-8">
        <TabsList className="flex-wrap h-auto gap-1 p-1.5 bg-muted/50">
          <TabsTrigger value="business" className="gap-2">
            <Building className="h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="recurring" className="gap-2">
            <Repeat className="h-4 w-4" />
            Recurring
          </TabsTrigger>
          <TabsTrigger value="inventory" className="gap-2">
            <Package className="h-4 w-4" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="reports" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="documents" className="gap-2">
            <FileText className="h-4 w-4" />
            Documents
          </TabsTrigger>
          <TabsTrigger value="integrations" className="gap-2">
            <Plug className="h-4 w-4" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="messages" className="gap-2">
            <MessageSquare className="h-4 w-4" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="team" className="gap-2">
            <Users className="h-4 w-4" />
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <BusinessSettings organization={orgWithDefaults} />
        </TabsContent>

        <TabsContent value="recurring">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-primary/5 to-transparent pb-8">
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Repeat className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Recurring Schedules</CardTitle>
              <CardDescription className="text-base">
                Manage recurring appointments and automated scheduling
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-6">
                Set up recurring appointments for regular clients. Automatically generate appointments based on schedules.
              </p>
              <Link href="/app/recurring">
                <Button className="gap-2">
                  Manage Recurring Schedules
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-emerald-50 to-transparent pb-8">
              <div className="h-12 w-12 rounded-2xl bg-emerald-100 flex items-center justify-center mb-4">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
              <CardTitle>Inventory Management</CardTitle>
              <CardDescription className="text-base">
                Track grooming supplies and stock levels
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-6">
                Manage your inventory of shampoos, conditioners, and other grooming supplies. Get alerts when stock is low.
              </p>
              <Link href="/app/inventory">
                <Button className="gap-2">
                  Manage Inventory
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-blue-50 to-transparent pb-8">
              <div className="h-12 w-12 rounded-2xl bg-blue-100 flex items-center justify-center mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <CardTitle>Reports & Analytics</CardTitle>
              <CardDescription className="text-base">
                Business insights and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-6">
                View revenue reports, appointment trends, popular services, and top clients to make data-driven decisions.
              </p>
              <Link href="/app/reports">
                <Button className="gap-2">
                  View Reports
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="documents">
          <DocumentsSettings
            waiverTemplates={waiverTemplates}
            groomingNoteTemplates={groomingNoteTemplates}
          />
        </TabsContent>

        <TabsContent value="integrations">
          <IntegrationsSettings
            integrations={{
              stripeSecretKey: integrations?.stripeSecretKey || null,
              stripePublishableKey: integrations?.stripePublishableKey || null,
              twilioAccountSid: integrations?.twilioAccountSid || null,
              twilioAuthToken: integrations?.twilioAuthToken || null,
              twilioPhoneNumber: integrations?.twilioPhoneNumber || null,
              resendApiKey: integrations?.resendApiKey || null,
              googleReviewUrl: integrations?.googleReviewUrl || null,
              yelpUrl: integrations?.yelpUrl || null,
              facebookUrl: integrations?.facebookUrl || null,
              instagramUrl: integrations?.instagramUrl || null,
            }}
          />
        </TabsContent>

        <TabsContent value="messages">
          <MessageTemplates templates={templates} />
        </TabsContent>

        <TabsContent value="team">
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-br from-amber-50 to-transparent pb-8">
              <div className="h-12 w-12 rounded-2xl bg-amber-100 flex items-center justify-center mb-4">
                <Users className="h-6 w-6 text-amber-600" />
              </div>
              <CardTitle>Team Management</CardTitle>
              <CardDescription className="text-base">
                Manage your staff members, schedules, and time off
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <p className="text-muted-foreground mb-6">
                Add and manage groomers, set their working schedules, and track time off requests.
              </p>
              <Link href="/app/staff">
                <Button className="gap-2">
                  Manage Staff
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
