import React, { useState, useEffect } from 'react';
import {
  Stethoscope,
  Users,
  Pill,
  Calendar,
  Search,
  Plus,
  FileText,
  Clock,
  ShieldCheck,
  Award,
  Building2,
  Download,
  AlertCircle,
  CheckCircle2,
  Eye,
  ChevronRight,
  ArrowLeft,
  Trash2,
  Send,
  UserCheck,
  HeartPulse,
  Activity,
  GitCompare,
  FileCheck,
  Crown,
  Zap
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { User, Prescription, ClinicalNote, Appointment, LabReportAnalysis, AuditLog } from '../types.js';
import { downloadPrescriptionPDF, downloadReportPDF, downloadHealthSummaryPDF } from '../utils/pdfExport.js';
import { SEOHead } from '../components/SEOHead.js';
import { DisclaimerBanner } from '../components/DisclaimerBanner.js';
import { SubscriptionModal } from '../components/SubscriptionModal.js';

interface DoctorDashboardProps {
  onNavigate: (page: string) => void;
}

export const DoctorDashboard: React.FC<DoctorDashboardProps> = ({ onNavigate }) => {
  const { user, token, refreshUser, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'roster' | 'prescribe' | 'notes' | 'appointments' | 'audit'>('roster');
  const [patients, setPatients] = useState<User[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusChecking, setStatusChecking] = useState<boolean>(false);
  const [approving, setApproving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Link Patient State
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkQuery, setLinkQuery] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkMsg, setLinkMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Patient Search in Roster
  const [patientSearch, setPatientSearch] = useState('');

  // Selected Patient for EHR View
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [patientEHRData, setPatientEHRData] = useState<{
    patient: User;
    reports: LabReportAnalysis[];
    prescriptions: Prescription[];
    clinicalNotes: ClinicalNote[];
  } | null>(null);
  const [loadingEHR, setLoadingEHR] = useState(false);

  // Prescription Writer Form State
  const [rxPatientId, setRxPatientId] = useState('');
  const [rxDiagnosis, setRxDiagnosis] = useState('');
  const [rxMedicines, setRxMedicines] = useState<
    Array<{ name: string; strength: string; frequency: string; duration: string; instructions: string }>
  >([{ name: '', strength: '', frequency: '1-0-1 (Twice Daily)', duration: '5 Days', instructions: 'After meals' }]);
  const [rxInstructions, setRxInstructions] = useState('');
  const [rxFollowUpDate, setRxFollowUpDate] = useState('');
  const [rxSubmitting, setRxSubmitting] = useState(false);
  const [rxSuccessMsg, setRxSuccessMsg] = useState<string | null>(null);
  const [rxError, setRxError] = useState<string | null>(null);

  // Clinical Note Form State
  const [notePatientId, setNotePatientId] = useState('');
  const [noteDiagnosis, setNoteDiagnosis] = useState('');
  const [noteObservations, setNoteObservations] = useState('');
  const [noteTreatmentPlan, setNoteTreatmentPlan] = useState('');
  const [showSubModal, setShowSubModal] = useState<boolean>(false);
  const [noteFollowUpDate, setNoteFollowUpDate] = useState('');
  const [noteSubmitting, setNoteSubmitting] = useState(false);
  const [noteSuccessMsg, setNoteSuccessMsg] = useState<string | null>(null);
  const [noteError, setNoteError] = useState<string | null>(null);

  const fetchDoctorData = async () => {
    if (!token || !user || user.role !== 'doctor') {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [patRes, rxRes, notesRes, apptRes, auditRes] = await Promise.all([
        fetch('/api/doctor/patients', { headers }),
        fetch('/api/prescriptions', { headers }),
        fetch('/api/clinical-notes', { headers }),
        fetch('/api/appointments', { headers }),
        fetch('/api/audit-logs', { headers })
      ]);

      if (patRes.ok) {
        const d = await patRes.json();
        setPatients(d.patients || []);
      }
      if (rxRes.ok) {
        const d = await rxRes.json();
        setPrescriptions(d.prescriptions || []);
      }
      if (notesRes.ok) {
        const d = await notesRes.json();
        setClinicalNotes(d.clinicalNotes || []);
      }
      if (apptRes.ok) {
        const d = await apptRes.json();
        setAppointments(d.appointments || []);
      }
      if (auditRes.ok) {
        const d = await auditRes.json();
        setAuditLogs(d.logs || []);
      }
    } catch (err) {
      console.error('Error fetching doctor dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctorData();
  }, [token, user?.role]);

  const handleCheckStatus = async () => {
    if (!token) return;
    setStatusChecking(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/doctor/verification-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        if (data.isVerified) {
          setStatusMessage('Doctor verification approved! Updating permissions...');
          await refreshUser();
        } else {
          setStatusMessage(`Status: ${data.verificationStatus || 'Pending Review'}. License ${data.licenseNumber || ''} is currently under verification by the MediVerse Medical Verification Board.`);
        }
      } else {
        setStatusMessage(data.error || 'Failed to check verification status.');
      }
    } catch (err) {
      setStatusMessage('Network error checking status.');
    } finally {
      setStatusChecking(false);
    }
  };

  const handleApproveDoctor = async () => {
    if (!token || !user) return;
    setApproving(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/doctor/approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ userId: user.id })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatusMessage('Doctor credentials successfully verified and approved! Redirecting to Physician Portal...');
        await refreshUser();
      } else {
        setStatusMessage(data.error || 'Approval failed.');
      }
    } catch (err) {
      setStatusMessage('Network error during verification approval.');
    } finally {
      setApproving(false);
    }
  };

  // Load Patient EHR details
  const handleOpenPatientEHR = async (patId: string) => {
    setSelectedPatientId(patId);
    setLoadingEHR(true);
    try {
      const res = await fetch(`/api/doctor/patients/${patId}/ehr`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setPatientEHRData(data);
      }
    } catch (err) {
      console.error('Failed to load patient EHR:', err);
    } finally {
      setLoadingEHR(false);
    }
  };

  const handleLinkPatient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkQuery.trim()) return;

    setLinkLoading(true);
    setLinkMsg(null);

    try {
      const res = await fetch('/api/doctor/link-patient', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patientId: linkQuery.trim().toUpperCase().startsWith('PT-') ? linkQuery.trim().toUpperCase() : undefined,
          patientEmail: !linkQuery.trim().toUpperCase().startsWith('PT-') ? linkQuery.trim() : undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLinkMsg({ type: 'success', text: `Successfully linked ${data.patient.name} (${data.patient.patientId}) to your clinical roster.` });
        setLinkQuery('');
        fetchDoctorData();
      } else {
        setLinkMsg({ type: 'error', text: data.error || 'Patient not found or already linked.' });
      }
    } catch (err: any) {
      setLinkMsg({ type: 'error', text: 'Error connecting to server.' });
    } finally {
      setLinkLoading(false);
    }
  };

  // Add & Remove Medicine rows in Prescription writer
  const handleAddMedicineRow = () => {
    setRxMedicines(prev => [
      ...prev,
      { name: '', strength: '', frequency: '1-0-1 (Twice Daily)', duration: '5 Days', instructions: 'After meals' }
    ]);
  };

  const handleRemoveMedicineRow = (index: number) => {
    if (rxMedicines.length === 1) return;
    setRxMedicines(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleMedicineChange = (index: number, field: string, value: string) => {
    setRxMedicines(prev =>
      prev.map((med, idx) => (idx === index ? { ...med, [field]: value } : med))
    );
  };

  // Submit Prescription
  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rxPatientId) {
      setRxError('Please select a patient.');
      return;
    }
    if (!rxDiagnosis.trim()) {
      setRxError('Please provide a clinical diagnosis.');
      return;
    }
    if (rxMedicines.some(m => !m.name.trim())) {
      setRxError('Please fill in medicine names.');
      return;
    }

    setRxSubmitting(true);
    setRxError(null);
    setRxSuccessMsg(null);

    try {
      const res = await fetch('/api/prescriptions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patientUserId: rxPatientId,
          diagnosis: rxDiagnosis.trim(),
          medicines: rxMedicines,
          instructions: rxInstructions.trim() || 'Take as instructed.',
          followUpDate: rxFollowUpDate || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.prescription) {
        setRxSuccessMsg(`Prescription ${data.prescription.prescriptionNumber} created successfully!`);
        setPrescriptions(prev => [data.prescription, ...prev]);
        // Auto trigger PDF download
        downloadPrescriptionPDF(data.prescription);
        // Reset
        setRxDiagnosis('');
        setRxInstructions('');
        setRxFollowUpDate('');
        setRxMedicines([{ name: '', strength: '', frequency: '1-0-1 (Twice Daily)', duration: '5 Days', instructions: 'After meals' }]);
      } else {
        setRxError(data.error || 'Failed to create prescription.');
      }
    } catch (err: any) {
      setRxError('An error occurred creating the prescription.');
    } finally {
      setRxSubmitting(false);
    }
  };

  // Submit Clinical Note
  const handleCreateClinicalNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notePatientId) {
      setNoteError('Please select a patient.');
      return;
    }
    if (!noteDiagnosis.trim() || !noteObservations.trim() || !noteTreatmentPlan.trim()) {
      setNoteError('Please fill in diagnosis, observations, and treatment plan.');
      return;
    }

    setNoteSubmitting(true);
    setNoteError(null);
    setNoteSuccessMsg(null);

    try {
      const res = await fetch('/api/clinical-notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          patientUserId: notePatientId,
          diagnosis: noteDiagnosis.trim(),
          clinicalObservations: noteObservations.trim(),
          treatmentPlan: noteTreatmentPlan.trim(),
          followUpDate: noteFollowUpDate || undefined
        })
      });

      const data = await res.json();
      if (res.ok && data.clinicalNote) {
        setNoteSuccessMsg('Clinical Assessment saved to patient record.');
        setClinicalNotes(prev => [data.clinicalNote, ...prev]);
        setNoteDiagnosis('');
        setNoteObservations('');
        setNoteTreatmentPlan('');
        setNoteFollowUpDate('');
      } else {
        setNoteError(data.error || 'Failed to record clinical note.');
      }
    } catch (err: any) {
      setNoteError('An error occurred recording clinical note.');
    } finally {
      setNoteSubmitting(false);
    }
  };

  const filteredPatients = patients.filter(
    p =>
      p.name.toLowerCase().includes(patientSearch.toLowerCase()) ||
      (p.patientId && p.patientId.toLowerCase().includes(patientSearch.toLowerCase())) ||
      p.email.toLowerCase().includes(patientSearch.toLowerCase())
  );

  // 1. Guard: Not Logged In
  if (!token || !user) {
    return (
      <div id="doctor-auth-required" className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6">
        <SEOHead
          title="Physician Portal Access Required | MediVerse"
          description="Authentication required to access the physician portal."
          canonicalPath="/doctor-dashboard"
          noIndex={true}
        />
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-slate-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center mx-auto">
            <Stethoscope className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Physician Portal Sign In</h1>
            <p className="text-sm text-slate-600">
              Access to electronic health records, roster management, and e-prescriptions requires verified medical practitioner authentication.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={() => onNavigate('login')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              Sign In to Doctor Account
            </button>
            <button
              onClick={() => onNavigate('signup')}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-all cursor-pointer"
            >
              Register as a Doctor / Physician
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 2. Guard: Doctor Account Pending Verification
  if (user.role === 'pending_doctor') {
    return (
      <div id="doctor-pending-verification" className="min-h-[85vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6">
        <SEOHead
          title="Doctor Verification In Progress | MediVerse"
          description="Doctor account credential verification pending medical review."
          canonicalPath="/doctor-dashboard"
          noIndex={true}
        />
        <div className="max-w-2xl w-full bg-white rounded-3xl p-8 sm:p-10 border border-amber-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Clock className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-2xl font-extrabold text-slate-900">
                  Doctor Verification Pending
                </h1>
                <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 text-xs font-semibold rounded-full border border-amber-300">
                  Under Review
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Medical License & Credential Verification Protocol
              </p>
            </div>
          </div>

          {/* Physician Information Box */}
          <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
            <h2 className="text-xs font-bold text-slate-600 uppercase tracking-wider">Submitted Credentials</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-xs text-slate-500 block">Doctor Name</span>
                <span className="font-semibold text-slate-800">{user.name}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Medical License #</span>
                <span className="font-mono font-semibold text-blue-700">{user.licenseNumber || 'License on file'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Specialty & Qualification</span>
                <span className="font-semibold text-slate-800">{user.specialty || 'General Medicine'} ({user.qualification || 'MD'})</span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block">Hospital / Institution</span>
                <span className="font-semibold text-slate-800">{user.hospitalAffiliation || 'Private Practice'}</span>
              </div>
            </div>
          </div>

          {/* Security & Access Protection Notice */}
          <div className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-950">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0" />
              <span>Protected Patient Records Notice</span>
            </div>
            <p className="leading-relaxed">
              In accordance with healthcare privacy regulations and HIPAA compliance, doctor accounts require verified medical licensure before patient health records, EHR histories, and prescription authoring tools can be unlocked. Your submitted credentials are being reviewed by the MediVerse Medical Verification Board.
            </p>
          </div>

          {statusMessage && (
            <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl text-xs font-medium text-blue-800 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
              <span>{statusMessage}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <button
              onClick={handleCheckStatus}
              disabled={statusChecking}
              className="w-full sm:flex-1 py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {statusChecking ? <Clock className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{statusChecking ? 'Checking Status...' : 'Check Verification Status'}</span>
            </button>

            <button
              onClick={handleApproveDoctor}
              disabled={approving}
              className="w-full sm:flex-1 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {approving ? <Clock className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{approving ? 'Approving...' : 'Fast-Track Approve (Demo)'}</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
            <button
              onClick={() => onNavigate('patient-dashboard')}
              className="text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
            >
              Go to Patient Portal
            </button>
            <button
              onClick={logout}
              className="text-red-600 hover:text-red-800 font-medium cursor-pointer"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // 3. Guard: Patient Role Attempting to Access Doctor Portal
  if (user.role === 'patient') {
    return (
      <div id="doctor-access-restricted" className="min-h-[80vh] flex items-center justify-center bg-slate-50 py-12 px-4 sm:px-6">
        <SEOHead
          title="Access Restricted | MediVerse"
          description="Doctor portal is restricted to authorized physicians."
          canonicalPath="/doctor-dashboard"
          noIndex={true}
        />
        <div className="max-w-md w-full bg-white rounded-3xl p-8 border border-red-200 shadow-sm text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-red-100 text-red-700 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-slate-900">Physician Access Only</h1>
            <p className="text-sm text-slate-600">
              You are signed in as a <span className="font-semibold text-slate-900">Patient</span>. The Doctor Portal is strictly restricted to licensed clinical healthcare providers.
            </p>
          </div>
          <div className="space-y-3 pt-2">
            <button
              onClick={() => onNavigate('patient-dashboard')}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold text-sm shadow-md shadow-blue-600/20 transition-all cursor-pointer"
            >
              Return to My Health Records
            </button>
            <button
              onClick={() => onNavigate('signup')}
              className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-sm transition-all cursor-pointer"
            >
              Register a Doctor Account
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="doctor-dashboard-container" className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Physician Clinical Dashboard | MediVerse"
        description="Clinical physician portal for patient roster oversight, digital e-prescriptions, and medical note management."
        canonicalPath="/doctor-dashboard"
        noIndex={true}
      />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Doctor Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-blue-600/20">
                <Stethoscope className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {user?.name || 'Physician'}
                  </h1>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold uppercase tracking-wider">
                    Doctor Portal
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs sm:text-sm text-slate-600">
                  <span className="font-semibold text-blue-700">{user?.specialty || 'General Medicine'}</span>
                  <span>•</span>
                  <span>{user?.qualification || 'MD'}</span>
                  <span>•</span>
                  <span className="font-mono text-slate-500">License: {user?.licenseNumber || 'LIC-VERIFIED'}</span>
                  {user?.hospitalAffiliation && (
                    <>
                      <span>•</span>
                      <span>{user.hospitalAffiliation}</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
              <button
                onClick={() => onNavigate('live-patient-record')}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <HeartPulse className="w-4 h-4" />
                <span>Live Patient Health Record</span>
              </button>
              <button
                onClick={() => setShowLinkModal(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Link Patient by ID</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Active Patients</span>
              <span className="text-2xl font-black text-slate-900 mt-1">{patients.length}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Prescriptions Authored</span>
              <span className="text-2xl font-black text-blue-600 mt-1">{prescriptions.length}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Clinical Assessments</span>
              <span className="text-2xl font-black text-indigo-600 mt-1">{clinicalNotes.length}</span>
            </div>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Consultations</span>
              <span className="text-2xl font-black text-emerald-600 mt-1">{appointments.length}</span>
            </div>
          </div>
        </div>

        {/* Subscription & 14-Day Free Trial Status Banner */}
        <div className={`rounded-3xl p-5 sm:p-6 border shadow-xs transition-all ${
          user?.subscription?.plan === 'premium'
            ? 'bg-gradient-to-r from-blue-900 to-indigo-900 text-white border-blue-800'
            : user?.subscription?.plan === 'trial'
            ? 'bg-gradient-to-r from-blue-50 via-indigo-50 to-amber-50/40 border-blue-200/80 text-slate-800'
            : 'bg-amber-50/70 border-amber-200 text-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-3.5">
              <div className={`p-3 rounded-2xl shrink-0 ${
                user?.subscription?.plan === 'premium'
                  ? 'bg-amber-400 text-slate-900 shadow-md shadow-amber-400/30'
                  : user?.subscription?.plan === 'trial'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                  : 'bg-amber-600 text-white'
              }`}>
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    user?.subscription?.plan === 'premium'
                      ? 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
                      : user?.subscription?.plan === 'trial'
                      ? 'bg-blue-600 text-white'
                      : 'bg-amber-200 text-amber-900'
                  }`}>
                    {user?.subscription?.plan === 'premium'
                      ? 'MediVerse Premium'
                      : user?.subscription?.plan === 'trial'
                      ? '14-Day Free Trial'
                      : 'Free Limited Plan'}
                  </span>
                  {user?.subscription?.plan === 'trial' && (
                    <span className="text-xs font-bold text-blue-700 bg-blue-100/80 px-2.5 py-0.5 rounded-full">
                      {user?.subscription?.trialDaysRemaining ?? 14} days remaining
                    </span>
                  )}
                </div>
                <p className={`text-xs sm:text-sm mt-1 leading-relaxed ${
                  user?.subscription?.plan === 'premium'
                    ? 'text-blue-100'
                    : 'text-slate-600'
                }`}>
                  {user?.subscription?.plan === 'premium'
                    ? 'Full clinical intelligence active: unlimited report comparisons, AI synthesis, and patient records.'
                    : user?.subscription?.plan === 'trial'
                    ? 'You have automatic 14-day full premium access. After 14 days, you will automatically transition to the Free Limited Plan.'
                    : 'Your 14-day trial has completed. You are on the Free Limited Plan with daily quotas.'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={() => setShowSubModal(true)}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  user?.subscription?.plan === 'premium'
                    ? 'bg-white/20 hover:bg-white/30 text-white border border-white/30'
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-600/20'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>
                  {user?.subscription?.plan === 'premium'
                    ? 'Manage Subscription'
                    : 'View Quotas & Upgrade'}
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'roster', label: `Patient Roster (${patients.length})`, icon: Users },
            { id: 'prescribe', label: 'Write Prescription', icon: Pill },
            { id: 'notes', label: 'Record Clinical Assessment', icon: Stethoscope },
            { id: 'appointments', label: `Appointments (${appointments.length})`, icon: Calendar },
            { id: 'audit', label: 'Audit Log', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as any);
                  setSelectedPatientId(null);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                    : 'bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: PATIENT ROSTER or PATIENT EHR DETAIL VIEW */}
        {activeTab === 'roster' && (
          <div>
            {selectedPatientId && patientEHRData ? (
              /* FULL PATIENT EHR CHART VIEW */
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <button
                    onClick={() => setSelectedPatientId(null)}
                    className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Patient Roster</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setRxPatientId(patientEHRData.patient.id);
                        setActiveTab('prescribe');
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Pill className="w-3.5 h-3.5" />
                      <span>Write Prescription</span>
                    </button>

                    <button
                      onClick={() => {
                        setNotePatientId(patientEHRData.patient.id);
                        setActiveTab('notes');
                      }}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                    >
                      <Stethoscope className="w-3.5 h-3.5" />
                      <span>Add Note</span>
                    </button>
                  </div>
                </div>

                {/* Patient Chart Demographics Header */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-extrabold text-slate-900">{patientEHRData.patient.name}</h2>
                        <span className="font-mono text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md">
                          {patientEHRData.patient.patientId || 'PT-RECORD'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">{patientEHRData.patient.email}</p>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs w-full sm:w-auto">
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block">Age / Gender</span>
                        <span className="font-bold text-slate-800">
                          {patientEHRData.patient.age || '—'} / {patientEHRData.patient.gender || '—'}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block">Blood Group</span>
                        <span className="font-bold text-slate-800">{patientEHRData.patient.bloodGroup || '—'}</span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block">Allergies</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {patientEHRData.patient.allergies || 'None'}
                        </span>
                      </div>
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                        <span className="text-slate-400 block">Emergency Contact</span>
                        <span className="font-bold text-slate-800 truncate block">
                          {patientEHRData.patient.emergencyContact || '—'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Patient Lab Reports Section */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <span>Laboratory Diagnostic Reports ({patientEHRData.reports.length})</span>
                  </h3>

                  {patientEHRData.reports.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl">
                      No lab reports currently uploaded for this patient.
                    </p>
                  ) : (
                    <div className="space-y-4">
                      {patientEHRData.reports.map(rep => (
                        <div key={rep.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                          <div className="flex items-center justify-between">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm">{rep.fileName}</h4>
                              <p className="text-xs text-slate-500">{new Date(rep.uploadedAt).toLocaleString()}</p>
                            </div>
                            <button
                              onClick={() => downloadReportPDF(rep)}
                              className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download PDF</span>
                            </button>
                          </div>

                          <p className="text-xs text-slate-700 bg-white p-3 rounded-xl border border-slate-200">
                            <strong>AI Summary:</strong> {rep.healthSummary}
                          </p>

                          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                            <table className="w-full text-left text-xs">
                              <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                                <tr>
                                  <th className="p-2.5">Parameter</th>
                                  <th className="p-2.5">Result</th>
                                  <th className="p-2.5">Reference Range</th>
                                  <th className="p-2.5">Status</th>
                                  <th className="p-2.5">Clinical Note</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {rep.testResults.map((t, i) => {
                                  const finding = rep.abnormalFindings?.find(a => a.testName.toLowerCase() === t.testName.toLowerCase());
                                  return (
                                    <tr key={i}>
                                      <td className="p-2.5 font-bold text-slate-900">{t.testName}</td>
                                      <td className="p-2.5 font-semibold text-slate-800">
                                        {t.result} {t.unit}
                                      </td>
                                      <td className="p-2.5 text-slate-500">{t.referenceRange || '—'}</td>
                                      <td className="p-2.5">
                                        <span
                                          className={`px-2 py-0.5 rounded font-bold ${
                                            t.status === 'Normal'
                                              ? 'bg-emerald-100 text-emerald-800'
                                              : 'bg-amber-100 text-amber-800'
                                          }`}
                                        >
                                          {t.status}
                                        </span>
                                      </td>
                                      <td className="p-2.5 text-slate-600">
                                        {finding ? finding.whatItMeasures : (t.status === 'Normal' ? 'Within normal limits' : 'Clinical correlation required')}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Patient Prescription History */}
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <Pill className="w-5 h-5 text-blue-600" />
                    <span>Prescriptions History ({patientEHRData.prescriptions.length})</span>
                  </h3>

                  {patientEHRData.prescriptions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic p-4 bg-slate-50 rounded-xl">
                      No prescriptions on record for this patient.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {patientEHRData.prescriptions.map(p => (
                        <div key={p.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                              {p.prescriptionNumber}
                            </span>
                            <span className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleDateString()}</span>
                          </div>
                          <p className="text-xs font-bold text-slate-900">Diagnosis: {p.diagnosis}</p>
                          <div className="flex flex-wrap gap-2 text-xs">
                            {p.medicines.map((m, idx) => (
                              <span key={idx} className="bg-white px-2 py-1 rounded border border-slate-200 font-medium">
                                {m.name} ({m.frequency} - {m.duration})
                              </span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* ROSTER LIST */
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900">Clinical Patient Roster</h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Manage patients under your care, view medical charts, and issue prescriptions
                    </p>
                  </div>

                  <button
                    onClick={() => setShowLinkModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Link New Patient</span>
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={patientSearch}
                    onChange={e => setPatientSearch(e.target.value)}
                    placeholder="Search patients by name, email, or Patient ID (e.g. PT-123456)..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                  />
                </div>

                {filteredPatients.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl space-y-3">
                    <Users className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-slate-600 font-medium">No patients found in your clinical roster.</p>
                    <p className="text-xs text-slate-400 max-w-sm mx-auto">
                      Link a patient by entering their unique Patient ID (e.g. PT-XXXXXX) or registered email address.
                    </p>
                    <button
                      onClick={() => setShowLinkModal(true)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                    >
                      Link First Patient
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredPatients.map(patient => (
                      <div
                        key={patient.id}
                        className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
                      >
                        <div className="space-y-2">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h4 className="text-base font-bold text-slate-900">{patient.name}</h4>
                              <p className="text-xs text-slate-500">{patient.email}</p>
                            </div>
                            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded shrink-0">
                              {patient.patientId || 'PT-RECORD'}
                            </span>
                          </div>

                          <div className="grid grid-cols-3 gap-2 pt-2 text-xs">
                            <div className="bg-white p-2 rounded-lg border border-slate-200">
                              <span className="text-slate-400 block text-[10px]">Age / Sex</span>
                              <span className="font-semibold text-slate-800">
                                {patient.age ? `${patient.age}y` : '—'} / {patient.gender ? patient.gender.charAt(0) : '—'}
                              </span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-200">
                              <span className="text-slate-400 block text-[10px]">Blood Group</span>
                              <span className="font-semibold text-slate-800">{patient.bloodGroup || '—'}</span>
                            </div>
                            <div className="bg-white p-2 rounded-lg border border-slate-200">
                              <span className="text-slate-400 block text-[10px]">Allergies</span>
                              <span className="font-semibold text-slate-800 truncate block">
                                {patient.allergies || 'None'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                          <button
                            onClick={() => {
                              setRxPatientId(patient.id);
                              setActiveTab('prescribe');
                            }}
                            className="text-xs text-blue-600 font-semibold hover:underline cursor-pointer"
                          >
                            Prescribe
                          </button>

                          <button
                            onClick={() => handleOpenPatientEHR(patient.id)}
                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Open EHR Chart</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: PRESCRIPTION WRITER */}
        {activeTab === 'prescribe' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Clinical Digital Prescription Generator</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Author and issue tamper-evident medical prescriptions with automated dosage breakdown and PDF generation
              </p>
            </div>

            {rxSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{rxSuccessMsg}</span>
              </div>
            )}

            {rxError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs sm:text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{rxError}</span>
              </div>
            )}

            <form onSubmit={handleCreatePrescription} className="space-y-6">
              {/* Select Patient & Diagnosis */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Target Patient <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={rxPatientId}
                    onChange={e => setRxPatientId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-blue-600 cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Patient from Roster --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.patientId || 'PT-RECORD'}) - {p.email}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Clinical Diagnosis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={rxDiagnosis}
                    onChange={e => setRxDiagnosis(e.target.value)}
                    placeholder="e.g. Essential Hypertension, Acute Bronchitis"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              {/* Medicines Builder */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Prescribed Medications (Rx)
                  </label>
                  <button
                    type="button"
                    onClick={handleAddMedicineRow}
                    className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Another Medicine</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {rxMedicines.map((med, index) => (
                    <div
                      key={index}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end"
                    >
                      <div className="sm:col-span-4 space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">Medicine Name</label>
                        <input
                          type="text"
                          value={med.name}
                          onChange={e => handleMedicineChange(index, 'name', e.target.value)}
                          placeholder="e.g. Amoxicillin, Amlodipine"
                          className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs focus:border-blue-600"
                          required
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">Strength</label>
                        <input
                          type="text"
                          value={med.strength}
                          onChange={e => handleMedicineChange(index, 'strength', e.target.value)}
                          placeholder="e.g. 500mg"
                          className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs focus:border-blue-600"
                        />
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">Frequency</label>
                        <select
                          value={med.frequency}
                          onChange={e => handleMedicineChange(index, 'frequency', e.target.value)}
                          className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs focus:border-blue-600"
                        >
                          <option value="1-0-0 (Morning)">1-0-0 (Morning)</option>
                          <option value="0-1-0 (Afternoon)">0-1-0 (Afternoon)</option>
                          <option value="0-0-1 (Night)">0-0-1 (Night)</option>
                          <option value="1-0-1 (Twice Daily)">1-0-1 (Twice Daily)</option>
                          <option value="1-1-1 (Thrice Daily)">1-1-1 (Thrice Daily)</option>
                          <option value="SOS (As needed)">SOS (As needed)</option>
                        </select>
                      </div>

                      <div className="sm:col-span-2 space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-600">Duration</label>
                        <input
                          type="text"
                          value={med.duration}
                          onChange={e => handleMedicineChange(index, 'duration', e.target.value)}
                          placeholder="e.g. 5 Days, 1 Month"
                          className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs focus:border-blue-600"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center gap-2">
                        <div className="flex-1 space-y-1">
                          <label className="block text-[11px] font-semibold text-slate-600">Instructions</label>
                          <input
                            type="text"
                            value={med.instructions}
                            onChange={e => handleMedicineChange(index, 'instructions', e.target.value)}
                            placeholder="After food"
                            className="w-full p-2 bg-white rounded-lg border border-slate-300 text-xs focus:border-blue-600"
                          />
                        </div>

                        {rxMedicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicineRow(index)}
                            className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* General Advice & Follow-Up */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Clinical Advice & Patient Instructions
                  </label>
                  <textarea
                    rows={2}
                    value={rxInstructions}
                    onChange={e => setRxInstructions(e.target.value)}
                    placeholder="e.g. Drink plenty of warm liquids. Avoid heavy exertion."
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Recommended Follow-Up Date
                  </label>
                  <input
                    type="date"
                    value={rxFollowUpDate}
                    onChange={e => setRxFollowUpDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-blue-600 cursor-pointer"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={rxSubmitting}
                className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>{rxSubmitting ? 'Issuing Prescription...' : 'Authorize & Issue Digital Prescription (PDF)'}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 3: CLINICAL NOTES */}
        {activeTab === 'notes' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Record Clinical Assessment Note</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Document medical observations, examination findings, and recommended care plans
              </p>
            </div>

            {noteSuccessMsg && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs sm:text-sm flex items-center gap-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                <span>{noteSuccessMsg}</span>
              </div>
            )}

            {noteError && (
              <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-2xl text-xs sm:text-sm flex items-center gap-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{noteError}</span>
              </div>
            )}

            <form onSubmit={handleCreateClinicalNote} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Patient <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={notePatientId}
                    onChange={e => setNotePatientId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-blue-600 cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Patient --</option>
                    {patients.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.patientId || 'PT-RECORD'})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">
                    Clinical Diagnosis / Problem <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={noteDiagnosis}
                    onChange={e => setNoteDiagnosis(e.target.value)}
                    placeholder="e.g. Type 2 Diabetes Mellitus, Follow-Up"
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-blue-600"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Clinical Examination & Findings <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={noteObservations}
                  onChange={e => setNoteObservations(e.target.value)}
                  placeholder="Record symptoms, physical exam findings, and diagnostic impressions..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm bg-white focus:border-blue-600"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Treatment Plan & Care Directives <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={noteTreatmentPlan}
                  onChange={e => setNoteTreatmentPlan(e.target.value)}
                  placeholder="Record treatment instructions, lifestyle modifications, and referrals..."
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm bg-white focus:border-blue-600"
                  required
                />
              </div>

              <div className="space-y-1.5 max-w-xs">
                <label className="block text-xs font-semibold text-slate-700">
                  Scheduled Follow-Up
                </label>
                <input
                  type="date"
                  value={noteFollowUpDate}
                  onChange={e => setNoteFollowUpDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-blue-600 cursor-pointer"
                />
              </div>

              <button
                type="submit"
                disabled={noteSubmitting}
                className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Stethoscope className="w-4 h-4" />
                <span>{noteSubmitting ? 'Saving Assessment...' : 'Commit Clinical Note to Health Record'}</span>
              </button>
            </form>
          </div>
        )}

        {/* TAB 4: APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Scheduled Consultations</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Manage upcoming patient bookings and review consultation history
              </p>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl space-y-3">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-600 font-medium">No consultations currently scheduled.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {appointments.map(appt => (
                  <div
                    key={appt.id}
                    className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-slate-500">{appt.appointmentCode}</span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                          {appt.status}
                        </span>
                      </div>
                      <h4 className="text-base font-bold text-slate-900">{appt.patientName}</h4>
                      <p className="text-xs text-slate-500">
                        Date: <span className="font-semibold text-slate-800">{appt.appointmentDate}</span> at{' '}
                        <span className="font-semibold text-slate-800">{appt.appointmentTime}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                      <button
                        onClick={() => {
                          if (appt.userId) setRxPatientId(appt.userId);
                          setActiveTab('prescribe');
                        }}
                        className="text-xs font-semibold text-blue-600 hover:underline cursor-pointer"
                      >
                        Prescribe Rx
                      </button>
                      <button
                        onClick={() => {
                          if (appt.userId) handleOpenPatientEHR(appt.userId);
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:underline cursor-pointer"
                      >
                        View Chart →
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 5: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Clinical Audit Trail</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Log of all EHR queries, prescription issuances, and patient links made under your physician account
              </p>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-sm text-slate-500 py-6">No audit activities logged.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Action</th>
                      <th className="p-3.5">Target Patient</th>
                      <th className="p-3.5">Details</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono text-xs">
                    {auditLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="p-3.5 text-slate-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3.5 font-bold text-blue-700">{log.action}</td>
                        <td className="p-3.5 text-slate-800">{log.targetPatientId || '—'}</td>
                        <td className="p-3.5 text-slate-600 font-sans text-xs">{log.details}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="pt-6">
          <DisclaimerBanner />
        </div>
      </div>

      {/* Link Patient Modal */}
      {showLinkModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <UserCheck className="w-5 h-5 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-lg">Link Patient to Roster</h3>
              </div>
              <button
                onClick={() => {
                  setShowLinkModal(false);
                  setLinkMsg(null);
                }}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Enter the patient's unique <strong>Patient ID</strong> (e.g. <code>PT-XXXXXX</code>) or their registered email address to add them to your active care roster.
            </p>

            <form onSubmit={handleLinkPatient} className="space-y-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Patient Identifier</label>
                <input
                  type="text"
                  value={linkQuery}
                  onChange={e => setLinkQuery(e.target.value)}
                  placeholder="e.g. PT-104928 or patient@domain.com"
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                  required
                />
              </div>

              {linkMsg && (
                <div
                  className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
                    linkMsg.type === 'success'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {linkMsg.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                  )}
                  <span>{linkMsg.text}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowLinkModal(false);
                    setLinkMsg(null);
                  }}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={linkLoading}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>{linkLoading ? 'Linking...' : 'Confirm & Link'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subscription & Quota Upgrade Modal */}
      <SubscriptionModal
        isOpen={showSubModal}
        onClose={() => setShowSubModal(false)}
      />
    </div>
  );
};
