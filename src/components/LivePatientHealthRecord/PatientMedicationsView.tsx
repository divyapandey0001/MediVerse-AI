import React, { useState } from 'react';
import {
  Pill,
  Plus,
  Download,
  Search,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  FileText,
  RefreshCw,
  Sparkles
} from 'lucide-react';
import {
  PatientTimelineEntry,
  StructuredMedicationItem,
  LivePatientRecord,
  LivePatientAiSummary,
  Prescription
} from '../../types.js';
import { downloadPrescriptionPDF } from '../../utils/pdfExport.js';

interface PatientMedicationsViewProps {
  patient: LivePatientRecord;
  entries: PatientTimelineEntry[];
  summary: LivePatientAiSummary | null;
  onOpenWritePrescriptionModal: () => void;
  onOpenAddEntryModal: (defaultType?: string) => void;
}

export const PatientMedicationsView: React.FC<PatientMedicationsViewProps> = ({
  patient,
  entries,
  summary,
  onOpenWritePrescriptionModal,
  onOpenAddEntryModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all structured medications from timeline entries
  const allMedications: Array<{
    med: StructuredMedicationItem;
    entryTitle: string;
    timestamp: string;
    author: string;
    entryType: string;
  }> = [];

  entries.forEach(entry => {
    if (entry.structuredData?.medications && entry.structuredData.medications.length > 0) {
      entry.structuredData.medications.forEach(med => {
        allMedications.push({
          med,
          entryTitle: entry.title,
          timestamp: entry.timestamp,
          author: entry.authorName,
          entryType: entry.entryType
        });
      });
    }
  });

  // Extract prescriptions from timeline entries
  const prescriptionEntries = entries.filter(e => e.entryType === 'Prescription');

  const filteredMeds = allMedications.filter(({ med }) => {
    const q = searchQuery.toLowerCase().trim();
    return !q || med.name.toLowerCase().includes(q) || (med.instructions && med.instructions.toLowerCase().includes(q));
  });

  const handleDownloadPrescription = (entry: PatientTimelineEntry) => {
    const medicines = (entry.structuredData?.medications || []).map(m => ({
      name: m.name,
      strength: m.dose,
      frequency: m.frequency,
      duration: m.duration || '5 Days',
      instructions: m.instructions || 'As directed'
    }));

    const rxObj: Prescription = {
      id: entry.id,
      patientUserId: patient.id,
      doctorUserId: 'doctor_staff',
      prescriptionNumber: entry.title.match(/RX-\d+/)?.[0] || `RX-${Date.now().toString().slice(-6)}`,
      patientName: patient.patientName,
      patientId: patient.uhid,
      patientAge: patient.patientAge,
      patientGender: patient.patientGender,
      doctorName: entry.authorName,
      doctorSpecialty: 'Inpatient Physician',
      doctorQualification: 'MD',
      diagnosis: entry.title,
      medicines: medicines.length > 0 ? medicines : [{
        name: 'Prescribed Medication',
        strength: 'As ordered',
        frequency: 'As directed',
        duration: 'Course',
        instructions: entry.content
      }],
      instructions: entry.content,
      createdAt: entry.timestamp
    };

    downloadPrescriptionPDF(rxObj);
  };

  return (
    <div id="patient-medications-view" className="space-y-6">
      {/* 1. Active Inpatient Medications */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
              <Pill className="w-4 h-4" /> Pharmacotherapy & Medication Orders
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Active Inpatient Medications ({allMedications.length} Documented)
            </h3>
            <p className="text-xs text-slate-500">
              Live medication regimen administered and prescribed for {patient.patientName}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenWritePrescriptionModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Pill className="w-3.5 h-3.5" /> Write Prescription
            </button>
            <button
              onClick={() => onOpenAddEntryModal('Medication Admin / Order')}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Order Medication
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search medications by name or instructions..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:bg-white focus:ring-1 focus:ring-amber-500"
          />
        </div>

        {allMedications.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <Pill className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700">No active medications documented yet.</p>
            <p className="text-slate-400">
              Click "Write Prescription" or "Order Medication" to prescribe medications to this patient.
            </p>
          </div>
        ) : filteredMeds.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No medications matching your search found.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Medication Name</th>
                  <th className="py-2.5 px-4">Dosage / Strength</th>
                  <th className="py-2.5 px-4">Route</th>
                  <th className="py-2.5 px-4">Frequency</th>
                  <th className="py-2.5 px-4">Duration</th>
                  <th className="py-2.5 px-4">Special Instructions</th>
                  <th className="py-2.5 px-4">Prescribing Doctor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredMeds.map(({ med, timestamp, author }, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      {med.name}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                      {med.dose || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-700 font-medium">{med.route || 'Oral'}</td>
                    <td className="py-2.5 px-4 font-medium text-slate-800">
                      <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold text-[10px]">
                        {med.frequency}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-slate-600">{med.duration || 'Ongoing'}</td>
                    <td className="py-2.5 px-4 text-slate-600 text-[11px]">
                      {med.instructions || 'Take as directed'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px] whitespace-nowrap">
                      {author}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Official Inpatient Prescriptions Issued */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
              <FileText className="w-4 h-4" /> Official Prescriptions Issued
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Prescription Orders ({prescriptionEntries.length})
            </h3>
          </div>
        </div>

        {prescriptionEntries.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No official prescriptions issued yet. Click "Write Prescription" to generate an official digital prescription.
          </div>
        ) : (
          <div className="space-y-3">
            {prescriptionEntries.map(entry => (
              <div
                key={entry.id}
                className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-blue-300 transition-all"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-slate-900">{entry.title}</span>
                    <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-semibold">
                      Prescription
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 whitespace-pre-line line-clamp-2">
                    {entry.content}
                  </p>
                  <div className="text-[10px] text-slate-400 flex items-center gap-2 pt-1">
                    <span>By: {entry.authorName} ({entry.authorRole})</span>
                    <span>•</span>
                    <span>Date: {new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadPrescription(entry)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Download PDF
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3. AI Synthesized Medication Changes & Timeline if present in summary */}
      {summary?.medicationChanges && summary.medicationChanges.length > 0 && (
        <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Chronological Medication Changes & Adjustments
          </h4>
          <div className="space-y-2">
            {summary.medicationChanges.map((change, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-slate-900">{change.medicine}</span>
                  <span className="text-slate-500 ml-2">({change.reason || 'Dosage / regimen change'})</span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                  {change.changeType}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
