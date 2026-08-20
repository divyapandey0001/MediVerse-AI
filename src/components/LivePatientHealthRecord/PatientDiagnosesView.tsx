import React, { useState } from 'react';
import {
  Stethoscope,
  Plus,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Sparkles,
  UserCheck
} from 'lucide-react';
import {
  PatientTimelineEntry,
  LivePatientRecord,
  LivePatientAiSummary
} from '../../types.js';

interface PatientDiagnosesViewProps {
  patient: LivePatientRecord;
  entries: PatientTimelineEntry[];
  summary: LivePatientAiSummary | null;
  onOpenAddEntryModal: (defaultType?: string) => void;
}

export const PatientDiagnosesView: React.FC<PatientDiagnosesViewProps> = ({
  patient,
  entries,
  summary,
  onOpenAddEntryModal
}) => {
  // Collect all doctor and progress notes
  const doctorNotes = entries.filter(
    e =>
      e.entryType === 'Doctor / Progress Note' ||
      e.entryType === 'Consultation Note' ||
      e.entryType === 'Discharge Information' ||
      e.entryType === 'Procedure / Treatment'
  );

  return (
    <div id="patient-diagnoses-view" className="space-y-6">
      {/* 1. Documented Diagnoses Breakdown */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 uppercase tracking-wider mb-0.5">
              <Stethoscope className="w-4 h-4" /> Clinical Assessment & Diagnostic Formulations
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Active Diagnoses & Clinical Formulations
            </h3>
            <p className="text-xs text-slate-500">
              Documented primary, secondary, and differential diagnoses for {patient.patientName}.
            </p>
          </div>

          <button
            onClick={() => onOpenAddEntryModal('Doctor / Progress Note')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add Doctor Note / Diagnosis
          </button>
        </div>

        {/* Reason for admission box */}
        <div className="p-4 bg-indigo-50/60 border border-indigo-200/70 rounded-2xl space-y-1">
          <span className="text-[11px] font-bold text-indigo-900 uppercase tracking-wider">
            Admitting Complaint & Primary Clinical Impression
          </span>
          <p className="text-xs text-indigo-950 font-medium leading-relaxed">
            {patient.reasonForAdmission}
          </p>
        </div>

        {/* Diagnoses from summary if generated */}
        {summary?.documentedDiagnoses && summary.documentedDiagnoses.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {summary.documentedDiagnoses.map((diag, idx) => (
              <div
                key={idx}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-xs text-slate-900">{diag.diagnosis}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        diag.type === 'Primary'
                          ? 'bg-indigo-100 text-indigo-800'
                          : diag.type === 'Secondary'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {diag.type}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Status: <strong className="text-slate-700">{diag.status}</strong>
                  </div>
                </div>
                <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-200/60">
                  Source: {diag.sourceRecord}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-2xl text-center text-xs text-slate-500">
            Click "AI Current Summary" at the top of the chart to automatically aggregate and categorize all primary & secondary diagnoses across the clinical timeline.
          </div>
        )}
      </div>

      {/* 2. Physician Progress Notes & Consultation Log */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
              <FileText className="w-4 h-4" /> Clinical Documentation Stream
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Doctor Progress Notes & Consultation Notes ({doctorNotes.length})
            </h3>
          </div>
        </div>

        {doctorNotes.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No physician progress notes recorded yet. Click "Add Doctor Note" to document clinical rounds or consultation notes.
          </div>
        ) : (
          <div className="space-y-3">
            {doctorNotes.map(note => (
              <div
                key={note.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 hover:border-indigo-300 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Stethoscope className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-bold text-xs text-slate-900">{note.title}</h4>
                      <span className="text-[10px] text-slate-500">{note.entryType}</span>
                    </div>
                  </div>

                  <span className="text-[10px] text-slate-400">
                    {new Date(note.timestamp).toLocaleString()}
                  </span>
                </div>

                <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed pl-10">
                  {note.content}
                </p>

                <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-200 flex items-center justify-between">
                  <span>Author: {note.authorName} ({note.authorRole})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
