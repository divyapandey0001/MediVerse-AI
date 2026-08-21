import React from 'react';
import {
  Activity,
  Heart,
  Thermometer,
  Wind,
  Pill,
  FileText,
  Clock,
  Plus,
  ArrowRight,
  Sparkles,
  FileCheck2,
  Stethoscope
} from 'lucide-react';
import { LivePatientRecord } from '../../types.js';

interface PatientOverviewTabProps {
  patient: LivePatientRecord;
  onNavigateTab: (tabId: string) => void;
  onOpenAddVitals: () => void;
  onOpenAddMedication: () => void;
  onOpenAddDiagnosis: () => void;
  onOpenAddNote: () => void;
  onOpenUploadDoc: () => void;
}

export const PatientOverviewTab: React.FC<PatientOverviewTabProps> = ({
  patient,
  onNavigateTab,
  onOpenAddVitals,
  onOpenAddMedication,
  onOpenAddDiagnosis,
  onOpenAddNote,
  onOpenUploadDoc
}) => {
  const latestVital = patient.vitals?.[0];
  const activeMeds = patient.medications?.filter(m => m.status === 'Active') || [];
  const primaryDiag = patient.diagnoses || [];
  const recentNotes = patient.clinicalNotes?.slice(0, 3) || [];
  const recentTimeline = patient.timeline?.slice(0, 4) || [];

  return (
    <div className="space-y-6">
      
      {/* 1. Vital Signs Bar */}
      <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Heart className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">Current Vital Signs</h3>
              <p className="text-xs text-slate-500">
                {latestVital
                  ? `Last recorded on ${new Date(latestVital.recordedAt).toLocaleDateString()} at ${new Date(latestVital.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by ${latestVital.recordedBy || 'Staff'}`
                  : 'No vitals logged yet.'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenAddVitals}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Vitals</span>
            </button>
            <button
              onClick={() => onNavigateTab('labs-vitals')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline px-2 py-1"
            >
              View History →
            </button>
          </div>
        </div>

        {/* 4 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">Blood Pressure</span>
            <div className="my-1.5">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                {latestVital?.bloodPressure || '—'}
              </span>
              <span className="text-xs text-slate-500 ml-1">mmHg</span>
            </div>
            <span className="text-[10px] text-slate-500">Systolic / Diastolic</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">Pulse / Heart Rate</span>
            <div className="my-1.5">
              <span className="text-xl sm:text-2xl font-black text-rose-600">
                {latestVital?.heartRate || '—'}
              </span>
              <span className="text-xs text-slate-500 ml-1">bpm</span>
            </div>
            <span className="text-[10px] text-slate-500">Resting pulse</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">Oxygen Saturation</span>
            <div className="my-1.5">
              <span className="text-xl sm:text-2xl font-black text-blue-600">
                {latestVital?.spo2 ? `${latestVital.spo2}%` : '—'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Pulse Oximetry</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col justify-between">
            <span className="text-[11px] uppercase font-bold text-slate-400">Temperature</span>
            <div className="my-1.5">
              <span className="text-xl sm:text-2xl font-black text-amber-600">
                {latestVital?.temperature ? `${latestVital.temperature}°F` : '—'}
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Oral/Axillary</span>
          </div>

        </div>
      </div>

      {/* 2-Column Clinical Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Active Medications */}
        <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Pill className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Active Medications ({activeMeds.length})</h3>
                  <p className="text-xs text-slate-500">Prescriptions and inpatient regimens</p>
                </div>
              </div>
              <button
                onClick={onOpenAddMedication}
                className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Med</span>
              </button>
            </div>

            {activeMeds.length === 0 ? (
              <div className="py-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                No active medications prescribed yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {activeMeds.map(med => (
                  <div
                    key={med.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{med.medicineName}</span>
                        {med.strength && (
                          <span className="text-xs text-slate-500 font-mono">({med.strength})</span>
                        )}
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Active
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {med.frequency} • {med.duration} {med.instructions ? `(${med.instructions})` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      By {med.prescribedBy || 'Doctor'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => onNavigateTab('medications')}
              className="text-xs font-semibold text-purple-600 hover:text-purple-700 hover:underline flex items-center gap-1"
            >
              <span>Manage All Medications</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Diagnoses & Clinical Problem List */}
        <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Diagnoses & Problem List ({primaryDiag.length})</h3>
                  <p className="text-xs text-slate-500">Established clinical findings</p>
                </div>
              </div>
              <button
                onClick={onOpenAddDiagnosis}
                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Diagnosis</span>
              </button>
            </div>

            {primaryDiag.length === 0 ? (
              <div className="py-8 text-center bg-slate-50/70 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
                No formal diagnoses recorded yet.
              </div>
            ) : (
              <div className="space-y-2.5">
                {primaryDiag.map(diag => (
                  <div
                    key={diag.id}
                    className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-start justify-between gap-3"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{diag.diagnosisName}</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {diag.type}
                        </span>
                      </div>
                      {diag.clinicalNotes && (
                        <p className="text-xs text-slate-600 mt-1">{diag.clinicalNotes}</p>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                      {new Date(diag.dateDiagnosed).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => onNavigateTab('diagnoses-notes')}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
            >
              <span>View All Diagnoses & Notes</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>

      {/* 3-Column Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Uploaded Documents */}
        <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Medical Documents</span>
              <span className="text-lg font-black text-slate-900">{patient.documents?.length || 0}</span>
            </div>
            <p className="text-xs text-slate-600">
              Upload real PDFs, lab tests, prescriptions, and radiology images with AI Clinical Extraction.
            </p>
          </div>
          <div className="pt-4 mt-2">
            <button
              onClick={onOpenUploadDoc}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Upload New Document</span>
            </button>
          </div>
        </div>

        {/* AI Medical Summaries */}
        <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Clinical Summaries</span>
              <span className="text-lg font-black text-blue-600">{patient.aiSummaries?.length || 0}</span>
            </div>
            <p className="text-xs text-slate-600">
              Generate structured medical summaries and discharge reports grounded exclusively in verified patient records.
            </p>
          </div>
          <div className="pt-4 mt-2">
            <button
              onClick={() => onNavigateTab('summaries')}
              className="w-full py-2.5 px-3 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Summaries & Discharge</span>
            </button>
          </div>
        </div>

        {/* Timeline Activities */}
        <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Timeline Events</span>
              <span className="text-lg font-black text-slate-900">{patient.timeline?.length || 0}</span>
            </div>
            <p className="text-xs text-slate-600">
              Chronological audit log tracking every admission, test, medication change, note, and discharge.
            </p>
          </div>
          <div className="pt-4 mt-2">
            <button
              onClick={() => onNavigateTab('timeline')}
              className="w-full py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Explore Timeline</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
