import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  Mail,
  Stethoscope,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  FileText,
  Building,
  ArrowRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { Doctor, Appointment } from '../types.js';
import { DisclaimerBanner } from '../components/DisclaimerBanner.js';
import { SEOHead } from '../components/SEOHead.js';

interface AppointmentPageProps {
  onNavigate: (page: string) => void;
}

export const AppointmentPage: React.FC<AppointmentPageProps> = ({ onNavigate }) => {
  const { user, token } = useAuth();

  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);

  // Booking Form State
  const [patientName, setPatientName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [specialty, setSpecialty] = useState('');
  const [selectedDoctor, setSelectedDoctor] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [reason, setReason] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmedAppt, setConfirmedAppt] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Admin add doctor modal state
  const [showAddDoctorModal, setShowAddDoctorModal] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocSpecialty, setNewDocSpecialty] = useState('');
  const [newDocDept, setNewDocDept] = useState('');
  const [newDocExp, setNewDocExp] = useState('');

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoadingDoctors(true);
      const res = await fetch('/api/doctors');
      const data = await res.json();
      if (res.ok) {
        setDoctors(data.doctors || []);
        if (data.doctors && data.doctors.length > 0 && !selectedDoctor) {
          setSelectedDoctor(data.doctors[0].name);
          setSpecialty(data.doctors[0].specialty);
        }
      }
    } catch (err) {
      console.error('Failed to fetch doctors:', err);
    } finally {
      setLoadingDoctors(false);
    }
  };

  const handleDoctorSelect = (docName: string) => {
    setSelectedDoctor(docName);
    const doc = doctors.find(d => d.name === docName);
    if (doc) {
      setSpecialty(doc.specialty);
    }
  };

  const handleBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!patientName.trim() || !email.trim() || !phone.trim() || !selectedDoctor || !appointmentDate || !appointmentTime) {
      setError('Please fill in all required appointment fields.');
      return;
    }

    setIsSubmitting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          patientName,
          email,
          phone,
          specialty: specialty || 'General Consultation',
          doctorName: selectedDoctor,
          appointmentDate,
          appointmentTime,
          reason
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to book appointment.');
      }

      setConfirmedAppt(data.appointment);
    } catch (err: any) {
      console.error('Appointment booking error:', err);
      setError(err.message || 'Could not schedule appointment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDocName.trim() || !newDocSpecialty.trim() || !newDocDept.trim()) return;

    try {
      const res = await fetch('/api/doctors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newDocName.trim(),
          specialty: newDocSpecialty.trim(),
          department: newDocDept.trim(),
          experience: newDocExp.trim() || '5+ years'
        })
      });
      if (res.ok) {
        await fetchDoctors();
        setShowAddDoctorModal(false);
        setNewDocName('');
        setNewDocSpecialty('');
        setNewDocDept('');
        setNewDocExp('');
      }
    } catch (err) {
      console.error('Failed to add doctor:', err);
    }
  };

  return (
    <div id="appointment-page" className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <SEOHead
        title="Schedule a Doctor Appointment & Clinical Consultation | MediVerse AI"
        description="Book a medical consultation with certified healthcare specialists across Cardiology, General Practice, Neurology, and Pediatrics directly on MediVerse."
        canonicalPath="/appointment"
        keywords="doctor appointment, schedule consultation, medical specialist booking, clinic appointment online, health consultation"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Doctor Appointment Booking",
          "description": "Schedule consultations with verified medical specialists.",
          "url": "https://medi-verse-ai-wine.vercel.app/appointment"
        }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
            <span>Clinical Scheduling Portal</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Schedule a Doctor Appointment
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Book a clinical consultation with registered specialty departments. Validated directly with our scheduling backend.
          </p>
        </div>

        {/* Confirmation State */}
        {confirmedAppt ? (
          <div id="appointment-confirmation-card" className="bg-white rounded-2xl p-6 sm:p-10 border border-emerald-200 shadow-sm space-y-6 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold text-slate-900">Appointment Confirmed!</h2>
              <p className="text-slate-600 text-sm">
                Your consultation has been scheduled in the MediVerse clinical database.
              </p>
              <div className="inline-block bg-slate-100 px-4 py-1.5 rounded-lg font-mono font-bold text-slate-800 text-sm mt-2">
                Booking ID: {confirmedAppt.appointmentCode}
              </div>
            </div>

            {/* Details Summary */}
            <div className="bg-slate-50 rounded-xl p-5 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-slate-500">Patient Name</p>
                <p className="font-semibold text-slate-900">{confirmedAppt.patientName}</p>
              </div>
              <div>
                <p className="text-slate-500">Doctor / Department</p>
                <p className="font-semibold text-slate-900">{confirmedAppt.doctorName}</p>
                <p className="text-xs text-blue-600">{confirmedAppt.specialty}</p>
              </div>
              <div>
                <p className="text-slate-500">Date & Time</p>
                <p className="font-semibold text-slate-900">
                  {confirmedAppt.appointmentDate} at {confirmedAppt.appointmentTime}
                </p>
              </div>
              <div>
                <p className="text-slate-500">Contact Information</p>
                <p className="font-semibold text-slate-900">{confirmedAppt.phone}</p>
                <p className="text-xs text-slate-500">{confirmedAppt.email}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={() => onNavigate('profile')}
                className="flex-1 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm transition-all"
              >
                View in Health Profile
              </button>
              <button
                onClick={() => setConfirmedAppt(null)}
                className="py-3 px-5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium"
              >
                Book Another Appointment
              </button>
            </div>
          </div>
        ) : (
          /* Booking Form */
          <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <form onSubmit={handleBooking} className="space-y-6">
              {/* Doctor / Specialty Selection */}
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                    <Stethoscope className="w-4 h-4 text-blue-600" />
                    <span>1. Select Doctor & Department</span>
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowAddDoctorModal(true)}
                    className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add New Doctor</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Doctor <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={selectedDoctor}
                      onChange={e => handleDoctorSelect(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:border-blue-600"
                      required
                    >
                      {doctors.map(d => (
                        <option key={d.id} value={d.name}>
                          {d.name} — {d.department}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Department / Specialty
                    </label>
                    <input
                      type="text"
                      value={specialty}
                      onChange={e => setSpecialty(e.target.value)}
                      placeholder="e.g. Internal Medicine"
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                      required
                    >
                    </input>
                  </div>
                </div>
              </div>

              {/* Schedule Date & Time */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>2. Select Consultation Date & Time</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={appointmentDate}
                      onChange={e => setAppointmentDate(e.target.value)}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:border-blue-600"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Time Slot <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={appointmentTime}
                      onChange={e => setAppointmentTime(e.target.value)}
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:border-blue-600"
                      required
                    >
                      <option value="">Select Time Slot</option>
                      <option value="09:00 AM">09:00 AM</option>
                      <option value="10:00 AM">10:00 AM</option>
                      <option value="11:30 AM">11:30 AM</option>
                      <option value="02:00 PM">02:00 PM</option>
                      <option value="03:30 PM">03:30 PM</option>
                      <option value="04:30 PM">04:30 PM</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Patient Details */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>3. Patient Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={patientName}
                      onChange={e => setPatientName(e.target.value)}
                      placeholder="e.g. Jane Doe"
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="e.g. jane@example.com"
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder="e.g. +1 (555) 234-5678"
                      className="w-full p-3.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Reason for Appointment / Symptoms
                  </label>
                  <textarea
                    value={reason}
                    onChange={e => setReason(e.target.value)}
                    placeholder="Briefly state your concern, recent symptoms, or routine checkup goals..."
                    rows={2}
                    className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                  />
                </div>
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
              >
                <Calendar className="w-4 h-4" />
                <span>{isSubmitting ? 'Scheduling Appointment...' : 'Confirm Appointment'}</span>
              </button>
            </form>
          </div>
        )}

        {/* Modal: Add Doctor (Clinical Admin System) */}
        {showAddDoctorModal && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200">
              <h3 className="text-lg font-bold text-slate-900">Add Clinical Doctor</h3>
              <p className="text-xs text-slate-500">
                Register a new physician or specialist into the MediVerse scheduling directory.
              </p>

              <form onSubmit={handleAddDoctor} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Doctor Name
                  </label>
                  <input
                    type="text"
                    value={newDocName}
                    onChange={e => setNewDocName(e.target.value)}
                    placeholder="e.g. Dr. Robert King, MD"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={newDocDept}
                    onChange={e => setNewDocDept(e.target.value)}
                    placeholder="e.g. Dermatology"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Specialty Title
                  </label>
                  <input
                    type="text"
                    value={newDocSpecialty}
                    onChange={e => setNewDocSpecialty(e.target.value)}
                    placeholder="e.g. Clinical & Surgical Dermatology"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Experience (Optional)
                  </label>
                  <input
                    type="text"
                    value={newDocExp}
                    onChange={e => setNewDocExp(e.target.value)}
                    placeholder="e.g. 10 years"
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-sm"
                  />
                </div>

                <div className="flex gap-2 pt-3">
                  <button
                    type="submit"
                    className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700"
                  >
                    Save Doctor
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddDoctorModal(false)}
                    className="px-4 py-2.5 border border-slate-300 text-slate-700 rounded-lg text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <DisclaimerBanner />
      </div>
    </div>
  );
};
