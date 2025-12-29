"use client"

import type React from "react"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Leaf, Menu, User, X } from "lucide-react"
import { useState } from "react"
import { ModeToggle } from "@/components/mode-toggle"
import { useRouter, usePathname } from "next/navigation"

export function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

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
        // Update URL hash tanpa reload
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
          <Link href="/buku-besar" className="text-sm font-medium transition-colors hover:text-primary">
            Buku Besar Publik
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
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className="hidden md:flex gap-2 bg-transparent">
              <User className="h-4 w-4" />
              Masuk
            </Button>
          </Link>
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
              href="/buku-besar"
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
            <Link href="/dashboard" onClick={() => setIsMenuOpen(false)}>
              <Button variant="outline" size="sm" className="w-full gap-2 bg-transparent">
                <User className="h-4 w-4" />
                Masuk
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  )
}
