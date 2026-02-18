# Drive To Survive — เดินทางร่วมกันอย่างปลอดภัย 🚗💨

แพลตฟอร์มสำหรับเดินทางร่วมกัน (Carpool) ที่เน้นความปลอดภัย การยืนยันตัวตน และการช่วยเหลือฉุกเฉิน

## 📋 Features

- **Carpooling & Route Management**:
  - ค้นหาและสร้างการเดินทางร่วมกัน (Find & Create Trip)
  - ระบบจัดการรถยนต์ (My Vehicle) พร้อมสิ่งอำนวยความสะดวก
  - ยืนยันสิทธิ์คนขับอัตโนมัติ (Driver Guard System)
- **Identity Verification (e-KYC)**:
  - ยืนยันตัวตนด้วยบัตรประชาชนและใบขับขี่ผ่าน OCR (iApp Thai e-KYC)
  - ตรวจสอบความถูกต้องของข้อมูลและรูปถ่ายหน้าตรง (Selfie Check)
  - ระบบอนุมัติคนขับอัตโนมัติ (Auto-Approval Workflow)
- **Safety & Security**:
  - **Blacklist System**: ป้องกันผู้ใช้ที่ถูกแบนกลับมาใช้งาน (Hash-based check)
  - **Session Management**: ระบบ Auto-logout เมื่อไม่มีการใช้งาน 20 นาที
  - **Real-time Tracking**: ติดตามตำแหน่งผู้ขับขี่และผู้โดยสาร
  - **SOS System**: ปุ่มขอความช่วยเหลือฉุกเฉิน
- **Compliance & Privacy**:
  - **PDPA Support**: สิทธิในการลบข้อมูล (Account Deletion) และ Data Minimization
  - **Traffic Data Logs**: เก็บ Log การใช้งานตาม พ.ร.บ. คอมพิวเตอร์ฯ 90 วัน
- **User Experience**:
  - **Dynamic Roles**: ปรับเปลี่ยนสถานะ Passenger/Driver อัตโนมัติ
  - **Notification Center**: แจ้งเตือนสถานะการจองและการยืนยันตัวตน
  - **Forgot Password**: กู้คืนรหัสผ่านด้วย OTP ทางอีเมล
  - **Rating & Reviews**: ให้คะแนนและรีวิวผู้ร่วมเดินทาง

## 🛠 Tech Stack

- **Frontend**: Nuxt 3, Vue 3, TailwindCSS
- **Backend**: Express.js, Node.js
- **Database**: MySQL, Prisma ORM
- **Maps**: Google Maps API
- **Storage**: Cloudinary

## 🚀 Getting Started

### Prerequisites

- Node.js (v22.0.0 or higher)
- npm
- MySQL Database

### Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/kriangkraiii/SprintSE_Group4_4.git
    cd SprintSE_Group4_4/DriveToSurviveWebApp
    ```

2.  Install dependencies for both client and server:
    ```bash
    npm run install:all
    ```
    *(Or install manually in `client/` and `server/` directories)*

### Configuration

1.  Create the environment variables file by copying the example:
    ```bash
    cp .env.example .env
    ```

2.  Open `.env` and fill in the required values:

    ```ini
    # Database Connection
    DATABASE_URL="mysql://user:password@host:port/database"

    # Google Maps
    NUXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_key
    GOOGLE_MAPS_API_KEY=your_key

    # Cloudinary (Image Uploads)
    CLOUDINARY_CLOUD_NAME=...
    CLOUDINARY_API_KEY=...
    CLOUDINARY_API_SECRET=...

    # Security
    JWT_SECRET=your_super_secret_key

    # iApp Thai e-KYC
    IAPP_API_KEY=...

    # Admin Initial Setup
    ADMIN_EMAIL=admin@example.com
    ADMIN_USERNAME=admin
    ADMIN_PASSWORD=secure_password

    # Email Service (SMTP)
    SMTP_HOST=smtp.gmail.com
    SMTP_USER=your_email@gmail.com
    SMTP_PASS=your_app_password
    ```

### Database Setup

Initialize the database schema using Prisma (run from the `server` directory or via root script if configured):

```bash
cd server
npx prisma generate
npx prisma db push
# OR
npm run db:migrate
```

### Running the Application

To run both Frontend and Backend concurrently:

```bash
npm run dev
```

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001
- **API Documentation**: http://localhost:3001/documentation

#### Running Individually

- **Frontend only**:
  ```bash
  npm run dev:client
  ```
- **Backend only**:
  ```bash
  npm run dev:server
  ```

## 📂 Project Structure

```
DriveToSurviveWebApp/
├── .env                  # Environment variables (Git-ignored)
├── .env.example          # Environment variables template
├── client/               # Nuxt 3 Frontend
│   ├── components/       # Vue Components
│   ├── pages/            # Application Pages (Routing)
│   ├── nuxt.config.js    # Nuxt Configuration
│   └── ...
├── server/               # Express Backend
│   ├── src/
│   │   ├── controllers/  # Request Handlers
│   │   ├── routes/       # API Definitions
│   │   ├── prisma/       # Database Schema
│   │   └── ...
└── package.json          # Root scripts for concurrent execution
```
