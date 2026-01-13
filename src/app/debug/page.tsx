import { auth, currentUser } from "@clerk/nextjs/server"
import { db } from "@/lib/db"

export default async function DebugPage() {
  const results: Record<string, unknown> = {}

  // Check auth
  try {
    const { userId } = await auth()
    results.userId = userId
  } catch (e) {
    results.authError = String(e)
  }

  // Check Clerk user
  try {
    const user = await currentUser()
    results.clerkUser = user ? { id: user.id, email: user.emailAddresses[0]?.emailAddress } : null
  } catch (e) {
    results.clerkUserError = String(e)
  }

  // Check database connection
  try {
    const orgCount = await db.organization.count()
    results.dbConnected = true
    results.orgCount = orgCount
  } catch (e) {
    results.dbError = String(e)
  }

  // Check tables exist
  try {
    const userCount = await db.user.count()
    results.userCount = userCount
  } catch (e) {
    results.userTableError = String(e)
  }

  return (
    <div className="p-8 font-mono text-sm">
      <h1 className="text-2xl font-bold mb-4">Debug Info</h1>
      <pre className="bg-gray-100 p-4 rounded overflow-auto">
        {JSON.stringify(results, null, 2)}
      </pre>
    </div>
  )
}
