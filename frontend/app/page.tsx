import Link from "next/link"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { ScanLine, Split, TrendingUp, Users } from "lucide-react"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="px-4 lg:px-6 h-14 flex items-center border-b">
        <Link className="flex items-center justify-center" href="#">
          <span className="font-bold text-xl text-primary">Paysa</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/login"
          >
            Login
          </Link>
          <Link
            className="text-sm font-medium hover:underline underline-offset-4"
            href="/register"
          >
            Register
          </Link>
        </nav>
      </header>
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48 bg-gray-50">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Paysa – Expense Splitting Made Easy
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  AI-powered expense splitting, bill scanning, and spending
                  insights. Manage your group expenses effortlessly.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/login">
                  <Button size="lg" className="h-11 px-8">
                    Get Started
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="lg" className="h-11 px-8">
                    Sign Up
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 bg-white">
          <div className="container px-4 md:px-6 mx-auto">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <ScanLine className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>AI Bill Scanner</CardTitle>
                  <CardDescription>
                    Instantly scan receipts and bills to extract items and prices
                    automatically.
                  </CardDescription>
                </CardHeader>
                <CardContent></CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Split className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Smart Splitting</CardTitle>
                  <CardDescription>
                    Split expenses fairly among friends with customizable split
                    options.
                  </CardDescription>
                </CardHeader>
                <CardContent></CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <TrendingUp className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Spending Insights</CardTitle>
                  <CardDescription>
                    Track your spending habits and get insights to save more
                    money.
                  </CardDescription>
                </CardHeader>
                <CardContent></CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Group Management</CardTitle>
                  <CardDescription>
                    Create groups for trips, roommates, or events and manage
                    shared costs.
                  </CardDescription>
                </CardHeader>
                <CardContent></CardContent>
              </Card>
            </div>
          </div>
        </section>
      </main>
      <footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          © 2024 Paysa. All rights reserved.
        </p>
        <nav className="sm:ml-auto flex gap-4 sm:gap-6">
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Terms of Service
          </Link>
          <Link className="text-xs hover:underline underline-offset-4" href="#">
            Privacy
          </Link>
        </nav>
      </footer>
    </div>
  )
}
