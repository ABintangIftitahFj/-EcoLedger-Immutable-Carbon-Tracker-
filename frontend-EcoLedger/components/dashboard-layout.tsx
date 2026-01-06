"use client"

import type React from "react"
import { Navbar } from "@/components/navbar"
import { LayoutDashboard, History, Settings, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { apiClient } from "@/lib/api-client"

export function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()

  const handleLogout = () => {
    const confirmed = window.confirm(
      'Apakah Anda yakin ingin keluar?\n\nAnda perlu login kembali untuk mengakses dashboard.'
    )
    
    if (!confirmed) return

    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
    apiClient.setAuthToken(null)
    router.push("/")
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      <Navbar />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Statis */}
        <aside className="hidden w-64 flex-col border-r bg-muted/30 md:flex">
          <nav className="flex-1 space-y-1 p-4">
            <Link href="/dashboard">
              <Button variant="ghost" className="w-full justify-start gap-3">
                <LayoutDashboard className="h-4 w-4" />
                Ringkasan
              </Button>
            </Link>
            <Link href="/dashboard/riwayat">
              <Button variant="ghost" className="w-full justify-start gap-3">
                <History className="h-4 w-4" />
                Riwayat
              </Button>
            </Link>
            <Link href="/dashboard/pengaturan">
              <Button variant="ghost" className="w-full justify-start gap-3">
                <Settings className="h-4 w-4" />
                Pengaturan
              </Button>
            </Link>
          </nav>
          <div className="p-4 border-t">
            <Button 
              variant="ghost" 
              onClick={handleLogout}
              className="w-full justify-start gap-3 text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </Button>
          </div>
        </aside>

        {/* Konten Utama yang dapat di-scroll */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 scrollbar-thin scrollbar-thumb-primary/10 scrollbar-track-transparent">
          {children}
        </main>
      </div>
    </div>
  )
}
