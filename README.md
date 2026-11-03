# Lumora - Website & Portal Konsultasi Statistik

Website publik + portal klien + dashboard admin.

## Teknologi
- **Frontend**: HTML/CSS/JS murni (Vite build), tanpa framework
- **Backend**: Node.js + Express
- **Database**: **PostgreSQL** (Neon) - data awan persist
- **Auth**: JWT + bcrypt
- **Upload**: Multer (maks 50MB)

## Cara Jalan Lokal (dev)
```
# 1. Pasang deps
cd server && npm install && cd ..

# 2. Buat database Postgres lokal / atau pakai Neon
#    set DATABASE_URL di terminal:
#    set DATABASE_URL=postgres://USER:PASS@localhost:5432/lumora   (Windows)
#    export DATABASE_URL=...                                        (Mac/Linux)

# 3. Init schema + seed akun demo
cd server && node init-db.js && node seed.js && cd ..

# 4. Jalankan
node server/index.js
# buka http://localhost:3001
```

## Akun Demo
| Peran | Email | Password |
|---|---|---|
| Admin | admin@lumora.id | admin123 |
| Statistisi | reza@lumora.id | reza123 |
| Klien | dewi@mail.com | dewi123 |

## Deploy Produksi (lihat DEPLOY-NEON-Railway.txt)
1. Buat database Neon (Postgres)
2. Deploy backend ke Railway, set `DATABASE_URL` + `JWT_SECRET`
3. `node init-db.js && node seed.js && node index.js`
4. Update konten (ganti data demo dengan data asli)

## Struktur
```
*.html, *.js, style.css    # frontend
server/
  index.js                 # entry API + static
  db.js                    # pool Postgres
  init-db.js               # buat schema + seed services
  seed.js                  # akun demo
  middleware.js            # RBAC
  routes/                  # auth, orders, bookings, admin, public
uploads/                   # file klien
railway.toml, Procfile     # config deploy
```

## Upgrade berikutnya
- Ganti file upload ke S3-compatible (Railway filesystem tidak persist)
- Payment gateway (Midtrans/Xendit)
- Email transaksional (nodemailer + SES)
- Google Calendar + WhatsApp Business API
