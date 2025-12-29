import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle2, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Suspense } from "react"

function BukuBesarContent() {
  const publicRecords = [
    {
      id: "h4j8k2l9m3n1p5q7",
      timestamp: "2025-12-24 14:32:15",
      user: "Pengguna #1234",
      activity: "Penggunaan Listrik Kantor",
      amount: "1.2t CO2",
      verified: true,
    },
    {
      id: "k9l2m4n6p8q1r3s5",
      timestamp: "2025-12-24 10:15:42",
      user: "Organisasi #5678",
      activity: "Logistik Pengiriman Nasional",
      amount: "4.8t CO2",
      verified: true,
    },
    {
      id: "m1p5q7r9s2t4v6w8",
      timestamp: "2025-12-23 16:48:23",
      user: "Pengguna #9012",
      activity: "Perjalanan Bisnis Jakarta-Surabaya",
      amount: "0.4t CO2",
      verified: true,
    },
    {
      id: "n3q7r1s5t9v2w6x0",
      timestamp: "2025-12-23 08:20:11",
      user: "Organisasi #3456",
      activity: "Operasional Pabrik Harian",
      amount: "12.3t CO2",
      verified: true,
    },
    {
      id: "p5r9s3t7v1w5x9y2",
      timestamp: "2025-12-22 19:55:37",
      user: "Pengguna #7890",
      activity: "Konsumsi Energi Rumah Tangga",
      amount: "0.3t CO2",
      verified: true,
    },
  ]

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
                  <Input placeholder="Cari berdasarkan Hash ID atau pengguna..." className="flex-1" />
                  <Button>
                    <Search className="h-4 w-4 mr-2" />
                    Cari
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Records List */}
            <div className="space-y-4">
              {publicRecords.map((record) => (
                <Card key={record.id} className="hover:border-primary/50 transition-colors">
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{record.activity}</CardTitle>
                          {record.verified && (
                            <Badge variant="outline" className="gap-1 text-primary border-primary/50">
                              <CheckCircle2 className="h-3 w-3" />
                              Terverifikasi
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                          <span>Hash ID: {record.id}</span>
                          <span>
                            {record.user} • {record.timestamp}
                          </span>
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-primary">{record.amount}</div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
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
  return (
    <Suspense fallback={null}>
      <BukuBesarContent />
    </Suspense>
  )
}
