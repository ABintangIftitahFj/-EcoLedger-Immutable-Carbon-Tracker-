import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Shield, Users, Target, Heart } from "lucide-react"

export default function TentangPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-24 border-b">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center space-y-6">
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-balance">
                Misi Kami untuk Bumi yang Lebih Sehat
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground text-pretty leading-relaxed">
                EcoLedger hadir untuk memberikan transparansi penuh dalam pelacakan emisi karbon. Kami percaya bahwa
                data yang jujur adalah langkah pertama menuju perubahan nyata.
              </p>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-24 border-b">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight text-center mb-16">Nilai-Nilai Kami</h2>
            <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4 max-w-6xl mx-auto">
              <div className="space-y-4 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold">Transparansi</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Semua data terbuka dan dapat diverifikasi kapan saja oleh siapa saja
                </p>
              </div>
              <div className="space-y-4 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                  <Users className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold">Mudah Digunakan</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Interface yang ramah untuk siapa saja, tanpa perlu pengetahuan teknis
                </p>
              </div>
              <div className="space-y-4 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                  <Target className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold">Akurat</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Data yang tercatat tidak bisa diubah, menjamin keakuratan jejak karbon
                </p>
              </div>
              <div className="space-y-4 text-center">
                <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mx-auto">
                  <Heart className="h-8 w-8" />
                </div>
                <h3 className="text-xl font-semibold">Peduli Lingkungan</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Komitmen penuh untuk mendukung SDG 13: Aksi Iklim
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Story Section */}
        <section className="py-24">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto space-y-8">
              <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Cerita Kami</h2>
              <div className="space-y-6 text-muted-foreground text-lg leading-relaxed">
                <p>
                  EcoLedger lahir dari keprihatinan terhadap maraknya greenwashing—klaim lingkungan yang tidak dapat
                  dipertanggungjawabkan. Kami melihat banyak organisasi dan individu yang ingin berkontribusi untuk
                  lingkungan, namun kesulitan memverifikasi dampak nyata dari tindakan mereka.
                </p>
                <p>
                  Dengan menggabungkan teknologi keamanan data tingkat tinggi dan interface yang mudah dipahami, kami
                  menciptakan platform yang membuat setiap orang dapat melacak jejak karbon mereka dengan jujur dan
                  transparan. Setiap data yang masuk tercatat permanen dan dapat diverifikasi kapan saja.
                </p>
                <p>
                  Hari ini, EcoLedger terus berkembang untuk membantu individu dan organisasi di seluruh Indonesia
                  mengambil aksi nyata dalam mengurangi emisi karbon. Karena perubahan dimulai dari transparansi.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
