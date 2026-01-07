"use client"
import type React from "react"
import { Navbar } from "@/components/navbar"
import { LayoutDashboard, Users, Activity, Settings, LogOut, Shield, ScrollText, Building2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { UserResponse } from "@/lib/api-client"

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const [user, setUser] = useState<UserResponse | null>(null)
    const [loading, setLoading] = useState(true)
    const router = useRouter()
    const pathname = usePathname()

    useEffect(() => {
        // Check if user is logged in and is admin
        const storedUser = localStorage.getItem("user")
        if (!storedUser) {
            router.push("/login")
            return
        }

        try {
            const userData = JSON.parse(storedUser)
            if (userData.role !== "admin") {
                // Not admin, redirect to user dashboard
                router.push("/dashboard")
                return
            }
            setUser(userData)
        } catch {
            router.push("/login")
        }
        setLoading(false)
    }, [router])

    const handleLogout = () => {
        const confirmed = window.confirm(
            'Apakah Anda yakin ingin keluar?\n\nAnda perlu login kembali untuk mengakses admin panel.'
        )
        
        if (!confirmed) return

        localStorage.removeItem("access_token")
        localStorage.removeItem("user")
        router.push("/")
    }

    const isActive = (path: string) => pathname === path

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        )
    }

    return (
        <div className="flex h-screen flex-col overflow-hidden bg-background">
            <Navbar />
            <div className="flex flex-1 overflow-hidden">
                {/* Admin Sidebar */}
                <aside className="hidden w-64 flex-col border-r bg-gradient-to-b from-red-950/20 to-background md:flex">
                    {/* Admin Badge */}
                    <div className="p-4 border-b">
                        <div className="flex items-center gap-2 text-red-500">
                            <Shield className="h-5 w-5" />
                            <span className="font-bold text-lg">Admin Panel</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                            {user?.name}
                        </p>
                    </div>

                    <nav className="flex-1 space-y-1 p-4">
                        <Link href="/admin">
                            <Button
                                variant={isActive("/admin") ? "secondary" : "ghost"}
                                className="w-full justify-start gap-3"
                            >
                                <LayoutDashboard className="h-4 w-4" />
                                Dashboard Admin
                            </Button>
                        </Link>
                        <Link href="/admin/users">
                            <Button
                                variant={isActive("/admin/users") ? "secondary" : "ghost"}
                                className="w-full justify-start gap-3"
                            >
                                <Users className="h-4 w-4" />
                                Kelola Users
                            </Button>
                        </Link>
                        <Link href="/admin/activities">
                            <Button
                                variant={isActive("/admin/activities") ? "secondary" : "ghost"}
                                className="w-full justify-start gap-3"
                            >
                                <Activity className="h-4 w-4" />
                                Semua Aktivitas
                            </Button>
                        </Link>
                        <Link href="/admin/organisasi">
                            <Button
                                variant={isActive("/admin/organisasi") ? "secondary" : "ghost"}
                                className="w-full justify-start gap-3"
                            >
                                <Building2 className="h-4 w-4" />
                                Kelola Organisasi
                            </Button>
                        </Link>
                        <Link href="/admin/audit">
                            <Button
                                variant={isActive("/admin/audit") ? "secondary" : "ghost"}
                                className="w-full justify-start gap-3"
                            >
                                <ScrollText className="h-4 w-4" />
                                Audit Trail
                            </Button>
                        </Link>

                        <div className="pt-4 border-t mt-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" className="w-full justify-start gap-3 text-muted-foreground">
                                    <LayoutDashboard className="h-4 w-4" />
                                    User Dashboard
                                </Button>
                            </Link>
                        </div>
                    </nav>

                    <div className="p-4 border-t">
                        <Button
                            variant="ghost"
                            className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
                            onClick={handleLogout}
                        >
                            <LogOut className="h-4 w-4" />
                            Keluar
                        </Button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 overflow-y-auto p-6 lg:p-10">
                    {children}
                </main>
            </div>
        </div>
    )
}
