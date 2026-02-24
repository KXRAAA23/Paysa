"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { ArrowLeft, Mail, KeyRound, Lock, CheckCircle2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"

export default function ForgotPasswordPage() {
    const router = useRouter()

    // Steps: 1 = email, 2 = otp, 3 = new password, 4 = success
    const [step, setStep] = useState(1)

    // Form state
    const [email, setEmail] = useState("")
    const [otp, setOtp] = useState("")
    const [newPassword, setNewPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    // Loading/Error state
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState("")

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!email) {
            setError("Please enter your email.")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/forgot-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email })
            })

            const data = await res.json()
            if (res.ok) {
                setStep(2)
            } else {
                setError(data.message || "Failed to send OTP.")
            }
        } catch (err) {
            setError("Could not connect to server.")
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault()
        if (otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP.")
            return
        }
        setStep(3)
    }

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault()
        if (newPassword !== confirmPassword) {
            setError("Passwords do not match.")
            return
        }
        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters.")
            return
        }

        setIsLoading(true)
        setError("")

        try {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/users/reset-password`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email, otp, newPassword })
            })

            const data = await res.json()
            if (res.ok) {
                setStep(4)
                setTimeout(() => router.push("/login"), 3000)
            } else {
                setError(data.message || "Failed to reset password. The OTP might be expired.")
            }
        } catch (err) {
            setError("Could not connect to server.")
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex text-white relative items-center justify-center p-4" style={{ backgroundColor: "#000000" }}>
            {/* Background Effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/10 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/10 rounded-full blur-[120px]" />
            </div>

            <div className="w-full max-w-md space-y-8 z-10 relative">
                {step < 4 && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-zinc-400 hover:text-white mb-4 -ml-4"
                        onClick={() => step > 1 ? setStep(step - 1) : router.push("/login")}
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                )}

                <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/50 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                                    <KeyRound className="h-6 w-6 text-blue-400" />
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight text-white">Forgot Password?</h1>
                                <p className="text-sm text-zinc-400">
                                    No worries, we'll send you reset instructions.
                                </p>
                            </div>

                            <form onSubmit={handleSendOtp} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-zinc-300">Email Address</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="pl-10 bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-blue-500"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                                <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-900/20" disabled={isLoading}>
                                    {isLoading ? "Sending OTP..." : "Reset Password"}
                                </Button>
                            </form>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
                                    <Mail className="h-6 w-6 text-purple-400" />
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight text-white">Check your email</h1>
                                <p className="text-sm text-zinc-400">
                                    We sent a 6-digit verification code to <br /> <span className="text-zinc-200 font-medium">{email}</span>
                                </p>
                            </div>

                            <form onSubmit={handleVerifyOtp} className="space-y-6">
                                <div className="flex justify-center flex-col items-center gap-2">
                                    <Label className="text-zinc-300">Enter Verification Code</Label>
                                    <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                                        <InputOTPGroup>
                                            <InputOTPSlot index={0} className="bg-zinc-950/50 border-zinc-800 text-white" />
                                            <InputOTPSlot index={1} className="bg-zinc-950/50 border-zinc-800 text-white" />
                                            <InputOTPSlot index={2} className="bg-zinc-950/50 border-zinc-800 text-white" />
                                            <InputOTPSlot index={3} className="bg-zinc-950/50 border-zinc-800 text-white" />
                                            <InputOTPSlot index={4} className="bg-zinc-950/50 border-zinc-800 text-white" />
                                            <InputOTPSlot index={5} className="bg-zinc-950/50 border-zinc-800 text-white" />
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>

                                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                                <Button type="submit" className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-900/20">
                                    Verify Code
                                </Button>

                                <div className="text-center text-sm">
                                    <span className="text-zinc-400">Didn't receive the email? </span>
                                    <button type="button" onClick={handleSendOtp} className="text-purple-400 hover:text-purple-300 hover:underline">
                                        Click to resend
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {step === 3 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center space-y-2">
                                <div className="mx-auto w-12 h-12 bg-pink-500/10 rounded-full flex items-center justify-center mb-4">
                                    <Lock className="h-6 w-6 text-pink-400" />
                                </div>
                                <h1 className="text-2xl font-bold tracking-tight text-white">Set new password</h1>
                                <p className="text-sm text-zinc-400">
                                    Your new password must be securely chosen.
                                </p>
                            </div>

                            <form onSubmit={handleResetPassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="newpass" className="text-zinc-300">New Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="newpass"
                                            type="password"
                                            placeholder="••••••••"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            className="pl-10 bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-pink-500"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirmpass" className="text-zinc-300">Confirm Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                        <Input
                                            id="confirmpass"
                                            type="password"
                                            placeholder="••••••••"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="pl-10 bg-zinc-950/50 border-zinc-800 text-white placeholder:text-zinc-600 focus-visible:ring-pink-500"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                                <Button type="submit" className="w-full bg-pink-600 hover:bg-pink-700 text-white shadow-lg shadow-pink-900/20" disabled={isLoading}>
                                    {isLoading ? "Resetting..." : "Reset Password"}
                                </Button>
                            </form>
                        </div>
                    )}

                    {step === 4 && (
                        <div className="text-center space-y-4 animate-in zoom-in duration-500 py-8">
                            <div className="mx-auto w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 className="h-8 w-8 text-green-400" />
                            </div>
                            <h1 className="text-2xl font-bold tracking-tight text-white">Password Reset</h1>
                            <p className="text-sm text-zinc-400">
                                Your password has been successfully reset. <br /> Redirecting to login...
                            </p>
                            <div className="pt-4">
                                <Link href="/login">
                                    <Button variant="outline" className="text-white border-zinc-700 hover:bg-zinc-800 w-full">
                                        Go to Login (if not redirected)
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
