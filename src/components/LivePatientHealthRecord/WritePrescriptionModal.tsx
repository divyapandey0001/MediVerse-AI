import React, { useState } from 'react';
import {
  X,
  Pill,
  Plus,
  Trash2,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  FileText
} from 'lucide-react';
import { PatientTimelineEntry, Prescription } from '../../types.js';
import { downloadPrescriptionPDF } from '../../utils/pdfExport.js';

interface WritePrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientRecordId: string;
  uhid: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  defaultDoctorName?: string;
  onEntryAdded: (newEntry: PatientTimelineEntry) => void;
}

interface MedicineRow {
  name: string;
  strength: string;
  frequency: string;
  route: string;
  duration: string;
  instructions: string;
}

export const WritePrescriptionModal: React.FC<WritePrescriptionModalProps> = ({
  isOpen,
  onClose,
  patientRecordId,
  uhid,
  patientName,
  patientAge,
  patientGender,
  defaultDoctorName = 'Dr. Staff, MD',
  onEntryAdded
}) => {
  const [diagnosis, setDiagnosis] = useState('');
  const [doctorName, setDoctorName] = useState(defaultDoctorName);
  const [doctorSpecialty, setDoctorSpecialty] = useState('Inpatient Medicine');
  const [medicines, setMedicines] = useState<MedicineRow[]>([
    {
      name: '',
      strength: '',
      frequency: '1-0-1 (Twice Daily)',
      route: 'Oral',
      duration: '5 Days',
      instructions: 'After meals with water'
    }
  ]);
  const [instructions, setInstructions] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddMedicineRow = () => {
    setMedicines(prev => [
      ...prev,
      {
        name: '',
        strength: '',
        frequency: '1-0-1 (Twice Daily)',
        route: 'Oral',
        duration: '5 Days',
        instructions: 'After meals'
      }
    ]);
  };

  const handleRemoveMedicineRow = (index: number) => {
    if (medicines.length <= 1) return;
    setMedicines(prev => prev.filter((_, i) => i !== index));
  };

  const handleUpdateMedicine = (index: number, field: keyof MedicineRow, value: string) => {
    setMedicines(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const validMeds = medicines.filter(m => m.name.trim().length > 0);
    if (validMeds.length === 0) {
      setErrorMessage('Please specify at least one medication name.');
      return;
    }
    if (!diagnosis.trim()) {
      setErrorMessage('Clinical diagnosis is required for prescription issuance.');
      return;
    }

    try {
      setIsSubmitting(true);
      const rxNumber = `RX-${Date.now().toString().slice(-6)}`;
      const now = new Date().toISOString();

      // Structure data for timeline entry
      const structuredMeds = validMeds.map(m => ({
        name: m.name.trim(),
        dose: m.strength.trim() || 'Standard Dose',
        route: m.route || 'Oral',
        frequency: m.frequency,
        duration: m.duration,
        action: 'Started' as const,
        instructions: m.instructions
      }));

      const medSummaryList = validMeds
        .map((m, i) => `${i + 1}. ${m.name} ${m.strength ? '(' + m.strength + ')' : ''} - ${m.frequency} [${m.route}] for ${m.duration} (${m.instructions})`)
        .join('\n');

      const entryContent = `Prescription issued for ${diagnosis.trim()}.\n\nMedications:\n${medSummaryList}\n\nSpecial Advice: ${instructions.trim() || 'Follow prescribed dosing regimen.'}${followUpDate ? '\nFollow-up: ' + followUpDate : ''}`;

      const res = await fetch(`/api/live-records/${patientRecordId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryType: 'Prescription',
          timestamp: now,
          authorName: doctorName.trim(),
          authorRole: 'Prescribing Physician',
          title: `Official Inpatient Prescription (${rxNumber}) - ${diagnosis.trim()}`,
          content: entryContent,
          structuredData: {
            medications: structuredMeds,
            impression: diagnosis.trim()
          },
          isCritical: false
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to save prescription entry.');
      }

      // Prepare Prescription object for immediate PDF download
      const prescriptionObj: Prescription = {
        id: `rx_${Date.now()}`,
        patientUserId: patientRecordId,
        doctorUserId: 'doctor_staff',
        prescriptionNumber: rxNumber,
        patientName,
        patientId: uhid,
        patientAge: patientAge || 0,
        patientGender: patientGender || 'N/A',
        doctorName: doctorName.trim(),
        doctorSpecialty: doctorSpecialty.trim(),
        doctorQualification: 'MD',
        doctorLicense: 'MED-INPATIENT',
        diagnosis: diagnosis.trim(),
        medicines: validMeds.map(m => ({
          name: m.name.trim(),
          strength: m.strength.trim(),
          frequency: m.frequency,
          duration: m.duration,
          instructions: m.instructions
        })),
        instructions: instructions.trim(),
        followUpDate: followUpDate || undefined,
        createdAt: now
      };

      // Trigger automatic PDF generation
      downloadPrescriptionPDF(prescriptionObj);

      if (data.entry) {
        onEntryAdded(data.entry);
      }

      onClose();
    } catch (err: any) {
      console.error('Prescription save error:', err);
      setErrorMessage(err.message || 'Failed to record and export prescription.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div id="write-prescription-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
              <Pill className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Write Prescription & Download PDF
              </h3>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-800">{patientName}</span> ({uhid})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Doctor & Diagnosis Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Prescribing Doctor *
              </label>
              <input
                type="text"
                value={doctorName}
                onChange={e => setDoctorName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Clinical Diagnosis / Indication *
              </label>
              <input
                type="text"
                value={diagnosis}
                onChange={e => setDiagnosis(e.target.value)}
                placeholder="e.g. Acute Bacterial Pneumonia, Stage 2 HTN"
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-500 font-medium"
              />
            </div>
          </div>

          {/* Medicines Dynamic Table */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                Medications & Dosing Schedule
              </span>
              <button
                type="button"
                onClick={handleAddMedicineRow}
                className="inline-flex items-center gap-1 text-xs font-bold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> Add Medicine
              </button>
            </div>

            <div className="space-y-2.5">
              {medicines.map((med, index) => (
                <div key={index} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-slate-500 font-bold text-[10px]">
                    <span>Item #{index + 1}</span>
                    {medicines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveMedicineRow(index)}
                        className="text-rose-600 hover:text-rose-700 flex items-center gap-0.5"
                      >
                        <Trash2 className="w-3 h-3" /> Remove
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Medicine name (e.g. Amoxicillin, Paracetamol)"
                        value={med.name}
                        onChange={e => handleUpdateMedicine(index, 'name', e.target.value)}
                        required
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-hidden focus:ring-1 focus:ring-amber-500 font-medium"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        placeholder="Strength (e.g. 500mg, 10ml)"
                        value={med.strength}
                        onChange={e => handleUpdateMedicine(index, 'strength', e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg outline-hidden focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-[11px]">
                    <div>
                      <select
                        value={med.frequency}
                        onChange={e => handleUpdateMedicine(index, 'frequency', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-hidden"
                      >
                        <option value="1-0-1 (Twice Daily)">1-0-1 (Twice Daily)</option>
                        <option value="1-1-1 (Thrice Daily)">1-1-1 (Thrice Daily)</option>
                        <option value="1-0-0 (Once Morning)">1-0-0 (Once Morning)</option>
                        <option value="0-0-1 (Once Night)">0-0-1 (Once Night)</option>
                        <option value="PRN (As Needed)">PRN (As Needed)</option>
                        <option value="Q4H (Every 4 Hours)">Q4H (Every 4 Hours)</option>
                        <option value="Q6H (Every 6 Hours)">Q6H (Every 6 Hours)</option>
                      </select>
                    </div>

                    <div>
                      <select
                        value={med.route}
                        onChange={e => handleUpdateMedicine(index, 'route', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-hidden"
                      >
                        <option value="Oral">Oral (PO)</option>
                        <option value="IV">Intravenous (IV)</option>
                        <option value="IM">Intramuscular (IM)</option>
                        <option value="SC">Subcutaneous (SC)</option>
                        <option value="Topical">Topical</option>
                        <option value="Inhalation">Inhalation</option>
                        <option value="Sublingual">Sublingual</option>
                      </select>
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="Duration (e.g. 5 Days)"
                        value={med.duration}
                        onChange={e => handleUpdateMedicine(index, 'duration', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-hidden"
                      />
                    </div>

                    <div>
                      <input
                        type="text"
                        placeholder="e.g. After meals"
                        value={med.instructions}
                        onChange={e => handleUpdateMedicine(index, 'instructions', e.target.value)}
                        className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded-lg outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Instructions & Follow-up */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100">
            <div className="sm:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Special Dietary or Administration Instructions
              </label>
              <textarea
                rows={2}
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                placeholder="e.g. Drink plenty of water. Monitor blood pressure morning and night."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Follow-Up Consultation Date
              </label>
              <input
                type="date"
                value={followUpDate}
                onChange={e => setFollowUpDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:bg-white focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-md shadow-amber-500/20 transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              {isSubmitting ? 'Saving & Generating PDF...' : 'Issue Prescription & Download PDF'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
