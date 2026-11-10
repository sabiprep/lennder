import React, { useState } from 'react';
import {
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  Camera,
  ShieldCheck,
  Calendar,
  Lock,
} from 'lucide-react';
import type {
  StudentProfile,
  VenuePersonAccount,
} from '../types/lennder.ts';
import {
  SUPPORTED_INSTITUTIONS,
  FACULTIES,
  STUDENT_LEVELS,
} from '../config/campusInventory.ts';
import {
  registerAndVerifyStudent,
  authenticateVenuePerson,
  generateSampleStudentIdDataUri,
  generateSampleTimetableDataUri,
} from '../services/lennderApi.ts';

interface AuthOnboardingScreenProps {
  initialStudent?: StudentProfile | null;
  venuePersons: VenuePersonAccount[];
  onCompleteStudentAuth: (student: StudentProfile) => void;
  onCompleteVenuePersonAuth: (venuePerson: VenuePersonAccount) => void;
  onCompleteMainAdminAuth: () => void;
}

export const AuthOnboardingScreen: React.FC<AuthOnboardingScreenProps> = ({
  initialStudent,
  venuePersons,
  onCompleteStudentAuth,
  onCompleteVenuePersonAuth,
  onCompleteMainAdminAuth,
}) => {
  const [authPortalType, setAuthPortalType] = useState<
    'STUDENT' | 'VENUE_PERSON' | 'MAIN_ADMIN'
  >('STUDENT');
  const [step, setStep] = useState<1 | 2 | 3>(1);

  const [institution, setInstitution] = useState(
    initialStudent?.institution || SUPPORTED_INSTITUTIONS[0]
  );
  const [fullName, setFullName] = useState('Iniobong Udoh');
  const [regNumber, setRegNumber] = useState('23/SC/CH/142');
  const [faculty, setFaculty] = useState(FACULTIES[0]);
  const [department, setDepartment] = useState('Pure & Industrial Chemistry');
  const [level, setLevel] = useState('300 Level');
  const [phone] = useState('+234 810 554 2190');

  const [idCardImage, setIdCardImage] = useState<string | null>(null);
  const [timetableImage, setTimetableImage] = useState<string | null>(null);
  const [idScanVerified, setIdScanVerified] = useState(false);

  // Venue Person Sign-In State (Created by Admin)
  const [vpEmailOrCode, setVpEmailOrCode] = useState(
    venuePersons[0]?.email || 'nsikak.venue@lennder.campus'
  );
  const [vpAccessPin, setVpAccessPin] = useState(venuePersons[0]?.accessPin || '4410');

  // Main Admin Sign-In State
  const [adminMasterKey, setAdminMasterKey] = useState('LENNDER-HQ-ADMIN');

  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleNextStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (!institution) return;
    setStep(2);
  };

  const handleNextStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!fullName.trim() || !regNumber.trim() || !department.trim()) {
      setErrorMsg('Please enter your Full Name, Reg Number, and Department.');
      return;
    }
    setStep(3);
  };

  const handleIdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setIdCardImage(reader.result);
        setIdScanVerified(true);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleTimetableFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setTimetableImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoadSampleIdCard = () => {
    const nameToUse = fullName.trim() || 'Iniobong Udoh';
    const regToUse = regNumber.trim() || '23/SC/CH/142';
    const deptToUse = department.trim() || 'Pure & Industrial Chemistry';

    const sampleUri = generateSampleStudentIdDataUri(
      nameToUse,
      regToUse,
      institution,
      deptToUse,
      level
    );
    setIdCardImage(sampleUri);
    setIdScanVerified(true);
  };

  const handleLoadSampleTimetable = () => {
    const nameToUse = fullName.trim() || 'Iniobong Udoh';
    const regToUse = regNumber.trim() || '23/SC/CH/142';
    const deptToUse = department.trim() || 'Pure & Industrial Chemistry';

    const sampleUri = generateSampleTimetableDataUri(
      nameToUse,
      regToUse,
      institution,
      deptToUse,
      level
    );
    setTimetableImage(sampleUri);
  };

  const handleFinishVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsVerifying(true);
    try {
      const { student } = await registerAndVerifyStudent({
        fullName: fullName.trim(),
        phone,
        institution,
        regNumber: regNumber.trim(),
        faculty,
        department: department.trim(),
        level,
        studentIdCardImage: idCardImage,
        semesterTimetableImage: timetableImage,
      });
      onCompleteStudentAuth(student);
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleVenuePersonSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsVerifying(true);
    try {
      const { venuePerson } = await authenticateVenuePerson({
        emailOrStaffCode: vpEmailOrCode,
        accessPin: vpAccessPin,
      });
      onCompleteVenuePersonAuth(venuePerson);
    } catch (err: any) {
      setErrorMsg(err.message || 'Venue Person sign-in failed.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleMainAdminSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    if (!adminMasterKey.trim()) {
      setErrorMsg('Please enter the Main Admin Access Key.');
      return;
    }
    onCompleteMainAdminAuth();
  };

  return (
    <div className="min-h-screen bg-[#FAFBF7] dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Bar */}
      <div className="w-full max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3 py-2">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#84CC16] flex items-center justify-center text-zinc-950 font-extrabold text-lg">
            L
          </div>
          <span className="text-xl font-extrabold tracking-tight font-display">
            lennder
          </span>
        </div>

        {/* Quick Portal Role Selector */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              if (initialStudent) onCompleteStudentAuth(initialStudent);
            }}
            className="px-3.5 py-2 min-h-[40px] rounded-xl text-xs font-bold bg-[#84CC16] text-zinc-950 hover:bg-[#65A30D] hover:text-white transition-colors"
          >
            Enter Student App →
          </button>
          {venuePersons[0] && (
            <button
              type="button"
              onClick={() => onCompleteVenuePersonAuth(venuePersons[0])}
              className="px-3.5 py-2 min-h-[40px] rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold hover:border-[#84CC16] transition-colors"
            >
              Enter Venue Person Portal →
            </button>
          )}
          <button
            type="button"
            onClick={onCompleteMainAdminAuth}
            className="px-3.5 py-2 min-h-[40px] rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-bold hover:border-[#84CC16] transition-colors"
          >
            Enter Main Admin Console →
          </button>
        </div>
      </div>

      {/* Main Centered Auth Card */}
      <div className="w-full max-w-2xl mx-auto my-6">
        <div className="bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200/90 dark:border-zinc-800 shadow-xl p-6 sm:p-10 space-y-6">
          {/* Role Switcher Tabs (3 Isolated Portals — Zero Leakage) */}
          <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-zinc-100 dark:bg-zinc-800/70">
            <button
              type="button"
              onClick={() => {
                setAuthPortalType('STUDENT');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-colors ${
                authPortalType === 'STUDENT'
                  ? 'bg-[#84CC16] text-zinc-950'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              1. Student App
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthPortalType('VENUE_PERSON');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-colors ${
                authPortalType === 'VENUE_PERSON'
                  ? 'bg-[#84CC16] text-zinc-950'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              2. Venue Person Sign-In
            </button>
            <button
              type="button"
              onClick={() => {
                setAuthPortalType('MAIN_ADMIN');
                setErrorMsg(null);
              }}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-colors ${
                authPortalType === 'MAIN_ADMIN'
                  ? 'bg-[#84CC16] text-zinc-950'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              3. Main Admin Authority
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {/* ================================================================
              PORTAL 1: STUDENT INSTITUTION AUTHENTICATION (3 STEPS)
             ================================================================ */}
          {authPortalType === 'STUDENT' && (
            <>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                  <span>STUDENT INSTITUTION AUTHENTICATION</span>
                  <span className="font-mono text-zinc-900 dark:text-zinc-200">
                    Step {step} of 3
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div
                    className={`h-2 rounded-full transition-colors ${
                      step >= 1 ? 'bg-[#84CC16]' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  />
                  <div
                    className={`h-2 rounded-full transition-colors ${
                      step >= 2 ? 'bg-[#84CC16]' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  />
                  <div
                    className={`h-2 rounded-full transition-colors ${
                      step >= 3 ? 'bg-[#65A30D]' : 'bg-zinc-200 dark:bg-zinc-800'
                    }`}
                  />
                </div>
              </div>

              {step === 1 && (
                <form onSubmit={handleNextStep1} className="space-y-6">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                      1. Choose Your Institution
                    </h1>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      Select your university or institution to access your campus rental directory.
                    </p>
                  </div>

                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {SUPPORTED_INSTITUTIONS.map((inst) => {
                      const selected = institution === inst;
                      return (
                        <button
                          key={inst}
                          type="button"
                          onClick={() => setInstitution(inst)}
                          className={`w-full p-4 rounded-2xl border text-left transition-all flex items-center justify-between ${
                            selected
                              ? 'border-[#65A30D] bg-[#84CC16]/20 text-zinc-950 dark:text-white font-bold'
                              : 'border-zinc-200 dark:border-zinc-800 hover:border-[#84CC16] text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <span className="text-sm">{inst}</span>
                          <span
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              selected
                                ? 'border-[#65A30D] bg-[#84CC16] text-zinc-950'
                                : 'border-zinc-300 dark:border-zinc-700'
                            }`}
                          >
                            {selected && <CheckCircle2 className="w-3.5 h-3.5" />}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <button
                    type="submit"
                    className="w-full h-12 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                  >
                    <span>Continue with {institution.split('(')[0].trim()}</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              )}

              {step === 2 && (
                <form onSubmit={handleNextStep2} className="space-y-5">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                      2. Student Academic Profile
                    </h1>
                    <p className="text-xs font-bold text-[#4D7C0F] dark:text-[#A3E635]">
                      {institution}
                    </p>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                        Full Name (Must match Student ID)
                      </label>
                      <input
                        type="text"
                        required
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder="e.g. Iniobong Udoh"
                        className="w-full h-12 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          Reg / Matric Number (Must match ID)
                        </label>
                        <input
                          type="text"
                          required
                          value={regNumber}
                          onChange={(e) => setRegNumber(e.target.value)}
                          placeholder="e.g. 23/SC/CH/142"
                          className="w-full h-12 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          Current Level
                        </label>
                        <select
                          value={level}
                          onChange={(e) => setLevel(e.target.value)}
                          className="w-full h-12 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                        >
                          {STUDENT_LEVELS.map((lvl) => (
                            <option key={lvl} value={lvl}>
                              {lvl}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          Faculty
                        </label>
                        <select
                          value={faculty}
                          onChange={(e) => setFaculty(e.target.value)}
                          className="w-full h-12 px-3.5 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                        >
                          {FACULTIES.map((fac) => (
                            <option key={fac} value={fac}>
                              {fac}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-zinc-700 dark:text-zinc-300 mb-1.5">
                          Department
                        </label>
                        <input
                          type="text"
                          required
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          placeholder="e.g. Biochemistry"
                          className="w-full h-12 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm focus:outline-none focus:ring-2 focus:ring-[#84CC16]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 h-12 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      className="flex-1 h-12 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <span>Next: Scan Student ID &amp; Semester Timetable</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </form>
              )}

              {step === 3 && (
                <form onSubmit={handleFinishVerification} className="space-y-5">
                  <div className="space-y-1">
                    <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                      3. Student ID Scan &amp; Semester Timetable Proof
                    </h1>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400">
                      We scan your Student ID to confirm it matches <strong>{fullName}</strong> (
                      <span className="font-mono">{regNumber}</span>) and collect your{' '}
                      <strong>Current Semester Timetable</strong> for Admin verification.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          A. Scan Student ID Card
                        </span>
                        <button
                          type="button"
                          onClick={handleLoadSampleIdCard}
                          className="px-2.5 py-1 rounded-lg bg-[#84CC16]/30 text-[#3F6212] dark:text-[#BEF264] text-[11px] font-bold"
                        >
                          Auto-Scan Sample ID
                        </button>
                      </div>

                      {idCardImage ? (
                        <div className="space-y-2">
                          <div className="rounded-xl overflow-hidden border border-[#84CC16] bg-zinc-900 h-36 flex items-center justify-center">
                            <img
                              src={idCardImage}
                              alt="Student ID"
                              referrerPolicy="no-referrer"
                              className="h-full w-auto object-contain"
                            />
                          </div>
                          {idScanVerified && (
                            <p className="text-[11px] font-mono font-bold text-[#4D7C0F] dark:text-[#A3E635]">
                              ✓ OCR Match: {fullName} · {regNumber}
                            </p>
                          )}
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-36 p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-[#84CC16] bg-white dark:bg-zinc-900 text-center">
                          <Camera className="w-5 h-5 text-zinc-400 mb-1.5" />
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Upload / Scan Student ID
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleIdFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>

                    <div className="p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                          B. Current Semester Timetable
                        </span>
                        <button
                          type="button"
                          onClick={handleLoadSampleTimetable}
                          className="px-2.5 py-1 rounded-lg bg-[#84CC16]/30 text-[#3F6212] dark:text-[#BEF264] text-[11px] font-bold"
                        >
                          Load Sample Timetable
                        </button>
                      </div>

                      {timetableImage ? (
                        <div className="space-y-2">
                          <div className="rounded-xl overflow-hidden border border-[#84CC16] bg-zinc-900 h-36 flex items-center justify-center">
                            <img
                              src={timetableImage}
                              alt="Current Semester Timetable"
                              referrerPolicy="no-referrer"
                              className="h-full w-auto object-contain"
                            />
                          </div>
                          <p className="text-[11px] font-mono font-bold text-[#4D7C0F] dark:text-[#A3E635]">
                            ✓ Final Proof Attached (Accessible by Admin)
                          </p>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center h-36 p-4 border-2 border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl cursor-pointer hover:border-[#84CC16] bg-white dark:bg-zinc-900 text-center">
                          <Calendar className="w-5 h-5 text-zinc-400 mb-1.5" />
                          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                            Upload Current Semester Timetable
                          </span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleTimetableFileChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 h-12 rounded-xl border border-zinc-300 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex items-center gap-1.5"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>
                    <button
                      type="submit"
                      disabled={isVerifying}
                      className="flex-1 h-12 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                    >
                      <ShieldCheck className="w-4 h-4" />
                      <span>
                        {isVerifying
                          ? 'Verifying ID & Timetable...'
                          : 'Complete Verification & Enter Student App'}
                      </span>
                    </button>
                  </div>
                </form>
              )}
            </>
          )}

          {/* ================================================================
              PORTAL 2: VENUE PERSON SIGN-IN (ONLY ACCOUNTS CREATED BY ADMIN)
             ================================================================ */}
          {authPortalType === 'VENUE_PERSON' && (
            <form onSubmit={handleVenuePersonSignIn} className="space-y-5">
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  Venue Person Sign-In
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Only Venue Person accounts created by the <strong>Main Admin</strong> can sign in here to access their assigned Venue Dashboard, view live paid students, upload collateral, and record business history.
                </p>
              </div>

              {/* Select from Admin-Created Venue Person Accounts for fast testing */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 block">
                  Quick-Fill Admin-Created Venue Person Account:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {venuePersons.map((vp) => (
                    <button
                      key={vp.id}
                      type="button"
                      onClick={() => {
                        setVpEmailOrCode(vp.email);
                        setVpAccessPin(vp.accessPin);
                      }}
                      className={`p-3 rounded-xl border text-left transition-all ${
                        vpEmailOrCode === vp.email
                          ? 'border-[#84CC16] bg-[#84CC16]/15 font-bold'
                          : 'border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                      <p className="text-xs text-zinc-900 dark:text-white truncate">
                        {vp.fullName}
                      </p>
                      <p className="text-[11px] font-mono text-[#4D7C0F] dark:text-[#A3E635]">
                        {vp.staffCode} · PIN: {vp.accessPin}
                      </p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Venue Person Email or Staff Code (Created by Admin)
                  </label>
                  <input
                    type="text"
                    required
                    value={vpEmailOrCode}
                    onChange={(e) => setVpEmailOrCode(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">
                    Venue Access PIN
                  </label>
                  <input
                    type="text"
                    required
                    value={vpAccessPin}
                    onChange={(e) => setVpAccessPin(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying}
                className="w-full h-12 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <Lock className="w-4 h-4" />
                <span>Sign In to Assigned Venue Dashboard</span>
              </button>
            </form>
          )}

          {/* ================================================================
              PORTAL 3: MAIN ADMIN AUTHORITY SIGN-IN
             ================================================================ */}
          {authPortalType === 'MAIN_ADMIN' && (
            <form onSubmit={handleMainAdminSignIn} className="space-y-5">
              <div className="space-y-1">
                <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
                  Main Admin Authority Sign-In
                </h1>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  The Main Admin has exclusive authority to create Venue Person accounts, audit all Successful &amp; Failed business history, and inspect Student ID + Semester Timetable proofs.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">
                  Main Admin Authority Key
                </label>
                <input
                  type="text"
                  required
                  value={adminMasterKey}
                  onChange={(e) => setAdminMasterKey(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-sm font-mono"
                />
              </div>

              <button
                type="submit"
                className="w-full h-12 rounded-xl bg-[#84CC16] hover:bg-[#65A30D] text-zinc-950 hover:text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Enter Main Admin Authority Console</span>
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="text-center text-xs text-zinc-400 py-2">
        Lennder 3-Portal Architecture · Student App · Venue Person Portal · Main Admin Authority
      </div>
    </div>
  );
};
