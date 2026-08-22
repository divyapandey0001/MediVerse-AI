import React, { useState, useEffect } from 'react';
import {
  Lock,
  Mail,
  User,
  Phone,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ShieldCheck,
  Stethoscope,
  UserCheck,
  Building2,
  Award,
  Calendar,
  HeartPulse,
  FileCheck,
  RefreshCw,
  Send,
  Clock,
  HelpCircle,
  LogOut,
  Check,
  Info,
  ShieldAlert,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types.js';
import { SEOHead } from '../components/SEOHead.js';

interface AuthPageProps {
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { login, loginWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await login(email.trim(), password);
    setIsLoading(false);

    if (res.success && res.user) {
      if (res.user.emailVerified === false) {
        onNavigate('email-verification');
      } else if (res.user.role === 'doctor' || res.user.role === 'pending_doctor') {
        onNavigate('doctor-dashboard');
      } else {
        onNavigate('patient-dashboard');
      }
    } else {
      setError(res.error || 'Invalid credentials.');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setError(null);
    const res = await loginWithGoogle('patient');
    setIsGoogleLoading(false);
    if (res.success && res.user) {
      if (res.user.emailVerified === false) {
        onNavigate('email-verification');
      } else if (res.user.role === 'doctor' || res.user.role === 'pending_doctor') {
        onNavigate('doctor-dashboard');
      } else {
        onNavigate('patient-dashboard');
      }
    } else {
      setError(res.error || 'Google Sign-In failed.');
    }
  };


  return (
    <div id="login-page" className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6">
      <SEOHead
        title="Log In | MediVerse AI Healthcare Portal"
        description="Secure sign-in for patient and physician medical portals."
        canonicalPath="/login"
        noIndex={true}
      />
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-600/20">
            <Lock className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Log in to MediVerse
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Secure portal for Patients and Clinical Doctors
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigate('forgot-password')}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot Password?
              </button>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In with Email'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-xs text-slate-400 font-medium uppercase tracking-wider absolute">Or continue with</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={isLoading || isGoogleLoading}
          className="w-full py-3 rounded-xl border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-medium text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isGoogleLoading ? 'Connecting to Google...' : 'Sign In with Google (Firebase)'}</span>
        </button>


        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 space-y-2">
          <p>
            Don't have an account?{' '}
            <button
              onClick={() => onNavigate('signup')}
              className="text-blue-600 font-bold hover:underline"
            >
              Register as Patient or Doctor
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export const SignUpPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { signup, loginWithGoogle } = useAuth();

  const [role, setRole] = useState<UserRole>('patient');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Patient specific fields
  const [age, setAge] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [bloodGroup, setBloodGroup] = useState('');
  const [allergies, setAllergies] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');

  // Doctor specific fields
  const [specialty, setSpecialty] = useState('General Medicine');
  const [qualification, setQualification] = useState('MD');
  const [department, setDepartment] = useState('General Practice');
  const [licenseNumber, setLicenseNumber] = useState('');
  const [hospitalAffiliation, setHospitalAffiliation] = useState('');

  const [agreeTerms, setAgreeTerms] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleSignUp = async () => {
    setIsGoogleLoading(true);
    setError(null);
    const res = await loginWithGoogle(role);
    setIsGoogleLoading(false);
    if (res.success && res.user) {
      if (res.user.emailVerified === false) {
        onNavigate('email-verification');
      } else if (res.user.role === 'doctor' || res.user.role === 'pending_doctor') {
        onNavigate('doctor-dashboard');
      } else {
        onNavigate('patient-dashboard');
      }
    } else {
      setError(res.error || 'Google Sign-Up failed.');
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Please provide your name, email, and password.');
      return;
    }
    // Validate password
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password) || !/[^A-Za-z0-9]/.test(password)) {
      setError('Password must include uppercase, lowercase, numbers, and special characters (!@#$%).');
      return;
    }
    if (!agreeTerms) {
      setError('Please acknowledge the clinical and educational terms of service.');
      return;
    }

    if (role === 'doctor' && !licenseNumber.trim()) {
      setError('Please enter your Medical License or Registration Number.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const res = await signup({
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      phone: phone.trim() || undefined,
      age: age ? Number(age) : undefined,
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || undefined,
      bloodGroup: bloodGroup || undefined,
      allergies: allergies.trim() || undefined,
      emergencyContact: emergencyContact.trim() || undefined,
      specialty: role === 'doctor' ? specialty : undefined,
      qualification: role === 'doctor' ? qualification : undefined,
      department: role === 'doctor' ? department : undefined,
      licenseNumber: role === 'doctor' ? licenseNumber.trim() : undefined,
      hospitalAffiliation: role === 'doctor' ? hospitalAffiliation.trim() : undefined
    });

    setIsLoading(false);

    if (res.success && res.user) {
      if (res.user.emailVerified === false) {
        onNavigate('email-verification');
      } else if (res.user.role === 'doctor' || res.user.role === 'pending_doctor') {
        onNavigate('doctor-dashboard');
      } else {
        onNavigate('patient-dashboard');
      }
    } else {
      setError(res.error || 'Registration failed.');
    }
  };

  return (
    <div id="signup-page" className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6">
      <SEOHead
        title="Create an Account | MediVerse AI Healthcare Portal"
        description="Patient and clinical provider registration for MediVerse healthcare system."
        canonicalPath="/signup"
        noIndex={true}
      />
      <div className="max-w-2xl w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-600/20">
            {role === 'doctor' ? <Stethoscope className="w-6 h-6" /> : <User className="w-6 h-6" />}
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Create MediVerse Account
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Select your account type to proceed with tailored healthcare access
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
          <button
            type="button"
            onClick={() => setRole('patient')}
            className={`flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              role === 'patient'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-4 h-4 text-blue-600" />
            <span>I am a Patient</span>
          </button>

          <button
            type="button"
            onClick={() => setRole('doctor')}
            className={`flex items-center justify-center gap-2.5 py-3 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              role === 'doctor'
                ? 'bg-white text-blue-700 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Stethoscope className="w-4 h-4 text-blue-600" />
            <span>I am a Doctor / Physician</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                {role === 'doctor' ? 'Full Name with Title' : 'Full Name'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={role === 'doctor' ? 'Dr. Sarah Connor, MD' : 'Jane Doe'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Email Address <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder={role === 'doctor' ? 'doctor@hospital.org' : 'name@example.com'}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                  required
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-slate-700">
                  Password <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] text-slate-400">8+ chars, Aa, 123, !@#</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters with symbol"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                  required
                  minLength={8}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">Phone Number</label>
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>
            </div>
          </div>

          {/* Doctor-Specific Fields */}
          {role === 'doctor' ? (
            <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-100 space-y-4">
              <div className="flex items-center gap-2 text-blue-900 font-semibold text-xs uppercase tracking-wider">
                <Award className="w-4 h-4 text-blue-600" />
                <span>Doctor Credentials & Practice</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Specialty</label>
                  <select
                    value={specialty}
                    onChange={e => setSpecialty(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-blue-600"
                  >
                    <option value="General Medicine">General Medicine</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Neurology">Neurology</option>
                    <option value="Pediatrics">Pediatrics</option>
                    <option value="Orthopedics">Orthopedics</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="Pulmonology">Pulmonology</option>
                    <option value="Gastroenterology">Gastroenterology</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Qualification</label>
                  <input
                    type="text"
                    value={qualification}
                    onChange={e => setQualification(e.target.value)}
                    placeholder="e.g. MD, MBBS, FACC"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    License / Registration Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={e => setLicenseNumber(e.target.value)}
                    placeholder="e.g. MED-849201"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-blue-600"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Hospital / Clinic Affiliation</label>
                  <input
                    type="text"
                    value={hospitalAffiliation}
                    onChange={e => setHospitalAffiliation(e.target.value)}
                    placeholder="e.g. St. Jude Memorial Hospital"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-blue-600"
                  />
                </div>
              </div>
            </div>
          ) : (
            /* Patient-Specific Fields */
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2 text-slate-800 font-semibold text-xs uppercase tracking-wider">
                <HeartPulse className="w-4 h-4 text-blue-600" />
                <span>Patient Health Record Details</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Age</label>
                  <input
                    type="number"
                    value={age}
                    onChange={e => setAge(e.target.value)}
                    placeholder="e.g. 32"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Gender</label>
                  <select
                    value={gender}
                    onChange={e => setGender(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="">Select Gender</option>
                    <option value="Female">Female</option>
                    <option value="Male">Male</option>
                    <option value="Other">Other</option>
                    <option value="Prefer not to say">Prefer not to say</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Blood Group</label>
                  <select
                    value={bloodGroup}
                    onChange={e => setBloodGroup(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  >
                    <option value="">Select Blood Group</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Known Allergies</label>
                  <input
                    type="text"
                    value={allergies}
                    onChange={e => setAllergies(e.target.value)}
                    placeholder="e.g. Penicillin, Peanuts (or None)"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Emergency Contact</label>
                  <input
                    type="text"
                    value={emergencyContact}
                    onChange={e => setEmergencyContact(e.target.value)}
                    placeholder="e.g. John Doe - (555) 234-5678"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="pt-2">
            <label className="flex items-start gap-2 cursor-pointer text-xs text-slate-600 select-none">
              <input
                type="checkbox"
                checked={agreeTerms}
                onChange={e => setAgreeTerms(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 mt-0.5"
              />
              <span>
                I agree to the MediVerse Healthcare Terms of Use and Privacy Policy. I acknowledge that medical analysis provided by AI is for educational reference only.
              </span>
            </label>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isGoogleLoading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{isLoading ? 'Creating Profile...' : `Register with Email as ${role === 'doctor' ? 'Doctor' : 'Patient'}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-slate-200 w-full" />
          <span className="bg-white px-3 text-xs text-slate-400 font-medium uppercase tracking-wider absolute">Or register with</span>
        </div>

        <button
          type="button"
          onClick={handleGoogleSignUp}
          disabled={isLoading || isGoogleLoading}
          className="w-full py-3 rounded-xl border border-slate-300 hover:bg-slate-50 disabled:opacity-50 text-slate-700 font-medium text-sm flex items-center justify-center gap-3 transition-all cursor-pointer shadow-xs"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          <span>{isGoogleLoading ? 'Connecting to Google...' : `Sign Up with Google (${role === 'doctor' ? 'Doctor' : 'Patient'})`}</span>
        </button>


        <div className="pt-4 border-t border-slate-100 text-center text-xs text-slate-500 space-y-2">
          <p>
            Already have an account?{' '}
            <button
              onClick={() => onNavigate('login')}
              className="text-blue-600 font-bold hover:underline"
            >
              Sign In
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export const ForgotPasswordPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setStatusMsg(null);

    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMsg(data.message);
      } else {
        setError(data.error || 'Failed to request password reset.');
      }
    } catch (err: any) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="forgot-password-page" className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6">
      <SEOHead
        title="Reset Password | MediVerse AI Healthcare Portal"
        description="Password recovery for MediVerse users."
        canonicalPath="/forgot-password"
        noIndex={true}
      />
      <div className="max-w-md w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-md shadow-blue-600/20">
            <KeyRound className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Reset Password
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Enter your email to receive password reset instructions
          </p>
        </div>

        {statusMsg ? (
          <div className="text-center space-y-4 py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-sm text-slate-700 font-medium">{statusMsg}</p>
            <button
              onClick={() => onNavigate('login')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 cursor-pointer"
            >
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700">
                Registered Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <span>{isSubmitting ? 'Sending Request...' : 'Send Reset Link'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => onNavigate('login')}
                className="text-xs text-blue-600 hover:underline font-medium cursor-pointer"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export const EmailVerificationPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { user, resendVerificationEmail, verifyEmailStatus, logout } = useAuth();
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState<number>(0);
  const [statusBanner, setStatusBanner] = useState<{ type: 'success' | 'warning' | 'info' | 'error'; message: string } | null>(null);
  const [isVerifiedSuccess, setIsVerifiedSuccess] = useState(false);

  // Cooldown timer effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // If user is already verified, guide them to their dashboard
  useEffect(() => {
    if (user && user.emailVerified !== false && !isVerifiedSuccess) {
      if (user.role === 'doctor' || user.role === 'pending_doctor') {
        onNavigate('doctor-dashboard');
      } else {
        onNavigate('patient-dashboard');
      }
    }
  }, [user, onNavigate, isVerifiedSuccess]);

  const handleCheckVerification = async () => {
    setIsChecking(true);
    setStatusBanner(null);

    const result = await verifyEmailStatus();
    setIsChecking(false);

    if (result.isVerified) {
      setIsVerifiedSuccess(true);
      setStatusBanner({
        type: 'success',
        message: 'Email address successfully verified! Unlocking your MediVerse medical portal...'
      });
      setTimeout(() => {
        const targetRole = result.user?.role || user?.role;
        if (targetRole === 'doctor' || targetRole === 'pending_doctor') {
          onNavigate('doctor-dashboard');
        } else {
          onNavigate('patient-dashboard');
        }
      }, 1200);
    } else {
      setStatusBanner({
        type: 'warning',
        message: 'Email not verified yet. Please open your email inbox, click the verification link sent by Firebase, and then click this button again.'
      });
    }
  };

  const handleResendEmail = async () => {
    if (cooldown > 0) return;
    setIsResending(true);
    setStatusBanner(null);

    const res = await resendVerificationEmail();
    setIsResending(false);

    if (res.success) {
      setCooldown(60);
      setStatusBanner({
        type: 'success',
        message: res.message || 'A fresh verification email has been dispatched to your inbox. Please check your email and spam folder.'
      });
    } else {
      setStatusBanner({
        type: 'error',
        message: res.error || 'Failed to resend verification email. Please try again in a few moments.'
      });
    }
  };

  const handleLogoutAndSwitch = async () => {
    await logout();
    onNavigate('login');
  };

  const displayEmail = user?.email || 'your registered email';

  return (
    <div id="email-verification-page" className="min-h-[85vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6">
      <SEOHead
        title="Verify Your Email | MediVerse AI Healthcare Portal"
        description="Verify your email address to access your medical records and clinical portal."
        canonicalPath="/email-verification"
        noIndex={true}
      />
      <div className="max-w-xl w-full bg-white rounded-3xl p-8 sm:p-10 border border-slate-200 shadow-sm space-y-6">
        
        {/* Verification Icon Header */}
        <div className="text-center space-y-3">
          <div className="relative w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center mx-auto shadow-sm">
            <Mail className="w-8 h-8 text-blue-600" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs">
              !
            </span>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-xs font-semibold">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>Firebase Email Verification Pending</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Please verify your email address to continue.
          </h1>
          
          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            We sent a verification link to your registered email address via Firebase Authentication. 
            Confirming your email protects your medical records and privacy.
          </p>
        </div>

        {/* Email Box Banner */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto overflow-hidden">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4" />
            </div>
            <div className="truncate text-left">
              <span className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Target Email Address
              </span>
              <span className="text-sm font-bold text-slate-900 font-mono truncate block">
                {displayEmail}
              </span>
            </div>
          </div>

          <span className="shrink-0 px-2.5 py-1 bg-amber-100 text-amber-800 rounded-lg text-xs font-bold uppercase tracking-wider">
            Unverified
          </span>
        </div>

        {/* Doctor Portal Notice if applicable */}
        {(user?.role === 'pending_doctor' || user?.role === 'doctor') && (
          <div className="p-3.5 bg-blue-50 border border-blue-200 text-blue-900 rounded-2xl text-xs space-y-1">
            <div className="flex items-center gap-2 font-bold text-blue-800">
              <Stethoscope className="w-4 h-4 text-blue-600" />
              <span>Physician Account Step 1 of 2</span>
            </div>
            <p className="text-blue-700 leading-relaxed">
              Email verification must be completed first. Once your email is confirmed, your Medical License credentials will be evaluated by the MediVerse Medical Review Board.
            </p>
          </div>
        )}

        {/* Status / Feedback Banner */}
        {statusBanner && (
          <div
            className={`p-4 rounded-2xl text-xs flex items-start gap-3 animate-fadeIn ${
              statusBanner.type === 'success'
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                : statusBanner.type === 'warning'
                ? 'bg-amber-50 border border-amber-200 text-amber-800'
                : statusBanner.type === 'error'
                ? 'bg-red-50 border border-red-200 text-red-800'
                : 'bg-blue-50 border border-blue-200 text-blue-800'
            }`}
          >
            {statusBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : statusBanner.type === 'warning' ? (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <span className="leading-relaxed">{statusBanner.message}</span>
          </div>
        )}

        {/* Primary Action Buttons */}
        <div className="space-y-3 pt-2">
          {/* Refresh / Check Verification Status */}
          <button
            type="button"
            id="refresh-verification-status-btn"
            onClick={handleCheckVerification}
            disabled={isChecking || isVerifiedSuccess}
            className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 active:scale-98 disabled:opacity-50 text-white font-bold text-sm rounded-2xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2.5 transition-all cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin' : ''}`} />
            <span>
              {isChecking
                ? 'Checking Firebase Verification...'
                : isVerifiedSuccess
                ? 'Email Verified! Opening Portal...'
                : 'Refresh / I’ve Verified My Email'}
            </span>
          </button>

          {/* Resend Verification Email Button */}
          <button
            type="button"
            id="resend-verification-email-btn"
            onClick={handleResendEmail}
            disabled={isResending || cooldown > 0 || isVerifiedSuccess}
            className="w-full py-3 px-4 bg-white hover:bg-slate-50 border border-slate-300 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 font-semibold text-sm rounded-2xl shadow-2xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Send className="w-4 h-4 text-slate-500" />
            <span>
              {isResending
                ? 'Sending Email...'
                : cooldown > 0
                ? `Resend Available in ${cooldown}s`
                : 'Resend Verification Email'}
            </span>
          </button>
        </div>

        {/* Informational Guidance / Troubleshooting Box */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-slate-700">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <span>Troubleshooting & Verification Tips</span>
          </div>
          <ul className="space-y-1.5 text-slate-600 list-disc list-inside">
            <li>
              <strong className="text-slate-800">Check Spam & Junk folders:</strong> If the email is not in your inbox, search for emails from MediVerse AI / Firebase.
            </li>
            <li>
              <strong className="text-slate-800">Expired or invalid link:</strong> Verification links are time-limited for security. If the link expired, click <em>Resend Verification Email</em> above.
            </li>
            <li>
              <strong className="text-slate-800">Direct Link Verification:</strong> Once you click the link in your email inbox, return here and press <em>Refresh / I've Verified My Email</em>.
            </li>
          </ul>
        </div>

        {/* Footer Actions / Sign Out & Switch Account */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <button
            type="button"
            onClick={() => onNavigate('home')}
            className="text-slate-600 hover:text-blue-600 font-medium transition-colors cursor-pointer"
          >
            Return to Homepage
          </button>

          <button
            type="button"
            id="switch-account-logout-btn"
            onClick={handleLogoutAndSwitch}
            className="flex items-center gap-1.5 text-red-600 hover:text-red-700 font-semibold transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Entered Wrong Email? Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

