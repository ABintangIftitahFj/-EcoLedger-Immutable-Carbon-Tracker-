# Secrets & Onboarding — EcoLedger

Tujuan: beri panduan singkat agar tim tidak bingung tentang kunci API dan setup lokal.

1) Tujuan singkat
- Jangan commit secrets (`.env`) ke repo.
- Setiap developer simpan nilai sensitif di file `.env` lokal atau secret manager.

2) Files yang ada
- `.env.example` — template yang boleh di-commit.
- `.env` — file lokal (HARUS di-ignore oleh Git). Kita sudah menambahkan `.gitignore`.

3) Langkah onboarding (developer)
- Fork/clone repo.
- Copy `.env.example` ke `.env` di root repo:

  ```powershell
  cp .env.example .env
  ````
- Isi `CLIMATIQ_API_KEY` dengan API key yang kamu dapat dari Climatiq (atau minta shared dev key dari tim jika tersedia).
- Jika belum ada `SECRET_KEY`, generate dengan PowerShell:

  ```powershell
  # PowerShell
  [Convert]::ToBase64String((New-Object Security.Cryptography.RNGCryptoServiceProvider).GetBytes(32))
  ```

  Salin hasil ke `SECRET_KEY` di `.env`.

- Jalankan stack (direkomendasikan memakai Docker Compose):

  ```powershell
  cd infrastructures
  docker-compose up --build -d
  docker-compose run --rm mongo-init
  ```

4) Jika tim ingin shared dev key
- Shared dev key boleh dipakai hanya untuk development, batasi quota dan rotasi tiap bulan.
- Tandai shared key sebagai `DEV` di dashboard Climatiq.

5) Production / CI
- Jangan simpan production keys di repo.
- Gunakan secret store (contoh): GitHub Actions Secrets, AWS Secrets Manager, Azure Key Vault, Docker secrets.
- Contoh singkat GitHub Actions usage (secrets):

  ```yaml
  env:
    CLIMATIQ_API_KEY: ${{ secrets.CLIMATIQ_API_KEY }}
    SECRET_KEY: ${{ secrets.SECRET_KEY }}
  ```

6) Rotate & revoke
- Jika kunci pernah di-push ke repo publik, rotate segera di dashboard Climatiq dan revoke kunci lama.
- Jika perlu, hapus history Git yang berisi kunci (BFG / git-filter-repo) — koordinasikan dengan tim sebelum dilakukan.

7) Kontak & koordinasi
- Siapkan satu pesan singkat (Slack / Email) berisi:
  - Info bahwa `.env` dihapus dari repo.
  - Instruksi: copy `.env.example` → isi `CLIMATIQ_API_KEY` & `SECRET_KEY` → jalankan `docker-compose`.
  - Tanggal/target rotation untuk shared dev key (jika ada).

---
Jika mau, saya bisa: 1) buat pull request yang menambahkan file ini ke repo, dan/atau 2) siapkan contoh GitHub Actions workflow yang membaca secrets dan menjalankan Compose. Pilih PR atau workflow, atau keduanya.