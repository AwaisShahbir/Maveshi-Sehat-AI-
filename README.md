# 🐄 Maveshi Sehat AI (مویشی صحت اے آئی)

An AI-powered mobile application designed to revolutionize livestock healthcare for farmers and veterinarians in Pakistan. This project serves as a comprehensive platform for early disease detection, health monitoring, and expert consultation for livestock.

## 🌟 Key Features
- **Role-Based Access Control:** Distinct experiences tailored for both Farmers and Veterinarians.
- **Secure Authentication:** Complete registration flow featuring encrypted passwords and real-time Email OTP verification.
- **Bilingual Interface:** Support for both English and Urdu for maximum accessibility.
- **Modern UI/UX:** Responsive, smooth, and intuitive React Native design optimized for iOS, Android, and Web.
- **AI Disease Detection:** Image-based analysis using the camera or gallery to detect symptoms for diseases like Lumpy Skin Disease, FMD, and Mastitis.
- **Veterinary Consultation Chat:** Direct messaging connecting farmers with verified veterinarians, featuring automatic AI Scan Report sharing.
- **Marketplace & Cart:** Fully interactive UI for buying livestock and medical supplies with a cart system and floating total.
- **Health Records Management:** Track past AI scans, active diseases, and their treatment outcomes seamlessly.

## 🛠️ Technology Stack
- **Frontend:** React Native, Expo, React Navigation (Expo Router)
- **Backend:** Node.js, Express.js
- **Database:** PostgreSQL (pg-pool)
- **Security & APIs:** `bcryptjs`, `jsonwebtoken`, `nodemailer`

## 📂 Project Structure
```text
Maveshi-Sehat-AI/
├── maveshi-sehat-app/        # React Native Frontend (Expo)
│   ├── src/
│   │   ├── app/              # Screens (Welcome, Login, Register, Verify)
│   │   └── components/       # Reusable UI components
│   └── package.json          
└── maveshi-sehat-backend/    # Node.js Express Backend
    ├── server.js             # Main server logic and APIs
    ├── setupDatabase.js      # DB schema initialization script
    └── package.json          
```

## 🚀 How to Run Locally

### 1. Database Setup (PostgreSQL)
1. Install PostgreSQL and pgAdmin 4.
2. Create a database named `maveshi_sehat_db`.
3. In `maveshi-sehat-backend`, create a `.env` file with your credentials:
   ```env
   PORT=5000
   DB_USER=postgres
   DB_PASSWORD=your_password
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=maveshi_sehat_db
   ```
4. Run the database setup script to create the required tables:
   ```bash
   cd maveshi-sehat-backend
   node setupDatabase.js
   ```

### 2. Start the Backend Server
```bash
cd maveshi-sehat-backend
npm install
node server.js
```
*The server will start on http://localhost:5000*

### 3. Start the Frontend App
```bash
cd maveshi-sehat-app
npm install
npm run start
```
*Press `w` to open in a web browser, or use the Expo Go app on your phone to scan the QR code.*

---
**Developed by Awais Shahbir**
