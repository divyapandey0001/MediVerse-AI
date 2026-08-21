import React, { useState } from 'react';
import { UserCheck, Save, AlertCircle, CheckCircle2, Building2, Phone, MapPin, AlertTriangle } from 'lucide-react';
import { LivePatientRecord } from '../../types.js';
import { useAuth } from '../../context/AuthContext.js';

interface PatientProfileTabProps {
  patient: LivePatientRecord;
  onRefreshPatient: (updated: LivePatientRecord) => void;
}

export const PatientProfileTab: React.FC<PatientProfileTabProps> = ({
  patient,
  onRefreshPatient
}) => {
  const { token, user } = useAuth();

  const [patientName, setPatientName] = useState(patient.patientName);
  const [age, setAge] = useState(patient.age ? patient.age.toString() : '');
  const [gender, setGender] = useState(patient.gender || 'Male');
  const [bloodGroup, setBloodGroup] = useState(patient.bloodGroup || 'O+');
  const [department, setDepartment] = useState(patient.department || 'General Medicine');
  const [attendingPhysician, setAttendingPhysician] = useState(patient.attendingPhysician || '');
  const [bedRoomNo, setBedRoomNo] = useState(patient.bedRoomNo || '');
  const [allergies, setAllergies] = useState(patient.allergies || '');
  const [reasonForAdmission, setReasonForAdmission] = useState(patient.reasonForAdmission || '');
  const [emergencyContact, setEmergencyContact] = useState(patient.emergencyContact || '');
  const [contactPhone, setContactPhone] = useState(patient.contactPhone || '');
  const [address, setAddress] = useState(patient.address || '');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientName.trim()) {
      setError('Patient name cannot be empty.');
      return;
    }

    try {
      setSaving(true);
      setError(null);
      setSuccessMsg(null);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/patients/${patient.id}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          patientName: patientName.trim(),
          age: age ? Number(age) : undefined,
          gender,
          bloodGroup,
          department,
          attendingPhysician: attendingPhysician.trim(),
          bedRoomNo: bedRoomNo.trim() || undefined,
          allergies: allergies.trim() || undefined,
          reasonForAdmission: reasonForAdmission.trim(),
          emergencyContact: emergencyContact.trim() || undefined,
          contactPhone: contactPhone.trim() || undefined,
          address: address.trim() || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to update patient profile.');

      onRefreshPatient(data.patient);
      setSuccessMsg('Patient profile and demographics saved successfully.');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Error updating profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-xs space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">Patient Demographic Profile</h3>
          <p className="text-xs text-slate-500">
            UHID: <strong className="font-mono text-blue-700">{patient.uhid}</strong> • Admitted: {new Date(patient.admissionDateTime).toLocaleDateString()}
          </p>
        </div>
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          Status: {patient.status}
        </span>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSaveProfile} className="space-y-6">
        
        {/* Identity */}
        <div>
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3">Identity & Vitals Baseline</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Patient Name</label>
              <input
                type="text"
                required
                value={patientName}
                onChange={e => setPatientName(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Age (Years)</label>
              <input
                type="number"
                value={age}
                onChange={e => setAge(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={gender}
                onChange={e => setGender(e.target.value as any)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
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
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="Unknown">Unknown</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
              <input
                type="tel"
                value={contactPhone}
                onChange={e => setContactPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
              <input
                type="text"
                value={address}
                onChange={e => setAddress(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Hospital Assignment */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-3">Hospital Department & Bed Assignment</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="General Medicine">General Medicine</option>
                <option value="Cardiology">Cardiology</option>
                <option value="Pulmonology">Pulmonology</option>
                <option value="Neurology">Neurology</option>
                <option value="Orthopedics">Orthopedics</option>
                <option value="Gastroenterology">Gastroenterology</option>
                <option value="Pediatrics">Pediatrics</option>
                <option value="Emergency & Trauma">Emergency & Trauma</option>
                <option value="Oncology">Oncology</option>
                <option value="Endocrinology">Endocrinology</option>
                <option value="Intensive Care Unit (ICU)">Intensive Care Unit (ICU)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Attending Physician</label>
              <input
                type="text"
                value={attendingPhysician}
                onChange={e => setAttendingPhysician(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Bed / Ward / Room</label>
              <input
                type="text"
                value={bedRoomNo}
                onChange={e => setBedRoomNo(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Clinical alerts */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">Clinical Alerts & Contacts</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Known Drug/Food Allergies</label>
              <input
                type="text"
                value={allergies}
                onChange={e => setAllergies(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Contact Person</label>
              <input
                type="text"
                value={emergencyContact}
                onChange={e => setEmergencyContact(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Chief Complaint / Admission Reason</label>
              <textarea
                rows={2}
                value={reasonForAdmission}
                onChange={e => setReasonForAdmission(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-200 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg disabled:opacity-50 transition-all flex items-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>

      </form>
    </div>
  );
};
