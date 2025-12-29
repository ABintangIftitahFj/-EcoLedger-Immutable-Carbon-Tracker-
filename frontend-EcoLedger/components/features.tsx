import { Shield, Database, BarChart3, Lock, RefreshCcw, FileText } from "lucide-react"

const features = [
  {
    title: "Catatan Permanen",
    description:
      "Setiap data emisi yang masuk tersimpan secara permanen dan tidak dapat diubah, memastikan integritas riwayat pelacakan Anda.",
    icon: Shield,
  },
  {
    title: "Kategori Aktivitas Luas",
    description:
      "Catat berbagai aktivitas mulai dari penggunaan transportasi, konsumsi listrik, hingga limbah operasional dalam satu sistem.",
    icon: Database,
  },
  {
    title: "Visualisasi Dampak",
    description:
      "Pantau tren emisi harian dan bulanan melalui grafik interaktif untuk membantu Anda menentukan langkah pengurangan karbon.",
    icon: BarChart3,
  },
  {
    title: "Keamanan Data Berlapis",
    description:
      "Data Anda dilindungi dengan enkripsi standar industri untuk menjaga privasi informasi aktivitas lingkungan organisasi atau pribadi.",
    icon: Lock,
  },
  {
    title: "Audit Transparan",
    description:
      "Sistem verifikasi otomatis memastikan seluruh riwayat data sinkron dan valid, memudahkan proses peninjauan kapan saja.",
    icon: RefreshCcw,
  },
  {
    title: "Laporan Siap Pakai",
    description:
      "Ekspor riwayat aktivitas Anda ke format PDF atau CSV untuk keperluan laporan internal maupun pemenuhan regulasi lingkungan.",
    icon: FileText,
  },
]

export function Features() {
  return (
    <section id="keunggulan" className="py-24 border-b">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16 space-y-4">
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Kenapa Memilih EcoLedger?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            Kami menghadirkan teknologi keamanan tingkat tinggi ke dalam genggaman Anda untuk mewujudkan laporan emisi
            yang jujur dan transparan.
          </p>
        </div>
        <div className="grid gap-12 md:grid-cols-3">
          {features.map((feature, index) => (
            <div
              key={index}
              className="space-y-4 group p-6 rounded-2xl transition-all duration-300 hover:bg-muted/50 hover:shadow-2xl hover:-translate-y-1"
            >
              <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                <feature.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
