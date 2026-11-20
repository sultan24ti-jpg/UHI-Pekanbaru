# 📸 Panduan Menambahkan Foto Survei (Avenza Maps)

Nama file foto di bawah ini diambil langsung dari rekaman deskripsi **Avenza Maps** saat survei lapangan.

---

## 📁 Lokasi Folder Penyimpanan Foto

Taruh semua file foto ke dalam folder:
```
my-app/
└── public/
    └── foto/
        ├── IMG_2521.jpg
        ├── IMG_2523.jpg
        ├── IMG_2528.jpg
        └── ...
```

> **Catatan:**
> - Ekstensi file yang didukung: `.jpg`, `.jpeg`, atau `.png` (default sistem memanggil `.jpg`).
> - Jika ada titik yang memiliki lebih dari 1 foto (misal: `IMG_2532` dan `IMG_2533`), kedua foto tersebut akan otomatis tampil berdampingan di popup popup peta.

---

## 📋 Daftar Titik Survei & Nama File Foto Sesuai Avenza

| No | Nama Titik Survei | Nama File Foto di Avenza | Suhu (°C) | Kelembapan | Kondisi Vegetasi |
|:---:|:---|:---|:---:|:---:|:---|
| 1 | Kampung Bandar | `IMG_2521.jpg` | 27°C | 87% | Jarang |
| 2 | Kampung Dalam | `IMG_2523.jpg` | 28°C | 81% | Jarang |
| 3 | Pesisir | `IMG_2528.jpg` | 28°C | 80% | Jarang |
| 4 | Kota Tinggi | `IMG_2532.jpg`, `IMG_2533.jpg` | 28°C | 81% | Sedang |
| 5 | Sumahilang | `IMG_2534.jpg`, `IMG_2536.jpg` | 28°C | 81% | Jarang |
| 6 | Jadirejo | `IMG_2537.jpg`, `IMG_2539.jpg` | 28°C | 81% | Jarang |
| 7 | Simpang Empat | `IMG_2540.jpg`, `IMG_2542.jpg` | 28°C | 80% | Jarang |
| 8 | Cinta Raja | `IMG_2544.jpg`, `IMG_2546.jpg` | 28°C | 81% | Sedang |
| 9 | Tangkerang Utara | `IMG_2547.jpg`, `IMG_2549.jpg` | 28°C | 81% | Sedang |
| 10 | Tengkerang Selatan | `IMG_2552.jpg`, `IMG_2554.jpg` | 29°C | 79% | Jarang |
| 11 | Simpang Tiga | `IMG_2556.jpg`, `IMG_2558.jpg` | 29°C | 76% | Jarang |
| 12 | Sidomulyo Timur | `IMG_2580.jpg`, `IMG_2581.jpg` | 29°C | 73% | Sedang |
| 13 | Tangkerang Barat | `IMG_2586.jpg`, `IMG_2587.jpg` | 29°C | 75% | Sedang |
| 14 | Delima | `IMG_2590.jpg`, `IMG_2591.jpg` | 29°C | 77% | Rimbun |
| 15 | Labuh Baru Barat | `IMG_2593.jpg`, `IMG_2594.jpg` | 29°C | 75% | Rimbun |
| 16 | Air Hitam | `IMG_2596.jpg`, `IMG_2597.jpg` | 29°C | 75% | Rimbun |
| 17 | Tampan | `IMG_2598.jpg`, `IMG_2599.jpg` | 29°C | 75% | Rimbun |
| 18 | Palas | `IMG_2602.jpg` | 29°C | 76% | Sedang |
| 19 | Sri Meranti | `IMG_2605.jpg`, `IMG_2606.jpg` | 29°C | 75% | Rimbun |
| 20 | Lembah Damai | `IMG_2609.jpg`, `IMG_2610.jpg` | 31°C | 69% | Rimbun |
| 21 | Lembah Sari | `IMG_2613.jpg`, `IMG_2614.jpg`, `IMG_2615.jpg` | 31°C | 69% | Jarang |
| 22 | Limbungan | `IMG_2616.jpg`, `IMG_2617.jpg` | 31°C | 69% | Sedang |
| 23 | Limbungan Baru | `IMG_2619.jpg`, `IMG_2620.jpg` | 31°C | 69% | Jarang |
| 24 | Padang Terubuk | `IMG_2621.jpg`, `IMG_2622.jpg` | 31°C | 69% | Sedang |
| 25 | Padang Bulan | `IMG_2623.jpg`, `IMG_2624.jpg` | 31°C | 70% | Tidak ada |
| 26 | Sukajadi | `IMG_2625.jpg`, `IMG_2626.jpg` | 31°C | 70% | Jarang |
| 27 | Pulau Karomah | `IMG_2629.jpg` | 31°C | 70% | Sedang |
| 28 | Harjosari | `IMG_2631.jpg`, `IMG_2632.jpg` | 31°C | 70% | Sedang |
| 29 | Kedung Sari | `IMG_2633.jpg`, `IMG_2634.jpg` | 31°C | 70% | Rimbun |
| 30 | Umban Sari | `IMG_2636.jpg`, `IMG_2637.jpg` | 29°C | 75% | Rimbun |

---

## 💡 Cara Kerja di Peta
1. Saat mengklik titik survei di peta, thumbnail foto akan langsung dimuat di dalam jendela popup.
2. Mengklik thumbnail foto akan membuka **tampilan layar penuh (modal dialog)** dengan resolusi lebih jelas beserta informasi pengukuran spasial titik tersebut.
3. Jika foto belum disalin ke `public/foto/`, popup akan secara otomatis menampilkan nama file yang dibutuhkan agar mudah dicek.
