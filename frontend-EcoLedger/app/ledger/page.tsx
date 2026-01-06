"use client"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, ShieldAlert, Clock, Search, Loader2, RefreshCw } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { apiClient, ActivityResponse } from "@/lib/api-client"

export default function LedgerPage() {
  const [activities, setActivities] = useState<ActivityResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const PAGE_SIZE = 10

  useEffect(() => {
    loadActivities()
  }, [page])

  const loadActivities = async () => {
    setLoading(true)
    try {
      // Get all activities (public ledger - no user filter)
      const result = await apiClient.getActivities({
        page: page,
        page_size: PAGE_SIZE,
      })

      setActivities(result.activities)
      setTotal(result.total)
      setTotalPages(Math.ceil(result.total / PAGE_SIZE))
    } catch (error: any) {
      console.error("Failed to load activities:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    if (searchQuery) {
      const filtered = activities.filter(
        (activity) =>
          activity.activity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.current_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
          activity.description?.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setActivities(filtered)
    } else {
      loadActivities()
    }
  }

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    })
  }

  const formatEmission = (emission: number): string => {
    if (emission >= 1000) {
      return `${(emission / 1000).toFixed(2)}t`
    }
    return `${emission.toFixed(2)}kg`
  }

  const getStatusBadge = (activity: ActivityResponse) => {
    if (activity.is_valid === true) {
      return (
        <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-200">
          <ShieldCheck className="h-3 w-3" />
          VALID
        </Badge>
      )
    } else if (activity.is_valid === false) {
      return (
        <Badge variant="outline" className="gap-1 bg-red-500/10 text-red-600 border-red-200">
          <ShieldAlert className="h-3 w-3" />
          INVALID
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="gap-1 bg-yellow-500/10 text-yellow-600 border-yellow-200">
          <Clock className="h-3 w-3" />
          Unverified
        </Badge>
      )
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-12">
        <div className="flex flex-col gap-8 max-w-5xl mx-auto w-full">
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-4xl font-bold tracking-tight">Buku Besar Publik</h1>
                <p className="text-muted-foreground max-w-2xl mt-2">
                  Lihat seluruh catatan emisi yang telah terverifikasi secara publik. Transparansi total untuk audit
                  lingkungan yang mandiri.
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={loadActivities}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-4 text-sm text-muted-foreground">
              <span>Total Catatan: <strong className="text-foreground">{total}</strong></span>
              <span>•</span>
              <span>Hash Chain Verified</span>
            </div>
          </div>

          {/* Search */}
          <div className="relative flex gap-2 max-w-5xl mx-auto w-full">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Cari berdasarkan ID Hash atau Aktivitas..."
                className="pl-10 h-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch} className="h-12">
              Cari
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-xl overflow-hidden max-w-5xl mx-auto w-full">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Hash ID</TableHead>
                  <TableHead>Aktivitas</TableHead>
                  <TableHead>Nilai Emisi</TableHead>
                  <TableHead>Tanggal</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        <span>Memuat data dari blockchain...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : activities.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                      Belum ada catatan aktivitas dalam buku besar publik.
                    </TableCell>
                  </TableRow>
                ) : (
                  activities.map((activity) => (
                    <TableRow key={activity.id}>
                      <TableCell className="font-mono text-xs">
                        {activity.current_hash.substring(0, 12)}...
                      </TableCell>
                      <TableCell className="font-medium">
                        {activity.description || activity.activity_type}
                      </TableCell>
                      <TableCell>
                        {formatEmission(activity.emission)} CO2e
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {formatDate(activity.timestamp)}
                      </TableCell>
                      <TableCell className="text-right">
                        {getStatusBadge(activity)}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {!loading && activities.length > 0 && (
            <div className="flex flex-col items-center gap-4 mt-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = i + 1
                    return (
                      <Button
                        key={pageNum}
                        variant={page === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setPage(pageNum)}
                      >
                        {pageNum}
                      </Button>
                    )
                  })}
                  {totalPages > 5 && <span className="text-muted-foreground">...</span>}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  Next
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                Menampilkan {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, total)} dari {total} catatan
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
