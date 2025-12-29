import { Navbar } from "@/components/navbar"
import { Hero } from "@/components/hero"
import { Features } from "@/components/features"
import { DashboardPreview } from "@/components/dashboard-preview"
import { Footer } from "@/components/footer"

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <DashboardPreview />
        <Features />
      </main>
      <Footer />
    </div>
  )
}
