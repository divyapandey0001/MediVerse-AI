import React, { useState } from 'react';
import {
  ArrowLeft,
  UserCheck,
  Building2,
  Calendar,
  AlertTriangle,
  FileDown,
  PlusCircle,
  FileCheck2,
  Sparkles,
  LogOut,
  Clock,
  HeartPulse,
  Activity,
  Printer,
  Mic
} from 'lucide-react';
import { LivePatientRecord } from '../../types.js';

interface PatientHeaderProps {
  patient: LivePatientRecord;
  onBackToList: () => void;
  onOpenDischargeModal: () => void;
  onOpenSummaryModal: () => void;
  onOpenPrescriptionModal: () => void;
  onOpenProfileTab: () => void;
  onOpenConsultationTab?: () => void;
}

export const PatientHeader: React.FC<PatientHeaderProps> = ({
  patient,
  onBackToList,
  onOpenDischargeModal,
  onOpenSummaryModal,
  onOpenPrescriptionModal,
  onOpenProfileTab,
  onOpenConsultationTab
}) => {
  const isAdmitted = patient.status === 'Admitted';
  const latestVital = patient.vitals?.[0];

  return (
    <div className="bg-white rounded-3xl border border-blue-100 shadow-sm p-5 sm:p-7 space-y-5">
      {/* Top action row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToList}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Patient Roster</span>
          </button>
          <span className="text-xs text-slate-400 font-mono">Live Patient Health Record</span>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
          {onOpenConsultationTab && (
            <button
              onClick={onOpenConsultationTab}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm transition-all hover:scale-[1.02]"
            >
              <Mic className="w-4 h-4 text-white animate-pulse" />
              <span>Start Consultation</span>
            </button>
          )}

          <button
            onClick={onOpenPrescriptionModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold text-xs border border-indigo-200/80 transition-all shadow-xs"
          >
            <PlusCircle className="w-4 h-4 text-indigo-600" />
            <span>Create Prescription</span>
          </button>

          <button
            onClick={onOpenSummaryModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200/80 transition-all shadow-xs"
          >
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span>Medical Summary</span>
          </button>

          {isAdmitted ? (
            <button
              onClick={onOpenDischargeModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-xs border border-amber-300 transition-all shadow-xs"
            >
              <LogOut className="w-4 h-4 text-amber-600" />
              <span>Mark Discharged</span>
            </button>
          ) : (
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-600 font-medium text-xs border border-slate-200">
              <FileCheck2 className="w-4 h-4 text-slate-500" />
              <span>Discharged on {new Date(patient.dischargeDateTime || patient.updatedAt).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Patient Demographics Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pt-2 border-t border-slate-100">
        
        {/* Left: Avatar & Key info */}
        <div className="flex items-start gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white flex items-center justify-center font-extrabold text-xl shadow-md shadow-blue-500/20 shrink-0">
            {patient.patientName.charAt(0).toUpperCase()}
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {patient.patientName}
              </h2>
              
              <span className="font-mono text-xs font-bold px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
                {patient.uhid}
              </span>

              {isAdmitted ? (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  Admitted (Inpatient)
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  Discharged
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-600">
              <span><strong>Age:</strong> {patient.age ? `${patient.age} yrs` : 'N/A'}</span>
              <span>•</span>
              <span><strong>Gender:</strong> {patient.gender || 'N/A'}</span>
              <span>•</span>
              <span><strong>Blood:</strong> <span className="font-semibold text-rose-600">{patient.bloodGroup || 'Unknown'}</span></span>
              <span>•</span>
              <span><strong>Dept:</strong> {patient.department}</span>
              <span>•</span>
              <span><strong>Room/Bed:</strong> {patient.bedRoomNo || 'Unassigned'}</span>
            </div>
          </div>
        </div>

        {/* Right: Attending Doctor & Admission Date */}
        <div className="flex flex-wrap items-center gap-4 bg-slate-50/80 rounded-2xl p-3.5 border border-slate-100 shrink-0">
          <div className="text-xs space-y-0.5">
            <span className="text-slate-400 block font-medium">Attending Physician</span>
            <span className="font-bold text-slate-800 block">{patient.attendingPhysician}</span>
          </div>

          <div className="h-7 w-px bg-slate-200 hidden sm:block" />

          <div className="text-xs space-y-0.5">
            <span className="text-slate-400 block font-medium">Admitted On</span>
            <span className="font-medium text-slate-800 block">
              {new Date(patient.admissionDateTime).toLocaleDateString()} at {new Date(patient.admissionDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {latestVital && (
            <>
              <div className="h-7 w-px bg-slate-200 hidden sm:block" />
              <div className="text-xs space-y-0.5">
                <span className="text-slate-400 block font-medium">Latest Vitals</span>
                <span className="font-bold text-blue-700 block">
                  {latestVital.bloodPressure ? `BP ${latestVital.bloodPressure}` : ''} {latestVital.spo2 ? `| SpO2 ${latestVital.spo2}%` : ''}
                </span>
              </div>
            </>
          )}
        </div>

      </div>

      {/* Allergies & Chief Complaint Alert */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
        {patient.allergies && (
          <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold uppercase tracking-wider text-[10px] text-amber-700 block">Known Allergies:</span>
              <span className="font-semibold">{patient.allergies}</span>
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-blue-950 text-xs flex items-center gap-2.5">
          <Activity className="w-4 h-4 text-blue-600 shrink-0" />
          <div className="truncate">
            <span className="font-bold uppercase tracking-wider text-[10px] text-blue-700 block">Chief Complaint / Admission Reason:</span>
            <span className="font-medium truncate block">{patient.reasonForAdmission}</span>
          </div>
        </div>
      </div>

    </div>
  );
};
