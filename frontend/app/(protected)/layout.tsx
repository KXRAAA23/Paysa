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
    Menu
} from "lucide-react"

import { Button } from "@/components/ui/button"

// Since Sheet is complex without installation, I'll use a simple mobile menu state for now to avoid dependency hell if Sheet isn't present.
// Actually, I'll implement a custom Sidebar component directly in this layout to keep it self-contained if I don't want to build the full Sheet component tree yet.
// But requirements said "shadcn/ui", implies standard components.
// I will implement a responsive sidebar using standard Tailwind classes first.

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

import SettlementReminderModal from "@/components/SettlementReminderModal"

export default function ProtectedLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const router = useRouter()
    const pathname = usePathname()
    const [loading, setLoading] = useState(true)
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

    // Settlement Reminder State
    const [isReminderOpen, setIsReminderOpen] = useState(false);
    const [reminderData, setReminderData] = useState({ totalBalance: 0, pendingSettlements: 0 });

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (!token) {
            router.push("/login")
        } else {
            setLoading(false)
            checkSettlementStatus();
        }
    }, [router])

    const checkSettlementStatus = async () => {
        // defined check logic
        const hasSeen = sessionStorage.getItem('hasSeenSettlementReminder');
        if (hasSeen) return;

        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/expenses/balance`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (res.ok) {
                const data = await res.json();
                // Check if user OWES money (negative balance)
                if (data.totalBalance < 0 && data.pendingSettlements > 0) {
                    setReminderData(data);
                    setIsReminderOpen(true);
                    sessionStorage.setItem('hasSeenSettlementReminder', 'true');
                }
            }
        } catch (error) {
            console.error("Failed to fetch balance for reminder", error);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token")
        sessionStorage.removeItem("hasSeenSettlementReminder") // Clear session state on logout
        router.push("/login")
    }

    if (loading) {
        return null
    }

    const navItems = [
        { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
        { href: "/groups", label: "Groups", icon: Users },
        { href: "/expenses", label: "Expenses", icon: CreditCard },
        { href: "/insights", label: "Insights", icon: BarChart3 },
        { href: "/settings", label: "Settings", icon: Settings },
    ]

    return (
        <div className="min-h-screen bg-muted/40 flex">
            <SettlementReminderModal
                isOpen={isReminderOpen}
                onClose={() => setIsReminderOpen(false)}
                data={reminderData}
            />

            {/* Desktop Sidebar */}
            <aside className="hidden md:flex w-64 flex-col bg-background border-r h-screen sticky top-0">
                <div className="p-6">
                    <Link href="/dashboard" className="text-2xl font-bold text-primary flex items-center gap-2">
                        <div className="bg-primary/10 p-2 rounded-lg">
                            <CreditCard className="h-6 w-6 text-primary" />
                        </div>
                        Paysa
                    </Link>
                </div>

                <nav className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${isActive
                                    ? "bg-primary/10 text-primary"
                                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                                    }`}
                            >
                                <Icon className="h-5 w-5" />
                                {item.label}
                            </Link>
                        )
                    })}
                </nav>

                <div className="p-4 border-t">
                    <Button
                        variant="ghost"
                        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        onClick={handleLogout}
                    >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                    </Button>
                </div>
            </aside>

            {/* Mobile Header & Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                <header className="bg-background border-b h-16 flex items-center justify-between px-4 sticky top-0 z-30 md:hidden">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 -ml-2 rounded-md hover:bg-muted"
                        >
                            <Menu className="h-6 w-6" />
                        </button>
                        <span className="font-bold text-lg">Paysa</span>
                    </div>
                </header>

                {/* Mobile Menu Overlay */}
                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-40 md:hidden">
                        <div className="fixed inset-0 bg-black/50" onClick={() => setIsMobileMenuOpen(false)} />
                        <div className="fixed inset-y-0 left-0 w-64 bg-background shadow-xl z-50 flex flex-col p-4">
                            <div className="mb-6 flex justify-between items-center">
                                <span className="text-xl font-bold">Menu</span>
                                <button onClick={() => setIsMobileMenuOpen(false)} className="p-2"><Menu className="h-5 w-5" /></button>
                            </div>
                            <nav className="space-y-2 flex-1">
                                {navItems.map((item) => (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium ${pathname === item.href
                                            ? "bg-primary/10 text-primary"
                                            : "text-muted-foreground"
                                            }`}
                                    >
                                        <item.icon className="h-5 w-5" />
                                        {item.label}
                                    </Link>
                                ))}
                            </nav>
                            <div className="pt-4 border-t">
                                <Button
                                    variant="ghost"
                                    className="w-full justify-start text-red-500"
                                    onClick={handleLogout}
                                >
                                    <LogOut className="h-4 w-4 mr-2" />
                                    Logout
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Desktop Header (User Profile) */}
                <header className="hidden md:flex h-16 bg-background border-b items-center justify-between px-8 sticky top-0 z-20">
                    <h1 className="text-xl font-semibold text-foreground">
                        {navItems.find(i => i.href === pathname)?.label || "Dashboard"}
                    </h1>
                    <Link href="/profile" className="flex items-center gap-3 hover:bg-muted p-2 rounded-full transition-colors">
                        <div className="text-right hidden lg:block">
                            <p className="text-sm font-medium text-foreground">My Account</p>
                            <p className="text-xs text-muted-foreground">Manage Profile</p>
                        </div>
                        <Avatar>
                            <AvatarImage src="" /> {/* Placeholder or User Image */}
                            <AvatarFallback>ME</AvatarFallback>
                        </Avatar>
                    </Link>
                </header>

                <main className="flex-1 p-4 md:p-8 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    )
}
