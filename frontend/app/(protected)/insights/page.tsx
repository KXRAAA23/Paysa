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
    Wallet,
    Sparkles
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
import AITipsCard from "@/components/AITipsCard"

const COLORS = [
    'hsl(252, 85%, 68%)', // Primary/Indigo
    'hsl(173, 80%, 40%)', // Teal
    'hsl(330, 80%, 65%)', // Pink
    'hsl(35, 90%, 60%)',  // Amber
    'hsl(140, 70%, 50%)', // Emerald
    'hsl(0, 80%, 65%)',   // Rose
];

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    if (percent < 0.05) return null;

    return (
        <text
            x={x}
            y={y}
            fill="white"
            textAnchor="middle"
            dominantBaseline="central"
            className="text-[11px] font-bold drop-shadow-md"
        >
            {`${(percent * 100).toFixed(0)}%`}
        </text>
    );
};

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

    // AI Tips State
    const [tips, setTips] = useState<any[]>([])

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

                const headers = { Authorization: `Bearer ${token}` };

                const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/groups/my-groups`, { headers })

                // Fetch Tips
                const tipsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/insights/tips`, { headers })
                if (tipsResponse.ok) {
                    const tipsData = await tipsResponse.json();
                    setTips(tipsData)
                }

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
            .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
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
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Insights</h1>
                    <p className="text-muted-foreground mt-1">Analyze your spending habits and financial health.</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <Calendar className="h-4 w-4" /> This Year
                    </Button>
                </div>
            </div>

            {/* AI Tips Section */}
            {tips.length > 0 && (
                <div className="space-y-4">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-semibold text-foreground">AI Financial Insights</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tips.map((tip, index) => (
                            <AITipsCard key={index} tip={tip} />
                        ))}
                    </div>
                </div>
            )}

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

            {/* Unified Charts Dashboard */}
            <div className="flex flex-col gap-6">
                {/* Monthly Trend - Full Width */}
                <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-lg transition-shadow hover:shadow-xl">
                    <CardHeader>
                        <CardTitle>Monthly Spending Trend</CardTitle>
                        <CardDescription>Your personal expense contributions over time</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={monthlyData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: "hsl(var(--card))", borderRadius: "12px", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))" }}
                                    itemStyle={{ color: "hsl(var(--foreground))" }}
                                />
                                <Line type="monotone" dataKey="uv" stroke="hsl(252, 85%, 68%)" strokeWidth={3} activeDot={{ r: 6 }} name="Spent" />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                {/* Categories & Groups - Side by Side on Large Screens */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Categories */}
                    <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-lg transition-shadow hover:shadow-xl flex flex-col">
                        <CardHeader>
                            <CardTitle>Spending by Category</CardTitle>
                            <CardDescription>Where your money goes</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px] flex items-center justify-center flex-1">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={100}
                                        fill="#8884d8"
                                        paddingAngle={5}
                                        dataKey="value"
                                        stroke="none"
                                        cornerRadius={8}
                                        labelLine={false}
                                        label={renderCustomizedLabel}
                                    >
                                        {categoryData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        contentStyle={{ backgroundColor: "var(--card)", borderRadius: "12px", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                        itemStyle={{ color: "var(--foreground)" }}
                                        formatter={(value: any) => [`₹${(Number(value) || 0).toFixed(0)}`, undefined]}
                                    />
                                </PieChart>
                            </ResponsiveContainer>
                        </CardContent>
                        <CardFooter className="flex-col gap-2 text-sm text-center text-muted-foreground pb-6">
                            <div className="grid grid-cols-2 gap-4 w-full max-w-md mx-auto">
                                {categoryData.slice(0, 4).map((cat, i) => (
                                    <div key={cat.name} className="flex justify-between items-center border-b border-border/50 pb-1">
                                        <span className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                            {cat.name}
                                        </span>
                                        <span className="font-semibold text-foreground">₹{cat.value.toFixed(0)}</span>
                                    </div>
                                ))}
                            </div>
                        </CardFooter>
                    </Card>

                    {/* Groups */}
                    <Card className="bg-card/60 backdrop-blur-xl border-border/50 shadow-lg transition-shadow hover:shadow-xl">
                        <CardHeader>
                            <CardTitle>Group vs Individual Spending</CardTitle>
                            <CardDescription>How much you contribute vs total group activity</CardDescription>
                        </CardHeader>
                        <CardContent className="h-[350px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={groupData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                                    <Tooltip
                                        cursor={{ fill: 'rgba(150, 150, 150, 0.1)' }}
                                        contentStyle={{ backgroundColor: "var(--card)", borderRadius: "12px", border: "1px solid var(--border)", color: "var(--foreground)" }}
                                        itemStyle={{ color: "var(--foreground)" }}
                                        formatter={(value: any) => [`₹${(Number(value) || 0).toFixed(0)}`, undefined]}
                                    />
                                    <Legend />
                                    <Bar dataKey="MySpend" name="My Share" fill="hsl(252, 85%, 68%)" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                    <Bar dataKey="TotalGroup" name="Total Group Spending" fill="#94a3b8" radius={[4, 4, 0, 0]} maxBarSize={50} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
