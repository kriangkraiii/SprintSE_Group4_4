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

## API Endpoints

Base URL: `/api`

### 1. Authentication (`/auth`)
| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `POST` | `/login` | Login with username/email & password | Public |
| `PUT` | `/change-password` | Change current user password | User |
| `POST` | `/forgot-password` | Request OTP for password reset | Public |
| `POST` | `/verify-otp` | Verify OTP code | Public |
| `POST` | `/reset-password` | Set new password with verified OTP | Public |

### 2. Users (`/users`)
| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `POST` | `/` | Register new user | Public |
| `GET` | `/me` | Get current user profile | User |
| `PUT` | `/me` | Update current user profile | User |
| `DELETE` | `/me` | Soft delete account (PDPA) | User |
| `GET` | `/:id` | Get public user info | Public |
| `GET` | `/admin` | List all users (Query support) | Admin |
| `POST` | `/admin` | Create admin user | Admin |
| `GET` | `/admin/:id` | Get user detailed info | Admin |
| `PUT` | `/admin/:id` | Update user info | Admin |
| `DELETE` | `/admin/:id` | Soft delete user | Admin |
| `PATCH` | `/admin/:id/status` | Activate/Deactivate user | Admin |

### 3. Vehicles (`/vehicles`)
| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | List my vehicles | User |
| `POST` | `/` | Add new vehicle | User |
| `GET` | `/:id` | Get vehicle details | User |
| `PUT` | `/:id` | Update vehicle | User |
| `DELETE` | `/:id` | Delete vehicle | User |
| `PUT` | `/:id/default` | Set as default vehicle | User |
| `GET` | `/admin` | List all vehicles | Admin |
| `POST` | `/admin` | Create vehicle for user | Admin |
| `GET` | `/admin/:id` | Get vehicle details | Admin |
| `PUT` | `/admin/:id` | Update vehicle | Admin |
| `DELETE` | `/admin/:id` | Delete vehicle | Admin |
| `GET` | `/admin/user/:userId` | List vehicles by user | Admin |

### 4. Driver Verification (`/driver-verifications`)
| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `GET` | `/me` | Get my verification status | User |
| `POST` | `/` | Submit verification request | User |
| `POST` | `/ocr` | Auto-verify with OCR | User |
| `PUT` | `/:id` | Update verification info | User |
| `GET` | `/admin` | List verifications | Admin |
| `POST` | `/admin` | Create verification record | Admin |
| `GET` | `/admin/:id` | Get verification details | Admin |
| `PUT` | `/admin/:id` | Update verification record | Admin |
| `DELETE` | `/admin/:id` | Delete record | Admin |
| `PATCH` | `/:id/status` | Approve/Reject | Admin |

### 5. Routes (`/routes`)
| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Search routes | Public |
| `POST` | `/` | Create new route | Driver |
| `GET` | `/me` | Get my created routes | Driver |
| `GET` | `/:id` | Get route details | Public |
| `PUT` | `/:id` | Update route | Driver |
| `DELETE` | `/:id` | Delete route | Driver |
| `PATCH` | `/:id/cancel` | Cancel route | Driver |
| `GET` | `/admin` | List all routes | Admin |
| `GET` | `/admin/:id` | Get route details | Admin |
| `POST` | `/admin` | Create route | Admin |
| `PUT` | `/admin/:id` | Update route | Admin |
| `DELETE` | `/admin/:id` | Delete route | Admin |
| `GET` | `/admin/driver/:driverId` | List routes by driver | Admin |

### 6. Bookings (`/bookings`)
| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `GET` | `/me` | Get my bookings | User |
| `POST` | `/` | Create booking | User |
| `GET` | `/:id` | Get booking details | User |
| `PATCH` | `/:id/status` | Accept/Reject booking | Driver |
| `PATCH` | `/:id/cancel` | Cancel booking | User |
| `DELETE` | `/:id` | Delete booking record | User |
| `GET` | `/admin` | List all bookings | Admin |
| `POST` | `/admin` | Create booking | Admin |
| `GET` | `/admin/:id` | Get booking details | Admin |
| `PUT` | `/admin/:id` | Update booking | Admin |
| `DELETE` | `/admin/:id` | Delete booking | Admin |

### 7. Notifications (`/notifications`)
| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | List my notifications | User |
| `GET` | `/unread-count` | Count unread | User |
| `GET` | `/:id` | Get notification detail | User |
| `PATCH` | `/:id/read` | Mark as read | User |
| `PATCH` | `/read-all` | Mark all as read | User |
| `DELETE` | `/:id` | Delete notification | User |
| `GET` | `/admin` | List all notifications | Admin |
| `POST` | `/admin` | Send system notification | Admin |
| `DELETE` | `/admin/:id` | Delete notification | Admin |

### 8. Maps & Location (`/api/maps`)
| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `POST` | `/directions` | Get route directions | User |
| `GET` | `/geocode` | Address to Coordinates | User |
| `GET` | `/reverse-geocode` | Coordinates to Address | User |

### 9. OCR & iApp (`/ocr`)
| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `POST` | `/id-card/front` | OCR Badge Front | Public |
| `POST` | `/id-card/back` | OCR Badge Back | Public |
| `POST` | `/face-id-verification` | Verify Face + ID Card | Public |
| `POST` | `/driver-license` | OCR Driver License | User |
| `POST` | `/vehicle-registration` | OCR Vehicle Reg | User |

### 10. System Logs (`/system-logs`)
| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Search traffic logs | Admin |
| `DELETE` | `/:id` | Delete old log | Admin |

### 11. Blacklist (`/blacklist`)
| Method | Endpoint | Description | Guard |
| :--- | :--- | :--- | :--- |
| `GET` | `/` | Search blacklist | Admin |
| `POST` | `/` | Add to blacklist | Admin |
| `DELETE` | `/:id` | Remove from blacklist | Admin |
| `POST` | `/check` | Check ID (Internal) | User |
