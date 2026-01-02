"use client"

import type React from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Leaf, Menu, User, X, LogOut } from "lucide-react"
import { useState, useEffect } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { useRouter, usePathname } from "next/navigation"
import { UserResponse } from "@/lib/api-client"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [user, setUser] = useState<UserResponse | null>(null)
  const router = useRouter()
  const pathname = usePathname()

  // Check if user is logged in
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser))
      } catch {
        setUser(null)
      }
    }
  }, [pathname]) // Re-check when pathname changes

  const handleLogout = () => {
    localStorage.removeItem("access_token")
    localStorage.removeItem("user")
    apiClient.setAuthToken(null)
    setUser(null)
    router.push("/")
  }

  const handleBerandaClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setIsMenuOpen(false)

    if (pathname !== "/") {
      router.push("/")
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" })
      window.history.pushState(null, "", "/")
    }
  }

  const handleKeunggulanClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault()
    setIsMenuOpen(false)

    if (pathname !== "/") {
      router.push("/#keunggulan")
    } else {
      const element = document.getElementById("keunggulan")
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
        window.history.pushState(null, "", "#keunggulan")
      }
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-8 flex h-16 items-center justify-between">
        <div className="flex items-center gap-2">
          <Link
            href="/"
            onClick={handleBerandaClick}
            className="flex items-center gap-2 transition-transform hover:scale-105"
          >
            <Leaf className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold tracking-tight">EcoLedger</span>
          </Link>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          <a
            href="/"
            onClick={handleBerandaClick}
            className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
          >
            Beranda
          </a>
          <a
            href="/#keunggulan"
            onClick={handleKeunggulanClick}
            className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
          >
            Keunggulan
          </a>
          <Link href="/ledger" className="text-sm font-medium transition-colors hover:text-primary">
            Buku Besar Publik
          </Link>
          <Link href="/global-emissions" className="text-sm font-medium transition-colors hover:text-primary">
            🌍 Global Emissions
          </Link>
          <Link href="/tentang" className="text-sm font-medium transition-colors hover:text-primary">
            Tentang Kami
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <ModeToggle />
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          {/* Auth buttons */}
          {user ? (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/dashboard">
                <Button variant="outline" size="sm" className="gap-2 bg-transparent">
                  <User className="h-4 w-4" />
                  {user.name}
                  {user.role === "admin" && (
                    <span className="text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded">Admin</span>
                  )}
                </Button>
              </Link>
              <Button variant="ghost" size="sm" onClick={handleLogout} className="gap-1">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link href="/login">
                <Button variant="ghost" size="sm">
                  Masuk
                </Button>
              </Link>
              <Link href="/register">
                <Button size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  Daftar
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden border-t bg-background">
          <nav className="container flex flex-col py-4 space-y-4">
            <Link
              href="/"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Beranda
            </Link>
            <a
              href="/#keunggulan"
              onClick={handleKeunggulanClick}
              className="text-sm font-medium transition-colors hover:text-primary cursor-pointer"
            >
              Keunggulan
            </a>
            <Link
              href="/ledger"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Buku Besar Publik
            </Link>
            <Link
              href="/tentang"
              className="text-sm font-medium transition-colors hover:text-primary"
              onClick={() => setIsMenuOpen(false)}
            >
              Tentang Kami
            </Link>

            {/* Mobile auth */}
            {user ? (
              <>
                <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                    <User className="h-4 w-4" />
                    {user.name}
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full gap-2">
                  <LogOut className="h-4 w-4" />
                  Keluar
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" onClick={() => setIsMenuOpen(false)}>
                  <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                    Masuk
                  </Button>
                </Link>
                <Link href="/register" onClick={() => setIsMenuOpen(false)}>
                  <Button size="sm" className="w-full gap-2">
                    <User className="h-4 w-4" />
                    Daftar
                  </Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
