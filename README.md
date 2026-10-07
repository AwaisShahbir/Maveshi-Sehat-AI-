# 🐄 Maveshi Sehat AI (مویشی صحت اے آئی)

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen.svg)](https://nodejs.org/)
[![React Native](https://img.shields.io/badge/React%20Native-0.83.6-blue.svg)](https://reactnative.dev/)
[![React](https://img.shields.io/badge/React-19.2.0-61dafb.svg)](https://react.dev/)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791.svg)](https://www.postgresql.org/)
[![OpenAI](https://img.shields.io/badge/AI-OpenAI%20Whisper%20%26%20TTS-412991.svg)](https://openai.com/)
[![Gemini](https://img.shields.io/badge/LLM-Gemini%201.5%20Flash-orange.svg)](https://deepmind.google/technologies/gemini/)

**Maveshi Sehat AI** is Pakistan's comprehensive, AI-powered livestock health and telemedicine platform tailored specifically for dairy cattle (**Cows / گائے**) and **Buffaloes (بھینس)**. The platform bridges the gap between livestock farmers, PVMC-licensed veterinarians, and licensed pharmacies through real-time disease scanning, voice-enabled AI assistance, appointment booking, and digital veterinary supply management.

---

## 🏗️ Platform Architecture

The repository is organized into four interconnected modules:

```text
Maveshi-Sehat-AI/
├── 📱 maveshi-sehat-app/        # React Native Native Mobile App (Android & iOS)
├── ⚙️ maveshi-sehat-backend/    # Node.js, Express, PostgreSQL & Multi-AI Orchestrator
├── 🖥️ maveshi-sehat-admin/      # React + Vite Web Management Portal for Admins
└── 💊 maveshi-sehat-pharmacy/   # React + Vite Pharmacy Portal for Inventory & Orders
```

---

## ✨ Key Features & Capabilities

### 1. 🤖 "Sehat Assistant" (صحت اسسٹنٹ) — AI Veterinary Guide
- **Multi-Engine AI Routing:** Primary reasoning powered by **Google Gemini 1.5 Flash** with high-speed automated fallback to **Groq (Llama 3.3 70B)**.
- **Strict Language & Script Consistency:**
  - **Roman Urdu:** 100% natural Roman Urdu in the Latin alphabet without unwanted Arabic/Urdu script mixing.
  - **English:** 100% professional English without script mixing.
  - **Urdu Script (اردو رسم الخط):** Full native Urdu script typography (`Noto Nastaliq Urdu`).
- **Formal Male Persona:** Consistent grammatical gender in Urdu/Roman Urdu (*"main kar sakta hoon"*, *"main madad karoon ga"*).
- **Targeted Livestock Scope:** Exclusively specialized in **Cows** and **Buffaloes** (LSD, FMD, Mastitis, nutrition, heat stress).
- **In-App Action Deep Links:** Action buttons like `[👨‍⚕️ View Veterinarians](app:VeterinariansList)` or `[📸 AI Scanner](app:AiScan)` that instantly navigate to specific app screens when tapped.
- **Dynamic District-Based Vet Recommendations:** Recommends verified veterinarians from the live PostgreSQL database according to the farmer's district.
- **Voice-to-Voice AI Interaction:**
  - **Speech-to-Text (STT):** Powered by **OpenAI Whisper (`whisper-1`)** with fallback to Groq Whisper.
  - **Text-to-Speech (TTS):** Natural, human-like voice synthesis via **OpenAI TTS (`tts-1`)** with Google TTS fallback.
  - **Auto Voice Playback:** Automatically speaks the AI reply upon receiving a voice query, with on-demand interactive "Listen / Stop" toggles.

### 2. 📸 AI Disease Detection & Scanning
- Instant camera and gallery scanning for cattle and buffalo skin, mouth, and udder conditions:
  - **Lumpy Skin Disease (LSD / لمپی سکن)**
  - **Foot and Mouth Disease (FMD / منہ کھر)**
  - **Mastitis (Saarr / ساڑو)**
  - **Ticks, Lice & Mites (چیچڑ اور جوئیں)**
  - **Body Condition Score (BCS)**
- Provides confidence scores, severity ratings, immediate emergency first-aid protocols, and one-tap report sharing with veterinarians.

### 3. 👨‍⚕️ Veterinarian Network & Consultations
- Verified directory of PVMC-licensed veterinary doctors across districts in Pakistan.
- Online consultation requests (chat, image sharing) and in-person farm/clinic appointment scheduling.
- Digital prescription generation and consultation logs.

### 4. 🛒 Veterinary Marketplace & Pharmacy Portal
- Browsing approved veterinary medicines, vaccines, anthelmintics, and dairy feed supplements.
- Dedicated web portal for pharmacies to manage medicine inventory, batch tracking, expiry dates, and fulfillment.

### 5. 🌡️ Heat Stress & Weather Alerts
- Temperature-Humidity Index (THI) calculation designed for Pakistani dairy breeds (Sahiwal, Nili-Ravi, Cholistani, Friesian).
- Preventative guidance for heat stroke, ventilation, and hydration.

### 6. 🛡️ Comprehensive Admin Portal
- Real-time verification workflow for veterinarian PVMC licenses and pharmacy registrations.
- Epidemic disease trend analysis, user management, and audit logs.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Mobile App** | React Native `0.83.6`, React `19.2.0`, React Navigation, Native Android AudioModule (Kotlin) |
| **Backend API** | Node.js, Express.js, PostgreSQL (`pg` connection pool), Socket.io, Multer |
| **AI & LLM Services**| Google Gemini 1.5 Flash (`@google/generative-ai`), Groq SDK (`groq-sdk`), OpenAI API (`openai`) |
| **Audio & Speech** | OpenAI Whisper-1, OpenAI TTS-1, Google TTS API, Android MediaPlayer & MediaRecorder |
| **Admin & Pharmacy Portals** | React, Vite, Tailwind CSS, Lucide Icons |
| **Security & Auth** | JWT, `bcryptjs`, Nodemailer (OTP Verification) |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher)
- [PostgreSQL](https://www.postgresql.org/) (v14 or higher)
- [Android Studio](https://developer.android.com/studio) with Android SDK (API 34/35) & Emulator
- API Keys:
  - `GEMINI_API_KEY` (Google AI Studio)
  - `OPENAI_API_KEY` (OpenAI Platform)
  - `GROQ_API_KEY` (Groq Console, optional fallback)

---

### 1. Database Setup
1. Launch PostgreSQL and create the database:
   ```sql
   CREATE DATABASE maveshi_sehat_db;
   ```
2. Navigate to `maveshi-sehat-backend` and create your `.env` file:
   ```env
   PORT=5000
   DB_USER=postgres
   DB_PASSWORD=your_postgres_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=maveshi_sehat_db

   # AI Credentials
   OPENAI_API_KEY=your_openai_api_key
   GEMINI_API_KEY=your_gemini_api_key
   GROQ_API_KEY=your_groq_api_key

   # Email OTP (Optional for development)
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```
3. Initialize database tables and migrations:
   ```bash
   cd maveshi-sehat-backend
   node setupDatabase.js
   ```

---

### 2. Start the Backend API Server
```bash
cd maveshi-sehat-backend
npm install
node server.js
```
*API server runs at `http://localhost:5000` (Socket.IO enabled).*

---

### 3. Run the Mobile App (Android)
1. Ensure your Android emulator or physical device is connected via ADB:
   ```bash
   adb devices
   adb reverse tcp:5000 tcp:5000
   adb reverse tcp:8081 tcp:8081
   ```
2. Launch Metro and run the Android app:
   ```bash
   cd maveshi-sehat-app
   npm install
   npm run start
   ```
3. In a separate terminal, install and run on Android:
   ```bash
   cd maveshi-sehat-app
   npm run android
   ```

---

### 4. Run the Web Portals (Admin & Pharmacy)

#### Admin Management Portal:
```bash
cd maveshi-sehat-admin
npm install
npm run dev
```
*Accessible at `http://localhost:5173`.*

#### Pharmacy Partner Portal:
```bash
cd maveshi-sehat-pharmacy
npm install
npm run dev
```
*Accessible at `http://localhost:5174`.*

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

**Developed with ❤️ for Pakistani Livestock Farmers & Dairy Caregivers by Awais Shahbir**
