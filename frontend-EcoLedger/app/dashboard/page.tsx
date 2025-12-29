"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { PlusCircle, TrendingDown, Leaf, ShieldCheck, Bell, ArrowUpRight, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { apiClient, ActivityResponse, HashVerificationResponse } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export default function Dashboard() {
  const [activities, setActivities] = useState<ActivityResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [verificationStatus, setVerificationStatus] = useState<HashVerificationResponse | null>(null)
  const [totalEmission, setTotalEmission] = useState(0)
  const { toast } = useToast()

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      // Load activities
      const activitiesData = await apiClient.getActivities({
        user_id: "user123", // TODO: Replace with actual user ID
        page: 1,
        page_size: 5,
      })
      setActivities(activitiesData.activities)

      // Calculate total emission
      const total = activitiesData.activities.reduce((sum, activity) => sum + activity.emission, 0)
      setTotalEmission(total)

      // Verify chain integrity
      const verification = await apiClient.verifyChain()
      setVerificationStatus(verification)
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Gagal memuat data dashboard. Pastikan backend berjalan.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate)
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
  }

  const formatHash = (hash: string) => {
    return hash.substring(0, 6) + "..."
  }

  return (
    <div className="flex flex-col gap-8 max-w-6xl mx-auto">
      {/* Welcome and Notification Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Halo, Selamat Datang Kembali</h1>
          <p className="text-muted-foreground">Berikut adalah ringkasan jejak karbon Anda saat ini.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="icon" className="relative bg-transparent">
            <Bell className="h-4 w-4" />
            {activities.length > 0 && (
              <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-primary" />
            )}
          </Button>
          <Link href="/dashboard/catat-aktivitas">
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Catat Aktivitas
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Emisi</CardTitle>
            <TrendingDown className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">{totalEmission.toFixed(2)} kg CO2e</div>
                <p className="text-xs text-muted-foreground">{activities.length} aktivitas tercatat</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Keamanan Data</CardTitle>
            <ShieldCheck className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Loading...</span>
              </div>
            ) : verificationStatus?.valid ? (
              <>
                <div className="text-2xl font-bold">Aman & Utuh</div>
                <p className="text-xs text-green-500 font-medium">
                  {verificationStatus.total_records} record terverifikasi
                </p>
              </>
            ) : (
              <>
                <div className="text-2xl font-bold text-red-500">Perhatian!</div>
                <p className="text-xs text-red-500 font-medium">Hash chain tidak valid</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Status Backend</CardTitle>
            <Leaf className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-sm text-muted-foreground">Checking...</span>
              </div>
            ) : (
              <>
                <div className="text-2xl font-bold">Online</div>
                <p className="text-xs text-green-500 font-medium">Connected to API</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Reports & Insights Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Riwayat Aktivitas Terakhir</CardTitle>
            <CardDescription>Entri data karbon terbaru yang telah ter-hash secara kriptografis.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : activities.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>Belum ada aktivitas tercatat.</p>
                <p className="text-sm mt-2">Mulai catat aktivitas pertama Anda!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {activity.description || activity.activity_type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Hash ID: {formatHash(activity.current_hash)} • {formatDate(activity.timestamp)}
                      </span>
                    </div>
                    <div className="font-bold text-primary">{activity.emission.toFixed(2)} kg CO2e</div>
                  </div>
                ))}
              </div>
            )}
            <Link href="/dashboard/riwayat" className="block mt-6">
              <Button variant="ghost" className="w-full text-xs gap-2">
                Lihat Semua Riwayat <ArrowUpRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Laporan & Wawasan</CardTitle>
            <CardDescription>Analisis tren emisi dan rekomendasi pengurangan jejak karbon.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
              <h4 className="font-bold text-sm mb-1">Rekomendasi Minggu Ini</h4>
              <p className="text-sm text-muted-foreground">
                Beralih ke penyedia energi terbarukan dapat mengurangi emisi listrik Anda hingga 40%.
              </p>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total Aktivitas</span>
                <span className="font-medium">{activities.length} Aktivitas</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Rata-rata per Aktivitas</span>
                <span className="font-medium">
                  {activities.length > 0 ? (totalEmission / activities.length).toFixed(2) : "0.00"} kg CO2e
                </span>
              </div>
            </div>
            <Link href="/dashboard/riwayat">
              <Button variant="outline" className="w-full bg-transparent">
                Lihat Analisis Lengkap
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
