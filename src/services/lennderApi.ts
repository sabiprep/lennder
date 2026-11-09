import type {
  StudentProfile,
  StockLocation,
  RentalAsset,
  BookingRecord,
  UrgentCampusRequest,
  PilotMetricsSummary,
  DurationType,
  ItemCategory,
  OwnershipType,
} from '../types/lennder.ts';

export interface BootstrapResponse {
  students: StudentProfile[];
  locations: StockLocation[];
  assets: RentalAsset[];
  bookings: BookingRecord[];
  urgentRequests: UrgentCampusRequest[];
  metrics: PilotMetricsSummary;
}

export async function fetchBootstrapData(): Promise<BootstrapResponse> {
  const res = await fetch('/api/bootstrap');
  if (!res.ok) {
    throw new Error('Failed to load campus rental directory.');
  }
  return res.json();
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
}): Promise<{ student: StudentProfile }> {
  const res = await fetch('/api/students/register-and-verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to verify student credentials.');
  }
  return data;
}

export async function adminUpdateStudentVerification(
  studentId: string,
  status: 'VERIFIED' | 'PENDING_REVIEW' | 'UNVERIFIED',
  notes?: string
): Promise<{ student: StudentProfile }> {
  const res = await fetch(`/api/admin/students/${studentId}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status, notes }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to update student verification.');
  }
  return data;
}

export async function createCheckoutBooking(payload: {
  studentId: string;
  assetId: string;
  durationType: DurationType;
  paymentReference?: string;
}): Promise<{ booking: BookingRecord; asset: RentalAsset }> {
  const res = await fetch('/api/bookings/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Checkout verification failed.');
  }
  return data;
}

export async function submitCollateralAndConfirmHandover(
  bookingId: string,
  payload: {
    collateralItemDescription: string;
    collateralScreenshotData: string;
    handoverConditionNotes?: string;
    otpCode?: string;
  }
): Promise<{ booking: BookingRecord; asset: RentalAsset }> {
  const res = await fetch(`/api/bookings/${bookingId}/handover-collateral`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Collateral handover confirmation failed.');
  }
  return data;
}

export async function confirmReturnAndPurgeCollateral(
  bookingId: string,
  payload: {
    returnConditionNotes?: string;
    depositDeductionAmount?: number;
  }
): Promise<{
  booking: BookingRecord;
  asset: RentalAsset;
  purgeConfirmation: string;
}> {
  const res = await fetch(`/api/bookings/${bookingId}/return-and-purge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Return inspection failed.');
  }
  return data;
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
  securityDeposit: number;
}): Promise<{ asset: RentalAsset }> {
  const res = await fetch('/api/assets', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to publish item listing.');
  }
  return data;
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
  const res = await fetch('/api/urgent-requests', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || 'Failed to broadcast urgent request.');
  }
  return data;
}

/**
 * Generates a realistic, high-contrast SVG Data URI for a Student ID Card or
 * Physical Collateral Screenshot so students/evaluators can test camera upload
 * or 1-tap instant capture without needing an external file.
 */
export function generateSampleStudentIdDataUri(
  fullName: string,
  regNumber: string,
  institution: string,
  department: string,
  level: string
): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="360" viewBox="0 0 600 360">
    <rect width="600" height="360" rx="20" fill="#0F172A"/>
    <rect x="0" y="0" width="600" height="76" rx="20" fill="#059669"/>
    <text x="28" y="36" fill="#FFFFFF" font-family="sans-serif" font-size="18" font-weight="bold">${institution.replace(/&/g, 'and')}</text>
    <text x="28" y="58" fill="#D1FAE5" font-family="monospace" font-size="13">OFFICIAL UNDERGRADUATE IDENTITY CARD · VERIFIED</text>
    <rect x="28" y="104" width="120" height="145" rx="12" fill="#1E293B" stroke="#10B981" stroke-width="2"/>
    <circle cx="88" cy="155" r="26" fill="#334155"/>
    <path d="M52 225 C52 195 124 195 124 225" fill="#334155"/>
    <text x="172" y="128" fill="#94A3B8" font-family="sans-serif" font-size="12">STUDENT FULL NAME</text>
    <text x="172" y="152" fill="#F8FAFC" font-family="sans-serif" font-size="22" font-weight="bold">${fullName.replace(/&/g, 'and')}</text>
    <text x="172" y="186" fill="#94A3B8" font-family="sans-serif" font-size="12">MATRIC / REG NUMBER</text>
    <text x="172" y="210" fill="#34D399" font-family="monospace" font-size="20" font-weight="bold">${regNumber}</text>
    <text x="172" y="242" fill="#94A3B8" font-family="sans-serif" font-size="12">DEPARTMENT &amp; LEVEL</text>
    <text x="172" y="264" fill="#E2E8F0" font-family="sans-serif" font-size="15" font-weight="bold">${department.replace(/&/g, 'and')} · ${level}</text>
    <rect x="28" y="294" width="544" height="42" rx="8" fill="#1E293B"/>
    <text x="44" y="320" fill="#94A3B8" font-family="monospace" font-size="13">BARCODE: |||| || ||||| |||| ${regNumber} · SESSION 2026/2027</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}

export function generateSampleCollateralPhotoDataUri(
  collateralDescription: string,
  bookingCode: string,
  renterRegNumber: string
): string {
  const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="380" viewBox="0 0 600 380">
    <rect width="600" height="380" rx="18" fill="#18181B"/>
    <rect x="20" y="20" width="560" height="340" rx="14" fill="#27272A" stroke="#10B981" stroke-width="2" stroke-dasharray="8 4"/>
    <rect x="44" y="42" width="240" height="30" rx="6" fill="#065F46"/>
    <text x="58" y="62" fill="#A7F3D0" font-family="monospace" font-size="12" font-weight="bold">COLLATERAL HANDOVER PROOF</text>
    <text x="410" y="62" fill="#A1A1AA" font-family="monospace" font-size="12">BOOKING: ${bookingCode}</text>
    <rect x="150" y="95" width="300" height="150" rx="14" fill="#3F3F46" stroke="#71717A" stroke-width="2"/>
    <text x="300" y="155" text-anchor="middle" fill="#F4F4F5" font-family="sans-serif" font-size="17" font-weight="bold">${collateralDescription.replace(/&/g, 'and')}</text>
    <text x="300" y="185" text-anchor="middle" fill="#34D399" font-family="monospace" font-size="13">LOCKED IN STOCK POINT BIN #B-04</text>
    <text x="300" y="215" text-anchor="middle" fill="#D4D4D8" font-family="monospace" font-size="12">STUDENT REG: ${renterRegNumber} · ${timestamp}</text>
    <rect x="44" y="275" width="512" height="58" rx="8" fill="#18181B"/>
    <text x="64" y="300" fill="#FBBF24" font-family="sans-serif" font-size="12" font-weight="bold">AUTO-PURGE PRIVACY POLICY ACTIVE:</text>
    <text x="64" y="319" fill="#A1A1AA" font-family="sans-serif" font-size="12">This screenshot proof will be permanently deleted the moment the rented item is returned.</text>
  </svg>`;
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
}
