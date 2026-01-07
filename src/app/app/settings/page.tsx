import { Settings, Building, Clock, MessageSquare, Users } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getOrganization, getMessageTemplates } from "@/lib/actions/organization"
import { BusinessSettings } from "./business-settings"
import { MessageTemplates } from "./message-templates"

export default async function SettingsPage() {
  const [organization, templates] = await Promise.all([
    getOrganization(),
    getMessageTemplates(),
  ])

  if (!organization) {
    return <div>Organization not found</div>
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
        <TabsList>
          <TabsTrigger value="business">
            <Building className="h-4 w-4 mr-2" />
            Business
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
          <BusinessSettings organization={organization} />
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
