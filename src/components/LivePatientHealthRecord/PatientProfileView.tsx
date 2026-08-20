import React from 'react';
import {
  User,
  Phone,
  AlertTriangle,
  Building2,
  Stethoscope,
  Bed,
  Calendar,
  Clock,
  HeartPulse,
  ShieldCheck,
  Edit,
  LogOut,
  Droplet
} from 'lucide-react';
import { LivePatientRecord } from '../../types.js';

interface PatientProfileViewProps {
  patient: LivePatientRecord;
  onEditPatient: () => void;
}

export const PatientProfileView: React.FC<PatientProfileViewProps> = ({
  patient,
  onEditPatient
}) => {
  return (
    <div id="patient-profile-view" className="space-y-6">
      {/* 1. Core Demographics Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md shadow-blue-500/20">
              {patient.patientName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold text-slate-900">{patient.patientName}</h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                  {patient.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                UHID / Patient ID: <span className="font-bold text-slate-700">{patient.uhid}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onEditPatient}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            <Edit className="w-3.5 h-3.5" /> Edit Record / Change Status
          </button>
        </div>

        {/* Demographics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1">Age / Gender</span>
            <span className="font-bold text-slate-900 text-sm">
              {patient.patientAge} Yrs • {patient.patientGender}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1">Blood Group</span>
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1">
              <Droplet className="w-4 h-4 text-rose-600" />
              {patient.bloodGroup || 'Not Specified'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1">Contact Phone</span>
            <span className="font-bold text-slate-900 text-sm flex items-center gap-1 truncate">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              {patient.contactPhone || '—'}
            </span>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-[11px] text-slate-400 font-semibold block mb-1">Emergency Contact</span>
            <span className="font-bold text-slate-900 text-sm truncate block">
              {patient.emergencyContact || '—'}
            </span>
          </div>
        </div>

        {/* Inpatient & Hospital Location Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-1">
            <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-blue-600" /> Admitting Department
            </span>
            <p className="font-bold text-slate-900 text-sm">{patient.department}</p>
          </div>

          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-1">
            <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
              <Stethoscope className="w-4 h-4 text-blue-600" /> Attending Physician
            </span>
            <p className="font-bold text-slate-900 text-sm">{patient.attendingDoctor}</p>
          </div>

          <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-1">
            <span className="text-[11px] font-bold text-blue-900 flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-blue-600" /> Room / Ward / Bed
            </span>
            <p className="font-bold text-slate-900 text-sm">{patient.bedRoomNo || 'General Inpatient'}</p>
          </div>
        </div>

        {/* Allergies & Precautions */}
        <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-2xl space-y-1 text-xs">
          <span className="text-[11px] font-bold text-amber-900 flex items-center gap-1.5 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> Documented Allergies & Medical Warnings
          </span>
          <p className="text-slate-800 font-medium pt-0.5">
            {patient.allergies || 'No known drug allergies (NKDA) or critical medical alerts documented.'}
          </p>
        </div>

        {/* Reason for Admission */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-1 text-xs">
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
            Reason For Admission & Chief Clinical Complaints
          </span>
          <p className="text-slate-800 font-medium leading-relaxed">
            {patient.reasonForAdmission}
          </p>
        </div>

        {/* Admission Timing */}
        <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Admitted: <strong>{new Date(patient.admissionDateTime).toLocaleString()}</strong></span>
          </div>

          {patient.dischargeDateTime && (
            <div className="flex items-center gap-2 text-rose-700">
              <LogOut className="w-4 h-4" />
              <span>Discharged: <strong>{new Date(patient.dischargeDateTime).toLocaleString()}</strong></span>
            </div>
          )}

          <div className="text-[11px]">
            Created: {new Date(patient.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
};
