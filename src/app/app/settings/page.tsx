import Link from "next/link"
import { Settings, Building, Clock, MessageSquare, Users, Plug, ExternalLink } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="business">
            <Building className="h-4 w-4 mr-2" />
            Business
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
              <CardTitle>Team Management</CardTitle>
              <CardDescription>
                Manage your staff members, schedules, and time off
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Staff management has moved to its own dedicated section for easier access.
              </p>
              <Link href="/app/staff">
                <button className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                  <Users className="h-4 w-4 mr-2" />
                  Go to Staff Management
                  <ExternalLink className="h-4 w-4 ml-2" />
                </button>
              </Link>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
