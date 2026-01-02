"use client"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, LogIn, Leaf, AlertCircle, CheckCircle2, XCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"

export default function LoginPage() {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        email: "",
        password: "",
    })
    const [alert, setAlert] = useState<{
        type: "success" | "error" | "warning" | null;
        title: string;
        message: string;
    }>({ type: null, title: "", message: "" })

    const router = useRouter()
    const { toast } = useToast()

    const showAlert = (type: "success" | "error" | "warning", title: string, message: string) => {
        setAlert({ type, title, message })
        // Auto-hide after 5 seconds for success
        if (type === "success") {
            setTimeout(() => setAlert({ type: null, title: "", message: "" }), 5000)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setAlert({ type: null, title: "", message: "" })

        // Validasi form
        if (!formData.email) {
            showAlert("warning", "Email Diperlukan", "Silakan masukkan alamat email Anda")
            return
        }

        if (!formData.password) {
            showAlert("warning", "Password Diperlukan", "Silakan masukkan password Anda")
            return
        }

        // Validasi format email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        if (!emailRegex.test(formData.email)) {
            showAlert("error", "Email Tidak Valid", "Format email tidak benar. Contoh: nama@email.com")
            return
        }

        setLoading(true)
        try {
            const result = await apiClient.login({
                email: formData.email,
                password: formData.password,
            })

            // Simpan token ke localStorage
            localStorage.setItem("access_token", result.access_token)
            localStorage.setItem("user", JSON.stringify(result.user))

            // Set token ke apiClient
            apiClient.setAuthToken(result.access_token)

            // Show success alert
            showAlert("success", "Login Berhasil! 🎉", `Selamat datang kembali, ${result.user.name}!`)

            // Toast notification
            toast({
                title: "Login Berhasil! 🎉",
                description: `Selamat datang kembali, ${result.user.name}!`,
            })

            // Redirect after short delay
            setTimeout(() => {
                router.push("/dashboard")
            }, 1500)

        } catch (error: any) {
            const errorMessage = error.message || "Email atau password salah"

            showAlert("error", "Login Gagal", errorMessage)

            toast({
                title: "Login Gagal ❌",
                description: errorMessage,
                variant: "destructive",
            })
        } finally {
            setLoading(false)
        }
    }

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
                        <CardTitle className="text-2xl font-bold">Masuk ke EcoLedger</CardTitle>
                        <CardDescription>
                            Masukkan email dan password Anda untuk melanjutkan
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
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="nama@email.com"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    className={alert.type === "warning" && !formData.email ? "border-yellow-500" : ""}
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password">Password</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    className={alert.type === "warning" && !formData.password ? "border-yellow-500" : ""}
                                />
                            </div>

                            <Button type="submit" className="w-full" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Memproses...
                                    </>
                                ) : (
                                    <>
                                        <LogIn className="mr-2 h-4 w-4" />
                                        Masuk
                                    </>
                                )}
                            </Button>
                        </form>

                        <div className="mt-6 text-center text-sm">
                            <span className="text-muted-foreground">Belum punya akun? </span>
                            <Link href="/register" className="text-primary hover:underline font-medium">
                                Daftar sekarang
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            </main>
            <Footer />
        </div>
    )
}
