"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User, Mail, Calendar, Briefcase, FileText } from "lucide-react"

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
import { Separator } from "@/components/ui/separator"

interface UserProfile {
    name: string
    email: string
    dob?: string
    occupation?: string
    bio?: string
}

export default function ProfilePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

    const [profile, setProfile] = useState<UserProfile>({
        name: "",
        email: "",
        dob: "",
        occupation: "",
        bio: ""
    })

    // Calculate age from DOB
    const calculateAge = (dobString?: string) => {
        if (!dobString) return "N/A"
        const birthDate = new Date(dobString)
        const today = new Date()
        let age = today.getFullYear() - birthDate.getFullYear()
        const m = today.getMonth() - birthDate.getMonth()
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--
        }
        return age
    }

    // Fetch Profile Data
    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const token = localStorage.getItem("token")
                if (!token) {
                    router.push("/login")
                    return
                }

                const response = await fetch("http://localhost:5000/api/users/profile", {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                })

                if (response.ok) {
                    const data = await response.json()
                    setProfile({
                        name: data.name || "",
                        email: data.email || "",
                        dob: data.dob ? new Date(data.dob).toISOString().split('T')[0] : "",
                        occupation: data.occupation || "",
                        bio: data.bio || ""
                    })
                } else {
                    if (response.status === 401) {
                        localStorage.removeItem("token")
                        router.push("/login")
                    }
                }
            } catch (error) {
                console.error("Failed to fetch profile", error)
            } finally {
                setLoading(false)
            }
        }

        fetchProfile()
    }, [router])

    // Handle Form Submit
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setMessage(null)

        try {
            const token = localStorage.getItem("token")
            const response = await fetch("http://localhost:5000/api/users/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(profile)
            })

            const data = await response.json()

            if (response.ok) {
                setMessage({ type: 'success', text: "Profile updated successfully!" })
                // Update local token if it was refreshed (optional, but handled in backend)
                if (data.token) {
                    localStorage.setItem("token", data.token)
                }
            } else {
                setMessage({ type: 'error', text: data.message || "Failed to update profile" })
            }
        } catch (error) {
            setMessage({ type: 'error', text: "An error occurred. Please try again." })
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="flex justify-center items-center min-h-[50vh]">Loading...</div>
    }

    return (
        <div className="container mx-auto max-w-2xl">
            <h1 className="text-3xl font-bold mb-6">Your Profile</h1>

            <form onSubmit={handleSubmit}>
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-4">
                            <div className="bg-primary/10 p-3 rounded-full">
                                <User className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <CardTitle className="text-xl">Personal Information</CardTitle>
                                <CardDescription>Update your personal details here.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-6">

                        {message && (
                            <div className={`p-3 rounded-md text-sm ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                {message.text}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        value={profile.email}
                                        disabled
                                        className="pl-9 bg-muted"
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">Email cannot be changed.</p>
                            </div>

                            <Separator />

                            <div className="grid gap-2">
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        value={profile.name}
                                        onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                                        className="pl-9"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label htmlFor="dob">Date of Birth</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="dob"
                                            type="date"
                                            value={profile.dob}
                                            onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <div className="grid gap-2">
                                    <Label>Age</Label>
                                    <div className="flex h-10 w-full items-center rounded-md border border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                                        {calculateAge(profile.dob)} years old
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="occupation">Occupation</Label>
                                <div className="relative">
                                    <Briefcase className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="occupation"
                                        value={profile.occupation}
                                        onChange={(e) => setProfile({ ...profile, occupation: e.target.value })}
                                        className="pl-9"
                                        placeholder="e.g. Software Engineer"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="bio">Bio</Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <textarea
                                        id="bio"
                                        value={profile.bio}
                                        onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 pl-9"
                                        placeholder="Tell us a little about yourself..."
                                    />
                                </div>
                            </div>
                        </div>

                    </CardContent>
                    <CardFooter className="flex justify-end">
                        <Button type="submit" disabled={saving}>
                            {saving ? "Saving..." : "Save Changes"}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </div>
    )
}
