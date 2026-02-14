# Drive To Survive — Monorepo

แพลตฟอร์มเดินทางร่วมกันอย่างปลอดภัย

## โครงสร้างโปรเจค

```
DriveToSurviveWebApp/
├─ client/            # Nuxt 3 (Frontend)
│  ├─ pages/
│  ├─ components/
│  ├─ layouts/
│  ├─ composables/
│  ├─ plugins/
│  ├─ middleware/
│  ├─ assets/
│  ├─ public/
│  ├─ i18n/
│  ├─ app.vue
│  ├─ nuxt.config.js
│  └─ package.json
│
├─ server/            # Express (Backend API)
│  ├─ src/
│  │  ├─ app.js       # Express app
│  │  ├─ index.js     # Entry point (start server)
│  │  ├─ routes/
│  │  ├─ controllers/
│  │  ├─ services/
│  │  ├─ middlewares/
│  │  ├─ validations/
│  │  ├─ utils/
│  │  ├─ config/
│  │  ├─ bootstrap/
│  │  └─ docs/
│  ├─ prisma/
│  ├─ package.json
│  └─ tsconfig.json
│
├─ shared/            # Types, constants, schemas ใช้ร่วมกัน
│  ├─ types/
│  └─ schemas/
│
├─ .env
├─ package.json       # Root scripts
├─ start-dev.sh
└─ stop-dev.sh
```

## Setup

```bash
# ติดตั้ง dependencies ทั้งหมด
npm run install:all

# หรือติดตั้งแยก
cd client && npm install
cd server && npm install
```

## Development

```bash
# รันทั้ง Client + Server พร้อมกัน
npm run dev

# หรือรันแยก
npm run dev:client    # Nuxt → http://localhost:3000
npm run dev:server    # Express → http://localhost:3001

# หรือใช้ shell script
./start-dev.sh
```

## Ports

| Service | Port | URL |
|---------|------|-----|
| Client (Nuxt) | 3000 | http://localhost:3000 |
| Server (Express) | 3001 | http://localhost:3001 |
| Swagger Docs | 3001 | http://localhost:3001/documentation |

## API Proxy

Client (Nuxt) proxy `/api/*` → Server (Express) `http://localhost:3001/api/*` ผ่าน Nitro devProxy

## Database

```bash
cd server
npm run db:migrate    # Run migrations
npm run db:generate   # Generate Prisma client
npm run db:studio     # Open Prisma Studio
```
