import Link from "next/link"
import { Settings, Building, Clock, MessageSquare, Users, Plug, ExternalLink, Repeat, Package, BarChart3 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { getOrganization, getMessageTemplates, getIntegrations } from "@/lib/actions/organization"
import { BusinessSettings } from "./business-settings"
import { MessageTemplates } from "./message-templates"
import { IntegrationsSettings } from "./integrations-settings"

export default async function SettingsPage() {
  const [organization, templates, integrations] = await Promise.all([
    getOrganization(),
    getMessageTemplates(),
    getIntegrations(),
  ])

  if (!organization) {
    return <div>Organization not found</div>
  }

  // Ensure theme has a default value for backwards compatibility
  const orgWithDefaults = {
    ...organization,
    theme: organization.theme || "blue",
  }

  return (
    <div className="p-4 lg:p-8 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">
          Manage your business settings and preferences
        </p>
      </div>

      <Tabs defaultValue="business" className="space-y-6">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="business">
            <Building className="h-4 w-4 mr-2" />
            Business
          </TabsTrigger>
          <TabsTrigger value="recurring">
            <Repeat className="h-4 w-4 mr-2" />
            Recurring
          </TabsTrigger>
          <TabsTrigger value="inventory">
            <Package className="h-4 w-4 mr-2" />
            Inventory
          </TabsTrigger>
          <TabsTrigger value="reports">
            <BarChart3 className="h-4 w-4 mr-2" />
            Reports
          </TabsTrigger>
          <TabsTrigger value="integrations">
            <Plug className="h-4 w-4 mr-2" />
            Integrations
          </TabsTrigger>
          <TabsTrigger value="messages">
            <MessageSquare className="h-4 w-4 mr-2" />
            Messages
          </TabsTrigger>
          <TabsTrigger value="team">
            <Users className="h-4 w-4 mr-2" />
            Team
          </TabsTrigger>
        </TabsList>

        <TabsContent value="business">
          <BusinessSettings organization={orgWithDefaults} />
        </TabsContent>

        <TabsContent value="recurring">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Repeat className="h-5 w-5" />
                Recurring Schedules
              </CardTitle>
              <CardDescription>
                Manage recurring appointments and automated scheduling
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Set up recurring appointments for regular clients. Automatically generate appointments based on schedules.
              </p>
              <Link href="/app/recurring">
                <Button>
                  <Repeat className="h-4 w-4 mr-2" />
                  Manage Recurring Schedules
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="inventory">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Inventory Management
              </CardTitle>
              <CardDescription>
                Track grooming supplies and stock levels
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Manage your inventory of shampoos, conditioners, and other grooming supplies. Get alerts when stock is low.
              </p>
              <Link href="/app/inventory">
                <Button>
                  <Package className="h-4 w-4 mr-2" />
                  Manage Inventory
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Reports & Analytics
              </CardTitle>
              <CardDescription>
                Business insights and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                View revenue reports, appointment trends, popular services, and top clients to make data-driven decisions.
              </p>
              <Link href="/app/reports">
                <Button>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  View Reports
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Team Management
              </CardTitle>
              <CardDescription>
                Manage your staff members, schedules, and time off
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Add and manage groomers, set their working schedules, and track time off requests.
              </p>
              <Link href="/app/staff">
                <Button>
                  <Users className="h-4 w-4 mr-2" />
                  Manage Staff
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
