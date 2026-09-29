# Meo Cafe & Kasir ☕✨
**Sistem Manajemen Cafe Mewah & Estetik: Landing Page, Kasir (ala Gacoan), & Dashboard Owner Terpisah**

- **Nama Cafe**: Meo Cafe
- **Alamat**: Jl. Pelabuhan Tanjuk Priok No.10, Bakalan Krajan, Sukun, Malang
- **Owner**: Mega Octa
- **Mata Uang**: Rupiah Indonesia (Rp)

---

## 🏛️ Struktur File & Halaman MVC

```
├── .env                     # Kredensial Supabase & Konfigurasi Meo Cafe
├── .env.example             # Template environment
├── db.sql                   # Skrip SQL lengkap (Plain text password, Varian & Topping)
├── vercel.json              # Konfigurasi hosting Vercel
├── public/
│   ├── index.html           # Landing Page Customer (Profil & Daftar Menu)
│   ├── login.html           # Halaman Login Staf (Kasir & Owner)
│   ├── kasir.html           # Sistem Kasir (Varian Ukuran Small/Medium/Large, Topping Add-on, Struk)
│   ├── owner-statistik.html # Dashboard Owner: Statistik Penjualan (Mingguan / Bulanan)
│   ├── owner-menu.html      # Dashboard Owner: Manajemen CRUD Menu & Toggle Ketersediaan
│   ├── owner-kasir.html     # Dashboard Owner: Manajemen Akun Kasir & Pengaturan Profil Owner
│   ├── css/
│   │   ├── clay-base.css    # Desain sistem Claymorphism & token warna biru-putih
│   │   ├── landing.css      # CSS Landing Page
│   │   ├── login.css        # CSS Login
│   │   ├── kasir.css        # CSS Kasir & Struk Thermal
│   │   ├── owner-statistik.css # CSS Statistik & Bento Grid
│   │   ├── owner-menu.css      # CSS Manajemen Menu
│   │   └── owner-kasir.css     # CSS Manajemen Kasir & Profil
│   ├── js/
│   │   ├── config/env.js          # Pembaca kredensial Supabase
│   │   ├── database/supabaseClient.js # Konektor Supabase REST API
│   │   ├── models/                # [MODEL] MenuModel, OrderModel, UserModel, ReportModel
│   │   ├── views/                 # [VIEW] MenuView, OrderView, AnalyticsView
│   │   └── controllers/           # [CONTROLLER] Landing, Login, Kasir, OwnerStatistik, OwnerMenu, OwnerKasir
│   └── assets/images/       # Gambar hero cafe, kopi, pastry, dan mocktail
```

---

## 👥 Akun Login (Plain Text Password)

- **Kasir**: username `kasir` / password `kasir123`
- **Owner**: username `owner` / password `owner123` (Owner: Mega Octa)
