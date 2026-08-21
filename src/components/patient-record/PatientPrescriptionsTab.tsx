import React, { useState } from 'react';
import {
  FileText,
  Plus,
  Trash2,
  Download,
  AlertCircle,
  X,
  Sparkles,
  Calendar,
  CheckCircle2,
  Building2,
  Printer
} from 'lucide-react';
import { LivePatientRecord, Prescription } from '../../types.js';
import { useAuth } from '../../context/AuthContext.js';
import { downloadPrescriptionPDF } from '../../utils/pdfExport.js';

interface PatientPrescriptionsTabProps {
  patient: LivePatientRecord;
  onRefreshPatient: (updated: LivePatientRecord) => void;
  initialShowModal?: boolean;
}

export const PatientPrescriptionsTab: React.FC<PatientPrescriptionsTabProps> = ({
  patient,
  onRefreshPatient,
  initialShowModal = false
}) => {
  const { token, user } = useAuth();

  const [showModal, setShowModal] = useState(initialShowModal);
  const [diagnosis, setDiagnosis] = useState(patient.diagnoses?.[0]?.diagnosisName || '');
  const [symptoms, setSymptoms] = useState(patient.reasonForAdmission || '');
  const [generalInstructions, setGeneralInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');

  const [medicines, setMedicines] = useState<
    Array<{ name: string; strength: string; frequency: string; duration: string; instructions: string }>
  >([
    { name: '', strength: '', frequency: '1-0-1 (Twice Daily)', duration: '5 Days', instructions: 'After meals' }
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddMedicineRow = () => {
    setMedicines([
      ...medicines,
      { name: '', strength: '', frequency: '1-0-1 (Twice Daily)', duration: '5 Days', instructions: 'After meals' }
    ]);
  };

  const handleRemoveMedicineRow = (index: number) => {
    if (medicines.length === 1) return;
    setMedicines(medicines.filter((_, i) => i !== index));
  };

  const handleMedicineChange = (index: number, field: string, value: string) => {
    const updated = [...medicines];
    updated[index] = { ...updated[index], [field]: value };
    setMedicines(updated);
  };

  const handleCreatePrescription = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!diagnosis.trim()) {
      setError('Please provide a clinical diagnosis for this prescription.');
      return;
    }

    const validMedicines = medicines.filter(m => m.name.trim().length > 0);
    if (validMedicines.length === 0) {
      setError('Please enter at least one prescribed medicine with name.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/patients/${patient.id}/prescriptions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          diagnosis: diagnosis.trim(),
          symptoms: symptoms.trim() || undefined,
          medicines: validMedicines,
          instructions: generalInstructions.trim() || undefined,
          followUpDate: followUpDate || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate digital prescription.');

      onRefreshPatient(data.patient);
      setShowModal(false);
      setDiagnosis('');
      setSymptoms('');
      setGeneralInstructions('');
      setMedicines([
        { name: '', strength: '', frequency: '1-0-1 (Twice Daily)', duration: '5 Days', instructions: 'After meals' }
      ]);
    } catch (err: any) {
      setError(err.message || 'Error creating prescription.');
    } finally {
      setSubmitting(false);
    }
  };

  const prescriptions = patient.prescriptions || [];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-blue-100 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">Digital Clinical Prescriptions</h3>
          <p className="text-xs text-slate-500">
            Generate, sign, and download official medical prescriptions with verification QR and letterhead.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Write New Prescription</span>
        </button>
      </div>

      {/* Prescription List */}
      {prescriptions.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-blue-200 shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">No prescriptions issued yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Create an official digital prescription with structured dosages, intake instructions, and printable medical PDF output.
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
          >
            Create First Prescription
          </button>
        </div>
      ) : (
        <div className="space-y-5">
          {prescriptions.map(rx => (
            <div
              key={rx.id}
              className="bg-white rounded-3xl p-6 border border-blue-100 shadow-xs space-y-5"
            >
              {/* Rx Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 text-white font-black text-lg flex items-center justify-center">
                    Rx
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-200">
                        {rx.prescriptionNumber}
                      </span>
                      <span className="text-xs text-slate-500">
                        • {new Date(rx.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-slate-800 mt-0.5">
                      Doctor: {rx.doctorName} ({rx.doctorSpecialty})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadPrescriptionPDF(rx)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download PDF</span>
                  </button>
                </div>
              </div>

              {/* Diagnosis & Symptoms */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Clinical Diagnosis
                  </span>
                  <span className="text-xs font-bold text-slate-900">{rx.diagnosis}</span>
                </div>
                {rx.symptoms && (
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                      Chief Symptoms
                    </span>
                    <span className="text-xs text-slate-700">{rx.symptoms}</span>
                  </div>
                )}
              </div>

              {/* Medicines Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-blue-50/70 text-blue-900 uppercase font-semibold">
                    <tr>
                      <th className="py-2.5 px-4 rounded-l-xl">#</th>
                      <th className="py-2.5 px-4">Medicine Name</th>
                      <th className="py-2.5 px-4">Strength</th>
                      <th className="py-2.5 px-4">Frequency</th>
                      <th className="py-2.5 px-4">Duration</th>
                      <th className="py-2.5 px-4 rounded-r-xl">Instructions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-700">
                    {rx.medicines.map((med, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{med.name}</td>
                        <td className="py-3 px-4 font-mono text-slate-600">{med.strength || '—'}</td>
                        <td className="py-3 px-4">{med.frequency}</td>
                        <td className="py-3 px-4 font-medium text-slate-800">{med.duration}</td>
                        <td className="py-3 px-4 text-slate-600 italic">{med.instructions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Instructions & Follow-up */}
              {(rx.instructions || rx.followUpDate) && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs flex flex-wrap items-center justify-between gap-3">
                  {rx.instructions && (
                    <div>
                      <span className="font-bold text-slate-700">Advice: </span>
                      <span className="text-slate-600">{rx.instructions}</span>
                    </div>
                  )}
                  {rx.followUpDate && (
                    <div className="font-semibold text-blue-700">
                      Follow-up Date: {new Date(rx.followUpDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Digital Prescription Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] border border-blue-100 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Create Official Digital Prescription</h3>
                  <p className="text-xs text-blue-100/80">Patient: {patient.patientName} ({patient.uhid})</p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreatePrescription} className="p-6 overflow-y-auto space-y-5 flex-1">
              {error && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Clinical Diagnosis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acute Bronchitis"
                    value={diagnosis}
                    onChange={e => setDiagnosis(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Symptoms / Presentation</label>
                  <input
                    type="text"
                    placeholder="e.g. Productive cough, low-grade fever"
                    value={symptoms}
                    onChange={e => setSymptoms(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Medicine Builder Rows */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Prescribed Medicines & Formulations
                  </h4>
                  <button
                    type="button"
                    onClick={handleAddMedicineRow}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Medicine Row</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {medicines.map((med, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center"
                    >
                      <div className="sm:col-span-4">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                          Medicine Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Azithromycin"
                          value={med.name}
                          onChange={e => handleMedicineChange(idx, 'name', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Strength</label>
                        <input
                          type="text"
                          placeholder="500 mg"
                          value={med.strength}
                          onChange={e => handleMedicineChange(idx, 'strength', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Frequency</label>
                        <input
                          type="text"
                          placeholder="1-0-1"
                          value={med.frequency}
                          onChange={e => handleMedicineChange(idx, 'frequency', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Duration</label>
                        <input
                          type="text"
                          placeholder="5 Days"
                          value={med.duration}
                          onChange={e => handleMedicineChange(idx, 'duration', e.target.value)}
                          className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center gap-2">
                        <div className="flex-1">
                          <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Instructions</label>
                          <input
                            type="text"
                            placeholder="After food"
                            value={med.instructions}
                            onChange={e => handleMedicineChange(idx, 'instructions', e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs focus:ring-1 focus:ring-blue-500"
                          />
                        </div>
                        {medicines.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveMedicineRow(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 mt-3"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">General Dietary / Lifestyle Advice</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Steam inhalation twice daily, drink plenty of warm fluids, rest well."
                    value={generalInstructions}
                    onChange={e => setGeneralInstructions(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Date</label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={e => setFollowUpDate(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {submitting ? 'Generating...' : 'Save & Issue Prescription'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
