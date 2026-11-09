import React, { useState } from 'react';
import {
  X,
  Upload,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Building2,
  UserCheck,
  FileCheck2,
} from 'lucide-react';
import type { StudentProfile } from '../types/lennder.ts';
import {
  registerAndVerifyStudent,
  generateSampleStudentIdDataUri,
} from '../services/lennderApi.ts';
import { auth, googleAuthProvider } from '../lib/firebase.ts';
import { signInWithPopup } from 'firebase/auth';

interface StudentOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStudent: StudentProfile;
  onVerified: (student: StudentProfile) => void;
}

const SUPPORTED_INSTITUTIONS = [
  'University of Uyo (UNIUYO)',
  'Akwa Ibom State University (AKSU)',
  'Federal University of Technology, Ikot Abasi (FUTIA)',
  'Heritage Polytechnic, Eket',
  'University of Lagos (UNILAG)',
  'University of Calabar (UNICAL)',
  'Covenant University (CU)',
  'Obafemi Awolowo University (OAU)',
];

const FACULTIES = [
  'Faculty of Science',
  'Faculty of Engineering',
  'Faculty of Basic Medical Sciences',
  'Faculty of Pharmacy',
  'Faculty of Agriculture',
  'Faculty of Computing & Information Tech',
  'Faculty of Environmental Studies',
];

const LEVELS = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level', '600 Level'];

export const StudentOnboardingModal: React.FC<StudentOnboardingModalProps> = ({
  isOpen,
  onClose,
  currentStudent,
  onVerified,
}) => {
  const [institution, setInstitution] = useState(
    currentStudent?.institution || SUPPORTED_INSTITUTIONS[0]
  );
  const [fullName, setFullName] = useState(currentStudent?.fullName || '');
  const [regNumber, setRegNumber] = useState(currentStudent?.regNumber || '');
  const [faculty, setFaculty] = useState(currentStudent?.faculty || FACULTIES[0]);
  const [department, setDepartment] = useState(currentStudent?.department || '');
  const [level, setLevel] = useState(currentStudent?.level || '300 Level');
  const [phone, setPhone] = useState(currentStudent?.phone || '+234 ');
  const [email, setEmail] = useState(currentStudent?.email || '');
  const [uid, setUid] = useState(currentStudent?.uid || '');
  const [idCardPreview, setIdCardPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [googleAuthStatus, setGoogleAuthStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      if (result.user) {
        if (result.user.displayName) setFullName(result.user.displayName);
        if (result.user.email) setEmail(result.user.email);
        setUid(result.user.uid);
        setGoogleAuthStatus(`Linked Google Account: ${result.user.email}`);
      }
    } catch (err: any) {
      // In preview sandbox iframes if popup is blocked or domain isn't whitelisted yet, provide graceful feedback
      setGoogleAuthStatus(
        'Continuing with direct Institutional Matric & Student ID Card verification.'
      );
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        setIdCardPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleGenerateSampleId = () => {
    const sampleName = fullName.trim() || 'Edidiong Ekpo';
    const sampleReg = regNumber.trim() || '23/SC/BC/098';
    const sampleDept = department.trim() || 'Biochemistry';
    if (!fullName.trim()) setFullName(sampleName);
    if (!regNumber.trim()) setRegNumber(sampleReg);
    if (!department.trim()) setDepartment(sampleDept);

    const uri = generateSampleStudentIdDataUri(
      sampleName,
      sampleReg,
      institution,
      sampleDept,
      level
    );
    setIdCardPreview(uri);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!fullName.trim() || !regNumber.trim() || !department.trim()) {
      setErrorMsg('Please fill in your Full Name, Reg/Matric Number, and Department.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { student } = await registerAndVerifyStudent({
        uid: uid || undefined,
        email: email || undefined,
        fullName,
        phone,
        institution,
        regNumber,
        faculty,
        department,
        level,
        studentIdCardImage: idCardPreview,
      });
      onVerified(student);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Verification failed. Please check your entries.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/60 backdrop-blur-sm p-0 sm:p-4 overflow-y-auto">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto max-h-[92vh] flex flex-col">
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Student Institution Verification
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              First-time campus authentication · Verified students unlock instant Stock Point &amp; P2P rentals
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto">
          {/* Optional Google Firebase Auth Link */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
            <div className="space-y-0.5">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                Step 1 · Link Student Account or Institutional Email
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {googleAuthStatus || 'Sync with Firebase Auth (leender-45106) or fill your matric details below'}
              </p>
            </div>
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="px-4 py-2.5 min-h-[44px] text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0"
            >
              Connect Google Account
            </button>
          </div>

          {errorMsg && (
            <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs font-medium text-red-700 dark:text-red-300">
              {errorMsg}
            </div>
          )}

          {/* Institution Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Choose Your Institution / University
            </label>
            <div className="relative">
              <select
                value={institution}
                onChange={(e) => setInstitution(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {SUPPORTED_INSTITUTIONS.map((inst) => (
                  <option key={inst} value={inst}>
                    {inst}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Full Name & Reg Number */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Student Full Legal Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Iniobong Udoh"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Registration / Matric Number
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 23/SC/CH/142"
                value={regNumber}
                onChange={(e) => setRegNumber(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Faculty, Department, Level */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Faculty / School
              </label>
              <select
                value={faculty}
                onChange={(e) => setFaculty(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {FACULTIES.map((fac) => (
                  <option key={fac} value={fac}>
                    {fac}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Department
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Biochemistry"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Current Level
              </label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
              >
                {LEVELS.map((lvl) => (
                  <option key={lvl} value={lvl}>
                    {lvl}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Active Campus Phone / WhatsApp Number (for SMS OTP &amp; Due Reminders)
            </label>
            <input
              type="tel"
              required
              placeholder="+234 810 554 2190"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-sm font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-600"
            />
          </div>

          {/* Student ID Card Scan Upload */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                  Student ID Card / Course Form Proof
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Scanned automatically by our server verifier; raw ID copy is never exposed to other users (NDPC compliant).
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerateSampleId}
                className="px-3 py-2 min-h-[40px] text-xs font-semibold rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0"
              >
                Use Sample Student ID Card
              </button>
            </div>

            {idCardPreview ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-900 max-h-48 flex items-center justify-center">
                  <img
                    src={idCardPreview}
                    alt="Uploaded Student ID Card"
                    referrerPolicy="no-referrer"
                    className="max-h-44 w-auto object-contain"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  <span>Student ID card ready for instant verification</span>
                  <button
                    type="button"
                    onClick={() => setIdCardPreview(null)}
                    className="underline hover:text-emerald-900"
                  >
                    Replace image
                  </button>
                </div>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center p-5 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:border-emerald-500 transition-colors">
                <Upload className="w-5 h-5 text-slate-400 mb-1.5" />
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  Upload or Capture Student ID Card Photo
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  PNG, JPG, or tap &ldquo;Use Sample Student ID Card&rdquo; above
                </span>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            )}
          </div>

          {/* Submit Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 min-h-[44px] rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors disabled:opacity-50 whitespace-nowrap"
            >
              {isSubmitting ? 'Verifying Student ID...' : 'Verify & Save Student Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
