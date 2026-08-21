import React, { useState, useEffect } from 'react';
import {
  UserPlus,
  Users,
  Search,
  Filter,
  Plus,
  ArrowRight,
  ShieldCheck,
  Stethoscope,
  HeartPulse,
  FileText,
  Activity,
  ChevronRight,
  Clock,
  LogOut,
  Sparkles,
  FileCheck2,
  Trash2,
  AlertCircle
} from 'lucide-react';
import { LivePatientRecord } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { PatientAdmissionModal } from '../components/patient-record/PatientAdmissionModal.js';
import { PatientHeader } from '../components/patient-record/PatientHeader.js';
import { PatientOverviewTab } from '../components/patient-record/PatientOverviewTab.js';
import { PatientDocumentsTab } from '../components/patient-record/PatientDocumentsTab.js';
import { PatientLabsVitalsTab } from '../components/patient-record/PatientLabsVitalsTab.js';
import { PatientMedicationsTab } from '../components/patient-record/PatientMedicationsTab.js';
import { PatientDiagnosesNotesTab } from '../components/patient-record/PatientDiagnosesNotesTab.js';
import { PatientPrescriptionsTab } from '../components/patient-record/PatientPrescriptionsTab.js';
import { PatientSummariesTab } from '../components/patient-record/PatientSummariesTab.js';
import { PatientTimelineTab } from '../components/patient-record/PatientTimelineTab.js';
import { PatientProfileTab } from '../components/patient-record/PatientProfileTab.js';
import { SEOHead } from '../components/SEOHead.js';

interface LivePatientRecordPageProps {
  onNavigate: (page: string) => void;
}

export const LivePatientRecordPage: React.FC<LivePatientRecordPageProps> = ({ onNavigate }) => {
  const { token, user } = useAuth();

  const [patients, setPatients] = useState<LivePatientRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected Patient for single patient health record view
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Admission Modal
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);

  // Quick modals for Patient Workspace
  const [showPrescriptionModal, setShowPrescriptionModal] = useState(false);
  const [showDischargeModal, setShowDischargeModal] = useState(false);

  // Roster Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Admitted' | 'Discharged'>('All');
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');

  // Fetch all patients from API
  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/patients', { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to load patient records.');

      setPatients(data.patients || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching patient list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [token]);

  // Handler when a patient is admitted
  const handlePatientAdmitted = (newPatient: LivePatientRecord) => {
    setPatients(prev => [newPatient, ...prev]);
    setSelectedPatientId(newPatient.id);
    setActiveTab('overview');
  };

  // Handler when a patient is updated (e.g. document uploaded, vital added, discharged)
  const handlePatientUpdated = (updatedPatient: LivePatientRecord) => {
    setPatients(prev => prev.map(p => (p.id === updatedPatient.id ? updatedPatient : p)));
  };

  const selectedPatient = patients.find(p => p.id === selectedPatientId);

  // Filtered patients for Roster list
  const filteredPatients = patients.filter(p => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.patientName.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      p.attendingPhysician.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q) ||
      (p.reasonForAdmission && p.reasonForAdmission.toLowerCase().includes(q));

    const matchesStatus = statusFilter === 'All' || p.status === statusFilter;
    const matchesDept = departmentFilter === 'All' || p.department === departmentFilter;

    return matchesSearch && matchesStatus && matchesDept;
  });

  const admittedCount = patients.filter(p => p.status === 'Admitted').length;
  const dischargedCount = patients.filter(p => p.status === 'Discharged').length;

  return (
    <div className="min-h-screen bg-slate-50/50 py-8 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Live Patient Electronic Health Record (EHR) | MediVerse"
        description="Comprehensive clinical patient health record workspace, document OCR, vitals tracking, and clinical notes."
        canonicalPath="/live-patient-record"
        noIndex={true}
      />
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* VIEW 1: PATIENT RECORD WORKSPACE (when a patient is selected) */}
        {selectedPatient ? (
          <div className="space-y-6 animate-in fade-in duration-200">
            
            {/* Top Patient Header with key demographics & actions */}
            <PatientHeader
              patient={selectedPatient}
              onBackToList={() => setSelectedPatientId(null)}
              onOpenDischargeModal={() => {
                setActiveTab('summaries');
                setShowDischargeModal(true);
              }}
              onOpenSummaryModal={() => setActiveTab('summaries')}
              onOpenPrescriptionModal={() => {
                setActiveTab('prescriptions');
                setShowPrescriptionModal(true);
              }}
              onOpenProfileTab={() => setActiveTab('profile')}
            />

            {/* Navigation Tabs Bar */}
            <div className="bg-white rounded-2xl border border-blue-100 p-1.5 shadow-xs overflow-x-auto">
              <div className="flex items-center gap-1 min-w-max">
                {[
                  { id: 'overview', label: 'Overview', icon: Activity },
                  { id: 'documents', label: `Documents (${selectedPatient.documents?.length || 0})`, icon: FileText },
                  { id: 'labs-vitals', label: `Labs & Vitals (${(selectedPatient.vitals?.length || 0) + (selectedPatient.labResults?.length || 0)})`, icon: HeartPulse },
                  { id: 'medications', label: `Medications (${selectedPatient.medications?.filter(m => m.status === 'Active').length || 0})`, icon: Stethoscope },
                  { id: 'diagnoses-notes', label: `Diagnoses & Notes (${(selectedPatient.diagnoses?.length || 0) + (selectedPatient.clinicalNotes?.length || 0)})`, icon: ShieldCheck },
                  { id: 'prescriptions', label: `Prescriptions (${selectedPatient.prescriptions?.length || 0})`, icon: FileCheck2 },
                  { id: 'summaries', label: 'Summaries & Discharge', icon: Sparkles },
                  { id: 'timeline', label: `Timeline (${selectedPatient.timeline?.length || 0})`, icon: Clock },
                  { id: 'profile', label: 'Patient Profile', icon: Users }
                ].map(tab => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Tab Views */}
            <div className="animate-in fade-in duration-150">
              {activeTab === 'overview' && (
                <PatientOverviewTab
                  patient={selectedPatient}
                  onNavigateTab={tabId => setActiveTab(tabId)}
                  onOpenAddVitals={() => setActiveTab('labs-vitals')}
                  onOpenAddMedication={() => setActiveTab('medications')}
                  onOpenAddDiagnosis={() => setActiveTab('diagnoses-notes')}
                  onOpenAddNote={() => setActiveTab('diagnoses-notes')}
                  onOpenUploadDoc={() => setActiveTab('documents')}
                />
              )}

              {activeTab === 'documents' && (
                <PatientDocumentsTab
                  patient={selectedPatient}
                  onRefreshPatient={handlePatientUpdated}
                />
              )}

              {activeTab === 'labs-vitals' && (
                <PatientLabsVitalsTab
                  patient={selectedPatient}
                  onRefreshPatient={handlePatientUpdated}
                />
              )}

              {activeTab === 'medications' && (
                <PatientMedicationsTab
                  patient={selectedPatient}
                  onRefreshPatient={handlePatientUpdated}
                />
              )}

              {activeTab === 'diagnoses-notes' && (
                <PatientDiagnosesNotesTab
                  patient={selectedPatient}
                  onRefreshPatient={handlePatientUpdated}
                />
              )}

              {activeTab === 'prescriptions' && (
                <PatientPrescriptionsTab
                  patient={selectedPatient}
                  onRefreshPatient={handlePatientUpdated}
                  initialShowModal={showPrescriptionModal}
                />
              )}

              {activeTab === 'summaries' && (
                <PatientSummariesTab
                  patient={selectedPatient}
                  onRefreshPatient={handlePatientUpdated}
                  initialShowDischargeModal={showDischargeModal}
                />
              )}

              {activeTab === 'timeline' && (
                <PatientTimelineTab patient={selectedPatient} />
              )}

              {activeTab === 'profile' && (
                <PatientProfileTab
                  patient={selectedPatient}
                  onRefreshPatient={handlePatientUpdated}
                />
              )}
            </div>

          </div>
        ) : (
          /* VIEW 2: PATIENT ROSTER & ADMISSION DIRECTORY (when no patient selected) */
          <div className="space-y-6">
            
            {/* Header Hero */}
            <div className="bg-gradient-to-r from-blue-700 via-indigo-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-2xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-blue-200 text-xs font-semibold">
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>Clinical Electronic Health Record</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  Live Patient Health Record
                </h1>
                <p className="text-xs sm:text-sm text-blue-100/90 leading-relaxed">
                  Admit patients, upload and AI-analyze real medical documents, track vitals and medications, formulate diagnoses, synthesize clinical summaries, and manage digital prescriptions with complete audit trails.
                </p>
              </div>

              <button
                onClick={() => setShowAdmissionModal(true)}
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-white text-blue-700 hover:bg-blue-50 font-bold text-sm shadow-lg hover:shadow-xl transition-all shrink-0"
              >
                <UserPlus className="w-4 h-4 text-blue-600" />
                <span>Admit New Patient</span>
              </button>
            </div>

            {/* Metric Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Patients</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">{patients.length}</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Currently Admitted</span>
                  <div className="text-2xl font-black text-emerald-600 mt-1">{admittedCount}</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Activity className="w-6 h-6" />
                </div>
              </div>

              <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-xs flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Discharged Records</span>
                  <div className="text-2xl font-black text-slate-600 mt-1">{dischargedCount}</div>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center">
                  <FileCheck2 className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white rounded-3xl p-5 border border-blue-100 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
              
              {/* Search */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  placeholder="Search by Patient Name, UHID, Doctor, Department, or Chief Complaint..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Status Filters */}
              <div className="flex items-center gap-2">
                {(['All', 'Admitted', 'Discharged'] as const).map(status => (
                  <button
                    key={status}
                    onClick={() => setStatusFilter(status)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                      statusFilter === status
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>

              {/* Department Filter */}
              <div>
                <select
                  value={departmentFilter}
                  onChange={e => setDepartmentFilter(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="All">All Departments</option>
                  <option value="General Medicine">General Medicine</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Pulmonology">Pulmonology</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Orthopedics">Orthopedics</option>
                  <option value="Gastroenterology">Gastroenterology</option>
                  <option value="Pediatrics">Pediatrics</option>
                  <option value="Emergency & Trauma">Emergency & Trauma</option>
                  <option value="Oncology">Oncology</option>
                  <option value="Intensive Care Unit (ICU)">ICU</option>
                </select>
              </div>

            </div>

            {/* Patient Roster Grid / Table */}
            {loading ? (
              <div className="bg-white rounded-3xl p-12 text-center border border-blue-100 shadow-xs">
                <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <p className="text-xs text-slate-500 font-medium">Loading live patient records...</p>
              </div>
            ) : filteredPatients.length === 0 ? (
              <div className="bg-white rounded-3xl p-16 text-center border border-dashed border-blue-200 shadow-xs space-y-4">
                <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
                  <HeartPulse className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-lg font-bold text-slate-900">
                    {patients.length === 0 ? 'No Patients Admitted Yet' : 'No Patients Matching Criteria'}
                  </h3>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    {patients.length === 0
                      ? "Start by admitting your first patient to manage their clinical charts, upload diagnostic documents, and generate AI-grounded medical summaries."
                      : 'Try adjusting your search query or department filter.'}
                  </p>
                </div>
                {patients.length === 0 && (
                  <button
                    onClick={() => setShowAdmissionModal(true)}
                    className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Admit First Patient</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredPatients.map(pat => {
                  const latestVital = pat.vitals?.[0];
                  const isAdmitted = pat.status === 'Admitted';

                  return (
                    <div
                      key={pat.id}
                      onClick={() => {
                        setSelectedPatientId(pat.id);
                        setActiveTab('overview');
                      }}
                      className="bg-white rounded-3xl p-5 border border-blue-100 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col justify-between space-y-4 group"
                    >
                      <div className="space-y-3">
                        {/* Status & UHID Row */}
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                            {pat.uhid}
                          </span>

                          {isAdmitted ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                              Admitted
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                              Discharged
                            </span>
                          )}
                        </div>

                        {/* Patient Name & Details */}
                        <div>
                          <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                            {pat.patientName}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                            <span>{pat.age ? `${pat.age} yrs` : 'N/A'}</span>
                            <span>•</span>
                            <span>{pat.gender || 'N/A'}</span>
                            <span>•</span>
                            <span className="font-semibold text-rose-600">{pat.bloodGroup || 'Unknown'}</span>
                          </div>
                        </div>

                        {/* Department & Attending Doctor */}
                        <div className="p-3 rounded-2xl bg-slate-50/80 border border-slate-100 text-xs space-y-1">
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-slate-400">Department:</span>
                            <span className="font-semibold text-slate-800">{pat.department}</span>
                          </div>
                          <div className="flex items-center justify-between text-slate-600">
                            <span className="text-slate-400">Physician:</span>
                            <span className="font-medium text-slate-700">{pat.attendingPhysician}</span>
                          </div>
                          {pat.bedRoomNo && (
                            <div className="flex items-center justify-between text-slate-600">
                              <span className="text-slate-400">Room/Bed:</span>
                              <span className="font-medium text-slate-700">{pat.bedRoomNo}</span>
                            </div>
                          )}
                        </div>

                        {/* Chief Complaint */}
                        {pat.reasonForAdmission && (
                          <p className="text-xs text-slate-600 line-clamp-1 italic">
                            "{pat.reasonForAdmission}"
                          </p>
                        )}
                      </div>

                      {/* Footer Actions & Counts */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium">
                          <span>{pat.documents?.length || 0} Docs</span>
                          <span>•</span>
                          <span>{pat.prescriptions?.length || 0} Rx</span>
                        </div>

                        <span className="text-xs font-bold text-blue-600 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                          <span>Open Record</span>
                          <ChevronRight className="w-4 h-4" />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}

      </div>

      {/* Admission Modal */}
      <PatientAdmissionModal
        isOpen={showAdmissionModal}
        onClose={() => setShowAdmissionModal(false)}
        onPatientAdmitted={handlePatientAdmitted}
      />

    </div>
  );
};
