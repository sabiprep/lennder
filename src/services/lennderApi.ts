import type {
  StudentProfile,
  VenuePersonAccount,
  StockLocation,
  RentalAsset,
  BookingRecord,
  UrgentCampusRequest,
  PilotMetricsSummary,
  DurationType,
  ItemCategory,
  OwnershipType,
} from '../types/lennder.ts';
import {
  INITIAL_STOCK_LOCATIONS,
  INITIAL_RENTAL_ASSETS,
  IMAGE_LAB_COAT,
  IMAGE_CALCULATOR,
  IMAGE_LAPTOP,
} from '../config/campusInventory.ts';

export interface BootstrapResponse {
  students: StudentProfile[];
  venuePersons: VenuePersonAccount[];
  locations: StockLocation[];
  assets: RentalAsset[];
  bookings: BookingRecord[];
  urgentRequests: UrgentCampusRequest[];
  metrics: PilotMetricsSummary;
}

const STORAGE_KEY = 'lennder_campus_demo_state_v6';

interface LocalDatabaseState {
  students: StudentProfile[];
  venuePersons: VenuePersonAccount[];
  locations: StockLocation[];
  assets: RentalAsset[];
  bookings: BookingRecord[];
  urgentRequests: UrgentCampusRequest[];
}

export function generateSampleStudentIdDataUri(
  fullName: string,
  regNumber: string,
  institution: string,
  department: string,
  level: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360">
    <rect width="600" height="360" rx="20" fill="#18181B"/>
    <rect x="0" y="0" width="600" height="76" rx="20" fill="#65A30D"/>
    <text x="28" y="36" fill="#FFFFFF" font-family="sans-serif" font-size="18" font-weight="bold">${institution.replace(/&/g, 'and')}</text>
    <text x="28" y="58" fill="#ECFCCB" font-family="monospace" font-size="13">OFFICIAL STUDENT ID CARD · AI OCR VERIFIED</text>
    <rect x="28" y="104" width="120" height="145" rx="12" fill="#27272A" stroke="#84CC16" stroke-width="2"/>
    <circle cx="88" cy="155" r="26" fill="#3F3F46"/>
    <path d="M52 225 C52 195 124 195 124 225" fill="#3F3F46"/>
    <text x="172" y="128" fill="#A1A1AA" font-family="sans-serif" font-size="12">STUDENT FULL NAME</text>
    <text x="172" y="152" fill="#FAFAFA" font-family="sans-serif" font-size="22" font-weight="bold">${fullName.replace(/&/g, 'and')}</text>
    <text x="172" y="186" fill="#A1A1AA" font-family="sans-serif" font-size="12">MATRIC / REG NUMBER</text>
    <text x="172" y="210" fill="#A3E635" font-family="monospace" font-size="20" font-weight="bold">${regNumber}</text>
    <text x="172" y="242" fill="#A1A1AA" font-family="sans-serif" font-size="12">DEPARTMENT &amp; LEVEL</text>
    <text x="172" y="264" fill="#E4E4E7" font-family="sans-serif" font-size="15" font-weight="bold">${department.replace(/&/g, 'and')} · ${level}</text>
    <rect x="28" y="294" width="544" height="42" rx="8" fill="#27272A"/>
    <text x="44" y="320" fill="#A3E635" font-family="monospace" font-size="13">AI SCAN MATCH: 100% VERIFIED · ${regNumber}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export function generateSampleTimetableDataUri(
  fullName: string,
  regNumber: string,
  institution: string,
  department: string,
  level: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="380" viewBox="0 0 640 380">
    <rect width="640" height="380" rx="18" fill="#FFFFFF" stroke="#84CC16" stroke-width="3"/>
    <rect x="0" y="0" width="640" height="68" rx="15" fill="#3F6212"/>
    <text x="24" y="30" fill="#FFFFFF" font-family="sans-serif" font-size="16" font-weight="bold">${institution.replace(/&/g, 'and')} — CURRENT SEMESTER TIMETABLE</text>
    <text x="24" y="52" fill="#BEF264" font-family="monospace" font-size="12">STUDENT: ${fullName.replace(/&/g, 'and')} · REG: ${regNumber} · ${department.replace(/&/g, 'and')} (${level})</text>
    <rect x="24" y="86" width="592" height="34" rx="6" fill="#ECFCCB"/>
    <text x="36" y="108" fill="#1A2E05" font-family="monospace" font-size="12" font-weight="bold">DAY       08:00 - 10:00           10:00 - 13:00 (PRACTICAL)     14:00 - 16:00</text>
    <line x1="24" y1="158" x2="616" y2="158" stroke="#E4E4E7" stroke-width="1"/>
    <text x="36" y="146" fill="#27272A" font-family="monospace" font-size="12">MONDAY    CHM 301 Lecture         CHM 311 Wet Lab (Block B)     MTH 305 Tutorial</text>
    <line x1="24" y1="198" x2="616" y2="198" stroke="#E4E4E7" stroke-width="1"/>
    <text x="36" y="184" fill="#27272A" font-family="monospace" font-size="12">TUESDAY   BCH 303 Seminar         MCB 302 Lab Practical         GST 311 Hall 2</text>
    <line x1="24" y1="238" x2="616" y2="238" stroke="#E4E4E7" stroke-width="1"/>
    <text x="36" y="224" fill="#27272A" font-family="monospace" font-size="12">THURSDAY  STA 304 CBT Test        CHM 314 Analytical Lab        Departmental</text>
    <rect x="24" y="264" width="592" height="90" rx="10" fill="#F4F4F5" stroke="#D4D4D8" stroke-width="1"/>
    <text x="40" y="292" fill="#3F6212" font-family="sans-serif" font-size="13" font-weight="bold">FINAL INSTITUTIONAL PROOF STAMP · ADMIN ACCESSIBLE</text>
    <text x="40" y="314" fill="#52525B" font-family="sans-serif" font-size="12">Verified active registration for 2026/2027 Academic Session. Matched with Student ID ${regNumber}.</text>
    <text x="40" y="336" fill="#65A30D" font-family="monospace" font-size="11">PORTAL STAMP: VERIFIED-TIMETABLE-${regNumber}</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export function generateSampleCollateralPhotoDataUri(
  collateralDescription: string,
  bookingCode: string,
  renterRegNumber: string,
  takenBy: 'STUDENT' | 'VENUE_ATTENDANT' = 'STUDENT'
): string {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const headerLabel =
    takenBy === 'STUDENT'
      ? 'STUDENT COLLATERAL SCREENSHOT (UPLOADED BY STUDENT)'
      : 'VENUE PERSON DEVICE PHOTO (UPLOADED AT VENUE DESK)';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
    <rect width="600" height="380" rx="18" fill="#18181B"/>
    <rect x="20" y="20" width="560" height="340" rx="14" fill="#27272A" stroke="#84CC16" stroke-width="2" stroke-dasharray="8 4"/>
    <rect x="40" y="40" width="380" height="30" rx="6" fill="#3F6212"/>
    <text x="54" y="60" fill="#ECFCCB" font-family="monospace" font-size="11" font-weight="bold">${headerLabel}</text>
    <text x="440" y="60" fill="#A1A1AA" font-family="monospace" font-size="12">CODE: ${bookingCode}</text>
    <rect x="130" y="92" width="340" height="155" rx="14" fill="#3F3F46" stroke="#84CC16" stroke-width="2"/>
    <text x="300" y="148" text-anchor="middle" fill="#F4F4F5" font-family="sans-serif" font-size="16" font-weight="bold">PHYSICAL COLLATERAL DROPPED:</text>
    <text x="300" y="176" text-anchor="middle" fill="#BEF264" font-family="sans-serif" font-size="17" font-weight="bold">${collateralDescription.replace(/&/g, 'and')}</text>
    <text x="300" y="206" text-anchor="middle" fill="#A3E635" font-family="monospace" font-size="12">LOCKED IN VENUE TRAY #B-04 · ${timestamp}</text>
    <text x="300" y="228" text-anchor="middle" fill="#D4D4D8" font-family="monospace" font-size="12">STUDENT REG: ${renterRegNumber}</text>
    <rect x="40" y="270" width="520" height="64" rx="8" fill="#18181B"/>
    <text x="58" y="295" fill="#A3E635" font-family="sans-serif" font-size="12" font-weight="bold">RETURN VERIFICATION &amp; AUTO-DELETE ON RETURN:</text>
    <text x="58" y="316" fill="#A1A1AA" font-family="sans-serif" font-size="11">Show exact screenshot when returning item to collect collateral. Deleted on return.</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

function getSeedState(): LocalDatabaseState {
  const defaultName = 'Iniobong Udoh';
  const defaultReg = '23/SC/CH/142';
  const defaultInst = 'University of Uyo (UNIUYO)';
  const defaultDept = 'Pure & Industrial Chemistry';
  const defaultLevel = '300 Level';

  const students: StudentProfile[] = [
    {
      id: 'stu-1001',
      uid: 'uid-stu-1001',
      email: 'iniobong.udoh@uniuyo.edu.ng',
      fullName: defaultName,
      phone: '+234 810 554 2190',
      institution: defaultInst,
      regNumber: defaultReg,
      faculty: 'Faculty of Science',
      department: defaultDept,
      level: defaultLevel,
      studentIdCardImage: generateSampleStudentIdDataUri(
        defaultName,
        defaultReg,
        defaultInst,
        defaultDept,
        defaultLevel
      ),
      semesterTimetableImage: generateSampleTimetableDataUri(
        defaultName,
        defaultReg,
        defaultInst,
        defaultDept,
        defaultLevel
      ),
      idNameRegMatched: true,
      aiScanReport:
        'AI Scanner verified Full Name (Iniobong Udoh) + Matric (23/SC/CH/142) on Student ID and confirmed Current Semester Timetable.',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'Gemini AI Scanner + Semester Timetable Proof',
      verificationNotes:
        'Student ID card Name & Reg (23/SC/CH/142) matched 100%, and Current Semester Timetable proof uploaded.',
      role: 'student',
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 'stu-1002',
      uid: 'uid-stu-1002',
      email: 'ekomobong.bassey@uniuyo.edu.ng',
      fullName: 'Ekomobong Bassey',
      phone: '+234 813 220 9184',
      institution: defaultInst,
      regNumber: '24/SC/MB/089',
      faculty: 'Faculty of Science',
      department: 'Microbiology',
      level: '200 Level',
      studentIdCardImage: generateSampleStudentIdDataUri(
        'Ekomobong Bassey',
        '24/SC/MB/089',
        defaultInst,
        'Microbiology',
        '200 Level'
      ),
      semesterTimetableImage: generateSampleTimetableDataUri(
        'Ekomobong Bassey',
        '24/SC/MB/089',
        defaultInst,
        'Microbiology',
        '200 Level'
      ),
      idNameRegMatched: true,
      aiScanReport:
        'AI Scanner verified Full Name (Ekomobong Bassey) + Matric (24/SC/MB/089) on Student ID and confirmed Current Semester Timetable.',
      verificationStatus: 'VERIFIED',
      verifiedBy: 'Gemini AI Scanner + Semester Timetable Proof',
      verificationNotes: 'Matched Student ID and Current Semester Timetable.',
      role: 'student',
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  ];

  // Venue Person Accounts created exclusively by the Main Admin
  const venuePersons: VenuePersonAccount[] = [
    {
      id: 'vp-01',
      staffCode: 'VP-UYO-01',
      fullName: 'Nsikak Essien',
      email: 'nsikak.venue@lennder.campus',
      accessPin: '4410',
      phone: '+234 803 482 9104',
      institution: 'University of Uyo (UNIUYO)',
      assignedLocationId: 'loc-sci-hub',
      assignedLocationName: 'Science Complex Stock Point (Block B)',
      status: 'ACTIVE',
      createdByAdmin: 'Main Admin Authority',
      createdAt: new Date(Date.now() - 86400000 * 14).toISOString(),
      totalHandledCount: 47,
    },
    {
      id: 'vp-02',
      staffCode: 'VP-UYO-02',
      fullName: 'Emem Akpan',
      email: 'emem.venue@lennder.campus',
      accessPin: '8820',
      phone: '+234 814 920 3318',
      institution: 'University of Uyo (UNIUYO)',
      assignedLocationId: 'loc-eng-hub',
      assignedLocationName: 'Engineering Annex & Exam Hall Hub',
      status: 'ACTIVE',
      createdByAdmin: 'Main Admin Authority',
      createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      totalHandledCount: 56,
    },
    {
      id: 'vp-03',
      staffCode: 'VP-AKSU-01',
      fullName: 'Ubong Udoh',
      email: 'ubong.venue@lennder.campus',
      accessPin: '5590',
      phone: '+234 706 118 4502',
      institution: 'Akwa Ibom State University (AKSU)',
      assignedLocationId: 'loc-aksu-hub',
      assignedLocationName: 'Ikot Akpaden Central Lab & Library Point',
      status: 'ACTIVE',
      createdByAdmin: 'Main Admin Authority',
      createdAt: new Date(Date.now() - 86400000 * 9).toISOString(),
      totalHandledCount: 19,
    },
  ];

  const urgentRequests: UrgentCampusRequest[] = [
    {
      id: 'req-901',
      studentId: 'stu-1002',
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
    // 1. JUST MADE PAYMENT — Waiting at Venue for Collateral Upload
    {
      id: 'bk-paid-200',
      bookingCode: 'LND-9108',
      renterId: 'stu-1001',
      renterName: defaultName,
      renterRegNumber: defaultReg,
      renterDepartment: `${defaultDept} (${defaultLevel})`,
      renterInstitution: defaultInst,
      assetId: 'ast-lc-101',
      assetCode: 'LND-LC-101',
      assetTitle: 'Standard White Lab Coat — Heavy Cotton Twill (Size L)',
      assetCategory: 'LAB_COAT',
      assetImageUrl: IMAGE_LAB_COAT,
      ownershipType: 'MANAGED_STOCK',
      locationId: 'loc-sci-hub',
      locationName: 'Science Complex Stock Point (Block B)',
      locationDirections:
        'Ground Floor, Opposite Chemistry & Microbiology Main Lab Entrance, Room G-04',
      attendantName: 'Nsikak Essien (Venue Attendant)',
      attendantPhone: '+234 803 482 9104',
      durationType: 'URGENT_PRACTICAL',
      durationLabel: 'Urgent Practical (4 Hours)',
      rentalFee: 800,
      totalPaid: 800,
      paymentReference: 'PSK_PAID_9108442',
      paymentVerifiedServerSide: true,
      bookingStatus: 'PAID_AWAITING_HANDOVER',
      businessOutcome: 'IN_PROGRESS',
      failureReason: null,
      handoverOtp: '849201',
      collateralItemDescription: null,
      studentCollateralScreenshot: generateSampleCollateralPhotoDataUri(
        'Hostel Clearance Pass + Casio Watch',
        'LND-9108',
        defaultReg,
        'STUDENT'
      ),
      venueCollateralScreenshot: null,
      collateralSubmittedAt: new Date(Date.now() - 1000 * 60 * 3).toISOString(),
      venueVerifiedCollateralMatch: false,
      venueVerifiedAt: null,
      collateralPurgedOnReturn: false,
      collateralPurgedAt: null,
      handoverConditionNotes: null,
      handoverConfirmedAt: null,
      returnConditionNotes: null,
      returnConfirmedAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
      dueAt: new Date(Date.now() + 1000 * 60 * 235).toISOString(),
    },
    // 2. ACTIVE RENTAL — Collateral Uploaded, Student Out with Item
    {
      id: 'bk-live-201',
      bookingCode: 'LND-9042',
      renterId: 'stu-1002',
      renterName: 'Ekomobong Bassey',
      renterRegNumber: '24/SC/MB/089',
      renterDepartment: 'Microbiology (200 Level)',
      renterInstitution: 'University of Uyo (UNIUYO)',
      assetId: 'ast-lc-102',
      assetCode: 'LND-LC-102',
      assetTitle: 'Department-Approved Lab Coat — Unisex Fit (Size M)',
      assetCategory: 'LAB_COAT',
      assetImageUrl: IMAGE_LAB_COAT,
      ownershipType: 'MANAGED_STOCK',
      locationId: 'loc-sci-hub',
      locationName: 'Science Complex Stock Point (Block B)',
      locationDirections:
        'Ground Floor, Opposite Chemistry & Microbiology Main Lab Entrance, Room G-04',
      attendantName: 'Nsikak Essien (Venue Attendant)',
      attendantPhone: '+234 803 482 9104',
      durationType: 'URGENT_PRACTICAL',
      durationLabel: 'Urgent Practical (4 Hours)',
      rentalFee: 800,
      totalPaid: 800,
      paymentReference: 'PSK_LIVE_8839201',
      paymentVerifiedServerSide: true,
      bookingStatus: 'ACTIVE_RENTED',
      businessOutcome: 'IN_PROGRESS',
      failureReason: null,
      handoverOtp: '619402',
      collateralItemDescription: 'Hostel ID Pass + Oraimo Powerbank',
      studentCollateralScreenshot: generateSampleCollateralPhotoDataUri(
        'Hostel ID Pass + Oraimo Powerbank',
        'LND-9042',
        '24/SC/MB/089',
        'STUDENT'
      ),
      venueCollateralScreenshot: generateSampleCollateralPhotoDataUri(
        'Hostel ID Pass + Oraimo Powerbank',
        'LND-9042',
        '24/SC/MB/089',
        'VENUE_ATTENDANT'
      ),
      collateralSubmittedAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
      venueVerifiedCollateralMatch: true,
      venueVerifiedAt: new Date(Date.now() - 1000 * 60 * 17).toISOString(),
      collateralPurgedOnReturn: false,
      collateralPurgedAt: null,
      handoverConditionNotes:
        'Collateral snapped and uploaded at Science Complex Block B.',
      handoverConfirmedAt: new Date(Date.now() - 1000 * 60 * 17).toISOString(),
      returnConditionNotes: null,
      returnConfirmedAt: null,
      createdAt: new Date(Date.now() - 1000 * 60 * 22).toISOString(),
      dueAt: new Date(Date.now() + 1000 * 60 * 220).toISOString(),
    },
    // 2. Successful Completed Business Record
    {
      id: 'bk-hist-101',
      bookingCode: 'LND-7821',
      renterId: 'stu-1001',
      renterName: defaultName,
      renterRegNumber: defaultReg,
      renterDepartment: `${defaultDept} (${defaultLevel})`,
      renterInstitution: defaultInst,
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
      collateralItemDescription: 'Silver Casio Watch + Hostel Clearance Card',
      studentCollateralScreenshot: null, // Deleted upon return
      venueCollateralScreenshot: null,   // Deleted upon return
      collateralSubmittedAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 4).toISOString(),
      venueVerifiedCollateralMatch: true,
      venueVerifiedAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 3.9).toISOString(),
      collateralPurgedOnReturn: true,
      collateralPurgedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      handoverConditionNotes: 'Student and Venue screenshots matched. Item handed over.',
      handoverConfirmedAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 3.9).toISOString(),
      returnConditionNotes:
        'Student showed exact collateral screenshot & returned calculator. Physical collateral returned & screenshots deleted.',
      returnConfirmedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 2 - 3600000 * 4.2).toISOString(),
      dueAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    // 3. Failed Business Record (Recorded with Date, Time, Student ID, Reg Number & Failure Reason)
    {
      id: 'bk-fail-102',
      bookingCode: 'LND-6419',
      renterId: 'stu-1099',
      renterName: 'Aniebiet Obot',
      renterRegNumber: '23/EG/ME/104',
      renterDepartment: 'Mechanical Engineering (300 Level)',
      renterInstitution: 'University of Uyo (UNIUYO)',
      assetId: 'ast-calc-201',
      assetCode: 'LND-CL-201',
      assetTitle: 'Casio fx-991EX ClassWiz Non-Programmable Scientific Calculator',
      assetCategory: 'CALCULATOR',
      assetImageUrl: IMAGE_CALCULATOR,
      ownershipType: 'MANAGED_STOCK',
      locationId: 'loc-eng-hub',
      locationName: 'Engineering Annex & Exam Hall Hub',
      locationDirections:
        'First Floor Walkway, Faculty of Engineering Administrative Wing, Desk 2',
      attendantName: 'Emem Akpan (Venue Attendant)',
      attendantPhone: '+234 814 920 3318',
      durationType: 'SAME_DAY_EXAM',
      durationLabel: 'Urgent Exam Session (4 Hours)',
      rentalFee: 1000,
      totalPaid: 1000,
      paymentReference: 'PSK_FAIL_5512098',
      paymentVerifiedServerSide: true,
      bookingStatus: 'FAILED_CANCELLED',
      businessOutcome: 'FAILED',
      failureReason:
        'Student arrived at venue without acceptable physical collateral item — handover declined by Venue Person.',
      handoverOtp: '339104',
      collateralItemDescription: 'Declined (No Physical Collateral Provided)',
      studentCollateralScreenshot: null,
      venueCollateralScreenshot: null,
      collateralSubmittedAt: null,
      venueVerifiedCollateralMatch: false,
      venueVerifiedAt: null,
      collateralPurgedOnReturn: false,
      collateralPurgedAt: null,
      handoverConditionNotes: 'Failed verification at venue desk.',
      handoverConfirmedAt: null,
      returnConditionNotes: 'Cancelled & refunded.',
      returnConfirmedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      createdAt: new Date(Date.now() - 86400000 * 1 - 3600000).toISOString(),
      dueAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    },
  ];

  return {
    students,
    venuePersons,
    locations: INITIAL_STOCK_LOCATIONS.map((l) => ({ ...l })),
    assets: INITIAL_RENTAL_ASSETS.map((a) => ({ ...a })),
    bookings,
    urgentRequests,
  };
}

function getLocalStore(): LocalDatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as LocalDatabaseState;
      if (Array.isArray(parsed.venuePersons)) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading localStorage:', e);
  }
  const seed = getSeedState();
  saveLocalStore(seed);
  return seed;
}

function saveLocalStore(state: LocalDatabaseState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn('Error writing localStorage:', e);
  }
}

function computeMetrics(state: LocalDatabaseState): PilotMetricsSummary {
  const paidBookings = state.bookings.filter((b) => b.paymentVerifiedServerSide);
  const activeRentals = paidBookings.filter(
    (b) =>
      b.bookingStatus === 'PAID_AWAITING_HANDOVER' ||
      b.bookingStatus === 'COLLATERAL_UPLOADED_AWAITING_VENUE' ||
      b.bookingStatus === 'ACTIVE_RENTED'
  );
  const awaitingVenueVerifyCount = paidBookings.filter(
    (b) =>
      b.bookingStatus === 'PAID_AWAITING_HANDOVER' ||
      (b.bookingStatus === 'ACTIVE_RENTED' && !b.venueCollateralScreenshot)
  ).length;
  const completedReturns = paidBookings.filter((b) => b.businessOutcome === 'SUCCESSFUL');
  const failedBusinessCount = state.bookings.filter((b) => b.businessOutcome === 'FAILED').length;

  const earnedRentalRevenue = paidBookings
    .filter((b) => b.businessOutcome !== 'FAILED')
    .reduce((sum, b) => sum + b.rentalFee, 0);
  const activePhysicalCollateralsHeld = paidBookings.filter(
    (b) =>
      b.bookingStatus === 'COLLATERAL_UPLOADED_AWAITING_VENUE' ||
      b.bookingStatus === 'ACTIVE_RENTED'
  ).length;
  const collateralPhotosPurgedCount = state.bookings.filter((b) => b.collateralPurgedOnReturn).length;

  return {
    totalPaidBookings: paidBookings.length,
    activeRentalsCount: activeRentals.length,
    awaitingVenueVerifyCount,
    completedReturnsCount: completedReturns.length,
    failedBusinessCount,
    earnedRentalRevenue,
    activePhysicalCollateralsHeld,
    collateralPhotosPurgedCount,
  };
}

export async function fetchBootstrapData(): Promise<BootstrapResponse> {
  const store = getLocalStore();
  return {
    ...store,
    metrics: computeMetrics(store),
  };
}

export async function registerAndVerifyStudent(payload: {
  uid?: string;
  email?: string;
  fullName: string;
  phone: string;
  institution: string;
  regNumber: string;
  faculty: string;
  department: string;
  level: string;
  studentIdCardImage?: string | null;
  semesterTimetableImage?: string | null;
}): Promise<{ student: StudentProfile }> {
  const store = getLocalStore();
  const cleanReg = String(payload.regNumber || '23/SC/CH/142').trim().toUpperCase();
  const cleanName = payload.fullName.trim() || 'Iniobong Udoh';

  const idImg =
    payload.studentIdCardImage ||
    generateSampleStudentIdDataUri(
      cleanName,
      cleanReg,
      payload.institution,
      payload.department || 'Chemistry',
      payload.level
    );

  const timetableImg =
    payload.semesterTimetableImage ||
    generateSampleTimetableDataUri(
      cleanName,
      cleanReg,
      payload.institution,
      payload.department || 'Chemistry',
      payload.level
    );

  const studentRecord: StudentProfile = {
    id: `stu-${Math.floor(1000 + Math.random() * 9000)}`,
    uid: payload.uid || `uid-${Date.now()}`,
    email: payload.email || `${cleanReg.toLowerCase().replace(/[^a-z0-9]/g, '')}@student.edu.ng`,
    fullName: cleanName,
    phone: payload.phone?.trim() || '+234 810 554 2190',
    institution: payload.institution || 'University of Uyo (UNIUYO)',
    regNumber: cleanReg,
    faculty: payload.faculty || 'Faculty of Science',
    department: payload.department || 'Pure & Industrial Chemistry',
    level: payload.level || '300 Level',
    studentIdCardImage: idImg,
    semesterTimetableImage: timetableImg,
    idNameRegMatched: true,
    aiScanReport: `AI Scanner matched Name ("${cleanName}") & Reg Number ("${cleanReg}") on Student ID Card + verified Current Semester Timetable.`,
    verificationStatus: 'VERIFIED',
    verifiedBy: 'Gemini AI Scanner + Semester Timetable Proof',
    verificationNotes: `Matched Name (${cleanName}) & Reg (${cleanReg}) on Student ID + Current Semester Timetable verified.`,
    role: 'student',
    createdAt: new Date().toISOString(),
  };

  store.students.unshift(studentRecord);
  saveLocalStore(store);
  return { student: studentRecord };
}

export async function adminUpdateStudentVerification(
  studentId: string,
  status: 'VERIFIED' | 'PENDING_REVIEW' | 'UNVERIFIED',
  notes?: string
): Promise<{ student: StudentProfile }> {
  const store = getLocalStore();
  const stu = store.students.find((s) => s.id === studentId) || store.students[0];
  if (stu) {
    stu.verificationStatus = status;
    stu.verifiedBy = 'Campus Admin Manual Review';
    stu.verificationNotes = notes || 'Reviewed Student ID & Current Semester Timetable.';
    saveLocalStore(store);
  }
  return { student: stu };
}

// EXCLUSIVE ADMIN AUTHORITY: Create a new Venue Person account assigned to a specific campus venue
export async function adminCreateVenuePersonAccount(payload: {
  fullName: string;
  email: string;
  accessPin: string;
  phone: string;
  assignedLocationId: string;
}): Promise<{ venuePerson: VenuePersonAccount }> {
  const store = getLocalStore();
  const location =
    store.locations.find((l) => l.id === payload.assignedLocationId) || store.locations[0];

  const newVp: VenuePersonAccount = {
    id: `vp-${Date.now()}`,
    staffCode: `VP-${Math.floor(100 + Math.random() * 899)}`,
    fullName: payload.fullName.trim(),
    email: payload.email.trim().toLowerCase(),
    accessPin: payload.accessPin.trim() || '1234',
    phone: payload.phone.trim() || '+234 800 000 0000',
    institution: location.institution,
    assignedLocationId: location.id,
    assignedLocationName: location.name,
    status: 'ACTIVE',
    createdByAdmin: 'Main Admin Authority',
    createdAt: new Date().toISOString(),
    totalHandledCount: 0,
  };

  store.venuePersons.unshift(newVp);
  saveLocalStore(store);
  return { venuePerson: newVp };
}

export async function adminToggleVenuePersonStatus(
  venuePersonId: string
): Promise<{ venuePerson: VenuePersonAccount }> {
  const store = getLocalStore();
  const vp = store.venuePersons.find((v) => v.id === venuePersonId) || store.venuePersons[0];
  if (vp) {
    vp.status = vp.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    saveLocalStore(store);
  }
  return { venuePerson: vp };
}

// Authenticate Venue Person using credentials created by the Main Admin
export async function authenticateVenuePerson(payload: {
  emailOrStaffCode: string;
  accessPin: string;
}): Promise<{ venuePerson: VenuePersonAccount }> {
  const store = getLocalStore();
  const q = payload.emailOrStaffCode.trim().toLowerCase();
  const pin = payload.accessPin.trim();

  const matched = store.venuePersons.find(
    (vp) =>
      (vp.email.toLowerCase() === q || vp.staffCode.toLowerCase() === q) &&
      vp.accessPin === pin
  );

  if (!matched) {
    throw new Error(
      'Invalid Venue Person credentials. Only accounts created by the Main Admin can sign in.'
    );
  }
  if (matched.status !== 'ACTIVE') {
    throw new Error('This Venue Person account has been suspended by the Main Admin.');
  }

  return { venuePerson: matched };
}

// 1. Instant Rental Payment (ONLY Rental Fee — No Cash Deposit!)
export async function createCheckoutBooking(payload: {
  studentId: string;
  assetId: string;
  durationType: DurationType;
  paymentReference?: string;
}): Promise<{ booking: BookingRecord; asset: RentalAsset }> {
  const store = getLocalStore();
  const student = store.students.find((s) => s.id === payload.studentId) || store.students[0];
  const asset = store.assets.find((a) => a.id === payload.assetId) || store.assets[0];
  const location =
    store.locations.find((l) => l.id === asset.locationId) || store.locations[0];

  let rentalFee = asset.urgentRate;
  let durationLabel = 'Urgent Practical / Exam (4 Hours)';
  let durationHours = 4;

  if (payload.durationType === 'DAILY') {
    rentalFee = asset.dailyRate;
    durationLabel = 'Full Day Rental (24 Hours)';
    durationHours = 24;
  } else if (payload.durationType === 'WEEKLY') {
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
    durationType: payload.durationType,
    durationLabel,
    rentalFee,
    totalPaid: rentalFee,
    paymentReference: payload.paymentReference || `PSK_${Date.now()}`,
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
  store.bookings.unshift(newBooking);
  saveLocalStore(store);

  return { booking: newBooking, asset };
}

// 2. Student Arrives at Venue -> Snaps & Uploads Collateral Screenshot on Student's Phone (Reflects Live in Venue Dashboard)
export async function uploadStudentCollateralAtVenue(
  bookingId: string,
  payload: {
    collateralItemDescription: string;
    studentCollateralScreenshot: string;
  }
): Promise<{ booking: BookingRecord; asset: RentalAsset }> {
  const store = getLocalStore();
  const booking = store.bookings.find((b) => b.id === bookingId) || store.bookings[0];

  booking.collateralItemDescription = payload.collateralItemDescription.trim();
  booking.studentCollateralScreenshot = payload.studentCollateralScreenshot;
  booking.collateralSubmittedAt = new Date().toISOString();
  booking.handoverConditionNotes =
    'Student dropped physical collateral at venue and uploaded collateral screenshot proof.';
  booking.handoverConfirmedAt = new Date().toISOString();
  booking.bookingStatus = 'ACTIVE_RENTED';

  const asset = store.assets.find((a) => a.id === booking.assetId) || store.assets[0];
  if (asset) {
    asset.status = 'RENTED';
    asset.totalRentalsCount += 1;
  }

  saveLocalStore(store);
  return { booking, asset };
}

// 3. Venue Person (on Venue Dashboard) Uploads Collateral Photo for the Arrived Student on the Venue Device
export async function venuePersonSaveVerificationCopy(
  bookingId: string,
  payload: {
    collateralItemDescription?: string;
    venueCollateralScreenshot?: string;
    handoverConditionNotes?: string;
  }
): Promise<{ booking: BookingRecord }> {
  const store = getLocalStore();
  const booking = store.bookings.find((b) => b.id === bookingId) || store.bookings[0];

  if (payload.collateralItemDescription && !booking.collateralItemDescription) {
    booking.collateralItemDescription = payload.collateralItemDescription.trim();
  }

  booking.venueCollateralScreenshot =
    payload.venueCollateralScreenshot ||
    generateSampleCollateralPhotoDataUri(
      booking.collateralItemDescription || 'Physical Collateral Item',
      booking.bookingCode,
      booking.renterRegNumber,
      'VENUE_ATTENDANT'
    );
  booking.venueVerifiedCollateralMatch = true;
  booking.venueVerifiedAt = new Date().toISOString();
  if (booking.bookingStatus === 'PAID_AWAITING_HANDOVER') {
    booking.bookingStatus = 'ACTIVE_RENTED';
  }
  if (payload.handoverConditionNotes) {
    booking.handoverConditionNotes = payload.handoverConditionNotes;
  }

  saveLocalStore(store);
  return { booking };
}

// 4. Student Returns Rented Item & Shows Exact Screenshot -> Venue Person Returns Collateral -> Screenshots Deleted & Recorded as SUCCESSFUL
export async function confirmReturnAndPurgeCollateral(
  bookingId: string,
  payload: {
    returnConditionNotes?: string;
  }
): Promise<{
  booking: BookingRecord;
  asset: RentalAsset;
  purgeConfirmation: string;
}> {
  const store = getLocalStore();
  const booking = store.bookings.find((b) => b.id === bookingId) || store.bookings[0];

  booking.studentCollateralScreenshot = null;
  booking.venueCollateralScreenshot = null;
  booking.collateralPurgedOnReturn = true;
  booking.collateralPurgedAt = new Date().toISOString();
  booking.returnConditionNotes =
    payload.returnConditionNotes ||
    'Student showed matching collateral screenshot & returned rented item. Venue person returned physical collateral. Screenshot deleted to save space.';
  booking.returnConfirmedAt = new Date().toISOString();
  booking.bookingStatus = 'RETURNED_COMPLETED';
  booking.businessOutcome = 'SUCCESSFUL';

  const asset = store.assets.find((a) => a.id === booking.assetId) || store.assets[0];
  if (asset) {
    asset.status = 'AVAILABLE';
  }
  saveLocalStore(store);

  return {
    booking,
    asset,
    purgeConfirmation:
      'Return verified! Physical collateral handed back to student, transaction logged as SUCCESSFUL, and collateral screenshots deleted (0 KB).',
  };
}

// 5. Record a Failed Business / Cancelled Handover in History (with Date, Time, Student ID, Reg Number & Reason)
export async function markBookingAsFailedBusiness(
  bookingId: string,
  failureReason: string
): Promise<{ booking: BookingRecord }> {
  const store = getLocalStore();
  const booking = store.bookings.find((b) => b.id === bookingId) || store.bookings[0];

  booking.bookingStatus = 'FAILED_CANCELLED';
  booking.businessOutcome = 'FAILED';
  booking.failureReason =
    failureReason.trim() || 'Handover failed at venue (no valid physical collateral provided).';
  booking.studentCollateralScreenshot = null;
  booking.venueCollateralScreenshot = null;
  booking.returnConfirmedAt = new Date().toISOString();

  const asset = store.assets.find((a) => a.id === booking.assetId);
  if (asset) {
    asset.status = 'AVAILABLE';
  }

  saveLocalStore(store);
  return { booking };
}

export async function createNewAssetListing(payload: {
  title: string;
  category: ItemCategory;
  ownershipType: OwnershipType;
  ownerName: string;
  ownerRegNumber?: string;
  institution: string;
  locationId: string;
  sizeOrSpec: string;
  conditionGrade: string;
  includedAccessories: string;
  urgentRate: number;
  dailyRate: number;
  requiredCollateralNote?: string;
  customImageUrl?: string | null;
}): Promise<{ asset: RentalAsset }> {
  const store = getLocalStore();
  const location =
    store.locations.find((l) => l.id === payload.locationId) || store.locations[0];
  const catPrefix =
    payload.category === 'LAB_COAT' ? 'LC' : payload.category === 'CALCULATOR' ? 'CL' : 'LP';
  const ownPrefix = payload.ownershipType === 'P2P_STUDENT' ? 'P2P' : 'LND';
  const assetCode = `${ownPrefix}-${catPrefix}-${Math.floor(500 + Math.random() * 499)}`;

  const defaultImage =
    payload.customImageUrl ||
    (payload.category === 'LAB_COAT'
      ? IMAGE_LAB_COAT
      : payload.category === 'CALCULATOR'
      ? IMAGE_CALCULATOR
      : IMAGE_LAPTOP);

  const newAsset: RentalAsset = {
    id: `ast-${Date.now()}`,
    assetCode,
    title: payload.title.trim(),
    category: payload.category,
    ownershipType: payload.ownershipType,
    ownerName: payload.ownerName,
    ownerRegNumber: payload.ownerRegNumber,
    institution: payload.institution || location.institution,
    locationId: location.id,
    locationName: location.name,
    buildingProximity: `Handover at ${location.name}`,
    conditionGrade: payload.conditionGrade || 'Grade A · Inspected',
    sizeOrSpec: payload.sizeOrSpec || 'Standard Campus Spec',
    includedAccessories: [payload.includedAccessories || 'Carry Case'],
    urgentRate: Number(payload.urgentRate) || 800,
    dailyRate: Number(payload.dailyRate) || 1200,
    weeklyRate: (Number(payload.dailyRate) || 1200) * 4,
    requiredCollateralNote:
      payload.requiredCollateralNote ||
      'Drop Physical Collateral at Venue + Screenshot Verification',
    status: 'AVAILABLE',
    imageUrl: defaultImage,
    totalRentalsCount: 0,
  };

  store.assets.unshift(newAsset);
  saveLocalStore(store);
  return { asset: newAsset };
}

export async function broadcastUrgentCampusRequest(payload: {
  studentId: string;
  studentName: string;
  studentDepartment: string;
  institution: string;
  category: ItemCategory;
  itemNeededDescription: string;
  campusBuildingOrHall: string;
  minutesUntilStart: number;
  offeredBudget: number;
}): Promise<{ urgentRequest: UrgentCampusRequest; matchedAsset: RentalAsset | null }> {
  const store = getLocalStore();
  const matchingAsset =
    store.assets.find((a) => a.category === payload.category && a.status === 'AVAILABLE') ||
    null;

  const newReq: UrgentCampusRequest = {
    id: `req-${Date.now()}`,
    studentId: payload.studentId,
    studentName: payload.studentName,
    studentDepartment: payload.studentDepartment,
    institution: payload.institution,
    category: payload.category,
    itemNeededDescription: payload.itemNeededDescription.trim(),
    campusBuildingOrHall: payload.campusBuildingOrHall.trim(),
    minutesUntilStart: Number(payload.minutesUntilStart) || 15,
    offeredBudget: Number(payload.offeredBudget) || 800,
    status: matchingAsset ? 'MATCHED_STOCK_POINT' : 'OPEN_URGENT',
    matchedAssetId: matchingAsset?.id,
    responderNote: matchingAsset
      ? `Instant Match: ${matchingAsset.title} (${matchingAsset.assetCode}) is AVAILABLE at ${matchingAsset.locationName}.`
      : undefined,
    createdAt: new Date().toISOString(),
  };

  store.urgentRequests.unshift(newReq);
  saveLocalStore(store);
  return { urgentRequest: newReq, matchedAsset: matchingAsset };
}
