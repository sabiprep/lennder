/**
 * Shared Domain Models for Lennder (Web & React Native Portable)
 */

export type ItemCategory = 'LAB_COAT' | 'CALCULATOR' | 'LAPTOP';

export type OwnershipType = 'MANAGED_STOCK' | 'P2P_STUDENT';

export type AssetStatus = 'AVAILABLE' | 'RESERVED' | 'RENTED' | 'INSPECTION';

export type VerificationStatus = 'UNVERIFIED' | 'PENDING_REVIEW' | 'VERIFIED';

export type DurationType = 'URGENT_PRACTICAL' | 'SAME_DAY_EXAM' | 'DAILY' | 'WEEKLY';

export type BookingStatus =
  | 'PENDING_PAYMENT'
  | 'PAID_AWAITING_HANDOVER'
  | 'COLLATERAL_UPLOADED_AWAITING_VENUE'
  | 'ACTIVE_RENTED'
  | 'RETURNED_COMPLETED'
  | 'FAILED_CANCELLED';

export type BusinessOutcome = 'IN_PROGRESS' | 'SUCCESSFUL' | 'FAILED';

export type AppPortalRole = 'STUDENT' | 'VENUE_PERSON' | 'MAIN_ADMIN';

export interface StudentProfile {
  id: string;
  uid: string;
  email: string;
  fullName: string;
  phone: string;
  institution: string;
  regNumber: string;
  faculty: string;
  department: string;
  level: string;
  studentIdCardImage?: string | null;
  semesterTimetableImage?: string | null;
  idNameRegMatched?: boolean;
  aiScanReport?: string;
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verificationNotes?: string;
  role: 'student' | 'attendant' | 'admin';
  createdAt: string;
}

/**
 * Venue Person Account — Can ONLY be created by the Main Admin
 */
export interface VenuePersonAccount {
  id: string;
  staffCode: string;
  fullName: string;
  email: string;
  accessPin: string;
  phone: string;
  institution: string;
  assignedLocationId: string;
  assignedLocationName: string;
  status: 'ACTIVE' | 'SUSPENDED';
  createdByAdmin: string;
  createdAt: string;
  totalHandledCount: number;
}

export interface StockLocation {
  id: string;
  code: string;
  name: string;
  institution: string;
  buildingDirections: string;
  landmark: string;
  attendantName: string;
  attendantPhone: string;
  operatingHours: string;
  walkingMinutesFromLabs: number;
  activeStockCount: number;
}

export interface RentalAsset {
  id: string;
  assetCode: string;
  title: string;
  category: ItemCategory;
  ownershipType: OwnershipType;
  ownerName: string;
  ownerRegNumber?: string;
  institution: string;
  locationId: string;
  locationName: string;
  buildingProximity: string;
  conditionGrade: string;
  sizeOrSpec: string;
  includedAccessories: string[];
  urgentRate: number;      // Instant rental price for 4-hour practical/exam in NGN
  dailyRate: number;       // 24-hour rental price in NGN
  weeklyRate: number;      // 7-day rental price in NGN
  requiredCollateralNote: string; // Physical collateral item dropped at venue (no money deposit!)
  status: AssetStatus;
  imageUrl: string;
  totalRentalsCount: number;
}

export interface BookingRecord {
  id: string;
  bookingCode: string;
  renterId: string;          // Student ID (e.g. stu-demo-1)
  renterName: string;        // Student Full Name
  renterRegNumber: string;   // Student Reg/Matric Number
  renterDepartment: string;
  renterInstitution: string;
  assetId: string;
  assetCode: string;
  assetTitle: string;
  assetCategory: ItemCategory;
  assetImageUrl: string;
  ownershipType: OwnershipType;
  locationId: string;
  locationName: string;
  locationDirections: string;
  attendantName: string;
  attendantPhone: string;
  durationType: DurationType;
  durationLabel: string;
  rentalFee: number;
  totalPaid: number; // Strictly equals rentalFee (NO monetary deposit!)
  paymentReference: string;
  paymentVerifiedServerSide: boolean;
  bookingStatus: BookingStatus;
  businessOutcome: BusinessOutcome;
  failureReason?: string | null;
  handoverOtp: string;
  // Dual-Party Physical Collateral Verification (Student + Venue Person)
  collateralItemDescription: string | null;
  studentCollateralScreenshot: string | null;
  venueCollateralScreenshot: string | null;
  collateralSubmittedAt: string | null;
  venueVerifiedCollateralMatch: boolean;
  venueVerifiedAt: string | null;
  collateralPurgedOnReturn: boolean;
  collateralPurgedAt: string | null;
  handoverConditionNotes: string | null;
  handoverConfirmedAt: string | null;
  returnConditionNotes: string | null;
  returnConfirmedAt: string | null;
  createdAt: string;
  dueAt: string;
}

export interface UrgentCampusRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentDepartment: string;
  institution: string;
  category: ItemCategory;
  itemNeededDescription: string;
  campusBuildingOrHall: string;
  minutesUntilStart: number;
  offeredBudget: number;
  status: 'OPEN_URGENT' | 'MATCHED_STOCK_POINT' | 'MATCHED_PEER';
  matchedAssetId?: string;
  responderNote?: string;
  createdAt: string;
}

export interface PilotMetricsSummary {
  totalPaidBookings: number;
  activeRentalsCount: number;
  awaitingVenueVerifyCount: number;
  completedReturnsCount: number;
  failedBusinessCount: number;
  earnedRentalRevenue: number;
  activePhysicalCollateralsHeld: number;
  collateralPhotosPurgedCount: number;
}
