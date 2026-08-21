import React, { useState } from 'react';
import {
  HeartPulse,
  Activity,
  Plus,
  Search,
  Filter,
  X,
  AlertCircle,
  FileSpreadsheet,
  CheckCircle2,
  Calendar
} from 'lucide-react';
import { LivePatientRecord, PatientVitalSign, PatientLabResult } from '../../types.js';
import { useAuth } from '../../context/AuthContext.js';

interface PatientLabsVitalsTabProps {
  patient: LivePatientRecord;
  onRefreshPatient: (updated: LivePatientRecord) => void;
}

export const PatientLabsVitalsTab: React.FC<PatientLabsVitalsTabProps> = ({
  patient,
  onRefreshPatient
}) => {
  const { token, user } = useAuth();

  // Modal states
  const [showVitalsModal, setShowVitalsModal] = useState(false);
  const [showLabModal, setShowLabModal] = useState(false);

  // Vitals form
  const [bpSystolic, setBpSystolic] = useState('');
  const [bpDiastolic, setBpDiastolic] = useState('');
  const [heartRate, setHeartRate] = useState('');
  const [spo2, setSpo2] = useState('');
  const [temperature, setTemperature] = useState('');
  const [respiratoryRate, setRespiratoryRate] = useState('');
  const [vitalNotes, setVitalNotes] = useState('');
  const [submittingVitals, setSubmittingVitals] = useState(false);
  const [vitalsError, setVitalsError] = useState<string | null>(null);

  // Lab form
  const [testName, setTestName] = useState('');
  const [result, setResult] = useState('');
  const [unit, setUnit] = useState('');
  const [referenceRange, setReferenceRange] = useState('');
  const [status, setStatus] = useState<'Normal' | 'High' | 'Low' | 'Critical'>('Normal');
  const [labDate, setLabDate] = useState(new Date().toISOString().slice(0, 10));
  const [submittingLab, setSubmittingLab] = useState(false);
  const [labError, setLabError] = useState<string | null>(null);

  // Lab search & filter
  const [labSearch, setLabSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Normal' | 'High' | 'Low' | 'Critical'>('All');

  const handleSaveVitals = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bpSystolic && !heartRate && !spo2 && !temperature) {
      setVitalsError('Please enter at least one vital parameter.');
      return;
    }

    try {
      setSubmittingVitals(true);
      setVitalsError(null);

      const bloodPressure = (bpSystolic && bpDiastolic) ? `${bpSystolic}/${bpDiastolic}` : bpSystolic || undefined;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/patients/${patient.id}/vitals`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          bloodPressure,
          heartRate: heartRate ? Number(heartRate) : undefined,
          spo2: spo2 ? Number(spo2) : undefined,
          temperature: temperature ? Number(temperature) : undefined,
          respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
          notes: vitalNotes.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to record vitals.');

      onRefreshPatient(data.patient);
      setShowVitalsModal(false);
      setBpSystolic('');
      setBpDiastolic('');
      setHeartRate('');
      setSpo2('');
      setTemperature('');
      setRespiratoryRate('');
      setVitalNotes('');
    } catch (err: any) {
      setVitalsError(err.message || 'Error recording vitals.');
    } finally {
      setSubmittingVitals(false);
    }
  };

  const handleSaveLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim() || !result.trim()) {
      setLabError('Please enter the test name and result value.');
      return;
    }

    try {
      setSubmittingLab(true);
      setLabError(null);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/patients/${patient.id}/labs`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          testName: testName.trim(),
          result: result.trim(),
          unit: unit.trim() || undefined,
          referenceRange: referenceRange.trim() || undefined,
          status,
          date: labDate ? new Date(labDate).toISOString() : new Date().toISOString()
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to add lab result.');

      onRefreshPatient(data.patient);
      setShowLabModal(false);
      setTestName('');
      setResult('');
      setUnit('');
      setReferenceRange('');
      setStatus('Normal');
    } catch (err: any) {
      setLabError(err.message || 'Error saving lab result.');
    } finally {
      setSubmittingLab(false);
    }
  };

  const vitals = patient.vitals || [];
  const labs = (patient.labResults || []).filter(l => {
    const matchesSearch = l.testName.toLowerCase().includes(labSearch.toLowerCase());
    const matchesStatus = statusFilter === 'All' || l.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8">
      
      {/* 1. Vital Signs Subsection */}
      <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">Patient Vital Signs Log</h3>
            <p className="text-xs text-slate-500">
              Longitudinal tracking of blood pressure, pulse, SpO2, and core temperature.
            </p>
          </div>
          <button
            onClick={() => setShowVitalsModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Vitals</span>
          </button>
        </div>

        {vitals.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            No vital signs logged for this patient yet. Click 'Record New Vitals' to add entry.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Blood Pressure</th>
                  <th className="py-3 px-4">Heart Rate</th>
                  <th className="py-3 px-4">SpO2</th>
                  <th className="py-3 px-4">Temp</th>
                  <th className="py-3 px-4">Resp Rate</th>
                  <th className="py-3 px-4">Recorded By</th>
                  <th className="py-3 px-4">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {vitals.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-900">
                      {new Date(v.recordedAt).toLocaleDateString()} {new Date(v.recordedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {v.bloodPressure ? `${v.bloodPressure} mmHg` : '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-rose-600">
                      {v.heartRate ? `${v.heartRate} bpm` : '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-blue-600">
                      {v.spo2 ? `${v.spo2}%` : '—'}
                    </td>
                    <td className="py-3 px-4 font-semibold text-amber-600">
                      {v.temperature ? `${v.temperature}°F` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      {v.respiratoryRate ? `${v.respiratoryRate} /min` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 font-medium">
                      {v.recordedBy || 'Nurse/Staff'}
                    </td>
                    <td className="py-3 px-4 text-slate-500 italic max-w-xs truncate">
                      {v.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Laboratory Results Subsection */}
      <div className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900 leading-tight">
              Laboratory & Diagnostic Results ({patient.labResults?.length || 0})
            </h3>
            <p className="text-xs text-slate-500">
              Lab tests entered manually or extracted directly from uploaded medical reports.
            </p>
          </div>
          <button
            onClick={() => setShowLabModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Add Lab Test Result</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search tests (e.g. Hemoglobin, Glucose, Creatinine)..."
              value={labSearch}
              onChange={e => setLabSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {(['All', 'Normal', 'High', 'Low', 'Critical'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {labs.length === 0 ? (
          <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            {labSearch || statusFilter !== 'All'
              ? 'No lab tests matching filter.'
              : 'No laboratory results logged yet. Add tests manually or extract them from uploaded reports.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-200 uppercase font-semibold">
                <tr>
                  <th className="py-3 px-4">Test Parameter</th>
                  <th className="py-3 px-4">Observed Result</th>
                  <th className="py-3 px-4">Reference Range</th>
                  <th className="py-3 px-4">Status Flag</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Source / Recorded By</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {labs.map(l => {
                  const isAbnormal = l.status === 'High' || l.status === 'Low' || l.status === 'Critical';
                  return (
                    <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {l.testName}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {l.result} <span className="text-slate-500 font-normal">{l.unit || ''}</span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {l.referenceRange || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            l.status === 'Critical'
                              ? 'bg-rose-100 text-rose-800'
                              : l.status === 'High' || l.status === 'Low'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {l.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-500">
                        {new Date(l.date).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4 text-slate-500 text-[11px]">
                        {(l.sourceDocumentName || l.documentName) ? (
                          <span className="text-blue-600 font-medium truncate block max-w-xs" title={l.sourceDocumentName || l.documentName}>
                            AI Extracted from: {l.sourceDocumentName || l.documentName}
                          </span>
                        ) : (
                          <span>Manual entry</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Record Vitals Modal */}
      {showVitalsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-blue-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5" />
                <h3 className="font-bold text-base">Record Patient Vitals</h3>
              </div>
              <button
                onClick={() => setShowVitalsModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveVitals} className="p-6 space-y-4">
              {vitalsError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {vitalsError}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">BP Systolic (mmHg)</label>
                  <input
                    type="number"
                    placeholder="120"
                    value={bpSystolic}
                    onChange={e => setBpSystolic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">BP Diastolic (mmHg)</label>
                  <input
                    type="number"
                    placeholder="80"
                    value={bpDiastolic}
                    onChange={e => setBpDiastolic(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Pulse / Heart Rate (bpm)</label>
                  <input
                    type="number"
                    placeholder="72"
                    value={heartRate}
                    onChange={e => setHeartRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Oxygen SpO2 (%)</label>
                  <input
                    type="number"
                    placeholder="98"
                    value={spo2}
                    onChange={e => setSpo2(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Temperature (°F)</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="98.6"
                    value={temperature}
                    onChange={e => setTemperature(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Resp Rate (/min)</label>
                  <input
                    type="number"
                    placeholder="16"
                    value={respiratoryRate}
                    onChange={e => setRespiratoryRate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observations / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Resting in bed, regular rhythm, no dyspnea."
                  value={vitalNotes}
                  onChange={e => setVitalNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowVitalsModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingVitals}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {submittingVitals ? 'Saving...' : 'Save Vitals Entry'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Lab Result Modal */}
      {showLabModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-blue-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                <h3 className="font-bold text-base">Add Diagnostic Lab Result</h3>
              </div>
              <button
                onClick={() => setShowLabModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveLab} className="p-6 space-y-4">
              {labError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {labError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Test Parameter Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Fasting Plasma Glucose, Serum Creatinine"
                  value={testName}
                  onChange={e => setTestName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Observed Value <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 142"
                    value={result}
                    onChange={e => setResult(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <input
                    type="text"
                    placeholder="mg/dL, g/dL, U/L"
                    value={unit}
                    onChange={e => setUnit(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Reference Range</label>
                  <input
                    type="text"
                    placeholder="e.g. 70 - 99 mg/dL"
                    value={referenceRange}
                    onChange={e => setReferenceRange(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Status</label>
                  <select
                    value={status}
                    onChange={e => setStatus(e.target.value as any)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Low">Low</option>
                    <option value="Critical">Critical</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Test Date</label>
                <input
                  type="date"
                  value={labDate}
                  onChange={e => setLabDate(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowLabModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingLab}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {submittingLab ? 'Saving...' : 'Save Lab Result'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
