"use client"

import { useEffect, useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import {
    LayoutDashboard,
    Users,
    CreditCard,
    BarChart3,
    Settings,
    LogOut,
    Menu,
    X
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import SettlementReminderModal from "@/components/SettlementReminderModal"
import { ModeToggle } from "@/components/mode-toggle"

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    const [isReminderOpen, setIsReminderOpen] = useState(false)
    const [reminderData, setReminderData] = useState({ totalBalance: 0, pendingSettlements: 0 })

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            router.push("/login")
        } else {
            setLoading(false)
            checkSettlementStatus()
        }
    }, [router])

    const checkSettlementStatus = async () => {
        const hasSeen = sessionStorage.getItem('hasSeenSettlementReminder')
        if (hasSeen) return

        try {
            const token = localStorage.getItem('token')
            const profileRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/profile`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (profileRes.ok) {
                const profile = await profileRes.json()
                if (profile.notificationPreferences && profile.notificationPreferences.settlements === false) return
            }
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/expenses/balance`, {
                headers: { Authorization: `Bearer ${token}` }
            })
            if (res.ok) {
                const data = await res.json()
                if (data.totalBalance < 0 && data.pendingSettlements > 0) {
                    setReminderData(data)
                    setIsReminderOpen(true)
                    sessionStorage.setItem('hasSeenSettlementReminder', 'true')
                }
            }
        } catch (error) {
            console.error("Failed to fetch balance or profile for reminder", error)
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("token")
        sessionStorage.removeItem("hasSeenSettlementReminder")
        router.push("/login")
    }

    if (loading) return null

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/groups", label: "Groups", icon: Users },
        { href: "/expenses", label: "Expenses", icon: CreditCard },
        { href: "/insights", label: "Insights", icon: BarChart3 },
        { href: "/settings", label: "Settings", icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-background relative overflow-hidden font-sans text-foreground">

            {/* Aurora Background — Dark Mode Only */}
            <div className="pointer-events-none fixed inset-0 z-0 hidden dark:block overflow-hidden">
                <div className="absolute top-[-20%] left-[-15%] w-[700px] h-[700px] rounded-full blur-[130px] animate-blob"
                    style={{ background: "hsl(270 80% 55% / 0.12)" }} />
                <div className="absolute bottom-[-20%] right-[-15%] w-[700px] h-[700px] rounded-full blur-[130px] animate-blob animation-delay-2000"
                    style={{ background: "hsl(220 80% 55% / 0.1)" }} />
            </div>

            {/* Light mode subtle gradient */}
            <div className="pointer-events-none fixed inset-0 z-0 block dark:hidden"
                style={{ background: "radial-gradient(ellipse 80% 60% at 50% -10%, hsl(252 75% 58% / 0.06), transparent)" }} />

            <SettlementReminderModal
                isOpen={isReminderOpen}
                onClose={() => setIsReminderOpen(false)}
                data={reminderData}
            />

            {/* ─── Desktop Sidebar ─────────────────────── */}
            <aside className="hidden md:flex w-64 flex-col bg-sidebar border-r border-sidebar-border fixed inset-y-0 left-0 h-screen z-40 transition-colors duration-200">
                {/* Logo */}
                <div className="p-5 pb-4">
                    <Link href="/dashboard" className="flex items-center gap-3 group">
                        <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/30 group-hover:scale-105 transition-transform duration-200">
                            <CreditCard className="h-5 w-5 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-xl tracking-tight text-foreground">Paysa</span>
                    </Link>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 space-y-0.5">
                    <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">Navigation</p>
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href || (pathname.startsWith(item.href) && item.href !== '/dashboard')
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group ${isActive
                                    ? "bg-primary/10 text-primary dark:bg-primary/15 dark:text-primary"
                                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                    }`}
                            >
                                <Icon className={`h-[18px] w-[18px] shrink-0 ${isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
                                {item.label}
                                {isActive && (
                                    <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary" />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div className="p-3 mt-auto border-t border-sidebar-border">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-[18px] w-[18px] mr-3 shrink-0" />
                        Log Out
                    </Button>
                </div>
            </aside>

            {/* ─── Main Area ────────────────────────────── */}
            <div className="md:ml-64 flex flex-col min-w-0 min-h-screen relative z-10">

                {/* Mobile Header */}
                <header className="bg-background/90 backdrop-blur-md border-b border-border h-14 flex items-center justify-between px-4 sticky top-0 z-30 md:hidden">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-1.5 rounded-lg hover:bg-muted text-foreground transition-colors"
                        >
                            <Menu className="h-5 w-5" />
                        </button>
                        <div className="flex items-center gap-2">
                            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
                                <CreditCard className="h-3.5 w-3.5 text-primary-foreground" />
                            </div>
                            <span className="font-bold text-base text-foreground">Paysa</span>
                        </div>
                    </div>
                    <ModeToggle />
                </header>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 md:hidden">
                        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)} />
                        <div className="fixed inset-y-0 left-0 w-72 bg-sidebar border-r border-sidebar-border shadow-xl z-50 flex flex-col">
                            <div className="p-4 flex items-center justify-between border-b border-sidebar-border">
                                <div className="flex items-center gap-2">
                                    <div className="h-8 w-8 rounded-xl bg-primary flex items-center justify-center">
                                        <CreditCard className="h-4 w-4 text-primary-foreground" />
                                    </div>
                                    <span className="font-bold text-lg text-foreground">Paysa</span>
                                </div>
                                <button onClick={() => setIsMobileMenuOpen(false)}
                                    className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <nav className="space-y-0.5 flex-1 p-3">
                                {navItems.map((item) => {
                                    const isActive = pathname === item.href
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setIsMobileMenuOpen(false)}
                                            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                                ? "bg-primary/10 text-primary"
                                                : "text-muted-foreground hover:bg-accent hover:text-foreground"
                                                }`}
                                        >
                                            <item.icon className="h-4 w-4 shrink-0" />
                                            {item.label}
                                        </Link>
                                    )
                                })}
                            </nav>
                            <div className="p-3 border-t border-sidebar-border">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="h-4 w-4 mr-3" />
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Desktop Top Header */}
                <header className="hidden md:flex h-16 items-center justify-between px-8 sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50">
                    <div>
                        <h1 className="text-xl font-semibold text-foreground tracking-tight">
                            {navItems.find(i => pathname === i.href || (pathname.startsWith(i.href) && i.href !== '/dashboard'))?.label || "Dashboard"}
                        </h1>
                    </div>

                    <div className="flex items-center gap-3">
                        <ModeToggle />

                        <Link href="/profile"
                            className="flex items-center gap-2.5 p-1.5 pr-3 rounded-xl hover:bg-muted transition-colors border border-transparent hover:border-border">
                            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                                <AvatarImage src="" />
                                <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">ME</AvatarFallback>
                            </Avatar>
                            <div className="hidden lg:block text-left">
                                <p className="text-sm font-medium leading-none text-foreground">My Account</p>
                                <p className="text-[11px] text-muted-foreground mt-0.5">Manage Profile</p>
                            </div>
                        </Link>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-8 w-full max-w-7xl mx-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
