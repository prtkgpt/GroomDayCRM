import { redirect } from "next/navigation"
import { ensureUserAndOrg } from "@/lib/auth"
import { AppShell } from "@/components/layout/app-shell"

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  try {
    const user = await ensureUserAndOrg()

    if (!user) {
      redirect("/login")
    }

    return (
      <AppShell orgName={user.organization.name}>
        {children}
      </AppShell>
    )
  } catch (error) {
    console.error("Error in AppLayout:", error)
    throw error
  }
}
