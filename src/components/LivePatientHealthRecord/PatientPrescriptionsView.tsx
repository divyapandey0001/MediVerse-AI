import React, { useState } from 'react';
import {
  FileText,
  Pill,
  Plus,
  Download,
  Search,
  CheckCircle2,
  Calendar,
  User,
  Stethoscope,
  Printer,
  ShieldCheck
} from 'lucide-react';
import {
  PatientTimelineEntry,
  LivePatientRecord,
  Prescription
} from '../../types.js';
import { downloadPrescriptionPDF } from '../../utils/pdfExport.js';

interface PatientPrescriptionsViewProps {
  patient: LivePatientRecord;
  entries: PatientTimelineEntry[];
  onOpenWritePrescriptionModal: () => void;
}

export const PatientPrescriptionsView: React.FC<PatientPrescriptionsViewProps> = ({
  patient,
  entries,
  onOpenWritePrescriptionModal
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Extract all prescription entries
  const prescriptionEntries = entries.filter(
    e => e.entryType === 'Prescription' || (e.structuredData?.medications && e.structuredData.medications.length > 0 && e.title.toLowerCase().includes('prescription'))
  );

  const handleDownloadPrescription = (entry: PatientTimelineEntry) => {
    const medicines = (entry.structuredData?.medications || []).map(m => ({
      name: m.name,
      strength: m.dose || 'Standard',
      frequency: m.frequency || 'Daily',
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
      doctorSpecialty: entry.authorRole || 'Attending Physician',
      doctorQualification: 'MD',
      diagnosis: entry.structuredData?.impression || entry.title,
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

  const filteredPrescriptions = prescriptionEntries.filter(entry => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;

    const inTitle = entry.title.toLowerCase().includes(q);
    const inContent = entry.content.toLowerCase().includes(q);
    const inAuthor = entry.authorName.toLowerCase().includes(q);
    const inMeds = entry.structuredData?.medications?.some(
      m => m.name.toLowerCase().includes(q) || (m.instructions && m.instructions.toLowerCase().includes(q))
    );

    return inTitle || inContent || inAuthor || inMeds;
  });

  return (
    <div id="patient-prescriptions-view" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-0.5">
            <Pill className="w-4 h-4" /> Pharmacotherapy & Digital Prescriptions
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">
            Digital Prescriptions & Inpatient Rx Orders
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Official digital medical prescriptions created for {patient.patientName} ({patient.uhid}) with one-click PDF export and print formatting.
          </p>
        </div>

        <button
          id="write-rx-tab-btn"
          onClick={onOpenWritePrescriptionModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-md shadow-amber-600/20 transition-all cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Create Prescription
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search prescriptions by medicine, doctor, or diagnosis..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-amber-500"
          />
        </div>

        <span className="text-xs font-semibold text-slate-500">
          Showing {filteredPrescriptions.length} of {prescriptionEntries.length} Prescriptions
        </span>
      </div>

      {/* Prescriptions List */}
      {prescriptionEntries.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
            <FileText className="w-7 h-7" />
          </div>
          <h4 className="text-base font-bold text-slate-800">No prescriptions recorded yet.</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click "Create Prescription" to enter medications, dosages, frequency, durations, and instructions for {patient.patientName}.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenWritePrescriptionModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Create Prescription
            </button>
          </div>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-200 shadow-xs text-xs text-slate-500">
          No prescriptions found matching "{searchQuery}".
        </div>
      ) : (
        <div className="space-y-4">
          {filteredPrescriptions.map(entry => {
            const medications = entry.structuredData?.medications || [];

            return (
              <div
                key={entry.id}
                className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs hover:border-amber-300 transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{entry.title}</span>
                      <span className="font-mono text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold">
                        Digital Rx
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 flex flex-wrap items-center gap-3">
                      <span className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        Prescribing Doctor: <strong className="text-slate-700">{entry.authorName}</strong>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(entry.timestamp).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDownloadPrescription(entry)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" /> Download Prescription PDF
                  </button>
                </div>

                {/* Medications Table / List */}
                {medications.length > 0 ? (
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                        <tr>
                          <th className="py-2.5 px-4">#</th>
                          <th className="py-2.5 px-4">Medicine Name</th>
                          <th className="py-2.5 px-4">Dose / Strength</th>
                          <th className="py-2.5 px-4">Route</th>
                          <th className="py-2.5 px-4">Frequency</th>
                          <th className="py-2.5 px-4">Duration</th>
                          <th className="py-2.5 px-4">Instructions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {medications.map((m, idx) => (
                          <tr key={idx} className="hover:bg-slate-50/80">
                            <td className="py-2.5 px-4 text-slate-400 font-mono text-[11px]">{idx + 1}</td>
                            <td className="py-2.5 px-4 font-bold text-slate-900 flex items-center gap-1.5">
                              <Pill className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              {m.name}
                            </td>
                            <td className="py-2.5 px-4 font-mono font-medium text-slate-800">{m.dose || '—'}</td>
                            <td className="py-2.5 px-4 text-slate-700">{m.route || 'Oral'}</td>
                            <td className="py-2.5 px-4 font-medium text-slate-800">
                              <span className="bg-amber-50 text-amber-800 px-2 py-0.5 rounded font-semibold text-[10px]">
                                {m.frequency}
                              </span>
                            </td>
                            <td className="py-2.5 px-4 text-slate-600">{m.duration || '—'}</td>
                            <td className="py-2.5 px-4 text-slate-600 text-[11px]">
                              {m.instructions || 'As directed'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-700 whitespace-pre-line border border-slate-100">
                    {entry.content}
                  </div>
                )}

                {/* Additional Clinical Notes & Directives */}
                {entry.content && medications.length > 0 && (
                  <div className="p-3 bg-slate-50 rounded-xl text-xs text-slate-600 border border-slate-100">
                    <strong className="text-slate-800 block mb-0.5">Doctor Instructions & Advice:</strong>
                    <p className="whitespace-pre-line">{entry.content}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
