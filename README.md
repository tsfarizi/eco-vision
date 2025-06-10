# EcoVision Frontend

Frontend aplikasi **EcoVision** - platform cerdas untuk klasifikasi sampah menggunakan teknologi AI dengan pendekatan gamifikasi.

## 🌟 Fitur Utama

- **Klasifikasi Sampah Otomatis**: Upload gambar dan dapatkan klasifikasi jenis sampah secara real-time
- **Sistem Gamifikasi**: Kumpulkan poin dan naik level melalui kontribusi positif
- **Leaderboard**: Kompetisi friendly dengan pengguna lain
- **Bank Sampah**: Temukan lokasi bank sampah terdekat
- **Panduan Edukasi**: Tips dan informasi lengkap tentang pengelolaan sampah

## 🚀 Tech Stack

- **Vite** - Build tool dan dev server
- **Vanilla JavaScript** - No framework, pure JS
- **CSS3** - Modern styling dengan Flexbox & Grid
- **REST API** - Integrasi dengan Django backend

## 📁 Struktur Project

```
eco-vision-fe/
├── public/
│   └── img/                 # Assets gambar
├── src/
│   ├── api/                 # API integration modules
│   │   ├── auth.js         # Authentication endpoints
│   │   ├── leaderboard.js  # Leaderboard data
│   │   ├── predict.js      # Image classification
│   │   ├── token.js        # JWT token management
│   │   └── wasteBanks.js   # Waste bank locations
│   ├── pages/
│   │   └── home.js         # Page-specific logic
│   ├── styles/
│   │   └── styles.css      # Global styles
│   └── main.js             # Main application logic
├── index.html              # Entry point
├── vite.config.js          # Vite configuration
├── package.json            # Dependencies
├── .env                    # Environment variables
└── README.md               # This file
```

## ⚙️ Setup & Installation

### Prerequisites

- Node.js >= 18.0.0
- Docker & Docker Compose (untuk backend)

### 1. Clone Repository

```bash
git clone <repository-url>
cd eco-vision-fe
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Buat file `.env` di root project:

```bash
# Backend API URL
VITE_API_BASE_URL=http://localhost:8000

# Development settings
VITE_NODE_ENV=development
VITE_FRONTEND_URL=http://localhost:5173
```

### 4. Jalankan Backend (Django API)

Pastikan backend sudah running di port 8000:

```bash
# Di folder backend
docker compose up
```

Backend akan tersedia di: `http://localhost:8000`

### 5. Jalankan Frontend Development Server

```bash
npm run dev
```

Aplikasi akan berjalan di: `http://localhost:5173`

## 🔧 Available Scripts

- `npm run dev` - Jalankan development server
- `npm run build` - Build untuk production
- `npm run preview` - Preview build results
- `npm run serve` - Serve production build

## 🌐 API Integration

Frontend terintegrasi dengan Django backend melalui REST API:

- **Authentication**: JWT token-based auth
- **Image Classification**: AI-powered waste classification
- **Gamification**: Points, levels, leaderboard
- **Waste Banks**: Location-based services

### API Endpoints

- `POST /auth/register/` - User registration
- `POST /auth/login/` - User login
- `POST /auth/token/refresh/` - Refresh access token
- `POST /predict/` - Image classification
- `GET /leaderboard/` - User rankings
- `GET /waste-banks/` - Waste bank locations

## 🔐 Authentication Flow

1. User register/login → Dapat access + refresh token
2. Access token disimpan di localStorage
3. Setiap API request menggunakan Bearer token
4. Auto-refresh token jika expired (5 menit)
5. Redirect ke login jika refresh token expired (1 hari)

## 📱 User Flow

1. **Landing Page** → Pengenalan aplikasi
2. **Authentication** → Register/Login
3. **Dashboard** → Menu utama dengan navigasi
4. **Klasifikasi** → Upload gambar sampah
5. **Hasil** → Klasifikasi + rekomendasi
6. **Gamifikasi** → Points & leaderboard
7. **Bank Sampah** → Lokasi terdekat

## 🎨 UI/UX Features

- **Responsive Design** - Mobile & desktop friendly  
- **Modern Green Theme** - Environmental color palette
- **Smooth Transitions** - Enhanced user experience
- **Interactive Elements** - Hover effects & animations
- **Accessibility** - Semantic HTML & proper contrast

## 🐛 Troubleshooting

### CORS Issues
Jika ada masalah CORS, pastikan backend Django sudah configure CORS headers untuk frontend URL.

### Token Issues
- Access token expired setiap 5 menit
- Refresh token expired setiap 1 hari
- Clear localStorage jika ada masalah persistent

### File Upload Issues
- Pastikan file gambar < 10MB
- Format yang didukung: JPG, PNG, WEBP
- Backend endpoint: `POST /predict/`

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Links

- **Backend Repository**: [Django API](https://github.com/tsfarizi/eco-vision-api)
- **API Documentation**: [OpenAPI Spec](https://tsfarizi.github.io/eco-vision-api/)
- **Live Demo**: Coming soon...

---

Built with 💚 for a sustainable future by EcoVision Team