import React, { useState } from 'react';
import {
  X,
  MapPin,
  CreditCard,
  CheckCircle2,
  Camera,
  Trash2,
} from 'lucide-react';
import type {
  RentalAsset,
  StudentProfile,
  BookingRecord,
  DurationType,
} from '../types/lennder.ts';
import {
  createCheckoutBooking,
  uploadStudentCollateralAtVenue,
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
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const [localBooking, setLocalBooking] = useState<BookingRecord | null>(null);

  const [collateralDesc, setCollateralDesc] = useState(
    'Hostel Clearance Pass + Casio Wristwatch'
  );
  const [studentScreenshotPreview, setStudentScreenshotPreview] = useState<string | null>(null);

  const [isUploadingStudentCollateral, setIsUploadingStudentCollateral] = useState(false);
  const [isConfirmingReturn, setIsConfirmingReturn] = useState(false);

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [purgeBanner, setPurgeBanner] = useState<string | null>(null);

  if (!isOpen) return null;

  const booking = localBooking || activeBooking;

  const handleClose = () => {
    setLocalBooking(null);
    setErrorMsg(null);
    setPurgeBanner(null);
    onClose();
  };

  const computeCheckoutAmounts = (asset: RentalAsset, dur: DurationType) => {
    let fee = asset.urgentRate;
    let label = 'Urgent Practical (4h)';
    if (dur === 'SAME_DAY_EXAM') {
      fee = asset.urgentRate;
      label = 'Urgent Exam (4h)';
    } else if (dur === 'DAILY') {
      fee = asset.dailyRate;
      label = '24 Hours';
    } else if (dur === 'WEEKLY') {
      fee = asset.weeklyRate;
      label = '7 Days';
    }
    return {
      rentalFee: fee,
      total: fee,
      label,
    };
  };

  const handlePayAndReserve = async () => {
    if (!selectedAsset) return;
    if (currentStudent.verificationStatus !== 'VERIFIED') {
      onRequireOnboarding();
      return;
    }

    setErrorMsg(null);
    setIsProcessingPayment(true);
    try {
      const { booking: created } = await createCheckoutBooking({
        studentId: currentStudent.id,
        assetId: selectedAsset.id,
        durationType,
        paymentReference: `PSK_${Math.floor(100000 + Math.random() * 900000)}`,
      });
      setLocalBooking(created);
      onBookingUpdated(created);
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment failed.');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handleStudentFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setStudentScreenshotPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCaptureSampleStudentCollateral = () => {
    if (!booking) return;
    const uri = generateSampleCollateralPhotoDataUri(
      collateralDesc || 'Hostel Pass & Wristwatch',
      booking.bookingCode,
      booking.renterRegNumber,
      'STUDENT'
    );
    setStudentScreenshotPreview(uri);
  };

  // Student is at the venue -> Snaps their physical collateral on their phone & uploads it instantly
  const handleStudentUploadCollateral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!booking) return;
    setErrorMsg(null);

    const proofData =
      studentScreenshotPreview ||
      generateSampleCollateralPhotoDataUri(
        collateralDesc || 'Hostel ID & Watch',
        booking.bookingCode,
        booking.renterRegNumber,
        'STUDENT'
      );

    setIsUploadingStudentCollateral(true);
    try {
      const { booking: updated } = await uploadStudentCollateralAtVenue(booking.id, {
        collateralItemDescription: collateralDesc,
        studentCollateralScreenshot: proofData,
      });
      setLocalBooking(updated);
      onBookingUpdated(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Could not upload collateral screenshot.');
    } finally {
      setIsUploadingStudentCollateral(false);
    }
  };

  // Student returns the rented item, shows their exact screenshot at the venue, collects their collateral back, and screenshot is removed
  const handleReturnAndPurgeCollateral = async () => {
    if (!booking) return;
    setErrorMsg(null);
    setIsConfirmingReturn(true);
    try {
      const { booking: completed, purgeConfirmation } = await confirmReturnAndPurgeCollateral(
        booking.id,
        {
          returnConditionNotes:
            'Student showed exact collateral screenshot at venue, returned rented item, and collected physical collateral back. Screenshot deleted.',
        }
      );
      setLocalBooking(completed);
      setStudentScreenshotPreview(null);
      setPurgeBanner(purgeConfirmation);
      onBookingUpdated(completed);
    } catch (err: any) {
      setErrorMsg(err.message || 'Return failed.');
    } finally {
      setIsConfirmingReturn(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
          <div>
            <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
              {!booking
                ? 'Instant Rental Payment'
                : booking.bookingStatus === 'PAID_AWAITING_HANDOVER'
                ? 'Venue Location Revealed · Snap & Upload Collateral at Venue'
                : booking.bookingStatus === 'ACTIVE_RENTED' ||
                  booking.bookingStatus === 'COLLATERAL_UPLOADED_AWAITING_VENUE'
                ? 'Your Collateral Screenshot Pass (Show When Returning)'
                : 'Completed Return · Collateral Collected & Screenshot Deleted'}
            </h2>
            <p className="text-xs font-mono text-zinc-500">
              {!booking ? selectedAsset?.assetCode : `${booking.bookingCode} · ${booking.assetCode}`}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 overflow-y-auto">
          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {purgeBanner && (
            <div className="p-4 rounded-2xl bg-[#84CC16]/15 border border-[#84CC16] text-xs font-semibold text-zinc-900 dark:text-white flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-[#4D7C0F] dark:text-[#A3E635] shrink-0 mt-0.5" />
              <div>
                <p>{purgeBanner}</p>
              </div>
            </div>
          )}

          {/* ================================================================
              STAGE 1: INSTANT RENTAL FEE CHECKOUT (BEFORE LOCATION IS REVEALED)
             ================================================================ */}
          {!booking && selectedAsset && (() => {
            const pricing = computeCheckoutAmounts(selectedAsset, durationType);
            return (
              <div className="space-y-5">
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-800">
                  <img
                    src={selectedAsset.imageUrl}
                    alt={selectedAsset.title}
                    referrerPolicy="no-referrer"
                    className="w-20 h-20 rounded-xl object-cover bg-zinc-200 shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                      {selectedAsset.title}
                    </h3>
                    <p className="text-xs text-zinc-500 mt-0.5">{selectedAsset.sizeOrSpec}</p>
                    <p className="text-xs font-semibold text-[#4D7C0F] dark:text-[#A3E635] mt-1 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate">
                        Exact Pickup Venue Revealed Immediately After Payment
                      </span>
                    </p>
                  </div>
                </div>

                {/* Duration Buttons */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-2">
                    Select Rental Duration
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(
                      [
                        { id: 'URGENT_PRACTICAL', title: 'Practical (4h)', price: selectedAsset.urgentRate },
                        { id: 'SAME_DAY_EXAM', title: 'Exam (4h)', price: selectedAsset.urgentRate },
                        { id: 'DAILY', title: 'Daily (24h)', price: selectedAsset.dailyRate },
                        { id: 'WEEKLY', title: 'Weekly (7d)', price: selectedAsset.weeklyRate },
                      ] as const
                    ).map((opt) => {
                      const active = durationType === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setDurationType(opt.id)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            active
                              ? 'border-[#84CC16] bg-[#84CC16]/15 text-zinc-900 dark:text-white font-bold'
                              : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                          }`}
                        >
                          <p className="text-xs">{opt.title}</p>
                          <p className="text-xs font-mono font-bold text-[#4D7C0F] dark:text-[#A3E635] mt-1 tabular-nums">
                            ₦{opt.price.toLocaleString()}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Pure Rental Fee Summary */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-2.5 text-sm">
                  <div className="flex justify-between font-bold text-base">
                    <span>Instant Rental Fee ({pricing.label})</span>
                    <span className="font-mono text-[#4D7C0F] dark:text-[#A3E635] tabular-nums">
                      ₦{pricing.rentalFee.toLocaleString()}
                    </span>
                  </div>
                  <div className="pt-2 border-t border-zinc-200 dark:border-zinc-700 text-xs text-zinc-600 dark:text-zinc-300 space-y-1">
                    <p className="font-bold text-zinc-900 dark:text-white">
                      How Venue Pickup &amp; Collateral Works:
                    </p>
                    <p>
                      1. Pay <strong>₦{pricing.rentalFee.toLocaleString()}</strong> now to unlock the exact pickup venue location.
                    </p>
                    <p>
                      2. When you arrive at the venue, hand over your physical collateral item, snap it on your phone, and upload it on the next screen while the venue person sees it and snaps their own verification copy on their device.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  disabled={isProcessingPayment}
                  onClick={handlePayAndReserve}
                  className="w-full h-12 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>
                    {isProcessingPayment
                      ? 'Processing Payment...'
                      : `Pay ₦${pricing.total.toLocaleString()} & Reveal Pickup Venue`}
                  </span>
                </button>
              </div>
            );
          })()}

          {/* ================================================================
              STAGE 2: PAYMENT DONE -> VENUE LOCATION REVEALED -> STUDENT SNAPS & UPLOADS COLLATERAL AT VENUE
             ================================================================ */}
          {booking && booking.bookingStatus === 'PAID_AWAITING_HANDOVER' && (
            <form onSubmit={handleStudentUploadCollateral} className="space-y-5">
              {/* Revealed Venue Location Card */}
              <div className="p-4 rounded-2xl bg-[#84CC16]/15 border border-[#84CC16] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#3F6212] dark:text-[#BEF264]">
                    PAYMENT CONFIRMED (₦{booking.rentalFee.toLocaleString()}) · VENUE REVEALED
                  </span>
                  <span className="text-xs font-mono font-bold text-zinc-900 dark:text-white">
                    PASS: {booking.bookingCode}
                  </span>
                </div>
                <p className="text-base font-extrabold text-zinc-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#4D7C0F] shrink-0" />
                  <span>{booking.locationName}</span>
                </p>
                <p className="text-xs text-zinc-700 dark:text-zinc-300">
                  {booking.locationDirections}
                </p>
                <p className="text-xs text-zinc-600 dark:text-zinc-400">
                  Venue Person: <strong>{booking.attendantName}</strong> ({booking.attendantPhone})
                </p>
              </div>

              {/* Student Collateral Upload (Only When Student Arrives at the Venue) */}
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <label className="text-xs font-bold text-zinc-900 dark:text-white block">
                      At the Venue Now? Snap &amp; Upload Your Physical Collateral
                    </label>
                    <p className="text-[11px] text-zinc-500">
                      Snap the collateral you are dropping so it appears instantly on your page and for the venue person.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCaptureSampleStudentCollateral}
                    className="px-3 py-1.5 rounded-lg bg-[#84CC16]/25 text-[#3F6212] dark:text-[#BEF264] text-xs font-bold shrink-0"
                  >
                    Snap Sample Photo
                  </button>
                </div>

                <input
                  type="text"
                  required
                  value={collateralDesc}
                  onChange={(e) => setCollateralDesc(e.target.value)}
                  placeholder="What collateral item are you dropping? (e.g. Hostel Pass + Watch)"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
                />

                {studentScreenshotPreview ? (
                  <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-900 max-h-48 flex items-center justify-center">
                    <img
                      src={studentScreenshotPreview}
                      alt="Your Collateral Screenshot"
                      referrerPolicy="no-referrer"
                      className="max-h-44 w-auto object-contain"
                    />
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-[#84CC16] bg-white dark:bg-zinc-900">
                    <Camera className="w-5 h-5 text-zinc-400 mb-1" />
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 text-center">
                      Tap to Snap &amp; Upload Collateral Screenshot on Your Phone
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleStudentFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={isUploadingStudentCollateral}
                className="w-full h-12 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white font-bold text-sm transition-colors"
              >
                {isUploadingStudentCollateral
                  ? 'Uploading Collateral Screenshot...'
                  : 'Upload My Collateral Screenshot & Collect Rented Item'}
              </button>
            </form>
          )}

          {/* ================================================================
              STAGE 3: STUDENT'S UPLOADED COLLATERAL SCREENSHOT PASS (SHOWN WHEN RETURNING)
             ================================================================ */}
          {booking &&
            (booking.bookingStatus === 'ACTIVE_RENTED' ||
              booking.bookingStatus === 'COLLATERAL_UPLOADED_AWAITING_VENUE') && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-[#84CC16]/15 border border-[#84CC16] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-[#3F6212] dark:text-[#BEF264]">
                      OFFICIAL STUDENT COLLATERAL PASS · SHOW AT VENUE ON RETURN
                    </span>
                    <span className="font-mono font-bold text-zinc-900 dark:text-white">
                      {booking.bookingCode}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300">
                    When returning <strong>{booking.assetTitle}</strong> to{' '}
                    <strong>{booking.locationName}</strong>, show this exact collateral screenshot on your phone to <strong>{booking.attendantName}</strong>. They will match it with the photo on their own device and hand back your collateral.
                  </p>
                </div>

                {/* ONLY the Student's Uploaded Collateral Screenshot is shown on the Student's Phone */}
                <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-zinc-900 dark:text-white">
                      Your Uploaded Collateral: {booking.collateralItemDescription}
                    </span>
                    <span className="font-mono text-zinc-500">
                      Due:{' '}
                      {new Date(booking.dueAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {booking.studentCollateralScreenshot && (
                    <div className="rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 bg-zinc-900 max-h-56 flex items-center justify-center">
                      <img
                        src={booking.studentCollateralScreenshot}
                        alt="Student Uploaded Collateral Screenshot"
                        referrerPolicy="no-referrer"
                        className="max-h-52 w-auto object-contain"
                      />
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  disabled={isConfirmingReturn}
                  onClick={handleReturnAndPurgeCollateral}
                  className="w-full h-12 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>
                    {isConfirmingReturn
                      ? 'Confirming Return & Removing Screenshot...'
                      : 'I Have Returned Item & Collected My Collateral (Remove Screenshot)'}
                  </span>
                </button>
              </div>
            )}

          {/* ================================================================
              STAGE 4: COMPLETED -> PHYSICAL COLLATERAL RETURNED & SCREENSHOT DELETED
             ================================================================ */}
          {booking && booking.bookingStatus === 'RETURNED_COMPLETED' && (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                <p className="font-bold text-[#4D7C0F] dark:text-[#A3E635]">
                  ITEM RETURNED · PHYSICAL COLLATERAL COLLECTED · SCREENSHOT REMOVED
                </p>
                <p className="text-sm font-bold text-zinc-900 dark:text-white">
                  {booking.assetTitle}
                </p>
                <p className="text-zinc-600 dark:text-zinc-400">
                  Collateral Returned to You:{' '}
                  <strong>{booking.collateralItemDescription}</strong>
                </p>
                <p className="text-zinc-500 font-mono">
                  Rent Paid: ₦{booking.rentalFee.toLocaleString()} · Collateral Screenshot Purged (0 KB)
                </p>
              </div>
              <button
                type="button"
                onClick={handleClose}
                className="w-full h-11 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 text-xs font-semibold"
              >
                Close
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
