/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  Menu,
  Search,
  MapPin,
  Clock,
  ShieldCheck,
  Zap,
  PlusCircle,
  Grid,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  Trash2,
  UserCheck,
  QrCode,
  SlidersHorizontal,
} from 'lucide-react';
import type {
  StudentProfile,
  StockLocation,
  RentalAsset,
  BookingRecord,
  UrgentCampusRequest,
  PilotMetricsSummary,
  ItemCategory,
  OwnershipType,
} from './types/lennder.ts';
import {
  fetchBootstrapData,
  createNewAssetListing,
  broadcastUrgentCampusRequest,
} from './services/lennderApi.ts';
import { StudentOnboardingModal } from './components/StudentOnboardingModal.tsx';
import { BookingAndCollateralModal } from './components/BookingAndCollateralModal.tsx';
import { DashMenuDrawer, type ActiveTabView } from './components/DashMenuDrawer.tsx';
import { OperationsConsoleView } from './components/OperationsConsoleView.tsx';

const CAMPUS_HERO_IMAGE = '/src/assets/images/campus_stock_hub_banner_1794266483732.jpg';

const DEFAULT_METRICS: PilotMetricsSummary = {
  totalPaidBookings: 1,
  activeRentalsCount: 0,
  completedReturnsCount: 1,
  earnedRentalRevenue: 800,
  heldRefundableDeposits: 0,
  refundedDepositsTotal: 4500,
  collateralPhotosPurgedCount: 1,
  utilizationRatePercent: 35,
};

export default function App() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(null);
  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [assets, setAssets] = useState<RentalAsset[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [urgentRequests, setUrgentRequests] = useState<UrgentCampusRequest[]>([]);
  const [metrics, setMetrics] = useState<PilotMetricsSummary>(DEFAULT_METRICS);
  const [isLoading, setIsLoading] = useState(true);

  // Navigation & Drawer States
  const [activeTab, setActiveTab] = useState<ActiveTabView>('DIRECTORY');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);

  // Directory Filters
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ItemCategory>('ALL');
  const [supplyMode, setSupplyMode] = useState<'ALL' | OwnershipType>('ALL');
  const [selectedInstitutionFilter, setSelectedInstitutionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Checkout / Collateral Handover / Return Modal States
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedAssetForBooking, setSelectedAssetForBooking] = useState<RentalAsset | null>(null);
  const [selectedBookingRecord, setSelectedBookingRecord] = useState<BookingRecord | null>(null);

  // Urgent Broadcast Form State
  const [urgentCategory, setUrgentCategory] = useState<ItemCategory>('LAB_COAT');
  const [urgentDesc, setUrgentDesc] = useState('');
  const [urgentHall, setUrgentHall] = useState('');
  const [urgentMinutes, setUrgentMinutes] = useState(15);
  const [urgentBudget, setUrgentBudget] = useState(800);
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [urgentToast, setUrgentToast] = useState<string | null>(null);

  // Lend My Item (P2P / Stock) Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ItemCategory>('LAB_COAT');
  const [newOwnership, setNewOwnership] = useState<OwnershipType>('P2P_STUDENT');
  const [newLocationId, setNewLocationId] = useState('loc-sci-hub');
  const [newSpec, setNewSpec] = useState('');
  const [newCondition, setNewCondition] = useState('Grade A · Clean & Tested');
  const [newAccessories, setNewAccessories] = useState('Protective Carry Case');
  const [newUrgentRate, setNewUrgentRate] = useState(800);
  const [newDailyRate, setNewDailyRate] = useState(1200);
  const [newDeposit, setNewDeposit] = useState(3000);
  const [isPublishingItem, setIsPublishingItem] = useState(false);
  const [publishToast, setPublishToast] = useState<string | null>(null);

  // Theme State
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const loadData = useCallback(async () => {
    try {
      const data = await fetchBootstrapData();
      setStudents(data.students);
      setLocations(data.locations);
      setAssets(data.assets);
      setBookings(data.bookings);
      setUrgentRequests(data.urgentRequests);
      setMetrics(data.metrics);
      if (data.locations.length > 0 && !newLocationId) {
        setNewLocationId(data.locations[0].id);
      }
      setCurrentStudent((prev) => {
        if (prev) {
          const updated = data.students.find((s) => s.id === prev.id);
          return updated || prev;
        }
        return data.students[0] || null;
      });
    } catch (err) {
      console.error('Failed to bootstrap Lennder:', err);
    } finally {
      setIsLoading(false);
    }
  }, [newLocationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const activeStudent: StudentProfile = currentStudent || {
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
    verificationStatus: 'VERIFIED',
    role: 'student',
    createdAt: new Date().toISOString(),
  };

  // Filtered Directory Items
  const filteredAssets = assets.filter((asset) => {
    if (selectedCategory !== 'ALL' && asset.category !== selectedCategory) return false;
    if (supplyMode !== 'ALL' && asset.ownershipType !== supplyMode) return false;
    if (
      selectedInstitutionFilter !== 'ALL' &&
      asset.institution !== selectedInstitutionFilter
    ) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const match =
        asset.title.toLowerCase().includes(q) ||
        asset.assetCode.toLowerCase().includes(q) ||
        asset.locationName.toLowerCase().includes(q) ||
        asset.sizeOrSpec.toLowerCase().includes(q) ||
        asset.ownerName.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const activeBookingsList = bookings.filter(
    (b) => b.bookingStatus === 'PAID_AWAITING_HANDOVER' || b.bookingStatus === 'ACTIVE_RENTED'
  );

  const openRentCheckout = (asset: RentalAsset) => {
    setSelectedBookingRecord(null);
    setSelectedAssetForBooking(asset);
    setBookingModalOpen(true);
  };

  const openExistingBookingPass = (booking: BookingRecord) => {
    setSelectedAssetForBooking(null);
    setSelectedBookingRecord(booking);
    setBookingModalOpen(true);
  };

  const handleBroadcastUrgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urgentDesc.trim() || !urgentHall.trim()) return;
    setIsBroadcasting(true);
    setUrgentToast(null);
    try {
      const { urgentRequest, matchedAsset } = await broadcastUrgentCampusRequest({
        studentId: activeStudent.id,
        studentName: activeStudent.fullName,
        studentDepartment: `${activeStudent.department} (${activeStudent.level})`,
        institution: activeStudent.institution,
        category: urgentCategory,
        itemNeededDescription: urgentDesc,
        campusBuildingOrHall: urgentHall,
        minutesUntilStart: urgentMinutes,
        offeredBudget: urgentBudget,
      });
      setUrgentDesc('');
      setUrgentHall('');
      await loadData();
      if (matchedAsset) {
        setUrgentToast(
          `Request broadcasted! Instant match found: ${matchedAsset.title} (${matchedAsset.assetCode}) at ${matchedAsset.locationName}.`
        );
      } else {
        setUrgentToast(
          `Urgent request broadcasted to ${urgentRequest.institution} stock points and nearby students.`
        );
      }
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleCreateAsset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setIsPublishingItem(true);
    setPublishToast(null);
    try {
      const { asset } = await createNewAssetListing({
        title: newTitle,
        category: newCategory,
        ownershipType: newOwnership,
        ownerName:
          newOwnership === 'P2P_STUDENT'
            ? `${activeStudent.fullName} (${activeStudent.level} ${activeStudent.department})`
            : 'Lennder Managed Stock',
        ownerRegNumber:
          newOwnership === 'P2P_STUDENT' ? activeStudent.regNumber : undefined,
        institution: activeStudent.institution,
        locationId: newLocationId,
        sizeOrSpec: newSpec || 'Standard University Spec',
        conditionGrade: newCondition,
        includedAccessories: newAccessories,
        urgentRate: newUrgentRate,
        dailyRate: newDailyRate,
        securityDeposit: newDeposit,
      });
      setNewTitle('');
      setNewSpec('');
      await loadData();
      setPublishToast(
        `Listed ${asset.title} (${asset.assetCode}) at ${asset.locationName}. Switching to Directory...`
      );
      setTimeout(() => {
        setPublishToast(null);
        setActiveTab('DIRECTORY');
      }, 1400);
    } finally {
      setIsPublishingItem(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 pb-20 lg:pb-12">
      {/* ====================================================================
          TOP NAVIGATION BAR (Strict 3-Zone Contract: Brand · 4–5 Nav Links · 1 Primary Action)
         ==================================================================== */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="#directory"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('DIRECTORY');
          }}
          className="text-xl font-extrabold tracking-tight text-slate-900 dark:text-white font-display whitespace-nowrap shrink-0"
        >
          Lennder
        </a>

        {/* Zone 2: 5 concise single-line text navigation links */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
          <button
            type="button"
            onClick={() => setActiveTab('DIRECTORY')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'DIRECTORY'
                ? 'text-slate-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-emerald-600'
                : ''
            }`}
          >
            Directory
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MY_RENTALS')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'MY_RENTALS'
                ? 'text-slate-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-emerald-600'
                : ''
            }`}
          >
            My Rentals ({activeBookingsList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('URGENT_BOARD')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'URGENT_BOARD'
                ? 'text-slate-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-emerald-600'
                : ''
            }`}
          >
            Urgent Requests
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LEND_ITEM')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'LEND_ITEM'
                ? 'text-slate-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-emerald-600'
                : ''
            }`}
          >
            Lend Item
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('OPERATIONS_ADMIN')}
            className={`hover:text-slate-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'OPERATIONS_ADMIN'
                ? 'text-slate-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-emerald-600'
                : ''
            }`}
          >
            Stock Operations
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (Opens Dash Menu Bar / Student Verification Drawer) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="px-4 py-2.5 min-h-[44px] text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 rounded-xl hover:bg-slate-800 dark:hover:bg-emerald-700 transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Menu className="w-4 h-4" />
            <span>Dash Menu · {activeStudent.regNumber}</span>
          </button>
        </div>
      </header>

      {/* ====================================================================
          MAIN WORKSPACE CONTAINER (1440px Desktop Max-Width, Mobile Ergonomic)
         ==================================================================== */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-8">
        {/* Student Institutional Identity & Active Pickup Alert Strip */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-bold text-slate-900 dark:text-white">
              {activeStudent.institution}
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Student: <strong>{activeStudent.fullName}</strong> ({activeStudent.regNumber})
            </span>
            <span aria-hidden="true">·</span>
            <span>
              {activeStudent.department} · {activeStudent.level}
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono font-bold text-emerald-700 dark:text-emerald-400">
              ID {activeStudent.verificationStatus}
            </span>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeBookingsList.length > 0 && (
              <button
                type="button"
                onClick={() => openExistingBookingPass(activeBookingsList[0])}
                className="px-3.5 py-2 min-h-[40px] rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 transition-colors whitespace-nowrap"
              >
                Open Active Pickup Pass ({activeBookingsList[0].bookingCode})
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsOnboardingOpen(true)}
              className="px-3.5 py-2 min-h-[40px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              Switch Institution / Verify Student ID
            </button>
          </div>
        </div>

        {/* ==================================================================
            VIEW 1: CAMPUS DIRECTORY (Hero + Category/Supply Toggles + Grid)
           ================================================================== */}
        {activeTab === 'DIRECTORY' && (
          <div className="space-y-8">
            {/* Split Hero Section */}
            <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
              <div className="lg:col-span-7 p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <p className="text-xs font-semibold tracking-wide text-emerald-700 dark:text-emerald-400">
                    Lennder Campus Stock Points &amp; Verified Peer Network
                  </p>
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-tight">
                    Forgot your lab coat or calculator before a practical or exam?
                  </h1>
                  <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-2xl leading-relaxed">
                    Locate an available <strong>Lab Coat</strong>, <strong>Scientific Calculator</strong>, or{' '}
                    <strong>Laptop</strong> at a campus stock point or nearby verified student. Pay securely, unlock your pickup directions &amp; handover OTP, upload your collateral screenshot proof, and attend your class in under 3 minutes.
                  </p>
                </div>

                {/* Quick Scenario Triggers */}
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('LAB_COAT');
                      const el = document.getElementById('catalogue-grid');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-5 py-3 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    Borrow Lab Coat Now (From ₦700)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory('CALCULATOR');
                      const el = document.getElementById('catalogue-grid');
                      el?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="px-5 py-3 min-h-[48px] rounded-xl bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    Borrow Exam Calculator (From ₦800)
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('URGENT_BOARD')}
                    className="px-4 py-3 min-h-[48px] rounded-xl border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors whitespace-nowrap"
                  >
                    Broadcast Urgent Need
                  </button>
                </div>
              </div>

              {/* Right Campus Stock Point Visual Card */}
              <div className="lg:col-span-5 relative rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 min-h-[260px] bg-slate-900">
                <img
                  src={CAMPUS_HERO_IMAGE}
                  alt="Lennder Campus Stock Point Counter"
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent flex flex-col justify-end p-6 text-white">
                  <p className="text-xs font-mono text-emerald-300">
                    ACTIVE CAMPUS STOCK POINTS · AKWA IBOM &amp; NATIONAL PILOT
                  </p>
                  <p className="text-lg font-bold mt-1">
                    Verified Attendant Handover &amp; Auto-Purging Collateral Privacy
                  </p>
                  <p className="text-xs text-slate-200 mt-1">
                    Science Complex Block B · Engineering Annex Hub · AKSU Central Lab Point
                  </p>
                </div>
              </div>
            </section>

            {/* Filter & Search Toolbar */}
            <section
              id="catalogue-grid"
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                {/* Category Segmented Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {(
                    [
                      { id: 'ALL', label: 'All Categories' },
                      { id: 'LAB_COAT', label: 'Lab Coats' },
                      { id: 'CALCULATOR', label: 'Calculators' },
                      { id: 'LAPTOP', label: 'Laptops' },
                    ] as const
                  ).map((cat) => (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`px-3.5 py-2 min-h-[40px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                        selectedCategory === cat.id
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>

                {/* Supply Source Toggle: Managed Stock Points vs P2P Student Nearby */}
                <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                  {(
                    [
                      { id: 'ALL', label: 'All Supply (Hubs + P2P)' },
                      { id: 'MANAGED_STOCK', label: 'Managed Stock Points' },
                      { id: 'P2P_STUDENT', label: 'Nearby Student Peers (P2P)' },
                    ] as const
                  ).map((mode) => (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => setSupplyMode(mode.id)}
                      className={`px-3.5 py-2 min-h-[40px] text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                        supplyMode === mode.id
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {mode.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Search Input & Institution Filter */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="md:col-span-2 relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by item (e.g. Size L Lab Coat, Casio fx-991EX, EliteBook) or building..."
                    className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  />
                </div>
                <div>
                  <select
                    value={selectedInstitutionFilter}
                    onChange={(e) => setSelectedInstitutionFilter(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    <option value="ALL">All Campus Institutions ({assets.length} items)</option>
                    <option value="University of Uyo (UNIUYO)">University of Uyo (UNIUYO)</option>
                    <option value="Akwa Ibom State University (AKSU)">
                      Akwa Ibom State University (AKSU)
                    </option>
                  </select>
                </div>
              </div>
            </section>

            {/* 3-Column Equipment Catalogue Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAssets.map((asset) => {
                const isAvailable = asset.status === 'AVAILABLE';
                return (
                  <article
                    key={asset.id}
                    className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col justify-between transition-transform hover:-translate-y-0.5"
                  >
                    <div>
                      {/* Product Photo */}
                      <div className="aspect-[4/3] w-full bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                        <img
                          src={asset.imageUrl}
                          alt={asset.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Card Body (Zero-Pill Unboxed Metadata with · separators) */}
                      <div className="p-5 space-y-2.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-mono">
                          <span>{asset.assetCode}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {asset.ownershipType === 'MANAGED_STOCK'
                              ? 'Managed Stock Hub'
                              : 'Student P2P'}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span
                            className={
                              isAvailable
                                ? 'text-emerald-700 dark:text-emerald-400 font-bold'
                                : 'text-amber-600 dark:text-amber-400 font-bold'
                            }
                          >
                            {asset.status}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug">
                          {asset.title}
                        </h3>

                        <p className="text-xs text-slate-600 dark:text-slate-300">
                          {asset.sizeOrSpec} · {asset.conditionGrade}
                        </p>

                        <div className="pt-1 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                          <p className="flex items-center gap-1.5 text-slate-700 dark:text-slate-200 font-medium">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span>{asset.locationName}</span>
                          </p>
                          <p className="pl-5 text-[11px]">
                            {asset.buildingProximity} · Owner: {asset.ownerName}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Pricing & Rent Action Footer */}
                    <div className="p-5 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-3">
                      <div className="font-mono">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                            ₦{asset.urgentRate.toLocaleString()}
                          </span>
                          <span className="text-[11px] font-sans text-slate-500">/ 4h urgent</span>
                        </div>
                        <p className="text-[11px] text-slate-500 tabular-nums">
                          Deposit: ₦{asset.securityDeposit.toLocaleString()} (Refundable)
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => openRentCheckout(asset)}
                        className={`px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold transition-colors whitespace-nowrap shrink-0 ${
                          isAvailable
                            ? 'bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 dark:hover:bg-emerald-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        {isAvailable ? 'Rent & Unlock Pickup' : 'Currently Out'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          </div>
        )}

        {/* ==================================================================
            VIEW 2: MY RENTALS, PICKUP LOCATION PASSES & COLLATERAL PROOF
           ================================================================== */}
        {activeTab === 'MY_RENTALS' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
                  My Rentals, Pickup Locations &amp; Collateral Proof
                </h1>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  View your pickup location directions, 6-digit Handover OTP, uploaded collateral screenshot, and automatic deletion status upon return.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('DIRECTORY')}
                className="px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors self-start sm:self-auto whitespace-nowrap"
              >
                Browse More Equipment
              </button>
            </div>

            <div className="space-y-4">
              {bookings.map((bk) => (
                <div
                  key={bk.id}
                  className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row justify-between gap-6"
                >
                  <div className="flex flex-col sm:flex-row gap-4">
                    <img
                      src={bk.assetImageUrl}
                      alt={bk.assetTitle}
                      referrerPolicy="no-referrer"
                      className="w-full sm:w-32 h-32 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                    />
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-slate-500">
                        <span className="font-bold text-slate-900 dark:text-white">
                          Booking {bk.bookingCode}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>OTP: {bk.handoverOtp}</span>
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

                      <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                        {bk.assetTitle} ({bk.assetCode})
                      </h3>

                      <p className="text-xs text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>
                          <strong>Pickup / Return Location:</strong> {bk.locationName} —{' '}
                          {bk.locationDirections}
                        </span>
                      </p>

                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Attendant: {bk.attendantName} ({bk.attendantPhone}) · {bk.durationLabel}
                      </p>

                      {/* Collateral Screenshot Status Line */}
                      <div className="pt-1 text-xs">
                        {bk.bookingStatus === 'PAID_AWAITING_HANDOVER' && (
                          <span className="font-semibold text-sky-700 dark:text-sky-400">
                            Action Required: Visit location above &amp; upload your collateral item screenshot to collect item.
                          </span>
                        )}
                        {bk.bookingStatus === 'ACTIVE_RENTED' && (
                          <span className="font-semibold text-amber-700 dark:text-amber-400">
                            Collateral Submitted: {bk.collateralItemDescription} · Screenshot held until you return the item.
                          </span>
                        )}
                        {bk.bookingStatus === 'RETURNED_COMPLETED' && (
                          <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                            Collateral Screenshot Automatically Removed on Return · Deposit ₦
                            {bk.depositRefundedAmount.toLocaleString()} Refunded.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex flex-col justify-between items-start lg:items-end gap-3 shrink-0 border-t lg:border-t-0 pt-4 lg:pt-0 border-slate-100 dark:border-slate-800">
                    <div className="lg:text-right font-mono">
                      <span className="text-xs text-slate-500 block">
                        Rental Fee: ₦{bk.rentalFee.toLocaleString()} · Deposit: ₦
                        {bk.securityDeposit.toLocaleString()}
                      </span>
                      <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                        Total Paid: ₦{bk.totalPaid.toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      {bk.bookingStatus === 'PAID_AWAITING_HANDOVER' && (
                        <button
                          type="button"
                          onClick={() => openExistingBookingPass(bk)}
                          className="px-4 py-2.5 min-h-[44px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                        >
                          Open Pickup Location &amp; Submit Collateral Screenshot
                        </button>
                      )}
                      {bk.bookingStatus === 'ACTIVE_RENTED' && (
                        <button
                          type="button"
                          onClick={() => openExistingBookingPass(bk)}
                          className="px-4 py-2.5 min-h-[44px] rounded-xl bg-slate-900 dark:bg-emerald-600 hover:bg-slate-800 text-white text-xs font-semibold transition-colors whitespace-nowrap"
                        >
                          Return Item &amp; Auto-Delete Collateral Screenshot
                        </button>
                      )}
                      {bk.bookingStatus === 'RETURNED_COMPLETED' && (
                        <button
                          type="button"
                          onClick={() => openExistingBookingPass(bk)}
                          className="px-4 py-2.5 min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
                        >
                          View Receipt &amp; Purge Log
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================================
            VIEW 3: URGENT PRACTICAL & EXAM REQUEST BOARD (Scenarios 1 & 2)
           ================================================================== */}
        {activeTab === 'URGENT_BOARD' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Form: Broadcast Urgent Need */}
            <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-5 h-fit">
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Broadcast Urgent Practical or Exam Need
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Standing outside the laboratory or exam hall without a lab coat or calculator? Broadcast your location to get matched immediately.
                </p>
              </div>

              {urgentToast && (
                <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-medium text-emerald-800 dark:text-emerald-200">
                  {urgentToast}
                </div>
              )}

              <form onSubmit={handleBroadcastUrgent} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Item Needed Urgently
                  </label>
                  <select
                    value={urgentCategory}
                    onChange={(e) => setUrgentCategory(e.target.value as ItemCategory)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="LAB_COAT">Lab Coat (Chemistry / Bio / Medical Practical)</option>
                    <option value="CALCULATOR">Scientific Calculator (Exam / Test)</option>
                    <option value="LAPTOP">Laptop (Project Defense / Coding Practical)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Exact Lab or Exam Hall Where You Are Standing
                  </label>
                  <input
                    type="text"
                    required
                    value={urgentHall}
                    onChange={(e) => setUrgentHall(e.target.value)}
                    placeholder="e.g. Chemistry Wet Lab Block B or 1000-Seater Hall"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Size / Model Details &amp; Course Code
                  </label>
                  <input
                    type="text"
                    required
                    value={urgentDesc}
                    onChange={(e) => setUrgentDesc(e.target.value)}
                    placeholder="e.g. Need Size L Lab Coat for CHM 211 practical starting now!"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Minutes Until Start
                    </label>
                    <input
                      type="number"
                      min={5}
                      max={180}
                      value={urgentMinutes}
                      onChange={(e) => setUrgentMinutes(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                      Rental Budget (₦)
                    </label>
                    <input
                      type="number"
                      min={500}
                      step={100}
                      value={urgentBudget}
                      onChange={(e) => setUrgentBudget(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="w-full py-3 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
                >
                  {isBroadcasting
                    ? 'Matching Nearby Stock Point...'
                    : 'Broadcast Urgent Request & Match Stock Point'}
                </button>
              </form>
            </div>

            {/* Right Feed: Live Urgent Requests on Campus */}
            <div className="lg:col-span-7 space-y-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                Live Campus Urgent Requests ({urgentRequests.length})
              </h2>
              <div className="space-y-3">
                {urgentRequests.map((req) => {
                  const matchedAsset = req.matchedAssetId
                    ? assets.find((a) => a.id === req.matchedAssetId)
                    : assets.find((a) => a.category === req.category && a.status === 'AVAILABLE');

                  return (
                    <div
                      key={req.id}
                      className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-slate-500">
                        <span>
                          {req.category} · Practical/Exam in {req.minutesUntilStart} mins ·{' '}
                          {req.institution}
                        </span>
                        <span className="font-bold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          Budget: ₦{req.offeredBudget.toLocaleString()}
                        </span>
                      </div>

                      <p className="text-base font-bold text-slate-900 dark:text-white">
                        {req.itemNeededDescription}
                      </p>

                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        Requested by <strong>{req.studentName}</strong> ({req.studentDepartment}) at{' '}
                        <strong>{req.campusBuildingOrHall}</strong>
                      </p>

                      {req.responderNote && (
                        <p className="text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          {req.responderNote}
                        </p>
                      )}

                      {matchedAsset && (
                        <div className="pt-2 flex items-center justify-between gap-3 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-xs text-slate-500">
                            Available Match: <strong>{matchedAsset.title}</strong> (
                            {matchedAsset.locationName})
                          </span>
                          <button
                            type="button"
                            onClick={() => openRentCheckout(matchedAsset)}
                            className="px-4 py-2 min-h-[40px] rounded-xl bg-slate-900 dark:bg-emerald-600 text-white text-xs font-semibold hover:bg-slate-800 transition-colors whitespace-nowrap"
                          >
                            Book Matched Item Now
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ==================================================================
            VIEW 4: LEND MY EXTRA ITEM (P2P Student or Managed Stock Creator)
           ================================================================== */}
        {activeTab === 'LEND_ITEM' && (
          <div className="max-w-2xl mx-auto p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                List an Extra Lab Coat, Calculator, or Laptop
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Have an extra lab coat or scientific calculator on campus? List it for verified fellow students and hand it over safely through a designated Lennder Stock Point.
              </p>
            </div>

            {publishToast && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs font-semibold text-emerald-800 dark:text-emerald-200">
                {publishToast}
              </div>
            )}

            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Item Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => {
                      const cat = e.target.value as ItemCategory;
                      setNewCategory(cat);
                      if (cat === 'LAPTOP') {
                        setNewUrgentRate(3000);
                        setNewDailyRate(5500);
                        setNewDeposit(20000);
                      } else if (cat === 'CALCULATOR') {
                        setNewUrgentRate(900);
                        setNewDailyRate(1300);
                        setNewDeposit(4500);
                      } else {
                        setNewUrgentRate(800);
                        setNewDailyRate(1200);
                        setNewDeposit(3000);
                      }
                    }}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="LAB_COAT">Lab Coat</option>
                    <option value="CALCULATOR">Scientific Calculator</option>
                    <option value="LAPTOP">Laptop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Listing Supply Type
                  </label>
                  <select
                    value={newOwnership}
                    onChange={(e) => setNewOwnership(e.target.value as OwnershipType)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="P2P_STUDENT">Student Peer Listing (P2P)</option>
                    <option value="MANAGED_STOCK">Founder Managed Stock Point Inventory</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Item Title &amp; Model / Size
                </label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Clean White Cotton Lab Coat (Size M) or Casio fx-991EX Calculator"
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Designated Campus Handover Stock Point
                  </label>
                  <select
                    value={newLocationId}
                    onChange={(e) => setNewLocationId(e.target.value)}
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Size / Technical Specification
                  </label>
                  <input
                    type="text"
                    required
                    value={newSpec}
                    onChange={(e) => setNewSpec(e.target.value)}
                    placeholder="e.g. Size M · Long Sleeve · Breast Pocket"
                    className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    4h Urgent Rate (₦)
                  </label>
                  <input
                    type="number"
                    min={300}
                    step={100}
                    value={newUrgentRate}
                    onChange={(e) => setNewUrgentRate(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Daily Rate (₦)
                  </label>
                  <input
                    type="number"
                    min={500}
                    step={100}
                    value={newDailyRate}
                    onChange={(e) => setNewDailyRate(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Refundable Deposit (₦)
                  </label>
                  <input
                    type="number"
                    min={1000}
                    step={500}
                    value={newDeposit}
                    onChange={(e) => setNewDeposit(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isPublishingItem}
                className="w-full py-3.5 min-h-[48px] rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold transition-colors"
              >
                {isPublishingItem ? 'Publishing to Campus Directory...' : 'Publish Item to Campus Directory'}
              </button>
            </form>
          </div>
        )}

        {/* ==================================================================
            VIEW 5: STOCK POINT & FOUNDER OPERATIONS CONSOLE
           ================================================================== */}
        {activeTab === 'OPERATIONS_ADMIN' && (
          <OperationsConsoleView
            students={students}
            locations={locations}
            assets={assets}
            bookings={bookings}
            metrics={metrics}
            onSelectBooking={openExistingBookingPass}
            onRefreshData={loadData}
          />
        )}
      </main>

      {/* ====================================================================
          MOBILE FIXED BOTTOM TAB BAR (Natural Thumb Zone, < 15% Viewport Cap)
         ==================================================================== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 grid grid-cols-5 items-center h-16 px-2">
        {(
          [
            { id: 'DIRECTORY', label: 'Directory', icon: Grid },
            { id: 'MY_RENTALS', label: 'My Rentals', icon: Clock },
            { id: 'URGENT_BOARD', label: 'Urgent', icon: Zap },
            { id: 'LEND_ITEM', label: 'Lend Item', icon: PlusCircle },
            { id: 'OPERATIONS_ADMIN', label: 'Stock Ops', icon: ShieldAlert },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[44px] flex flex-col items-center justify-center rounded-xl transition-colors ${
                active
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] tracking-tight mt-0.5 whitespace-nowrap">
                {tab.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Slide-out Dash Menu Drawer */}
      <DashMenuDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentStudent={activeStudent}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        activeRentalsCount={activeBookingsList.length}
        urgentOpenCount={urgentRequests.length}
      />

      {/* First-Time Student Institution Onboarding & ID Scanner Modal */}
      <StudentOnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        currentStudent={activeStudent}
        onVerified={(verifiedStudent) => {
          setCurrentStudent(verifiedStudent);
          loadData();
        }}
      />

      {/* Checkout, Pickup Location, Collateral Proof Upload & Auto-Purge Return Modal */}
      <BookingAndCollateralModal
        isOpen={bookingModalOpen}
        onClose={() => setBookingModalOpen(false)}
        selectedAsset={selectedAssetForBooking}
        activeBooking={selectedBookingRecord}
        currentStudent={activeStudent}
        onBookingUpdated={(updatedBooking) => {
          setSelectedBookingRecord(updatedBooking);
          loadData();
        }}
        onRequireOnboarding={() => {
          setBookingModalOpen(false);
          setIsOnboardingOpen(true);
        }}
      />
    </div>
  );
}
