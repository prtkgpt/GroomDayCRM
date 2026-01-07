import Link from "next/link"
import { ArrowRight, Calendar, Users, DollarSign, MessageSquare, MapPin, Check, Scissors } from "lucide-react"
import { Button } from "@/components/ui/button"

const features = [
  {
    icon: Users,
    title: "Client & Pet Management",
    description: "Keep all your clients and their pets organized with detailed profiles, notes, and grooming preferences.",
  },
  {
    icon: Calendar,
    title: "Smart Scheduling",
    description: "Book appointments in under 30 seconds with our intuitive calendar and smart defaults.",
  },
  {
    icon: MessageSquare,
    title: "Automated Reminders",
    description: "Reduce no-shows with automatic email confirmations and reminders.",
  },
  {
    icon: DollarSign,
    title: "Simple Payments",
    description: "Track payments, tips, and outstanding balances at a glance.",
  },
  {
    icon: MapPin,
    title: "Mobile Groomer Friendly",
    description: "Built for mobile groomers with address management and Google Maps integration.",
  },
  {
    icon: Check,
    title: "Professional Templates",
    description: "Customizable message templates for confirmations, reminders, and more.",
  },
]

const benefits = [
  "Fast booking: Create appointments in under 30 seconds",
  "Mobile-first design: Works great on phones and tablets",
  "Beautiful client profiles with complete pet history",
  "Email confirmations and reminders to reduce no-shows",
  "Service catalog with flexible pricing",
  "Payment tracking with tip recording",
]

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
      {/* Header */}
      <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Scissors className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-primary">GroomDay</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link href="/signup">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
          The Simple CRM for
          <br />
          Dog Groomers
        </h1>
        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
          Book appointments faster, keep clients organized, and grow your grooming business.
          Built for mobile and independent groomers who value simplicity.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
          <Link href="/login">
            <Button variant="outline" size="lg" className="text-lg px-8">
              Log in
            </Button>
          </Link>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-20">
        <h2 className="text-3xl font-bold text-center mb-4">
          Everything You Need, Nothing You Don't
        </h2>
        <p className="text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
          We've built the 20% of features that deliver 80% of the value.
          No bloat, no complexity, just what works.
        </p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="p-6 rounded-xl border bg-card hover:shadow-lg transition-shadow"
            >
              <feature.icon className="h-10 w-10 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Benefits */}
      <section className="bg-primary/5 py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">
              Why Groomers Love GroomDay
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <Check className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                  <span>{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-20 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Simplify Your Business?</h2>
        <p className="text-muted-foreground mb-8">
          Join groomers who spend less time on admin and more time doing what they love.
        </p>
        <Link href="/signup">
          <Button size="lg" className="text-lg px-8">
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} GroomDay CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  )
}
