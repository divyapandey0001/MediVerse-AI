import React, { useState } from 'react';
import { X, Edit3, AlertCircle, Building2 } from 'lucide-react';
import { LivePatientRecord, PatientAdmissionStatus } from '../../types.js';

interface EditPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: LivePatientRecord;
  onPatientUpdated: (updated: LivePatientRecord) => void;
}

export const EditPatientModal: React.FC<EditPatientModalProps> = ({
  isOpen,
  onClose,
  patient,
  onPatientUpdated
}) => {
  const [patientName, setPatientName] = useState(patient.patientName);
  const [patientAge, setPatientAge] = useState<number | ''>(patient.patientAge);
  const [patientGender, setPatientGender] = useState(patient.patientGender);
  const [bloodGroup, setBloodGroup] = useState(patient.bloodGroup);
  const [contactPhone, setContactPhone] = useState(patient.contactPhone || '');
  const [allergies, setAllergies] = useState(patient.allergies);
  const [bedRoomNo, setBedRoomNo] = useState(patient.bedRoomNo);
  const [department, setDepartment] = useState(patient.department);
  const [attendingDoctor, setAttendingDoctor] = useState(patient.attendingDoctor);
  const [reasonForAdmission, setReasonForAdmission] = useState(patient.reasonForAdmission);
  const [status, setStatus] = useState<PatientAdmissionStatus>(patient.status);
  const [dischargeSummary, setDischargeSummary] = useState(patient.dischargeSummary || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/live-records/${patient.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: patientName.trim(),
          patientAge: Number(patientAge) || patient.patientAge,
          patientGender,
          bloodGroup,
          contactPhone: contactPhone.trim(),
          allergies: allergies.trim(),
          bedRoomNo: bedRoomNo.trim(),
          department: department.trim(),
          attendingDoctor: attendingDoctor.trim(),
          reasonForAdmission: reasonForAdmission.trim(),
          status,
          dischargeSummary: status === 'Discharged' ? dischargeSummary.trim() : undefined,
          dischargeDateTime: status === 'Discharged' ? (patient.dischargeDateTime || new Date().toISOString()) : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to update patient record');
      }

      onPatientUpdated(data.record);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update patient record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div
        id="edit-patient-modal"
        className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        <div className="px-6 py-4 bg-gradient-to-r from-slate-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Edit3 className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold">Edit Patient Admission Details</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Patient Name</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Patient ID / UHID</label>
              <input
                type="text"
                disabled
                value={patient.uhid}
                className="w-full px-3.5 py-2 text-sm bg-slate-100 border border-slate-200 rounded-xl text-slate-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
              <input
                type="number"
                value={patientAge}
                onChange={e => setPatientAge(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl outline-hidden focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <input
                type="text"
                value={patientGender}
                onChange={e => setPatientGender(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl outline-hidden focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <input
                type="text"
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl outline-hidden focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Attending Doctor</label>
              <input
                type="text"
                value={attendingDoctor}
                onChange={e => setAttendingDoctor(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl outline-hidden focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bed / Room No</label>
              <input
                type="text"
                value={bedRoomNo}
                onChange={e => setBedRoomNo(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl outline-hidden focus:bg-white"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Admission Status</label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as any)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl outline-hidden focus:bg-white font-semibold"
              >
                <option value="Admitted">Admitted</option>
                <option value="Under Observation">Under Observation</option>
                <option value="ICU Care">ICU Care</option>
                <option value="Pre-Op">Pre-Op</option>
                <option value="Post-Op">Post-Op</option>
                <option value="Transferred">Transferred</option>
                <option value="Discharged">Discharged</option>
              </select>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Admission</label>
              <input
                type="text"
                value={reasonForAdmission}
                onChange={e => setReasonForAdmission(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl outline-hidden focus:bg-white"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-rose-700 mb-1">Documented Allergies</label>
              <input
                type="text"
                value={allergies}
                onChange={e => setAllergies(e.target.value)}
                className="w-full px-3.5 py-2 text-sm bg-rose-50/60 border border-rose-200 rounded-xl outline-hidden text-rose-900 font-medium"
              />
            </div>

            {status === 'Discharged' && (
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Discharge Summary & Instructions</label>
                <textarea
                  rows={3}
                  value={dischargeSummary}
                  onChange={e => setDischargeSummary(e.target.value)}
                  placeholder="Summary of inpatient stay and follow-up plan upon discharge..."
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl outline-hidden focus:bg-white"
                />
              </div>
            )}
          </div>

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors"
            >
              {isSubmitting ? 'Saving Changes...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
