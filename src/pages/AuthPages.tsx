import React, { useState } from 'react';
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
  FileCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { UserRole } from '../types.js';

interface AuthPageProps {
  onNavigate: (page: string) => void;
}

export const LoginPage: React.FC<AuthPageProps> = ({ onNavigate }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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
      if (res.user.role === 'doctor') {
        onNavigate('doctor-dashboard');
      } else {
        onNavigate('patient-dashboard');
      }
    } else {
      setError(res.error || 'Invalid credentials.');
    }
  };

  return (
    <div id="login-page" className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6">
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
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{isLoading ? 'Signing In...' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

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
  const { signup } = useAuth();

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
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password) {
      setError('Please provide your name, email, and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
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
      if (res.user.role === 'doctor') {
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
              <label className="block text-xs font-semibold text-slate-700">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                  required
                  minLength={6}
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
            disabled={isLoading}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <span>{isLoading ? 'Creating Profile...' : `Register as ${role === 'doctor' ? 'Doctor' : 'Patient'}`}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

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
