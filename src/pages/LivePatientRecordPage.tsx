import React, { useState, useEffect } from 'react';
import {
  Activity,
  Plus,
  RefreshCw,
  Search,
  UserPlus,
  Edit3,
  FileText,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  Building2,
  Stethoscope,
  HeartPulse,
  LogOut,
  ChevronRight,
  Filter,
  CheckCircle2,
  Printer,
  ChevronDown,
  Upload,
  Pill,
  FlaskConical,
  Download,
  Paperclip,
  User,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import {
  LivePatientRecord,
  PatientTimelineEntry,
  LivePatientAiSummary,
  EntryAttachment
} from '../types.js';
import { PatientTimeline } from '../components/LivePatientHealthRecord/PatientTimeline.js';
import { AiCurrentSummaryView } from '../components/LivePatientHealthRecord/AiCurrentSummaryView.js';
import { AddTimelineEntryModal } from '../components/LivePatientHealthRecord/AddTimelineEntryModal.js';
import { AdmitPatientModal } from '../components/LivePatientHealthRecord/AdmitPatientModal.js';
import { EditPatientModal } from '../components/LivePatientHealthRecord/EditPatientModal.js';
import { UploadAndAnalyzeModal } from '../components/LivePatientHealthRecord/UploadAndAnalyzeModal.js';
import { WritePrescriptionModal } from '../components/LivePatientHealthRecord/WritePrescriptionModal.js';
import { DocumentViewerModal } from '../components/LivePatientHealthRecord/DocumentViewerModal.js';
import { PatientDocumentsView } from '../components/LivePatientHealthRecord/PatientDocumentsView.js';
import { PatientLabsAndVitalsView } from '../components/LivePatientHealthRecord/PatientLabsAndVitalsView.js';
import { PatientMedicationsView } from '../components/LivePatientHealthRecord/PatientMedicationsView.js';
import { PatientDiagnosesView } from '../components/LivePatientHealthRecord/PatientDiagnosesView.js';
import { PatientPrescriptionsView } from '../components/LivePatientHealthRecord/PatientPrescriptionsView.js';
import { PatientProfileView } from '../components/LivePatientHealthRecord/PatientProfileView.js';
import { downloadLivePatientRecordPDF } from '../utils/pdfExport.js';

interface LivePatientRecordPageProps {
  onNavigate?: (page: string) => void;
}

export type PatientViewTab =
  | 'overview'
  | 'documents'
  | 'labs'
  | 'medications'
  | 'diagnoses'
  | 'prescriptions'
  | 'timeline'
  | 'profile';

export const LivePatientRecordPage: React.FC<LivePatientRecordPageProps> = ({ onNavigate }) => {
  const [patients, setPatients] = useState<LivePatientRecord[]>([]);
  const [selectedPatient, setSelectedPatient] = useState<LivePatientRecord | null>(null);
  const [timelineEntries, setTimelineEntries] = useState<PatientTimelineEntry[]>([]);
  const [currentAiSummary, setCurrentAiSummary] = useState<LivePatientAiSummary | null>(null);

  const [activeTab, setActiveTab] = useState<PatientViewTab>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  const [isLoading, setIsLoading] = useState(true);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [highlightedTimelineEntryId, setHighlightedTimelineEntryId] = useState<string | null>(null);

  // Modals state
  const [isAdmitModalOpen, setIsAdmitModalOpen] = useState(false);
  const [isAddEntryModalOpen, setIsAddEntryModalOpen] = useState(false);
  const [addEntryDefaultType, setAddEntryDefaultType] = useState<string | undefined>(undefined);
  const [isEditPatientModalOpen, setIsEditPatientModalOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isPrescriptionModalOpen, setIsPrescriptionModalOpen] = useState(false);
  const [previewAttachment, setPreviewAttachment] = useState<EntryAttachment | null>(null);

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Load all live patient records
  const fetchPatientRecords = async (keepSelectedUhid?: string) => {
    try {
      setIsLoading(true);
      const res = await fetch('/api/live-records');
      const data = await res.json();
      if (data.records) {
        setPatients(data.records);
        if (data.records.length > 0) {
          const target = keepSelectedUhid
            ? data.records.find((r: LivePatientRecord) => r.uhid === keepSelectedUhid || r.id === keepSelectedUhid) || data.records[0]
            : selectedPatient
            ? data.records.find((r: LivePatientRecord) => r.id === selectedPatient.id) || data.records[0]
            : data.records[0];
          setSelectedPatient(target);
          fetchPatientDetails(target.id);
        } else {
          setSelectedPatient(null);
          setTimelineEntries([]);
          setCurrentAiSummary(null);
        }
      }
    } catch (err) {
      console.error('Error loading patient records:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Load selected patient details, timeline entries, and AI summary
  const fetchPatientDetails = async (patientId: string) => {
    try {
      const res = await fetch(`/api/live-records/${patientId}`);
      const data = await res.json();
      if (data.record) {
        setSelectedPatient(data.record);
        setTimelineEntries(data.entries || []);
        setCurrentAiSummary(data.summary || null);
      }
    } catch (err) {
      console.error('Error fetching patient details:', err);
    }
  };

  useEffect(() => {
    fetchPatientRecords();
  }, []);

  const handleSelectPatient = (patient: LivePatientRecord) => {
    setSelectedPatient(patient);
    fetchPatientDetails(patient.id);
  };

  const handlePatientAdmitted = (newRecord: LivePatientRecord) => {
    setNotification({
      type: 'success',
      message: `Digital Health Record created for ${newRecord.patientName} (${newRecord.uhid}).`
    });
    fetchPatientRecords(newRecord.id);
    setTimeout(() => setNotification(null), 4000);
  };

  const handlePatientUpdated = (updatedRecord: LivePatientRecord) => {
    setNotification({
      type: 'success',
      message: `Patient record updated for ${updatedRecord.patientName}.`
    });
    fetchPatientRecords(updatedRecord.id);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleEntryAdded = (newEntry: PatientTimelineEntry) => {
    setTimelineEntries(prev => [newEntry, ...prev]);
    if (selectedPatient) {
      setSelectedPatient(prev =>
        prev
          ? {
              ...prev,
              entriesCount: (prev.entriesCount || 0) + 1,
              summaryStatus: 'Updated information available',
              updatedAt: new Date().toISOString()
            }
          : null
      );
    }
    setNotification({
      type: 'success',
      message: `Recorded ${newEntry.entryType}. AI Summary marked for refresh.`
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const handleDeleteEntry = async (entryId: string) => {
    if (!selectedPatient) return;
    if (!window.confirm('Are you sure you want to remove this clinical timeline record?')) return;

    try {
      const res = await fetch(`/api/live-records/${selectedPatient.id}/entries/${entryId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setTimelineEntries(prev => prev.filter(e => e.id !== entryId));
        setSelectedPatient(prev =>
          prev
            ? {
                ...prev,
                entriesCount: Math.max(0, (prev.entriesCount || 1) - 1),
                summaryStatus: 'Updated information available'
              }
            : null
        );
        setNotification({ type: 'success', message: 'Clinical entry deleted.' });
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  const handleGenerateSummary = async () => {
    if (!selectedPatient) return;

    try {
      setIsGeneratingSummary(true);
      const res = await fetch(`/api/live-records/${selectedPatient.id}/generate-summary`, {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate AI summary');
      }

      setCurrentAiSummary(data.summary);
      setSelectedPatient(prev =>
        prev
          ? {
              ...prev,
              summaryStatus: 'Up to Date',
              lastSummaryGeneratedAt: data.summary.generatedAt
            }
          : null
      );
      setNotification({
        type: 'success',
        message: 'AI Current Summary refreshed with latest timeline data!'
      });
      setTimeout(() => setNotification(null), 4000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Could not generate summary at this time.'
      });
      setTimeout(() => setNotification(null), 4000);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const handleDownloadFullChart = () => {
    if (!selectedPatient) return;
    downloadLivePatientRecordPDF(selectedPatient, timelineEntries, currentAiSummary);
    setNotification({
      type: 'success',
      message: `Downloaded continuous inpatient chart for ${selectedPatient.patientName}.`
    });
    setTimeout(() => setNotification(null), 4000);
  };

  const openAddEntryModalWithType = (type?: string) => {
    setAddEntryDefaultType(type);
    setIsAddEntryModalOpen(true);
  };

  const filteredPatients = patients.filter(p => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      p.patientName.toLowerCase().includes(q) ||
      p.uhid.toLowerCase().includes(q) ||
      p.department.toLowerCase().includes(q) ||
      p.attendingDoctor.toLowerCase().includes(q) ||
      p.reasonForAdmission.toLowerCase().includes(q);

    const matchesDept = deptFilter === 'All' || p.department.toLowerCase() === deptFilter.toLowerCase();
    const matchesStatus = statusFilter === 'All' || p.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesDept && matchesStatus;
  });

  // Calculate total counts for badges
  const totalUploadedDocs = timelineEntries.reduce(
    (acc, e) => acc + (e.attachments ? e.attachments.length : 0),
    0
  );
  const totalLabTests = timelineEntries.reduce(
    (acc, e) => acc + (e.structuredData?.tests ? e.structuredData.tests.length : 0),
    0
  );
  const totalMeds = timelineEntries.reduce(
    (acc, e) => acc + (e.structuredData?.medications ? e.structuredData.medications.length : 0),
    0
  );
  const totalPrescriptions = timelineEntries.filter(
    e => e.entryType === 'Prescription' || (e.structuredData?.medications && e.structuredData.medications.length > 0 && e.title.toLowerCase().includes('prescription'))
  ).length;

  return (
    <div id="live-patient-record-page" className="min-h-screen bg-slate-50/50 pb-20">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div
            className={`flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-xl border text-sm font-semibold ${
              notification.type === 'success'
                ? 'bg-emerald-900 text-white border-emerald-700'
                : 'bg-rose-900 text-white border-rose-700'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
                <Activity className="w-4 h-4" /> Live Electronic Health Record (EHR) & AI Charting
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                Live Patient Health Record
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                Admit patients directly, upload medical files, run live AI document OCR analysis, synthesize clinical notes, write prescriptions, and maintain a continuous inpatient timeline.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                id="admit-new-patient-btn"
                onClick={() => setIsAdmitModalOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <UserPlus className="w-4 h-4" /> Direct Admit Patient
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Patient Directory Selector (4 cols on desktop) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Admitted Patients ({filteredPatients.length})
                </span>
                <button
                  onClick={() => setIsAdmitModalOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" /> Direct Admit
                </button>
              </div>

              {/* Search & Filter */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search patient, UHID, department..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <select
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-[11px] font-medium"
                >
                  <option value="All">All Departments</option>
                  <option value="Cardiology">Cardiology</option>
                  <option value="Internal Medicine">Internal Medicine</option>
                  <option value="Pulmonology">Pulmonology</option>
                  <option value="Endocrinology">Endocrinology</option>
                  <option value="Emergency">Emergency</option>
                  <option value="Neurology">Neurology</option>
                  <option value="Pediatrics">Pediatrics</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                  className="px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl outline-hidden text-[11px] font-medium"
                >
                  <option value="All">All Statuses</option>
                  <option value="Admitted">Admitted</option>
                  <option value="Under Observation">Under Observation</option>
                  <option value="ICU Care">ICU Care</option>
                  <option value="Discharged">Discharged</option>
                </select>
              </div>

              {/* Patient List */}
              <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
                {patients.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                    <p className="font-bold text-slate-700 text-sm">No patient records yet.</p>
                    <p className="text-slate-400">Add a patient to begin.</p>
                  </div>
                ) : filteredPatients.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    No matching patient records found.
                  </div>
                ) : (
                  filteredPatients.map(p => {
                    const isSelected = selectedPatient?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => handleSelectPatient(p)}
                        className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-blue-50/80 border-blue-400 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-xs text-slate-900 truncate">
                            {p.patientName}
                          </span>
                          <span className="font-mono text-[10px] text-blue-700 bg-blue-100/70 px-1.5 py-0.5 rounded font-bold">
                            {p.uhid}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1 truncate">
                          {p.department} • {p.bedRoomNo || 'General Inpatient'}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[10px]">
                          <span
                            className={`px-1.5 py-0.5 rounded font-semibold ${
                              p.status === 'Admitted'
                                ? 'bg-emerald-50 text-emerald-700'
                                : p.status === 'Discharged'
                                ? 'bg-slate-100 text-slate-600'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {p.status}
                          </span>
                          <span className="text-slate-400 font-mono">
                            {p.entriesCount || 0} entries
                          </span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Selected Patient Live Record Workspace (8 cols) */}
          <div className="lg:col-span-8 space-y-6">
            {!selectedPatient ? (
              <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-xs space-y-3">
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
                  <Activity className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">
                  {patients.length === 0 ? 'No patient records yet.' : 'Select a Patient'}
                </h3>
                <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
                  {patients.length === 0
                    ? 'Add a patient to begin.'
                    : 'Choose an admitted patient from the directory on the left or click "Direct Admit Patient" to create a new live record.'}
                </p>
                <div className="pt-2">
                  <button
                    id="empty-state-admit-btn"
                    onClick={() => setIsAdmitModalOpen(true)}
                    className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" /> Direct Admit Patient
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Patient Header Summary & Quick Action Bar */}
                <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-xl font-extrabold text-slate-900">
                          {selectedPatient.patientName}
                        </h2>
                        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-200">
                          UHID: {selectedPatient.uhid}
                        </span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                            selectedPatient.status === 'Admitted'
                              ? 'bg-emerald-100 text-emerald-800'
                              : selectedPatient.status === 'Discharged'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {selectedPatient.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        {selectedPatient.patientAge} Yrs • {selectedPatient.patientGender} • Blood Group: <strong className="text-slate-700">{selectedPatient.bloodGroup || 'N/A'}</strong> • Bed/Ward: <strong className="text-slate-700">{selectedPatient.bedRoomNo || 'General'}</strong>
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={handleDownloadFullChart}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                        title="Download Complete Patient Chart PDF"
                      >
                        <Download className="w-3.5 h-3.5 text-blue-600" /> Export PDF Chart
                      </button>
                      <button
                        onClick={() => setIsEditPatientModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Record
                      </button>
                    </div>
                  </div>

                  {/* Top Action Buttons (Upload, Prescription, Add Entry, AI Summary) */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Upload className="w-3.5 h-3.5" /> Upload & Analyze File
                    </button>

                    <button
                      onClick={() => setIsPrescriptionModalOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Pill className="w-3.5 h-3.5" /> Write Prescription
                    </button>

                    <button
                      onClick={() => openAddEntryModalWithType()}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Timeline Entry
                    </button>

                    <button
                      onClick={handleGenerateSummary}
                      disabled={isGeneratingSummary}
                      className="inline-flex items-center justify-center gap-1.5 px-3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                      {isGeneratingSummary ? 'Synthesizing...' : 'Create AI Summary'}
                    </button>
                  </div>

                  {/* Demographic & Admission Details Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Department</span>
                      <span className="font-semibold text-slate-800">{selectedPatient.department}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Attending Doctor</span>
                      <span className="font-semibold text-slate-800 truncate block">{selectedPatient.attendingDoctor}</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                      <span className="text-[10px] text-slate-400 uppercase font-bold block">Admission Time</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(selectedPatient.admissionDateTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-200/80">
                      <span className="text-[10px] text-rose-600 uppercase font-bold block">Allergies</span>
                      <span className="font-bold text-rose-900 truncate block">{selectedPatient.allergies || 'NKDA'}</span>
                    </div>
                  </div>
                </div>

                {/* Navigation Tabs */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-1 flex flex-wrap items-center gap-1 text-xs font-bold overflow-x-auto">
                  <button
                    id="tab-overview"
                    onClick={() => setActiveTab('overview')}
                    className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'overview'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Overview
                  </button>

                  <button
                    id="tab-documents"
                    onClick={() => setActiveTab('documents')}
                    className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'documents'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Paperclip className="w-3.5 h-3.5" /> Documents ({totalUploadedDocs})
                  </button>

                  <button
                    id="tab-upload-document"
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-3 py-2 rounded-xl text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors cursor-pointer flex items-center gap-1.5 border border-blue-200"
                    title="Upload Medical Documents (PDF, JPG, PNG)"
                  >
                    <Upload className="w-3.5 h-3.5" /> Upload Document
                  </button>

                  <button
                    id="tab-labs"
                    onClick={() => setActiveTab('labs')}
                    className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'labs'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FlaskConical className="w-3.5 h-3.5" /> Labs & Vitals ({totalLabTests})
                  </button>

                  <button
                    id="tab-medications"
                    onClick={() => setActiveTab('medications')}
                    className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'medications'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Pill className="w-3.5 h-3.5" /> Medications ({totalMeds})
                  </button>

                  <button
                    id="tab-diagnoses"
                    onClick={() => setActiveTab('diagnoses')}
                    className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'diagnoses'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Stethoscope className="w-3.5 h-3.5" /> Diagnoses & Notes
                  </button>

                  <button
                    id="tab-prescriptions"
                    onClick={() => setActiveTab('prescriptions')}
                    className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'prescriptions'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" /> Prescriptions ({totalPrescriptions})
                  </button>

                  <button
                    id="tab-timeline"
                    onClick={() => setActiveTab('timeline')}
                    className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'timeline'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> Timeline ({timelineEntries.length})
                  </button>

                  <button
                    id="tab-profile"
                    onClick={() => setActiveTab('profile')}
                    className={`px-3 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 ${
                      activeTab === 'profile'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" /> Patient Profile
                  </button>
                </div>

                {/* Tab Views */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    {/* Top Overview Action Bar */}
                    <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                          <Sparkles className="w-4 h-4" /> AI Actions & Diagnostics
                        </div>
                        <h4 className="text-base font-extrabold text-slate-900">
                          AI Medical Intelligence Actions
                        </h4>
                        <p className="text-xs text-slate-500">
                          Extract structured clinical data from uploaded records or generate an updated synthesis.
                        </p>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0">
                        <button
                          id="overview-analyze-docs-btn"
                          onClick={() => setIsUploadModalOpen(true)}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
                        >
                          <Upload className="w-4 h-4" /> Analyze Documents
                        </button>

                        <button
                          id="overview-create-summary-btn"
                          onClick={handleGenerateSummary}
                          disabled={isGeneratingSummary}
                          className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Sparkles className="w-4 h-4 text-blue-400" />
                          {isGeneratingSummary ? 'Synthesizing...' : 'Create AI Summary'}
                        </button>
                      </div>
                    </div>

                    {/* Top Section: AI Summary */}
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                          <Sparkles className="w-4 h-4 text-blue-600" /> AI Current Clinical Synthesis
                        </h3>
                        <button
                          onClick={handleGenerateSummary}
                          disabled={isGeneratingSummary}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isGeneratingSummary ? 'animate-spin' : ''}`} /> Refresh AI Summary
                        </button>
                      </div>
                      <AiCurrentSummaryView
                        patient={selectedPatient}
                        summary={currentAiSummary}
                        entriesCount={timelineEntries.length}
                        isGenerating={isGeneratingSummary}
                        onRefreshSummary={handleGenerateSummary}
                      />
                    </div>

                    {/* Bottom Section: Chronological Timeline Preview */}
                    <div className="pt-6 border-t border-slate-200">
                      <div className="flex items-center justify-between mb-4">
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-blue-600" /> Patient Chronological Timeline ({timelineEntries.length} records)
                          </h3>
                          <p className="text-xs text-slate-500">
                            Continuously documented clinical notes, lab results, imaging, and medication orders.
                          </p>
                        </div>
                        <button
                          onClick={() => openAddEntryModalWithType()}
                          className="inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add Note
                        </button>
                      </div>
                      <PatientTimeline
                        entries={timelineEntries}
                        highlightedEntryId={highlightedTimelineEntryId}
                        onAddEntryClick={() => openAddEntryModalWithType()}
                        onDeleteEntry={handleDeleteEntry}
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'timeline' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-base font-bold text-slate-900">
                        Complete Chronological Timeline ({timelineEntries.length})
                      </h3>
                      <button
                        onClick={() => openAddEntryModalWithType()}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Entry
                      </button>
                    </div>
                    <PatientTimeline
                      entries={timelineEntries}
                      highlightedEntryId={highlightedTimelineEntryId}
                      onAddEntryClick={() => openAddEntryModalWithType()}
                      onDeleteEntry={handleDeleteEntry}
                    />
                  </div>
                )}

                {activeTab === 'documents' && (
                  <PatientDocumentsView
                    entries={timelineEntries}
                    patientName={selectedPatient.patientName}
                    uhid={selectedPatient.uhid}
                    onOpenUploadModal={() => setIsUploadModalOpen(true)}
                    onPreviewDocument={att => setPreviewAttachment(att)}
                    onDeleteDocument={handleDeleteEntry}
                  />
                )}

                {activeTab === 'labs' && (
                  <PatientLabsAndVitalsView
                    patient={selectedPatient}
                    entries={timelineEntries}
                    onOpenAddEntryModal={type => openAddEntryModalWithType(type)}
                  />
                )}

                {activeTab === 'medications' && (
                  <PatientMedicationsView
                    patient={selectedPatient}
                    entries={timelineEntries}
                    summary={currentAiSummary}
                    onOpenWritePrescriptionModal={() => setIsPrescriptionModalOpen(true)}
                    onOpenAddEntryModal={type => openAddEntryModalWithType(type)}
                  />
                )}

                {activeTab === 'diagnoses' && (
                  <PatientDiagnosesView
                    patient={selectedPatient}
                    entries={timelineEntries}
                    summary={currentAiSummary}
                    onOpenAddEntryModal={type => openAddEntryModalWithType(type)}
                  />
                )}

                {activeTab === 'prescriptions' && (
                  <PatientPrescriptionsView
                    patient={selectedPatient}
                    entries={timelineEntries}
                    onOpenWritePrescriptionModal={() => setIsPrescriptionModalOpen(true)}
                  />
                )}

                {activeTab === 'profile' && (
                  <PatientProfileView
                    patient={selectedPatient}
                    onEditPatient={() => setIsEditPatientModalOpen(true)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AdmitPatientModal
        isOpen={isAdmitModalOpen}
        onClose={() => setIsAdmitModalOpen(false)}
        onPatientAdmitted={handlePatientAdmitted}
      />

      {selectedPatient && (
        <>
          <AddTimelineEntryModal
            isOpen={isAddEntryModalOpen}
            onClose={() => setIsAddEntryModalOpen(false)}
            patientRecordId={selectedPatient.id}
            uhid={selectedPatient.uhid}
            patientName={selectedPatient.patientName}
            defaultAuthorName={selectedPatient.attendingDoctor}
            initialEntryType={addEntryDefaultType}
            onEntryAdded={handleEntryAdded}
          />

          <EditPatientModal
            isOpen={isEditPatientModalOpen}
            onClose={() => setIsEditPatientModalOpen(false)}
            patient={selectedPatient}
            onPatientUpdated={handlePatientUpdated}
          />

          <UploadAndAnalyzeModal
            isOpen={isUploadModalOpen}
            onClose={() => setIsUploadModalOpen(false)}
            patientRecordId={selectedPatient.id}
            uhid={selectedPatient.uhid}
            patientName={selectedPatient.patientName}
            defaultAuthorName={selectedPatient.attendingDoctor}
            onEntryAdded={handleEntryAdded}
            onRefreshSummaryRequested={handleGenerateSummary}
          />

          <WritePrescriptionModal
            isOpen={isPrescriptionModalOpen}
            onClose={() => setIsPrescriptionModalOpen(false)}
            patientRecordId={selectedPatient.id}
            uhid={selectedPatient.uhid}
            patientName={selectedPatient.patientName}
            patientAge={selectedPatient.patientAge}
            patientGender={selectedPatient.patientGender}
            defaultDoctorName={selectedPatient.attendingDoctor}
            onEntryAdded={handleEntryAdded}
          />

          <DocumentViewerModal
            isOpen={!!previewAttachment}
            onClose={() => setPreviewAttachment(null)}
            attachment={previewAttachment}
            patientName={selectedPatient.patientName}
          />
        </>
      )}
    </div>
  );
};
