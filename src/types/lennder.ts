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
  | 'ACTIVE_RENTED'
  | 'RETURNED_COMPLETED'
  | 'DISPUTED';

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
  verificationStatus: VerificationStatus;
  verifiedBy?: string;
  verificationNotes?: string;
  role: 'student' | 'attendant' | 'admin';
  createdAt: string;
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
  urgentRate: number;      // e.g. 3-hour practical/exam rate in NGN
  dailyRate: number;       // 24-hour rate in NGN
  weeklyRate: number;      // 7-day rate in NGN
  securityDeposit: number; // Refundable deposit liability in NGN
  status: AssetStatus;
  imageUrl: string;
  totalRentalsCount: number;
}

export interface BookingRecord {
  id: string;
  bookingCode: string;
  renterId: string;
  renterName: string;
  renterRegNumber: string;
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
  securityDeposit: number;
  totalPaid: number;
  paymentReference: string;
  paymentVerifiedServerSide: boolean;
  bookingStatus: BookingStatus;
  handoverOtp: string;
  // Collateral & Handover tracking (with auto-purge on return)
  collateralItemDescription: string | null;
  collateralScreenshotData: string | null;
  collateralSubmittedAt: string | null;
  collateralPurgedOnReturn: boolean;
  collateralPurgedAt: string | null;
  handoverConditionNotes: string | null;
  handoverConfirmedAt: string | null;
  returnConditionNotes: string | null;
  returnConfirmedAt: string | null;
  depositDeductionAmount: number;
  depositRefundedAmount: number;
  depositRefundStatus: 'HELD_IN_LIABILITY' | 'REFUNDED_IN_FULL' | 'PARTIAL_REFUND';
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
  completedReturnsCount: number;
  earnedRentalRevenue: number;
  heldRefundableDeposits: number;
  refundedDepositsTotal: number;
  collateralPhotosPurgedCount: number;
  utilizationRatePercent: number;
}
