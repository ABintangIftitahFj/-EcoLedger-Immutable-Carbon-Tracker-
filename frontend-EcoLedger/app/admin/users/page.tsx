"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Shield, User, Loader2, RefreshCw } from "lucide-react"
import { useState, useEffect } from "react"

interface UserData {
    id: string
    email: string
    name: string
    role: string
    created_at: string
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<UserData[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadUsers()
    }, [])

    const loadUsers = async () => {
        setLoading(true)
        try {
            // Fetch users from API
            const response = await fetch('http://localhost:8000/api/admin/users', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('access_token')}`
                }
            })

            if (response.ok) {
                const data = await response.json()
                setUsers(data.users || [])
            } else {
                // Fallback: show message
                console.log("API not available, showing empty list")
                setUsers([])
            }
        } catch (error) {
            console.error("Failed to load users:", error)
            setUsers([])
        } finally {
            setLoading(false)
        }
    }

    const formatDate = (isoDate: string) => {
        return new Date(isoDate).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        })
    }

    return (
        <div className="flex flex-col gap-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="h-8 w-8 text-blue-500" />
                        <h1 className="text-3xl font-bold tracking-tight">Kelola Users</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Daftar semua pengguna yang terdaftar di EcoLedger.
                    </p>
                </div>
                <Button variant="outline" onClick={loadUsers} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Users Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Pengguna</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                            <p className="font-medium">Belum ada pengguna terdaftar</p>
                            <p className="text-sm mt-2">
                                Silakan daftarkan pengguna baru melalui halaman registrasi.
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Role</TableHead>
                                    <TableHead>Tanggal Daftar</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {users.map((user) => (
                                    <TableRow key={user.id}>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {user.role === 'admin' ? (
                                                    <Shield className="h-4 w-4 text-red-500" />
                                                ) : (
                                                    <User className="h-4 w-4 text-muted-foreground" />
                                                )}
                                                {user.name}
                                            </div>
                                        </TableCell>
                                        <TableCell>{user.email}</TableCell>
                                        <TableCell>
                                            {user.role === 'admin' ? (
                                                <Badge className="bg-red-500/20 text-red-500 border-red-500/50">
                                                    Admin
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">User</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{formatDate(user.created_at)}</TableCell>
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
