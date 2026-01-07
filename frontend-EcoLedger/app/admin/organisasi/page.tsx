"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Building2, Edit, Trash2, Users, Search } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface Organisasi {
  id: string;
  nama: string;
  created_at: string;
  jumlah_anggota: number;
}

interface Member {
  id: string;
  email: string;
  name: string;
  role: string;
  created_at: string;
}

export default function AdminOrganisasiPage() {
  const [organisasi, setOrganisasi] = useState<Organisasi[]>([]);
  const [filteredOrganisasi, setFilteredOrganisasi] = useState<Organisasi[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organisasi | null>(null);
  const [editNamaBaru, setEditNamaBaru] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingOrg, setDeletingOrg] = useState<Organisasi | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Members dialog state
  const [membersDialogOpen, setMembersDialogOpen] = useState(false);
  const [viewingOrg, setViewingOrg] = useState<Organisasi | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);

  useEffect(() => {
    loadOrganisasi();
  }, []);

  useEffect(() => {
    // Filter organisasi by search query
    if (searchQuery.trim() === "") {
      setFilteredOrganisasi(organisasi);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredOrganisasi(
        organisasi.filter((org) =>
          org.nama.toLowerCase().includes(query)
        )
      );
    }
  }, [searchQuery, organisasi]);

  const loadOrganisasi = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const response = await fetch(
        "http://localhost:8000/api/organisasi",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Gagal memuat data organisasi");
      }

      const data = await response.json();
      setOrganisasi(data);
      setFilteredOrganisasi(data);
    } catch (error) {
      console.error("Error loading organisasi:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data organisasi",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (org: Organisasi) => {
    setEditingOrg(org);
    setEditNamaBaru(org.nama);
    setEditDialogOpen(true);
  };

  const handleEdit = async () => {
    if (!editingOrg || !editNamaBaru.trim()) {
      toast({
        title: "Error",
        description: "Nama organisasi tidak boleh kosong",
        variant: "destructive",
      });
      return;
    }

    try {
      setEditLoading(true);
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const response = await fetch(
        `http://localhost:8000/api/admin/organisasi/${editingOrg.id}?nama_baru=${encodeURIComponent(editNamaBaru.trim())}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Gagal mengupdate organisasi");
      }

      const result = await response.json();

      toast({
        title: "Berhasil",
        description: `Organisasi berhasil diupdate menjadi "${result.nama}"`,
      });

      setEditDialogOpen(false);
      loadOrganisasi();
    } catch (error: any) {
      console.error("Error updating organisasi:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal mengupdate organisasi",
        variant: "destructive",
      });
    } finally {
      setEditLoading(false);
    }
  };

  const openDeleteDialog = (org: Organisasi) => {
    setDeletingOrg(org);
    setDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!deletingOrg) return;

    try {
      setDeleteLoading(true);
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      
      // Gunakan force=true untuk force delete organisasi dengan anggota
      const hasMembers = deletingOrg.jumlah_anggota > 0;
      const response = await fetch(
        `http://localhost:8000/api/admin/organisasi/${deletingOrg.id}?force=${hasMembers}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || "Gagal menghapus organisasi");
      }

      const result = await response.json();

      toast({
        title: "Berhasil",
        description: `${result.message}${result.affected_users > 0 ? `. ${result.affected_users} user terlepas dari organisasi.` : ""}`,
      });

      setDeleteDialogOpen(false);
      loadOrganisasi();
    } catch (error: any) {
      console.error("Error deleting organisasi:", error);
      toast({
        title: "Error",
        description: error.message || "Gagal menghapus organisasi",
        variant: "destructive",
      });
    } finally {
      setDeleteLoading(false);
    }
  };

  const openMembersDialog = async (org: Organisasi) => {
    setViewingOrg(org);
    setMembersDialogOpen(true);
    setMembersLoading(true);

    try {
      const token = localStorage.getItem("token") || localStorage.getItem("access_token");
      const response = await fetch(
        `http://localhost:8000/api/admin/organisasi/${org.id}/members`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Gagal memuat data anggota");
      }

      const data = await response.json();
      setMembers(data.members);
    } catch (error) {
      console.error("Error loading members:", error);
      toast({
        title: "Error",
        description: "Gagal memuat data anggota",
        variant: "destructive",
      });
      setMembers([]);
    } finally {
      setMembersLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Kelola Organisasi</h1>
        <p className="text-muted-foreground mt-2">
          Kelola semua organisasi yang terdaftar di sistem
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Daftar Organisasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search */}
          <div className="mb-4 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Cari organisasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Memuat data...
            </div>
          ) : filteredOrganisasi.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchQuery ? "Tidak ada organisasi yang ditemukan" : "Belum ada organisasi"}
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nama Organisasi</TableHead>
                    <TableHead>Jumlah Anggota</TableHead>
                    <TableHead>Tanggal Dibuat</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganisasi.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          {org.nama}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />
                          {org.jumlah_anggota}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(org.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openMembersDialog(org)}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            Lihat Anggota
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(org)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(org)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="mt-4 text-sm text-muted-foreground">
            Total: {filteredOrganisasi.length} organisasi
            {searchQuery && ` (dari ${organisasi.length} organisasi)`}
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Organisasi</DialogTitle>
            <DialogDescription>
              Ubah nama organisasi. Perubahan akan berlaku untuk semua anggota.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="nama-baru">Nama Organisasi</Label>
              <Input
                id="nama-baru"
                value={editNamaBaru}
                onChange={(e) => setEditNamaBaru(e.target.value)}
                placeholder="Masukkan nama baru"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              disabled={editLoading}
            >
              Batal
            </Button>
            <Button onClick={handleEdit} disabled={editLoading}>
              {editLoading ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Organisasi</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <span className="block">
                  Anda yakin ingin menghapus organisasi <strong>{deletingOrg?.nama}</strong>?
                </span>
                {deletingOrg && deletingOrg.jumlah_anggota > 0 ? (
                  <div className="bg-destructive/10 border border-destructive/20 rounded p-3">
                    <span className="text-destructive font-medium text-sm block">
                      ⚠️ Peringatan:
                    </span>
                    <span className="text-destructive text-sm block mt-1">
                      {deletingOrg.jumlah_anggota} anggota akan <strong>terlepas</strong> dari organisasi ini.
                      <br />
                      Mereka tidak akan memiliki organisasi sampai bergabung atau membuat organisasi baru.
                    </span>
                  </div>
                ) : (
                  <span className="text-muted-foreground text-sm block">
                    ✓ Organisasi ini tidak memiliki anggota.
                  </span>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleteLoading ? "Menghapus..." : "Ya, Hapus"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Members Dialog */}
      <Dialog open={membersDialogOpen} onOpenChange={setMembersDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Anggota {viewingOrg?.nama}
            </DialogTitle>
            <DialogDescription>
              Daftar semua anggota yang terdaftar di organisasi ini
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {membersLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Memuat data anggota...
              </div>
            ) : members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Belum ada anggota di organisasi ini
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nama</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Bergabung</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.name}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={member.role === "admin" ? "default" : "secondary"}
                          >
                            {member.role}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatDate(member.created_at)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMembersDialogOpen(false)}>
              Tutup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
