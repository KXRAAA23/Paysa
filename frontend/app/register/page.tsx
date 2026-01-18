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

export default function RegisterPage() {
    const router = useRouter()
    const [step, setStep] = React.useState<"register" | "otp">("register")
    const [name, setName] = React.useState("")
    const [email, setEmail] = React.useState("")
    const [password, setPassword] = React.useState("")
    const [confirmPassword, setConfirmPassword] = React.useState("")
    const [otp, setOtp] = React.useState("")
    const [error, setError] = React.useState("")

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

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
        }
    }

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")

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
            router.push("/dashboard")
        } catch (err: any) {
            setError(err.message)
        }
    }

    const handleGoogleLogin = () => {
        window.location.href = "http://localhost:5000/api/users/google"
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md shadow-lg border-0 sm:border sm:rounded-xl">
                <CardHeader className="space-y-1 text-center">
                    <CardTitle className="text-2xl font-bold tracking-tight">
                        {step === "register" ? "Create an account" : "Verify your email"}
                    </CardTitle>
                    <CardDescription className="text-muted-foreground">
                        {step === "register"
                            ? "Enter your details to get started with Paysa"
                            : "An OTP has been sent to your email"}
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {step === "register" ? (
                        <>
                            <form onSubmit={handleRegister} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        required
                                        className="h-10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="name@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                        className="h-10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="password">Password</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                        className="h-10"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="confirm-password">Confirm Password</Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        required
                                        className="h-10"
                                    />
                                </div>

                                {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                                <Button type="submit" className="w-full h-10 text-base" size="lg">
                                    Register
                                </Button>
                            </form>

                            <div className="mt-4 relative">
                                <div className="absolute inset-0 flex items-center">
                                    <Separator />
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-background px-2 text-muted-foreground">
                                        or continue with
                                    </span>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                className="w-full mt-4"
                                type="button"
                                onClick={handleGoogleLogin}
                            >
                                Google
                            </Button>
                        </>
                    ) : (
                        <form onSubmit={handleVerify} className="space-y-6">
                            <div className="flex justify-center">
                                <InputOTP
                                    maxLength={6}
                                    value={otp}
                                    onChange={(value) => setOtp(value)}
                                >
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>

                            {error && <p className="text-sm text-red-500 text-center">{error}</p>}

                            <Button type="submit" className="w-full h-10 text-base" size="lg">
                                Verify OTP
                            </Button>
                            <div className="text-center">
                                <Button
                                    variant="link"
                                    className="text-sm text-muted-foreground hover:text-primary"
                                    type="button"
                                    onClick={() => console.log("Resending OTP...")}
                                >
                                    Resend OTP
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
                <CardFooter className="flex justify-center">
                    <div className="text-sm text-muted-foreground">
                        Already have an account?{" "}
                        <Link href="/login" className="font-medium text-primary hover:underline">
                            Login
                        </Link>
                    </div>
                </CardFooter>
            </Card>
        </div>
    )
}
