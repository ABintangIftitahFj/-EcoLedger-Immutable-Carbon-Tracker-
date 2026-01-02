"use client"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Sparkles, Calculator, Loader2 } from "lucide-react"
import Link from "next/link"
import { useState, useEffect } from "react"
import { apiClient, ActivityTypesResponse, UserResponse } from "@/lib/api-client"
import { useToast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export default function CatatAktivitasPage() {
  const [showCalculator, setShowCalculator] = useState(false)
  const [activityTypes, setActivityTypes] = useState<ActivityTypesResponse | null>(null)
  const [selectedActivityType, setSelectedActivityType] = useState("")
  const [loading, setLoading] = useState(false)
  const [estimating, setEstimating] = useState(false)
  const [user, setUser] = useState<UserResponse | null>(null)
  const { toast } = useToast()
  const router = useRouter()

  // Form state
  const [formData, setFormData] = useState({
    activity_type: "",
    distance_km: "",
    energy_kwh: "",
    weight_kg: "",
    money_spent: "",
    description: "",
  })

  // Get user from localStorage and setup API token
  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    const token = localStorage.getItem("access_token")
    
    if (!storedUser || !token) {
      router.push("/login")
      return
    }

    try {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      apiClient.setAuthToken(token)
    } catch (error) {
      console.error("Error parsing user data:", error)
      router.push("/login")
    }
  }, [router])

  // Estimation result
  const [estimatedEmission, setEstimatedEmission] = useState<number | null>(null)

  // Load activity types on mount
  useEffect(() => {
    if (user) {
      loadActivityTypes()
    }
  }, [user])

  const loadActivityTypes = async () => {
    try {
      const types = await apiClient.getActivityTypes()
      setActivityTypes(types)
    } catch (error) {
      toast({
        title: "Error",
        description: "Gagal memuat tipe aktivitas. Pastikan backend berjalan.",
        variant: "destructive",
      })
    }
  }

  const handleEstimate = async () => {
    if (!formData.activity_type) {
      toast({
        title: "Peringatan",
        description: "Pilih tipe aktivitas terlebih dahulu",
        variant: "destructive",
      })
      return
    }

    setEstimating(true)
    try {
      const result = await apiClient.estimateEmission({
        activity_type: formData.activity_type,
        distance_km: formData.distance_km ? parseFloat(formData.distance_km) : undefined,
        energy_kwh: formData.energy_kwh ? parseFloat(formData.energy_kwh) : undefined,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        money_spent: formData.money_spent ? parseFloat(formData.money_spent) : undefined,
      })
      
      setEstimatedEmission(result.emission)
      toast({
        title: "Estimasi Berhasil",
        description: `Emisi diperkirakan: ${result.emission.toFixed(2)} ${result.emission_unit}`,
      })
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal mengestimasi emisi",
        variant: "destructive",
      })
    } finally {
      setEstimating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.activity_type) {
      toast({
        title: "Peringatan",
        description: "Pilih tipe aktivitas terlebih dahulu",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const result = await apiClient.createActivity({
        activity_type: formData.activity_type,
        distance_km: formData.distance_km ? parseFloat(formData.distance_km) : undefined,
        energy_kwh: formData.energy_kwh ? parseFloat(formData.energy_kwh) : undefined,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        money_spent: formData.money_spent ? parseFloat(formData.money_spent) : undefined,
        description: formData.description || undefined,
      })

      toast({
        title: "Berhasil!",
        description: `Aktivitas tersimpan dengan emisi ${result.emission.toFixed(2)} ${result.emission_unit}`,
      })

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Gagal menyimpan aktivitas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Get parameter type based on activity
  const getParameterType = (activityType: string): string => {
    if (!activityType) return ""
    
    // Transport activities need distance
    if (activityType.includes("car") || activityType.includes("motorbike") || 
        activityType.includes("bus") || activityType.includes("train") || 
        activityType.includes("flight")) {
      return "distance"
    }
    
    // Energy activities need energy_kwh
    if (activityType.includes("electricity") || activityType.includes("gas")) {
      return "energy"
    }
    
    return "distance" // default
  }

  const paramType = getParameterType(formData.activity_type)

  // Show loading while user data is being loaded
  if (!user) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Catat Aktivitas Baru</h1>
        <p className="text-muted-foreground">Tambahkan aktivitas yang menghasilkan emisi karbon untuk dilacak.</p>
      </div>

      <div className="grid gap-6">
        {/* AI Estimation / Calculator Toggle */}
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-2 text-primary">
              <Sparkles className="h-5 w-5" />
              <CardTitle className="text-lg">Estimasi Emisi Terlebih Dahulu?</CardTitle>
            </div>
            <CardDescription>
              Gunakan kalkulator untuk mendapatkan perkiraan emisi sebelum menyimpan data.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              className="w-full gap-2 border-primary/30 hover:bg-primary/10 bg-transparent"
              onClick={() => setShowCalculator(!showCalculator)}
            >
              <Calculator className="h-4 w-4" />
              {showCalculator ? "Sembunyikan Kalkulator" : "Buka Kalkulator Emisi"}
            </Button>
          </CardContent>
        </Card>

        {showCalculator && estimatedEmission !== null && (
          <Card className="animate-in fade-in slide-in-from-top-4 duration-300 border-green-500/50 bg-green-50 dark:bg-green-950/20">
            <CardContent className="pt-6">
              <div className="text-center space-y-2">
                <p className="text-sm text-muted-foreground">Hasil Estimasi:</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {estimatedEmission.toFixed(3)} kg CO2e
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Informasi Aktivitas</CardTitle>
            <CardDescription>Isi formulir di bawah ini. Data akan diamankan dengan hash chain secara otomatis.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Activity Type Selection */}
              <div className="space-y-2">
                <Label htmlFor="activity_type">Tipe Aktivitas *</Label>
                <select
                  id="activity_type"
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  value={formData.activity_type}
                  onChange={(e) => {
                    setFormData({ ...formData, activity_type: e.target.value })
                    setEstimatedEmission(null) // Reset estimation
                  }}
                  required
                >
                  <option value="">Pilih tipe aktivitas...</option>
                  {activityTypes?.categories.transportasi && (
                    <optgroup label="🚗 Transportasi">
                      {activityTypes.categories.transportasi.activities.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </optgroup>
                  )}
                  {/* Energi dihapus karena tidak supported oleh Climatiq API */}
                </select>
                {activityTypes?.categories.energi && activityTypes.categories.energi.count > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    ⚠️ Kategori energi sementara tidak tersedia
                  </p>
                )}
              </div>

              {/* Dynamic Parameter Input */}
              {paramType === "distance" && (
                <div className="space-y-2">
                  <Label htmlFor="distance_km">Jarak (kilometer) *</Label>
                  <Input
                    id="distance_km"
                    type="number"
                    step="0.01"
                    placeholder="Contoh: 25.5"
                    value={formData.distance_km}
                    onChange={(e) => setFormData({ ...formData, distance_km: e.target.value })}
                    required
                  />
                </div>
              )}

              {paramType === "energy" && (
                <div className="space-y-2">
                  <Label htmlFor="energy_kwh">Energi (kWh) *</Label>
                  <Input
                    id="energy_kwh"
                    type="number"
                    step="0.01"
                    placeholder="Contoh: 150"
                    value={formData.energy_kwh}
                    onChange={(e) => setFormData({ ...formData, energy_kwh: e.target.value })}
                    required
                  />
                </div>
              )}

              {/* Description */}
              <div className="space-y-2">
                <Label htmlFor="description">Deskripsi (Opsional)</Label>
                <Textarea
                  id="description"
                  placeholder="Contoh: Perjalanan ke kantor"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Estimate Button */}
              {showCalculator && (
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full"
                  onClick={handleEstimate}
                  disabled={estimating || !formData.activity_type}
                >
                  {estimating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menghitung...
                    </>
                  ) : (
                    <>
                      <Calculator className="mr-2 h-4 w-4" />
                      Hitung Estimasi
                    </>
                  )}
                </Button>
              )}

              {/* Submit Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Aktivitas"
                  )}
                </Button>
                <Link href="/dashboard" className="flex-1">
                  <Button type="button" variant="outline" className="w-full bg-transparent">
                    Batal
                  </Button>
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
