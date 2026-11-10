import React, { useState } from 'react';
import {
  Eye,
  X,
  UserPlus,
  CheckCircle2,
  XCircle,
  LogOut,
  ArrowRight,
  Users,
  ShieldCheck,
  History,
  MapPin,
} from 'lucide-react';
import type {
  StudentProfile,
  VenuePersonAccount,
  StockLocation,
  RentalAsset,
  BookingRecord,
  PilotMetricsSummary,
} from '../types/lennder.ts';
import {
  adminUpdateStudentVerification,
  adminCreateVenuePersonAccount,
  adminToggleVenuePersonStatus,
} from '../services/lennderApi.ts';

interface OperationsConsoleViewProps {
  students: StudentProfile[];
  venuePersons: VenuePersonAccount[];
  locations: StockLocation[];
  assets: RentalAsset[];
  bookings: BookingRecord[];
  metrics: PilotMetricsSummary;
  onRefreshData: () => void;
  onOpenVenuePersonPortal: (vp: VenuePersonAccount) => void;
  onExitAdminPortal: () => void;
}

type AdminDirectoryTab =
  | 'VENUE_PERSONS_DIR'
  | 'STUDENT_PROOFS_DIR'
  | 'HISTORY_DIR'
  | 'VENUES_ITEMS_DIR';

export const OperationsConsoleView: React.FC<OperationsConsoleViewProps> = ({
  students,
  venuePersons,
  locations,
  assets,
  bookings,
  onRefreshData,
  onOpenVenuePersonPortal,
  onExitAdminPortal,
}) => {
  // 4 Clean Main Directories for the Admin Dashboard
  const [activeDirectory, setActiveDirectory] =
    useState<AdminDirectoryTab>('VENUE_PERSONS_DIR');
  const [historyFilter, setHistoryFilter] = useState<'ALL' | 'SUCCESSFUL' | 'FAILED'>('ALL');
  const [busyId, setBusyId] = useState<string | null>(null);

  // Modals (Keep the main page clean and uncluttered!)
  const [isCreateVpModalOpen, setIsCreateVpModalOpen] = useState(false);
  const [inspectingStudent, setInspectingStudent] = useState<StudentProfile | null>(null);

  // Admin Create Venue Person Account Form State
  const [vpFullName, setVpFullName] = useState('');
  const [vpEmail, setVpEmail] = useState('');
  const [vpPin, setVpPin] = useState('4455');
  const [vpPhone, setVpPhone] = useState('+234 803 000 1122');
  const [vpLocationId, setVpLocationId] = useState(locations[0]?.id || 'loc-sci-hub');
  const [isCreatingVp, setIsCreatingVp] = useState(false);
  const [adminToast, setAdminToast] = useState<string | null>(null);

  const historyBookings = bookings.filter((b) => {
    if (historyFilter === 'SUCCESSFUL') return b.businessOutcome === 'SUCCESSFUL';
    if (historyFilter === 'FAILED') return b.businessOutcome === 'FAILED';
    return true;
  });

  const handleCreateVenuePerson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vpFullName.trim() || !vpEmail.trim()) return;
    setIsCreatingVp(true);
    setAdminToast(null);
    try {
      const { venuePerson } = await adminCreateVenuePersonAccount({
        fullName: vpFullName,
        email: vpEmail,
        accessPin: vpPin,
        phone: vpPhone,
        assignedLocationId: vpLocationId || locations[0]?.id || 'loc-sci-hub',
      });
      setVpFullName('');
      setVpEmail('');
      setIsCreateVpModalOpen(false);
      onRefreshData();
      setAdminToast(
        `Created Venue Person account for ${venuePerson.fullName} (${venuePerson.staffCode} · PIN: ${venuePerson.accessPin}) at ${venuePerson.assignedLocationName}.`
      );
    } finally {
      setIsCreatingVp(false);
    }
  };

  const handleToggleVpStatus = async (vpId: string) => {
    setBusyId(vpId);
    try {
      await adminToggleVenuePersonStatus(vpId);
      onRefreshData();
    } finally {
      setBusyId(null);
    }
  };

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
          ? 'Admin verified Student ID match + Current Semester Timetable proof.'
          : 'Pending Admin review.'
      );
      onRefreshData();
      if (inspectingStudent && inspectingStudent.id === studentId) {
        setInspectingStudent({
          ...inspectingStudent,
          verificationStatus: status,
        });
      }
    } finally {
      setBusyId(null);
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
            HQ
          </div>
          <span className="text-lg font-extrabold tracking-tight text-zinc-900 dark:text-white font-display">
            lennder · Main Admin
          </span>
        </div>

        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <button
            type="button"
            onClick={() => setActiveDirectory('VENUE_PERSONS_DIR')}
            className={`transition-colors whitespace-nowrap ${
              activeDirectory === 'VENUE_PERSONS_DIR'
                ? 'text-zinc-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-[#84CC16]'
                : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Venue Persons ({venuePersons.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveDirectory('STUDENT_PROOFS_DIR')}
            className={`transition-colors whitespace-nowrap ${
              activeDirectory === 'STUDENT_PROOFS_DIR'
                ? 'text-zinc-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-[#84CC16]'
                : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Student ID &amp; Timetables ({students.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveDirectory('HISTORY_DIR')}
            className={`transition-colors whitespace-nowrap ${
              activeDirectory === 'HISTORY_DIR'
                ? 'text-zinc-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-[#84CC16]'
                : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            History Directory ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveDirectory('VENUES_ITEMS_DIR')}
            className={`transition-colors whitespace-nowrap ${
              activeDirectory === 'VENUES_ITEMS_DIR'
                ? 'text-zinc-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-[#84CC16]'
                : 'hover:text-zinc-900 dark:hover:text-white'
            }`}
          >
            Venues &amp; Stock ({locations.length})
          </button>
        </nav>

        <button
          type="button"
          onClick={onExitAdminPortal}
          className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white text-xs font-bold flex items-center gap-2 transition-colors shrink-0"
        >
          <LogOut className="w-4 h-4" />
          <span>Switch Portal</span>
        </button>
      </header>

      {/* ====================================================================
          MAIN ADMIN CONTENT
         ==================================================================== */}
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {adminToast && (
          <div className="p-4 rounded-2xl bg-[#84CC16]/20 border border-[#84CC16] text-xs font-semibold flex items-center justify-between gap-3">
            <span>{adminToast}</span>
            <button
              type="button"
              onClick={() => setAdminToast(null)}
              className="text-xs font-bold underline"
            >
              Close
            </button>
          </div>
        )}

        {/* ==================================================================
            4 MAIN ADMIN DIRECTORY CARDS (Same Clean Standard as Student App)
           ================================================================== */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {(
            [
              {
                id: 'VENUE_PERSONS_DIR',
                title: 'Venue Persons',
                count: `${venuePersons.length} Accounts`,
                icon: Users,
              },
              {
                id: 'STUDENT_PROOFS_DIR',
                title: 'Student Proofs',
                count: `${students.length} IDs & Timetables`,
                icon: ShieldCheck,
              },
              {
                id: 'HISTORY_DIR',
                title: 'History Directory',
                count: `${bookings.length} Records`,
                icon: History,
              },
              {
                id: 'VENUES_ITEMS_DIR',
                title: 'Venues & Stock',
                count: `${locations.length} Locations`,
                icon: MapPin,
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
                className={`p-4 sm:p-5 rounded-2xl border text-left transition-all flex items-center justify-between ${
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
                    {dir.count}
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

        {/* ==================================================================
            DIRECTORY 1: VENUE PERSONS DIRECTORY (CREATE & CONTROL ACCOUNTS)
           ================================================================== */}
        {activeDirectory === 'VENUE_PERSONS_DIR' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                  Venue Person Accounts (Created by Admin)
                </h1>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Create accounts for Venue Persons and assign them to a campus location.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateVpModalOpen(true)}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white text-xs font-bold flex items-center gap-2 self-start sm:self-center transition-colors"
              >
                <UserPlus className="w-4 h-4" />
                <span>Create Venue Person Account</span>
              </button>
            </div>

            <div className="space-y-3">
              {venuePersons.map((vp) => (
                <div
                  key={vp.id}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="font-bold text-zinc-900 dark:text-white text-base font-sans">
                        {vp.fullName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-[#4D7C0F] dark:text-[#A3E635]">
                        {vp.staffCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>PIN: {vp.accessPin}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold">{vp.status}</span>
                    </div>
                    <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      Venue: {vp.assignedLocationName} ({vp.institution})
                    </p>
                    <p className="text-xs font-mono text-zinc-500">
                      Email: {vp.email} · {vp.phone}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenVenuePersonPortal(vp)}
                      className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <span>Open Venue Dashboard</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={busyId === vp.id}
                      onClick={() => handleToggleVpStatus(vp.id)}
                      className="px-3.5 py-2.5 min-h-[42px] rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
                    >
                      {vp.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==================================================================
            DIRECTORY 2: STUDENT PROOFS DIRECTORY (ID CARD & SEMESTER TIMETABLE)
           ================================================================== */}
        {activeDirectory === 'STUDENT_PROOFS_DIR' && (
          <section className="space-y-4">
            <div>
              <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                Student ID &amp; Semester Timetable Verification
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Tap <strong>View ID &amp; Timetable</strong> to inspect the student&apos;s scanned ID Card and Current Semester Timetable.
              </p>
            </div>

            <div className="space-y-3">
              {students.map((stu) => (
                <div
                  key={stu.id}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span className="font-bold text-zinc-900 dark:text-white text-base font-sans">
                        {stu.fullName}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>ID: {stu.id}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-bold text-[#4D7C0F] dark:text-[#A3E635]">
                        Reg: {stu.regNumber}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">
                      {stu.institution} · {stu.department} ({stu.level})
                    </p>
                    <p className="text-xs font-semibold text-[#4D7C0F] dark:text-[#A3E635]">
                      Status: {stu.verificationStatus}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setInspectingStudent(stu)}
                      className="px-4 py-2.5 min-h-[42px] rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View ID &amp; Timetable</span>
                    </button>
                    {stu.verificationStatus !== 'VERIFIED' ? (
                      <button
                        type="button"
                        disabled={busyId === stu.id}
                        onClick={() => handleVerifyStudent(stu.id, 'VERIFIED')}
                        className="px-3.5 py-2.5 min-h-[42px] rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-bold"
                      >
                        Approve
                      </button>
                    ) : (
                      <button
                        type="button"
                        disabled={busyId === stu.id}
                        onClick={() => handleVerifyStudent(stu.id, 'PENDING_REVIEW')}
                        className="px-3.5 py-2.5 min-h-[42px] rounded-xl border border-zinc-200 dark:border-zinc-700 text-xs font-semibold"
                      >
                        Set Pending
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==================================================================
            DIRECTORY 3: DEDICATED BUSINESS HISTORY DIRECTORY (SUCCESSFUL & FAILED)
           ================================================================== */}
        {activeDirectory === 'HISTORY_DIR' && (
          <section className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                  All Business History Directory (Successful &amp; Failed)
                </h1>
                <p className="text-xs text-zinc-500 mt-0.5">
                  Every rental across all venues recorded with Date, Time, Student ID, and Reg Number.
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
              {historyBookings.map((bk) => (
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
                      {bk.assetTitle} · Venue: {bk.locationName} · ₦
                      {bk.rentalFee.toLocaleString()}
                    </p>
                    {bk.businessOutcome === 'FAILED' && bk.failureReason && (
                      <p className="text-xs text-red-600 dark:text-red-400 font-medium">
                        Reason: {bk.failureReason}
                      </p>
                    )}
                  </div>

                  <div className="shrink-0">
                    {bk.businessOutcome === 'SUCCESSFUL' && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#84CC16]/20 text-[#3F6212] dark:text-[#BEF264] text-xs font-mono font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        SUCCESSFUL
                      </span>
                    )}
                    {bk.businessOutcome === 'FAILED' && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs font-mono font-bold">
                        <XCircle className="w-4 h-4" />
                        FAILED
                      </span>
                    )}
                    {bk.businessOutcome === 'IN_PROGRESS' && (
                      <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-xs font-mono font-bold">
                        IN PROGRESS AT VENUE
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ==================================================================
            DIRECTORY 4: VENUES & STOCK DIRECTORY
           ================================================================== */}
        {activeDirectory === 'VENUES_ITEMS_DIR' && (
          <section className="space-y-5">
            <div>
              <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                Campus Venues &amp; Stock Points ({locations.length})
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Active pickup venues across institutions and their assigned Venue Persons.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {locations.map((loc) => (
                <div
                  key={loc.id}
                  className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2"
                >
                  <span className="text-xs font-mono text-[#4D7C0F] dark:text-[#A3E635] font-bold">
                    {loc.code}
                  </span>
                  <h3 className="text-base font-bold text-zinc-900 dark:text-white">{loc.name}</h3>
                  <p className="text-xs text-zinc-500">{loc.buildingDirections}</p>
                  <p className="text-xs font-mono text-zinc-600 dark:text-zinc-400">
                    Venue Person: {loc.attendantName}
                  </p>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-white mb-3">
                All Listed Inventory Items ({assets.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {assets.map((asset) => (
                  <div
                    key={asset.id}
                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center gap-3.5"
                  >
                    <img
                      src={asset.imageUrl}
                      alt={asset.title}
                      referrerPolicy="no-referrer"
                      className="w-16 h-16 rounded-xl object-cover bg-zinc-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-[#4D7C0F] dark:text-[#A3E635] font-bold">
                        {asset.assetCode} · {asset.status}
                      </p>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white truncate">
                        {asset.title}
                      </p>
                      <p className="text-xs text-zinc-500 truncate">
                        ₦{asset.urgentRate.toLocaleString()} · {asset.locationName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* ====================================================================
          MOBILE BOTTOM NAVIGATION BAR FOR ADMIN
         ==================================================================== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-4 items-center h-16 px-2">
        {(
          [
            { id: 'VENUE_PERSONS_DIR', label: 'Venue Staff', icon: Users },
            { id: 'STUDENT_PROOFS_DIR', label: 'Student IDs', icon: ShieldCheck },
            { id: 'HISTORY_DIR', label: 'History', icon: History },
            { id: 'VENUES_ITEMS_DIR', label: 'Venues', icon: MapPin },
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
          MODAL 1: CREATE VENUE PERSON ACCOUNT MODAL
         ==================================================================== */}
      {isCreateVpModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
          <div className="w-full max-w-md bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden my-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
              <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                Create Venue Person Account
              </h2>
              <button
                type="button"
                onClick={() => setIsCreateVpModalOpen(false)}
                className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVenuePerson} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">
                  Assign to Campus Venue Location
                </label>
                <select
                  value={vpLocationId}
                  onChange={(e) => setVpLocationId(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-semibold"
                >
                  {locations.map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} — {loc.institution}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Venue Person Full Name</label>
                <input
                  type="text"
                  required
                  value={vpFullName}
                  onChange={(e) => setVpFullName(e.target.value)}
                  placeholder="e.g. Mfonobong Ekpo"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Sign-In Email</label>
                  <input
                    type="email"
                    required
                    value={vpEmail}
                    onChange={(e) => setVpEmail(e.target.value)}
                    placeholder="mfon@lennder.campus"
                    className="w-full h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Access PIN</label>
                  <input
                    type="text"
                    required
                    value={vpPin}
                    onChange={(e) => setVpPin(e.target.value)}
                    placeholder="4455"
                    className="w-full h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Phone Number</label>
                <input
                  type="text"
                  required
                  value={vpPhone}
                  onChange={(e) => setVpPhone(e.target.value)}
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={isCreatingVp}
                className="w-full h-12 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white text-xs font-bold transition-colors"
              >
                {isCreatingVp ? 'Creating Account...' : 'Create Venue Person Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ====================================================================
          MODAL 2: STUDENT ID & SEMESTER TIMETABLE INSPECTOR MODAL
         ==================================================================== */}
      {inspectingStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/70 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-5 my-auto">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-4">
              <div>
                <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                  {inspectingStudent.fullName} · {inspectingStudent.regNumber}
                </h2>
                <p className="text-xs font-mono text-[#4D7C0F] dark:text-[#A3E635]">
                  Student ID: {inspectingStudent.id} · {inspectingStudent.institution} ·{' '}
                  {inspectingStudent.department} ({inspectingStudent.level})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setInspectingStudent(null)}
                className="p-2 rounded-xl text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  1. Scanned Student ID Card (Name &amp; Reg Match)
                </p>
                {inspectingStudent.studentIdCardImage && (
                  <img
                    src={inspectingStudent.studentIdCardImage}
                    alt="Student ID"
                    referrerPolicy="no-referrer"
                    className="w-full rounded-2xl border border-[#84CC16]"
                  />
                )}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  2. Current Semester Timetable (Final Proof)
                </p>
                {inspectingStudent.semesterTimetableImage && (
                  <img
                    src={inspectingStudent.semesterTimetableImage}
                    alt="Semester Timetable"
                    referrerPolicy="no-referrer"
                    className="w-full rounded-2xl border border-[#84CC16]"
                  />
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              {inspectingStudent.verificationStatus !== 'VERIFIED' && (
                <button
                  type="button"
                  onClick={() => handleVerifyStudent(inspectingStudent.id, 'VERIFIED')}
                  className="px-5 py-2.5 rounded-xl bg-[#84CC16] text-zinc-950 font-bold text-xs"
                >
                  Approve Student
                </button>
              )}
              <button
                type="button"
                onClick={() => setInspectingStudent(null)}
                className="px-5 py-2.5 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
