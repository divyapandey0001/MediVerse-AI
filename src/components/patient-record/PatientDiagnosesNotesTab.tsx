import React, { useState } from 'react';
import { Stethoscope, FileText, Plus, AlertCircle, X, Calendar, UserCheck } from 'lucide-react';
import { LivePatientRecord, PatientDiagnosis, PatientClinicalNote } from '../../types.js';
import { useAuth } from '../../context/AuthContext.js';

interface PatientDiagnosesNotesTabProps {
  patient: LivePatientRecord;
  onRefreshPatient: (updated: LivePatientRecord) => void;
}

export const PatientDiagnosesNotesTab: React.FC<PatientDiagnosesNotesTabProps> = ({
  patient,
  onRefreshPatient
}) => {
  const { token, user } = useAuth();

  // Modal states
  const [showDiagModal, setShowDiagModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);

  // Diagnosis form
  const [diagName, setDiagName] = useState('');
  const [diagType, setDiagType] = useState<PatientDiagnosis['type']>('Primary');
  const [diagNotes, setDiagNotes] = useState('');
  const [submittingDiag, setSubmittingDiag] = useState(false);
  const [diagError, setDiagError] = useState<string | null>(null);

  // Clinical Note form
  const [noteType, setNoteType] = useState<PatientClinicalNote['noteType']>('Progress Note');
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);
  const [noteError, setNoteError] = useState<string | null>(null);

  const handleSaveDiagnosis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagName.trim()) {
      setDiagError('Please enter diagnosis name.');
      return;
    }

    try {
      setSubmittingDiag(true);
      setDiagError(null);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/patients/${patient.id}/diagnoses`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          diagnosisName: diagName.trim(),
          type: diagType,
          clinicalNotes: diagNotes.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add diagnosis.');

      onRefreshPatient(data.patient);
      setShowDiagModal(false);
      setDiagName('');
      setDiagNotes('');
      setDiagType('Primary');
    } catch (err: any) {
      setDiagError(err.message || 'Error saving diagnosis.');
    } finally {
      setSubmittingDiag(false);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteTitle.trim() || !noteContent.trim()) {
      setNoteError('Please enter note title and content.');
      return;
    }

    try {
      setSubmittingNote(true);
      setNoteError(null);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/patients/${patient.id}/notes`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          noteType,
          title: noteTitle.trim(),
          content: noteContent.trim()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add clinical note.');

      onRefreshPatient(data.patient);
      setShowNoteModal(false);
      setNoteTitle('');
      setNoteContent('');
      setNoteType('Progress Note');
    } catch (err: any) {
      setNoteError(err.message || 'Error saving clinical note.');
    } finally {
      setSubmittingNote(false);
    }
  };

  const diagnoses = patient.diagnoses || [];
  const notes = patient.clinicalNotes || [];

  return (
    <div className="space-y-8">
      
      {/* 1. Diagnoses Section */}
      <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              Clinical Diagnoses & Problem List ({diagnoses.length})
            </h3>
            <p className="text-xs text-slate-500">
              Primary, secondary, differential, and chronic diagnostic assessments.
            </p>
          </div>
          <button
            onClick={() => setShowDiagModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Diagnosis</span>
          </button>
        </div>

        {diagnoses.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            No formal diagnoses recorded yet. Click 'Add Diagnosis' to document findings.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {diagnoses.map(d => (
              <div
                key={d.id}
                className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 flex flex-col justify-between space-y-2"
              >
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-slate-900 text-sm">{d.diagnosisName}</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        d.type === 'Primary'
                          ? 'bg-blue-600 text-white'
                          : d.type === 'Chronic'
                          ? 'bg-purple-100 text-purple-800'
                          : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      {d.type}
                    </span>
                  </div>
                  {d.clinicalNotes && (
                    <p className="text-xs text-slate-600 mt-2 leading-relaxed">{d.clinicalNotes}</p>
                  )}
                </div>

                <div className="pt-2 border-t border-blue-100/60 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Diagnosed by: {d.diagnosedBy || 'Physician'}</span>
                  <span>{new Date(d.dateDiagnosed).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 2. Clinical Notes Section */}
      <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              Clinical Progress Notes & Consultations ({notes.length})
            </h3>
            <p className="text-xs text-slate-500">
              Ward rounds, SOAP evaluations, nursing notes, and specialty consultations.
            </p>
          </div>
          <button
            onClick={() => setShowNoteModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Clinical Note</span>
          </button>
        </div>

        {notes.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            No clinical notes documented yet.
          </div>
        ) : (
          <div className="space-y-4">
            {notes.map(n => (
              <div
                key={n.id}
                className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-3"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 uppercase tracking-wider">
                      {n.noteType}
                    </span>
                    <h4 className="font-bold text-slate-900 text-sm">{n.title}</h4>
                  </div>
                  <span className="text-xs text-slate-500">
                    {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-white p-3.5 rounded-xl border border-slate-200">
                  {n.content}
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Author: <strong className="text-slate-700">{n.authorName}</strong> ({n.authorRole || 'Doctor'})</span>
                  <span>MediVerse Clinical Documentation</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add Diagnosis Modal */}
      {showDiagModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-blue-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Stethoscope className="w-5 h-5" />
                <h3 className="font-bold text-base">Add Clinical Diagnosis</h3>
              </div>
              <button
                onClick={() => setShowDiagModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDiagnosis} className="p-6 space-y-4">
              {diagError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {diagError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Diagnosis Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Community-Acquired Pneumonia, Type 2 Diabetes Mellitus"
                  value={diagName}
                  onChange={e => setDiagName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Diagnosis Classification</label>
                <select
                  value={diagType}
                  onChange={e => setDiagType(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Primary">Primary (Chief Active Problem)</option>
                  <option value="Secondary">Secondary (Co-existing condition)</option>
                  <option value="Differential">Differential Diagnosis</option>
                  <option value="Chronic">Chronic Disease</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Remarks / Criteria</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Diagnosed based on chest radiograph infiltrates, leukocytosis, and fever."
                  value={diagNotes}
                  onChange={e => setDiagNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDiagModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDiag}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {submittingDiag ? 'Saving...' : 'Add Diagnosis'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Clinical Note Modal */}
      {showNoteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-blue-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                <h3 className="font-bold text-base">Write Clinical Progress Note</h3>
              </div>
              <button
                onClick={() => setShowNoteModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNote} className="p-6 space-y-4">
              {noteError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {noteError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Note Type</label>
                <select
                  value={noteType}
                  onChange={e => setNoteType(e.target.value as any)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 bg-white"
                >
                  <option value="Progress Note">Ward Round / Progress Note</option>
                  <option value="Admission Note">Admission History & Physical</option>
                  <option value="Consultation Note">Specialist Consultation</option>
                  <option value="Procedure Note">Procedure / Bedside Intervention</option>
                  <option value="Nursing Note">Nursing Observation</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Note Title / Heading <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Day 2 Ward Round - Respiratory Review"
                  value={noteTitle}
                  onChange={e => setNoteTitle(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Clinical Note Content (SOAP / Observations / Plan) <span className="text-red-500">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  placeholder="Subjective: Patient reports reduced cough and feeling more energetic.&#10;Objective: Chest auscultation shows cleared vesicular sounds. SpO2 98% on room air.&#10;Assessment: Improving community-acquired pneumonia.&#10;Plan: Continue oral antibiotics for 3 more days. Plan discharge tomorrow."
                  value={noteContent}
                  onChange={e => setNoteContent(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500 font-mono text-xs leading-relaxed"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowNoteModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingNote}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {submittingNote ? 'Saving Note...' : 'Save Clinical Note'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
