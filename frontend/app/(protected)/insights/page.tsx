"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
    BarChart3,
    TrendingUp,
    PieChart as PieChartIcon,
    ArrowUpRight,
    ArrowDownRight,
    DollarSign,
    Calendar,
    Wallet
} from "lucide-react"
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    PieChart,
    Pie,
    Cell,
    BarChart,
    Bar
} from "recharts"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
    CardFooter
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function InsightsPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [groups, setGroups] = useState<any[]>([])
    const [userId, setUserId] = useState<string>("")

    // Analytics State
    const [totalSpent, setTotalSpent] = useState(0)
    const [monthlyData, setMonthlyData] = useState<any[]>([])
    const [categoryData, setCategoryData] = useState<any[]>([])
    const [groupData, setGroupData] = useState<any[]>([])

    // Derived Stats
    const [topCategory, setTopCategory] = useState({ name: "N/A", amount: 0 })
    const [avgTransaction, setAvgTransaction] = useState(0)

    useEffect(() => {
        const fetchInsights = async () => {
            try {
                const token = localStorage.getItem("token")
                let currentUserId = localStorage.getItem("userId")

                if (token && !currentUserId) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        currentUserId = payload.id;
                    } catch (e) {
                        console.error("Token decode failed", e)
                    }
                }

                if (!token || !currentUserId) {
                    router.push("/login")
                    return
                }
                setUserId(currentUserId)

                const response = await fetch("http://localhost:5000/api/groups/my-groups", {
                    headers: { Authorization: `Bearer ${token}` }
                })

                if (response.ok) {
                    const groupsData = await response.json()
                    setGroups(groupsData)
                    processData(groupsData, currentUserId)
                }
            } catch (error) {
                console.error("Failed to fetch insights", error)
            } finally {
                setLoading(false)
            }
        }

        fetchInsights()
    }, [router])

    const processData = (groups: any[], uid: string) => {
        let allExpenses: any[] = []
        let totalMySpend = 0
        let categoryMap: Record<string, number> = {}
        let monthlyMap: Record<string, number> = {}
        let groupMap: Record<string, { groupName: string, myShare: number, totalGroup: number }> = {}

        groups.forEach(group => {
            let groupTotal = 0
            let myGroupShare = 0

            group.expenses?.forEach((exp: any) => {
                // Safeguards
                if (!exp.splits || !exp.paidBy) return

                // 1. Identify My Share
                // If I paid, my share is my split (what I consumed)
                // If someone else paid, my share is my split (what I owe)
                // Basically always "my split amount" represents my consumption/cost? 
                // Wait, if I paid 100 split equally (50 me, 50 him). My cost is 50.
                // If he paid 100 split equally. My cost is 50.
                // So "Spent" = "My Split Amount".

                const mySplit = exp.splits.find((s: any) => s.user && (s.user._id || s.user).toString() === uid)

                if (mySplit) {
                    const amount = mySplit.amount
                    totalMySpend += amount
                    myGroupShare += amount

                    // Category
                    const cat = exp.category || "General"
                    categoryMap[cat] = (categoryMap[cat] || 0) + amount

                    // Monthly Trend
                    const date = new Date(exp.createdAt)
                    const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' }) // "Jan 2024"
                    monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + amount

                    allExpenses.push(exp)
                }
                groupTotal += exp.totalAmount
            })

            groupMap[group._id] = {
                groupName: group.name,
                myShare: myGroupShare,
                totalGroup: groupTotal
            }
        })

        // Finalize States
        setTotalSpent(totalMySpend)
        setAvgTransaction(allExpenses.length ? totalMySpend / allExpenses.length : 0)

        // Arrays for Charts
        const catArray = Object.entries(categoryMap)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
        setCategoryData(catArray)
        if (catArray.length > 0) setTopCategory({ name: catArray[0].name, amount: catArray[0].value })

        const monthArray = Object.entries(monthlyMap)
            .map(([name, uv]) => ({ name, uv }))
            // Sort by date (trickier with string keys, but simple implementation: just reverse if chronological?) 
            // Better to re-sort:
            .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()) // This won't work well on "Jan 2024". 
        // Simple assumption: Data is relatively recent. 
        // Logic fix: 
        setMonthlyData(monthArray)

        const grpArray = Object.values(groupMap)
            .map(g => ({ name: g.groupName, MySpend: g.myShare, TotalGroup: g.totalGroup }))
        setGroupData(grpArray)
    }

    if (loading) {
        return <div className="flex justify-center items-center h-[80vh] animate-pulse">Loading Analytics...</div>
    }

    return (
        <div className="space-y-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900">Insights</h1>
                    <p className="text-muted-foreground mt-1">Analyze your spending habits and financial health.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Calendar className="h-4 w-4" /> This Year
                    </Button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-none shadow-lg">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-indigo-100">Total Spent</CardDescription>
                        <CardTitle className="text-3xl font-bold">₹{totalSpent.toFixed(0)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-indigo-100 flex items-center gap-1">
                            <ArrowUpRight className="h-3 w-3" /> Lifetime
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Top Category</CardDescription>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            {topCategory.name}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            ₹{topCategory.amount.toFixed(0)} spent
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Avg. Per Transaction</CardDescription>
                        <CardTitle className="text-2xl font-bold">₹{avgTransaction.toFixed(0)}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            Based on your share
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardDescription>Active Groups</CardDescription>
                        <CardTitle className="text-2xl font-bold">{groups.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-xs text-muted-foreground">
                            Tracked communities
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Charts Section */}
            <Tabs defaultValue="overview" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="categories">Categories</TabsTrigger>
                    <TabsTrigger value="groups">Groups</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Monthly Trend */}
                        <Card className="col-span-1 lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Monthly Spending Trend</CardTitle>
                                <CardDescription>Your personal expense contributions over time</CardDescription>
                            </CardHeader>
                            <CardContent className="h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyData}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                        <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                        <Tooltip
                                            contentStyle={{ backgroundColor: "#F8FAFC", borderRadius: "8px", border: "1px solid #E2E8F0" }}
                                            itemStyle={{ color: "#0F172A", fontWeight: "bold" }}
                                        />
                                        <Line type="monotone" dataKey="uv" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 6 }} name="Spent" />
                                    </LineChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="categories" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Spending by Category</CardTitle>
                            <CardDescription>Where your money goes</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px] flex items-center justify-center">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={80}
                                        outerRadius={120}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                        <CardFooter className="flex-col gap-2 text-sm text-center text-muted-foreground">
                            <div className="grid grid-cols-2 gap-4 w-full max-w-md">
                                {categoryData.slice(0, 4).map((cat, i) => (
                                    <div key={cat.name} className="flex justify-between items-center border-b pb-1">
                                        <span className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            {cat.name}
                                        </span>
                                        <span className="font-semibold">₹{cat.value.toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>

                <TabsContent value="groups" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Group vs Individual Spending</CardTitle>
                            <CardDescription>How much you contribute vs total group activity</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[400px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={groupData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip cursor={{ fill: '#F1F5F9' }} />
                                    <Legend />
                                    <Bar dataKey="MySpend" name="My Share" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    <Bar dataKey="TotalGroup" name="Total Group Spending" fill="#e2e8f0" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
