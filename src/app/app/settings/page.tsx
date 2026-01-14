import { Settings, Building, Clock, MessageSquare, Users, Plug } from "lucide-react"
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
          <TabsTrigger value="team" disabled>
            <Users className="h-4 w-4 mr-2" />
            Team (Coming Soon)
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
                Invite staff members and manage permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Team management is coming in a future update.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
