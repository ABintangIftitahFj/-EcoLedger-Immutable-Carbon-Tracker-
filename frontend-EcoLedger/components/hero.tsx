import { Button } from "@/components/ui/button"
import { ShieldCheck, ArrowRight } from "lucide-react"
import Link from "next/link"

export function Hero() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden border-b">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(16,185,129,0.1),transparent_70%)] animate-pulse pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/20 to-transparent" />

      <div className="container mx-auto px-4 md:px-8 relative text-center md:text-left">
        <div className="max-w-4xl mx-auto md:mx-0 space-y-10">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary animate-in fade-in slide-in-from-top-4 duration-1000">
            <ShieldCheck className="h-4 w-4" />
            <span>Sistem Pelacakan Terverifikasi</span>
          </div>
          <h1 className="text-5xl md:text-8xl font-extrabold tracking-tight text-balance leading-[1.1] animate-in fade-in slide-in-from-bottom-4 duration-700">
            Kelola dan Lacak Emisi Karbon Anda secara <span className="text-primary italic">Akurat</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground text-pretty max-w-2xl leading-relaxed animate-in fade-in slide-in-from-bottom-6 duration-1000">
            EcoLedger menyediakan platform pencatatan emisi karbon untuk memantau dampak lingkungan dari setiap
            aktivitas Anda secara sistematis.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center md:justify-start animate-in fade-in slide-in-from-bottom-8 duration-1000">
            <Link href="/dashboard">
              <Button size="lg" className="h-12 px-8 text-base">
                Mulai Melacak Sekarang <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/buku-besar">
              <Button size="lg" variant="outline" className="h-12 px-8 text-base border-border/50 bg-transparent">
                Lihat Buku Besar Publik
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
