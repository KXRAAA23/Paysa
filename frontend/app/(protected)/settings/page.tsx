"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import {
    Moon,
    Sun,
    Bell,
    Lock,
    Globe,
    Info,
    LogOut,
    Shield,
    Smartphone,
    Mail,
    ChevronRight,
    Monitor
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export default function SettingsPage() {
    const router = useRouter()

    // State
    const [theme, setTheme] = useState("system") // light, dark, system
    const [notifications, setNotifications] = useState({
        expenses: true,
        settlements: true,
        email: false
    })
    const [currency, setCurrency] = useState("INR")
    const [splitMethod, setSplitMethod] = useState("equal")

    // Determine initial theme on load
    useEffect(() => {
        const storedTheme = localStorage.getItem("theme")
        if (storedTheme) {
            setTheme(storedTheme)
        }

        // Fetch User Settings
        const fetchSettings = async () => {
            try {
                const token = localStorage.getItem("token")
                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/profile`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    if (data.notificationPreferences) {
                        setNotifications(data.notificationPreferences);
                    }
                }
            } catch (err) {
                console.error("Failed to fetch settings", err);
            }
        };

        fetchSettings();
    }, [])

    // Theme Handler
    const handleThemeChange = (newTheme: string) => {
        setTheme(newTheme)
        localStorage.setItem("theme", newTheme)

        // Apply theme
        const root = window.document.documentElement
        root.classList.remove("light", "dark")

        if (newTheme === "dark") {
            root.classList.add("dark")
        } else {
            root.classList.remove("dark")
        }
    }

    const handleLogout = () => {
        localStorage.removeItem("token")
        localStorage.removeItem("userId")
        router.push("/login")
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground mt-1">Manage your preferences and application settings.</p>
            </div>

            <Tabs defaultValue="appearance" className="space-y-6">
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
                    <TabsTrigger value="appearance" className="flex gap-2 py-3"><Monitor className="h-4 w-4" /> Appearance</TabsTrigger>
                    <TabsTrigger value="notifications" className="flex gap-2 py-3"><Bell className="h-4 w-4" /> Notifications</TabsTrigger>
                    <TabsTrigger value="security" className="flex gap-2 py-3"><Shield className="h-4 w-4" /> Security</TabsTrigger>
                    <TabsTrigger value="data" className="flex gap-2 py-3"><Globe className="h-4 w-4" /> Data</TabsTrigger>
                    <TabsTrigger value="about" className="flex gap-2 py-3"><Info className="h-4 w-4" /> About</TabsTrigger>
                </TabsList>

                {/* APPEARANCE */}
                <TabsContent value="appearance" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Theme Preferences</CardTitle>
                            <CardDescription>
                                Customize how Paysa looks on this device.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div
                                    className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center gap-2 hover:bg-muted transition-all ${theme === 'light' ? 'border-primary bg-primary/5' : 'border-muted'}`}
                                    onClick={() => handleThemeChange('light')}
                                >
                                    <div className="h-10 w-10 rounded-full bg-white border shadow-sm flex items-center justify-center">
                                        <Sun className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <span className="font-medium text-sm">Light</span>
                                </div>
                                <div
                                    className={`cursor-pointer rounded-lg border-2 p-4 flex flex-col items-center gap-2 hover:bg-muted transition-all ${theme === 'dark' ? 'border-primary bg-primary/5' : 'border-muted'}`}
                                    onClick={() => handleThemeChange('dark')}
                                >
                                    <div className="h-10 w-10 rounded-full bg-slate-950 border shadow-sm flex items-center justify-center">
                                        <Moon className="h-5 w-5 text-indigo-400" />
                                    </div>
                                    <span className="font-medium text-sm">Dark</span>
                                </div>

                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* NOTIFICATIONS */}
                <TabsContent value="notifications" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Settings</CardTitle>
                            <CardDescription>Control when you want to be alerted.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Expense Reminders</Label>
                                    <p className="text-sm text-muted-foreground">Get notified when you are added to an expense.</p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 text-primary rounded focus:ring-primary"
                                    checked={notifications.expenses}
                                    onChange={async (e) => {
                                        const newVal = e.target.checked;
                                        setNotifications(prev => ({ ...prev, expenses: newVal }));
                                        // Save to backend
                                        try {
                                            const token = localStorage.getItem("token");
                                            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/profile`, {
                                                method: 'PUT',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({ notificationPreferences: { ...notifications, expenses: newVal } })
                                            });
                                        } catch (err) {
                                            console.error("Failed to save settings", err);
                                        }
                                    }}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Settlement Alerts</Label>
                                    <p className="text-sm text-muted-foreground">Notify me when a debt is settled.</p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 text-primary rounded focus:ring-primary"
                                    checked={notifications.settlements}
                                    onChange={async (e) => {
                                        const newVal = e.target.checked;
                                        setNotifications(prev => ({ ...prev, settlements: newVal }));
                                        try {
                                            const token = localStorage.getItem("token");
                                            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/profile`, {
                                                method: 'PUT',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({ notificationPreferences: { ...notifications, settlements: newVal } })
                                            });
                                        } catch (err) {
                                            console.error("Failed to save settings", err);
                                        }
                                    }}
                                />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between">
                                <div className="space-y-0.5">
                                    <Label className="text-base">Email Notifications</Label>
                                    <p className="text-sm text-muted-foreground">Receive a weekly summary via email.</p>
                                </div>
                                <input
                                    type="checkbox"
                                    className="h-5 w-5 text-primary rounded focus:ring-primary"
                                    checked={notifications.email}
                                    onChange={async (e) => {
                                        const newVal = e.target.checked;
                                        setNotifications(prev => ({ ...prev, email: newVal }));
                                        try {
                                            const token = localStorage.getItem("token");
                                            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/profile`, {
                                                method: 'PUT',
                                                headers: {
                                                    'Content-Type': 'application/json',
                                                    'Authorization': `Bearer ${token}`
                                                },
                                                body: JSON.stringify({ notificationPreferences: { ...notifications, email: newVal } })
                                            });
                                        } catch (err) {
                                            console.error("Failed to save settings", err);
                                        }
                                    }}
                                />
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SECURITY */}
                <TabsContent value="security" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Privacy & Security</CardTitle>
                            <CardDescription>Manage your account security and sessions.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium">Change Password</h3>
                                <div className="grid gap-4">
                                    <div className="grid gap-2">
                                        <Label htmlFor="current">Current Password</Label>
                                        <Input id="current" type="password" />
                                    </div>
                                    <div className="grid gap-2">
                                        <Label htmlFor="new">New Password</Label>
                                        <Input id="new" type="password" />
                                    </div>
                                    <Button variant="outline" className="w-fit">Update Password</Button>
                                </div>
                            </div>
                            <Separator />
                            <div className="space-y-4">
                                <h3 className="text-sm font-medium text-red-600">Danger Zone</h3>
                                <div className="flex items-center justify-between bg-red-50 p-4 rounded-lg border border-red-100">
                                    <div>
                                        <p className="font-medium text-red-900">Sign out of all devices</p>
                                        <p className="text-sm text-red-700">This will require you to log in again on all devices.</p>
                                    </div>
                                    <Button variant="destructive" size="sm" onClick={handleLogout}>Log Out</Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* DATA */}
                <TabsContent value="data" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Data & Preferences</CardTitle>
                            <CardDescription>Set your default formatting options.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label>Default Currency</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        value={currency}
                                        onChange={e => setCurrency(e.target.value)}
                                    >
                                        <option value="INR">Indian Rupee (₹)</option>
                                        <option value="USD">US Dollar ($)</option>
                                        <option value="EUR">Euro (€)</option>
                                        <option value="GBP">British Pound (£)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Default Split Method</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                        value={splitMethod}
                                        onChange={e => setSplitMethod(e.target.value)}
                                    >
                                        <option value="equal">Share Equally</option>
                                        <option value="percentage">By Percentage</option>
                                        <option value="shares">By Shares</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label>Date Format</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                                    >
                                        <option value="DD/MM/YYYY">DD/MM/YYYY (31/01/2024)</option>
                                        <option value="MM/DD/YYYY">MM/DD/YYYY (01/31/2024)</option>
                                        <option value="YYYY-MM-DD">YYYY-MM-DD (2024-01-31)</option>
                                    </select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ABOUT */}
                <TabsContent value="about" className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>About Paysa</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex flex-col items-center text-center p-6 bg-muted/30 rounded-lg">
                                <div className="bg-primary/10 p-4 rounded-full mb-4">
                                    <Globe className="h-8 w-8 text-primary" />
                                </div>
                                <h2 className="text-xl font-bold">Paysa Web</h2>
                                <p className="text-muted-foreground">Version 1.2.0 (Beta)</p>
                            </div>

                            <div className="space-y-4">
                                <h3 className="font-medium">Credits</h3>
                                <p className="text-sm text-muted-foreground">
                                    Paysa is designed to simplify group expenses for everyone. Built with modern web technologies for performance and reliability.
                                </p>
                            </div>

                            <Separator />

                            <div className="flex gap-4">
                                <Button variant="outline" className="flex-1">Terms of Service</Button>
                                <Button variant="outline" className="flex-1">Privacy Policy</Button>
                            </div>
                        </CardContent>
                        <CardFooter className="justify-center text-xs text-muted-foreground">
                            © 2024 Paysa Inc. All rights reserved.
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
