"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollText, Search, Loader2, RefreshCw, Database, Shield, LogIn, LogOut, Plus, Edit, Trash2, Eye } from "lucide-react"
import { useState, useEffect } from "react"

interface AuditLog {
    audit_id: string
    user_id: string
    activity_time: string
    action_type: string
    entity: string
    entity_id: string
    changes: Record<string, string>
    ip_address: string
    description: string
}

export default function AuditTrailPage() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [stats, setStats] = useState<{ total: number; status: string }>({ total: 0, status: "" })

    useEffect(() => {
        loadAuditLogs()
        loadStats()
    }, [])

    const loadAuditLogs = async () => {
        setLoading(true)
        try {
            const token = localStorage.getItem('access_token')
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

            const response = await fetch(`${baseUrl}/api/admin/audit-logs?limit=500`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setLogs(data.logs || [])
            } else {
                console.log("Failed to load audit logs:", response.status)
                setLogs([])
            }
        } catch (error) {
            console.error("Failed to load audit logs:", error)
            setLogs([])
        } finally {
            setLoading(false)
        }
    }

    const loadStats = async () => {
        try {
            const token = localStorage.getItem('access_token')
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

            const response = await fetch(`${baseUrl}/api/admin/audit-stats`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setStats(data)
            }
        } catch (error) {
            console.error("Failed to load stats:", error)
        }
    }

    const handleSearch = () => {
        if (searchQuery) {
            const filtered = logs.filter(
                (log) =>
                    log.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    log.action_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    log.entity.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    log.description.toLowerCase().includes(searchQuery.toLowerCase())
            )
            setLogs(filtered)
        } else {
            loadAuditLogs()
        }
    }

    const formatDate = (isoDate: string) => {
        if (!isoDate) return "-"
        return new Date(isoDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        })
    }

    const getActionIcon = (actionType: string) => {
        switch (actionType) {
            case 'LOGIN': return <LogIn className="h-4 w-4" />
            case 'LOGOUT': return <LogOut className="h-4 w-4" />
            case 'REGISTER': return <Plus className="h-4 w-4" />
            case 'CREATE': return <Plus className="h-4 w-4" />
            case 'UPDATE': return <Edit className="h-4 w-4" />
            case 'DELETE': return <Trash2 className="h-4 w-4" />
            case 'READ': return <Eye className="h-4 w-4" />
            case 'VERIFY': return <Shield className="h-4 w-4" />
            default: return <ScrollText className="h-4 w-4" />
        }
    }

    const getActionColor = (actionType: string) => {
        switch (actionType) {
            case 'LOGIN': return "bg-green-500/20 text-green-500 border-green-500/50"
            case 'LOGOUT': return "bg-orange-500/20 text-orange-500 border-orange-500/50"
            case 'REGISTER': return "bg-blue-500/20 text-blue-500 border-blue-500/50"
            case 'CREATE': return "bg-blue-500/20 text-blue-500 border-blue-500/50"
            case 'UPDATE': return "bg-yellow-500/20 text-yellow-500 border-yellow-500/50"
            case 'DELETE': return "bg-red-500/20 text-red-500 border-red-500/50"
            case 'READ': return "bg-purple-500/20 text-purple-500 border-purple-500/50"
            case 'VERIFY': return "bg-cyan-500/20 text-cyan-500 border-cyan-500/50"
            default: return "bg-gray-500/20 text-gray-500 border-gray-500/50"
        }
    }

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <ScrollText className="h-8 w-8 text-purple-500" />
                        <h1 className="text-3xl font-bold tracking-tight">Audit Trail</h1>
                        <Badge variant="outline" className="ml-2 gap-1">
                            <Database className="h-3 w-3" />
                            Cassandra
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">
                        FR-12: Riwayat aktivitas user secara real-time untuk monitoring keamanan.
                    </p>
                </div>
                <Button variant="outline" onClick={loadAuditLogs} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="border-purple-500/30 bg-purple-500/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Total Audit Logs</p>
                                <p className="text-3xl font-bold text-purple-500">{stats.total || logs.length}</p>
                            </div>
                            <ScrollText className="h-8 w-8 text-purple-500/50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-green-500/30 bg-green-500/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Status Cassandra</p>
                                <p className="text-xl font-bold text-green-500">
                                    {stats.status === "connected" ? "🟢 Connected" : "⚪ Checking..."}
                                </p>
                            </div>
                            <Database className="h-8 w-8 text-green-500/50" />
                        </div>
                    </CardContent>
                </Card>
                <Card className="border-blue-500/30 bg-blue-500/5">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">Keyspace</p>
                                <p className="text-xl font-bold text-blue-500 font-mono">eco_logs</p>
                            </div>
                            <Shield className="h-8 w-8 text-blue-500/50" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari berdasarkan User ID, aksi, atau deskripsi..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                </div>
                <Button onClick={handleSearch}>Cari</Button>
            </div>

            {/* Audit Logs Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Log Aktivitas</CardTitle>
                    <CardDescription>
                        Data disimpan di Cassandra untuk performa tinggi (write-heavy, append-only)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <ScrollText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">Belum ada audit log</p>
                            <p className="text-sm mt-2">
                                Aktivitas user akan tercatat secara otomatis (login, register, create activity, dll)
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Waktu</TableHead>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Aksi</TableHead>
                                    <TableHead>Entitas</TableHead>
                                    <TableHead>Deskripsi</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.map((log) => (
                                    <TableRow key={log.audit_id}>
                                        <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                                            {formatDate(log.activity_time)}
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {log.user_id.substring(0, 12)}...
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={`gap-1 ${getActionColor(log.action_type)}`}>
                                                {getActionIcon(log.action_type)}
                                                {log.action_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{log.entity}</Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[300px] truncate">
                                            {log.description}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
