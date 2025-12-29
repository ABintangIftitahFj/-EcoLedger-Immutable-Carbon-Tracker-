import { Leaf, Github, Twitter, Linkedin } from "lucide-react"
import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t bg-card py-12 md:py-24">
      <div className="container mx-auto px-4 md:px-8">
        <div className="grid gap-12 md:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-6 w-6 text-primary" />
              <span className="text-xl font-bold tracking-tight">EcoLedger</span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Memajukan SDG 13 (Aksi Iklim) melalui integritas data yang tidak terubah dan akuntansi karbon yang
              transparan.
            </p>
            <div className="flex gap-4">
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Github className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Twitter className="h-5 w-5" />
              </Link>
              <Link href="#" className="text-muted-foreground hover:text-primary transition-colors">
                <Linkedin className="h-5 w-5" />
              </Link>
            </div>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-primary">Produk</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <Link href="/#features" className="hover:text-primary transition-colors">
                  Cara Kerja
                </Link>
              </li>
              <li>
                <Link href="/tentang" className="hover:text-primary transition-colors">
                  Model Keamanan
                </Link>
              </li>
              <li>
                <Link href="/buku-besar" className="hover:text-primary transition-colors">
                  Buku Besar Publik
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-primary transition-colors">
                  Mulai Melacak
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-primary">Perusahaan</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <Link href="/tentang" className="hover:text-primary transition-colors">
                  Tentang Kami
                </Link>
              </li>
              <li>
                <Link href="/tentang" className="hover:text-primary transition-colors">
                  Keberlanjutan
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Karir
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Kontak
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-sm uppercase tracking-widest text-primary">Legal</h4>
            <ul className="space-y-4 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  Cookie Policy
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary transition-colors">
                  GDPR
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-24 pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
          <p>© 2025 EcoLedger. Hak cipta dilindungi undang-undang.</p>
          <div className="flex gap-8">
            <Link href="#" className="hover:text-primary transition-colors">
              Status Sistem
            </Link>
            <Link href="#" className="hover:text-primary transition-colors">
              Pusat Kepercayaan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
