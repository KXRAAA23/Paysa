"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Plus, Users, ArrowRight, Wallet, Search, Sparkles } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"

interface Group {
    _id: string
    name: string
    members: string[]
    description?: string
    balance?: number
    expenses?: any[]
}

export default function GroupsPage() {
    const router = useRouter()
    const [groups, setGroups] = useState<Group[]>([])
    const [loading, setLoading] = useState(true)
    const [showCreateModal, setShowCreateModal] = useState(false)

    // Form State
    const [newGroupName, setNewGroupName] = useState("")
    const [newGroupDesc, setNewGroupDesc] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState("")

    const fetchGroups = async () => {
        try {
            const token = localStorage.getItem("token")
            if (!token) {
                router.push("/login")
                return
            }

            const response = await fetch("http://localhost:5000/api/groups/my-groups", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })

            if (response.ok) {
                const data = await response.json()

                // Robustly get userId from token
                let userId = localStorage.getItem("userId");
                try {
                    const payload = JSON.parse(atob(token.split('.')[1]));
                    if (payload && payload.id) userId = payload.id;
                } catch (e) {
                    console.error("Failed to decode token for userId", e);
                }

                const enrichedData = data.map((g: any) => {
                    let groupBalance = 0;
                    if (g.expenses && Array.isArray(g.expenses)) {
                        g.expenses.forEach((exp: any) => {
                            // Robust ID checks
                            if (!exp.paidBy || !exp.splits) return;
                            const payerId = (exp.paidBy._id || exp.paidBy).toString();
                            const isPayer = payerId === userId;

                            if (isPayer) {
                                // I paid. Add up what OPEN splits others owe me.
                                exp.splits.forEach((split: any) => {
                                    if (!split.user) return;
                                    const splitUserId = (split.user._id || split.user).toString();
                                    if (splitUserId !== userId && !split.settled) {
                                        groupBalance += split.amount;
                                    }
                                });
                            } else {
                                // Someone else paid. Subtract my OPEN split.
                                const mySplit = exp.splits.find((s: any) => s.user && (s.user._id || s.user).toString() === userId);
                                if (mySplit && !mySplit.settled) {
                                    groupBalance -= mySplit.amount;
                                }
                            }
                        });
                    }
                    return {
                        ...g,
                        balance: parseFloat(groupBalance.toFixed(2))
                    };
                })
                setGroups(enrichedData)
            } else {
                console.error("Failed to fetch groups")
            }
        } catch (error) {
            console.error("Error fetching groups:", error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchGroups()
    }, [])

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newGroupName.trim()) return

        setIsSubmitting(true)
        setError("")

        try {
            const token = localStorage.getItem("token")

            // OPTIMISTIC UPDATE: Instant feedback
            // We assume success and add to list immediately with temp ID
            const tempId = `temp-${Date.now()}`
            const optimisticGroup: Group = {
                _id: tempId,
                name: newGroupName,
                members: ["me"], // Just one member (creator) initially
                description: newGroupDesc,
                balance: 0 // "Start with zero balance"
            }

            setGroups(prev => [...prev, optimisticGroup])
            setNewGroupName("")
            setNewGroupDesc("")
            setShowCreateModal(false)

            const response = await fetch("http://localhost:5000/api/groups/create", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    name: optimisticGroup.name,
                    description: optimisticGroup.description
                }),
            })

            if (response.ok) {
                // Fetch again to get real ID and ensure consistency
                await fetchGroups()
            } else {
                // Revert optimistic update if failed
                setGroups(prev => prev.filter(g => g._id !== tempId))
                const data = await response.json()
                setError(data.message || "Failed to create group")
                // Re-open modal so user can retry
                setShowCreateModal(true)
                setNewGroupName(optimisticGroup.name) // Restore input
            }
        } catch (err: any) {
            setGroups(prev => prev.filter(g => !g._id.toString().startsWith('temp')))
            setError("Something went wrong. Please try again.")
            setShowCreateModal(true)
        } finally {
            setIsSubmitting(false)
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center h-[60vh] text-muted-foreground animate-pulse">Loading groups...</div>
    }

    return (
        <div className="space-y-8 max-w-6xl mx-auto animate-in fade-in duration-500">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">Groups</h1>
                    <p className="text-muted-foreground mt-1">Manage shared expenses with your friends.</p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                    <Button onClick={() => setShowCreateModal(true)} className="shadow-sm">
                        <Plus className="mr-2 h-4 w-4" /> Create Group
                    </Button>
                </div>
            </div>

            {/* Grid Layout */}
            {groups.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <Card
                            key={group._id}
                            className={`group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border cursor-pointer bg-card ${group._id.startsWith('temp') ? 'opacity-70 animate-pulse' : ''}`}
                            onClick={() => {
                                if (!group._id.startsWith('temp')) {
                                    router.push(`/groups/${group._id}`)
                                }
                            }}
                        >
                            <div className="absolute top-0 left-0 w-1 h-full bg-primary opacity-0 group-hover:opacity-100 transition-opacity" />

                            <CardHeader className="pb-4">
                                <div className="flex justify-between items-start">
                                    <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-primary font-bold text-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                                        {group.name.charAt(0).toUpperCase()}
                                    </div>
                                    <Badge variant="secondary" className="font-normal text-muted-foreground bg-muted">
                                        {group.members.length} {group.members.length === 1 ? 'member' : 'members'}
                                    </Badge>
                                </div>
                                <CardTitle className="text-xl font-bold mt-4 mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                    {group.name}
                                </CardTitle>
                                <CardDescription className="line-clamp-2 min-h-[40px]">
                                    {group.description || "No description provided."}
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <div className="p-3 bg-muted/40 rounded-lg flex items-center justify-between">
                                    <span className="text-sm font-medium text-muted-foreground">Your Balance</span>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-bold ${group.balance && group.balance < 0 ? "text-red-600" : group.balance && group.balance > 0 ? "text-green-600" : "text-muted-foreground"}`}>
                                            {(!group.balance || group.balance === 0) ? "Settled" :
                                                group.balance < 0 ? `-₹${Math.abs(group.balance)}` : `+₹${group.balance}`}
                                        </span>
                                    </div>
                                </div>
                            </CardContent>

                            <CardFooter className="pt-2">
                                <Button variant="ghost" className="w-full justify-between hover:bg-primary/5 hover:text-primary group-hover:pr-2 transition-all">
                                    {group._id.startsWith('temp') ? 'Creating...' : 'Open Group'}
                                    {!group._id.startsWith('temp') && <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />}
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            ) : (
                /* Empty State */
                <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-500">
                    <div className="bg-muted p-6 rounded-full mb-6 relative">
                        <div className="absolute -top-2 -right-2 bg-yellow-100 p-2 rounded-full animate-bounce delay-700">
                            <Sparkles className="h-4 w-4 text-yellow-600" />
                        </div>
                        <Users className="h-12 w-12 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">No groups yet</h3>
                    <p className="text-muted-foreground max-w-sm mb-8">
                        Create your first group to start splitting expenses easily.
                    </p>
                    <Button size="lg" onClick={() => setShowCreateModal(true)} className="px-8 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-shadow">
                        <Plus className="mr-2 h-5 w-5" /> Create Group
                    </Button>
                </div>
            )}

            {/* Create Group Modal */}
            {showCreateModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <Card className="w-full max-w-md bg-card shadow-2xl border-none animate-in zoom-in-95 duration-200">
                        <CardHeader>
                            <CardTitle className="text-2xl">Create New Group</CardTitle>
                            <CardDescription>
                                Start a new collection for a trip, house, or project.
                            </CardDescription>
                        </CardHeader>
                        <form onSubmit={handleCreateGroup}>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="groupName">Group Name</Label>
                                    <Input
                                        id="groupName"
                                        placeholder="e.g. Goa Trip 2024"
                                        value={newGroupName}
                                        onChange={(e) => setNewGroupName(e.target.value)}
                                        required
                                        autoFocus
                                        className="text-lg"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="groupDesc">Description <span className="text-muted-foreground font-normal">(Optional)</span></Label>
                                    <Input
                                        id="groupDesc"
                                        placeholder="Briefly describe this group..."
                                        value={newGroupDesc}
                                        onChange={(e) => setNewGroupDesc(e.target.value)}
                                    />
                                </div>
                                {error && (
                                    <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-center gap-2">
                                        <span className="font-bold">Error:</span> {error}
                                    </div>
                                )}
                            </CardContent>
                            <CardFooter className="flex justify-end space-x-3 bg-muted/20 py-4 rounded-b-xl border-t">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowCreateModal(false)}
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Creating..." : "Create Group"}
                                </Button>
                            </CardFooter>
                        </form>
                    </Card>
                </div>
            )
            }
        </div >
    )
}
