# Maveshi Sehat (مویشی صحت) — Comprehensive System Architecture, Inter-Module Communication & Technical Defense Manual

---

## 1. Executive System Overview & Technology Stack

**Maveshi Sehat** is an AI-driven, full-stack digital livestock health, telemedicine, and pharmaceutical supply chain ecosystem developed for Pakistani farmers, livestock owners, veterinarians, and rural agricultural communities.

### 1.1 High-Level Architecture Diagram

```mermaid
flowchart TD
    subgraph ClientLayer ["Frontend Client Layer (React Native CLI)"]
        FarmerUI["Farmer / Livestock Owner App"]
        VetUI["Veterinarian Portal App"]
        ChatModule["Real-Time Chat & Telemedicine"]
        VideoModule["WebRTC Video Consultation (Agora)"]
        ScannerUI["AI Disease Scanner (Camera/Gallery)"]
    end

    subgraph GatewayLayer ["Networking & Real-Time Gateway"]
        ExpressAPI["Express.js REST API (Port 5000 / Render)"]
        SocketServer["Socket.IO WebSocket Server"]
        FCMService["Firebase Cloud Messaging (FCM) & Notifee"]
    end

    subgraph ServiceLayer ["Core Business & Intelligence Services"]
        AuthService["Auth & RBAC (JWT, Bcrypt, OTP)"]
        RoboflowGemini["AI Vision & Diagnostic Engine (Gemini 1.5/3.5)"]
        ChatbotService["AI Farmer Assistant (LLM + STT/TTS)"]
        HeatStress["THI Calculation & Weather Service"]
        PharmaService["Pharmacy E-Commerce & Order Pipeline"]
        TranslationEngine["Bilingual Engine (Static + Google Translate API)"]
    end

    subgraph PersistenceLayer ["Data & External Providers"]
        PostgresDB[(PostgreSQL Relational DB)]
        AgoraCloud["Agora RTC Video Cloud"]
        OpenMeteo["Open-Meteo Global Weather API"]
        EmailSMTP["Nodemailer Gmail SMTP Gateway"]
    end

    ClientLayer <-->|HTTPS / REST API| ExpressAPI
    ClientLayer <-->|WebSockets (ws://)| SocketServer
    ClientLayer <-->|Direct Media Stream| AgoraCloud

    ExpressAPI --> AuthService
    ExpressAPI --> RoboflowGemini
    ExpressAPI --> ChatbotService
    ExpressAPI --> HeatStress
    ExpressAPI --> PharmaService
    ExpressAPI --> TranslationEngine

    SocketServer --> PostgresDB
    ServiceLayer --> PostgresDB
    HeatStress --> OpenMeteo
    AuthService --> EmailSMTP
    ExpressAPI --> FCMService
    FCMService --> ClientLayer
```

---

### 1.2 Technology Stack Rationale for FYP Evaluators

| Layer / Component | Technology Selected | Technical Rationale & Evaluator Defense |
| :--- | :--- | :--- |
| **Mobile Client** | React Native (CLI v0.74+) | Native performance, direct Android/iOS hardware access (Camera, Microphone, Hardware H.264 video decoding), seamless integration with native Agora C++ RTC SDK. |
| **Backend Framework** | Node.js & Express.js (v5.x) | Non-blocking event-driven I/O ideal for high-concurrency chat sockets, asynchronous AI streaming, and real-time medical updates. |
| **Relational Database** | PostgreSQL (v16 via `pg` pool) | ACID compliance for financial orders, multi-party medical consultations, strict relational integrity (Foreign Keys between `users`, `consultations`, `prescriptions`, `orders`), and native `JSONB` support for flexible AI payloads. |
| **Real-time Comms** | Socket.IO (v4.8+) & Agora RTC | Socket.IO manages instant messaging, presence, typing indicators, and call signaling. Agora RTC manages low-latency peer-to-peer audio/video encoding without overloading backend server bandwidth. |
| **Artificial Intelligence** | Google Gemini 1.5 / 3.5 Flash Multimodal Vision | Replaced legacy single-disease detectors with multimodal visual intelligence capable of differential diagnosis across cattle, buffalo, goats, and sheep with high contextual grounding and Urdu clinical guidance. |
| **Weather & Microclimate** | Open-Meteo REST API | Hyperlocal, hourly temperature and relative humidity forecasts without proprietary API cost barriers or query limits. |
| **Push Notifications** | Firebase Admin SDK + Notifee | Cross-platform foreground/background notifications waking mobile devices for incoming telemedicine video calls and urgent outbreak alerts. |

---

## 2. Actor Ecosystem & Role-Based Access Control (RBAC)

The system enforces strict multi-tenant role isolation across four primary actors:

```
[System User]
   │
   ├── 1. Farmer (role = 'farmer')
   │      └── Access: AI Scanner, Book Consultations, Video Calls, Health Records,
   │                  Vaccinations, Weather Heat Alerts, Pharmacy Cart, Forum.
   │
   ├── 2. Veterinarian (role = 'vet')
   │      └── Access: Doctor Dashboard, Review AI Cases, Conduct Video/Chat Calls,
   │                  Issue Digital Prescriptions, Sign Off Discharge Summaries.
   │                  Status gate: Must be 'verified' by Admin (PVMC License check).
   │
   ├── 3. Pharmacy Partner (status = 'approved')
   │      └── Access: Inventory Management, Batch Numbers, Drug Categories,
   │                  Order Dispatch, Prescription Verification.
   │                  Status gate: Must have DRAP license approved by Admin.
   │
   └── 4. Administrator (role = 'admin')
          └── Access: System Audit, Approve/Reject Vets & Pharmacies,
                      Disease Outbreak Analytics, Revenue & User Moderation.
```

---

## 3. End-to-End Functional Deep Dive

---

### Feature 1: Authentication, OTP Verification & Session Security

#### How it Works:
1. **Registration:** Users select their role (`farmer` or `vet`).
   - If `vet`, they provide PVMC (Pakistan Veterinary Medical Council) registration number, years of experience, specialization, and upload CNIC/license documents.
2. **OTP Dispatch:** A cryptographically random 4-digit code is generated and saved to the `otps` table with a timestamp. It is emailed to the user via Nodemailer Gmail SMTP.
3. **Verification:** The user submits the code in `VerifyScreen.jsx`. If verified, the account is activated. (Vets remain in `pending` status until Admin approval).
4. **Password Reset:** Implemented in `ForgotPasswordScreen.jsx` using the same verified OTP protocol to avoid unauthorized account takeover.

#### Inter-File Communication:
- **Frontend Screens:** `RegisterScreen.jsx`, `LoginScreen.jsx`, `VerifyScreen.jsx`, `ForgotPasswordScreen.jsx`
- **Frontend Store:** `profileStore.js` (Stores active JWT token, user ID, user role, phone, and profile state in `AsyncStorage`).
- **Backend Endpoints:**
  - `POST /register` -> `auth.routes.js`
  - `POST /verify-otp` -> `auth.routes.js`
  - `POST /login` -> `auth.routes.js`
  - `POST /forgot-password` -> `auth.routes.js`
- **Database Tables:** `users`, `otps`.

---

### Feature 2: AI Livestock Disease Diagnostic Scanner

#### How it Works:
1. The farmer enters an animal identifier (e.g. `COW-101`) and takes a photo or selects from gallery in `AiScanScreen.jsx`.
2. The image is uploaded as `multipart/form-data` to `/api/ai/scan-disease`.
3. The backend `roboflowService.js` invokes **Google Gemini 3.5 Flash Multimodal Vision**:
   - The AI inspects lesions, ocular discharges, mucosal swelling, skin nodules (LSD), hoof blisters (FMD), or healthy condition.
   - Guardrails prevent hallucinatory false positives on non-animal images (e.g. humans, vehicles, events return "Non-livestock image detected").
4. The service returns structured JSON:
   - `disease`: Disease name (e.g. "Lumpy Skin Disease (LSD)", "Foot and Mouth Disease (FMD)", or "Healthy")
   - `confidence`: Confidence score (e.g. 96.5%)
   - `risk_level`: Low, Medium, or High
   - `symptoms`: Array of clinical observations
   - `first_aid`: Immediate actionable palliative steps in English & Urdu
5. The record is persisted in `detections` and synced with local storage via `recordsStore.js`.
6. A one-tap button **"Book Vet Consultation"** immediately carries the diagnostic report into `VeterinariansListScreen.jsx` to hand off to a certified doctor.

#### Inter-File Communication:
- **Frontend Screen:** `AiScanScreen.jsx`, `HealthRecordsScreen.jsx`
- **Frontend Store:** `recordsStore.js`
- **Backend Service:** `roboflowService.js`
- **Backend Controller:** `POST /api/ai/scan-disease` in `farmer.routes.js`
- **Database Tables:** `detections`, `admin_notifications` (fires alert if high-risk epidemic disease detected).

---

### Feature 3: Telemedicine, Consultation Booking & WebRTC Video Calling

#### Sub-Feature 3A: Consultation Booking & Auto-Validation
1. In `VeterinariansListScreen.jsx`, the farmer books a consultation:
   - **Online Chat Consultation**
   - **Video Consultation**
   - **Physical Farm Visit Appointment**
2. **Built-in Auto-Validation Engine:**
   - Detects inverted dates (e.g. `2024-30-12` -> automatically normalized to `2024-12-30`).
   - Enforces forward-looking dates (prevents booking in past years or past hours for today).
   - Normalizes single-digit times (`2:30` -> `14:30`).
3. Payload sent to `POST /api/consultations` creates a clinical record in `consultations`.

#### Sub-Feature 3B: Real-time In-Chat Telemedicine
- In `ChatScreen.jsx`, farmers and vets communicate over WebSockets:
  - `join_conversation`: Joins Socket.IO room scoped by `consultationId`.
  - `send_message`: Emits messages with optional image attachments or voice notes.
  - Messages saved to `messages` table and pushed to recipient via FCM if offline.

#### Sub-Feature 3C: WebRTC Real-Time 1-on-1 Video Consultation (Agora)
1. Either party initiates a video call in `ChatScreen.jsx`.
2. `CallContext.jsx` dispatches a socket signal `call_user` to the recipient.
3. The recipient hears ringing and sees `IncomingCallModal.jsx`.
4. Upon answering, `VideoCallModal.jsx` initializes the native `react-native-agora` RTC engine using credentials from `agoraConfig.js`:
   - Local video renders in picture-in-picture.
   - Remote video renders in full-screen.
   - Controls: Mute Audio, Switch Camera (Front/Rear for animal wound inspection), Speaker toggle, End Call.

#### Sub-Feature 3D: Clinical Case Resolution & Farmer Star Review
1. The vet can click **"Resolve Case"** in `ClinicalCaseBar.jsx`.
2. `ClinicalResolutionModal.jsx` opens to document:
   - Clinical Outcome: *Fully Recovered*, *Improving (Home Care)*, or *Referred to Field Hospital*.
   - Recommended Follow-up: *None*, *3 Days*, *7 Days*, *14 Days*.
   - Discharge instructions and recovery notes.
3. Saves to `consultations` (status marked `resolved`).
4. On the farmer's screen, `RatingReviewModal.jsx` pops up allowing 1 to 5-star rating and written review, updating doctor rating aggregates in `users`.

---

### Feature 4: Veterinary Digital Prescriptions & Pharmacy Order Pipeline

#### How it Works:
1. In `ChatScreen.jsx`, the vet clicks **"Prescribe"** -> opens `PrescriptionModal.jsx`.
2. Vet selects medicines from registered pharmacy inventory, sets dosage (e.g. `5ml once daily for 3 days`), and submits.
3. Payload is stored in `messages` (`is_prescription = TRUE`, `prescription_data`) and `farmer.routes.js`.
4. On the farmer's chat screen, the prescription renders as a rich medical card with a **"Buy Medicines / Add to Cart"** button.
5. Clicking it loads items into `cartStore.js`.
6. In `CartScreen.jsx`, the farmer reviews order total, enters farm delivery address, and selects payment:
   - **Cash on Delivery (COD)**
   - **JazzCash / EasyPaisa (Mobile Wallet Simulation)**
7. Submitting order calls `POST /api/orders` in `pharmacy.routes.js`, generating order record `ORD-XXXX` and deducting medicine stock.
8. The pharmacy partner views incoming orders in their portal to mark *Dispatched* and *Delivered*.

---

### Feature 5: AI Voice & Bilingual Chatbot Assistant

#### How it Works:
1. In `ChatbotScreen.jsx`, farmers can ask veterinary questions via Urdu or English text, or voice note.
2. If voice note: audio is converted to text via `speechToTextService.js`.
3. The prompt is forwarded to `chatbot.js`, using Google Gemini with specialized livestock prompt engineering (`config/systemPrompt.js`).
4. **Privacy & User Isolation Guard:**
   - Every chat log is tagged with the authenticated `user_id`.
   - SQL queries strictly filter `WHERE user_id = $1` to eliminate multi-user conversation history leaks.
5. The response is synthesized into speech audio via `textToSpeechService.js` for illiterate farmers who cannot read text.

---

### Feature 6: Smart Weather & Livestock Heat Stress Advisory (THI)

#### How it Works:
1. In `HeatAlertScreen.jsx`, the app fetches GPS location or district.
2. Calls `/api/weather/heat-stress` in `weather.routes.js`.
3. Backend fetches ambient temperature ($T$ in °C) and Relative Humidity ($RH$ in %) from the Open-Meteo API.
4. Calculates the scientific **Temperature-Humidity Index (THI)** for livestock:
   $$THI = 0.8 \times T + \left(\frac{RH}{100}\right) \times (T - 14.4) + 46.4$$
5. Evaluates risk bands:
   - **Normal ($THI < 72$):** Animal comfortable, optimum milk production.
   - **Moderate Stress ($72 \le THI \le 78$):** Respiration rate increases, mild decrease in milk yield (10–15%).
   - **Severe Stress ($79 \le THI \le 89$):** Drooling, high body temperature, significant milk drop (25–35%), electrolyte supplementation required.
   - **Emergency ($THI \ge 90$):** Risk of heat stroke and mortality. Immediate water misting and shaded shelter mandatory.
6. The backend automatically broadcasts push notifications to farmers in high-risk districts via `notificationService.js`.

---

### Feature 7: Livestock Vaccination Management System

#### How it Works:
1. In `VaccinationScreen.jsx`, farmers manage disease immunization schedules for their herd.
2. Pre-configured with Pakistani endemic diseases:
   - **Foot and Mouth Disease (FMD / منہ کھر):** Bi-annual (March & September).
   - **Hemorrhagic Septicemia (HS / گل گھوٹو):** Pre-monsoon annual (May/June).
   - **Black Quarter (BQ / چوڑیا):** Annual (April).
   - **Anthrax (گلٹھی):** Endemic region booster.
3. Farmers log administered vaccines with Tag ID, Date, Batch, and Vet Name.
4. Overdue vaccines are flagged with red alerts and trigger reminders via FCM.

---

### Feature 8: Community Knowledge Sharing Forum

#### How it Works:
1. In `CommunityForumScreen.jsx`, farmers and vets post questions, share experiences, and upload livestock images.
2. Categorized into *General Discussion*, *Disease Management*, *Nutrition & Feed*, *Breeding & Genetics*.
3. In `ForumPostDetailScreen.jsx`, users can add threaded comments and upvote/like posts.
4. Managed on the backend by `forum.routes.js` with tables `forum_posts` and `forum_comments`.

---

### Feature 9: Centralized Multilingual Translation Architecture

#### How it Works:
1. Language preference (`English` vs `Urdu`) is toggled in user profile and stored in `profileStore.js`.
2. All UI strings invoke `t('English String')` exported from `translate.js`.
3. **Dual-Layer Translation Engine:**
   - **Layer 1 (Offline Static Dictionary):** 1,000+ pre-translated pairs in `STATIC_URDU_DICTIONARY`. Zero latency, works offline, zero API expense.
   - **Layer 2 (Dynamic Online Fallback):** For user-generated descriptions, forum posts, and doctor notes, requests are sent to `/api/translate` in `translate.routes.js` using Google Translate API and cached in memory.
4. **Clean Code Standard:** All raw Urdu characters are quarantined strictly within `translate.js`. Zero raw Urdu text exists inside JSX presentation logic.

---

### Feature 10: Admin Governance & Portal Controls

#### How it Works:
1. Admin logs in via `/api/admin/login` in `auth.routes.js`.
2. Handled on backend by `admin.routes.js`:
   - **Vet Verification:** Reviews PVMC credentials and uploaded documents before approving doctor status.
   - **Pharmacy Licensing:** Reviews DRAP registration before pharmacy can sell medicines.
   - **Epidemiological Analytics:** Aggregates real-time disease detections across Punjab, Sindh, KPK, and Balochistan.
   - **System Broadcasts:** Sends high-priority push announcements to all or segmented users.

---

## 4. Master Inter-File Communication & Dataflow Matrix

| User Action / Feature | Mobile Screens | Local Stores / Contexts | REST API / Sockets | Backend Routes & Services | Database Tables |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **User Sign Up & Login** | `RegisterScreen.jsx`, `LoginScreen.jsx`, `VerifyScreen.jsx` | `profileStore.js` | `POST /register`, `POST /login`, `POST /verify-otp` | `auth.routes.js`, `mail.js` | `users`, `otps` |
| **AI Disease Scan** | `AiScanScreen.jsx` | `recordsStore.js` | `POST /api/ai/scan-disease` | `farmer.routes.js`, `roboflowService.js` (Gemini Vision) | `detections`, `admin_notifications` |
| **Book Consultation** | `VeterinariansListScreen.jsx` | `profileStore.js` | `POST /api/consultations` | `farmer.routes.js`, `notificationService.js` | `consultations`, `user_notifications` |
| **Real-Time Text Chat** | `ChatScreen.jsx`, `ChatMessageItem.jsx` | `themeContext.js` | Socket.IO: `send_message`, `receive_message` | `chat.routes.js`, `socketHandler.js` | `conversations`, `messages` |
| **1-on-1 Video Call** | `ChatScreen.jsx`, `VideoCallModal.jsx` | `CallContext.jsx`, `agoraConfig.js` | Sockets: `call_user`, `call_accepted` + Agora RTC | `socketHandler.js`, Agora Cloud Gateway | `conversations` |
| **Resolve & Rate Case** | `ClinicalCaseBar.jsx`, `ClinicalResolutionModal.jsx`, `RatingReviewModal.jsx` | `profileStore.js` | `PUT /api/chat/conversation/resolve`, `POST /api/consultations/:id/rating` | `chat.routes.js` | `consultations`, `conversations`, `users` |
| **Digital Prescription** | `PrescriptionModal.jsx`, `ChatScreen.jsx` | `cartStore.js` | `POST /api/vet/prescriptions` | `vet.routes.js`, `chat.routes.js` | `messages`, `medicines` |
| **Pharmacy Checkout** | `MarketplaceScreen.jsx`, `CartScreen.jsx` | `cartStore.js` | `POST /api/orders` | `pharmacy.routes.js` | `medicines`, `orders`, `order_items` |
| **AI Farm Assistant** | `ChatbotScreen.jsx` | `profileStore.js` | `POST /api/chatbot/message` | `chatbot.js`, `geminiService.js`, `speechToTextService.js`, `textToSpeechService.js` | `chat_logs` |
| **Heat Stress Alerts** | `HeatAlertScreen.jsx`, `DashboardScreen.jsx` | `profileStore.js` | `GET /api/weather/heat-stress` | `weather.routes.js`, `heatStressService.js`, Open-Meteo API | `user_notifications` |
| **Vaccine Scheduling** | `VaccinationScreen.jsx`, `VaccinationModal.jsx` | `profileStore.js` | `GET /api/farmer/vaccinations`, `POST /api/farmer/vaccinations` | `farmer.routes.js` | `farmer_vaccinations` |
| **Forum Discussions** | `CommunityForumScreen.jsx`, `ForumPostDetailScreen.jsx` | `profileStore.js` | `GET /api/forum/posts`, `POST /api/forum/posts` | `forum.routes.js` | `forum_posts`, `forum_comments` |
| **Admin Governance** | Admin Web Portal | Admin Token | `GET /api/admin/dashboard-stats`, `PUT /api/admin/vets/:id/status` | `admin.routes.js` | `users`, `pharmacies`, `admin_notifications` |

---

## 5. FYP Defense & Evaluator Questions (Cheat Sheet)

### Q1: Why did you choose Google Gemini 3.5 Flash for disease detection over building a custom CNN from scratch?
> **Answer:**  
> Training a custom CNN requires tens of thousands of labeled clinical images for dozens of livestock diseases under varied field lighting conditions, which are unavailable in localized agricultural databases. Google Gemini 3.5 Flash Multimodal Vision provides zero-shot and few-shot clinical veterinary reasoning. It analyzes visual symptoms (e.g., skin nodules in LSD, foot lesions in FMD, ocular discharge in PPR), cross-references them with animal species, eliminates false positives on non-animal images, and generates structured clinical first-aid advice in both English and Urdu.

---

### Q2: How does the video call work without overwhelming your Node.js backend server?
> **Answer:**  
> We use a **hybrid signaling and peer-to-peer media pipeline**:
> 1. Our Node.js and Socket.IO backend is only used for **call signaling** (initiating the call, ringing, accepting, and terminating).
> 2. The high-bandwidth audio/video streaming bypasses our backend entirely and connects directly via the **Agora WebRTC Cloud SD-RTN (Software Defined Real-time Network)** using native hardware video decoders on the device. This ensures ultra-low latency (<200ms) with zero server CPU overhead.

---

### Q3: How do you handle connectivity issues for farmers in remote rural areas with poor 3G/4G?
> **Answer:**  
> We implemented three layers of resilience:
> 1. **Offline Static Translation:** Over 1,000 UI elements and clinical strings are bundled inside `translate.js` as an offline static hash map, requiring zero network calls to translate the app interface.
> 2. **Local Caching (`AsyncStorage`):** Diagnostic scan history, health records, and user profiles are stored locally in `recordsStore.js` and `profileStore.js`, enabling offline review of animal history.
> 3. **Push Notification Fallbacks:** When a farmer is disconnected from WebSockets, notifications and telemedicine requests are queued and delivered via Firebase Cloud Messaging (FCM) high-priority data payloads as soon as connectivity restores.

---

### Q4: How is database data integrity maintained when a user orders prescription medicines?
> **Answer:**  
> We use **PostgreSQL ACID relational transactions**:
> 1. When an order is placed (`POST /api/orders`), the transaction checks stock levels in `medicines`.
> 2. If sufficient, it atomically inserts the order header into `orders`, inserts multiple items into `order_items`, and decrements available inventory (`stock = stock - quantity`).
> 3. If any step fails (e.g., insufficient stock or payment simulation error), the entire transaction rolls back, preventing orphaned records or inventory drift.

---

### Q5: How do you ensure farmer privacy and prevent conversation history leakage in the AI Assistant?
> **Answer:**  
> Every chatbot message payload requires an authenticated `userId`. All database queries against `chat_logs` are strictly parameterized and scoped with `WHERE user_id = $1`. Guest sessions and cross-user session lookups are strictly prohibited, ensuring that no farmer ever sees the symptoms, questions, or medical history of another farmer.

---

## 6. Project Verification & Artifact Information

- **Production APK Name:** `MaveshiSehat-Universal-v1.0.apk`
- **Location:** `e:\Maveshi Sehat\MaveshiSehat-Universal-v1.0.apk`
- **Size:** 93.19 MB (< 100 MB target achieved)
- **Architecture Compatibility:** Universal (arm64-v8a, armeabi-v7a, x86_64)
- **Codebase Syntax Health:** 106/106 Files Validated Clean (0 errors)
- **GitHub Repository Status:** Synchronized with `origin/main` (`94deb02`)
