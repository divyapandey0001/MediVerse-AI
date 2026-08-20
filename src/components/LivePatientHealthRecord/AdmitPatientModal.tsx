import React, { useState } from 'react';
import {
  X,
  UserPlus,
  Building2,
  Stethoscope,
  HeartPulse,
  AlertCircle,
  FileText
} from 'lucide-react';
import { LivePatientRecord } from '../../types.js';

interface AdmitPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientAdmitted: (record: LivePatientRecord) => void;
}

export const AdmitPatientModal: React.FC<AdmitPatientModalProps> = ({
  isOpen,
  onClose,
  onPatientAdmitted
}) => {
  const [patientName, setPatientName] = useState('');
  const [uhid, setUhid] = useState('');
  const [patientAge, setPatientAge] = useState<number | ''>('');
  const [patientGender, setPatientGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [bloodGroup, setBloodGroup] = useState('O Positive (O+)');
  const [contactPhone, setContactPhone] = useState('');
  const [allergies, setAllergies] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [bedRoomNo, setBedRoomNo] = useState('');
  const [department, setDepartment] = useState('General Medicine');
  const [attendingDoctor, setAttendingDoctor] = useState('Dr. Sarah Jenkins, MD');
  const [reasonForAdmission, setReasonForAdmission] = useState('');
  const [initialDoctorNote, setInitialDoctorNote] = useState('');

  // Vitals
  const [bp, setBp] = useState('');
  const [pulse, setPulse] = useState('');
  const [temp, setTemp] = useState('');
  const [spo2, setSpo2] = useState('');
  const [rr, setRr] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const departmentList = [
    'Cardiology',
    'Internal Medicine',
    'Pulmonology',
    'Neurology',
    'Orthopedics',
    'Oncology',
    'General Surgery',
    'Endocrinology',
    'Emergency & Critical Care',
    'Pediatrics',
    'Gastroenterology',
    'Nephrology'
  ];

  const doctorList = [
    'Dr. Marcus Vance, MD (Cardiology)',
    'Dr. Sarah Jenkins, MD (Internal Medicine)',
    'Dr. David Chen, MD (Pulmonology)',
    'Dr. Elena Rostova, MD (Endocrinology)',
    'Dr. Anita Patel, MD (Diagnostics & Hematology)'
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!patientName.trim()) {
      setErrorMessage('Please enter Patient Name.');
      return;
    }
    if (!reasonForAdmission.trim()) {
      setErrorMessage('Please enter Reason for Admission.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        patientName: patientName.trim(),
        uhid: uhid.trim() || undefined,
        patientAge: Number(patientAge) || 30,
        patientGender,
        bloodGroup,
        contactPhone: contactPhone.trim(),
        allergies: allergies.trim() || 'No Known Drug Allergies (NKDA)',
        emergencyContact: emergencyContact.trim(),
        bedRoomNo: bedRoomNo.trim() || 'Admitting Ward',
        department: department.trim(),
        attendingDoctor: attendingDoctor.trim(),
        reasonForAdmission: reasonForAdmission.trim(),
        admissionDateTime: new Date().toISOString(),
        initialVitals: {
          bloodPressure: bp,
          heartRate: pulse,
          temperature: temp,
          spO2: spo2,
          respiratoryRate: rr
        },
        initialDoctorNote: initialDoctorNote.trim()
      };

      const res = await fetch('/api/live-records', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to admit patient');
      }

      onPatientAdmitted(data.record);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to create digital patient admission record.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div
        id="admit-patient-modal"
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-xl">
              <UserPlus className="w-5 h-5 text-blue-200" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
                Direct Inpatient Admission
              </span>
              <h2 className="text-lg font-bold text-white">Create Digital Patient Record</h2>
            </div>
          </div>
          <button
            id="close-admit-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 flex-1">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs text-blue-900">
            <strong>Streamlined Digital Workflow:</strong> Creating this digital record immediately establishes the patient timeline. Hospital staff can immediately add continuous notes, lab findings, and medication orders directly without prerequisite PDF conversion.
          </div>

          {/* Section 1: Demographics */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-blue-600" /> 1. Patient Identification & Demographics
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Patient Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="admit-patient-name"
                  type="text"
                  required
                  value={patientName}
                  onChange={e => setPatientName(e.target.value)}
                  placeholder="e.g. Eleanor Vance"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Patient ID / UHID (Optional)
                </label>
                <input
                  type="text"
                  value={uhid}
                  onChange={e => setUhid(e.target.value)}
                  placeholder="Auto-generated if blank"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden text-slate-900 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Age</label>
                <input
                  type="number"
                  min="0"
                  max="125"
                  value={patientAge}
                  onChange={e => setPatientAge(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                <select
                  value={patientGender}
                  onChange={e => setPatientGender(e.target.value as any)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden text-slate-900"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={e => setBloodGroup(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden text-slate-900"
                >
                  <option value="A Positive (A+)">A Positive (A+)</option>
                  <option value="A Negative (A-)">A Negative (A-)</option>
                  <option value="B Positive (B+)">B Positive (B+)</option>
                  <option value="B Negative (B-)">B Negative (B-)</option>
                  <option value="O Positive (O+)">O Positive (O+)</option>
                  <option value="O Negative (O-)">O Negative (O-)</option>
                  <option value="AB Positive (AB+)">AB Positive (AB+)</option>
                  <option value="AB Negative (AB-)">AB Negative (AB-)</option>
                  <option value="Unknown">Unknown</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Clinical Details */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-indigo-600" /> 2. Inpatient Department & Admitting Team
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Department <span className="text-rose-500">*</span>
                </label>
                <select
                  value={department}
                  onChange={e => setDepartment(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden text-slate-900"
                >
                  {departmentList.map(dep => (
                    <option key={dep} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attending Doctor <span className="text-rose-500">*</span>
                </label>
                <select
                  value={attendingDoctor}
                  onChange={e => setAttendingDoctor(e.target.value)}
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden text-slate-900"
                >
                  {doctorList.map(doc => (
                    <option key={doc} value={doc}>{doc}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bed / Room No</label>
                <input
                  type="text"
                  value={bedRoomNo}
                  onChange={e => setBedRoomNo(e.target.value)}
                  placeholder="e.g. Bed 302, ICU-4"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden text-slate-900"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Reason for Admission <span className="text-rose-500">*</span>
                </label>
                <input
                  id="admit-reason"
                  type="text"
                  required
                  value={reasonForAdmission}
                  onChange={e => setReasonForAdmission(e.target.value)}
                  placeholder="e.g. Community-Acquired Pneumonia with hypoxemia"
                  className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden text-slate-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-rose-700 mb-1">Documented Allergies</label>
                <input
                  type="text"
                  value={allergies}
                  onChange={e => setAllergies(e.target.value)}
                  placeholder="e.g. Penicillin, NSAIDs, None"
                  className="w-full px-3.5 py-2 text-sm bg-rose-50/50 border border-rose-200 rounded-xl focus:ring-2 focus:ring-rose-500 focus:bg-white transition-all outline-hidden text-rose-900 font-medium"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Baseline Admission Vitals */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center gap-1.5">
              <HeartPulse className="w-3.5 h-3.5 text-rose-600" /> 3. Baseline Admission Vitals
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Blood Pressure</label>
                <input
                  type="text"
                  value={bp}
                  onChange={e => setBp(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Heart Rate</label>
                <input
                  type="text"
                  value={pulse}
                  onChange={e => setPulse(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Temperature</label>
                <input
                  type="text"
                  value={temp}
                  onChange={e => setTemp(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">SpO2</label>
                <input
                  type="text"
                  value={spo2}
                  onChange={e => setSpo2(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">Resp Rate</label>
                <input
                  type="text"
                  value={rr}
                  onChange={e => setRr(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 4: Initial Doctor Admission Note */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-blue-600" /> Initial Admission Note & Management Plan
            </label>
            <textarea
              rows={3}
              value={initialDoctorNote}
              onChange={e => setInitialDoctorNote(e.target.value)}
              placeholder="Initial clinical presentation, initial impressions, and immediate care instructions..."
              className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden text-slate-900"
            />
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              id="confirm-admit-btn"
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Admitting Patient...' : 'Admit & Initialize Digital Health Record'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
