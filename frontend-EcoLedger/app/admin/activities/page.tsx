"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Activity, Search, Loader2, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react"
import { useState, useEffect } from "react"
import { apiClient, ActivityResponse } from "@/lib/api-client"

export default function AdminActivitiesPage() {
    const [allActivities, setAllActivities] = useState<ActivityResponse[]>([])
    const [filteredActivities, setFilteredActivities] = useState<ActivityResponse[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [page, setPage] = useState(1)
    const [totalPages, setTotalPages] = useState(1)
    const [total, setTotal] = useState(0)
    const [isSearching, setIsSearching] = useState(false)
    const PAGE_SIZE = 15

    useEffect(() => {
        if (!isSearching) {
            loadActivities()
        }
    }, [page, isSearching])

    // Apply search filter whenever searchQuery changes
    useEffect(() => {
        if (searchQuery.trim()) {
            loadAllActivitiesForSearch()
        } else {
            setIsSearching(false)
            setPage(1)
            loadActivities()
        }
    }, [searchQuery])

    const loadActivities = async () => {
        setLoading(true)
        try {
            const result = await apiClient.getActivities({
                page: page,
                page_size: PAGE_SIZE,
            })

            setAllActivities(result.activities)
            setFilteredActivities(result.activities)
            setTotal(result.total)
            setTotalPages(Math.ceil(result.total / PAGE_SIZE))
        } catch (error) {
            console.error("Failed to load activities:", error)
        } finally {
            setLoading(false)
        }
    }

    const loadAllActivitiesForSearch = async () => {
        setLoading(true)
        setIsSearching(true)
        try {
            // Load SEMUA data dengan multiple requests karena backend limit 100 per page
            let allData: ActivityResponse[] = []
            let currentPage = 1
            let hasMore = true
            const maxPageSize = 100 // Backend limit
            
            while (hasMore) {
                const result = await apiClient.getActivities({
                    page: currentPage,
                    page_size: maxPageSize,
                })
                
                allData = [...allData, ...result.activities]
                
                // Check if there are more pages
                if (result.activities.length < maxPageSize || allData.length >= result.total) {
                    hasMore = false
                } else {
                    currentPage++
                }
            }

            setAllActivities(allData)
            
            // Filter berdasarkan search query
            const filtered = allData.filter(
                (a) =>
                    a.activity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    a.user_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    a.current_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    (a.description && a.description.toLowerCase().includes(searchQuery.toLowerCase()))
            )
            setFilteredActivities(filtered)
            setTotal(allData.length)
        } catch (error) {
            console.error("Failed to load activities:", error)
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
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="h-8 w-8 text-green-500" />
                        <h1 className="text-3xl font-bold tracking-tight">Semua Aktivitas</h1>
                    </div>
                    <p className="text-muted-foreground">
                        Lihat dan kelola semua catatan emisi dari seluruh pengguna.
                    </p>
                </div>
                <Button variant="outline" onClick={loadActivities} disabled={loading}>
                    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                </Button>
            </div>

            {/* Search */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Cari berdasarkan User ID, aktivitas, deskripsi, atau hash..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                {searchQuery && (
                    <Button variant="outline" onClick={() => setSearchQuery("")}>
                        Clear
                    </Button>
                )}
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm">
                {searchQuery ? (
                    <>
                        <span className="text-blue-500">
                            Hasil pencarian: <strong>{filteredActivities.length}</strong> dari {total} aktivitas
                        </span>
                        <span className="text-green-500">
                            Valid: <strong>{filteredActivities.filter(a => a.is_valid === true).length}</strong>
                        </span>
                        <span className="text-red-500">
                            Invalid: <strong>{filteredActivities.filter(a => a.is_valid === false).length}</strong>
                        </span>
                    </>
                ) : (
                    <>
                        <span className="text-muted-foreground">
                            Total: <strong className="text-foreground">{total}</strong> aktivitas
                        </span>
                        <span className="text-green-500">
                            Valid: <strong>{filteredActivities.filter(a => a.is_valid === true).length}</strong>
                        </span>
                        <span className="text-red-500">
                            Invalid: <strong>{filteredActivities.filter(a => a.is_valid === false).length}</strong>
                        </span>
                    </>
                )}
            </div>

            {/* Activities Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Daftar Aktivitas</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : filteredActivities.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                            {searchQuery ? "Tidak ada aktivitas yang sesuai dengan pencarian." : "Belum ada aktivitas tercatat."}
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Hash ID</TableHead>
                                    <TableHead>User ID</TableHead>
                                    <TableHead>Aktivitas</TableHead>
                                    <TableHead>Emisi</TableHead>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredActivities.map((activity) => (
                                    <TableRow key={activity.id}>
                                        <TableCell className="font-mono text-xs">
                                            {activity.current_hash.substring(0, 12)}...
                                        </TableCell>
                                        <TableCell className="font-mono text-xs">
                                            {activity.user_id}
                                        </TableCell>
                                        <TableCell>
                                            {activity.description || activity.activity_type}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {activity.emission.toFixed(2)} kg
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">
                                            {formatDate(activity.timestamp)}
                                        </TableCell>
                                        <TableCell>
                                            {activity.is_valid === true ? (
                                                <Badge variant="outline" className="text-green-500 border-green-500/50 bg-green-500/10">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Valid
                                                </Badge>
                                            ) : activity.is_valid === false ? (
                                                <Badge variant="outline" className="text-red-500 border-red-500/50 bg-red-500/10">
                                                    <AlertTriangle className="h-3 w-3 mr-1" />
                                                    Invalid
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary">Unverified</Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Pagination */}
            {!loading && !searchQuery && filteredActivities.length > 0 && (
                <div className="flex items-center justify-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Halaman {page} dari {totalPages}
                    </span>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            )}
        </div>
    )
}
