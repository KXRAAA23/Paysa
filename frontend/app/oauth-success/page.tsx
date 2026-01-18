"use client"

import { useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"

function OAuthSuccessContent() {
    const router = useRouter()
    const searchParams = useSearchParams()

    useEffect(() => {
        const token = searchParams.get("token")
        if (token) {
            localStorage.setItem("token", token)
            router.push("/dashboard")
        } else {
            router.push("/login")
        }
    }, [router, searchParams])

    return (
        <div className="flex min-h-screen items-center justify-center">
            <p className="text-lg text-muted-foreground">Authenticating...</p>
        </div>
    )
}

export default function OAuthSuccessPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <OAuthSuccessContent />
        </Suspense>
    )
}
