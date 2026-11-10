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
  Zap,
  PlusCircle,
  Grid,
  FlaskConical,
  Calculator,
  Laptop,
  Layers,
  Camera,
} from 'lucide-react';
import type {
  StudentProfile,
  VenuePersonAccount,
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
import { AuthOnboardingScreen } from './components/AuthOnboardingScreen.tsx';
import { BookingAndCollateralModal } from './components/BookingAndCollateralModal.tsx';
import { DashMenuDrawer, type ActiveTabView } from './components/DashMenuDrawer.tsx';
import { OperationsConsoleView } from './components/OperationsConsoleView.tsx';
import { VenuePersonDashboardView } from './components/VenuePersonDashboardView.tsx';

const DEFAULT_METRICS: PilotMetricsSummary = {
  totalPaidBookings: 3,
  activeRentalsCount: 1,
  awaitingVenueVerifyCount: 1,
  completedReturnsCount: 1,
  failedBusinessCount: 1,
  earnedRentalRevenue: 1600,
  activePhysicalCollateralsHeld: 1,
  collateralPhotosPurgedCount: 1,
};

export default function App() {
  const [students, setStudents] = useState<StudentProfile[]>([]);
  const [venuePersons, setVenuePersons] = useState<VenuePersonAccount[]>([]);
  const [currentStudent, setCurrentStudent] = useState<StudentProfile | null>(null);
  const [activeVenuePerson, setActiveVenuePerson] = useState<VenuePersonAccount | null>(null);

  // Strict 3-Portal Isolation: 'STUDENT' | 'VENUE_PERSON' | 'MAIN_ADMIN' | 'AUTH_SCREEN'
  const [activePortal, setActivePortal] = useState<
    'STUDENT' | 'VENUE_PERSON' | 'MAIN_ADMIN' | 'AUTH_SCREEN'
  >('STUDENT');

  const [locations, setLocations] = useState<StockLocation[]>([]);
  const [assets, setAssets] = useState<RentalAsset[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [urgentRequests, setUrgentRequests] = useState<UrgentCampusRequest[]>([]);
  const [metrics, setMetrics] = useState<PilotMetricsSummary>(DEFAULT_METRICS);

  // Student App Navigation & Drawer States (Strictly Student Tabs Only — Zero Admin/Venue Leakage)
  const [activeTab, setActiveTab] = useState<ActiveTabView>('DIRECTORY');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Directory Filters
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ItemCategory>('ALL');
  const [supplyMode, setSupplyMode] = useState<'ALL' | OwnershipType>('ALL');
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

  // Lend My Item Form State
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<ItemCategory>('LAB_COAT');
  const [newOwnership] = useState<OwnershipType>('P2P_STUDENT');
  const [newLocationId, setNewLocationId] = useState('loc-sci-hub');
  const [newSpec, setNewSpec] = useState('');
  const [newUrgentRate, setNewUrgentRate] = useState(800);
  const [newDailyRate, setNewDailyRate] = useState(1200);
  const [newCollateralNote, setNewCollateralNote] = useState(
    'Drop Physical Collateral at Venue + Screenshot Verification'
  );
  const [newCustomPhoto, setNewCustomPhoto] = useState<string | null>(null);
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
      setVenuePersons(data.venuePersons);
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
      setActiveVenuePerson((prev) => {
        if (prev) {
          const updated = data.venuePersons.find((vp) => vp.id === prev.id);
          return updated || prev;
        }
        return data.venuePersons[0] || null;
      });
    } catch (err) {
      console.error('Failed to load data:', err);
    }
  }, [newLocationId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ==========================================================================
  // PORTAL ROUTING 1: AUTH & PORTAL SIGN-IN SCREEN
  // ==========================================================================
  if (activePortal === 'AUTH_SCREEN') {
    return (
      <AuthOnboardingScreen
        initialStudent={currentStudent}
        venuePersons={venuePersons}
        onCompleteStudentAuth={(verifiedStudent) => {
          setCurrentStudent(verifiedStudent);
          setActivePortal('STUDENT');
          loadData();
        }}
        onCompleteVenuePersonAuth={(vp) => {
          setActiveVenuePerson(vp);
          setActivePortal('VENUE_PERSON');
          loadData();
        }}
        onCompleteMainAdminAuth={() => {
          setActivePortal('MAIN_ADMIN');
          loadData();
        }}
      />
    );
  }

  // ==========================================================================
  // PORTAL ROUTING 2: VENUE PERSON ISOLATED PORTAL (Created by Main Admin)
  // ==========================================================================
  if (activePortal === 'VENUE_PERSON' && activeVenuePerson) {
    return (
      <VenuePersonDashboardView
        venuePerson={activeVenuePerson}
        bookings={bookings}
        onRefreshData={loadData}
        onSignOut={() => setActivePortal('AUTH_SCREEN')}
      />
    );
  }

  // ==========================================================================
  // PORTAL ROUTING 3: MAIN ADMIN AUTHORITY CONSOLE
  // ==========================================================================
  if (activePortal === 'MAIN_ADMIN') {
    return (
      <OperationsConsoleView
        students={students}
        venuePersons={venuePersons}
        locations={locations}
        assets={assets}
        bookings={bookings}
        metrics={metrics}
        onRefreshData={loadData}
        onOpenVenuePersonPortal={(vp) => {
          setActiveVenuePerson(vp);
          setActivePortal('VENUE_PERSON');
        }}
        onExitAdminPortal={() => setActivePortal('AUTH_SCREEN')}
      />
    );
  }

  // ==========================================================================
  // PORTAL ROUTING 4: STUDENT APPLICATION (Zero Admin/Venue Leakage)
  // ==========================================================================
  const activeStudent: StudentProfile = currentStudent || {
    id: 'stu-1001',
    uid: 'uid-stu-1001',
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

  // Directory counts
  const labCoatsCount = assets.filter((a) => a.category === 'LAB_COAT').length;
  const calculatorsCount = assets.filter((a) => a.category === 'CALCULATOR').length;
  const laptopsCount = assets.filter((a) => a.category === 'LAPTOP').length;

  const filteredAssets = assets.filter((asset) => {
    if (selectedCategory !== 'ALL' && asset.category !== selectedCategory) return false;
    if (supplyMode !== 'ALL' && asset.ownershipType !== supplyMode) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const match =
        asset.title.toLowerCase().includes(q) ||
        asset.assetCode.toLowerCase().includes(q) ||
        asset.locationName.toLowerCase().includes(q) ||
        asset.sizeOrSpec.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  const activeBookingsList = bookings.filter(
    (b) =>
      b.bookingStatus === 'PAID_AWAITING_HANDOVER' ||
      b.bookingStatus === 'COLLATERAL_UPLOADED_AWAITING_VENUE' ||
      b.bookingStatus === 'ACTIVE_RENTED'
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
      const { matchedAsset } = await broadcastUrgentCampusRequest({
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
          `Matched! ${matchedAsset.title} is available at ${matchedAsset.locationName}.`
        );
      } else {
        setUrgentToast('Urgent request broadcasted to nearby students and stock points.');
      }
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleNewItemPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setNewCustomPhoto(reader.result);
      }
    };
    reader.readAsDataURL(file);
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
            ? `${activeStudent.fullName} (${activeStudent.level})`
            : 'Lennder Managed Stock',
        ownerRegNumber:
          newOwnership === 'P2P_STUDENT' ? activeStudent.regNumber : undefined,
        institution: activeStudent.institution,
        locationId: newLocationId,
        sizeOrSpec: newSpec || 'Standard Campus Spec',
        conditionGrade: 'Grade A · Verified',
        includedAccessories: 'Standard Case',
        urgentRate: newUrgentRate,
        dailyRate: newDailyRate,
        requiredCollateralNote: newCollateralNote,
        customImageUrl: newCustomPhoto,
      });
      setNewTitle('');
      setNewSpec('');
      setNewCustomPhoto(null);
      await loadData();
      setPublishToast(`Listed ${asset.title} (${asset.assetCode}).`);
      setTimeout(() => {
        setPublishToast(null);
        setActiveTab('DIRECTORY');
      }, 1000);
    } finally {
      setIsPublishingItem(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFBF7] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 pb-20 lg:pb-12">
      {/* ====================================================================
          TOP HEADER BAR (Strictly Student Navigation — Zero Admin/Venue Leakage)
         ==================================================================== */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800 px-4 sm:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <a
          href="#directory"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('DIRECTORY');
          }}
          className="text-xl font-extrabold tracking-tight text-zinc-900 dark:text-white font-display whitespace-nowrap shrink-0"
        >
          lennder
        </a>

        {/* Zone 2: Student Nav Links Only */}
        <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-zinc-600 dark:text-zinc-300">
          <button
            type="button"
            onClick={() => setActiveTab('DIRECTORY')}
            className={`hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'DIRECTORY'
                ? 'text-zinc-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-[#84CC16]'
                : ''
            }`}
          >
            Directories
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('MY_RENTALS')}
            className={`hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'MY_RENTALS'
                ? 'text-zinc-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-[#84CC16]'
                : ''
            }`}
          >
            My Rentals ({activeBookingsList.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('URGENT_BOARD')}
            className={`hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'URGENT_BOARD'
                ? 'text-zinc-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-[#84CC16]'
                : ''
            }`}
          >
            Request Item
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('LEND_ITEM')}
            className={`hover:text-zinc-900 dark:hover:text-white transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'LEND_ITEM'
                ? 'text-zinc-900 dark:text-white font-bold underline underline-offset-8 decoration-2 decoration-[#84CC16]'
                : ''
            }`}
          >
            Lend Item
          </button>
        </nav>

        {/* Zone 3: Dash Menu Button (Yellow-Green) */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            className="px-4 py-2.5 min-h-[44px] text-xs font-bold text-zinc-950 bg-[#84CC16] hover:bg-[#65A30D] hover:text-white rounded-xl transition-colors flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <Menu className="w-4 h-4" />
            <span>Menu · {activeStudent.regNumber}</span>
          </button>
        </div>
      </header>

      {/* ====================================================================
          MAIN STUDENT DASHBOARD CONTENT
         ==================================================================== */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-8 pt-6 space-y-6">
        {/* Compact Student Identity Bar + Portal Sign-In Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 rounded-2xl bg-[#84CC16]/20 dark:bg-[#84CC16]/10 border border-[#84CC16]/40">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-zinc-800 dark:text-zinc-200">
            <span className="font-bold">{activeStudent.institution}</span>
            <span aria-hidden="true">·</span>
            <span>{activeStudent.fullName}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">ID: {activeStudent.id}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{activeStudent.regNumber}</span>
            <span aria-hidden="true">·</span>
            <span>
              {activeStudent.department} ({activeStudent.level})
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {activeBookingsList.length > 0 && (
              <button
                type="button"
                onClick={() => openExistingBookingPass(activeBookingsList[0])}
                className="px-3.5 py-1.5 rounded-lg bg-[#84CC16] text-zinc-950 text-xs font-bold hover:bg-[#65A30D] hover:text-white transition-colors"
              >
                Active Pickup Pass ({activeBookingsList[0].bookingCode}) →
              </button>
            )}
            <button
              type="button"
              onClick={() => setActivePortal('AUTH_SCREEN')}
              className="px-3.5 py-1.5 rounded-lg bg-[#84CC16] text-zinc-950 text-xs font-bold hover:bg-[#65A30D] hover:text-white transition-colors"
            >
              Sign In / Switch Portal (Student · Venue Person · Admin)
            </button>
          </div>
        </div>

        {/* ==================================================================
            VIEW 1: MAIN DIRECTORIES & AVAILABLE ITEMS
           ================================================================== */}
        {activeTab === 'DIRECTORY' && (
          <div className="space-y-6">
            {/* Main Directory Cards (All · Lab Coats · Calculators · Laptops) */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
              {(
                [
                  {
                    id: 'ALL',
                    title: 'All Directories',
                    count: `${assets.length} Available`,
                    icon: Layers,
                  },
                  {
                    id: 'LAB_COAT',
                    title: 'Lab Coats',
                    count: `${labCoatsCount} Available`,
                    icon: FlaskConical,
                  },
                  {
                    id: 'CALCULATOR',
                    title: 'Calculators',
                    count: `${calculatorsCount} Available`,
                    icon: Calculator,
                  },
                  {
                    id: 'LAPTOP',
                    title: 'Laptops',
                    count: `${laptopsCount} Available`,
                    icon: Laptop,
                  },
                ] as const
              ).map((dir) => {
                const Icon = dir.icon;
                const active = selectedCategory === dir.id;
                return (
                  <button
                    key={dir.id}
                    type="button"
                    onClick={() => setSelectedCategory(dir.id)}
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

            {/* Search & Supply Filter Bar */}
            <section className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search available lab coats, calculators, laptops, or stock point..."
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                />
              </div>

              <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shrink-0">
                {(
                  [
                    { id: 'ALL', label: 'All Items' },
                    { id: 'MANAGED_STOCK', label: 'Stock Points' },
                    { id: 'P2P_STUDENT', label: 'Student Peers' },
                  ] as const
                ).map((mode) => (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => setSupplyMode(mode.id)}
                    className={`px-3.5 py-1.5 min-h-[36px] text-xs font-bold rounded-lg transition-colors whitespace-nowrap ${
                      supplyMode === mode.id
                        ? 'bg-[#84CC16] text-zinc-950'
                        : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900'
                    }`}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </section>

            {/* Available Items Grid */}
            <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAssets.map((asset) => {
                const isAvailable = asset.status === 'AVAILABLE';
                return (
                  <article
                    key={asset.id}
                    className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col justify-between transition-transform hover:-translate-y-0.5"
                  >
                    <div>
                      <div className="aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                        <img
                          src={asset.imageUrl}
                          alt={asset.title}
                          referrerPolicy="no-referrer"
                          className="w-full h-full object-cover"
                        />
                      </div>

                      <div className="p-5 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500">
                          <span>{asset.assetCode}</span>
                          <span aria-hidden="true">·</span>
                          <span>
                            {asset.ownershipType === 'MANAGED_STOCK'
                              ? 'Stock Point'
                              : asset.ownerName}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-[#4D7C0F] dark:text-[#A3E635] font-bold">
                            {asset.status}
                          </span>
                        </div>

                        <h3 className="text-base font-bold text-zinc-900 dark:text-white leading-snug">
                          {asset.title}
                        </h3>

                        <p className="text-xs text-zinc-500">{asset.sizeOrSpec}</p>

                        <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5 pt-1">
                          <MapPin className="w-3.5 h-3.5 text-[#4D7C0F] dark:text-[#A3E635] shrink-0" />
                          <span>{asset.locationName}</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-5 pt-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-3">
                      <div className="font-mono">
                        <span className="text-base font-extrabold text-zinc-900 dark:text-white tabular-nums">
                          ₦{asset.urgentRate.toLocaleString()}
                        </span>
                        <span className="text-[11px] font-sans text-zinc-500 block">
                          4h Rent · Physical Collateral at Venue
                        </span>
                      </div>

                      <button
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => openRentCheckout(asset)}
                        className={`px-5 py-2.5 min-h-[44px] rounded-xl text-xs font-bold transition-colors whitespace-nowrap shrink-0 ${
                          isAvailable
                            ? 'bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white'
                            : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                        }`}
                      >
                        {isAvailable ? 'Rent Now' : 'Rented Out'}
                      </button>
                    </div>
                  </article>
                );
              })}
            </section>
          </div>
        )}

        {/* ==================================================================
            VIEW 2: MY RENTALS & PICKUP PASSES
           ================================================================== */}
        {activeTab === 'MY_RENTALS' && (
          <div className="space-y-4">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
              My Rentals &amp; Pickup Locations
            </h1>

            <div className="space-y-3">
              {bookings
                .filter((b) => b.businessOutcome !== 'FAILED')
                .map((bk) => (
                  <div
                    key={bk.id}
                    className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={bk.assetImageUrl}
                        alt={bk.assetTitle}
                        referrerPolicy="no-referrer"
                        className="w-20 h-20 rounded-xl object-cover bg-zinc-100 shrink-0"
                      />
                      <div className="space-y-1">
                        <div className="text-xs font-mono text-zinc-500">
                          <span className="font-bold text-zinc-900 dark:text-white">
                            {bk.bookingCode}
                          </span>{' '}
                          · {bk.bookingStatus}
                        </div>
                        <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                          {bk.assetTitle}
                        </h3>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-[#4D7C0F] shrink-0" />
                          <span>{bk.locationName}</span>
                        </p>
                        <p className="text-xs font-semibold text-[#4D7C0F] dark:text-[#A3E635]">
                          {bk.bookingStatus === 'PAID_AWAITING_HANDOVER'
                            ? 'Venue Revealed · Arrive at venue, snap & upload your collateral screenshot'
                            : bk.bookingStatus === 'ACTIVE_RENTED' ||
                              bk.bookingStatus === 'COLLATERAL_UPLOADED_AWAITING_VENUE'
                            ? `Active Rental · Show your collateral screenshot (${bk.collateralItemDescription}) when returning`
                            : 'Returned · Physical collateral collected & screenshot deleted'}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => openExistingBookingPass(bk)}
                      className="px-4 py-2.5 min-h-[44px] rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white text-xs font-bold whitespace-nowrap self-start sm:self-center transition-colors"
                    >
                      {bk.bookingStatus === 'PAID_AWAITING_HANDOVER'
                        ? 'View Venue & Upload Collateral'
                        : bk.bookingStatus === 'ACTIVE_RENTED' ||
                          bk.bookingStatus === 'COLLATERAL_UPLOADED_AWAITING_VENUE'
                        ? 'Show Collateral Screenshot Pass'
                        : 'View Receipt'}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* ==================================================================
            VIEW 3: REQUEST URGENT ITEM
           ================================================================== */}
        {activeTab === 'URGENT_BOARD' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-5 p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-4 h-fit">
              <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                Request Urgent Item Nearby
              </h2>

              {urgentToast && (
                <div className="p-3 rounded-xl bg-[#84CC16]/20 border border-[#84CC16] text-xs font-semibold">
                  {urgentToast}
                </div>
              )}

              <form onSubmit={handleBroadcastUrgent} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold mb-1">Category</label>
                  <select
                    value={urgentCategory}
                    onChange={(e) => setUrgentCategory(e.target.value as ItemCategory)}
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm"
                  >
                    <option value="LAB_COAT">Lab Coat</option>
                    <option value="CALCULATOR">Scientific Calculator</option>
                    <option value="LAPTOP">Laptop</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Your Lab or Exam Hall Location
                  </label>
                  <input
                    type="text"
                    required
                    value={urgentHall}
                    onChange={(e) => setUrgentHall(e.target.value)}
                    placeholder="e.g. Chemistry Lab Block B"
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">Item Needed</label>
                  <input
                    type="text"
                    required
                    value={urgentDesc}
                    onChange={(e) => setUrgentDesc(e.target.value)}
                    placeholder="e.g. Size L Lab Coat for practical starting now"
                    className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Minutes Left</label>
                    <input
                      type="number"
                      min={5}
                      value={urgentMinutes}
                      onChange={(e) => setUrgentMinutes(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Budget (₦)</label>
                    <input
                      type="number"
                      min={500}
                      value={urgentBudget}
                      onChange={(e) => setUrgentBudget(Number(e.target.value))}
                      className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isBroadcasting}
                  className="w-full h-12 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white text-xs font-bold transition-colors"
                >
                  {isBroadcasting ? 'Submitting Request...' : 'Send Urgent Request'}
                </button>
              </form>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <h2 className="text-lg font-extrabold text-zinc-900 dark:text-white">
                Active Student Requests ({urgentRequests.length})
              </h2>
              {urgentRequests.map((req) => {
                const matchedAsset = assets.find(
                  (a) => a.category === req.category && a.status === 'AVAILABLE'
                );
                return (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="space-y-1">
                      <span className="text-xs font-mono text-[#4D7C0F] dark:text-[#A3E635] font-bold">
                        {req.category} · Starting in {req.minutesUntilStart}m · ₦
                        {req.offeredBudget.toLocaleString()}
                      </span>
                      <p className="text-sm font-bold text-zinc-900 dark:text-white">
                        {req.itemNeededDescription}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {req.studentName} · {req.campusBuildingOrHall}
                      </p>
                    </div>
                    {matchedAsset && (
                      <button
                        type="button"
                        onClick={() => openRentCheckout(matchedAsset)}
                        className="px-4 py-2.5 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white text-xs font-bold whitespace-nowrap shrink-0 transition-colors"
                      >
                        Rent Available Match
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ==================================================================
            VIEW 4: LEND MY EXTRA ITEM / UPLOAD NEW INVENTORY
           ================================================================== */}
        {activeTab === 'LEND_ITEM' && (
          <div className="max-w-xl mx-auto p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-5">
            <div>
              <h1 className="text-xl font-extrabold text-zinc-900 dark:text-white">
                Add / List an Item for Rent (Zero Storage Cost)
              </h1>
              <p className="text-xs text-zinc-500 mt-0.5">
                Choose a built-in category photo for $0 storage cost or snap a compressed item photo.
              </p>
            </div>

            {publishToast && (
              <div className="p-3.5 rounded-xl bg-[#84CC16]/20 border border-[#84CC16] text-xs font-semibold">
                {publishToast}
              </div>
            )}

            <form onSubmit={handleCreateAsset} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as ItemCategory)}
                    className="w-full h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm"
                  >
                    <option value="LAB_COAT">Lab Coat</option>
                    <option value="CALCULATOR">Calculator</option>
                    <option value="LAPTOP">Laptop</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Stock Point</label>
                  <select
                    value={newLocationId}
                    onChange={(e) => setNewLocationId(e.target.value)}
                    className="w-full h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm"
                  >
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. White Lab Coat (Size L) or Casio fx-991EX"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">Size or Specification</label>
                <input
                  type="text"
                  required
                  value={newSpec}
                  onChange={(e) => setNewSpec(e.target.value)}
                  placeholder="e.g. Size L · Cotton Twill"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Item Photo (Optional — defaults to category studio photo at $0 cost)
                </label>
                {newCustomPhoto ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={newCustomPhoto}
                      alt="Custom item preview"
                      className="w-16 h-16 rounded-xl object-cover border border-[#84CC16]"
                    />
                    <button
                      type="button"
                      onClick={() => setNewCustomPhoto(null)}
                      className="text-xs font-semibold underline text-zinc-500"
                    >
                      Use default category photo instead
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 h-11 px-4 rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 cursor-pointer hover:border-[#84CC16] text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                    <Camera className="w-4 h-4" />
                    <span>Upload Custom Photo (or leave empty for default image)</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleNewItemPhotoUpload}
                      className="hidden"
                    />
                  </label>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">4h Rent Rate (₦)</label>
                  <input
                    type="number"
                    value={newUrgentRate}
                    onChange={(e) => setNewUrgentRate(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Daily Rent Rate (₦)</label>
                  <input
                    type="number"
                    value={newDailyRate}
                    onChange={(e) => setNewDailyRate(Number(e.target.value))}
                    className="w-full h-11 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Physical Collateral Requirement at Venue (No Cash Deposit)
                </label>
                <input
                  type="text"
                  value={newCollateralNote}
                  onChange={(e) => setNewCollateralNote(e.target.value)}
                  placeholder="e.g. Drop Hostel Pass or Watch at Venue + Screenshot Match"
                  className="w-full h-11 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isPublishingItem}
                className="w-full h-12 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white text-xs font-bold transition-colors"
              >
                {isPublishingItem ? 'Publishing...' : 'Add Item to Directory'}
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ====================================================================
          MOBILE BOTTOM NAVIGATION BAR (4 Student Tabs Only — Zero Leakage)
         ==================================================================== */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-4 items-center h-16 px-2">
        {(
          [
            { id: 'DIRECTORY', label: 'Directory', icon: Grid },
            { id: 'MY_RENTALS', label: 'My Rentals', icon: Clock },
            { id: 'URGENT_BOARD', label: 'Request', icon: Zap },
            { id: 'LEND_ITEM', label: 'Lend', icon: PlusCircle },
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
                  ? 'text-[#4D7C0F] dark:text-[#A3E635] font-bold'
                  : 'text-zinc-500 dark:text-zinc-400'
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

      {/* Slide-out Dash Menu Drawer (Student-Only) */}
      <DashMenuDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        currentStudent={activeStudent}
        onSwitchAccount={() => setActivePortal('AUTH_SCREEN')}
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        activeRentalsCount={activeBookingsList.length}
        urgentOpenCount={urgentRequests.length}
      />

      {/* Checkout, Pickup Location, Collateral Screenshot & Return Modal */}
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
          setActivePortal('AUTH_SCREEN');
        }}
      />
    </div>
  );
}
