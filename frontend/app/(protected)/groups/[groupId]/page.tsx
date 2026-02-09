"use client"
import { UserX } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import {
    ArrowLeft,
    Settings,
    Users,
    Plus,
    Mail,
    AlertCircle,
    Copy,
    CheckCircle2,
    Shield,
    FileText,
    X,
    Eye,
    ChevronDown,
    ChevronUp,
    Wallet,
    Sparkles,
    Trash2,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { AdminActions } from "@/components/admin-actions"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Member {
    _id: string
    name: string
    email: string
    avatar?: string
    status?: "Joined" | "Invited"
    role?: "admin" | "member"
}

interface Split {
    user: { _id: string, name: string, email: string }
    amount: number
    settled: boolean
}

interface Expense {
    _id: string
    title: string
    totalAmount: number
    paidBy: { _id: string, name: string }
    splits: Split[]
    createdAt: string
    billUrl?: string
}

interface GroupDetails {
    _id: string
    name: string
    description?: string
    members: Member[]
    admins: string[]
    createdBy: string
    createdAt: string
}

export default function GroupDetailsPage({ params }: { params: Promise<{ groupId: string }> }) {
    const { groupId } = use(params)
    const router = useRouter()
    const [group, setGroup] = useState<GroupDetails | null>(null)
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [loading, setLoading] = useState(true)

    // Invite State
    const [inviteEmail, setInviteEmail] = useState("")
    const [showInviteSection, setShowInviteSection] = useState(false)
    const [isInviting, setIsInviting] = useState(false)

    // Expense State
    // Expense State
    const [showexpenseModal, setShowExpenseModal] = useState(false)
    const [newExpenseTitle, setNewExpenseTitle] = useState("")
    const [category, setCategory] = useState("General")
    const [newExpenseAmount, setNewExpenseAmount] = useState("")
    const [newExpensePaidBy, setNewExpensePaidBy] = useState("")
    const [splitType, setSplitType] = useState<"equal" | "custom">("equal")
    const [customSplits, setCustomSplits] = useState<Record<string, string>>({})
    const [billFile, setBillFile] = useState<File | null>(null)
    const [isCreatingExpense, setIsCreatingExpense] = useState(false)

    // AI Analysis State
    const [isAnalyzing, setIsAnalyzing] = useState(false)
    const [scannedItems, setScannedItems] = useState<{ name: string, amount: number | string, type: string }[]>([])
    const [showConfirmationModal, setShowConfirmationModal] = useState(false)
    const [confirmationData, setConfirmationData] = useState<any>(null)

    const [notification, setNotification] = useState<{ type: 'success' | 'error', text: string } | null>(null)
    const [currentUserId, setCurrentUserId] = useState<string>("")

    useEffect(() => {
        const token = localStorage.getItem("token")
        if (token) {
            try {
                const payload = JSON.parse(atob(token.split('.')[1]));
                setCurrentUserId(payload.id);
            } catch (e) {
                console.error("Invalid token", e);
            }
        }

        const fetchGroupDetails = async () => {
            try {
                if (!token) {
                    router.push("/login")
                    return
                }

                const [groupRes, expensesRes] = await Promise.all([
                    fetch(`http://localhost:5000/api/groups/${groupId}`, { headers: { Authorization: `Bearer ${token}` } }),
                    fetch(`http://localhost:5000/api/expenses/group/${groupId}`, { headers: { Authorization: `Bearer ${token}` } })
                ])

                if (groupRes.ok) {
                    const data = await groupRes.json()
                    setGroup(data)
                } else {
                    console.error("Failed to fetch group details")
                    if (groupRes.status === 404) router.push('/groups')
                }

                if (expensesRes.ok) {
                    setExpenses(await expensesRes.json())
                }
            } catch (error) {
                console.error("Error fetching group:", error)
            } finally {
                setLoading(false)
            }
        }

        fetchGroupDetails()
    }, [groupId, router])

    useEffect(() => {
        if (showexpenseModal) {
            setNewExpenseTitle("")
            setCategory("General")
            setNewExpenseAmount("")
            setNewExpensePaidBy("")
            setSplitType("equal")
            setCustomSplits({})
            setBillFile(null)
            setScannedItems([])
            setIsAnalyzing(false)
            setConfirmationData(null)
            setShowConfirmationModal(false)
        }
    }, [showexpenseModal])

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!inviteEmail) return

        setIsInviting(true)
        setNotification(null)

        // Optimistic UI Data
        const optimisticId = `temp-${Date.now()}`
        const optimisticMember: Member = {
            _id: optimisticId,
            name: inviteEmail.split('@')[0],
            email: inviteEmail,
            status: "Invited",
            avatar: ""
        }

        // 1. Add Optimistic "Invited" Member
        setGroup(prev => {
            if (!prev) return null
            return {
                ...prev,
                members: [...prev.members, optimisticMember]
            }
        })
        setInviteEmail("")

        try {
            const token = localStorage.getItem("token")
            const response = await fetch(`http://localhost:5000/api/groups/${groupId}/members`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ email: inviteEmail }),
            })

            const data = await response.json()

            if (response.ok) {
                setNotification({ type: 'success', text: `Invitation sent to ${inviteEmail}` })

                // 2. Update with Real Data
                setGroup(prev => {
                    if (!prev) return null
                    return {
                        ...prev,
                        members: prev.members.map(m =>
                            m._id === optimisticId ? { ...data, status: "Invited" } : m
                        )
                    }
                })

                // 3. Mock Acceptance: Switch to "Joined" after 3.5s
                setTimeout(() => {
                    setGroup(prev => {
                        if (!prev) return null
                        return {
                            ...prev,
                            members: prev.members.map(m =>
                                m.email === inviteEmail || m._id === data._id
                                    ? { ...m, status: "Joined" }
                                    : m
                            )
                        }
                    })
                    setNotification({ type: 'success', text: `${data.name} joined the group!` })
                }, 3500)

            } else {
                setNotification({ type: 'error', text: data.message || "Failed to add member" })
                // Revert optimistic add
                setGroup(prev => {
                    if (!prev) return null
                    return {
                        ...prev,
                        members: prev.members.filter(m => m._id !== optimisticId)
                    }
                })
            }
        } catch (error: any) {
            setNotification({ type: 'error', text: "Something went wrong" })
            // Revert optimistic add
            setGroup(prev => {
                if (!prev) return null
                return {
                    ...prev,
                    members: prev.members.filter(m => m._id !== optimisticId)
                }
            })
        } finally {
            setIsInviting(false)
            // Clear message after 5 seconds to allow reading "Joined" toast
            setTimeout(() => setNotification(null), 5000)
        }
    }

    const applyScanData = (data: any) => {
        setNewExpenseTitle(data.title || data.merchant || data.category || "Scanned Receipt")
        // Check for undefined or null, allow 0
        if (data.totalAmount !== undefined && data.totalAmount !== null) {
            setNewExpenseAmount(data.totalAmount.toString())
        }
        if (data.category) setCategory(data.category)
        if (data.items && data.items.length > 0) setScannedItems(data.items)
    }

    const handleScanReceipt = async (file: File) => {
        setIsAnalyzing(true)
        setNotification({ type: 'success', text: "Analyzing receipt... please wait" })
        setShowConfirmationModal(false)

        const formData = new FormData()
        formData.append('bill', file)

        try {
            const token = localStorage.getItem("token")
            const response = await fetch("http://localhost:5000/api/expenses/analyze", {
                method: "POST",
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            })

            const data = await response.json() // Always parse first

            if (response.ok) {
                if (data.requiresConfirmation) {
                    setConfirmationData(data)
                    setShowConfirmationModal(true)
                } else {
                    applyScanData(data)
                }
                setNotification({ type: 'success', text: "Receipt scanned successfully!" })
            } else {
                setNotification({ type: 'error', text: data?.message || "Could not analyze receipt" })
            }
        } catch (error) {
            console.error("Analysis error", error)
            setNotification({ type: 'error', text: "Analysis failed. Please try again." })
        } finally {
            setIsAnalyzing(false)
        }
    }

    const handleCreateExpense = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newExpenseTitle || !newExpenseAmount || !group) return

        setIsCreatingExpense(true)
        const optimisticId = `temp-exp-${Date.now()}`

        try {
            const amount = parseFloat(newExpenseAmount)
            const payerId = newExpensePaidBy || currentUserId

            // 1. Calculate Splits
            let splits: { user: string, amount: number }[] = []

            if (splitType === 'equal') {
                const splitAmount = amount / group.members.length
                splits = group.members.map(m => ({
                    user: m._id,
                    amount: splitAmount
                }))
            } else {
                // Custom Split Validation
                const totalCustom = Object.values(customSplits).reduce((sum, val) => sum + (parseFloat(val) || 0), 0)
                if (Math.abs(totalCustom - amount) > 0.05) {
                    setNotification({ type: 'error', text: `Splits total (₹${totalCustom}) must match expense amount (₹${amount})` })
                    setIsCreatingExpense(false)
                    return
                }
                splits = group.members.map(m => ({
                    user: m._id,
                    amount: parseFloat(customSplits[m._id] || "0")
                }))
            }

            // 2. Prepare Form Data
            const formData = new FormData()
            formData.append('groupId', group._id)
            formData.append('title', newExpenseTitle)
            formData.append('totalAmount', amount.toString())
            formData.append('category', category)
            formData.append('paidBy', payerId)
            formData.append('splits', JSON.stringify(splits))
            if (scannedItems.length > 0) {
                // Ensure amounts are numbers
                const processedItems = scannedItems.map(item => ({
                    ...item,
                    amount: typeof item.amount === 'string' ? parseFloat(item.amount) || 0 : item.amount
                }))
                formData.append('items', JSON.stringify(processedItems))
            }
            if (billFile) {
                formData.append('bill', billFile)
            }

            // 3. Optimistic Update
            // We need a full Expense object.
            // Payer Name lookup
            const payerName = group.members.find(m => m._id === payerId)?.name || 'Someone'

            const optimisticExpense: Expense = {
                _id: optimisticId,
                title: newExpenseTitle,
                totalAmount: amount,
                paidBy: { _id: payerId, name: payerName },
                splits: splits.map(s => {
                    const m = group.members.find(mem => mem._id === s.user)
                    return { user: { _id: s.user, name: m?.name || 'User', email: m?.email || '' }, amount: s.amount, settled: false }
                }),
                createdAt: new Date().toISOString(),
                billUrl: billFile ? URL.createObjectURL(billFile) : undefined
            }

            setExpenses(prev => [optimisticExpense, ...prev])
            setShowExpenseModal(false)

            const token = localStorage.getItem("token")
            const response = await fetch("http://localhost:5000/api/expenses", {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${token}`, // Content-Type header excluded for FormData
                },
                body: formData,
            })

            if (response.ok) {
                const newExpData = await response.json()
                setExpenses(prev => prev.map(e => e._id === optimisticId ? newExpData : e))
                setNotification({ type: 'success', text: "Expense added!" })
                // Reset Form
                setNewExpenseTitle("")
                setCategory("General")
                setNewExpenseAmount("")
                setSplitType("equal")
                setCustomSplits({})
                setBillFile(null)
                setNewExpensePaidBy("")
                setScannedItems([])
            } else {
                const errData = await response.json()
                setNotification({ type: 'error', text: errData.message || "Failed to add expense" })
                setExpenses(prev => prev.filter(e => e._id !== optimisticId)) // Revert
            }
        } catch (error) {
            console.error(error)
            setNotification({ type: 'error', text: "Error adding expense" })
            setExpenses(prev => prev.filter(e => e._id !== optimisticId))
        } finally {
            setIsCreatingExpense(false)
        }
    }

    const [expandedExpenseId, setExpandedExpenseId] = useState<string | null>(null)

    const handleSettle = async (expenseId: string, userId?: string) => {
        const targetUser = userId || currentUserId

        // Optimistic Update
        setExpenses(prev => prev.map(exp => {
            if (exp._id === expenseId) {
                return {
                    ...exp,
                    splits: exp.splits.map(s =>
                        s.user._id === targetUser ? { ...s, settled: true } : s
                    )
                }
            }
            return exp
        }))

        try {
            const token = localStorage.getItem("token")
            const res = await fetch(`http://localhost:5000/api/expenses/${expenseId}/settle`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ userId: targetUser, groupId: group?._id })
            })

            if (res.ok) {
                setNotification({ type: 'success', text: "Settlement recorded!" })
                const expensesRes = await fetch(`http://localhost:5000/api/expenses/group/${groupId}`, { headers: { Authorization: `Bearer ${token}` } })
                if (expensesRes.ok) setExpenses(await expensesRes.json())
            } else {
                setNotification({ type: 'error', text: "Failed to settle" })
                const expensesRes = await fetch(`http://localhost:5000/api/expenses/group/${groupId}`, { headers: { Authorization: `Bearer ${token}` } })
                if (expensesRes.ok) setExpenses(await expensesRes.json())
            }
        } catch (error) {
            console.error(error)
            setNotification({ type: 'error', text: "Error settling expense" })
        }
    }

    // Calculate Balance (Outstanding)
    // Calculate Balance (Outstanding)
    let youOwe = 0
    let owedToYou = 0

    expenses.forEach(exp => {
        const isPayer = exp.paidBy?._id === currentUserId || exp.paidBy?.name === 'You'
        if (isPayer) {
            // I paid, so add up what others owe me (unsettled)
            exp.splits.forEach(s => {
                if (s.user?._id !== currentUserId && !s.settled) {
                    owedToYou += s.amount
                }
            })
        } else {
            // I didn't pay, so add what I owe (unsettled)
            const mySplit = exp.splits.find(s => s.user?._id === currentUserId)
            if (mySplit && !mySplit.settled) {
                youOwe += mySplit.amount
            }
        }
    })

    if (loading) {
        return <div className="flex justify-center items-center h-[50vh]">Loading Group Details...</div>
    }

    if (!group) {
        return <div className="text-center py-10">Group not found</div>
    }

    const isAdmin = currentUserId === group.createdBy

    return (
        <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
            {/* Header / Nav */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-2">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.push('/groups')}>
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <h1 className="text-2xl font-bold flex items-center gap-3">
                            {group.name}
                            <Badge variant="outline" className="font-normal text-sm">
                                {group.members.length} members
                            </Badge>
                        </h1>
                        <p className="text-muted-foreground">{group.description || "No description provided."}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {isAdmin && (
                        <Button variant="outline" size="icon">
                            <Settings className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Feedback Toast */}
            {notification && (
                <div className={`p-4 rounded-lg shadow-sm border animate-in fade-in slide-in-from-top-4 fixed top-4 right-4 z-50 flex items-center gap-3 ${notification.type === 'success' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-red-50 border-red-200 text-red-800'
                    }`}>
                    {notification.type === 'success' ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
                    <p className="text-sm font-medium">{notification.text}</p>
                </div>
            )}

            <Tabs defaultValue="expenses" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
                    <TabsTrigger value="expenses">Expenses</TabsTrigger>
                    <TabsTrigger value="members">Members</TabsTrigger>
                </TabsList>

                <TabsContent value="expenses" className="space-y-6">
                    {/* Balance Card */}
                    <Card className="bg-gradient-to-br from-slate-50 to-white border-slate-200">
                        <CardHeader>
                            <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Your Position</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col gap-2">
                                {owedToYou > 0 && (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-green-600">
                                            +₹{owedToYou.toFixed(2)}
                                        </span>
                                        <span className="text-muted-foreground font-medium">
                                            owed to you
                                        </span>
                                    </div>
                                )}
                                {youOwe > 0 && (
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-2xl font-bold text-red-600">
                                            -₹{youOwe.toFixed(2)}
                                        </span>
                                        <span className="text-muted-foreground font-medium">
                                            you owe
                                        </span>
                                    </div>
                                )}
                                {owedToYou === 0 && youOwe === 0 && (
                                    <div className="text-slate-500 font-medium">
                                        All settled up!
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Expenses List */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Transactions</CardTitle>
                                <CardDescription>All shared expenses in this group</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => setShowExpenseModal(true)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Expense
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {expenses.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in zoom-in-95 duration-500 border-2 border-dashed rounded-xl bg-slate-50/50">
                                    <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                        <Wallet className="h-8 w-8 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">No expenses yet</h3>
                                    <p className="text-slate-500 text-sm max-w-xs mb-6">
                                        Add an expense to start tracking balances with your group.
                                    </p>
                                    <Button onClick={() => setShowExpenseModal(true)} variant="outline" className="gap-2">
                                        <Plus className="h-4 w-4" /> Add First Expense
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {expenses.map((exp) => {
                                        const isPayer = exp.paidBy?._id === currentUserId || exp.paidBy?.name === 'You'
                                        const mySplit = exp.splits.find(s => s.user?._id === currentUserId || s.user?.name === 'You')
                                        const isExpanded = expandedExpenseId === exp._id

                                        let splitSummary = "Not involved"
                                        let splitColor = "text-muted-foreground"

                                        if (isPayer) {
                                            const pendingAmount = exp.splits.reduce((acc, s) => {
                                                if (s.user?._id !== currentUserId && !s.settled) return acc + s.amount
                                                return acc
                                            }, 0)
                                            // Show what is owed to me
                                            splitSummary = pendingAmount > 0
                                                ? `You are owed ₹${pendingAmount.toFixed(2)}`
                                                : "All settled"
                                            splitColor = pendingAmount > 0 ? "text-green-600" : "text-slate-500"
                                        } else if (mySplit) {
                                            if (mySplit.settled) {
                                                splitSummary = "Settled"
                                                splitColor = "text-slate-500"
                                            } else {
                                                splitSummary = `You owe ₹${mySplit.amount.toFixed(2)}`
                                                splitColor = "text-red-600"
                                            }
                                        }

                                        return (
                                            <div key={exp._id} className="border rounded-lg bg-card overflow-hidden group transition-all hover:bg-slate-50/50">
                                                <div
                                                    className="flex items-center justify-between p-4 cursor-pointer"
                                                    onClick={() => setExpandedExpenseId(isExpanded ? null : exp._id)}
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                                                                {exp.title.charAt(0).toUpperCase()}
                                                            </div>
                                                            {exp.billUrl && (
                                                                <a
                                                                    href={`http://localhost:5000/${exp.billUrl}`}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border hover:bg-slate-50 transition-colors cursor-pointer block"
                                                                    title="View Receipt"
                                                                    onClick={(e) => e.stopPropagation()}
                                                                >
                                                                    <FileText className="h-3 w-3 text-blue-600" />
                                                                </a>
                                                            )}
                                                        </div>

                                                        <div>
                                                            <p className="font-medium text-slate-900 line-clamp-1">{exp.title}</p>
                                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                                {isPayer ? 'You' : (exp.paidBy?.name || 'Unknown')} paid <span className="font-medium text-slate-700">₹{exp.totalAmount}</span>
                                                            </p>
                                                            <p className="text-xs text-muted-foreground">
                                                                {new Date(exp.createdAt).toLocaleDateString()}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-4 text-right">
                                                        <div>
                                                            <p className={`text-sm font-semibold ${splitColor}`}>
                                                                {splitSummary}
                                                            </p>
                                                        </div>
                                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                                                    </div>
                                                </div>

                                                {/* Expanded Details */}
                                                {isExpanded && (
                                                    <div className="px-4 pb-4 pt-0 animate-in slide-in-from-top-2 duration-200">
                                                        <div className="border-t pt-3 space-y-2">
                                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Split Details</p>
                                                            {exp.splits.map(split => {
                                                                const isMe = split.user?._id === currentUserId

                                                                return (
                                                                    <div key={split.user?._id || Math.random()} className="flex items-center justify-between text-sm p-2 rounded hover:bg-slate-100/50">
                                                                        <div className="flex items-center gap-2">
                                                                            <Avatar className="h-6 w-6">
                                                                                <AvatarFallback>{split.user?.name?.charAt(0) || '?'}</AvatarFallback>
                                                                            </Avatar>
                                                                            <span className={isMe ? "font-medium" : ""}>
                                                                                {isMe ? "You" : (split.user?.name || "Unknown User")}
                                                                            </span>
                                                                        </div>
                                                                        <div className="flex items-center gap-3">
                                                                            <span className="text-slate-600">₹{split.amount.toFixed(2)}</span>

                                                                            {split.settled ? (
                                                                                <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100">
                                                                                    Settled
                                                                                </Badge>
                                                                            ) : (
                                                                                <>
                                                                                    {isMe && !isPayer && (
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="outline"
                                                                                            className="h-7 text-xs border-green-200 hover:bg-green-50 text-green-700"
                                                                                            onClick={() => handleSettle(exp._id)}
                                                                                        >
                                                                                            Mark Paid
                                                                                        </Button>
                                                                                    )}
                                                                                    {isPayer && !isMe && (
                                                                                        <Button
                                                                                            size="sm"
                                                                                            variant="outline"
                                                                                            className="h-7 text-xs border-blue-200 hover:bg-blue-50 text-blue-700"
                                                                                            onClick={() => handleSettle(exp._id, split.user?._id)}
                                                                                        >
                                                                                            Mark Received
                                                                                        </Button>
                                                                                    )}
                                                                                    {!isMe && !isPayer && (
                                                                                        <Badge variant="outline" className="text-slate-500">Pending</Badge>
                                                                                    )}
                                                                                </>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                )
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="members" className="space-y-6">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle>Members</CardTitle>
                                <CardDescription>Manage who is in this group</CardDescription>
                            </div>
                            <Button size="sm" onClick={() => setShowInviteSection(!showInviteSection)}>
                                <Plus className="h-4 w-4 mr-2" />
                                Add Member
                            </Button>
                        </CardHeader>

                        {/* Invite Section */}
                        {showInviteSection && (
                            <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-200">
                                <div className="bg-muted/50 p-4 rounded-lg border">
                                    <h4 className="text-sm font-medium mb-3 flex items-center gap-2">
                                        <Mail className="h-4 w-4" /> Add by Email
                                    </h4>
                                    <form onSubmit={handleInvite} className="flex gap-2">
                                        <Input
                                            placeholder="Enter email address"
                                            value={inviteEmail}
                                            onChange={(e) => setInviteEmail(e.target.value)}
                                            type="email"
                                            required
                                            className="bg-background"
                                        />
                                        <Button type="submit" disabled={isInviting}>
                                            {isInviting ? "Adding..." : "Add"}
                                        </Button>
                                    </form>
                                    <p className="text-xs text-muted-foreground mt-2">
                                        User must have a registered Paysa account to be added.
                                    </p>
                                </div>
                            </div>
                        )}

                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="pl-6">Member</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead className="text-right pr-6">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {group.members.map((member) => {
                                        const isCreator = member._id === group.createdBy
                                        const isAdminMember = group.admins?.includes(member._id) || isCreator
                                        const status = member.status || "Joined"
                                        const role = isAdminMember ? "Admin" : "Member"

                                        const handlePromote = async (id: string) => {
                                            try {
                                                const token = localStorage.getItem("token")
                                                await fetch(`http://localhost:5000/api/groups/${groupId}/members/${id}`, {
                                                    method: "PUT",
                                                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                                    body: JSON.stringify({ role: "admin" })
                                                })
                                                // Refresh data or update local state
                                                setGroup(prev => prev ? ({ ...prev, admins: [...prev.admins, id] }) : null)
                                                setNotification({ type: 'success', text: "Member promoted to Admin" })
                                            } catch (e) { console.error(e) }
                                        }

                                        const handleDemote = async (id: string) => {
                                            try {
                                                const token = localStorage.getItem("token")
                                                await fetch(`http://localhost:5000/api/groups/${groupId}/members/${id}`, {
                                                    method: "PUT",
                                                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                                    body: JSON.stringify({ role: "member" })
                                                })
                                                setGroup(prev => prev ? ({ ...prev, admins: prev.admins.filter(a => a !== id) }) : null)
                                                setNotification({ type: 'success', text: "Admin demoted to Member" })
                                            } catch (e) { console.error(e) }
                                        }

                                        const handleRemove = async (id: string) => {
                                            try {
                                                const token = localStorage.getItem("token")
                                                const res = await fetch(`http://localhost:5000/api/groups/${groupId}/members/${id}`, {
                                                    method: "DELETE",
                                                    headers: { Authorization: `Bearer ${token}` },
                                                })
                                                if (res.ok) {
                                                    setGroup(prev => prev ? ({ ...prev, members: prev.members.filter(m => m._id !== id), admins: prev.admins.filter(a => a !== id) }) : null)
                                                    setNotification({ type: 'success', text: "Member removed" })
                                                }
                                            } catch (e) { console.error(e) }
                                        }


                                        const viewerIsAdmin = group.admins?.includes(currentUserId) || group.createdBy === currentUserId

                                        return (
                                            <TableRow key={member._id}>
                                                <TableCell className="pl-6 font-medium">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarImage src={member.avatar} />
                                                            <AvatarFallback>{member.name.charAt(0).toUpperCase()}</AvatarFallback>
                                                        </Avatar>
                                                        {member.name} {member._id === currentUserId && "(You)"}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-muted-foreground">{member.email}</TableCell>
                                                <TableCell>
                                                    <Badge variant={role === "Admin" ? "default" : "secondary"} className="hover:bg-primary/80">
                                                        {role}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-right pr-6">
                                                    <div className="flex items-center justify-end gap-2">
                                                        {status === "Joined" ? (
                                                            <span className="inline-flex items-center text-green-600 text-xs font-medium bg-green-50 px-2 py-1 rounded-full border border-green-200">
                                                                <CheckCircle2 className="h-3 w-3 mr-1" /> Joined
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center text-slate-500 text-xs font-medium bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                                                                <Mail className="h-3 w-3 mr-1" /> Invited
                                                            </span>
                                                        )}

                                                        {viewerIsAdmin && member._id !== currentUserId && (
                                                            <AdminActions
                                                                memberId={member._id}
                                                                memberName={member.name}
                                                                currentRole={role}
                                                                isCreator={isCreator}
                                                                onPromote={handlePromote}
                                                                onDemote={handleDemote}
                                                                onRemove={handleRemove}
                                                            />
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        )
                                    })}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Add Expense Modal */}
            {showexpenseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
                    {/* ... existing modal code ... */}
                    <Card className="w-full max-w-lg bg-white shadow-2xl my-8">
                        <CardHeader>
                            <CardTitle>Add New Expense</CardTitle>
                            <CardDescription>Enter details and split method</CardDescription>
                        </CardHeader>
                        <div className="px-6 pb-2">
                            {/* ... scan area ... */}
                            <div className="flex items-center gap-2 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                                <Sparkles className="h-5 w-5 text-indigo-600" />
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-indigo-900">Have a receipt?</p>
                                    <p className="text-xs text-indigo-700">Scan it to auto-fill details.</p>
                                </div>
                                <div className="relative">
                                    <Button type="button" size="sm" variant="secondary" className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200" disabled={isAnalyzing}>
                                        {isAnalyzing ? "Scanning..." : "Scan Receipt"}
                                    </Button>
                                    <Input
                                        type="file"
                                        accept="image/*"
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                        onChange={(e) => {
                                            const file = e.target.files?.[0]
                                            if (file) handleScanReceipt(file)
                                        }}
                                        disabled={isAnalyzing}
                                    />
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleCreateExpense}>
                            <CardContent className="space-y-4 max-h-[70vh] overflow-y-auto">
                                {/* Category & Title Row */}
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="space-y-2 col-span-1">
                                        <Label>Category</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                                            value={category}
                                            onChange={e => setCategory(e.target.value)}
                                        >
                                            <option value="General">General</option>
                                            <option value="Food">Food</option>
                                            <option value="Travel">Travel</option>
                                            <option value="Entertainment">Entertainment</option>
                                            <option value="Rent">Rent</option>
                                            <option value="Utilities">Utilities</option>
                                            <option value="Shopping">Shopping</option>
                                            <option value="Health">Health</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2 col-span-2">
                                        <Label>Title</Label>

                                        <Input
                                            placeholder="e.g. Flight tickets"
                                            value={newExpenseTitle}
                                            onChange={e => setNewExpenseTitle(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Amount */}
                                    <div className="space-y-2">
                                        <Label>Total Amount (₹)</Label>
                                        <Input
                                            type="number"
                                            placeholder="0.00"
                                            value={newExpenseAmount}
                                            onChange={e => setNewExpenseAmount(e.target.value)}
                                            required
                                            min="1"
                                        />
                                    </div>

                                    {/* Paid By */}
                                    <div className="space-y-2">
                                        <Label>Paid By</Label>
                                        <select
                                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                            value={newExpensePaidBy}
                                            onChange={e => setNewExpensePaidBy(e.target.value)}
                                        >
                                            <option value={currentUserId}>You</option>
                                            {group?.members.filter(m => m._id !== currentUserId).map(m => (
                                                <option key={m._id} value={m._id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Scanned Items Breakdown (Editable) */}
                                {scannedItems.length > 0 && (
                                    <div className="space-y-3 animate-in slide-in-from-top-2">
                                        <div className="flex items-center justify-between">
                                            <Label>Item Breakdown</Label>
                                            <div className="flex gap-2">
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => setScannedItems([...scannedItems, { name: "", amount: 0, type: "Food" }])}
                                                >
                                                    <Plus className="h-3 w-3 mr-1" /> Add Item
                                                </Button>
                                                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground" onClick={() => setScannedItems([])}>Clear All</Button>
                                            </div>
                                        </div>
                                        <div className="border rounded-md divide-y max-h-60 overflow-y-auto bg-slate-50/50">
                                            {scannedItems.map((item, idx) => (
                                                <div key={idx} className="flex items-center gap-2 p-2">
                                                    {/* Type Selector (Optional, kept simple for now) */}
                                                    <div className="w-[80px]">
                                                        <select
                                                            className="h-8 w-full rounded-md border border-input bg-background px-2 py-1 text-xs"
                                                            value={item.type}
                                                            onChange={(e) => {
                                                                const newItems = [...scannedItems]
                                                                newItems[idx].type = e.target.value
                                                                setScannedItems(newItems)
                                                            }}
                                                        >
                                                            <option value="Food">Food</option>
                                                            <option value="Veg">Veg</option>
                                                            <option value="Non-Veg">Non-Veg</option>
                                                            <option value="Alcohol">Alcohol</option>
                                                            <option value="Other">Other</option>
                                                        </select>
                                                    </div>

                                                    {/* Name Input */}
                                                    <Input
                                                        className="h-8 flex-1 text-sm bg-white"
                                                        placeholder="Item Name"
                                                        value={item.name}
                                                        onChange={(e) => {
                                                            const newItems = [...scannedItems]
                                                            newItems[idx].name = e.target.value
                                                            setScannedItems(newItems)
                                                        }}
                                                    />

                                                    {/* Amount Input */}
                                                    <Input
                                                        className="h-8 w-24 text-sm bg-white text-right"
                                                        type="number"
                                                        placeholder="0.00"
                                                        value={item.amount}
                                                        onChange={(e) => {
                                                            const newItems = [...scannedItems]
                                                            newItems[idx].amount = e.target.value
                                                            setScannedItems(newItems)
                                                        }}
                                                        onFocus={(e) => e.target.select()}
                                                    />

                                                    {/* Delete Button */}
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-8 w-8 text-muted-foreground hover:text-red-600"
                                                        onClick={() => {
                                                            const newItems = scannedItems.filter((_, i) => i !== idx)
                                                            setScannedItems(newItems)
                                                        }}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="text-right text-xs text-muted-foreground">
                                            Total Calculated: ₹{scannedItems.reduce((sum, item) => sum + (parseFloat(item.amount.toString()) || 0), 0).toFixed(2)}
                                        </div>
                                    </div>
                                )}

                                {/* Split Type */}
                                <div className="space-y-3">
                                    <Label>Split Method</Label>
                                    <div className="flex gap-4">
                                        <div
                                            className={`flex-1 border rounded-md p-3 cursor-pointer text-center transition-all ${splitType === 'equal' ? 'bg-primary/10 border-primary text-primary font-medium' : 'hover:bg-slate-50'}`}
                                            onClick={() => setSplitType('equal')}
                                        >
                                            Equally
                                        </div>
                                        <div
                                            className={`flex-1 border rounded-md p-3 cursor-pointer text-center transition-all ${splitType === 'custom' ? 'bg-primary/10 border-primary text-primary font-medium' : 'hover:bg-slate-50'}`}
                                            onClick={() => setSplitType('custom')}
                                        >
                                            Custom
                                        </div>
                                    </div>
                                </div>

                                {/* Custom Splits UI */}
                                {splitType === 'custom' && (
                                    <div className="space-y-3 bg-slate-50 p-4 rounded-lg border">
                                        <Label className="text-xs text-muted-foreground uppercase tracking-wide">Enter share for each member</Label>
                                        {group?.members.map(member => (
                                            <div key={member._id} className="flex items-center gap-3">
                                                <Avatar className="h-6 w-6">
                                                    <AvatarImage src={member.avatar} />
                                                    <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm flex-1 truncate">{member.name}</span>
                                                <Input
                                                    type="number"
                                                    className="w-24 h-8 text-right bg-white"
                                                    placeholder="0.00"
                                                    value={customSplits[member._id] || ""}
                                                    onChange={e => setCustomSplits(prev => ({ ...prev, [member._id]: e.target.value }))}
                                                />
                                            </div>
                                        ))}
                                        <p className="text-right text-xs text-muted-foreground">
                                            Total: ₹{Object.values(customSplits).reduce((a, b) => a + (parseFloat(b) || 0), 0).toFixed(2)} / ₹{newExpenseAmount || 0}
                                        </p>
                                    </div>
                                )}

                                {/* Bill Upload */}
                                <div className="space-y-2">
                                    <Label>Attach Bill (Optional)</Label>
                                    {!billFile ? (
                                        <Input
                                            type="file"
                                            accept="image/*,application/pdf"
                                            onChange={e => setBillFile(e.target.files?.[0] || null)}
                                            className="cursor-pointer"
                                        />
                                    ) : (
                                        <div className="flex items-center justify-between p-3 border rounded-md bg-slate-50">
                                            <div className="flex items-center gap-2 overflow-hidden">
                                                <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                                                <span className="text-sm truncate">{billFile.name}</span>
                                            </div>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-red-500"
                                                onClick={() => setBillFile(null)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-end gap-2 bg-slate-50/50 p-4 rounded-b-lg">
                                <Button type="button" variant="outline" onClick={() => setShowExpenseModal(false)}>Cancel</Button>
                                <Button type="submit" disabled={isCreatingExpense}>
                                    {isCreatingExpense ? "Adding..." : "Add Expense"}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            )}

            {/* Confirmation Modal */}
            <AlertDialog open={showConfirmationModal} onOpenChange={setShowConfirmationModal}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirm Scanned Receipt Details</AlertDialogTitle>
                        <AlertDialogDescription>
                            We analyzed your receipt with {(confirmationData?.confidence * 100)?.toFixed(0) || 0}% confidence. Please check the details.
                        </AlertDialogDescription>
                    </AlertDialogHeader>

                    {confirmationData && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <Label className="text-xs">Category</Label>
                                    <Input
                                        value={confirmationData.category || ""}
                                        onChange={(e) => setConfirmationData({ ...confirmationData, category: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label className="text-xs">Total Amount</Label>
                                    <Input
                                        type="number"
                                        value={confirmationData.totalAmount || 0}
                                        onChange={(e) => setConfirmationData({ ...confirmationData, totalAmount: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label className="text-xs">Items ({confirmationData.items?.length || 0})</Label>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0"
                                        onClick={() => {
                                            const newItems = [...(confirmationData.items || []), { name: "New Item", amount: 0, quantity: 1, type: "Food" }];
                                            setConfirmationData({ ...confirmationData, items: newItems });
                                        }}
                                    >
                                        <Plus className="h-4 w-4" />
                                    </Button>
                                </div>

                                <div className="border rounded bg-muted/30 p-2 max-h-60 overflow-y-auto space-y-2">
                                    {(confirmationData.items || []).map((item: any, i: number) => (
                                        <div key={i} className="flex gap-2 items-center">
                                            <Input
                                                className="h-8 text-sm"
                                                value={item.name}
                                                onChange={(e) => {
                                                    const newItems = [...confirmationData.items];
                                                    newItems[i] = { ...item, name: e.target.value };
                                                    setConfirmationData({ ...confirmationData, items: newItems });
                                                }}
                                                placeholder="Item Name"
                                            />
                                            <Input
                                                className="h-8 w-16 text-sm"
                                                type="number"
                                                value={item.quantity}
                                                onChange={(e) => {
                                                    const newItems = [...confirmationData.items];
                                                    newItems[i] = { ...item, quantity: e.target.value };
                                                    setConfirmationData({ ...confirmationData, items: newItems });
                                                }}
                                                placeholder="Qty"
                                            />
                                            <Input
                                                className="h-8 w-24 text-sm"
                                                type="number"
                                                value={item.amount}
                                                onChange={(e) => {
                                                    const newItems = [...confirmationData.items];
                                                    newItems[i] = { ...item, amount: e.target.value };
                                                    setConfirmationData({ ...confirmationData, items: newItems });
                                                }}
                                                placeholder="Amount"
                                            />
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="h-8 w-8 p-0 text-destructive"
                                                onClick={() => {
                                                    const newItems = confirmationData.items.filter((_: any, idx: number) => idx !== i);
                                                    setConfirmationData({ ...confirmationData, items: newItems });
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ))}
                                    {(!confirmationData.items || confirmationData.items.length === 0) && (
                                        <p className="text-xs text-muted-foreground text-center py-2">No items found. Add one manually.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setShowConfirmationModal(false)}>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => { applyScanData(confirmationData); setShowConfirmationModal(false); }}>Confirm & Use</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
