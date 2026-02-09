"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
    CreditCard,
    Users,
    Wallet,
    Plus,
    Clock,
    UserPlus,
    UserMinus,
    CheckCircle2,
    Shield
} from "lucide-react"

import { formatDistanceToNow } from 'date-fns'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"

interface Group {
    _id: string
    name: string
    members: string[]
    balance?: number // We will mock this for now as backend doesn't calculate it yet
}

export default function DashboardPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({
        totalBalance: 0,
        activeGroups: 0,
        pendingSettlements: 0
    })
    const [groups, setGroups] = useState<Group[]>([])

    interface Activity {
        _id: string
        type: string
        description: string
        createdAt: string
        amount?: number
        groupName?: string
    }

    const [activities, setActivities] = useState<Activity[]>([])

    // Mock Recent Expenses (Keep empty or remove if fully replacing)
    // We will replace the Table with an Activity List


    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem("token")
                // Prioritize decoding from token to ensure accuracy
                let userId = null;
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        userId = payload.id;
                    } catch (e) {
                        console.error("Error decoding token:", e);
                    }
                }

                // Fallback to localStorage if token decode fails (though token presence suggests it should work)
                if (!userId) {
                    const storedId = localStorage.getItem("userId");
                    if (storedId && storedId !== "undefined") {
                        userId = storedId;
                    }
                }

                console.log("Dashboard: Calculated with UserId:", userId);

                if (!token || !userId) {
                    router.push("/login")
                    return
                }

                // Fetch Groups (which now includes populated expenses)
                const groupsRes = await fetch("http://localhost:5000/api/groups/my-groups", {
                    headers: { Authorization: `Bearer ${token}` },
                    cache: 'no-store'
                })


                if (groupsRes.ok) {
                    const groupsData: any[] = await groupsRes.json()

                    let calculatedTotalBalance = 0
                    let calculatedPendingSettlements = 0
                    let allExpenses: any[] = []

                    // Process each group
                    const processedGroups = groupsData.map(group => {
                        let groupBalance = 0

                        group.expenses?.forEach((exp: any) => {
                            // Defensive checks
                            if (!exp.paidBy || !exp.splits) return

                            const payerId = (exp.paidBy._id || exp.paidBy).toString()
                            const isPayer = payerId === userId

                            if (isPayer) {
                                // I Paid. Add up what OTHERS owe me (unsettled)
                                exp.splits.forEach((s: any) => {
                                    if (!s.user) return
                                    const sUserId = (s.user._id || s.user).toString()
                                    if (sUserId !== userId && !s.settled) {
                                        groupBalance += s.amount
                                        calculatedPendingSettlements++
                                    }
                                })
                            } else {
                                // I Borrowed. Subtract what I owe (unsettled)
                                const mySplit = exp.splits.find((s: any) => {
                                    if (!s.user) return false
                                    return (s.user._id || s.user).toString() === userId
                                })
                                if (mySplit && !mySplit.settled) {
                                    groupBalance -= mySplit.amount
                                    calculatedPendingSettlements++
                                }
                            }
                        })

                        calculatedTotalBalance += groupBalance

                        return {
                            ...group,
                            balance: parseFloat(groupBalance.toFixed(2))
                        }
                    })

                    setGroups(processedGroups)

                    setStats({
                        totalBalance: parseFloat(calculatedTotalBalance.toFixed(2)),
                        activeGroups: groupsData.length,
                        pendingSettlements: calculatedPendingSettlements
                    })
                }

                // Fetch Recent Activity (Expenses) directly
                const activityRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/expenses/user`, {
                    headers: { Authorization: `Bearer ${token}` }
                });

                if (activityRes.ok) {
                    const expenses = await activityRes.json();

                    const formattedActivities = expenses.slice(0, 10).map((exp: any) => ({
                        _id: exp._id,
                        type: 'EXPENSE',
                        description: `${exp.paidBy?.name || 'Someone'} added "${exp.title}" in ${exp.groupName}`,
                        createdAt: exp.createdAt,
                        amount: exp.totalAmount
                    }));
                    setActivities(formattedActivities);
                }


            } catch (error) {
                console.error("Dashboard fetch error:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [router])

    if (loading) {
        return <div className="flex justify-center items-center h-[50vh]">Loading Dashboard...</div>
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">
            {/* Quick Actions (Mobile) */}
            <div className="flex flex-wrap gap-4 md:hidden">
                <Button className="flex-1" size="lg" onClick={() => router.push('/groups')}><Plus className="mr-2 h-4 w-4" /> Add Expense</Button>
                <Button variant="outline" className="flex-1" size="lg" onClick={() => router.push('/groups')}>Create Group</Button>
            </div>

            {/* 1. Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="shadow-sm border-none bg-card hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Balance
                        </CardTitle>
                        <div className={`p-2 rounded-full ${stats.totalBalance < 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                            <Wallet className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-2xl font-bold ${stats.totalBalance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {stats.totalBalance < 0 ? '-' : '+'}₹{Math.abs(stats.totalBalance).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {stats.totalBalance === 0 ? "You're all settled up!" : stats.totalBalance < 0 ? "You owe money" : "You are owed money"}
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-none bg-card hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active Groups
                        </CardTitle>
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                            <Users className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.activeGroups}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Groups you are part of
                        </p>
                    </CardContent>
                </Card>

                <Card className="shadow-sm border-none bg-card hover:shadow-md transition-all">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Pending Settlements
                        </CardTitle>
                        <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                            <Clock className="h-4 w-4" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.pendingSettlements}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                            Unsettled transactions
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* 2. Group Overview & Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Groups Grid (Takes 2 cols) */}
                <div className="md:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-semibold tracking-tight">Your Groups</h2>
                        <Button variant="link" className="text-primary p-0 h-auto" onClick={() => router.push('/groups')}>View All</Button>
                    </div>

                    {groups.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {groups.slice(0, 4).map((group: any) => (
                                <Card key={group._id} className="group cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push(`/groups/${group._id}`)}>
                                    <CardHeader className="pb-3">
                                        <div className="flex justify-between items-start">
                                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                {group.name.charAt(0).toUpperCase()}
                                            </div>
                                            <Badge variant="secondary" className="font-normal">
                                                {group.members.length} members
                                            </Badge>
                                        </div>
                                        <CardTitle className="mt-3 text-base line-clamp-1">{group.name}</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className={`text-sm font-medium ${group.balance === 0 ? 'text-muted-foreground' : group.balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {group.balance === 0
                                                ? "Settled"
                                                : group.balance > 0
                                                    ? `Owed ₹${group.balance}`
                                                    : `You owe ₹${Math.abs(group.balance)}`
                                            }
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 border-2 border-dashed rounded-xl">
                            <p className="text-muted-foreground mb-4">You haven't joined any groups yet.</p>
                            <Button variant="outline" onClick={() => router.push('/groups')}>Find or Create a Group</Button>
                        </div>
                    )}
                </div>

                {/* Quick Actions (Takes 1 col) */}
                <div className="space-y-6">
                    <div className="bg-primary text-primary-foreground rounded-xl p-6 shadow-lg">
                        <h3 className="text-lg font-semibold mb-2">Quick Actions</h3>
                        <p className="text-primary-foreground/80 text-sm mb-6">Record a new expense or settle up debts.</p>
                        <div className="space-y-3">
                            <Button className="w-full bg-green-500 hover:bg-green-600 text-white" size="lg" onClick={() => router.push('/groups')}>
                                <Plus className="mr-2 h-4 w-4" /> Add New Expense
                            </Button>
                            <Button variant="secondary" className="w-full" onClick={() => router.push('/groups')}>
                                <Users className="mr-2 h-4 w-4" /> Create Group
                            </Button>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Recent Activity Feed (Dynamic) */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold tracking-tight">Recent Activity</h2>
                <Card>
                    <CardContent className="p-0">
                        {activities.length > 0 ? (
                            <div className="divide-y">
                                {activities.map((activity) => (
                                    <div key={activity._id} className="flex items-center p-4 hover:bg-muted/50 transition-colors">
                                        <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-4 
                                            ${activity.type === 'CREATE_GROUP' ? 'bg-blue-100 text-blue-600' :
                                                activity.type === 'INVITE_MEMBER' ? 'bg-purple-100 text-purple-600' :
                                                    activity.type === 'REMOVE_MEMBER' ? 'bg-red-100 text-red-600' : 'bg-muted text-muted-foreground'}`}>
                                            {activity.type === 'CREATE_GROUP' && <Plus className="h-5 w-5" />}
                                            {activity.type === 'INVITE_MEMBER' && <UserPlus className="h-5 w-5" />}
                                            {activity.type === 'REMOVE_MEMBER' && <UserMinus className="h-5 w-5" />}
                                            {activity.type === 'PROMOTE_MEMBER' && <Shield className="h-5 w-5" />}
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-foreground">{activity.description}</p>
                                            <p className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true })}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-8 text-center text-muted-foreground">
                                No recent activity. Create a group to get started!
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
