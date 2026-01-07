'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { User, Bell, Shield, Trash2, Building2 } from "lucide-react"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { apiClient, OrganisasiResponse } from "@/lib/api-client"

interface OrganisasiData {
  id: string
  nama: string
  created_at: string
  jumlah_anggota: number
}

interface UserData {
  id: string
  name: string
  email: string
  organisasi?: OrganisasiData
  role: string
}

export default function PengaturanPage() {
  const router = useRouter()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [organisasiList, setOrganisasiList] = useState<OrganisasiResponse[]>([])
  const [showOrganisasiDropdown, setShowOrganisasiDropdown] = useState(false)
  
  // Form states
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [organization, setOrganization] = useState("")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")

  useEffect(() => {
    fetchUserData()
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

  const fetchUserData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      if (!token) {
        router.push('/login')
        return
      }

      const response = await fetch('http://localhost:8000/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        const data = await response.json()
        console.log('User data loaded:', data)
        setUserData(data)
        setName(data.name)
        setEmail(data.email)
        // Set organisasi dari response
        if (data.organisasi && data.organisasi.nama) {
          setOrganization(data.organisasi.nama)
          console.log('Organisasi set:', data.organisasi.nama)
        } else {
          setOrganization('')
          console.log('No organisasi found')
        }
      } else {
        localStorage.removeItem('token')
        router.push('/login')
      }
    } catch (error) {
      console.error('Error fetching user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    setSaving(true)
    try {
      const token = localStorage.getItem('access_token')
      const payload = { 
        name, 
        email,
        organisasi: organization.trim() || undefined
      }
      console.log('Saving profile with payload:', payload)
      
      const response = await fetch('http://localhost:8000/api/auth/profile', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        const updatedData = await response.json()
        alert('Profil berhasil diperbarui!')
        // Update localStorage dengan data baru
        const storedUser = JSON.parse(localStorage.getItem('user') || '{}')
        storedUser.name = updatedData.name
        storedUser.email = updatedData.email
        localStorage.setItem('user', JSON.stringify(storedUser))
        
        // Trigger custom event untuk memberitahu dashboard
        window.dispatchEvent(new Event('userProfileUpdated'))
        
        fetchUserData()
      } else {
        const error = await response.json()
        alert(`Gagal memperbarui profil: ${error.detail || 'Terjadi kesalahan'}`)
      }
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Gagal memperbarui profil')
    } finally {
      setSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      alert('Password baru dan konfirmasi tidak cocok!')
      return
    }

    if (newPassword.length < 6) {
      alert('Password minimal 6 karakter!')
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/api/auth/change-password', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword
        })
      })

      if (response.ok) {
        alert('Password berhasil diubah!')
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        const error = await response.json()
        alert(`Gagal mengubah password: ${error.detail || 'Terjadi kesalahan'}`)
      }
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Gagal mengubah password')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      'PERINGATAN: Tindakan ini akan menghapus akun dan semua data aktivitas Anda secara permanen!\n\nAudit log akan tetap tersimpan untuk keperluan sistem.\n\nApakah Anda yakin ingin menghapus akun?'
    )
    
    if (!confirmed) return

    const doubleConfirm = window.prompt(
      'Ketik "HAPUS AKUN" (huruf besar) untuk konfirmasi penghapusan:'
    )

    if (doubleConfirm !== 'HAPUS AKUN') {
      alert('Penghapusan dibatalkan.')
      return
    }

    setSaving(true)
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('http://localhost:8000/api/auth/delete-account', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        alert('Akun berhasil dihapus. Anda akan diarahkan ke halaman utama.')
        localStorage.removeItem('access_token')
        localStorage.removeItem('user')
        router.push('/')
      } else {
        const error = await response.json()
        alert(`Gagal menghapus akun: ${error.detail || 'Terjadi kesalahan'}`)
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      alert('Gagal menghapus akun')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Memuat data...</p>
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-8 max-w-3xl mx-auto pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Pengaturan Akun</h1>
        <p className="text-muted-foreground">Kelola informasi dan preferensi akun Anda.</p>
      </div>

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <User className="h-5 w-5 text-primary" />
            <CardTitle>Informasi Profil</CardTitle>
          </div>
          <CardDescription>Perbarui data diri Anda yang akan ditampilkan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nama Lengkap</Label>
            <Input 
              id="name" 
              placeholder="Masukkan nama lengkap" 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email" 
              placeholder="email@example.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organization">Organisasi (Opsional)</Label>
            <div id="organisasi-container" className="relative">
              <Input 
                id="organization" 
                placeholder="Pilih atau ketik nama organisasi" 
                value={organization}
                onChange={(e) => {
                  setOrganization(e.target.value)
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
                      org.nama.toLowerCase().includes(organization.toLowerCase())
                    )
                    .map((org) => (
                      <button
                        key={org.id}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-muted flex items-center justify-between group"
                        onClick={() => {
                          setOrganization(org.nama)
                          setShowOrganisasiDropdown(false)
                        }}
                      >
                        <span className="font-medium">{org.nama}</span>
                        <span className="text-xs text-muted-foreground">
                          {org.jumlah_anggota} anggota
                        </span>
                      </button>
                    ))}
                  {organization && 
                   !organisasiList.some(org => 
                      org.nama.toLowerCase() === organization.toLowerCase()
                   ) && (
                    <div className="px-3 py-2 text-sm text-muted-foreground border-t">
                      💡 "{organization}" akan dibuat sebagai organisasi baru
                    </div>
                  )}
                </div>
              )}
            </div>
            {userData?.organisasi && (
              <p className="text-xs text-muted-foreground">
                Tergabung dalam: <strong>{userData.organisasi.nama}</strong> ({userData.organisasi.jumlah_anggota} anggota)
              </p>
            )}
          </div>
          <Button onClick={handleSaveProfile} disabled={saving}>
            {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
          </Button>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Bell className="h-5 w-5 text-primary" />
            <CardTitle>Notifikasi</CardTitle>
          </div>
          <CardDescription>Atur bagaimana Anda ingin menerima pembaruan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Notifikasi Email</Label>
              <p className="text-sm text-muted-foreground">Terima ringkasan mingguan jejak karbon Anda</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Peringatan Anomali</Label>
              <p className="text-sm text-muted-foreground">Dapatkan notifikasi saat ada lonjakan emisi</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label>Tips Pengurangan Emisi</Label>
              <p className="text-sm text-muted-foreground">Saran bulanan untuk menurunkan jejak karbon</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <Shield className="h-5 w-5 text-primary" />
            <CardTitle>Keamanan</CardTitle>
          </div>
          <CardDescription>Jaga akun Anda tetap aman dengan pengaturan ini.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Password Saat Ini</Label>
            <Input 
              id="current-password" 
              type="password" 
              placeholder="Masukkan password saat ini" 
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Password Baru</Label>
            <Input 
              id="new-password" 
              type="password" 
              placeholder="Masukkan password baru" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
            <Input 
              id="confirm-password" 
              type="password" 
              placeholder="Ketik ulang password baru" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
          <Button onClick={handleChangePassword} disabled={saving}>
            {saving ? 'Mengubah...' : 'Ubah Password'}
          </Button>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Trash2 className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Zona Berbahaya</CardTitle>
          </div>
          <CardDescription>Tindakan ini tidak dapat dibatalkan. Harap berhati-hati.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 border border-destructive/50 rounded-lg">
            <div className="space-y-1">
              <p className="font-medium">Hapus Akun</p>
              <p className="text-sm text-muted-foreground">Semua data dan riwayat Anda akan dihapus secara permanen</p>
            </div>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={handleDeleteAccount}
              disabled={saving}
            >
              {saving ? 'Menghapus...' : 'Hapus Akun'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
