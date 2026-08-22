import React, { useState, useEffect } from 'react';
import {
  User as UserIcon,
  FileText,
  Pill,
  Calendar,
  Activity,
  ArrowRight,
  Download,
  Search,
  Filter,
  Plus,
  GitCompare,
  Clock,
  ShieldCheck,
  Stethoscope,
  Trash2,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Info,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Heart,
  CalendarDays,
  FileCheck,
  HeartPulse
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { LabReportAnalysis, Prescription, ClinicalNote, Appointment, BmiRecord, AuditLog, ReportComparisonResult } from '../types.js';
import { downloadPrescriptionPDF, downloadReportPDF, downloadHealthSummaryPDF, downloadReportComparisonPDF } from '../utils/pdfExport.js';
import { SEOHead } from '../components/SEOHead.js';
import { DisclaimerBanner } from '../components/DisclaimerBanner.js';

interface PatientDashboardProps {
  onNavigate: (page: string) => void;
}

export const PatientDashboard: React.FC<PatientDashboardProps> = ({ onNavigate }) => {
  const { user, token, logout, setActiveReport } = useAuth();
  const [activeTab, setActiveTab] = useState<
    'reports' | 'compare' | 'prescriptions' | 'history' | 'appointments' | 'downloads' | 'overview' | 'audit'
  >('reports');

  const [reports, setReports] = useState<LabReportAnalysis[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [clinicalNotes, setClinicalNotes] = useState<ClinicalNote[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [bmiRecords, setBmiRecords] = useState<BmiRecord[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [copiedId, setCopiedId] = useState(false);

  // Search and filter for reports
  const [reportSearch, setReportSearch] = useState('');
  const [reportStatusFilter, setReportStatusFilter] = useState<'ALL' | 'Normal' | 'Abnormal'>('ALL');

  // Report comparison state
  const [prevReportId, setPrevReportId] = useState<string>('');
  const [currReportId, setCurrReportId] = useState<string>('');
  const [comparisonResult, setComparisonResult] = useState<ReportComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [compareError, setCompareError] = useState<string | null>(null);

  // Selected prescription modal / view
  const [selectedPrescription, setSelectedPrescription] = useState<Prescription | null>(null);

  const fetchDashboardData = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      const [repRes, rxRes, notesRes, apptRes, bmiRes, auditRes] = await Promise.all([
        fetch('/api/reports', { headers }),
        fetch('/api/prescriptions', { headers }),
        fetch('/api/clinical-notes', { headers }),
        fetch('/api/appointments', { headers }),
        fetch('/api/bmi', { headers }),
        fetch('/api/audit-logs', { headers })
      ]);

      if (repRes.ok) {
        const d = await repRes.json();
        setReports(d.reports || []);
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
      if (bmiRes.ok) {
        const d = await bmiRes.json();
        setBmiRecords(d.records || []);
      }
      if (auditRes.ok) {
        const d = await auditRes.json();
        setAuditLogs(d.logs || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [token]);

  const handleCopyPatientId = () => {
    if (user?.patientId) {
      navigator.clipboard.writeText(user.patientId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    if (!token || !window.confirm('Are you sure you want to permanently delete this lab report?')) return;
    try {
      const res = await fetch(`/api/reports/${reportId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setReports(prev => prev.filter(r => r.id !== reportId));
      }
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  const handleViewReport = (report: LabReportAnalysis) => {
    setActiveReport(report);
    onNavigate('lab-report');
  };

  const handleRunComparison = async () => {
    if (!prevReportId || !currReportId) {
      setCompareError('Please select both a baseline and a follow-up report to compare.');
      return;
    }
    if (prevReportId === currReportId) {
      setCompareError('Please select two different reports for comparison.');
      return;
    }

    setIsComparing(true);
    setCompareError(null);

    try {
      const res = await fetch('/api/reports/compare', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          previousReportId: prevReportId,
          currentReportId: currReportId
        })
      });

      const data = await res.json();
      if (res.ok && data.comparison) {
        setComparisonResult(data.comparison);
      } else {
        setCompareError(data.error || 'Failed to compare reports.');
      }
    } catch (err: any) {
      setCompareError('Error executing comparison.');
    } finally {
      setIsComparing(false);
    }
  };

  const filteredReports = reports.filter(r => {
    const matchesSearch =
      r.fileName.toLowerCase().includes(reportSearch.toLowerCase()) ||
      r.testResults.some(t => t.testName.toLowerCase().includes(reportSearch.toLowerCase()));

    if (!matchesSearch) return false;

    if (reportStatusFilter === 'Normal') {
      return r.testResults.every(t => t.status === 'Normal');
    } else if (reportStatusFilter === 'Abnormal') {
      return r.testResults.some(t => t.status !== 'Normal');
    }
    return true;
  });

  // Timeline events compilation
  const timelineEvents = [
    ...reports.map(r => ({
      id: r.id,
      date: r.uploadedAt,
      type: 'report' as const,
      title: `Lab Report Uploaded: ${r.fileName}`,
      subtitle: `${r.testResults.length} parameters analyzed (${r.testResults.filter(t => t.status !== 'Normal').length} flagged)`,
      data: r
    })),
    ...prescriptions.map(p => ({
      id: p.id,
      date: p.createdAt,
      type: 'prescription' as const,
      title: `Prescription Authored by ${p.doctorName}`,
      subtitle: `Diagnosis: ${p.diagnosis} • ${p.medicines.length} medications`,
      data: p
    })),
    ...clinicalNotes.map(n => ({
      id: n.id,
      date: n.createdAt,
      type: 'note' as const,
      title: `Clinical Assessment by ${n.doctorName}`,
      subtitle: `Diagnosis: ${n.diagnosis} • ${n.treatmentPlan}`,
      data: n
    })),
    ...appointments.map(a => ({
      id: a.id,
      date: a.createdAt,
      type: 'appointment' as const,
      title: `Consultation with ${a.doctorName}`,
      subtitle: `Scheduled for ${a.appointmentDate} at ${a.appointmentTime} (${a.status})`,
      data: a
    })),
    ...bmiRecords.map(b => ({
      id: b.id,
      date: b.date,
      type: 'bmi' as const,
      title: `BMI Health Check (${b.bmi.toFixed(1)} - ${b.category})`,
      subtitle: `Height: ${b.heightCm} cm • Weight: ${b.weightKg} kg`,
      data: b
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div id="patient-dashboard-container" className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Patient Health Portal & Medical Records | MediVerse"
        description="Private patient health records, laboratory reports, and prescription management."
        canonicalPath="/patient-dashboard"
        noIndex={true}
      />
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Top Header Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="w-16 h-16 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md shadow-blue-600/20">
                {user?.name?.charAt(0) || 'P'}
              </div>
              <div>
                <div className="flex items-center gap-3 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                    {user?.name || 'Patient'}
                  </h1>
                  <span className="px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 rounded-full text-xs font-semibold uppercase tracking-wider">
                    Patient Portal
                  </span>
                </div>
                <div className="flex items-center gap-3 mt-1.5 flex-wrap text-xs sm:text-sm text-slate-600">
                  <div className="flex items-center gap-1.5 font-mono bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                    <span className="text-slate-500">ID:</span>
                    <span className="font-bold text-blue-700">{user?.patientId || 'PT-PENDING'}</span>
                    <button
                      onClick={handleCopyPatientId}
                      title="Copy Patient ID"
                      className="ml-1 text-slate-400 hover:text-blue-600 cursor-pointer"
                    >
                      {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <span>•</span>
                  <span>{user?.email}</span>
                  {user?.phone && (
                    <>
                      <span>•</span>
                      <span>{user.phone}</span>
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
                onClick={() =>
                  user &&
                  downloadHealthSummaryPDF(user, reports, prescriptions, clinicalNotes, bmiRecords)
                }
                className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Health Summary (PDF)</span>
              </button>
            </div>
          </div>

          {/* Demographics & Vitals Ribbon */}
          <div className="mt-6 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4 text-xs">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Age / Gender</span>
              <span className="font-semibold text-slate-800 text-sm">
                {user?.age ? `${user.age} yrs` : '—'} / {user?.gender || '—'}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Blood Group</span>
              <span className="font-semibold text-slate-800 text-sm">{user?.bloodGroup || '—'}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Allergies</span>
              <span className="font-semibold text-slate-800 text-sm truncate block" title={user?.allergies || 'None'}>
                {user?.allergies || 'None Recorded'}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Emergency Contact</span>
              <span className="font-semibold text-slate-800 text-sm truncate block" title={user?.emergencyContact || '—'}>
                {user?.emergencyContact || '—'}
              </span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Total Lab Reports</span>
              <span className="font-bold text-blue-600 text-sm">{reports.length}</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
              <span className="text-slate-500 block">Active Prescriptions</span>
              <span className="font-bold text-blue-600 text-sm">{prescriptions.length}</span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs (Strict 6 Sub-features inside My Health Records) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'reports', label: `1. My Reports (${reports.length})`, icon: FileText },
            { id: 'compare', label: '2. Compare Reports', icon: GitCompare },
            { id: 'prescriptions', label: `3. My Prescriptions (${prescriptions.length})`, icon: Pill },
            { id: 'history', label: '4. Health History', icon: Clock },
            { id: 'appointments', label: `5. My Appointments (${appointments.length})`, icon: Calendar },
            { id: 'downloads', label: '6. Download Reports', icon: Download },
            { id: 'audit', label: 'Access Audit Log', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`health-records-tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id as any)}
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

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Quick Action Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <button
                onClick={() => onNavigate('lab-report')}
                className="p-5 bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl shadow-sm text-left hover:shadow-md transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <h3 className="font-bold text-base">Analyze Lab Report</h3>
                <p className="text-xs text-blue-100 mt-1">Upload blood, urine, or lipid panel for AI breakdown</p>
                <div className="flex items-center gap-1 text-xs font-semibold mt-4 text-white/90 group-hover:translate-x-1 transition-transform">
                  <span>Open Tool</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              <button
                onClick={() => setActiveTab('compare')}
                className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm text-left hover:border-blue-300 transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <GitCompare className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Compare Lab Reports</h3>
                <p className="text-xs text-slate-500 mt-1">Longitudinal tracking of parameters over time</p>
                <div className="flex items-center gap-1 text-xs font-semibold mt-4 text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Compare Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              <button
                onClick={() => onNavigate('appointments')}
                className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm text-left hover:border-blue-300 transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">Book Doctor Visit</h3>
                <p className="text-xs text-slate-500 mt-1">Schedule appointment with verified specialists</p>
                <div className="flex items-center gap-1 text-xs font-semibold mt-4 text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>View Doctors</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>

              <button
                onClick={() => onNavigate('bmi')}
                className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm text-left hover:border-blue-300 transition-all group cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                  <Activity className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900">BMI & Health Metrics</h3>
                <p className="text-xs text-slate-500 mt-1">Calculate body mass index and healthy target weights</p>
                <div className="flex items-center gap-1 text-xs font-semibold mt-4 text-blue-600 group-hover:translate-x-1 transition-transform">
                  <span>Check BMI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            </div>

            {/* Main 2-Column Split: Recent Reports vs Active Prescriptions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Reports Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-slate-900">Recent Lab Analyses</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('reports')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View All ({reports.length})
                  </button>
                </div>

                {reports.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl space-y-3">
                    <FileText className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-500">No lab reports uploaded yet.</p>
                    <button
                      onClick={() => onNavigate('lab-report')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                    >
                      Analyze First Report
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.slice(0, 4).map(report => {
                      const abnormalCount = report.testResults.filter(t => t.status !== 'Normal').length;
                      return (
                        <div
                          key={report.id}
                          className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-4 hover:bg-slate-100/70 transition-colors"
                        >
                          <div className="min-w-0 space-y-1">
                            <h4 className="text-sm font-bold text-slate-900 truncate">{report.fileName}</h4>
                            <div className="flex items-center gap-2 text-xs text-slate-500">
                              <span>{new Date(report.uploadedAt).toLocaleDateString()}</span>
                              <span>•</span>
                              <span>{report.testResults.length} parameters</span>
                              <span>•</span>
                              {abnormalCount > 0 ? (
                                <span className="text-amber-600 font-medium">
                                  {abnormalCount} Attention/Flagged
                                </span>
                              ) : (
                                <span className="text-emerald-600 font-medium">All Normal</span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <button
                              onClick={() => downloadReportPDF(report)}
                              title="Download PDF"
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition-all cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleViewReport(report)}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <span>View</span>
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Active Prescriptions Card */}
              <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Pill className="w-5 h-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-slate-900">Active Prescriptions</h2>
                  </div>
                  <button
                    onClick={() => setActiveTab('prescriptions')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                  >
                    View All ({prescriptions.length})
                  </button>
                </div>

                {prescriptions.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl space-y-3">
                    <Pill className="w-8 h-8 text-slate-300 mx-auto" />
                    <p className="text-sm text-slate-500">No prescriptions recorded yet.</p>
                    <p className="text-xs text-slate-400">
                      When your consulting physician issues a prescription, it will appear here.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {prescriptions.slice(0, 3).map(rx => (
                      <div
                        key={rx.id}
                        className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-2 hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded">
                              {rx.prescriptionNumber}
                            </span>
                            <span className="text-xs text-slate-500">{new Date(rx.createdAt).toLocaleDateString()}</span>
                          </div>
                          <span className="text-xs font-semibold text-slate-700">{rx.doctorName}</span>
                        </div>

                        <p className="text-sm font-semibold text-slate-800">
                          Diagnosis: <span className="font-normal text-slate-600">{rx.diagnosis}</span>
                        </p>

                        <div className="text-xs text-slate-600 flex flex-wrap gap-1.5">
                          {rx.medicines.map((m, idx) => (
                            <span key={idx} className="bg-white px-2 py-1 rounded-md border border-slate-200 font-medium">
                              {m.name} {m.strength ? `(${m.strength})` : ''} - {m.frequency}
                            </span>
                          ))}
                        </div>

                        <div className="pt-2 flex items-center justify-between border-t border-slate-200/60">
                          {rx.followUpDate ? (
                            <span className="text-xs text-blue-600 font-medium">
                              Follow up: {new Date(rx.followUpDate).toLocaleDateString()}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-400">Standard course</span>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => downloadPrescriptionPDF(rx)}
                              className="px-2.5 py-1 bg-white hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200 flex items-center gap-1 cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>PDF</span>
                            </button>
                            <button
                              onClick={() => setSelectedPrescription(rx)}
                              className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer"
                            >
                              Details
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Upcoming Appointments */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-bold text-slate-900">Scheduled Consultations</h2>
                </div>
                <button
                  onClick={() => onNavigate('appointments')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700"
                >
                  Book New Appointment
                </button>
              </div>

              {appointments.length === 0 ? (
                <p className="text-sm text-slate-500 py-4">No upcoming doctor appointments scheduled.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {appointments.map(appt => (
                    <div
                      key={appt.id}
                      className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-mono font-bold text-slate-500">{appt.appointmentCode}</span>
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                              appt.status === 'Confirmed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : appt.status === 'Cancelled'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {appt.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-2">{appt.doctorName}</h4>
                        <p className="text-xs text-blue-600 font-medium">{appt.specialty}</p>
                      </div>

                      <div className="pt-2 border-t border-slate-200/60 text-xs text-slate-600 flex items-center justify-between">
                        <span className="font-semibold">{appt.appointmentDate}</span>
                        <span>{appt.appointmentTime}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: LAB REPORTS ARCHIVE */}
        {activeTab === 'reports' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Lab Report Archive</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Access and search your full historical blood and diagnostic analyses
                </p>
              </div>
              <button
                onClick={() => onNavigate('lab-report')}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Upload New Report</span>
              </button>
            </div>

            {/* Filter and Search */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={reportSearch}
                  onChange={e => setReportSearch(e.target.value)}
                  placeholder="Search by report filename or test name (e.g. Glucose, Hemoglobin)..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="w-4 h-4 text-slate-500" />
                <select
                  value={reportStatusFilter}
                  onChange={e => setReportStatusFilter(e.target.value as any)}
                  className="p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-blue-600 cursor-pointer"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Normal">All Normal</option>
                  <option value="Abnormal">Attention / Flagged</option>
                </select>
              </div>
            </div>

            {/* Reports List */}
            {filteredReports.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl space-y-3">
                <FileText className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-600 font-medium">No reports match your search criteria.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredReports.map(report => {
                  const normalCount = report.testResults.filter(t => t.status === 'Normal').length;
                  const abnormalCount = report.testResults.filter(t => t.status !== 'Normal').length;

                  return (
                    <div
                      key={report.id}
                      className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 hover:border-blue-300 transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-base font-bold text-slate-900 break-all">{report.fileName}</h4>
                          <span className="text-xs px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 font-mono shrink-0">
                            {new Date(report.uploadedAt).toLocaleDateString()}
                          </span>
                        </div>

                        <p className="text-xs text-slate-600 line-clamp-2">{report.healthSummary}</p>

                        <div className="flex items-center gap-3 text-xs pt-1">
                          <span className="text-slate-500 font-medium">
                            {report.testResults.length} Parameters
                          </span>
                          <span className="text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded">
                            {normalCount} Normal
                          </span>
                          {abnormalCount > 0 && (
                            <span className="text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded">
                              {abnormalCount} Flagged
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                        <button
                          onClick={() => handleDeleteReport(report.id)}
                          className="p-2 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          title="Delete Report"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => downloadReportPDF(report)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 flex items-center gap-1.5 cursor-pointer"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => handleViewReport(report)}
                            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer"
                          >
                            <span>Inspect Analysis</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REPORT COMPARISON TOOL */}
        {activeTab === 'compare' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Lab Report Comparison Tool</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Select two past lab tests to track longitudinal health trends and parameter fluctuations
                </p>
              </div>

              {comparisonResult && (
                <button
                  onClick={() => downloadReportComparisonPDF(comparisonResult)}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Comparison PDF</span>
                </button>
              )}
            </div>

            {reports.length < 2 ? (
              <div className="text-center py-10 bg-blue-50 rounded-2xl border border-blue-200 space-y-2">
                <Info className="w-8 h-8 text-blue-600 mx-auto" />
                <h4 className="font-bold text-slate-800">At least 2 uploaded reports are required</h4>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Upload another lab report to unlock automated side-by-side delta parameter tracking.
                </p>
                <button
                  onClick={() => onNavigate('lab-report')}
                  className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold hover:bg-blue-700 cursor-pointer"
                >
                  Upload Second Report
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      1. Baseline / Earlier Report
                    </label>
                    <select
                      value={prevReportId}
                      onChange={e => setPrevReportId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-blue-600 cursor-pointer"
                    >
                      <option value="">-- Choose Baseline Lab Test --</option>
                      {reports.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.fileName} ({new Date(r.uploadedAt).toLocaleDateString()}) - {r.testResults.length} params
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-xs font-semibold text-slate-700">
                      2. Follow-Up / Recent Report
                    </label>
                    <select
                      value={currReportId}
                      onChange={e => setCurrReportId(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:border-blue-600 cursor-pointer"
                    >
                      <option value="">-- Choose Follow-Up Lab Test --</option>
                      {reports.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.fileName} ({new Date(r.uploadedAt).toLocaleDateString()}) - {r.testResults.length} params
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {compareError && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{compareError}</span>
                  </div>
                )}

                <button
                  onClick={handleRunComparison}
                  disabled={isComparing || !prevReportId || !currReportId}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all cursor-pointer"
                >
                  <RefreshCw className={`w-4 h-4 ${isComparing ? 'animate-spin' : ''}`} />
                  <span>{isComparing ? 'Analyzing Differences...' : 'Run Side-by-Side Comparison'}</span>
                </button>

                {/* Comparison Results Display */}
                {comparisonResult && (
                  <div className="space-y-6 pt-4 border-t border-slate-200">
                    <div className="p-4 bg-blue-50/70 rounded-2xl border border-blue-200 text-xs sm:text-sm text-slate-700 leading-relaxed">
                      <strong className="text-blue-900 block mb-1">Comparison Overview:</strong>
                      {comparisonResult.summary}
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-200">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-3.5">Test Parameter</th>
                            <th className="p-3.5">Reference Range</th>
                            <th className="p-3.5">Previous Value</th>
                            <th className="p-3.5">Current Value</th>
                            <th className="p-3.5">Change / Delta</th>
                            <th className="p-3.5">Trend</th>
                            <th className="p-3.5">Clinical Note</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {comparisonResult.comparedTests.map((item, idx) => {
                            let trendBadge = (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded font-medium">
                                Stable
                              </span>
                            );
                            if (item.trend === 'improved') {
                              trendBadge = (
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold flex items-center gap-1">
                                  <TrendingUp className="w-3 h-3" /> Improved
                                </span>
                              );
                            } else if (item.trend === 'concerning') {
                              trendBadge = (
                                <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded font-bold flex items-center gap-1">
                                  <TrendingDown className="w-3 h-3" /> Concerning
                                </span>
                              );
                            } else if (item.trend === 'increased') {
                              trendBadge = (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                                  Increased
                                </span>
                              );
                            } else if (item.trend === 'decreased') {
                              trendBadge = (
                                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded font-medium">
                                  Decreased
                                </span>
                              );
                            }

                            return (
                              <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                                <td className="p-3.5 font-bold text-slate-900">{item.testName}</td>
                                <td className="p-3.5 text-slate-500">{item.referenceRange || '—'}</td>
                                <td className="p-3.5">
                                  {item.prevValue ? (
                                    <span
                                      className={`font-semibold ${
                                        item.prevStatus === 'Normal' ? 'text-emerald-700' : 'text-amber-700'
                                      }`}
                                    >
                                      {item.prevValue} {item.unit}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="p-3.5">
                                  {item.currValue ? (
                                    <span
                                      className={`font-semibold ${
                                        item.currStatus === 'Normal' ? 'text-emerald-700' : 'text-amber-700'
                                      }`}
                                    >
                                      {item.currValue} {item.unit}
                                    </span>
                                  ) : (
                                    <span className="text-slate-400">—</span>
                                  )}
                                </td>
                                <td className="p-3.5 font-mono text-slate-700 font-semibold">{item.deltaText}</td>
                                <td className="p-3.5">{trendBadge}</td>
                                <td className="p-3.5 text-xs text-slate-600 max-w-xs">{item.generalInterpretation}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PRESCRIPTIONS */}
        {activeTab === 'prescriptions' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Official Prescriptions</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Digital prescriptions authored by verified MediVerse physicians
              </p>
            </div>

            {prescriptions.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl space-y-3">
                <Pill className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-600 font-medium">No prescriptions found.</p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  When a doctor prescribes medication during your consultation, the prescription is securely filed here.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {prescriptions.map(rx => (
                  <div
                    key={rx.id}
                    className="p-6 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 hover:border-blue-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg">
                          Rx
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base">{rx.prescriptionNumber}</h3>
                          <p className="text-xs text-slate-500">
                            Issued by {rx.doctorName} ({rx.doctorSpecialty}) on{' '}
                            {new Date(rx.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => downloadPrescriptionPDF(rx)}
                        className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Prescription (PDF)</span>
                      </button>
                    </div>

                    <div className="space-y-1">
                      <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Diagnosis</span>
                      <p className="text-sm font-semibold text-slate-900">{rx.diagnosis}</p>
                    </div>

                    {/* Medicines Table */}
                    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                      <table className="w-full text-left text-xs sm:text-sm">
                        <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                          <tr>
                            <th className="p-3">#</th>
                            <th className="p-3">Medicine / Strength</th>
                            <th className="p-3">Frequency</th>
                            <th className="p-3">Duration</th>
                            <th className="p-3">Instructions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {rx.medicines.map((med, idx) => (
                            <tr key={idx}>
                              <td className="p-3 text-slate-400 font-mono">{idx + 1}</td>
                              <td className="p-3 font-bold text-slate-900">
                                {med.name} {med.strength && <span className="text-slate-500 font-normal">({med.strength})</span>}
                              </td>
                              <td className="p-3 font-medium text-blue-700">{med.frequency}</td>
                              <td className="p-3 text-slate-600">{med.duration}</td>
                              <td className="p-3 text-slate-600">{med.instructions}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    <div className="pt-2 text-xs text-slate-600 space-y-1">
                      <p>
                        <strong>Instructions:</strong> {rx.instructions}
                      </p>
                      {rx.followUpDate && (
                        <p className="text-blue-700 font-semibold">
                          Follow-up Scheduled: {new Date(rx.followUpDate).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: HEALTH HISTORY (Timeline + Clinical Notes + Vitals) */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">Health History & Medical Timeline</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Comprehensive chronological record of lab tests, doctor prescriptions, clinical assessments, and vitals
                </p>
              </div>

              {/* Demographics & Clinical Profile */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Blood Group & Allergies</span>
                  <p className="text-sm font-bold text-slate-900">
                    {user?.bloodGroup || 'Blood group not set'} • {user?.allergies ? `Allergies: ${user.allergies}` : 'No known allergies'}
                  </p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Emergency Contact</span>
                  <p className="text-sm font-bold text-slate-900">{user?.emergencyContact || 'Not recorded'}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Diagnostic Events</span>
                  <p className="text-sm font-bold text-blue-700">{timelineEvents.length} recorded events</p>
                </div>
              </div>

              {/* Event Timeline */}
              {timelineEvents.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl space-y-3">
                  <Clock className="w-10 h-10 text-slate-300 mx-auto" />
                  <p className="text-slate-600 font-medium">No medical events logged yet.</p>
                </div>
              ) : (
                <div className="relative pl-6 sm:pl-8 border-l-2 border-blue-200 space-y-8 my-4">
                  {timelineEvents.map((event, idx) => {
                    let badgeColor = 'bg-blue-600';
                    let Icon = FileText;

                    if (event.type === 'prescription') {
                      badgeColor = 'bg-indigo-600';
                      Icon = Pill;
                    } else if (event.type === 'note') {
                      badgeColor = 'bg-emerald-600';
                      Icon = Stethoscope;
                    } else if (event.type === 'appointment') {
                      badgeColor = 'bg-amber-600';
                      Icon = Calendar;
                    } else if (event.type === 'bmi') {
                      badgeColor = 'bg-purple-600';
                      Icon = Activity;
                    }

                    return (
                      <div key={idx} className="relative group">
                        {/* Timeline dot */}
                        <div
                          className={`absolute -left-[31px] sm:-left-[39px] top-1 w-7 h-7 rounded-full ${badgeColor} text-white flex items-center justify-center shadow-md`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                        </div>

                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 hover:border-blue-300 transition-all">
                          <div className="flex items-center justify-between gap-2 flex-wrap">
                            <h4 className="text-sm sm:text-base font-bold text-slate-900">{event.title}</h4>
                            <span className="text-xs font-mono text-slate-500 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                              {new Date(event.date).toLocaleDateString()} at{' '}
                              {new Date(event.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm text-slate-600">{event.subtitle}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Doctor Clinical Notes Accordion / Cards */}
            {clinicalNotes.length > 0 && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Physician Clinical Assessments</h3>
                  <p className="text-xs text-slate-500">Formal clinical records submitted by attending physicians</p>
                </div>
                <div className="space-y-4">
                  {clinicalNotes.map(note => (
                    <div key={note.id} className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                        <div>
                          <h4 className="font-bold text-slate-900 text-sm">{note.doctorName}</h4>
                          <span className="text-xs text-blue-600">{note.doctorSpecialty}</span>
                        </div>
                        <span className="text-xs text-slate-500 font-mono">
                          {new Date(note.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-500 font-bold block uppercase text-[10px]">Diagnosis</span>
                          <span className="font-semibold text-slate-900">{note.diagnosis}</span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-500 font-bold block uppercase text-[10px]">Observations</span>
                          <span className="text-slate-700">{note.clinicalObservations}</span>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200">
                          <span className="text-slate-500 font-bold block uppercase text-[10px]">Treatment Plan</span>
                          <span className="text-slate-700">{note.treatmentPlan}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: MY APPOINTMENTS */}
        {activeTab === 'appointments' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-slate-900">My Appointments</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Manage your doctor visits, scheduled consultations, and booking history
                </p>
              </div>
              <button
                onClick={() => onNavigate('appointment')}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-sm cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Schedule New Appointment</span>
              </button>
            </div>

            {appointments.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-slate-200 rounded-3xl space-y-3">
                <Calendar className="w-10 h-10 text-slate-300 mx-auto" />
                <p className="text-slate-600 font-medium">No appointments scheduled.</p>
                <button
                  onClick={() => onNavigate('appointment')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Book Your First Consultation
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {appointments.map(appt => (
                  <div
                    key={appt.id}
                    className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-4 flex flex-col justify-between hover:border-blue-300 transition-all"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-slate-500">{appt.appointmentCode}</span>
                        <span
                          className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                            appt.status === 'Confirmed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : appt.status === 'Cancelled'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {appt.status}
                        </span>
                      </div>

                      <h4 className="text-base font-bold text-slate-900 mt-2">{appt.doctorName}</h4>
                      <p className="text-xs text-blue-600 font-semibold">{appt.specialty}</p>

                      {appt.reason && (
                        <p className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                          <strong>Reason:</strong> {appt.reason}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 border-t border-slate-200/80 text-xs text-slate-600 flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        {appt.appointmentDate}
                      </span>
                      <span className="font-semibold flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-blue-600" />
                        {appt.appointmentTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 6: DOWNLOAD REPORTS */}
        {activeTab === 'downloads' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Download Reports & Records</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Export and print official PDF documents of your diagnostic lab results, prescriptions, and health summaries
              </p>
            </div>

            {/* Consolidated Summary Download Card */}
            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50/60 rounded-2xl border border-blue-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 bg-blue-600 text-white rounded text-[10px] font-bold uppercase tracking-wider">
                    Comprehensive
                  </span>
                  <h3 className="text-base font-bold text-slate-900">Consolidated Health Summary (PDF)</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                  Generates an all-in-one clinical summary covering your vital statistics, recorded blood group, known allergies, full lab test archive, active prescriptions, and physician notes.
                </p>
              </div>

              <button
                onClick={() =>
                  user &&
                  downloadHealthSummaryPDF(user, reports, prescriptions, clinicalNotes, bmiRecords)
                }
                className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 shrink-0 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download Health Summary (PDF)</span>
              </button>
            </div>

            {/* Individual Lab Reports Download Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-base font-bold text-slate-900">Individual Lab Report PDFs ({reports.length})</h3>
              {reports.length === 0 ? (
                <p className="text-xs text-slate-500">No lab reports available to download.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reports.map(rep => (
                    <div
                      key={rep.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{rep.fileName}</h4>
                        <span className="text-[11px] text-slate-500">
                          {new Date(rep.uploadedAt).toLocaleDateString()} • {rep.testResults.length} parameters
                        </span>
                      </div>
                      <button
                        onClick={() => downloadReportPDF(rep)}
                        className="px-3.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Prescriptions Download Section */}
            <div className="space-y-4 pt-2">
              <h3 className="text-base font-bold text-slate-900">Doctor Prescriptions ({prescriptions.length})</h3>
              {prescriptions.length === 0 ? (
                <p className="text-xs text-slate-500">No prescriptions available to download.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {prescriptions.map(rx => (
                    <div
                      key={rx.id}
                      className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <h4 className="text-xs sm:text-sm font-bold text-slate-900 truncate">{rx.prescriptionNumber}</h4>
                        <span className="text-[11px] text-slate-500">
                          {rx.doctorName} • {rx.diagnosis}
                        </span>
                      </div>
                      <button
                        onClick={() => downloadPrescriptionPDF(rx)}
                        className="px-3.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comparison Download Section */}
            {comparisonResult && (
              <div className="space-y-4 pt-2">
                <h3 className="text-base font-bold text-slate-900">Latest Report Comparison Summary</h3>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900">Delta Parameter Tracking Document</h4>
                    <p className="text-xs text-slate-500">
                      Baseline vs Follow-up comparison with parameter delta trends
                    </p>
                  </div>
                  <button
                    onClick={() => downloadReportComparisonPDF(comparisonResult)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Comparison PDF</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 7: AUDIT LOG */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">Privacy & Access Audit Log</h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Immutable security log of all interactions with your personal medical record
              </p>
            </div>

            {auditLogs.length === 0 ? (
              <p className="text-sm text-slate-500 py-6">No audit records logged yet.</p>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="p-3.5">Timestamp</th>
                      <th className="p-3.5">Action</th>
                      <th className="p-3.5">User</th>
                      <th className="p-3.5">Role</th>
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
                        <td className="p-3.5 text-slate-800">{log.userName}</td>
                        <td className="p-3.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              log.role === 'doctor' ? 'bg-indigo-100 text-indigo-800' : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {log.role}
                          </span>
                        </td>
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

      {/* Prescription Detail Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white max-w-2xl w-full rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-bold flex items-center justify-center text-lg">
                  Rx
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-lg">
                    {selectedPrescription.prescriptionNumber}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Prescribed by {selectedPrescription.doctorName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPrescription(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-500 uppercase">Diagnosis</span>
                <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedPrescription.diagnosis}</p>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-700 uppercase">Prescribed Medications</h4>
                <div className="space-y-2">
                  {selectedPrescription.medicines.map((m, idx) => (
                    <div key={idx} className="p-3 bg-blue-50/60 rounded-xl border border-blue-100 text-xs sm:text-sm">
                      <div className="flex items-center justify-between font-bold text-slate-900">
                        <span>{m.name} {m.strength && `(${m.strength})`}</span>
                        <span className="text-blue-700">{m.frequency}</span>
                      </div>
                      <div className="text-xs text-slate-600 mt-1 flex items-center justify-between">
                        <span>Duration: {m.duration}</span>
                        <span>Instructions: {m.instructions}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 space-y-1">
                <p><strong>Instructions:</strong> {selectedPrescription.instructions}</p>
                {selectedPrescription.followUpDate && (
                  <p className="text-blue-700 font-semibold">
                    Follow-Up: {new Date(selectedPrescription.followUpDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedPrescription(null)}
                className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-semibold cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => downloadPrescriptionPDF(selectedPrescription)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
