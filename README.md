# Tugas-UTS-Kripto

Implementasi **Knight's Tour Cipher** — Sebuah algoritma kriptografi simetris berbasis papan catur 8×8 dengan jalur perjalanan kuda (*Knight's Tour*) dan pergeseran dinamis (*Dynamic Polyalphabetic Shift*).

Dibuat untuk memenuhi tugas mata kuliah **Kriptografi**.

---

## 🌟 Fitur Utama

- **Papan Kunci 8×8**: 64 karakter alfabet terpetakan secara unik berdasarkan kata kunci (*key*).
- **Warnsdorff's Heuristic**: Menghasilkan *Hamiltonian path* papan catur secara deterministik dari kunci.
- **Dynamic Direction Shift**: Arah langkah kuda berubah setiap karakter, membuat cipher bersifat *polyalphabetic* dan tahan terhadap analisis frekuensi sederhana.
- **Web App Interaktif**:
  - UI modern dengan tema *dark luxury* & *glassmorphism*.
  - Visualisasi real-time papan catur 8×8 dan langkah kuda.
  - Tabel trace interaktif langkah per langkah.
  - Animasi visualisasi enkripsi dan dekripsi.
- **Implementasi Python**: CLI mandiri lengkap dengan self-test otomatis.

---

## 📁 Struktur Direktori

```text
├── index.html                     # Halaman web interaktif utama
├── style.css                      # Styling CSS modern & responsif
├── app.js                         # Logika kontrol interaksi UI & visualisasi
├── cipher.js                      # Implementasi inti algoritma dalam JavaScript
├── knights_tour_cipher.py         # Implementasi inti algoritma dalam Python
├── Laporan_Knights_Tour_Cipher.pdf # Laporan analisis & perancangan cipher
└── README.md                      # Dokumentasi proyek
```

---

## 🚀 Cara Menjalankan

### 1. Web App Interaktif
Cukup buka file `index.html` di peramban web modern apa pun (Chrome, Edge, Firefox, dll.):
- Double-click file `index.html`, atau
- Jalankan ekstensi *Live Server* di VS Code / editor pilihan Anda.

### 2. Program Python
Pastikan Python 3.x telah terpasang di sistem:
```bash
python knights_tour_cipher.py
```

---

## ♟️ Alfabet & Ruang Karakter

Cipher ini menggunakan 64 karakter (`64 = 8 × 8`):
- `A-Z` (26 huruf besar)
- `a-z` (26 huruf kecil)
- `0-9` (10 angka)
- Spasi (` `) & Titik (`.`)

---

## 👥 Penulis
- **Huga Hazimulfikri**
- Mata Kuliah: Kriptografi
