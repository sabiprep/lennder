# Lennder — Campus Urgent Rental & Managed Stock Platform

Lennder (evolved from the BorrowBox founder blueprint) is a campus-focused, on-demand academic equipment and essentials rental platform built for university and polytechnic students. It solves urgent, last-minute student emergencies—such as forgetting a **Lab Coat** before a practical, needing a **Scientific Calculator** right before an exam, or requiring temporary access to a **Laptop**—by connecting verified students with nearby **Managed Campus Stock Points** as well as verified **Peer-to-Peer (P2P) Student Lenders**, backed by server-verified payments, refundable deposits, and ephemerally stored collateral photos that auto-purge upon item return.

---

## User Review & Critical Decisions

> [!IMPORTANT]
> All core architectural and product workflow choices have been aligned with your answers and the BorrowBox MVP Launch Plan PDF:

- **Confirmed Decision 1 — Hybrid Supply Model (Managed Stock Points + P2P Toggle)**: The catalogue defaults to **Lennder Managed Stock Points** (founder-owned, attendant-verified campus hubs with guaranteed availability and asset codes) while providing a seamless toggle to view or post **P2P Student Listings** (allowing nearby students with an extra lab coat or calculator to lend items).
- **Confirmed Decision 2 — Dual Security Protocol (Refundable Deposit + Ephemeral Collateral Photo)**: Every booking calculates both the **Rental Fee** and a **Refundable Security Deposit** on the server. After server-verified payment, the student unlocks the exact pickup hub coordinates/directions, a unique **Booking QR/OTP**, and a **Collateral Photo Upload** step where they photograph their physical collateral item (e.g., hostel ID, watch, or accessory) at handover. When the rented item is returned and inspected, the collateral image is **permanently purged** from storage and the deposit refund is triggered.
- **Confirmed Decision 3 — Automated Reg Number & Student ID Card Scan Verification**: First-time student onboarding collects **Institution**, **Full Legal Name**, **Registration/Matric Number**, **Faculty**, **Department**, **Current Level**, and a **Student ID Card Scan**. A server-side Gemini multimodal verification route (`gemini-3.8-flash`) extracts and cross-checks the Student ID card text against the entered Name, Reg Number, and Institution for instant verification, with an **Admin Manual Review override** in the Operations Console.
- **Confirmed Decision 4 — Cloud SQL (PostgreSQL) + Drizzle ORM + React Native Ready Architecture**: The backend uses **Cloud SQL for PostgreSQL** with **Drizzle ORM** and **Firebase Authentication** (matching Section 9.1 of the PDF). All frontend state and API calls are structured inside a clean, platform-agnostic service layer (`src/services/lennderApi.ts` and shared TypeScript domain types) so the business logic can be ported directly to a React Native mobile app.

---

## 1. Overview & Core Concept

- **What It Does**: Enables students in any supported institution to urgently locate, book, pay for, collect, and return essential academic items (**Lab Coats**, **Calculators**, and **Laptops** initially, extensible to drawing boards, multimeters, and projectors) within minutes.
- **Target Audience / Persona**:
  1. **Urgent Student Renter**: Arrives at a lab or exam hall needing a lab coat, scientific calculator, or laptop immediately.
  2. **Campus Stock Point Attendant / Founder**: Manages physical handover and return inspections at designated campus hubs using QR/OTP verification and condition checklists.
  3. **Peer Student Lender**: A verified student on campus who lists an extra lab coat or calculator to earn extra income.
- **Key Value**: Eliminates missed practicals and exams through sub-5-minute discovery, transparent pricing (Rental Fee separated from Refundable Deposit), strict anti-fraud verification (never releasing items on unverified payment screenshots), and automatic collateral photo deletion on return.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **First-Time Institutional Onboarding & Automated ID Verification**:
   - Student signs in and completes their institutional profile: selects **Institution** (e.g., University of Uyo, Akwa Ibom State University, UNILAG, Covenant University, etc.), enters **Full Name**, **Reg / Matric Number**, **Faculty**, **Department**, and **Current Level** (100L–600L).
   - Student uploads or captures their **Student ID Card**. The backend verifies that the name, institution, and registration number format match, granting a `VERIFIED` student badge (or routing edge cases to Admin Review).
2. **Urgent Scenario 1 & 2 — Instant Browse, Supply Toggle & Urgent Request**:
   - From the main directory dashboard, the student filters by **All**, **Lab Coats**, **Calculators**, or **Laptops**, and switches between **Managed Stock Points** (guaranteed hub stock) and **Nearby Student Peers (P2P)**.
   - If no exact match is available at their building, the student taps **"Broadcast Urgent Request"** (specifying item, building/lab location, and how many minutes until their practical/exam starts).
3. **Transparent Checkout & Server-Verified Payment**:
   - Selecting an item opens the **Contiguous Booking Drawer/Sheet**: choose duration (**Hourly**, **Same-Day Practical/Exam**, **Daily**, or **Weekly**), select the nearest **Campus Stock Point**, and review the itemized breakdown:
     - **Rental Fee** (recognized revenue, e.g., ₦1,000)
     - **Refundable Security Deposit** (tracked separately as a refundable liability, e.g., ₦3,500)
     - **Total Due Before Collection** (e.g., ₦4,500)
   - Clicking **Pay & Reserve** initializes a server-side transaction reference (simulated Paystack checkout modal with real server-side webhook/reference verification so screenshots cannot spoof paid status).
4. **Post-Payment Pickup Map, Collateral Proof Upload & Handover QR/OTP**:
   - Immediately upon server payment confirmation, the booking transitions to `PAID_AWAITING_HANDOVER` and reveals the **Collection Pass View**:
     - Exact **Campus Stock Point Location**, building room/landmark directions, attendant name, and operating hours.
     - Unique **6-digit Handover OTP** and **Scan QR Code**.
     - **Collateral Item Submission & Proof**: The student selects their physical collateral type (or P2P agreement), captures/uploads the **Collateral Proof Screenshot/Photo**, and both student and attendant confirm the item condition checklist.
5. **Return Inspection, Automatic Collateral Photo Purge & Deposit Refund**:
   - When the practical or exam ends, the student returns the item to the Stock Point.
   - The attendant (or Admin in the Attendant View) scans/enters the Asset ID & Booking Code, inspects the item against the handover condition record, and clicks **Confirm Return & Purge Collateral**.
   - The system **permanently deletes the collateral screenshot/photo payload** from the database to save space and protect privacy, sets the asset back to `AVAILABLE`, and processes the **Deposit Refund** to the student's ledger.
6. **Dash Menu Bar (Slide-Out Drawer) & Multi-Role Workspace**:
   - Accessible from the top bar, the **Dash Menu Drawer** gives quick access to:
     - **Campus Directory (Browse & Search)**
     - **My Active Rentals & Collection Passes** (with live countdown timer and extension requests)
     - **Urgent Campus Requests Board**
     - **Lend My Item (P2P Student Listing Creator)**
     - **Receipts, Deposit Ledger & Support Cases**
     - **Attendant / Founder Operations Console** (Stock Points, Asset QR Registry, Handover/Return Scanner, Student ID Verifications, and Pilot Unit Economics Metrics)

### Visual Identity & Theme

- **Aesthetic Direction**: **High-Trust Campus Utility** — crisp, daylight-legible mobile-first ergonomics that expand cleanly to a multi-column 1440px desktop command workspace.
- **Color Palette & Mood (60-30-10 Discipline)**:
  - **60% Dominant Neutral Canvas**: Crisp warm alabaster (`#F8FAFC` / `bg-slate-50`) in light mode; deep carbon slate (`#0B0F17` / `dark:bg-slate-950`) in dark mode.
  - **30% Structural Surfaces**: Pure white cards (`#FFFFFF` / `dark:bg-slate-900`) with subtle hairline borders (`border-slate-200/80` / `dark:border-slate-800`) and deep ink typography (`#0F172A` / `dark:text-slate-100`).
  - **10% Accent Budget**: Campus Emerald (`#059669` / `bg-emerald-600`) for primary booking actions, verified trust states, and active stock availability; Warm Amber (`#D97706`) for urgent exam/practical timers and collateral hold states.
- **Typography & Hierarchy (2+1 Font Rule)**:
  - **Display / Headings**: `Plus Jakarta Sans` (SemiBold/Bold, tight tracking, balanced headline wrapping).
  - **Body Prose**: `DM Sans` (Regular/Medium for high legibility on mobile screens).
  - **Monospace / Telemetry & Financial Ledger**: `JetBrains Mono` with `tabular-nums` for Naira (`₦`) pricing, deposit ledgers, Asset IDs (`LND-LC-001`), OTP codes, and countdown timers.
- **Component Styling & Layout**:
  - **Zero-Pill Metadata Discipline**: Item categories, condition grades, stock point distances, and asset codes render as clean unboxed inline typography separated by `·` bullets. Interactive filter tabs (`All`, `Lab Coats`, `Calculators`, `Laptops`) use tactile segmented button groups (`min-h-[44px]`).
  - **Responsive Mobile + Desktop Shell**: Fixed bottom 4-tab bar + slide-out Dash Menu Drawer on mobile (`< 1024px`, keeping sticky height under 15% of viewport), expanding to a full-width 1440px layout with a 3-zone Top Bar and structured 3-column grid on desktop.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1: Separate Rental Fee vs. Refundable Security Deposit Ledger**
  - *Chosen Approach*: Store and calculate `rentalFee` and `securityDeposit` as distinct integer columns on every asset and booking, rather than a single combined price.
  - *Why*: Directly implements Section 6.1 & Section 8 of the BorrowBox PDF blueprint—preventing refundable liabilities from being confused with earned rental revenue and enabling transparent partial/full deposit refunds on return.
- **Decision 2: Ephemeral Collateral Storage with Automatic Return Purge**
  - *Chosen Approach*: Store the collateral item description and proof image inside the `handovers` / `bookings` record during an active rental, and execute an atomic `UPDATE ... SET collateral_image_data = NULL, collateral_purged_at = NOW()` inside the return transaction.
  - *Why*: Directly satisfies your requirement that students submit a collateral screenshot/photo as proof during pickup and have it automatically removed upon item return to avoid unnecessary storage space and protect student privacy (PDF Section 5.2 & 10).
- **Decision 3: Server-Side Payment Verification & Anti-Screenshot Handover Rule**
  - *Chosen Approach*: Bookings start as `PENDING_PAYMENT`. Only the backend payment verification endpoint (`/api/payments/verify`) can transition a booking to `PAID_AWAITING_HANDOVER` and generate the cryptographic 6-digit Handover OTP.
  - *Why*: Enforces the PDF's strict rule: *"DO NOT RELEASE ON A SCREENSHOT — A payment screenshot is not proof of payment."*

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                     CLIENT: REACT + TAILWIND WEBAPP SHELL                    │
│        (Mobile-First Touch UI + 1440px Desktop Grid · RN-Ready API Layer)    │
├──────────────────────┬───────────────────────────┬───────────────────────────┤
│  Onboarding & Auth   │   Student Rental Hub      │  Dash Drawer & Admin Ops  │
│  ┌────────────────┐  │  ┌─────────────────────┐  │  ┌─────────────────────┐  │
│  │ Google Sign-In │  │  │ Category & Supply   │  │  │ Active Rentals &    │  │
│  │ + Institution  │  │  │ Toggle (Hub vs P2P) │  │  │ Collateral Proof    │  │
│  │ Profile Form   │  │  ├─────────────────────┤  │  ├─────────────────────┤  │
│  ├────────────────┤  │  │ Contiguous Checkout │  │  │ P2P Item Lister &   │  │
│  │ Student ID Scan│  │  │ (Fee + Deposit)     │  │  │ Urgent Request Feed │  │
│  │ Auto-Verifier  │  │  ├─────────────────────┤  │  ├─────────────────────┤  │
│  └────────────────┘  │  │ Pickup Map + QR/OTP │  │  │ Attendant Handover, │  │
│                      │  │ + Collateral Upload │  │  │ Return & Purge Desk │  │
│                      │  └─────────────────────┘  │  └─────────────────────┘  │
└──────────┬───────────┴─────────────┬─────────────┴─────────────┬─────────────┘
           │                         │                           │
           ▼                         ▼                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                 SHARED CLIENT SERVICE LAYER (src/services/api.ts)            │
│      (Clean TypeScript interfaces & fetch wrappers portable to React Native) │
└────────────────────────────────────┬─────────────────────────────────────────┘
                                     │ Bearer <Firebase ID Token>
                                     ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                     SERVER: EXPRESS.JS API (server.ts)                       │
├──────────────────────┬───────────────────────────┬───────────────────────────┤
│  Auth & ID Verify    │   Inventory & Bookings    │  Handover, Return & Purge │
│  • Firebase Admin    │  • Stock Points & Assets  │  • QR/OTP Verification    │
│  • Gemini 3.8 Flash  │  • Server Price & Deposit │  • Collateral Photo Save  │
│    ID OCR & Match    │  • Paystack Sim & Verify  │  • Auto-Purge on Return   │
└──────────┬───────────┴─────────────┬─────────────┴─────────────┬─────────────┘
           │                         │                           │
           ▼                         ▼                           ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│              CLOUD SQL FOR POSTGRESQL + DRIZZLE ORM (src/db/)                │
│  Tables: users · student_verifications · stock_locations · assets ·          │
│          bookings · payments · handovers_and_returns · urgent_requests       │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State (Cloud SQL PostgreSQL via Drizzle ORM)

1. **`users` & `student_verifications`**:
   - Stores Firebase `uid`, `email`, `fullName`, `institution`, `regNumber`, `faculty`, `department`, `level`, `phone`, `role` (`student` | `attendant` | `admin`), `verificationStatus` (`UNVERIFIED` | `PENDING_REVIEW` | `VERIFIED`), and verification audit metadata.
2. **`stock_locations`**:
   - Campus collection points (e.g., *Main Science Complex Hub — Lab Block B*, *Engineering Faculty Annex Hub*, *Main Library Stock Point*) with building directions, operating hours, and assigned attendant name/contact.
3. **`assets`**:
   - Physical rental items across initial categories (`LAB_COAT`, `CALCULATOR`, `LAPTOP`) and expandable categories (`DRAWING_BOARD`, `MULTIMETER`, `PROJECTOR`).
   - Tracks `assetCode` (e.g., `LND-LC-101`), `title`, `category`, `ownershipType` (`MANAGED_STOCK` | `P2P_STUDENT`), `ownerUserId`, `locationId`, `conditionGrade`, `sizeOrSpec`, `hourlyRate`, `dailyRate`, `weeklyRate`, `securityDeposit`, `status` (`AVAILABLE` | `RESERVED` | `RENTED` | `INSPECTION`), and `imageUrl`.
4. **`bookings` & `payments`**:
   - Tracks `bookingCode` (e.g., `BK-8492`), `renterUserId`, `assetId`, `locationId`, `durationType`, `startTime`, `dueTime`, `rentalFee`, `securityDeposit`, `totalAmount`, `paymentReference`, `paymentStatus` (`PENDING` | `PAID` | `REFUNDED_DEPOSIT`), `bookingStatus` (`PENDING_PAYMENT` | `PAID_AWAITING_HANDOVER` | `ACTIVE_RENTED` | `RETURNED_COMPLETED` | `DISPUTED`), and `handoverOtp`.
5. **`handovers_and_returns` (with Ephemeral Collateral Lifecycle)**:
   - Tracks `bookingId`, `collateralType` (e.g., `"Hostel ID Card + Casio Watch"`), `collateralImageData` (base64/data URI stored on pickup and **set to `NULL` upon return**), `collateralPurged` (`boolean`), `collateralPurgedAt` (`timestamp`), `handoverConditionNotes`, `handoverConfirmedAt`, `returnConditionNotes`, `returnConfirmedAt`, `depositDeductionAmount`, and `depositRefundedAmount`.
6. **`urgent_requests`**:
   - Live student broadcasts when an item is urgently needed near a specific lab or exam hall, allowing attendants or nearby P2P students to fulfill the request immediately.

### Interactive Component & State Mapping

- **Institutional Onboarding & AI ID Scanner Modal**:
  - *Interactions*: Select university/institution, fill Reg Number, Faculty, Department, Level, upload/capture Student ID card (or load a sample student ID card for instant testing).
  - *State Mutation*: Calls `POST /api/student/verify-id`, invokes server-side `gemini-3.8-flash` structured JSON extraction to verify the ID details, updates PostgreSQL `users.verificationStatus = 'VERIFIED'`, and unlocks instant booking.
- **Directory Catalogue, Category Filter & Supply Mode Switcher**:
  - *Interactions*: Filter by `All`, `Lab Coats`, `Calculators`, `Laptops`; toggle between `All Supply`, `Managed Stock Points`, and `Student P2P Nearby`; search by building, course code, or spec (e.g., `Casio fx-991EX`, `Size L Lab Coat`).
  - *State Mutation*: Queries `GET /api/assets` with filter parameters and updates the live grid without layout shift.
- **Checkout & Server-Verified Payment Flow**:
  - *Interactions*: Select duration, review Rental Fee + Refundable Deposit, accept campus rental & collateral terms, complete payment via the interactive Paystack Checkout Simulator, and trigger server verification.
  - *State Mutation*: `POST /api/bookings` creates the atomic reservation; `POST /api/ bookings/:id/verify-payment` verifies the transaction server-side, marks the booking `PAID_AWAITING_HANDOVER`, and issues the 6-digit OTP + pickup location details.
- **Pickup Location & Collateral Proof Upload View**:
  - *Interactions*: View exact Stock Point room directions, upload/capture the **Collateral Proof Screenshot/Photo**, and execute the handover confirmation.
  - *State Mutation*: `POST /api/bookings/:id/collateral-handover` saves the collateral proof and transitions the rental to `ACTIVE_RENTED` with a live due-time countdown.
- **Return Inspection & Automatic Collateral Deletion**:
  - *Interactions*: Trigger return from the Active Rental card or the **Attendant Operations Console**, inspect item condition, and click **Complete Return & Delete Collateral Proof**.
  - *State Mutation*: `POST /api/bookings/:id/return` atomically sets `collateralImageData = null`, sets `collateralPurged = true`, records `collateralPurgedAt`, restores asset availability, and logs the deposit refund.
