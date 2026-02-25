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
              <Button size="xl" className="rounded-full px-10 relative group shadow-[0_0_30px_hsl(var(--primary)/0.35)] hover:shadow-[0_0_50px_hsl(var(--primary)/0.5)] transition-shadow">
                <span className="relative z-10 flex items-center">
                  Get Started <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full scale-110 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </Button>
            </Link>
            <Link href="/register">
              <Button variant="outline" size="xl" className="rounded-full px-10 border-border/60 hover:border-primary/40 bg-card/50 backdrop-blur-sm transition-all hover:bg-card/80">
                Create Account
              </Button>
            </Link>
          </div>

          {/* Dashboard Preview - Abstract Glowing Chart & Glassmorphism */}
          <div className="mt-16 w-full max-w-4xl animate-in fade-in zoom-in-95 duration-1000 delay-500">
            <div className="relative rounded-[2rem] border border-border/50 bg-card/10 backdrop-blur-3xl p-2 shadow-2xl hover:shadow-[0_20px_80px_-20px_hsl(var(--primary)/0.4)] transition-shadow duration-700">
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-purple-500/10 rounded-[2rem] pointer-events-none" />

              <div className="rounded-[1.5rem] overflow-hidden bg-background/40 aspect-[16/9] relative flex items-center justify-center border border-border/40 shadow-inner">
                {/* Background Grid */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:3rem_3rem] opacity-20" />

                {/* Animated Glowing Chart SVG */}
                <div className="absolute inset-x-0 bottom-0 top-[20%] w-full h-full overflow-hidden opacity-80 mix-blend-screen dark:mix-blend-plus-lighter">
                  <svg className="w-full h-full drop-shadow-[0_0_15px_hsl(var(--primary))]" viewBox="0 0 1000 400" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chart-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                      </linearGradient>
                      <filter id="glow">
                        <feGaussianBlur stdDeviation="8" result="coloredBlur" />
                        <feMerge>
                          <feMergeNode in="coloredBlur" />
                          <feMergeNode in="SourceGraphic" />
                        </feMerge>
                      </filter>
                    </defs>
                    <path
                      d="M0,400 L0,300 C100,300 150,150 250,200 C350,250 400,100 500,150 C600,200 650,50 750,100 C850,150 900,300 1000,200 L1000,400 Z"
                      fill="url(#chart-gradient)"
                      className="animate-[fade-in_2s_ease-out]"
                    />
                    <path
                      d="M0,300 C100,300 150,150 250,200 C350,250 400,100 500,150 C600,200 650,50 750,100 C850,150 900,300 1000,200"
                      fill="none"
                      stroke="hsl(var(--primary))"
                      strokeWidth="4"
                      filter="url(#glow)"
                      className="dash-draw"
                      style={{ strokeDasharray: 1500, strokeDashoffset: 1500, animation: 'dash 3s ease-out forwards 0.5s' }}
                    />
                    <circle cx="750" cy="100" r="8" fill="hsl(var(--background))" stroke="hsl(var(--primary))" strokeWidth="4" className="animate-in zoom-in duration-500 delay-[2500ms] fill-mode-both drop-shadow-[0_0_10px_hsl(var(--primary))]" />
                  </svg>
                  <style jsx>{`
                    @keyframes dash {
                      to {
                        stroke-dashoffset: 0;
                      }
                    }
                  `}</style>
                </div>

                {/* Central Glassmorphic Interface */}
                <div className="relative z-10 w-full max-w-lg bg-card/60 backdrop-blur-2xl border border-border/50 rounded-2xl p-6 shadow-2xl flex flex-col gap-6 transform hover:scale-[1.02] transition-transform duration-500">
                  <div className="flex flex-col items-center justify-between border-b border-border/50 pb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-lg shadow-primary/20">
                        <TrendingUp className="text-white w-5 h-5" />
                      </div>
                      <div>
                        <div className="font-bold text-lg text-foreground">Total Group Spend</div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wider">This Month</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-2xl text-foreground tracking-tight">₹4,250.75</div>
                      <div className="text-xs text-green-500 font-medium flex items-center justify-end gap-1">
                        <TrendingUp className="w-3 h-3" /> +12.5%
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                      <div className="text-muted-foreground text-xs font-semibold mb-1">Your Share</div>
                      <div className="text-foreground font-bold text-xl">₹850.15</div>
                      <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                        <div className="w-1/5 h-full bg-primary rounded-full shadow-[0_0_10px_hsl(var(--primary))]"></div>
                      </div>
                    </div>
                    <div className="bg-background/50 rounded-xl p-4 border border-border/30">
                      <div className="text-muted-foreground text-xs font-semibold mb-1">Owed to You</div>
                      <div className="text-foreground font-bold text-xl">₹320.50</div>
                      <div className="w-full h-1.5 bg-muted rounded-full mt-2 overflow-hidden">
                        <div className="w-1/3 h-full bg-green-500 rounded-full shadow-[0_0_10px_#22c55e]"></div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-4 border-t border-border/30">
                    <div className="flex -space-x-2">
                      <div className="w-8 h-8 rounded-full border-2 border-background saturate-150 bg-gradient-to-tr from-blue-400 to-blue-600" />
                      <div className="w-8 h-8 rounded-full border-2 border-background saturate-150 bg-gradient-to-tr from-emerald-400 to-emerald-600" />
                      <div className="w-8 h-8 rounded-full border-2 border-background saturate-150 bg-gradient-to-tr from-amber-400 to-amber-600" />
                      <div className="w-8 h-8 rounded-full border-2 border-background saturate-150 bg-muted flex items-center justify-center text-[10px] font-bold">+4</div>
                    </div>
                    <Button size="sm" className="rounded-full shadow-lg shadow-primary/20">Settle Up</Button>
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
