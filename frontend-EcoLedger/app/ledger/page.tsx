import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { ShieldCheck, Search } from "lucide-react"
import { Input } from "@/components/ui/input"

export default function LedgerPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1 container py-12">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-4">
            <h1 className="text-4xl font-bold tracking-tight">Buku Besar Publik</h1>
            <p className="text-muted-foreground max-w-2xl">
              Lihat seluruh catatan emisi yang telah terverifikasi secara publik. Transparansi total untuk audit
              lingkungan yang mandiri.
            </p>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Cari berdasarkan ID Hash atau Aktivitas..." className="pl-10 h-12" />
          </div>

          <div className="border rounded-xl overflow-hidden">
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
                {[
                  { hash: "h4j8k2l9...", desc: "Konsumsi Energi Domestik", val: "0.45t", date: "25 Des 2025" },
                  { hash: "m1p5q9r2...", desc: "Perjalanan Kereta Api", val: "0.12t", date: "24 Des 2025" },
                  { hash: "z8x7v6b5...", desc: "Penggunaan Air Industri", val: "2.1t", date: "24 Des 2025" },
                  { hash: "y3t2r1e0...", desc: "Transportasi Logistik", val: "0.85t", date: "23 Des 2025" },
                  { hash: "a6s7d8f9...", desc: "Operasional Server", val: "1.2t", date: "23 Des 2025" },
                ].map((row, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-mono text-xs">{row.hash}</TableCell>
                    <TableCell className="font-medium">{row.desc}</TableCell>
                    <TableCell>{row.val} CO2e</TableCell>
                    <TableCell className="text-muted-foreground">{row.date}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className="gap-1 bg-green-500/10 text-green-600 border-green-200">
                        <ShieldCheck className="h-3 w-3" /> Terverifikasi
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  )
}
