"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import {
    Search,
    Filter,
    ArrowUpDown,
    Calendar,
    Receipt,
    Utensils,
    Plane,
    ShoppingBag,
    Home,
    MoreHorizontal
} from "lucide-react"
import { format } from "date-fns"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Expense {
    _id: string
    title: string
    totalAmount: number
    category: string
    groupName: string
    paidBy: {
        _id: string
        name: string
        email: string
    } | null
    createdAt: string
    splits: any[]
}

const CATEGORY_ICONS: Record<string, any> = {
    Food: Utensils,
    Travel: Plane,
    Shopping: ShoppingBag,
    Home: Home,
    General: Receipt
}

export default function ExpensesPage() {
    const router = useRouter()
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [categoryFilter, setCategoryFilter] = useState("All")
    const [sortOrder, setSortOrder] = useState<"date" | "amount">("date")

    useEffect(() => {
        const fetchExpenses = async () => {
            try {
                const token = localStorage.getItem("token")

                // Correctly decode token to get userId, same as Dashboard
                let userId = null;
                if (token) {
                    try {
                        const payload = JSON.parse(atob(token.split('.')[1]));
                        userId = payload.id;
                    } catch (e) {
                        console.error("Error decoding token in Expenses:", e);
                    }
                }
                // Fallback
                if (!userId) {
                    userId = localStorage.getItem("userId");
                }

                // Store in state or just use for this scope? 
                // Better to refactor to use a context or hook, but for now set it in localStorage if missing or ensure we use this 'userId' var for the initial load if we were to filter here.
                // Actually, the issue is that the render cycle uses `localStorage.getItem("userId")` which might be stale or undefined if we don't ensure it's set.
                // Let's force a re-render or set a local state for userId.

                // For now, let's just make sure we save it to localStorage if we decoded it, so the render (which reads from localStorage) works?
                // No, that's race-condition prone.
                // BETTER: Add `currentUserId` to state.

                const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/expenses/user`, {
                    headers: { Authorization: `Bearer ${token}` }
                })
                if (res.ok) {
                    const data = await res.json()
                    setExpenses(data)
                }
            } catch (error) {
                console.error("Failed to fetch expenses", error)
            } finally {
                setLoading(false)
            }
        }
        fetchExpenses()
    }, [])

    // Helper to get safe user ID
    const getUserId = () => {
        if (typeof window === 'undefined') return null;
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                return payload.id;
            } catch (e) { return localStorage.getItem("userId"); }
        }
        return localStorage.getItem("userId");
    }
    const currentUserId = getUserId();

    // Filter & Sort
    const filteredExpenses = expenses
        .filter(exp => {
            const matchesSearch = exp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                exp.groupName.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = categoryFilter === "All" || exp.category === categoryFilter
            return matchesSearch && matchesCategory
        })
        .sort((a, b) => {
            if (sortOrder === "date") {
                return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            } else {
                return b.totalAmount - a.totalAmount
            }
        })

    const categories = ["All", ...Array.from(new Set(expenses.map(e => e.category)))]

    if (loading) return <div className="p-8 text-center text-muted-foreground">Loading expenses...</div>

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Expenses</h1>
                <p className="text-muted-foreground mt-1">View and manage all your group expenses.</p>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card p-4 rounded-lg border shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search expenses..."
                        className="pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                    {categories.map(cat => (
                        <Button
                            key={cat}
                            variant={categoryFilter === cat ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCategoryFilter(cat)}
                            className="whitespace-nowrap"
                        >
                            {cat}
                        </Button>
                    ))}
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSortOrder(prev => prev === "date" ? "amount" : "date")}
                        title="Sort by Date/Amount"
                    >
                        <ArrowUpDown className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Expenses List */}
            {filteredExpenses.length > 0 ? (
                <div className="grid gap-4">
                    {filteredExpenses.map((expense) => {
                        const Icon = CATEGORY_ICONS[expense.category] || Receipt
                        const userId = currentUserId;
                        const isPayer = expense.paidBy?._id === userId

                        // Calculate my share if not payer
                        const mySplit = expense.splits.find((s: any) => {
                            // Handle both populated object and direct ID string
                            const sUserId = (s.user?._id || s.user || '').toString();
                            return sUserId === userId;
                        })
                        const myShare = mySplit ? mySplit.amount : 0

                        return (
                            <Card key={expense._id} className="hover:shadow-md transition-shadow">
                                <CardContent className="p-4 flex flex-col md:flex-row items-start md:items-center gap-4">
                                    {/* Icon */}
                                    <div className={`p-3 rounded-full shrink-0 ${expense.category === 'Food' ? 'bg-orange-100 text-orange-600' :
                                        expense.category === 'Travel' ? 'bg-blue-100 text-blue-600' :
                                            'bg-slate-100 text-slate-600'
                                        }`}>
                                        <Icon className="h-5 w-5" />
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-base truncate">{expense.title}</h3>
                                            <Badge variant="outline" className="text-xs font-normal text-muted-foreground">
                                                {expense.category}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            <span className="font-medium text-foreground">{isPayer ? 'You' : expense.paidBy?.name || 'Unknown User'}</span> paid <span className="font-medium text-foreground">₹{expense.totalAmount}</span>
                                            <span className="mx-1">•</span>
                                            {format(new Date(expense.createdAt), "MMM d, yyyy")}
                                            <span className="mx-1">•</span>
                                            <span className="text-indigo-600 font-medium">{expense.groupName}</span>
                                        </p>
                                    </div>

                                    {/* Amount / Action */}
                                    <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end mt-2 md:mt-0">
                                        <div className="text-right">
                                            <p className="text-xs text-muted-foreground uppercase font-semibold">
                                                {isPayer ? 'You lent' : 'You borrowed'}
                                            </p>
                                            <p className={`text-lg font-bold ${isPayer ? 'text-green-600' : 'text-red-600'}`}>
                                                {isPayer ? `₹${(expense.totalAmount - myShare).toFixed(2)}` : `₹${myShare.toFixed(2)}`}
                                            </p>
                                        </div>
                                        {/* Actions Menu */}
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem onClick={() => router.push(`/groups/${expense._id}`)}> {/* Ideally navigate to group expense detail, usually group page modal */}
                                                    View Details
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </CardContent>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed rounded-xl bg-slate-50/50">
                    <Receipt className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold">No expenses found</h3>
                    <p className="text-muted-foreground max-w-sm mt-2">
                        {searchQuery || categoryFilter !== "All"
                            ? "Try adjusting your filters or search query."
                            : "You haven't been part of any expenses yet."}
                    </p>
                </div>
            )}
        </div>
    )
}
