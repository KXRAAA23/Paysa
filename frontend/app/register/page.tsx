"use client"

import * as React from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
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
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp"
import { Separator } from "@/components/ui/separator"
import { Loader2, Zap } from "lucide-react"

export default function RegisterPage() {
    const router = useRouter()
    const [step, setStep] = React.useState<"register" | "otp">("register")
    const [name, setName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [confirmPassword, setConfirmPassword] = React.useState("")
    const [otp, setOtp] = React.useState("")
    const [error, setError] = React.useState("")
    const [isLoading, setIsLoading] = React.useState(false)

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        setIsLoading(true)

        try {
            const response = await fetch("http://localhost:5000/api/users/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ name, email, password }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Registration failed")
            }

            setStep("otp")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setIsLoading(true)

        try {
            const response = await fetch("http://localhost:5000/api/users/verify-otp", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, otp }),
            })

            const data = await response.json()

            if (!response.ok) {
                throw new Error(data.message || "Verification failed")
            }

            localStorage.setItem("token", data.token)
            localStorage.setItem("userId", data._id)
            router.push("/dashboard")
        } catch (err: any) {
            setError(err.message)
        } finally {
            setIsLoading(false)
        }
    }

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:5000/api/users/google"
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">

            {/* Aurora Background */}
            <div className="absolute inset-0 z-0">
                <div className="absolute top-[-20%] left-[-20%] w-[800px] h-[800px] bg-purple-600/30 rounded-full blur-[140px] animate-blob mix-blend-screen opacity-50"></div>
                <div className="absolute bottom-[-20%] right-[-20%] w-[800px] h-[800px] bg-blue-600/30 rounded-full blur-[140px] animate-blob animation-delay-2000 mix-blend-screen opacity-50"></div>
            </div>

            <div className="w-full max-w-md z-10 px-4">
                <div className="mb-8 flex justify-center">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="bg-white/10 p-2 rounded-xl backdrop-blur-md border border-white/10 group-hover:bg-white/20 transition-colors">
                            <Zap className="h-6 w-6 text-white" fill="currentColor" />
                        </div>
                        <span className="font-bold text-3xl tracking-tight text-white">Paysa</span>
                    </Link>
                </div>

                <Card className="border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl ring-1 ring-white/10">
                    <CardHeader className="space-y-1 text-center pb-6 pt-8">
                        <CardTitle className="text-3xl font-bold tracking-tight text-white">
                            {step === "register" ? "Create an account" : "Verify your email"}
                        </CardTitle>
                        <CardDescription className="text-zinc-400">
                            {step === "register"
                                ? "Enter your details to get started with Paysa"
                                : "An OTP has been sent to your email"}
                        </CardDescription>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {step === "register" ? (
                            <>
                                <form onSubmit={handleRegister} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="name" className="text-zinc-300">Full Name</Label>
                                        <Input
                                            id="name"
                                            placeholder="John Doe"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            required
                                            className="h-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="email" className="text-zinc-300">Email</Label>
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            className="h-11 bg-white/5 border-white/10 text-white placeholder:text-zinc-600 focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="password" className="text-zinc-300">Password</Label>
                                        <Input
                                            id="password"
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            className="h-11 bg-white/5 border-white/10 text-white focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="confirm-password" className="text-zinc-300">Confirm Password</Label>
                                        <Input
                                            id="confirm-password"
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                            className="h-11 bg-white/5 border-white/10 text-white focus:ring-purple-500/50 focus:border-purple-500/50 transition-all"
                                        />
                                    </div>

                                    {error && <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center font-medium">{error}</div>}

                                    <Button type="submit" className="w-full h-11 text-base bg-white text-black hover:bg-zinc-200 transition-colors font-semibold" disabled={isLoading}>
                                        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Register"}
                                    </Button>
                                </form>

                                <div className="relative my-6">
                                    <div className="absolute inset-0 flex items-center">
                                        <Separator className="bg-white/10" />
                                    </div>
                                    <div className="relative flex justify-center text-xs uppercase">
                                        <span className="bg-black/40 px-2 text-zinc-500 backdrop-blur-md">
                                            or continue with
                                        </span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full h-11 bg-white/5 border-white/10 text-white hover:bg-white/10 hover:text-white transition-colors"
                                    type="button"
                                    onClick={handleGoogleLogin}
                                >
                                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                                        <path
                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                            fill="#4285F4"
                                        />
                                        <path
                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                            fill="#34A853"
                                        />
                                        <path
                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                            fill="#FBBC05"
                                        />
                                        <path
                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                            fill="#EA4335"
                                        />
                                    </svg>
                                    Google
                                </Button>
                            </>
                        ) : (
                            <form onSubmit={handleVerify} className="space-y-8">
                                <div className="flex justify-center py-4">
                                    <InputOTP
                                        maxLength={6}
                                        value={otp}
                                        onChange={(value) => setOtp(value)}
                                    >
                                        <InputOTPGroup className="gap-2">
                                            {/* Custom styled OTP slots to match dark theme */}
                                            {[...Array(6)].map((_, i) => (
                                                <InputOTPSlot key={i} index={i} className="rounded-md border-white/20 bg-white/5 text-white h-12 w-10 md:w-12 text-lg" />
                                            ))}
                                        </InputOTPGroup>
                                    </InputOTP>
                                </div>

                                {error && <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-200 text-sm text-center font-medium">{error}</div>}

                                <Button type="submit" className="w-full h-11 text-base bg-white text-black hover:bg-zinc-200 transition-colors font-semibold" size="lg" disabled={isLoading}>
                                    {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Verify OTP"}
                                </Button>

                                <div className="text-center">
                                    <Button
                                        variant="link"
                                        className="text-sm text-zinc-400 hover:text-white"
                                        type="button"
                                        onClick={() => console.log("Resending OTP...")}
                                    >
                                        Resend OTP
                                    </Button>
                                    <Button
                                        variant="link"
                                        className="text-sm text-zinc-400 hover:text-white block mx-auto mt-2"
                                        type="button"
                                        onClick={() => setStep("register")}
                                    >
                                        Change Email
                                    </Button>
                                </div>
                            </form>
                        )}
                    </CardContent>
                    <CardFooter className="flex justify-center pt-4 pb-8">
                        <div className="text-sm text-zinc-500">
                            Already have an account?{" "}
                            <Link href="/login" className="font-medium text-purple-400 hover:underline hover:text-purple-300 transition-colors">
                                Login
                            </Link>
                        </div>
                    </CardFooter>
                </Card>
            </div>
        </div>
    )
}
