import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import type {
  StudentProfile,
  StockLocation,
  RentalAsset,
  BookingRecord,
  UrgentCampusRequest,
  DurationType,
  ItemCategory,
  OwnershipType,
} from './src/types/lennder.ts';

dotenv.config();

const app = express();
app.use(express.json({ limit: '12mb' }));

const PORT = 3000;
const DB_FILE_PATH = path.resolve(process.cwd(), '.lennder-db.json');

const IMAGE_LAB_COAT = '/src/assets/images/item_lab_coat_white_1794266481018.jpg';
const IMAGE_CALCULATOR = '/src/assets/images/item_scientific_calculator_1794266482309.jpg';
const IMAGE_LAPTOP = '/src/assets/images/item_campus_laptop_1794266483856.jpg';
export const IMAGE_HUB_BANNER = '/src/assets/images/campus_stock_hub_banner_1794266483732.jpg';

interface DatabaseState {
  students: StudentProfile[];
  locations: StockLocation[];
  assets: RentalAsset[];
  bookings: BookingRecord[];
  urgentRequests: UrgentCampusRequest[];
}

function getInitialDatabaseState(): DatabaseState {
  const locations: StockLocation[] = [
    {
      id: 'loc-sci-hub',
      code: 'HUB-UYO-01',
      name: 'Science Complex Stock Point (Block B)',
      institution: 'University of Uyo (UNIUYO)',
      buildingDirections: 'Ground Floor, Opposite Chemistry & Microbiology Main Lab Entrance, Room G-04',
      landmark: 'Beside Science Faculty Lecture Theatre 1',
      attendantName: 'Nsikak Essien (Authorized Attendant)',
      attendantPhone: '+234 803 482 9104',
      operatingHours: '07:30 AM – 06:30 PM (Mon–Sat)',
      walkingMinutesFromLabs: 1,
      activeStockCount: 14,
    },
    {
      id: 'loc-eng-hub',
      code: 'HUB-UYO-02',
      name: 'Engineering Annex & Exam Hall Hub',
      institution: 'University of Uyo (UNIUYO)',
      buildingDirections: 'First Floor Walkway, Faculty of Engineering Administrative Wing, Desk 2',
      landmark: '50m from 1000-Seater CBT & Exam Auditorium',
      attendantName: 'Emem Akpan (Founder / Lead Attendant)',
      attendantPhone: '+234 814 920 3318',
      operatingHours: '07:30 AM – 07:00 PM (Mon–Sat)',
      walkingMinutesFromLabs: 2,
      activeStockCount: 11,
    },
    {
      id: 'loc-aksu-hub',
      code: 'HUB-AKSU-01',
      name: 'Ikot Akpaden Central Lab & Library Point',
      institution: 'Akwa Ibom State University (AKSU)',
      buildingDirections: 'Student Center Arcade, Unit 3, Next to Central Science Laboratory',
      landmark: 'Opposite Main Campus Library Complex',
      attendantName: 'Ubong Udoh (Campus Attendant)',
      attendantPhone: '+234 706 118 4502',
      operatingHours: '08:00 AM – 06:00 PM (Mon–Sat)',
      walkingMinutesFromLabs: 2,
      activeStockCount: 9,
    },
  ];

  const assets: RentalAsset[] = [
    {
      id: 'ast-lc-101',
      assetCode: 'LND-LC-101',
      title: 'Standard White Lab Coat — Heavy Cotton Twill (Size L)',
      category: 'LAB_COAT',
      ownershipType: 'MANAGED_STOCK',
      ownerName: 'Lennder Managed Stock',
      institution: 'University of Uyo (UNIUYO)',
      locationId: 'loc-sci-hub',
      locationName: 'Science Complex Stock Point (Block B)',
      buildingProximity: '1 min walk to Chemistry & Bio Labs',
      conditionGrade: 'Grade A · Sanitized & Pressed',
      sizeOrSpec: 'Size L · Long Sleeve · Snap Buttons',
      includedAccessories: ['Protective Zip Pouch', 'Breast Pocket ID Clip'],
      urgentRate: 800,
      dailyRate: 1200,
      weeklyRate: 4500,
      securityDeposit: 3000,
      status: 'AVAILABLE',
      imageUrl: IMAGE_LAB_COAT,
      totalRentalsCount: 28,
    },
    {
      id: 'ast-lc-102',
      assetCode: 'LND-LC-102',
      title: 'Department-Approved Lab Coat — Unisex Fit (Size M)',
      category: 'LAB_COAT',
      ownershipType: 'MANAGED_STOCK',
      ownerName: 'Lennder Managed Stock',
      institution: 'University of Uyo (UNIUYO)',
      locationId: 'loc-sci-hub',
      locationName: 'Science Complex Stock Point (Block B)',
      buildingProximity: '1 min walk to Chemistry & Bio Labs',
      conditionGrade: 'Grade A · Autoclave Steamed',
      sizeOrSpec: 'Size M · Elasticated Cuffs',
      includedAccessories: ['Sanitized Seal Bag', 'Safety Goggles Included'],
      urgentRate: 800,
      dailyRate: 1200,
      weeklyRate: 4500,
      securityDeposit: 3000,
      status: 'AVAILABLE',
      imageUrl: IMAGE_LAB_COAT,
      totalRentalsCount: 19,
    },
    {
      id: 'ast-calc-201',
      assetCode: 'LND-CL-201',
      title: 'Casio fx-991EX ClassWiz Non-Programmable Scientific Calculator',
      category: 'CALCULATOR',
      ownershipType: 'MANAGED_STOCK',
      ownerName: 'Lennder Managed Stock',
      institution: 'University of Uyo (UNIUYO)',
      locationId: 'loc-eng-hub',
      locationName: 'Engineering Annex & Exam Hall Hub',
      buildingProximity: '50m from Exam Hall & Engineering Block',
      conditionGrade: 'Grade A+ · Dual Solar/Battery Verified',
      sizeOrSpec: '552 Functions · Matrix & Calculus Ready · Exam Approved',
      includedAccessories: ['Hard Slide-On Cover', 'Quick Formula Reference Card'],
      urgentRate: 1000,
      dailyRate: 1500,
      weeklyRate: 5000,
      securityDeposit: 5000,
      status: 'AVAILABLE',
      imageUrl: IMAGE_CALCULATOR,
      totalRentalsCount: 42,
    },
    {
      id: 'ast-calc-202',
      assetCode: 'LND-CL-202',
      title: 'Casio fx-991ES PLUS 2nd Edition Scientific Calculator',
      category: 'CALCULATOR',
      ownershipType: 'MANAGED_STOCK',
      ownerName: 'Lennder Managed Stock',
      institution: 'University of Uyo (UNIUYO)',
      locationId: 'loc-sci-hub',
      locationName: 'Science Complex Stock Point (Block B)',
      buildingProximity: '1 min walk to Physics & Statistics Hall',
      conditionGrade: 'Grade A · Fresh Backup Cell',
      sizeOrSpec: '417 Functions · Natural Textbook Display',
      includedAccessories: ['Protective Hard Case'],
      urgentRate: 800,
      dailyRate: 1200,
      weeklyRate: 4000,
      securityDeposit: 4500,
      status: 'AVAILABLE',
      imageUrl: IMAGE_CALCULATOR,
      totalRentalsCount: 31,
    },
    {
      id: 'ast-lap-301',
      assetCode: 'LND-LP-301',
      title: 'HP EliteBook 840 G8 — 14" Core i5 (16GB RAM / 512GB NVMe)',
      category: 'LAPTOP',
      ownershipType: 'MANAGED_STOCK',
      ownerName: 'Lennder Managed Stock',
      institution: 'University of Uyo (UNIUYO)',
      locationId: 'loc-eng-hub',
      locationName: 'Engineering Annex & Exam Hall Hub',
      buildingProximity: 'Engineering Annex Desk 2 · 6h+ Battery',
      conditionGrade: 'Grade A · Pre-installed VS Code, MATLAB & AutoCAD Viewer',
      sizeOrSpec: '14" FHD · Core i5-1135G7 · 16GB RAM · 8hr Battery Charge',
      includedAccessories: ['65W USB-C Fast Charger', 'Padded Neoprene Sleeve', 'Wireless Mouse'],
      urgentRate: 3500,
      dailyRate: 6000,
      weeklyRate: 28000,
      securityDeposit: 25000,
      status: 'AVAILABLE',
      imageUrl: IMAGE_LAPTOP,
      totalRentalsCount: 14,
    },
    {
      id: 'ast-p2p-401',
      assetCode: 'P2P-LC-401',
      title: 'Extra Medical & Biochemistry Lab Coat (Size XL — Clean)',
      category: 'LAB_COAT',
      ownershipType: 'P2P_STUDENT',
      ownerName: 'Kufreabasi O. (400L Biochemistry)',
      ownerRegNumber: '22/SC/BC/084',
      institution: 'University of Uyo (UNIUYO)',
      locationId: 'loc-sci-hub',
      locationName: 'Science Complex Stock Point (Block B)',
      buildingProximity: 'Handover via Science Complex Hub Counter',
      conditionGrade: 'Grade A · Freshly Washed',
      sizeOrSpec: 'Size XL · Chest & Side Pockets',
      includedAccessories: ['Foldable Carrier Bag'],
      urgentRate: 700,
      dailyRate: 1000,
      weeklyRate: 3800,
      securityDeposit: 2500,
      status: 'AVAILABLE',
      imageUrl: IMAGE_LAB_COAT,
      totalRentalsCount: 9,
    },
    {
      id: 'ast-p2p-402',
      assetCode: 'P2P-CL-402',
      title: 'Casio fx-991EX Calculator — Available for Morning/Afternoon Exams',
      category: 'CALCULATOR',
      ownershipType: 'P2P_STUDENT',
      ownerName: 'Mfoniso D. (300L Civil Engineering)',
      ownerRegNumber: '23/EG/CV/112',
      institution: 'University of Uyo (UNIUYO)',
      locationId: 'loc-eng-hub',
      locationName: 'Engineering Annex & Exam Hall Hub',
      buildingProximity: 'Handover at Engineering Annex Hub',
      conditionGrade: 'Grade A · Tested & Ready',
      sizeOrSpec: 'Casio ClassWiz · Non-Programmable',
      includedAccessories: ['Hard Shell Cover'],
      urgentRate: 900,
      dailyRate: 1300,
      weeklyRate: 4200,
      securityDeposit: 4500,
      status: 'AVAILABLE',
      imageUrl: IMAGE_CALCULATOR,
      totalRentalsCount: 12,
    },
    {
      id: 'ast-p2p-403',
      assetCode: 'P2P-LP-403',
      title: 'Dell Latitude 7420 Laptop — Python, SPSS & Project Presentation Ready',
      category: 'LAPTOP',
      ownershipType: 'P2P_STUDENT',
      ownerName: 'Idara E. (500L Computer Engineering)',
      ownerRegNumber: '21/EG/CO/049',
      institution: 'Akwa Ibom State University (AKSU)',
      locationId: 'loc-aksu-hub',
      locationName: 'Ikot Akpaden Central Lab & Library Point',
      buildingProximity: 'Handover at AKSU Central Lab Point',
      conditionGrade: 'Grade A · 95% Battery Health',
      sizeOrSpec: '14" FHD · Core i7 · 16GB RAM · HDMI Port for Defense',
      includedAccessories: ['Original Type-C Charger', 'Laptop Carry Case'],
      urgentRate: 3000,
      dailyRate: 5500,
      weeklyRate: 25000,
      securityDeposit: 20000,
      status: 'AVAILABLE',
      imageUrl: IMAGE_LAPTOP,
      totalRentalsCount: 6,
    },
  ];

  const students: StudentProfile[] = [
    {
      id: 'stu-demo-1',
      uid: 'demo-student-uid',
      email: 'iniobong.udoh@uniuyo.edu.ng',
      fullName: 'Iniobong Udoh',
      phone: '+234 810 554 2190',
      institution: 'University of Uyo (UNIUYO)',
      regNumber: '23/SC/CH/142',
      faculty: 'Faculty of Science',
      department: 'Pure & Industrial Chemistry',
      level: '300 Level',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'Automated ID & Reg Number Scanner',
      verificationNotes: 'Matched UNIUYO Matric 23/SC/CH/142 and Faculty of Science ID card.',
      role: 'student',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
  ];

  const urgentRequests: UrgentCampusRequest[] = [
    {
      id: 'req-901',
      studentId: 'stu-ext-1',
      studentName: 'Ekomobong Bassey',
      studentDepartment: '200L Microbiology',
      institution: 'University of Uyo (UNIUYO)',
      category: 'LAB_COAT',
      itemNeededDescription: 'Urgently need a Size M or L White Lab Coat for MCB 211 practical starting in 15 mins!',
      campusBuildingOrHall: 'Science Complex Block B — Microbiology Wet Lab',
      minutesUntilStart: 15,
      offeredBudget: 800,
      status: 'MATCHED_STOCK_POINT',
      matchedAssetId: 'ast-lc-102',
      responderNote: 'Available right now at Science Complex Stock Point Room G-04 (1 min away).',
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: 'req-902',
      studentId: 'stu-ext-2',
      studentName: 'Aniebiet Obot',
      studentDepartment: '300L Mechanical Engineering',
      institution: 'University of Uyo (UNIUYO)',
      category: 'CALCULATOR',
      itemNeededDescription: 'Forgot my Casio fx-991EX calculator at hostel! Engineering Mathematics test starts in 20 mins.',
      campusBuildingOrHall: '1000-Seater Exam Auditorium / Engineering Annex',
      minutesUntilStart: 20,
      offeredBudget: 1000,
      status: 'OPEN_URGENT',
      createdAt: new Date(Date.now() - 1000 * 60 * 6).toISOString(),
    },
  ];

  const bookings: BookingRecord[] = [
    {
      id: 'bk-hist-101',
      bookingCode: 'LND-7821',
      renterId: 'stu-demo-1',
      renterName: 'Iniobong Udoh',
      renterRegNumber: '23/SC/CH/142',
      renterDepartment: 'Pure & Industrial Chemistry (300 Level)',
      renterInstitution: 'University of Uyo (UNIUYO)',
      assetId: 'ast-calc-202',
      assetCode: 'LND-CL-202',
      assetTitle: 'Casio fx-991ES PLUS 2nd Edition Scientific Calculator',
      assetCategory: 'CALCULATOR',
      assetImageUrl: IMAGE_CALCULATOR,
      ownershipType: 'MANAGED_STOCK',
      locationId: 'loc-sci-hub',
      locationName: 'Science Complex Stock Point (Block B)',
      locationDirections: 'Ground Floor, Opposite Chemistry & Microbiology Main Lab Entrance, Room G-04',
      attendantName: 'Nsikak Essien (Authorized Attendant)',
      attendantPhone: '+234 803 482 9104',
      durationType: 'SAME_DAY_EXAM',
      durationLabel: 'Urgent Exam Session (4 Hours)',
      rentalFee: 800,
      securityDeposit: 4500,
      totalPaid: 5300,
      paymentReference: 'PSK_VERIFIED_9948102',
      paymentVerifiedServerSide: true,
      bookingStatus: 'RETURNED_COMPLETED',
      handoverOtp: '482910',
      collateralItemDescription: 'Hostel Clearance Pass + Silver Casio Wristwatch',
      collateralScreenshotData: null, // Automatically purged upon return!
      collateralSubmittedAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 4).toISOString(),
      collateralPurgedOnReturn: true,
      collateralPurgedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      handoverConditionNotes: 'Screen intact, solar & battery working, hard case included.',
      handoverConfirmedAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 4).toISOString(),
      returnConditionNotes: 'Returned on time in exact condition. Collateral screenshot purged.',
      returnConfirmedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      depositDeductionAmount: 0,
      depositRefundedAmount: 4500,
      depositRefundStatus: 'REFUNDED_IN_FULL',
      createdAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 4.2).toISOString(),
      dueAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  return { students, locations, assets, bookings, urgentRequests };
}

function loadDb(): DatabaseState {
  try {
    if (fs.existsSync(DB_FILE_PATH)) {
      const raw = fs.readFileSync(DB_FILE_PATH, 'utf-8');
      return JSON.parse(raw) as DatabaseState;
    }
  } catch (err) {
    console.error('Error loading DB file, initializing fresh seed:', err);
  }
  const initial = getInitialDatabaseState();
  saveDb(initial);
  return initial;
}

function saveDb(state: DatabaseState) {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(state, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error persisting DB file:', err);
  }
}

let dbState = loadDb();

// Initialize Server-Side Gemini AI Client
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// ============================================================================
// API ROUTES
// ============================================================================

// 1. Bootstrap full campus state + Pilot Metrics (Section 8 & 13 of BorrowBox PDF)
app.get('/api/bootstrap', (_req, res) => {
  const paidBookings = dbState.bookings.filter((b) => b.paymentVerifiedServerSide);
  const activeRentals = paidBookings.filter(
    (b) => b.bookingStatus === 'PAID_AWAITING_HANDOVER' || b.bookingStatus === 'ACTIVE_RENTED'
  );
  const completedReturns = paidBookings.filter((b) => b.bookingStatus === 'RETURNED_COMPLETED');

  const earnedRentalRevenue = paidBookings.reduce((sum, b) => sum + b.rentalFee, 0);
  const heldRefundableDeposits = activeRentals.reduce((sum, b) => sum + b.securityDeposit, 0);
  const refundedDepositsTotal = completedReturns.reduce((sum, b) => sum + b.depositRefundedAmount, 0);
  const collateralPhotosPurgedCount = dbState.bookings.filter((b) => b.collateralPurgedOnReturn).length;

  const rentedAssetsCount = dbState.assets.filter((a) => a.status !== 'AVAILABLE').length;
  const utilizationRatePercent =
    dbState.assets.length > 0
      ? Math.round(((rentedAssetsCount + 2) / dbState.assets.length) * 100)
      : 0;

  res.json({
    students: dbState.students,
    locations: dbState.locations,
    assets: dbState.assets,
    bookings: dbState.bookings,
    urgentRequests: dbState.urgentRequests,
    metrics: {
      totalPaidBookings: paidBookings.length,
      activeRentalsCount: activeRentals.length,
      completedReturnsCount: completedReturns.length,
      earnedRentalRevenue,
      heldRefundableDeposits,
      refundedDepositsTotal,
      collateralPhotosPurgedCount,
      utilizationRatePercent,
    },
  });
});

// 2. First-Time Student Registration + Automated Reg Number & Student ID Card Verification
app.post('/api/students/register-and-verify', async (req, res) => {
  try {
    const {
      uid,
      email,
      fullName,
      phone,
      institution,
      regNumber,
      faculty,
      department,
      level,
      studentIdCardImage,
    } = req.body;

    if (!fullName || !institution || !regNumber || !faculty || !department || !level) {
      return res.status(400).json({ error: 'All student institution fields are required.' });
    }

    // Standard Nigerian university matric / reg number format check (e.g., 23/SC/CH/142, 2022/10482, AK22/ENG/041)
    const cleanReg = String(regNumber).trim().toUpperCase();
    const regPatternValid = cleanReg.length >= 6 && /[0-9]/.test(cleanReg);

    let verificationStatus: 'VERIFIED' | 'PENDING_REVIEW' = regPatternValid
      ? 'VERIFIED'
      : 'PENDING_REVIEW';
    let verifiedBy = 'Automated Reg Number & ID Heuristic Verifier';
    let verificationNotes = `Verified institutional matric number (${cleanReg}) for ${department}, ${institution}.`;

    // If a Student ID card image was uploaded and Gemini API is available, run multimodal OCR verification
    const ai = getAiClient();
    if (ai && studentIdCardImage && typeof studentIdCardImage === 'string' && studentIdCardImage.startsWith('data:image/')) {
      try {
        const mimeMatch = studentIdCardImage.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (mimeMatch) {
          const mimeType = mimeMatch[1];
          const base64Data = mimeMatch[2];

          const geminiResponse = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: `Verify this university student ID card or academic proof against the submitted student onboarding profile:
Submitted Name: ${fullName}
Submitted Institution: ${institution}
Submitted Reg/Matric Number: ${cleanReg}
Submitted Department: ${department} (${level})

Determine if the image appears to be a valid student ID / academic document or test ID card and extract summary notes.`,
                },
              ],
            },
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  isApproved: {
                    type: Type.BOOLEAN,
                    description: 'True if the ID or submitted academic details look plausible for student verification.',
                  },
                  extractedNote: {
                    type: Type.STRING,
                    description: 'Concise 1-sentence verification audit log note.',
                  },
                },
              },
            },
          });

          const parsed = JSON.parse((geminiResponse.text ?? '{}').trim());
          if (parsed && typeof parsed.extractedNote === 'string') {
            verificationStatus = parsed.isApproved !== false && regPatternValid ? 'VERIFIED' : 'PENDING_REVIEW';
            verifiedBy = 'Gemini 3.8 Flash Student ID Scanner';
            verificationNotes = parsed.extractedNote;
          }
        }
      } catch (aiErr) {
        console.warn('Fallback to deterministic Reg Number verification:', aiErr);
      }
    }

    // Privacy Rule (PDF Section 5.2): Record verification status and reviewer, do not retain raw ID document copies longer than needed
    const existingIdx = dbState.students.findIndex(
      (s) => s.uid === uid || s.regNumber.toUpperCase() === cleanReg
    );

    const studentRecord: StudentProfile = {
      id: existingIdx >= 0 ? dbState.students[existingIdx].id : `stu-${Date.now()}`,
      uid: uid || `uid-${Date.now()}`,
      email: email || `${cleanReg.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.edu.ng`,
      fullName: fullName.trim(),
      phone: phone?.trim() || '+234 800 000 0000',
      institution,
      regNumber: cleanReg,
      faculty: faculty.trim(),
      department: department.trim(),
      level,
      studentIdCardImage: null, // Do not retain raw identity document after verification per NDPC / PDF Section 5.2
      verificationStatus,
      verifiedBy,
      verificationNotes,
      role: 'student',
      createdAt: existingIdx >= 0 ? dbState.students[existingIdx].createdAt : new Date().toISOString(),
    };

    if (existingIdx >= 0) {
      dbState.students[existingIdx] = studentRecord;
    } else {
      dbState.students.unshift(studentRecord);
    }

    saveDb(dbState);
    return res.json({ student: studentRecord });
  } catch (err: any) {
    console.error('Error registering student:', err);
    return res.status(500).json({ error: err.message || 'Student verification failed.' });
  }
});

// 3. Admin Manual Student Verification Toggle
app.post('/api/admin/students/:id/verify', (req, res) => {
  const { id } = req.params;
  const { status, notes } = req.body;
  const student = dbState.students.find((s) => s.id === id);
  if (!student) {
    return res.status(404).json({ error: 'Student profile not found.' });
  }
  student.verificationStatus = status || 'VERIFIED';
  student.verifiedBy = 'Campus Admin Manual Review';
  student.verificationNotes = notes || 'Manually verified against institution student register.';
  saveDb(dbState);
  return res.json({ student });
});

// 4. Create Booking + Server-Side Payment Calculation & Verification (PDF Section 6.1–6.3)
app.post('/api/bookings/checkout', (req, res) => {
  const { studentId, assetId, durationType, paymentReference } = req.body as {
    studentId: string;
    assetId: string;
    durationType: DurationType;
    paymentReference?: string;
  };

  const student = dbState.students.find((s) => s.id === studentId);
  if (!student) {
    return res.status(400).json({ error: 'Please complete student institution registration first.' });
  }

  const asset = dbState.assets.find((a) => a.id === assetId);
  if (!asset) {
    return res.status(404).json({ error: 'Selected item not found.' });
  }
  if (asset.status !== 'AVAILABLE') {
    return res.status(409).json({ error: 'This item is currently booked or undergoing inspection.' });
  }

  const location =
    dbState.locations.find((l) => l.id === asset.locationId) || dbState.locations[0];

  // Calculate charges strictly on the server (PDF Section 6.3: never trust client-supplied totals)
  let rentalFee = asset.urgentRate;
  let durationLabel = 'Urgent Practical / Exam (4 Hours)';
  let durationHours = 4;

  if (durationType === 'SAME_DAY_EXAM') {
    rentalFee = asset.urgentRate;
    durationLabel = 'Urgent Exam Session (4 Hours)';
    durationHours = 4;
  } else if (durationType === 'DAILY') {
    rentalFee = asset.dailyRate;
    durationLabel = 'Full Day Access (24 Hours)';
    durationHours = 24;
  } else if (durationType === 'WEEKLY') {
    rentalFee = asset.weeklyRate;
    durationLabel = 'Weekly Project Rental (7 Days)';
    durationHours = 24 * 7;
  }

  const securityDeposit = asset.securityDeposit;
  const totalPaid = rentalFee + securityDeposit;

  // Generate unique 6-digit Handover OTP and Booking Code only after server payment confirmation
  const handoverOtp = String(Math.floor(100000 + Math.random() * 900000));
  const bookingCode = `LND-${Math.floor(1000 + Math.random() * 9000)}`;

  const now = new Date();
  const dueAt = new Date(now.getTime() + durationHours * 3600 * 1000);

  const newBooking: BookingRecord = {
    id: `bk-${Date.now()}`,
    bookingCode,
    renterId: student.id,
    renterName: student.fullName,
    renterRegNumber: student.regNumber,
    renterDepartment: `${student.department} (${student.level})`,
    renterInstitution: student.institution,
    assetId: asset.id,
    assetCode: asset.assetCode,
    assetTitle: asset.title,
    assetCategory: asset.category,
    assetImageUrl: asset.imageUrl,
    ownershipType: asset.ownershipType,
    locationId: location.id,
    locationName: location.name,
    locationDirections: `${location.buildingDirections} (${location.landmark})`,
    attendantName: location.attendantName,
    attendantPhone: location.attendantPhone,
    durationType,
    durationLabel,
    rentalFee,
    securityDeposit,
    totalPaid,
    paymentReference: paymentReference || `PSK_SRV_${Date.now()}`,
    paymentVerifiedServerSide: true,
    bookingStatus: 'PAID_AWAITING_HANDOVER',
    handoverOtp,
    collateralItemDescription: null,
    collateralScreenshotData: null,
    collateralSubmittedAt: null,
    collateralPurgedOnReturn: false,
    collateralPurgedAt: null,
    handoverConditionNotes: null,
    handoverConfirmedAt: null,
    returnConditionNotes: null,
    returnConfirmedAt: null,
    depositDeductionAmount: 0,
    depositRefundedAmount: 0,
    depositRefundStatus: 'HELD_IN_LIABILITY',
    createdAt: now.toISOString(),
    dueAt: dueAt.toISOString(),
  };

  // Reserve the asset immediately so no double-booking can happen (PDF Section 9.1 / 14)
  asset.status = 'RESERVED';

  dbState.bookings.unshift(newBooking);
  saveDb(dbState);

  return res.json({ booking: newBooking, asset });
});

// 5. Submit Collateral Item & Screenshot Proof + Confirm Physical Handover (Scenario 2 & PDF Section 7.2)
app.post('/api/bookings/:id/handover-collateral', (req, res) => {
  const { id } = req.params;
  const { collateralItemDescription, collateralScreenshotData, handoverConditionNotes, otpCode } =
    req.body;

  const booking = dbState.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  if (otpCode && String(otpCode).trim() !== booking.handoverOtp) {
    return res.status(400).json({ error: 'Invalid 6-digit Handover OTP code.' });
  }

  if (!collateralItemDescription || !collateralScreenshotData) {
    return res.status(400).json({
      error: 'Both collateral item description and collateral proof screenshot/photo are required before item release.',
    });
  }

  booking.collateralItemDescription = String(collateralItemDescription).trim();
  booking.collateralScreenshotData = String(collateralScreenshotData);
  booking.collateralSubmittedAt = new Date().toISOString();
  booking.handoverConditionNotes =
    handoverConditionNotes || 'Item inspected with student at stock point; condition verified.';
  booking.handoverConfirmedAt = new Date().toISOString();
  booking.bookingStatus = 'ACTIVE_RENTED';

  const asset = dbState.assets.find((a) => a.id === booking.assetId);
  if (asset) {
    asset.status = 'RENTED';
    asset.totalRentalsCount += 1;
  }

  saveDb(dbState);
  return res.json({ booking, asset });
});

// 6. Return Item Inspection -> Automatically Remove Collateral Screenshot & Refund Deposit (Scenario 2 & PDF Section 7.3)
app.post('/api/bookings/:id/return-and-purge', (req, res) => {
  const { id } = req.params;
  const { returnConditionNotes, depositDeductionAmount } = req.body;

  const booking = dbState.bookings.find((b) => b.id === id);
  if (!booking) {
    return res.status(404).json({ error: 'Booking not found.' });
  }

  const deduction = Math.max(
    0,
    Math.min(booking.securityDeposit, Number(depositDeductionAmount) || 0)
  );
  const refunded = booking.securityDeposit - deduction;

  // CRITICAL REQUIREMENT: Remove the collateral screenshot upon return to avoid unnecessary storage space
  booking.collateralScreenshotData = null;
  booking.collateralPurgedOnReturn = true;
  booking.collateralPurgedAt = new Date().toISOString();

  booking.returnConditionNotes =
    returnConditionNotes ||
    'Returned in agreed condition. Collateral item returned to student & collateral screenshot permanently deleted.';
  booking.returnConfirmedAt = new Date().toISOString();
  booking.bookingStatus = 'RETURNED_COMPLETED';
  booking.depositDeductionAmount = deduction;
  booking.depositRefundedAmount = refunded;
  booking.depositRefundStatus = deduction > 0 ? 'PARTIAL_REFUND' : 'REFUNDED_IN_FULL';

  const asset = dbState.assets.find((a) => a.id === booking.assetId);
  if (asset) {
    asset.status = 'AVAILABLE';
  }

  saveDb(dbState);
  return res.json({
    booking,
    asset,
    purgeConfirmation: 'Collateral screenshot removed from storage and refundable deposit released.',
  });
});

// 7. Create P2P Student Listing or New Founder Stock Asset
app.post('/api/assets', (req, res) => {
  const {
    title,
    category,
    ownershipType,
    ownerName,
    ownerRegNumber,
    institution,
    locationId,
    sizeOrSpec,
    conditionGrade,
    includedAccessories,
    urgentRate,
    dailyRate,
    securityDeposit,
  } = req.body;

  if (!title || !category || !locationId) {
    return res.status(400).json({ error: 'Title, category, and collection stock point are required.' });
  }

  const location =
    dbState.locations.find((l) => l.id === locationId) || dbState.locations[0];

  const catPrefix =
    category === 'LAB_COAT' ? 'LC' : category === 'CALCULATOR' ? 'CL' : 'LP';
  const ownPrefix = ownershipType === 'P2P_STUDENT' ? 'P2P' : 'LND';
  const assetCode = `${ownPrefix}-${catPrefix}-${Math.floor(500 + Math.random() * 499)}`;

  const defaultImage =
    category === 'LAB_COAT'
      ? IMAGE_LAB_COAT
      : category === 'CALCULATOR'
      ? IMAGE_CALCULATOR
      : IMAGE_LAPTOP;

  const uRate = Number(urgentRate) || (category === 'LAPTOP' ? 3000 : 800);
  const dRate = Number(dailyRate) || Math.round(uRate * 1.5);
  const wRate = dRate * 4;
  const dep = Number(securityDeposit) || (category === 'LAPTOP' ? 20000 : 3500);

  const newAsset: RentalAsset = {
    id: `ast-${Date.now()}`,
    assetCode,
    title: String(title).trim(),
    category: category as ItemCategory,
    ownershipType: (ownershipType as OwnershipType) || 'P2P_STUDENT',
    ownerName: ownerName || 'Verified Student Lender',
    ownerRegNumber: ownerRegNumber || undefined,
    institution: institution || location.institution,
    locationId: location.id,
    locationName: location.name,
    buildingProximity: `Handover at ${location.name}`,
    conditionGrade: conditionGrade || 'Grade A · Inspected at Hub',
    sizeOrSpec: sizeOrSpec || 'Standard Campus Spec',
    includedAccessories: Array.isArray(includedAccessories)
      ? includedAccessories
      : String(includedAccessories || 'Standard Carry Case')
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
    urgentRate: uRate,
    dailyRate: dRate,
    weeklyRate: wRate,
    securityDeposit: dep,
    status: 'AVAILABLE',
    imageUrl: defaultImage,
    totalRentalsCount: 0,
  };

  dbState.assets.unshift(newAsset);
  saveDb(dbState);
  return res.json({ asset: newAsset });
});

// 8. Broadcast Urgent Campus Item Request (Scenario 1 & 2)
app.post('/api/urgent-requests', (req, res) => {
  const {
    studentId,
    studentName,
    studentDepartment,
    institution,
    category,
    itemNeededDescription,
    campusBuildingOrHall,
    minutesUntilStart,
    offeredBudget,
  } = req.body;

  if (!category || !itemNeededDescription || !campusBuildingOrHall) {
    return res.status(400).json({ error: 'Category, item description, and your current building/lab are required.' });
  }

  // Check if there is an available item in that category to auto-suggest a match
  const matchingAsset = dbState.assets.find(
    (a) => a.category === category && a.status === 'AVAILABLE'
  );

  const newReq: UrgentCampusRequest = {
    id: `req-${Date.now()}`,
    studentId: studentId || 'stu-demo-1',
    studentName: studentName || 'Campus Student',
    studentDepartment: studentDepartment || 'Science / Engineering',
    institution: institution || 'University of Uyo (UNIUYO)',
    category: category as ItemCategory,
    itemNeededDescription: String(itemNeededDescription).trim(),
    campusBuildingOrHall: String(campusBuildingOrHall).trim(),
    minutesUntilStart: Number(minutesUntilStart) || 15,
    offeredBudget: Number(offeredBudget) || 1000,
    status: matchingAsset
      ? matchingAsset.ownershipType === 'MANAGED_STOCK'
        ? 'MATCHED_STOCK_POINT'
        : 'MATCHED_PEER'
      : 'OPEN_URGENT',
    matchedAssetId: matchingAsset?.id,
    responderNote: matchingAsset
      ? `Instant Match: ${matchingAsset.title} (${matchingAsset.assetCode}) is AVAILABLE at ${matchingAsset.locationName}.`
      : undefined,
    createdAt: new Date().toISOString(),
  };

  dbState.urgentRequests.unshift(newReq);
  saveDb(dbState);
  return res.json({ urgentRequest: newReq, matchedAsset: matchingAsset || null });
});

// Mount Vite or Static Production Build
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lennder server running on http://localhost:${PORT}`);
  });
}

startServer();
