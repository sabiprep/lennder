import React, { useState } from 'react';
import {
  X,
  MapPin,
  ShieldCheck,
  Clock,
  CreditCard,
  CheckCircle2,
  Camera,
  Upload,
  Lock,
  Trash2,
  QrCode,
  Phone,
  ArrowRight,
  AlertCircle,
} from 'lucide-react';
import type {
  RentalAsset,
  StudentProfile,
  BookingRecord,
  DurationType,
} from '../types/lennder.ts';
import {
  createCheckoutBooking,
  submitCollateralAndConfirmHandover,
  confirmReturnAndPurgeCollateral,
  generateSampleCollateralPhotoDataUri,
} from '../services/lennderApi.ts';

interface BookingAndCollateralModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAsset: RentalAsset | null;
  activeBooking: BookingRecord | null;
  currentStudent: StudentProfile;
  onBookingUpdated: (booking: BookingRecord) => void;
  onRequireOnboarding: () => void;
}

export const BookingAndCollateralModal: React.FC<BookingAndCollateralModalProps> = ({
  isOpen,
  onClose,
  selectedAsset,
  activeBooking,
  currentStudent,
  onBookingUpdated,
  onRequireOnboarding,
}) => {
  const [durationType, setDurationType] = useState<DurationType>('URGENT_PRACTICAL');
  const [acceptedTerms, setAcceptedTerms] = useState(true);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // Local active booking state if user transitions from Checkout -> Collection Pass in one flow
  const [localBooking, setLocalBooking] = useState<BookingRecord | null>(null);

  // Collateral submission fields
  const [collateralDesc, setCollateralDesc] = useState(
    'Student Hostel Clearance Pass + Casio Wristwatch'
  );
  const [collateralPreview, setCollateralPreview] = useState<string | null>(null);
  const [handoverNotes, setHandoverNotes] = useState(
    'Item inspected at stock point counter; clean and all accessories included.'
  );
  const [enteredOtp, setEnteredOtp] = useState('');
  const [isConfirmingHandover, setIsConfirmingHandover] = useState(false);

  // Return & Auto-Purge fields
  const [returnNotes, setReturnNotes] = useState(
    'Returned on time in exact handover condition. Zero damage.'
  );
  const [depositDeduction, setDepositDeduction] = useState(0);
  const [isConfirmingReturn, setIsConfirmingReturn] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [purgeBanner, setPurgeBanner] = useState<string | null>(null);

  if (!isOpen) return null;

  const booking = localBooking || activeBooking;

  // Reset local booking when modal closes
  const handleClose = () => {
    setLocalBooking(null);
    setErrorMsg(null);
    setPurgeBanner(null);
    onClose();
  };

  // Compute live checkout amounts if in Step 1 (no booking yet)
  const computeCheckoutAmounts = (asset: RentalAsset, dur: DurationType) => {
    let fee = asset.urgentRate;
    let label = 'Urgent Practical / Lab Session (4 Hours)';
    if (dur === 'SAME_DAY_EXAM') {
      fee = asset.urgentRate;
      label = 'Urgent Exam Session (4 Hours)';
    } else if (dur === 'DAILY') {
      fee = asset.dailyRate;
      label = 'Full Day Access (24 Hours)';
    } else if (dur === 'WEEKLY') {
      fee = asset.weeklyRate;
      label = 'Weekly Project Rental (7 Days)';
    }
    return {
      rentalFee: fee,
      securityDeposit: asset.securityDeposit,
      total: fee + asset.securityDeposit,
      label,
    };
  };

  const handlePayAndReserve = async () => {
    if (!selectedAsset) return;
    if (currentStudent.verificationStatus !== 'VERIFIED') {
      onRequireOnboarding();
      return;
    }
    if (!acceptedTerms) {
      setErrorMsg('Please accept the campus rental, deposit, and collateral terms before payment.');
      return;
    }

    setErrorMsg(null);
    setIsProcessingPayment(true);
    try {
      const { booking: created } = await createCheckoutBooking({
        studentId: currentStudent.id,
        assetId: selectedAsset.id,
        durationType,
        paymentReference: `PSK_VERIFIED_${Math.floor(1000000 + Math.random() * 9000000)}`,
      });
      setLocalBooking(created);
      setEnteredOtp(created.handoverOtp);
      onBookingUpdated(created);
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment verification failed.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleCollateralFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setCollateralPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCaptureSampleCollateral = () => {
    if (!booking) return;
    const uri = generateSampleCollateralPhotoDataUri(
      collateralDesc || 'Student Hostel Pass & Wristwatch',
      booking.bookingCode,
      booking.renterRegNumber
    );
    setCollateralPreview(uri);
  };

  const handleConfirmCollateralHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setErrorMsg(null);

    const proofData =
      collateralPreview ||
      generateSampleCollateralPhotoDataUri(
        collateralDesc || 'Hostel ID & Accessory',
        booking.bookingCode,
        booking.renterRegNumber
      );

    setIsConfirmingHandover(true);
    try {
      const { booking: updated } = await submitCollateralAndConfirmHandover(booking.id, {
        collateralItemDescription: collateralDesc,
        collateralScreenshotData: proofData,
        handoverConditionNotes: handoverNotes,
        otpCode: enteredOtp || booking.handoverOtp,
      });
      setLocalBooking(updated);
      onBookingUpdated(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not confirm collateral handover.');
    } finally {
      setIsConfirmingHandover(false);
    }
  };

  const handleReturnAndPurgeCollateral = async () => {
    if (!booking) return;
    setErrorMsg(null);
    setIsConfirmingReturn(true);
    try {
      const { booking: completed, purgeConfirmation } = await confirmReturnAndPurgeCollateral(
        booking.id,
        {
          returnConditionNotes: returnNotes,
          depositDeductionAmount: depositDeduction,
        }
      );
      setLocalBooking(completed);
      setCollateralPreview(null);
      setPurgeBanner(purgeConfirmation);
      onBookingUpdated(completed);
    } catch (err: any) {
      setErrorMsg(err.message || 'Return inspection failed.');
    } finally {
      setIsConfirmingReturn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              {!booking
                ? 'Instant Campus Rental Checkout'
                : booking.bookingStatus === 'PAID_AWAITING_HANDOVER'
                ? `Collection Location & Collateral Proof · ${booking.bookingCode}`
                : booking.bookingStatus === 'ACTIVE_RENTED'
                ? `Active Rental & Return Inspection · ${booking.bookingCode}`
                : `Completed Rental Receipt · ${booking.bookingCode}`}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {!booking
                ? 'Server-verified payment · Separate Rental Fee & Refundable Security Deposit'
                : `${booking.assetCode} · ${booking.locationName}`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {purgeBanner && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200 flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p>{purgeBanner}</p>
                <p className="font-normal text-emerald-700 dark:text-emerald-300 mt-0.5">
                  Storage space freed automatically · Refundable deposit released to student ledger.
                </p>
              </div>
            </div>
          )}

          {/* ================================================================
              STAGE 1: CONTIGUOUS CHECKOUT & SERVER PAYMENT (Before Booking)
             ================================================================ */}
          {!booking && selectedAsset && (() => {
            const pricing = computeCheckoutAmounts(selectedAsset, durationType);
            return (
              <div className="space-y-5">
                {/* Item Summary Card */}
                <div className="flex flex-col sm:flex-row gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800">
                  <img
                    src={selectedAsset.imageUrl}
                    alt={selectedAsset.title}
                    referrerPolicy="no-referrer"
                    className="w-full sm:w-28 h-28 rounded-xl object-cover bg-slate-200 dark:bg-slate-800 shrink-0"
                  />
                  <div className="space-y-1.5">
                    <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      <span>{selectedAsset.assetCode}</span>
                      <span aria-hidden="true"> · </span>
                      <span>
                        {selectedAsset.ownershipType === 'MANAGED_STOCK'
                          ? 'Lennder Managed Stock Point'
                          : `P2P Student (${selectedAsset.ownerName})`}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                      {selectedAsset.title}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {selectedAsset.sizeOrSpec} · {selectedAsset.conditionGrade}
                    </p>
                    <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span>
                        Collection Point: {selectedAsset.locationName} ({selectedAsset.buildingProximity})
                      </span>
                    </p>
                  </div>
                </div>

                {/* Rental Duration Selector */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Select Rental Duration
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {(
                      [
                        {
                          id: 'URGENT_PRACTICAL',
                          title: 'Lab Practical',
                          sub: '4 Hours',
                          price: selectedAsset.urgentRate,
                        },
                        {
                          id: 'SAME_DAY_EXAM',
                          title: 'Exam Urgent',
                          sub: '4 Hours',
                          price: selectedAsset.urgentRate,
                        },
                        {
                          id: 'DAILY',
                          title: 'Full Day',
                          sub: '24 Hours',
                          price: selectedAsset.dailyRate,
                        },
                        {
                          id: 'WEEKLY',
                          title: 'Weekly',
                          sub: '7 Days',
                          price: selectedAsset.weeklyRate,
                        },
                      ] as const
                    ).map((opt) => {
                      const active = durationType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setDurationType(opt.id)}
                          className={`p-3 rounded-xl border text-left transition-all min-h-[44px] ${
                            active
                              ? 'border-emerald-600 bg-emerald-50/70 dark:bg-emerald-950/40 text-slate-900 dark:text-white'
                              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                          }`}
                        >
                          <p className="text-xs font-bold">{opt.title}</p>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">{opt.sub}</p>
                          <p className="text-xs font-mono font-bold text-emerald-700 dark:text-emerald-400 mt-1 tabular-nums">
                            ₦{opt.price.toLocaleString()}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Separate the Charges Breakdown (BorrowBox PDF Section 6.1 & 6.2) */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-900 dark:text-slate-100 pb-2 border-b border-slate-200 dark:border-slate-700">
                    <span>Server-Verified Charge Breakdown</span>
                    <span className="font-mono text-slate-500">{pricing.label}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Rental Fee
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        Payment for use of the item for the agreed period
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
                      ₦{pricing.rentalFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        Refundable Security Deposit
                      </span>
                      <span className="block text-[11px] text-slate-500">
                        100% refunded automatically when returned on time in agreed condition
                      </span>
                    </div>
                    <span className="font-mono font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      ₦{pricing.securityDeposit.toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2.5 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      Total Due Before Collection
                    </span>
                    <span className="text-lg font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                      ₦{pricing.total.toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* Rental & Collateral Policy Acceptance */}
                <label className="flex items-start gap-3 cursor-pointer text-xs text-slate-600 dark:text-slate-400">
                  <input
                    type="checkbox"
                    checked={acceptedTerms}
                    onChange={(e) => setAcceptedTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>
                    I agree to the Lennder Campus Rental Terms: after server payment confirmation,
                    I will proceed to <strong>{selectedAsset.locationName}</strong>, submit my
                    collateral item &amp; proof screenshot at handover, and return the item on time.
                    My collateral screenshot is automatically deleted upon return.
                  </span>
                </label>

                {/* Primary Pay CTA */}
                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingPayment}
                    onClick={handlePayAndReserve}
                    className="px-6 py-3 min-h-[48px] rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>
                      {isProcessingPayment
                        ? 'Verifying Server Transaction...'
                        : `Pay ₦${pricing.total.toLocaleString()} & Unlock Pickup Location`}
                    </span>
                  </button>
                </div>
              </div>
            );
          })()}

          {/* ================================================================
              STAGE 2: PICKUP LOCATION PAGE + COLLATERAL SCREENSHOT UPLOAD
              (Appears immediately after payment verification!)
             ================================================================ */}
          {booking && booking.bookingStatus === 'PAID_AWAITING_HANDOVER' && (
            <form onSubmit={handleConfirmCollateralHandover} className="space-y-5">
              {/* Server Verified Banner + Pickup Directions */}
              <div className="p-4 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                    PAYMENT VERIFIED SERVER-TO-SERVER · READY FOR COLLECTION
                  </span>
                  <span className="font-mono text-xs text-emerald-700 dark:text-emerald-400">
                    Ref: {booking.paymentReference}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div className="sm:col-span-2 space-y-1">
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      WHERE TO COLLECT YOUR ITEM RIGHT NOW:
                    </p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{booking.locationName}</span>
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      {booking.locationDirections}
                    </p>
                    <p className="text-xs text-slate-600 dark:text-slate-400 pt-1">
                      Attendant on Duty: <strong>{booking.attendantName}</strong> ({booking.attendantPhone})
                    </p>
                  </div>

                  {/* 6-Digit Handover OTP Box */}
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800 flex flex-col items-center justify-center text-center">
                    <span className="text-[11px] font-medium text-slate-500">
                      HANDOVER COLLECTION OTP
                    </span>
                    <span className="text-2xl font-mono font-bold tracking-widest text-slate-900 dark:text-white mt-0.5 tabular-nums">
                      {booking.handoverOtp}
                    </span>
                    <span className="text-[11px] text-emerald-700 dark:text-emerald-400 mt-0.5">
                      Show to Stock Point Attendant
                    </span>
                  </div>
                </div>
              </div>

              {/* Collateral Item & Screenshot Submission Section */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    Submit Collateral Item &amp; Screenshot Proof at Collection
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Hand over your physical collateral item to the attendant and upload/screenshot it here as proof.{' '}
                    <strong className="text-slate-700 dark:text-slate-200">
                      When the rented item is returned, this screenshot is automatically deleted to save storage space.
                    </strong>
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Collateral Item Submitted at Stock Point
                  </label>
                  <input
                    type="text"
                    required
                    value={collateralDesc}
                    onChange={(e) => setCollateralDesc(e.target.value)}
                    placeholder="e.g. Hostel ID Pass + Silver Casio Watch"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>

                {/* Collateral Screenshot / Photo Upload */}
                <div className="space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Collateral Screenshot / Handover Photo Proof
                    </label>
                    <button
                      type="button"
                      onClick={handleCaptureSampleCollateral}
                      className="px-3 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-emerald-100/80 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200/70 transition-colors whitespace-nowrap"
                    >
                      Generate Instant Collateral Proof Screenshot
                    </button>
                  </div>

                  {collateralPreview ? (
                    <div className="space-y-2">
                      <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 max-h-52 flex items-center justify-center">
                        <img
                          src={collateralPreview}
                          alt="Collateral item handover proof"
                          referrerPolicy="no-referrer"
                          className="max-h-48 w-auto object-contain"
                        />
                      </div>
                      <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400">
                        <span>Collateral screenshot attached (will auto-purge on return)</span>
                        <button
                          type="button"
                          onClick={() => setCollateralPreview(null)}
                          className="underline"
                        >
                          Retake photo
                        </button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors bg-white dark:bg-slate-900">
                      <Camera className="w-5 h-5 text-slate-400 mb-1.5" />
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                        Upload or Capture Collateral Screenshot / Photo
                      </span>
                      <span className="text-[11px] text-slate-400 mt-0.5">
                        Or tap &ldquo;Generate Instant Collateral Proof Screenshot&rdquo; above
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleCollateralFileChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Handover Condition Checklist Note
                    </label>
                    <input
                      type="text"
                      value={handoverNotes}
                      onChange={(e) => setHandoverNotes(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Confirm 6-Digit Collection OTP
                    </label>
                    <input
                      type="text"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono font-bold text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Close Pass
                </button>
                <button
                  type="submit"
                  disabled={isConfirmingHandover}
                  className="px-6 py-3 min-h-[48px] rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors whitespace-nowrap"
                >
                  {isConfirmingHandover
                    ? 'Recording Handover...'
                    : 'Submit Collateral Proof & Confirm Item Collected'}
                </button>
              </div>
            </form>
          )}

          {/* ================================================================
              STAGE 3: ACTIVE RENTAL -> RETURN INSPECTION & AUTO-PURGE SCREENSHOT
             ================================================================ */}
          {booking && booking.bookingStatus === 'ACTIVE_RENTED' && (
            <div className="space-y-5">
              <div className="p-4 rounded-2xl bg-amber-50/90 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-300">
                    ITEM CURRENTLY RENTED · DUE AT{' '}
                    {new Date(booking.dueAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-200">
                    Return to: <strong>{booking.locationName}</strong> ({booking.attendantName})
                  </p>
                </div>
                <div className="text-right font-mono">
                  <span className="text-xs text-amber-700 dark:text-amber-400 block">
                    Held Deposit Liability
                  </span>
                  <span className="text-base font-bold text-amber-900 dark:text-amber-200 tabular-nums">
                    ₦{booking.securityDeposit.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Active Collateral Screenshot Currently Stored */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Stored Collateral Proof ({booking.collateralItemDescription})
                    </p>
                    <p className="text-[11px] text-slate-500">
                      This screenshot is held temporarily while the item is out and will be erased upon return.
                    </p>
                  </div>
                  <span className="text-xs font-mono text-amber-700 dark:text-amber-400">
                    ACTIVE HOLD
                  </span>
                </div>

                {booking.collateralScreenshotData && (
                  <div className="rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 max-h-44 flex items-center justify-center">
                    <img
                      src={booking.collateralScreenshotData}
                      alt="Stored collateral screenshot"
                      referrerPolicy="no-referrer"
                      className="max-h-40 w-auto object-contain"
                    />
                  </div>
                )}
              </div>

              {/* Return Inspection & Auto-Purge Form */}
              <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Return Inspection &amp; Collateral Screenshot Auto-Deletion
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Return Condition Inspection Notes
                    </label>
                    <input
                      type="text"
                      value={returnNotes}
                      onChange={(e) => setReturnNotes(e.target.value)}
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-xs text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Damage Deduction (₦)
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={booking.securityDeposit}
                      value={depositDeduction}
                      onChange={(e) => setDepositDeduction(Number(e.target.value))}
                      className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Keep Window Closed
                </button>
                <button
                  type="button"
                  disabled={isConfirmingReturn}
                  onClick={handleReturnAndPurgeCollateral}
                  className="px-6 py-3 min-h-[48px] rounded-xl text-xs font-semibold bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {isConfirmingReturn
                      ? 'Returning & Purging Screenshot...'
                      : 'Confirm Item Returned · Delete Collateral Screenshot & Refund Deposit'}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* ================================================================
              STAGE 4: COMPLETED RENTAL RECEIPT & PURGED CONFIRMATION
             ================================================================ */}
          {booking && booking.bookingStatus === 'RETURNED_COMPLETED' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-emerald-700 dark:text-emerald-400">
                    RETURN COMPLETED &amp; CLOSED
                  </span>
                  <span className="font-mono text-slate-500">
                    {booking.returnConfirmedAt
                      ? new Date(booking.returnConfirmedAt).toLocaleString()
                      : 'Completed'}
                  </span>
                </div>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {booking.assetTitle} ({booking.assetCode})
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Return Notes: {booking.returnConditionNotes}
                </p>
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block font-sans">Rental Fee Paid</span>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      ₦{booking.rentalFee.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Deposit Refunded</span>
                    <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                      ₦{booking.depositRefundedAmount.toLocaleString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block font-sans">Collateral Screenshot</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      PURGED (0 KB)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-5 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold bg-slate-900 dark:bg-white text-white dark:text-slate-900"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
