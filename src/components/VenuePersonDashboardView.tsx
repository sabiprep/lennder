import React, { useState } from 'react';
import {
  Camera,
  CheckCircle2,
  XCircle,
  LogOut,
  Trash2,
  Users,
  Clock,
  History,
  X,
  Search,
} from 'lucide-react';
import type {
  VenuePersonAccount,
  BookingRecord,
} from '../types/lennder.ts';
import {
  venuePersonSaveVerificationCopy,
  confirmReturnAndPurgeCollateral,
  markBookingAsFailedBusiness,
  generateSampleCollateralPhotoDataUri,
} from '../services/lennderApi.ts';

interface VenuePersonDashboardViewProps {
  venuePerson: VenuePersonAccount;
  bookings: BookingRecord[];
  onRefreshData: () => void;
  onSignOut: () => void;
}

type VenueDirectoryTab = 'PAID_USERS' | 'ACTIVE_RENTALS' | 'HISTORY_DIRECTORY';

export const VenuePersonDashboardView: React.FC<VenuePersonDashboardViewProps> = ({
  venuePerson,
  bookings,
  onRefreshData,
  onSignOut,
}) => {
  // 3 Clean Directories inside the Venue Person Dashboard
  const [activeDirectory, setActiveDirectory] = useState<VenueDirectoryTab>('PAID_USERS');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'SUCCESSFUL' | 'FAILED'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal state when Venue Person taps "Upload Collateral" on a Paid User
  const [uploadingForBooking, setUploadingForBooking] = useState<BookingRecord | null>(null);
  const [collateralName, setCollateralName] = useState('Hostel Pass + Wristwatch');
  const [collateralPhotoPreview, setCollateralPhotoPreview] = useState<string | null>(null);
  const [isSavingCollateral, setIsSavingCollateral] = useState(false);

  const [busyBookingId, setBusyBookingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filteredBySearch = bookings.filter((b) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      b.renterName.toLowerCase().includes(q) ||
      b.renterRegNumber.toLowerCase().includes(q) ||
      b.renterId.toLowerCase().includes(q) ||
      b.bookingCode.toLowerCase().includes(q) ||
      b.assetTitle.toLowerCase().includes(q)
    );
  });

  // 1. Current Users Who Just Made Payment (Waiting for Venue Person to Upload Collateral)
  const paidUsersList = filteredBySearch.filter(
    (b) =>
      b.bookingStatus === 'PAID_AWAITING_HANDOVER' ||
      (b.bookingStatus === 'ACTIVE_RENTED' && !b.venueCollateralScreenshot)
  );

  // 2. Active Rentals Out with Item (Collateral Uploaded -> Waiting for Student to Return Item)
  const activeRentalsList = filteredBySearch.filter(
    (b) => b.bookingStatus === 'ACTIVE_RENTED' && Boolean(b.venueCollateralScreenshot)
  );

  // 3. History Directory (Completed Successful & Failed Business)
  const historyList = filteredBySearch.filter((b) => {
    const isHistory = b.businessOutcome === 'SUCCESSFUL' || b.businessOutcome === 'FAILED';
    if (!isHistory) return false;
    if (historyFilter !== 'ALL' && b.businessOutcome !== historyFilter) return false;
    return true;
  });

  const openUploadCollateralModal = (bk: BookingRecord) => {
    setUploadingForBooking(bk);
    setCollateralName(bk.collateralItemDescription || 'Hostel Clearance Pass + Watch');
    setCollateralPhotoPreview(bk.venueCollateralScreenshot || null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setCollateralPhotoPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSnapInstantPhoto = () => {
    if (!uploadingForBooking) return;
    const sample = generateSampleCollateralPhotoDataUri(
      collateralName || 'Hostel Pass + Watch',
      uploadingForBooking.bookingCode,
      uploadingForBooking.renterRegNumber,
      'VENUE_ATTENDANT'
    );
    setCollateralPhotoPreview(sample);
  };

  const handleConfirmCollateralUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadingForBooking) return;
    setIsSavingCollateral(true);
    try {
      const photoToSave =
        collateralPhotoPreview ||
        generateSampleCollateralPhotoDataUri(
          collateralName || 'Hostel Pass + Watch',
          uploadingForBooking.bookingCode,
          uploadingForBooking.renterRegNumber,
          'VENUE_ATTENDANT'
        );

      await venuePersonSaveVerificationCopy(uploadingForBooking.id, {
        collateralItemDescription: collateralName,
        venueCollateralScreenshot: photoToSave,
        handoverConditionNotes: `Snapped & uploaded at venue by ${venuePerson.fullName}.`,
      });

      setUploadingForBooking(null);
      setCollateralPhotoPreview(null);
      setToastMessage(
        `Collateral uploaded for ${uploadingForBooking.renterName} (${uploadingForBooking.renterRegNumber}). Item handed over!`
      );
      onRefreshData();
      setActiveDirectory('ACTIVE_RENTALS');
    } finally {
      setIsSavingCollateral(false);
    }
  };

  const handleConfirmReturn = async (bk: BookingRecord) => {
    setBusyBookingId(bk.id);
    try {
      await confirmReturnAndPurgeCollateral(bk.id, {
        returnConditionNotes: `Returned to ${venuePerson.fullName}. Collateral handed back & screenshot deleted.`,
      });
      setToastMessage(
        `${bk.renterName} returned ${bk.assetTitle}. Collateral returned & recorded in History as SUCCESSFUL.`
      );
      onRefreshData();
    } finally {
      setBusyBookingId(null);
    }
  };

  const handleRecordFailed = async (bk: BookingRecord) => {
    setBusyBookingId(bk.id);
    try {
      await markBookingAsFailedBusiness(
        bk.id,
        `Cancelled at venue by ${venuePerson.fullName} (No valid collateral provided).`
      );
      setToastMessage(`Recorded ${bk.bookingCode} in History Directory as FAILED.`);
      onRefreshData();
    } finally {
      setBusyBookingId(null);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBF7] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-20 lg:pb-12">
      {/* ====================================================================
          TOP HEADER BAR (Clean 3-Zone Standard)
         ==================================================================== */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-8 h-16 flex items-center justify-between gap-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#84CC16] flex items-center justify-center text-zinc-950 font-extrabold text-sm">
            VP
          </div>
          <div>
            <span className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white font-display">
              lennder · Venue Desk
            </span>
            <p className="text-[11px] text-zinc-500 hidden sm:block">
              {venuePerson.assignedLocationName} · {venuePerson.fullName}
            </p>
          </div>
        </div>

        {/* Desktop Directory Links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <button
            type="button"
            onClick={() => setActiveDirectory('PAID_USERS')}
            className={`transition-colors whitespace-nowrap ${
              activeDirectory === 'PAID_USERS'
                ? 'text-zinc-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-[#84CC16]'
                : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Paid Users ({paidUsersList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveDirectory('ACTIVE_RENTALS')}
            className={`transition-colors whitespace-nowrap ${
              activeDirectory === 'ACTIVE_RENTALS'
                ? 'text-zinc-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-[#84CC16]'
                : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Active Rentals ({activeRentalsList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveDirectory('HISTORY_DIRECTORY')}
            className={`transition-colors whitespace-nowrap ${
              activeDirectory === 'HISTORY_DIRECTORY'
                ? 'text-zinc-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-[#84CC16]'
                : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            History Directory ({historyList.length})
          </button>
        </nav>

        <button
          type="button"
          onClick={onSignOut}
          className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white text-xs font-bold flex items-center gap-2 transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Switch Portal</span>
        </button>
      </header>

      {/* ====================================================================
          MAIN CONTENT
         ==================================================================== */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {toastMessage && (
          <div className="p-4 rounded-2xl bg-[#84CC16]/20 border border-[#84CC16] text-xs font-semibold flex items-center justify-between gap-3">
            <span>{toastMessage}</span>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-xs font-bold underline"
            >
              Close
            </button>
          </div>
        )}

        {/* ==================================================================
            3 MAIN VENUE DIRECTORY CARDS (Simple, Standard, Scannable)
           ================================================================== */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {(
            [
              {
                id: 'PAID_USERS',
                title: '1. Current Paid Users',
                sub: `${paidUsersList.length} Waiting · Tap Upload Collateral`,
                icon: Users,
              },
              {
                id: 'ACTIVE_RENTALS',
                title: '2. Active Rentals',
                sub: `${activeRentalsList.length} Out · Verify Return`,
                icon: Clock,
              },
              {
                id: 'HISTORY_DIRECTORY',
                title: '3. History Directory',
                sub: `${historyList.length} Successful & Failed`,
                icon: History,
              },
            ] as const
          ).map((dir) => {
            const Icon = dir.icon;
            const active = activeDirectory === dir.id;
            return (
              <button
                key={dir.id}
                type="button"
                onClick={() => setActiveDirectory(dir.id)}
                className={`p-5 rounded-2xl border text-left transition-all flex items-center justify-between ${
                  active
                    ? 'bg-[#84CC16] border-[#65A30D] text-zinc-950 shadow-sm'
                    : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-[#84CC16] text-zinc-900 dark:text-white'
                }`}
              >
                <div>
                  <p className="text-base font-extrabold tracking-tight">{dir.title}</p>
                  <p
                    className={`text-xs font-mono mt-0.5 ${
                      active ? 'text-zinc-900 font-semibold' : 'text-zinc-500'
                    }`}
                  >
                    {dir.sub}
                  </p>
                </div>
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    active
                      ? 'bg-zinc-950/15 text-zinc-950'
                      : 'bg-[#84CC16]/15 text-[#4D7C0F] dark:text-[#A3E635]'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
              </button>
            );
          })}
        </section>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search student name, Reg Number, Student ID, or booking code..."
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
          />
        </div>

        {/* ==================================================================
            DIRECTORY 1: CURRENT PAID USERS (TAP UPLOAD BUTTON TO UPLOAD COLLATERAL)
           ================================================================== */}
        {activeDirectory === 'PAID_USERS' && (
          <section className="space-y-4">
            <div>
              <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                Current Users Who Just Made Payment
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                When the student arrives at the venue, tap <strong>Upload Collateral</strong> to snap and upload their collateral item.
              </p>
            </div>

            {paidUsersList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center text-sm text-zinc-500">
                No paid users currently waiting for collateral upload.
              </div>
            ) : (
              <div className="space-y-3">
                {paidUsersList.map((bk) => (
                  <div
                    key={bk.id}
                    className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={bk.assetImageUrl}
                        alt={bk.assetTitle}
                        referrerPolicy="no-referrer"
                        className="w-16 h-16 rounded-xl object-cover bg-zinc-100 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                          <span className="font-bold text-[#4D7C0F] dark:text-[#A3E635]">
                            PAID ₦{bk.rentalFee.toLocaleString()}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {bk.bookingCode}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span>ID: {bk.renterId}</span>
                        </div>
                        <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                          {bk.renterName} ·{' '}
                          <span className="font-mono text-sm text-[#4D7C0F] dark:text-[#A3E635]">
                            {bk.renterRegNumber}
                          </span>
                        </h3>
                        <p className="text-xs text-zinc-500">
                          {bk.assetTitle} ({bk.assetCode}) · {bk.renterDepartment}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => openUploadCollateralModal(bk)}
                        className="px-5 py-3 min-h-[44px] rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white text-xs font-bold flex items-center gap-2 transition-colors"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Upload Collateral</span>
                      </button>
                      <button
                        type="button"
                        disabled={busyBookingId === bk.id}
                        onClick={() => handleRecordFailed(bk)}
                        className="px-3.5 py-3 min-h-[44px] rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        Failed
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ==================================================================
            DIRECTORY 2: ACTIVE RENTALS (VERIFY RETURN & GIVE BACK COLLATERAL)
           ================================================================== */}
        {activeDirectory === 'ACTIVE_RENTALS' && (
          <section className="space-y-4">
            <div>
              <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                Active Rentals Out with Students
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                When the student returns the rented item and shows their screenshot, verify it against the photo below and return their collateral.
              </p>
            </div>

            {activeRentalsList.length === 0 ? (
              <div className="p-8 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-center text-sm text-zinc-500">
                No active rentals out right now.
              </div>
            ) : (
              <div className="space-y-3">
                {activeRentalsList.map((bk) => (
                  <div
                    key={bk.id}
                    className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      {bk.venueCollateralScreenshot && (
                        <img
                          src={bk.venueCollateralScreenshot}
                          alt="Uploaded Collateral"
                          referrerPolicy="no-referrer"
                          className="w-24 h-20 rounded-xl object-contain bg-zinc-900 border border-[#84CC16] shrink-0"
                        />
                      )}
                      <div className="space-y-1">
                        <div className="text-xs font-mono text-zinc-500">
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {bk.bookingCode}
                          </span>{' '}
                          · ID: {bk.renterId} · Reg: {bk.renterRegNumber}
                        </div>
                        <h3 className="text-base font-extrabold text-zinc-900 dark:text-white">
                          {bk.renterName}
                        </h3>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300">
                          Item Out: <strong>{bk.assetTitle}</strong>
                        </p>
                        <p className="text-xs font-bold text-[#4D7C0F] dark:text-[#A3E635]">
                          Collateral Held: {bk.collateralItemDescription}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={busyBookingId === bk.id}
                      onClick={() => handleConfirmReturn(bk)}
                      className="px-5 py-3 min-h-[44px] rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white text-xs font-bold flex items-center gap-2 transition-colors self-start md:self-center shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Confirm Returned &amp; Delete Screenshot</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ==================================================================
            DIRECTORY 3: DEDICATED HISTORY DIRECTORY PAGE (SUCCESSFUL & FAILED)
           ================================================================== */}
        {activeDirectory === 'HISTORY_DIRECTORY' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                  Venue Business History Directory
                </h1>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Complete record of all Successful and Failed business with Date, Time, Student ID, and Reg Number.
                </p>
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl w-fit">
                {(
                  [
                    { id: 'ALL', label: 'All History' },
                    { id: 'SUCCESSFUL', label: 'Successful' },
                    { id: 'FAILED', label: 'Failed' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setHistoryFilter(tab.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      historyFilter === tab.id
                        ? 'bg-[#84CC16] text-zinc-950'
                        : 'text-zinc-600 dark:text-zinc-400'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              {historyList.map((bk) => (
                <div
                  key={bk.id}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-zinc-500">
                      <span className="font-bold text-zinc-900 dark:text-white">
                        {bk.bookingCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {new Date(bk.returnConfirmedAt || bk.createdAt).toLocaleString()}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>User ID: {bk.renterId}</span>
                    </div>
                    <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                      {bk.renterName} ({bk.renterRegNumber})
                    </h3>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300">
                      {bk.assetTitle} · Paid ₦{bk.rentalFee.toLocaleString()} · Collateral:{' '}
                      {bk.collateralItemDescription}
                    </p>
                    {bk.businessOutcome === 'FAILED' && bk.failureReason && (
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        Reason: {bk.failureReason}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {bk.businessOutcome === 'SUCCESSFUL' ? (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#84CC16]/20 text-[#3F6212] dark:text-[#BEF264] text-xs font-mono font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        SUCCESSFUL
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs font-mono font-bold">
                        <XCircle className="w-4 h-4" />
                        FAILED
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* ====================================================================
          MOBILE BOTTOM NAVIGATION BAR FOR VENUE PERSON
         ==================================================================== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-3 items-center h-16 px-2">
        {(
          [
            { id: 'PAID_USERS', label: 'Paid Users', icon: Users },
            { id: 'ACTIVE_RENTALS', label: 'Active Rentals', icon: Clock },
            { id: 'HISTORY_DIRECTORY', label: 'History', icon: History },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeDirectory === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveDirectory(tab.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl transition-colors ${
                active
                  ? 'text-[#4D7C0F] dark:text-[#A3E635] font-bold'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* ====================================================================
          CLEAN MODAL WHEN VENUE PERSON TAPS "UPLOAD COLLATERAL"
         ==================================================================== */}
      {uploadingForBooking && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-lg bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <div>
                <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                  Upload Student Collateral at Venue
                </h2>
                <p className="text-xs font-mono text-zinc-500">
                  {uploadingForBooking.renterName} · {uploadingForBooking.renterRegNumber} (ID:{' '}
                  {uploadingForBooking.renterId})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setUploadingForBooking(null)}
                className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmCollateralUpload} className="p-6 space-y-4">
              <div className="p-3.5 rounded-2xl bg-[#84CC16]/15 border border-[#84CC16] text-xs space-y-1">
                <p className="font-bold text-zinc-900 dark:text-white">
                  Item Paid For: {uploadingForBooking.assetTitle} (₦
                  {uploadingForBooking.rentalFee.toLocaleString()})
                </p>
                <p className="text-zinc-600 dark:text-zinc-300">
                  Snap and upload the physical collateral dropped by{' '}
                  <strong>{uploadingForBooking.renterName}</strong> right here at the venue.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1.5">
                  Physical Collateral Item Dropped by Student
                </label>
                <input
                  type="text"
                  required
                  value={collateralName}
                  onChange={(e) => setCollateralName(e.target.value)}
                  placeholder="e.g. Hostel Clearance Pass + Casio Wristwatch"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold">Snap / Upload Collateral Photo</label>
                  <button
                    type="button"
                    onClick={handleSnapInstantPhoto}
                    className="px-3 py-1 rounded-lg bg-[#84CC16]/25 text-[#3F6212] dark:text-[#BEF264] text-xs font-bold"
                  >
                    Instant Sample Snap
                  </button>
                </div>

                {collateralPhotoPreview ? (
                  <div className="h-44 rounded-xl bg-zinc-900 border border-[#84CC16] flex items-center justify-center overflow-hidden">
                    <img
                      src={collateralPhotoPreview}
                      alt="Collateral Preview"
                      referrerPolicy="no-referrer"
                      className="h-full w-auto object-contain"
                    />
                  </div>
                ) : (
                  <label className="h-44 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 flex flex-col items-center justify-center cursor-pointer hover:border-[#84CC16] bg-zinc-50 dark:bg-zinc-950 p-4 text-center">
                    <Camera className="w-6 h-6 text-zinc-400 mb-1.5" />
                    <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Tap to Snap or Upload Collateral Photo
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      capture="environment"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <button
                type="submit"
                disabled={isSavingCollateral}
                className="w-full h-12 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white text-sm font-bold transition-colors"
              >
                {isSavingCollateral
                  ? 'Uploading Collateral...'
                  : 'Save Collateral Photo & Hand Over Item'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
