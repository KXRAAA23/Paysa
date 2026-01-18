"use client"

import * as React from "react"
import { MoreVertical, Shield, ShieldOff, UserX, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

interface AdminActionsProps {
    memberId: string
    memberName: string
    currentRole: "Admin" | "Member"
    isCreator: boolean // Logic: Creator cannot be removed/demoted via this simple UI
    onPromote: (id: string) => Promise<void>
    onDemote: (id: string) => Promise<void>
    onRemove: (id: string) => Promise<void>
}

export function AdminActions({
    memberId,
    memberName,
    currentRole,
    isCreator,
    onPromote,
    onDemote,
    onRemove
}: AdminActionsProps) {
    const [showRemoveDialog, setShowRemoveDialog] = React.useState(false)
    const [loading, setLoading] = React.useState(false)

    const handleAction = async (action: () => Promise<void>) => {
        setLoading(true)
        await action()
        setLoading(false)
        setShowRemoveDialog(false)
    }

    if (isCreator) return null // Can't manage the creator

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MoreVertical className="h-4 w-4" />}
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    {currentRole === "Member" ? (
                        <DropdownMenuItem onClick={() => handleAction(() => onPromote(memberId))}>
                            <Shield className="mr-2 h-4 w-4" /> Promote to Admin
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onClick={() => handleAction(() => onDemote(memberId))}>
                            <ShieldOff className="mr-2 h-4 w-4" /> Demote to Member
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="text-red-600 focus:text-red-600 focus:bg-red-50" onClick={() => setShowRemoveDialog(true)}>
                        <UserX className="mr-2 h-4 w-4" /> Remove from Group
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AlertDialog open={showRemoveDialog} onOpenChange={setShowRemoveDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remove {memberName}?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove them from the group. They will no longer see shared expenses.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault()
                                handleAction(() => onRemove(memberId))
                            }}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {loading ? "Removing..." : "Remove"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}
