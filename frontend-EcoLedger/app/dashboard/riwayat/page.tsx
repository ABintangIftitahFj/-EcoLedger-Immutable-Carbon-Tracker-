"use client"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Search, Download, CheckCircle2, Calendar, Loader2, FileText } from "lucide-react"
import { useState, useEffect } from "react"
import { apiClient, ActivityResponse, UserResponse } from "@/lib/api-client"
import { generateActivityPDF } from "@/lib/pdf-generator"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function RiwayatPage() {
  const [activities, setActivities] = useState<ActivityResponse[]>([])
  const [allActivities, setAllActivities] = useState<ActivityResponse[]>([]) // For PDF export
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [searchQuery, setSearchQuery] = useState("")
  const [total, setTotal] = useState(0)
  const [user, setUser] = useState<UserResponse | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  const PAGE_SIZE = 10

  // Get user from localStorage and setup API token
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("access_token")
    
    if (!storedUser || !token) {
      router.push("/login")
      return
    }

    try {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      apiClient.setAuthToken(token)
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/login")
    }
  }, [router])

  useEffect(() => {
    if (user) {
      loadActivities()
    }
  }, [page, user])

  const loadActivities = async () => {
    if (!user?.id) return
    
    setLoading(true)
    try {
      const result = await apiClient.getActivities({
        user_id: user.id,
        page: page,
        page_size: PAGE_SIZE,
      })

      setActivities(result.activities)
      setTotal(result.total)
      setTotalPages(Math.ceil(result.total / PAGE_SIZE))
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat riwayat aktivitas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = () => {
    // Filter activities based on search query
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

  const handleExportPDF = async () => {
    if (!user?.id) return
    
    setExporting(true)
    try {
      toast({
        title: "Memuat data...",
        description: "Mengambil semua aktivitas untuk export PDF",
      })

      // Load all activities with pagination (max 100 per request)
      let allActivitiesForExport: ActivityResponse[] = []
      let currentPage = 1
      const pageSize = 100 // Max allowed by backend
      let hasMore = true

      while (hasMore) {
        const result = await apiClient.getActivities({
          user_id: user.id,
          page: currentPage,
          page_size: pageSize,
        })

        allActivitiesForExport = [...allActivitiesForExport, ...result.activities]

        // Check if there are more pages
        hasMore = result.activities.length === pageSize && currentPage * pageSize < result.total
        currentPage++

        // Safety limit to prevent infinite loop
        if (currentPage > 50) break
      }

      if (allActivitiesForExport.length === 0) {
        toast({
          title: "Tidak ada data",
          description: "Belum ada aktivitas untuk diexport",
          variant: "destructive",
        })
        return
      }

      const totalEmission = allActivitiesForExport.reduce(
        (sum, activity) => sum + activity.emission,
        0
      )

      // Generate PDF
      const filename = generateActivityPDF({
        activities: allActivitiesForExport,
        totalEmission,
        userId: user.id,
        dateRange: `Total ${allActivitiesForExport.length} aktivitas`
      })

      toast({
        title: "Export Berhasil! 🎉",
        description: `File ${filename} telah didownload`,
      })
    } catch (error: any) {
      toast({
        title: "Export Gagal",
        description: error.message || "Terjadi kesalahan saat export PDF",
        variant: "destructive",
      })
    } finally {
      setExporting(false)
    }
  }

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryName = (activityType: string): string => {
    if (activityType.includes("car") || activityType.includes("motorbike") ||
      activityType.includes("bus") || activityType.includes("train") ||
      activityType.includes("flight")) {
      return "Transportasi"
    }
    if (activityType.includes("electricity") || activityType.includes("gas")) {
      return "Energi"
    }
    return "Lainnya"
  }

  const getActivityDetails = (activity: ActivityResponse): string => {
    if (activity.distance_km) return `Jarak: ${activity.distance_km} km`
    if (activity.energy_kwh) return `Energi: ${activity.energy_kwh} kWh`
    if (activity.weight_kg) return `Berat: ${activity.weight_kg} kg`
    if (activity.money_spent) return `Biaya: $${activity.money_spent}`
    return "Tidak ada detail"
  }

  // Show loading while user data is being loaded
  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Riwayat Aktivitas</h1>
          <p className="text-muted-foreground">
            Semua catatan emisi karbon Anda yang telah terverifikasi dengan hash chain.
          </p>
        </div>
        <Button
          variant="outline"
          className="gap-2 bg-transparent"
          onClick={handleExportPDF}
          disabled={exporting || loading || total === 0}
        >
          {exporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Mengexport...
            </>
          ) : (
            <>
              <FileText className="h-4 w-4" />
              Ekspor Laporan PDF
            </>
          )}
        </Button>
      </div>

      {/* Filter & Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                placeholder="Cari berdasarkan kategori atau Hash ID..."
                className="w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>
            <Button onClick={handleSearch}>
              <Search className="h-4 w-4 mr-2" />
              Cari
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Activity List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : activities.length === 0 ? (
        <Card>
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <p className="text-lg font-semibold mb-2">Belum ada aktivitas tercatat</p>
              <p className="text-sm">Mulai catat aktivitas pertama Anda untuk melacak jejak karbon!</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <Card key={activity.id} className="hover:border-primary/50 transition-colors">
              <CardHeader>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="space-y-3 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="secondary">{getCategoryName(activity.activity_type)}</Badge>
                      {activity.is_valid === true ? (
                        <Badge variant="outline" className="gap-1 text-green-600 border-green-500/50 bg-green-500/10">
                          <CheckCircle2 className="h-3 w-3" />
                          VALID
                        </Badge>
                      ) : activity.is_valid === false ? (
                        <Badge variant="outline" className="gap-1 text-red-600 border-red-500/50 bg-red-500/10">
                          <span className="h-3 w-3">⚠️</span>
                          INVALID
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="gap-1 text-yellow-600 border-yellow-500/50 bg-yellow-500/10">
                          <span className="h-3 w-3">⏳</span>
                          Unverified
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">
                      {activity.description || activity.activity_type}
                    </CardTitle>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{formatDate(activity.timestamp)}</span>
                      </div>
                      <span className="font-mono text-xs">
                        Hash ID: {activity.current_hash.substring(0, 16)}...
                      </span>
                      <span>{getActivityDetails(activity)}</span>
                    </div>
                  </div>
                  <div className="text-3xl font-bold text-primary">
                    {activity.emission.toFixed(2)} kg CO2e
                  </div>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      )}

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
            Menampilkan {((page - 1) * PAGE_SIZE) + 1}-{Math.min(page * PAGE_SIZE, total)} dari {total} catatan aktivitas
          </div>
        </div>
      )}
    </div>
  )
}
