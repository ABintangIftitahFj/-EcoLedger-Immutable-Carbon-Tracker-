import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { User, Bell, Shield, Trash2 } from "lucide-react"

export default function PengaturanPage() {
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
            <Input id="name" placeholder="Masukkan nama lengkap" defaultValue="Budi Santoso" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" placeholder="email@example.com" defaultValue="budi@example.com" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="organization">Organisasi (Opsional)</Label>
            <Input id="organization" placeholder="Nama perusahaan atau organisasi" />
          </div>
          <Button>Simpan Perubahan</Button>
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
            <Input id="current-password" type="password" placeholder="Masukkan password lama" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">Password Baru</Label>
            <Input id="new-password" type="password" placeholder="Masukkan password baru" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
            <Input id="confirm-password" type="password" placeholder="Ketik ulang password baru" />
          </div>
          <Button>Ubah Password</Button>
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
            <Button variant="destructive" size="sm">
              Hapus Akun
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
