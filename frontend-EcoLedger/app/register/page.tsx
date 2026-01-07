"use client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, UserPlus, Leaf, AlertCircle, CheckCircle2, XCircle, Eye, EyeOff, Building2 } from "lucide-react"
import { apiClient, OrganisasiResponse } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export default function RegisterPage() {
    const [loading, setLoading] = useState(false)
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [organisasiList, setOrganisasiList] = useState<OrganisasiResponse[]>([])
    const [showOrganisasiDropdown, setShowOrganisasiDropdown] = useState(false)
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        organisasi: "",
        password: "",
        confirmPassword: "",
    })
    const [alert, setAlert] = useState<{
        type: "success" | "error" | "warning" | null;
        title: string;
        message: string;
    }>({ type: null, title: "", message: "" })
    const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({})

    const router = useRouter()
    const { toast } = useToast()

    useEffect(() => {
        loadOrganisasiList()
        
        // Close dropdown when clicking outside
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as HTMLElement
            if (!target.closest('#organisasi-container')) {
                setShowOrganisasiDropdown(false)
            }
        }
        document.addEventListener('click', handleClickOutside)
        return () => document.removeEventListener('click', handleClickOutside)
    }, [])

    const loadOrganisasiList = async () => {
        try {
            const data = await apiClient.getOrganisasiList()
            setOrganisasiList(data)
        } catch (error) {
            console.error('Failed to load organisasi list:', error)
        }
    }

    const showAlert = (type: "success" | "error" | "warning", title: string, message: string) => {
        setAlert({ type, title, message })
        if (type === "success") {
            setTimeout(() => setAlert({ type: null, title: "", message: "" }), 5000)
        }
    }

    const validateForm = (): boolean => {
        const errors: Record<string, boolean> = {}
        let isValid = true

        // Validate name
        if (!formData.name.trim()) {
            errors.name = true
            showAlert("warning", "Nama Diperlukan", "Silakan masukkan nama lengkap Anda")
            isValid = false
        } else if (formData.name.length < 2) {
            errors.name = true
            showAlert("warning", "Nama Terlalu Pendek", "Nama harus minimal 2 karakter")
            isValid = false
        }

        // Validate email
        if (!formData.email) {
            errors.email = true
            if (isValid) showAlert("warning", "Email Diperlukan", "Silakan masukkan alamat email Anda")
            isValid = false
        } else {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            if (!emailRegex.test(formData.email)) {
                errors.email = true
                if (isValid) showAlert("error", "Email Tidak Valid", "Format email tidak benar. Contoh: nama@email.com")
                isValid = false
            }
        }

        // Validate password
        if (!formData.password) {
            errors.password = true
            if (isValid) showAlert("warning", "Password Diperlukan", "Silakan buat password untuk akun Anda")
            isValid = false
        } else if (formData.password.length < 6) {
            errors.password = true
            if (isValid) showAlert("error", "Password Terlalu Pendek", "Password harus minimal 6 karakter untuk keamanan")
            isValid = false
        }

        // Validate confirm password
        if (!formData.confirmPassword) {
            errors.confirmPassword = true
            if (isValid) showAlert("warning", "Konfirmasi Password", "Silakan ulangi password Anda")
            isValid = false
        } else if (formData.password !== formData.confirmPassword) {
            errors.confirmPassword = true
            errors.password = true
            if (isValid) showAlert("error", "Password Tidak Sama", "Password dan konfirmasi password harus sama")
            isValid = false
        }

        setFieldErrors(errors)
        return isValid
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setAlert({ type: null, title: "", message: "" })
        setFieldErrors({})

        if (!validateForm()) {
            return
        }

        setLoading(true)
        try {
            const result = await apiClient.register({
                name: formData.name,
                email: formData.email,
                organisasi: formData.organisasi || undefined,
                password: formData.password,
                role: "user",
            })

            // Simpan token ke localStorage
            localStorage.setItem("access_token", result.access_token)
            localStorage.setItem("user", JSON.stringify(result.user))

            // Set token ke apiClient
            apiClient.setAuthToken(result.access_token)

            // Show success alert
            showAlert("success", "Registrasi Berhasil! 🎉", `Selamat datang di EcoLedger, ${result.user.name}! Akun Anda telah dibuat.`)

            // Toast notification
            toast({
                title: "Registrasi Berhasil! 🎉",
                description: `Selamat datang di EcoLedger, ${result.user.name}!`,
            })

            // Redirect after delay
            setTimeout(() => {
                router.push("/dashboard")
            }, 2000)

        } catch (error: any) {
            const errorMessage = error.message || "Terjadi kesalahan saat mendaftar"

            // Check specific errors
            if (errorMessage.includes("sudah terdaftar") || errorMessage.includes("already")) {
                showAlert("error", "Email Sudah Terdaftar", "Email ini sudah digunakan. Silakan gunakan email lain atau login.")
                setFieldErrors({ email: true })
            } else {
                showAlert("error", "Registrasi Gagal", errorMessage)
            }

            toast({
                title: "Registrasi Gagal ❌",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

    // Password strength indicator
    const getPasswordStrength = () => {
        const password = formData.password
        if (!password) return { level: 0, text: "", color: "" }

        let strength = 0
        if (password.length >= 6) strength++
        if (password.length >= 8) strength++
        if (/[A-Z]/.test(password)) strength++
        if (/[0-9]/.test(password)) strength++
        if (/[^A-Za-z0-9]/.test(password)) strength++

        if (strength <= 1) return { level: 1, text: "Lemah", color: "bg-red-500" }
        if (strength <= 2) return { level: 2, text: "Sedang", color: "bg-yellow-500" }
        if (strength <= 3) return { level: 3, text: "Kuat", color: "bg-blue-500" }
        return { level: 4, text: "Sangat Kuat", color: "bg-green-500" }
    }

    const passwordStrength = getPasswordStrength()

    return (
        <div className="flex min-h-screen flex-col">
            <Navbar />
            <main className="flex-1 flex items-center justify-center py-12 px-4">
                <Card className="w-full max-w-md">
                    <CardHeader className="space-y-1 text-center">
                        <div className="flex justify-center mb-4">
                            <div className="p-3 rounded-full bg-primary/10">
                                <Leaf className="h-8 w-8 text-primary" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Buat Akun EcoLedger</CardTitle>
                        <CardDescription>
                            Mulai lacak jejak karbon Anda dengan membuat akun baru
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {/* Alert Component */}
                        {alert.type && (
                            <Alert
                                variant={alert.type === "error" ? "destructive" : "default"}
                                className={`mb-4 ${alert.type === "success"
                                        ? "border-green-500 bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300"
                                        : alert.type === "warning"
                                            ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-950 text-yellow-700 dark:text-yellow-300"
                                            : ""
                                    }`}
                            >
                                {alert.type === "success" && <CheckCircle2 className="h-4 w-4" />}
                                {alert.type === "error" && <XCircle className="h-4 w-4" />}
                                {alert.type === "warning" && <AlertCircle className="h-4 w-4" />}
                                <AlertTitle>{alert.title}</AlertTitle>
                                <AlertDescription>{alert.message}</AlertDescription>
                            </Alert>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Nama Lengkap</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="John Doe"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className={fieldErrors.name ? "border-red-500 focus:ring-red-500" : ""}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={fieldErrors.email ? "border-red-500 focus:ring-red-500" : ""}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="organisasi">Organisasi/Perusahaan (Opsional)</Label>
                                <div id="organisasi-container" className="relative">
                                    <Input
                                        id="organisasi"
                                        type="text"
                                        placeholder="Pilih atau ketik nama organisasi"
                                        value={formData.organisasi}
                                        onChange={(e) => {
                                            setFormData({ ...formData, organisasi: e.target.value })
                                            setShowOrganisasiDropdown(true)
                                        }}
                                        onFocus={() => setShowOrganisasiDropdown(true)}
                                        className="pr-10"
                                    />
                                    <Building2 className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
                                    
                                    {/* Dropdown List */}
                                    {showOrganisasiDropdown && organisasiList.length > 0 && (
                                        <div className="absolute z-10 w-full mt-1 bg-background border rounded-md shadow-lg max-h-60 overflow-auto">
                                            {organisasiList
                                                .filter(org => 
                                                    org.nama.toLowerCase().includes(formData.organisasi.toLowerCase())
                                                )
                                                .map((org) => (
                                                    <button
                                                        key={org.id}
                                                        type="button"
                                                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between group"
                                                        onClick={() => {
                                                            setFormData({ ...formData, organisasi: org.nama })
                                                            setShowOrganisasiDropdown(false)
                                                        }}
                                                    >
                                                        <span className="font-medium">{org.nama}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {org.jumlah_anggota} anggota
                                                        </span>
                                                    </button>
                                                ))}
                                            {formData.organisasi && 
                                             !organisasiList.some(org => 
                                                org.nama.toLowerCase() === formData.organisasi.toLowerCase()
                                             ) && (
                                                <div className="px-3 py-2 text-sm text-muted-foreground border-t">
                                                    💡 "{formData.organisasi}" akan dibuat sebagai organisasi baru
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Pilih dari organisasi yang ada atau ketik nama baru
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Minimal 6 karakter"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        className={`pr-10 ${fieldErrors.password ? "border-red-500 focus:ring-red-500" : ""}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {/* Password strength indicator */}
                                {formData.password && (
                                    <div className="space-y-1">
                                        <div className="flex gap-1">
                                            {[1, 2, 3, 4].map((level) => (
                                                <div
                                                    key={level}
                                                    className={`h-1 flex-1 rounded-full transition-colors ${level <= passwordStrength.level ? passwordStrength.color : "bg-muted"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className={`text-xs ${passwordStrength.level <= 1 ? "text-red-500" :
                                                passwordStrength.level === 2 ? "text-yellow-500" :
                                                    passwordStrength.level === 3 ? "text-blue-500" : "text-green-500"
                                            }`}>
                                            Kekuatan password: {passwordStrength.text}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Konfirmasi Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Ulangi password Anda"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        className={`pr-10 ${fieldErrors.confirmPassword ? "border-red-500 focus:ring-red-500" : ""}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {/* Password match indicator */}
                                {formData.confirmPassword && (
                                    <p className={`text-xs flex items-center gap-1 ${formData.password === formData.confirmPassword ? "text-green-500" : "text-red-500"
                                        }`}>
                                        {formData.password === formData.confirmPassword ? (
                                            <><CheckCircle2 className="h-3 w-3" /> Password cocok</>
                                        ) : (
                                            <><XCircle className="h-3 w-3" /> Password tidak cocok</>
                                        )}
                                    </p>
                                )}
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Membuat akun...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        Daftar
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-muted-foreground">Sudah punya akun? </span>
                            <Link href="/login" className="text-primary hover:underline font-medium">
                                Masuk di sini
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    )
}
