"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScanLine, Split, TrendingUp, Users, ArrowRight, Zap } from "lucide-react"
import { ModeToggle } from "@/components/mode-toggle"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-foreground overflow-x-hidden selection:bg-primary/30">

      {/* Aurora Background */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        {/* Dark mode aurora */}
        <div className="hidden dark:block">
          <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] rounded-full blur-[130px] animate-blob"
            style={{ background: "hsl(270 80% 55% / 0.18)" }} />
          <div className="absolute top-[20%] right-[-10%] w-[500px] h-[500px] rounded-full blur-[110px] animate-blob animation-delay-2000"
            style={{ background: "hsl(220 80% 55% / 0.14)" }} />
          <div className="absolute bottom-[-10%] left-[20%] w-[700px] h-[700px] rounded-full blur-[150px] animate-blob animation-delay-4000"
            style={{ background: "hsl(328 75% 65% / 0.10)" }} />
        </div>
        {/* Light mode subtle aurora */}
        <div className="block dark:hidden">
          <div className="absolute top-[-10%] left-[-5%] w-[600px] h-[600px] rounded-full blur-[130px] animate-blob"
            style={{ background: "hsl(252 75% 58% / 0.08)" }} />
          <div className="absolute top-[30%] right-[-5%] w-[400px] h-[400px] rounded-full blur-[100px] animate-blob animation-delay-2000"
            style={{ background: "hsl(220 80% 55% / 0.06)" }} />
        </div>
      </div>

      {/* Header */}
      <header className="px-6 lg:px-12 h-18 flex items-center fixed top-0 w-full z-50 transition-all duration-300 backdrop-blur-md bg-background/70 border-b border-border/50">
        <Link className="flex items-center justify-center gap-2.5 group" href="#">
          <div className="bg-gradient-to-tr from-primary to-purple-400 p-2 rounded-xl shadow-lg shadow-primary/25 group-hover:scale-110 transition-transform">
            <Zap className="h-5 w-5 text-primary-foreground" fill="currentColor" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-foreground">Paysa</span>
        </Link>
        <nav className="ml-auto flex items-center gap-6">
          <Link
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            href="/login"
          >
            Login
          </Link>
          <Link href="/register">
            <Button size="sm" className="rounded-full px-5">
              Get Started
            </Button>
          </Link>
          <ModeToggle />
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center pt-36 pb-20">

        {/* Hero Section */}
        <section className="w-full max-w-5xl px-4 md:px-6 mx-auto flex flex-col items-center text-center space-y-10 relative z-10">

          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-md shadow-lg">
            <span className="flex h-2 w-2 rounded-full bg-primary mr-2 animate-pulse shadow-[0_0_10px_hsl(var(--primary)/0.8)]"></span>
            AI-Powered Expense Management
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tighter animate-in fade-in slide-in-from-bottom-5 duration-1000">
            <span className="text-foreground">Split Bills, </span>
            <br />
            <span className="text-gradient">Not Friendships.</span>
          </h1>

          <p className="max-w-[750px] text-muted-foreground md:text-xl lg:text-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000 delay-200">
            Effortlessly scan receipts, split expenses, and track group spending with the power of AI.
            Experience financial harmony today.
          </p>

          <div className="flex flex-col sm:flex-row gap-5 pt-2 animate-in fade-in slide-in-from-bottom-7 duration-1000 delay-300">
            <Link href="/login">
              <Button size="xl" className="rounded-full px-10 shadow-[0_0_30px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.5)] transition-shadow">
                Get Started <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="xl" className="rounded-full px-10 border-border/60 hover:border-primary/40 bg-card/50 backdrop-blur-sm transition-all">
                Create Account
              </Button>
            </Link>
          </div>

          {/* Dashboard Preview Card */}
          <div className="mt-16 w-full max-w-4xl perspective-[2000px]">
            <div className="relative rounded-2xl border border-border/50 bg-card/60 backdrop-blur-xl p-2 shadow-2xl transform rotate-x-12 hover:rotate-x-0 transition-transform duration-700 ease-out group">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/8 to-purple-500/5 rounded-2xl pointer-events-none" />
              <div className="rounded-xl overflow-hidden bg-background/80 aspect-[16/9] relative flex items-center justify-center border border-border/30">
                <img
                  src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&q=80&w=1600"
                  alt="Dashboard Preview"
                  className="w-full h-full object-cover opacity-70 dark:opacity-50 group-hover:opacity-90 dark:group-hover:opacity-70 transition-opacity duration-500"
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="bg-card/80 backdrop-blur-md border border-border/60 p-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4">
                    <ScanLine className="h-12 w-12 text-primary" />
                    <div className="text-xl font-bold text-gradient">Scanning Receipt...</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* Features Grid */}
        <section className="w-full max-w-7xl px-4 md:px-6 mx-auto mt-36">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight mb-4">Everything you need to split fairly</h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">Powerful features designed to make shared expenses stress-free.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: ScanLine, title: "AI Bill Scanner", desc: "Instantly scan receipts to extract items and prices automatically.", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10" },
              { icon: Split, title: "Smart Splitting", desc: "Split expenses fairly among friends with customizable options.", color: "text-green-500 dark:text-green-400", bg: "bg-green-500/10" },
              { icon: TrendingUp, title: "Financial Insights", desc: "Track your spending habits and get AI-driven recommendations.", color: "text-primary", bg: "bg-primary/10" },
              { icon: Users, title: "Group Management", desc: "Easily manage shared costs for trips, roommates, or events.", color: "text-orange-500 dark:text-orange-400", bg: "bg-orange-500/10" }
            ].map((feature, i) => (
              <Card key={i} className="border-border/60 bg-card/70 backdrop-blur-sm hover:bg-card transition-all duration-300 hover:-translate-y-2 hover:shadow-lg group">
                <CardHeader>
                  <div className={`h-12 w-12 rounded-xl ${feature.bg} flex items-center justify-center mb-3 ${feature.color} group-hover:scale-110 transition-transform duration-200`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-lg text-foreground">{feature.title}</CardTitle>
                  <CardDescription className="text-muted-foreground text-sm leading-relaxed">
                    {feature.desc}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </section>

        {/* Trusted by section */}
        <section className="w-full py-20 mt-20 border-t border-border/30">
          <div className="container px-4 text-center">
            <h2 className="text-xl font-semibold text-muted-foreground mb-8 uppercase tracking-widest text-sm">
              Trusted by Smart Spenders
            </h2>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-25">
              {["VISA", "STRIPE", "PAYPAL", "MASTERCARD"].map(brand => (
                <div key={brand} className="text-2xl font-bold text-foreground">{brand}</div>
              ))}
            </div>
          </div>
        </section>

      </main>

      <footer className="py-8 w-full border-t border-border/30 bg-card/30 backdrop-blur-md text-center">
        <p className="text-sm text-muted-foreground">
          © 2025 Paysa. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
