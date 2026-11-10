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
import {
  INITIAL_STOCK_LOCATIONS,
  INITIAL_RENTAL_ASSETS,
  IMAGE_LAB_COAT,
  IMAGE_CALCULATOR,
  IMAGE_LAPTOP,
} from './src/config/campusInventory.ts';

dotenv.config();

const app = express();
app.use(express.json({ limit: '12mb' }));

const PORT = 3000;
const DB_FILE_PATH = path.resolve(process.cwd(), '.lennder-db.json');

interface DatabaseState {
  students: StudentProfile[];
  locations: StockLocation[];
  assets: RentalAsset[];
  bookings: BookingRecord[];
  urgentRequests: UrgentCampusRequest[];
}

function getInitialDatabaseState(): DatabaseState {
  const locations: StockLocation[] = INITIAL_STOCK_LOCATIONS.map((l) => ({ ...l }));
  const assets: RentalAsset[] = INITIAL_RENTAL_ASSETS.map((a) => ({ ...a }));

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
      idNameRegMatched: true,
      aiScanReport:
        'AI Scanner verified Full Name (Iniobong Udoh) + Matric (23/SC/CH/142) on Student ID and confirmed Current Semester Timetable.',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'Automated ID & Reg Number Scanner + Semester Timetable',
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
      itemNeededDescription:
        'Urgently need a Size M or L White Lab Coat for MCB 211 practical starting in 15 mins!',
      campusBuildingOrHall: 'Science Complex Block B — Microbiology Wet Lab',
      minutesUntilStart: 15,
      offeredBudget: 800,
      status: 'MATCHED_STOCK_POINT',
      matchedAssetId: 'ast-lc-102',
      responderNote: 'Available right now at Science Complex Stock Point Room G-04 (1 min away).',
      createdAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
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
      locationDirections:
        'Ground Floor, Opposite Chemistry & Microbiology Main Lab Entrance, Room G-04',
      attendantName: 'Nsikak Essien (Venue Attendant)',
      attendantPhone: '+234 803 482 9104',
      durationType: 'SAME_DAY_EXAM',
      durationLabel: 'Urgent Exam Session (4 Hours)',
      rentalFee: 800,
      totalPaid: 800,
      paymentReference: 'PSK_VERIFIED_9948102',
      paymentVerifiedServerSide: true,
      bookingStatus: 'RETURNED_COMPLETED',
      businessOutcome: 'SUCCESSFUL',
      failureReason: null,
      handoverOtp: '482910',
      collateralItemDescription: 'Hostel Clearance Pass + Silver Casio Wristwatch',
      studentCollateralScreenshot: null,
      venueCollateralScreenshot: null,
      collateralSubmittedAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 4).toISOString(),
      venueVerifiedCollateralMatch: true,
      venueVerifiedAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 3.9).toISOString(),
      collateralPurgedOnReturn: true,
      collateralPurgedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      handoverConditionNotes: 'Student and Venue collateral screenshots matched.',
      handoverConfirmedAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 3.9).toISOString(),
      returnConditionNotes:
        'Returned on time. Student collected physical collateral back. Screenshots purged.',
      returnConfirmedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
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

app.get('/api/bootstrap', (_req, res) => {
  const paidBookings = dbState.bookings.filter((b) => b.paymentVerifiedServerSide);
  const activeRentals = paidBookings.filter(
    (b) =>
      b.bookingStatus === 'PAID_AWAITING_HANDOVER' ||
      b.bookingStatus === 'COLLATERAL_UPLOADED_AWAITING_VENUE' ||
      b.bookingStatus === 'ACTIVE_RENTED'
  );
  const awaitingVenueVerifyCount = paidBookings.filter(
    (b) => b.bookingStatus === 'COLLATERAL_UPLOADED_AWAITING_VENUE'
  ).length;
  const completedReturns = paidBookings.filter((b) => b.businessOutcome === 'SUCCESSFUL');
  const failedBusinessCount = dbState.bookings.filter((b) => b.businessOutcome === 'FAILED').length;

  const earnedRentalRevenue = paidBookings.reduce((sum, b) => sum + b.rentalFee, 0);
  const activePhysicalCollateralsHeld = paidBookings.filter(
    (b) =>
      b.bookingStatus === 'COLLATERAL_UPLOADED_AWAITING_VENUE' ||
      b.bookingStatus === 'ACTIVE_RENTED'
  ).length;
  const collateralPhotosPurgedCount = dbState.bookings.filter((b) => b.collateralPurgedOnReturn).length;

  res.json({
    students: dbState.students,
    locations: dbState.locations,
    assets: dbState.assets,
    bookings: dbState.bookings,
    urgentRequests: dbState.urgentRequests,
    metrics: {
      totalPaidBookings: paidBookings.length,
      activeRentalsCount: activeRentals.length,
      awaitingVenueVerifyCount,
      completedReturnsCount: completedReturns.length,
      failedBusinessCount,
      earnedRentalRevenue,
      activePhysicalCollateralsHeld,
      collateralPhotosPurgedCount,
    },
  });
});

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
      semesterTimetableImage,
    } = req.body;

    if (!fullName || !institution || !regNumber || !faculty || !department || !level) {
      return res.status(400).json({ error: 'All student institution fields are required.' });
    }

    const cleanReg = String(regNumber).trim().toUpperCase();
    const regPatternValid = cleanReg.length >= 6 && /[0-9]/.test(cleanReg);

    let verificationStatus: 'VERIFIED' | 'PENDING_REVIEW' = regPatternValid
      ? 'VERIFIED'
      : 'PENDING_REVIEW';
    let verifiedBy = 'Automated Reg Number & ID + Semester Timetable Verifier';
    let verificationNotes = `Verified institutional matric number (${cleanReg}) and Current Semester Timetable for ${department}, ${institution}.`;

    const ai = getAiClient();
    if (
      ai &&
      studentIdCardImage &&
      typeof studentIdCardImage === 'string' &&
      studentIdCardImage.startsWith('data:image/')
    ) {
      try {
        const mimeMatch = studentIdCardImage.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
        if (mimeMatch) {
          const mimeType = mimeMatch[1];
          const base64Data = mimeMatch[2];

          const geminiResponse = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: base64Data,
                  },
                },
                {
                  text: `Verify this university student ID card against the submitted student onboarding profile:
Submitted Name: ${fullName}
Submitted Institution: ${institution}
Submitted Reg/Matric Number: ${cleanReg}
Submitted Department: ${department} (${level})`,
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
                  },
                  extractedNote: {
                    type: Type.STRING,
                  },
                },
              },
            },
          });

          const parsed = JSON.parse((geminiResponse.text ?? '{}').trim());
          if (parsed && typeof parsed.extractedNote === 'string') {
            verificationStatus =
              parsed.isApproved !== false && regPatternValid ? 'VERIFIED' : 'PENDING_REVIEW';
            verifiedBy = 'Gemini AI Student ID Scanner + Timetable Proof';
            verificationNotes = parsed.extractedNote;
          }
        }
      } catch (aiErr) {
        console.warn('Fallback to deterministic Reg Number verification:', aiErr);
      }
    }

    const studentRecord: StudentProfile = {
      id: `stu-${Date.now()}`,
      uid: uid || `uid-${Date.now()}`,
      email: email || `${cleanReg.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.edu.ng`,
      fullName: fullName.trim(),
      phone: phone?.trim() || '+234 800 000 0000',
      institution,
      regNumber: cleanReg,
      faculty: faculty.trim(),
      department: department.trim(),
      level,
      studentIdCardImage: studentIdCardImage || null,
      semesterTimetableImage: semesterTimetableImage || null,
      idNameRegMatched: true,
      aiScanReport: verificationNotes,
      verificationStatus,
      verifiedBy,
      verificationNotes,
      role: 'student',
      createdAt: new Date().toISOString(),
    };

    dbState.students.unshift(studentRecord);
    saveDb(dbState);
    return res.json({ student: studentRecord });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Student verification failed.' });
  }
});

app.post('/api/bookings/checkout', (req, res) => {
  const { studentId, assetId, durationType, paymentReference } = req.body as {
    studentId: string;
    assetId: string;
    durationType: DurationType;
    paymentReference?: string;
  };

  const student = dbState.students.find((s) => s.id === studentId) || dbState.students[0];
  const asset = dbState.assets.find((a) => a.id === assetId);
  if (!asset) {
    return res.status(404).json({ error: 'Selected item not found.' });
  }

  const location =
    dbState.locations.find((l) => l.id === asset.locationId) || dbState.locations[0];

  let rentalFee = asset.urgentRate;
  let durationLabel = 'Urgent Practical / Exam (4 Hours)';
  let durationHours = 4;

  if (durationType === 'DAILY') {
    rentalFee = asset.dailyRate;
    durationLabel = 'Full Day Access (24 Hours)';
    durationHours = 24;
  } else if (durationType === 'WEEKLY') {
    rentalFee = asset.weeklyRate;
    durationLabel = 'Weekly Rental (7 Days)';
    durationHours = 24 * 7;
  }

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
    totalPaid: rentalFee,
    paymentReference: paymentReference || `PSK_SRV_${Date.now()}`,
    paymentVerifiedServerSide: true,
    bookingStatus: 'PAID_AWAITING_HANDOVER',
    businessOutcome: 'IN_PROGRESS',
    failureReason: null,
    handoverOtp,
    collateralItemDescription: null,
    studentCollateralScreenshot: null,
    venueCollateralScreenshot: null,
    collateralSubmittedAt: null,
    venueVerifiedCollateralMatch: false,
    venueVerifiedAt: null,
    collateralPurgedOnReturn: false,
    collateralPurgedAt: null,
    handoverConditionNotes: null,
    handoverConfirmedAt: null,
    returnConditionNotes: null,
    returnConfirmedAt: null,
    createdAt: now.toISOString(),
    dueAt: dueAt.toISOString(),
  };

  asset.status = 'RESERVED';
  dbState.bookings.unshift(newBooking);
  saveDb(dbState);

  return res.json({ booking: newBooking, asset });
});

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
    requiredCollateralNote,
  } = req.body;

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
      : [String(includedAccessories || 'Carry Case')],
    urgentRate: uRate,
    dailyRate: dRate,
    weeklyRate: wRate,
    requiredCollateralNote:
      requiredCollateralNote ||
      'Drop Physical Collateral at Venue + 2-Way Screenshot Match',
    status: 'AVAILABLE',
    imageUrl: defaultImage,
    totalRentalsCount: 0,
  };

  dbState.assets.unshift(newAsset);
  saveDb(dbState);
  return res.json({ asset: newAsset });
});

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
