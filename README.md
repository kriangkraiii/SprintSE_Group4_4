# Group Members - Section 4/4

| Student ID | Name | Github Username |
| :--- | :--- | :--- |
| 643020646-0 | นายศิรวิทย์ ขจรศรี | [@Sirawit23455](https://github.com/Sirawit23455) |
| 663380386-5 | นายธนัชชา คำไล้ | [@conan2547](https://github.com/conan2547) |
| 663380389-9 | นางสาวธันย์ชนก โสภา | [@Thanchanok1234](https://github.com/Thanchanok1234) |
| 663380599-8 | นายธิติกร สุวรรณบุตรวิภา | [@Thitikornsu](https://github.com/Thitikornsu)|
| 663380616-4 | นายเกรียงไกร ประเสริฐ | [@kriangkraiii](https://github.com/kriangkraiii) |
| 663380374-2 | นายกฤต อินทรจินดา | [ampcln](https://github.com/4mpcln) |


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
#แก้ไขไฟล์ .env.example เปลี่ยนเป็น .env และนำ apikeyหรือkeysต่างๆใส่
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
./stop-dev.sh
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
