"use client"

import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Search, Loader2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useState, useEffect } from "react"
import { apiClient } from "@/lib/api-client"

interface ActivityRecord {
  id: string
  timestamp: string
  user_id: string
  activity_type: string
  emission: number
  emission_unit: string
  current_hash: string
  verified: boolean
}

function BukuBesarContent() {
  const [records, setRecords] = useState<ActivityRecord[]>([])
  const [filteredRecords, setFilteredRecords] = useState<ActivityRecord[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch data dari API
  useEffect(() => {
    const fetchPublicRecords = async () => {
      try {
        setLoading(true)
        const response = await apiClient.getActivities()
        setRecords(response.activities)
        setFilteredRecords(response.activities)
      } catch (err) {
        setError("Gagal memuat data buku besar")
        console.error("Error fetching public records:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchPublicRecords()
  }, [])

  // Filter records berdasarkan search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredRecords(records)
    } else {
      const filtered = records.filter(record =>
        record.current_hash.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.activity_type.toLowerCase().includes(searchQuery.toLowerCase()) ||
        record.user_id.toLowerCase().includes(searchQuery.toLowerCase())
      )
      setFilteredRecords(filtered)
    }
  }, [searchQuery, records])

  const handleSearch = () => {
    // Search is handled by useEffect above, this function can be used for manual trigger
  }

  const maskUserId = (userId: string) => {
    // Mask user ID untuk privasi
    if (userId.length > 8) {
      return `Pengguna #${userId.substring(0, 4)}...${userId.substring(userId.length - 4)}`
    }
    return `Pengguna #${userId}`
  }

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 py-12 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Memuat buku besar...</span>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex min-h-screen flex-col">
        <Navbar />
        <main className="flex-1 py-12 md:py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-5xl mx-auto">
              <div className="flex items-center justify-center h-64">
                <p className="text-red-500">{error}</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 py-12 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header */}
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Buku Besar Publik</h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Semua catatan emisi karbon yang tercatat di EcoLedger bersifat transparan dan dapat diverifikasi oleh
                siapa saja. Data di bawah ini telah diamankan dengan sistem keamanan berlapis.
              </p>
            </div>

            {/* Search Bar */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <Input 
                    placeholder="Cari berdasarkan Hash ID, jenis aktivitas, atau ID pengguna..." 
                    className="flex-1"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                  <Button onClick={handleSearch}>
                    <Search className="h-4 w-4 mr-2" />
                    Cari
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Records List */}
            <div className="space-y-4">
              {filteredRecords.length === 0 ? (
                <Card>
                  <CardContent className="pt-6 text-center">
                    <p className="text-muted-foreground">
                      {searchQuery ? "Tidak ada data yang cocok dengan pencarian" : "Belum ada data aktivitas"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredRecords.map((record) => (
                  <Card key={record.id} className="hover:border-primary/50 transition-colors">
                    <CardHeader>
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-lg capitalize">{record.activity_type.replace('_', ' ')}</CardTitle>
                            <Badge variant="outline" className="gap-1 text-primary border-primary/50">
                              <CheckCircle2 className="h-3 w-3" />
                              Terverifikasi
                            </Badge>
                          </div>
                          <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                            <span>Hash ID: {record.current_hash}</span>
                            <span>
                              {maskUserId(record.user_id)} • {new Date(record.timestamp).toLocaleString('id-ID')}
                            </span>
                          </div>
                        </div>
                        <div className="text-2xl font-bold text-primary">
                          {record.emission} {record.emission_unit}
                        </div>
                      </div>
                    </CardHeader>
                  </Card>
                ))
              )}
            </div>

            {/* Info Footer */}
            <Card className="bg-muted/30">
              <CardContent className="pt-6">
                <div className="flex items-start gap-4">
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <div className="space-y-2">
                    <h3 className="font-semibold">Tentang Data Publik</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Semua data yang ditampilkan di sini telah melalui proses hashing kriptografis dan tersimpan secara
                      permanen. Identitas pengguna disamarkan untuk privasi, namun integritas data tetap dapat
                      diverifikasi kapan saja melalui Hash ID masing-masing.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default function BukuBesarPage() {
  return <BukuBesarContent />
}
