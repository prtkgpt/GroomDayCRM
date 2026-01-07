# GroomDay CRM

A simple, elegant CRM for mobile and independent dog groomers. Built with Next.js, TypeScript, and modern web technologies.

## Features

- **Client & Pet Management** - Detailed profiles with grooming notes and preferences
- **Smart Scheduling** - Book appointments in under 30 seconds
- **Service Catalog** - Manage services with flexible pricing
- **Payment Tracking** - Record payments with tip support
- **Email Notifications** - Automated confirmations and reminders
- **Mobile-First Design** - Works great on phones and tablets
- **Google Maps Integration** - Easy navigation for mobile groomers

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS + shadcn/ui
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **Email**: Resend
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database (local or cloud - Supabase, Neon, etc.)
- Clerk account for authentication
- Resend account for emails (optional)

### Local Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GroomDayCRM
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://..."

   # Clerk
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
   NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
   NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/app
   NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/app

   # Resend (optional)
   RESEND_API_KEY=re_...
   ```

4. **Set up the database**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Seed demo data (optional)**
   ```bash
   npx ts-node prisma/seed.ts
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. Open [http://localhost:3000](http://localhost:3000)

### Deployment to Vercel

1. Push your code to GitHub

2. Create a new project in Vercel and connect your repository

3. Add environment variables in Vercel project settings:
   - `DATABASE_URL`
   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `NEXT_PUBLIC_CLERK_SIGN_IN_URL`
   - `NEXT_PUBLIC_CLERK_SIGN_UP_URL`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL`
   - `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL`
   - `RESEND_API_KEY` (optional)

4. Deploy!

### Database Setup Options

**Option 1: Supabase (Recommended)**
1. Create a free project at [supabase.com](https://supabase.com)
2. Go to Settings > Database and copy the connection string
3. Use the connection string as your `DATABASE_URL`

**Option 2: Neon**
1. Create a free project at [neon.tech](https://neon.tech)
2. Copy the connection string from the dashboard
3. Use as your `DATABASE_URL`

**Option 3: Local PostgreSQL**
```bash
# Create database
createdb groomdaycrm

# Use connection string
DATABASE_URL="postgresql://localhost:5432/groomdaycrm"
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication pages
│   ├── app/               # Main app pages (protected)
│   └── page.tsx           # Landing page
├── components/
│   ├── ui/                # shadcn/ui components
│   ├── booking/           # Booking-related components
│   └── layout/            # Layout components
├── lib/
│   ├── actions/           # Server actions
│   ├── auth.ts            # Auth helpers
│   ├── db.ts              # Prisma client
│   ├── utils.ts           # Utility functions
│   └── validations.ts     # Zod schemas
└── prisma/
    ├── schema.prisma      # Database schema
    └── seed.ts            # Seed data
```

## API Routes / Server Actions

All data operations use Next.js Server Actions:

- `clients.ts` - CRUD for clients, search
- `pets.ts` - CRUD for pets
- `appointments.ts` - Booking, status updates, conflicts
- `services.ts` - Service catalog management
- `payments.ts` - Payment recording
- `messaging.ts` - Email sending
- `organization.ts` - Settings, templates, stats

## License

MIT
