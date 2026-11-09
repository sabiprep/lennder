import React, { useState } from 'react';
import {
  ShieldCheck,
  MapPin,
  CheckCircle2,
  Trash2,
  QrCode,
  UserCheck,
  Package,
  RefreshCw,
  ArrowUpRight,
  Lock,
} from 'lucide-react';
import type {
  StudentProfile,
  StockLocation,
  RentalAsset,
  BookingRecord,
  PilotMetricsSummary,
} from '../types/lennder.ts';
import {
  adminUpdateStudentVerification,
  confirmReturnAndPurgeCollateral,
} from '../services/lennderApi.ts';

interface OperationsConsoleViewProps {
  students: StudentProfile[];
  locations: StockLocation[];
  assets: RentalAsset[];
  bookings: BookingRecord[];
  metrics: PilotMetricsSummary;
  onSelectBooking: (booking: BookingRecord) => void;
  onRefreshData: () => void;
}

export const OperationsConsoleView: React.FC<OperationsConsoleViewProps> = ({
  students,
  locations,
  assets,
  bookings,
  metrics,
  onSelectBooking,
  onRefreshData,
}) => {
  const [subTab, setSubTab] = useState<'HANDOVER_DESK' | 'STUDENT_VERIFICATIONS' | 'STOCK_POINTS'>(
    'HANDOVER_DESK'
  );
  const [otpFilter, setOtpFilter] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const filteredBookings = bookings.filter((b) => {
    if (!otpFilter.trim()) return true;
    const q = otpFilter.trim().toLowerCase();
    return (
      b.handoverOtp.toLowerCase().includes(q) ||
      b.bookingCode.toLowerCase().includes(q) ||
      b.renterName.toLowerCase().includes(q) ||
      b.renterRegNumber.toLowerCase().includes(q) ||
      b.assetCode.toLowerCase().includes(q)
    );
  });

  const handleVerifyStudent = async (
    studentId: string,
    status: 'VERIFIED' | 'PENDING_REVIEW'
  ) => {
    setBusyId(studentId);
    try {
      await adminUpdateStudentVerification(
        studentId,
        status,
        status === 'VERIFIED'
          ? 'Approved by Campus Attendant / Admin against institution ID register.'
          : 'Flagged for manual Student ID check.'
      );
      onRefreshData();
    } finally {
      setBusyId(null);
    }
  };

  const handleQuickReturnAndPurge = async (bookingId: string) => {
    setBusyId(bookingId);
    try {
      await confirmReturnAndPurgeCollateral(bookingId, {
        returnConditionNotes:
          'Inspected by Attendant at Stock Point. Collateral returned & screenshot deleted.',
        depositDeductionAmount: 0,
      });
      onRefreshData();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Unit Economics Ledger (BorrowBox PDF Section 6.1, 8, & 13) */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Stock Point &amp; Founder Operations Console
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Manage QR/OTP handovers, automatic collateral screenshot deletion on return, student ID approvals, and separated deposit accounting.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshData}
            className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center gap-2 self-start sm:self-auto whitespace-nowrap"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Sync Ledger</span>
          </button>
        </div>

        {/* 4-Column Financial & Operational Metrics Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Earned Rental Revenue
            </span>
            <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              ₦{metrics.earnedRentalRevenue.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Excludes refundable security deposits
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Held Deposit Liability
            </span>
            <p className="text-2xl font-mono font-bold text-amber-600 dark:text-amber-400 tabular-nums">
              ₦{metrics.heldRefundableDeposits.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {metrics.activeRentalsCount} active rentals · Refunded on return
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Deposits Refunded to Students
            </span>
            <p className="text-2xl font-mono font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
              ₦{metrics.refundedDepositsTotal.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Across {metrics.completedReturnsCount} completed returns
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-1">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Collateral Screenshots Purged
            </span>
            <p className="text-2xl font-mono font-bold text-slate-900 dark:text-white tabular-nums">
              {metrics.collateralPhotosPurgedCount} Purged
            </p>
            <p className="text-xs text-emerald-700 dark:text-emerald-400">
              Zero unnecessary storage retained
            </p>
          </div>
        </div>
      </div>

      {/* Sub-navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-xl bg-slate-200/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 w-fit">
        <button
          type="button"
          onClick={() => setSubTab('HANDOVER_DESK')}
          className={`px-4 py-2 min-h-[40px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            subTab === 'HANDOVER_DESK'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Handover, Collateral &amp; Return Desk ({bookings.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('STUDENT_VERIFICATIONS')}
          className={`px-4 py-2 min-h-[40px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            subTab === 'STUDENT_VERIFICATIONS'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Student ID &amp; Matric Registry ({students.length})
        </button>
        <button
          type="button"
          onClick={() => setSubTab('STOCK_POINTS')}
          className={`px-4 py-2 min-h-[40px] rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
            subTab === 'STOCK_POINTS'
              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
          }`}
        >
          Campus Stock Points ({locations.length})
        </button>
      </div>

      {/* ====================================================================
          TAB 1: HANDOVER, COLLATERAL & RETURN DESK
         ==================================================================== */}
      {subTab === 'HANDOVER_DESK' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <input
              type="text"
              value={otpFilter}
              onChange={(e) => setOtpFilter(e.target.value)}
              placeholder="Scan or enter 6-digit Handover OTP, Booking Code (e.g. LND-7821), or Matric Number..."
              className="w-full sm:max-w-md h-11 px-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Policy: Never release an item on a client screenshot. Always verify server status + OTP.
            </p>
          </div>

          <div className="space-y-3">
            {filteredBookings.map((bk) => (
              <div
                key={bk.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {bk.bookingCode}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>OTP: {bk.handoverOtp}</span>
                    <span aria-hidden="true">·</span>
                    <span>{bk.assetCode}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        bk.bookingStatus === 'RETURNED_COMPLETED'
                          ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                          : bk.bookingStatus === 'ACTIVE_RENTED'
                          ? 'text-amber-700 dark:text-amber-400 font-bold'
                          : 'text-sky-700 dark:text-sky-400 font-bold'
                      }
                    >
                      {bk.bookingStatus}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {bk.assetTitle}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Renter: <strong>{bk.renterName}</strong> ({bk.renterRegNumber} ·{' '}
                    {bk.renterDepartment}) · Stock Point: <strong>{bk.locationName}</strong>
                  </p>

                  <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">
                    {bk.bookingStatus === 'PAID_AWAITING_HANDOVER' && (
                      <span>
                        Awaiting student pickup &amp; collateral screenshot submission at counter.
                      </span>
                    )}
                    {bk.bookingStatus === 'ACTIVE_RENTED' && (
                      <span className="text-amber-700 dark:text-amber-400 font-medium">
                        Collateral Held: {bk.collateralItemDescription} (Screenshot stored until return)
                      </span>
                    )}
                    {bk.bookingStatus === 'RETURNED_COMPLETED' && (
                      <span className="text-emerald-700 dark:text-emerald-400 font-medium">
                        Collateral Returned &amp; Screenshot Deleted at{' '}
                        {bk.collateralPurgedAt
                          ? new Date(bk.collateralPurgedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Return'}{' '}
                        · Deposit Refunded: ₦{bk.depositRefundedAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Right Actions & Financial Summary */}
                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <div className="text-right font-mono pr-2">
                    <span className="block text-xs text-slate-500">Fee + Deposit</span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                      ₦{bk.rentalFee.toLocaleString()} + ₦{bk.securityDeposit.toLocaleString()}
                    </span>
                  </div>

                  {bk.bookingStatus === 'PAID_AWAITING_HANDOVER' && (
                    <button
                      type="button"
                      onClick={() => onSelectBooking(bk)}
                      className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap"
                    >
                      Verify OTP &amp; Record Collateral
                    </button>
                  )}

                  {bk.bookingStatus === 'ACTIVE_RENTED' && (
                    <button
                      type="button"
                      disabled={busyId === bk.id}
                      onClick={() => handleQuickReturnAndPurge(bk.id)}
                      className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 text-white transition-colors flex items-center gap-1.5 whitespace-nowrap"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>
                        {busyId === bk.id
                          ? 'Purging...'
                          : 'Confirm Return & Delete Collateral Screenshot'}
                      </span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectBooking(bk)}
                    className="px-3.5 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                  >
                    Inspect Record
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ====================================================================
          TAB 2: STUDENT ID & MATRIC VERIFICATION REGISTRY
         ==================================================================== */}
      {subTab === 'STUDENT_VERIFICATIONS' && (
        <div className="space-y-3">
          {students.map((stu) => (
            <div
              key={stu.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="font-bold text-slate-900 dark:text-white">{stu.regNumber}</span>
                  <span aria-hidden="true">·</span>
                  <span>{stu.institution}</span>
                  <span aria-hidden="true">·</span>
                  <span
                    className={
                      stu.verificationStatus === 'VERIFIED'
                        ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                        : 'text-amber-700 dark:text-amber-400 font-bold'
                    }
                  >
                    {stu.verificationStatus}
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {stu.fullName}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  {stu.faculty} · {stu.department} · {stu.level} · Phone: {stu.phone}
                </p>
                {stu.verificationNotes && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Audit Log ({stu.verifiedBy}): {stu.verificationNotes}
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {stu.verificationStatus !== 'VERIFIED' ? (
                  <button
                    type="button"
                    disabled={busyId === stu.id}
                    onClick={() => handleVerifyStudent(stu.id, 'VERIFIED')}
                    className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white transition-colors whitespace-nowrap"
                  >
                    Approve Student ID
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={busyId === stu.id}
                    onClick={() => handleVerifyStudent(stu.id, 'PENDING_REVIEW')}
                    className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                  >
                    Re-queue for Review
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ====================================================================
          TAB 3: CAMPUS STOCK POINTS & DIRECTIONS
         ==================================================================== */}
      {subTab === 'STOCK_POINTS' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <div className="flex items-center justify-between text-xs font-mono text-slate-500">
                <span>{loc.code}</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-bold">
                  {loc.walkingMinutesFromLabs} min walk to Labs
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{loc.name}</h3>
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300">
                {loc.institution}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                <strong>Directions:</strong> {loc.buildingDirections} ({loc.landmark})
              </p>
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 space-y-1">
                <p>
                  <strong>Attendant:</strong> {loc.attendantName}
                </p>
                <p>
                  <strong>Contact:</strong> <span className="font-mono">{loc.attendantPhone}</span>
                </p>
                <p>
                  <strong>Hours:</strong> {loc.operatingHours}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
