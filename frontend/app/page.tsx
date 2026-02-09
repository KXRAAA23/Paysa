import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScanLine, Split, TrendingUp, Users, ArrowRight, ShieldCheck, Zap } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans selection:bg-primary/20">
      <header className="px-6 lg:px-12 h-16 flex items-center border-b border-border/40 backdrop-blur-md sticky top-0 z-50 bg-background/80 supports-[backdrop-filter]:bg-background/60">
        <Link className="flex items-center justify-center gap-2 group" href="#">
          <div className="bg-primary/10 p-1.5 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Zap className="h-5 w-5 text-primary" fill="currentColor" />
          </div>
          <span className="font-bold text-xl tracking-tight text-foreground">Paysa</span>
        </Link>
        <nav className="ml-auto flex gap-6 sm:gap-8">
          <Link
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            href="/login"
          >
            Login
          </Link>
          <Link
            className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
            href="/register"
          >
            Register
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-20 md:py-32 lg:py-40 relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background opacity-40"></div>
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-8 text-center max-w-4xl mx-auto">
              <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary backdrop-blur-sm">
                <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse"></span>
                AI-Powered Expense Management
              </div>
              <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground/90 to-foreground/70">
                Split Bills, <br className="hidden sm:inline" /> Not Friendships.
              </h1>
              <p className="mx-auto max-w-[800px] text-muted-foreground md:text-xl lg:text-2xl leading-relaxed">
                Effortlessly scan receipts, split expenses, and track group spending with the power of AI.
                Experience financial harmony today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Link href="/login">
                  <Button size="lg" className="h-12 px-8 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all">
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="lg" className="h-12 px-8 text-base hover:bg-muted/50 transition-all">
                    Create Account
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="w-full py-20 md:py-32 bg-muted/30">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              <Card className="border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                    <ScanLine className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">AI Bill Scanner</CardTitle>
                  <CardDescription className="text-base">
                    Instantly scan receipts to extract items and prices automatically using advanced OCR.
                  </CardDescription>
                </CardHeader>
                <CardContent></CardContent>
              </Card>
              <Card className="border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-green-100 dark:bg-green-900/20 flex items-center justify-center mb-4 text-green-600 dark:text-green-400">
                    <Split className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Smart Splitting</CardTitle>
                  <CardDescription className="text-base">
                    Split expenses fairly among friends with customizable options by percentage or shares.
                  </CardDescription>
                </CardHeader>
                <CardContent></CardContent>
              </Card>
              <Card className="border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
                    <TrendingUp className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Financial Insights</CardTitle>
                  <CardDescription className="text-base">
                    Track your spending habits and get AI-driven insights to help you save more money.
                  </CardDescription>
                </CardHeader>
                <CardContent></CardContent>
              </Card>
              <Card className="border-none shadow-xl shadow-black/5 bg-card/50 backdrop-blur-sm hover:-translate-y-1 transition-transform duration-300">
                <CardHeader>
                  <div className="h-12 w-12 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center mb-4 text-orange-600 dark:text-orange-400">
                    <Users className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">Group Management</CardTitle>
                  <CardDescription className="text-base">
                    Easily manage shared costs for trips, roommates, or events in organized groups.
                  </CardDescription>
                </CardHeader>
                <CardContent></CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section className="w-full py-20 md:py-32 bg-background relative z-10">
          <div className="container px-4 md:px-6 mx-auto text-center">
            <h2 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl mb-6">Trusted by Smart Spenders</h2>
            <p className="mx-auto max-w-[700px] text-muted-foreground md:text-xl mb-12">
              Join thousands of users who have simplified their shared finances.
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
              {/* Placeholders for logos if needed */}
              <div className="flex items-center justify-center font-bold text-2xl">Acme Corp</div>
              <div className="flex items-center justify-center font-bold text-2xl">Globex</div>
              <div className="flex items-center justify-center font-bold text-2xl">Soylent</div>
              <div className="flex items-center justify-center font-bold text-2xl">Umbrella</div>
            </div>
          </div>
        </section>

      </main>
      <footer className="flex flex-col gap-4 sm:flex-row py-8 w-full shrink-0 items-center px-6 md:px-12 border-t border-border/40 bg-muted/10">
        <p className="text-sm text-muted-foreground">
          © 2024 Paysa. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-6 sm:gap-8">
          <Link className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="#">
            Terms of Service
          </Link>
          <Link className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="#">
            Privacy Policy
          </Link>
          <Link className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors" href="#">
            Contact
          </Link>
        </nav>
      </footer>
    </div>
  )
}
