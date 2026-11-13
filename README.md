# POS & Kiosk Auto Display Manager (Chrome Extension - Manifest V3)

Ekstensi Chrome/Chromium dengan antarmuka **Neumorphism Theme (Rounded-2XL & Custom Dropdown)** untuk mendeteksi layar multi-monitor dan secara otomatis memposisikan jendela browser ke monitor tertentu serta mengaktifkan mode Fullscreen saat membuka URL yang telah dikonfigurasi.

---

## 📁 Struktur File

```text
extension-auto-display/
├── manifest.json         # Konfigurasi Manifest V3
├── background.js         # Service Worker pendeteksi navigasi URL & pengatur jendela
├── popup/
│   ├── popup.html        # Antarmuka Neumorphism (Rounded-2XL & Custom Dropdown)
│   ├── popup.css         # Styling Neumorphic (soft dual-shadows, inset effects & floating custom menu)
│   └── popup.js          # Controller interaktif: deteksi display, custom select handler & rules
├── icons/                # Ikon ekstensi (16x16, 48x48, 128x128)
├── test-kiosk.html       # Halaman simulasi untuk pengujian
└── README.md
```

---

## ✨ Fitur & Desain Terbaru

1. **Sisi Popup Rounded-2XL (`border-radius: 24px`):** Sudut-sudut popup dan kartu neumorphic memiliki kelengkungan halus dan modern.
2. **Custom Neumorphic Dropdown Component:**
   - Menggantikan elemen `<select>` bawaan browser dengan komponen dropdown kustom bergaya Neumorphism.
   - Dilengkapi trigger inset tactile dengan icon monitor, rotasi chevron halus 180°, dan status terpotong rapi (*text-truncate*).
   - Menu mengambang (*floating menu*) dengan daftar monitor yang menampilkan ikon monitor, nama perangkat, resolusi layar, badge indikator (Utama/Sekunder), serta tanda centang aktif.
   - Mendukung penutupan otomatis saat klik di luar area (*click outside*) atau tombol `Esc`.
3. **Auto Display Detection:** Secara real-time mendeteksi seluruh monitor yang terhubung ke PC via `chrome.system.display`.
4. **URL Matching Flexible:** Mendukung pencocokan URL, domain, atau path (misal: `localhost:3000`, `/customer-display`, `pos.myresto.com`).
5. **Auto Fullscreen & Detach Tab:** Otomatis memindahkan koordinat jendela ke layar target terlebih dahulu, lalu mengaktifkan mode `fullscreen`. Jika tab dibuka di jendela berisi banyak tab, otomatis dipisahkan ke jendela baru khusus.
6. **Instant Test:** Tombol tes langsung untuk memindahkan jendela saat ini ke monitor target tanpa harus reload.
