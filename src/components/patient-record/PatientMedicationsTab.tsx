import React, { useState } from 'react';
import { Pill, Plus, CheckCircle, AlertCircle, X, Check, Clock, Ban } from 'lucide-react';
import { LivePatientRecord, PatientMedication } from '../../types.js';
import { useAuth } from '../../context/AuthContext.js';

interface PatientMedicationsTabProps {
  patient: LivePatientRecord;
  onRefreshPatient: (updated: LivePatientRecord) => void;
}

export const PatientMedicationsTab: React.FC<PatientMedicationsTabProps> = ({
  patient,
  onRefreshPatient
}) => {
  const { token, user } = useAuth();

  const [showAddModal, setShowAddModal] = useState(false);
  const [medicineName, setMedicineName] = useState('');
  const [strength, setStrength] = useState('');
  const [route, setRoute] = useState('Oral');
  const [frequency, setFrequency] = useState('1-0-1 (Twice Daily)');
  const [duration, setDuration] = useState('5 Days');
  const [instructions, setInstructions] = useState('After meals');
  const [status, setStatus] = useState<'Active' | 'Completed' | 'Discontinued'>('Active');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMedication = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!medicineName.trim()) {
      setError('Please enter the medication name.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/patients/${patient.id}/medications`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          medicineName: medicineName.trim(),
          strength: strength.trim() || undefined,
          route: route.trim() || 'Oral',
          frequency: frequency.trim() || 'Once Daily',
          duration: duration.trim() || '5 Days',
          instructions: instructions.trim() || undefined,
          status
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add medication.');

      onRefreshPatient(data.patient);
      setShowAddModal(false);
      setMedicineName('');
      setStrength('');
      setRoute('Oral');
      setFrequency('1-0-1 (Twice Daily)');
      setDuration('5 Days');
      setInstructions('After meals');
    } catch (err: any) {
      setError(err.message || 'Error adding medication.');
    } finally {
      setSubmitting(false);
    }
  };

  const meds = patient.medications || [];
  const activeMeds = meds.filter(m => m.status === 'Active');
  const inactiveMeds = meds.filter(m => m.status !== 'Active');

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-blue-100 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">Patient Medication Regimen</h3>
          <p className="text-xs text-slate-500">
            Active prescriptions, inpatient drug therapy, and completed courses.
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white font-semibold text-xs shadow-md shadow-purple-600/20 hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Medication</span>
        </button>
      </div>

      {/* Active Medications */}
      <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xs space-y-4">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-800">
            Active Medications ({activeMeds.length})
          </h4>
        </div>

        {activeMeds.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            No currently active medications. Click 'Add New Medication' to prescribe.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeMeds.map(med => (
              <div
                key={med.id}
                className="p-4 rounded-2xl bg-purple-50/40 border border-purple-100 hover:border-purple-200 transition-all flex flex-col justify-between space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <h5 className="font-bold text-slate-900 text-sm">{med.medicineName}</h5>
                        {med.strength && (
                          <span className="text-xs text-purple-700 font-mono font-medium">{med.strength}</span>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      Active
                    </span>
                  </div>

                  <div className="mt-3 space-y-1 text-xs text-slate-700">
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">Frequency:</span>
                      <span className="font-semibold">{med.frequency}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-slate-400 font-medium">Duration:</span>
                      <span className="font-semibold">{med.duration}</span>
                      {med.route && <span className="text-slate-400">({med.route})</span>}
                    </div>
                    {med.instructions && (
                      <div className="flex items-start gap-1.5 text-slate-600 bg-white/70 p-2 rounded-xl border border-purple-100/50 mt-1.5">
                        <span className="text-purple-600 font-bold text-[10px] uppercase">Note:</span>
                        <span>{med.instructions}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-purple-100/60 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Prescribed by: {med.prescribedBy || 'Doctor'}</span>
                  <span>{new Date(med.startDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Past / Discontinued Medications */}
      {inactiveMeds.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-600">
            Past & Discontinued Medications ({inactiveMeds.length})
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {inactiveMeds.map(med => (
              <div
                key={med.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-slate-600 space-y-2 opacity-80"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800 text-xs">{med.medicineName}</span>
                    {med.strength && <span className="text-xs text-slate-500">({med.strength})</span>}
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                    {med.status}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  {med.frequency} • {med.duration} • {med.instructions || '—'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-blue-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Pill className="w-5 h-5" />
                <h3 className="font-bold text-base">Add Patient Medication</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddMedication} className="p-6 space-y-4">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medication / Drug Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amoxicillin, Metformin, Atorvastatin"
                    value={medicineName}
                    onChange={e => setMedicineName(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Strength / Dosage</label>
                  <input
                    type="text"
                    placeholder="500 mg, 10 mg"
                    value={strength}
                    onChange={e => setStrength(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Administration Route</label>
                  <select
                    value={route}
                    onChange={e => setRoute(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="Oral">Oral</option>
                    <option value="Intravenous (IV)">Intravenous (IV)</option>
                    <option value="Intramuscular (IM)">Intramuscular (IM)</option>
                    <option value="Subcutaneous (SC)">Subcutaneous (SC)</option>
                    <option value="Inhalation">Inhalation</option>
                    <option value="Topical">Topical</option>
                    <option value="Sublingual">Sublingual</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Frequency</label>
                  <input
                    type="text"
                    placeholder="1-0-1 (Twice Daily), Once Daily"
                    value={frequency}
                    onChange={e => setFrequency(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    placeholder="5 Days, 2 Weeks, Ongoing"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500 bg-white"
                  >
                    <option value="Active">Active (Currently taking)</option>
                    <option value="Completed">Completed</option>
                    <option value="Discontinued">Discontinued</option>
                  </select>
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Special Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Take with a full glass of water after breakfast and dinner."
                    value={instructions}
                    onChange={e => setInstructions(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-purple-500"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Medication'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
