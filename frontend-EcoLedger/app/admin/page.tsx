"use client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Users, Activity, ShieldCheck, TrendingUp, AlertTriangle, CheckCircle2 } from "lucide-react"
import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

interface AdminStats {
    totalUsers: number
    totalActivities: number
    totalEmission: number
    validActivities: number
    invalidActivities: number
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<AdminStats>({
        totalUsers: 0,
        totalActivities: 0,
        totalEmission: 0,
        validActivities: 0,
        invalidActivities: 0,
    })
    const [loading, setLoading] = useState(true)
    const [recentActivities, setRecentActivities] = useState<any[]>([])

    useEffect(() => {
        loadAdminStats()
    }, [])

    const loadAdminStats = async () => {
        try {
            const token = localStorage.getItem('access_token')
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

            // Load admin stats from API
            const statsResponse = await fetch(`${baseUrl}/api/admin/stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!statsResponse.ok) {
                throw new Error('Failed to load admin stats')
            }

            const statsData = await statsResponse.json()

            // Load all activities (admin can see all)
            const activitiesResult = await apiClient.getActivities({
                page: 1,
                page_size: 100,
            })

            const validCount = activitiesResult.activities.filter(a => a.is_valid === true).length
            const invalidCount = activitiesResult.activities.filter(a => a.is_valid === false).length

            setStats({
                totalUsers: statsData.total_users,
                totalActivities: statsData.total_activities,
                totalEmission: statsData.total_emission,
                validActivities: validCount,
                invalidActivities: invalidCount,
            })

            setRecentActivities(activitiesResult.activities.slice(0, 5))
        } catch (error) {
            console.error("Failed to load admin stats:", error)
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (isoDate: string) => {
        return new Date(isoDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div>
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="h-8 w-8 text-red-500" />
                    <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                </div>
                <p className="text-muted-foreground">
                    Kelola dan pantau seluruh aktivitas sistem EcoLedger.
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="border-blue-500/30 bg-blue-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Users
                        </CardTitle>
                        <Users className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-500">
                            {loading ? "..." : stats.totalUsers}
                        </div>
                        <p className="text-xs text-muted-foreground">Pengguna terdaftar</p>
                    </CardContent>
                </Card>

                <Card className="border-green-500/30 bg-green-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Aktivitas
                        </CardTitle>
                        <Activity className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-green-500">
                            {loading ? "..." : stats.totalActivities}
                        </div>
                        <p className="text-xs text-muted-foreground">Catatan emisi</p>
                    </CardContent>
                </Card>

                <Card className="border-purple-500/30 bg-purple-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Emisi
                        </CardTitle>
                        <TrendingUp className="h-4 w-4 text-purple-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-purple-500">
                            {loading ? "..." : stats.totalEmission.toFixed(2)}
                        </div>
                        <p className="text-xs text-muted-foreground">kg CO2e</p>
                    </CardContent>
                </Card>

                <Card className="border-orange-500/30 bg-orange-500/5">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Integritas Data
                        </CardTitle>
                        <ShieldCheck className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <span className="text-2xl font-bold text-green-500">{stats.validActivities}</span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-2xl font-bold text-red-500">{stats.invalidActivities}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Valid / Invalid</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activities */}
            <div className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Aktivitas Terbaru</CardTitle>
                        <CardDescription>5 catatan emisi terakhir dari semua user</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">Memuat...</div>
                        ) : recentActivities.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">Belum ada aktivitas</div>
                        ) : (
                            <div className="space-y-4">
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{activity.description || activity.activity_type}</span>
                                                {activity.is_valid === true ? (
                                                    <Badge variant="outline" className="text-green-500 border-green-500/50">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Valid
                                                    </Badge>
                                                ) : activity.is_valid === false ? (
                                                    <Badge variant="outline" className="text-red-500 border-red-500/50">
                                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                                        Invalid
                                                    </Badge>
                                                ) : null}
                                            </div>
                                            <p className="text-xs text-muted-foreground">
                                                User: {activity.user_id} • {formatDate(activity.timestamp)}
                                            </p>
                                        </div>
                                        <div className="text-lg font-bold">
                                            {activity.emission.toFixed(2)} kg
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Aksi Cepat</CardTitle>
                        <CardDescription>Pintasan untuk tugas admin</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <a href="/admin/users" className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                            <Users className="h-8 w-8 text-blue-500" />
                            <div>
                                <p className="font-medium">Kelola Users</p>
                                <p className="text-sm text-muted-foreground">Lihat dan kelola pengguna</p>
                            </div>
                        </a>
                        <a href="/admin/activities" className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                            <Activity className="h-8 w-8 text-green-500" />
                            <div>
                                <p className="font-medium">Semua Aktivitas</p>
                                <p className="text-sm text-muted-foreground">Lihat aktivitas semua user</p>
                            </div>
                        </a>
                        <a href="/ledger" className="flex items-center gap-3 p-4 rounded-lg border hover:bg-muted/50 transition-colors">
                            <ShieldCheck className="h-8 w-8 text-purple-500" />
                            <div>
                                <p className="font-medium">Buku Besar Publik</p>
                                <p className="text-sm text-muted-foreground">Lihat ledger publik</p>
                            </div>
                        </a>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
