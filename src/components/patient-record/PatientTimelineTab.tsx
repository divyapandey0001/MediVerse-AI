import React, { useState } from 'react';
import {
  Clock,
  Filter,
  UserCheck,
  FileText,
  HeartPulse,
  Pill,
  Stethoscope,
  Sparkles,
  LogOut,
  Upload,
  Activity,
  FileSpreadsheet
} from 'lucide-react';
import { LivePatientRecord, PatientTimelineEvent } from '../../types.js';

interface PatientTimelineTabProps {
  patient: LivePatientRecord;
}

export const PatientTimelineTab: React.FC<PatientTimelineTabProps> = ({ patient }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const timeline = patient.timeline || [];

  const getEventCategory = (event: PatientTimelineEvent): string => {
    if (event.category) return event.category;
    if (event.eventType) {
      if (event.eventType.includes('Admission')) return 'Admission';
      if (event.eventType.includes('Document')) return 'Document';
      if (event.eventType.includes('Vital')) return 'Vitals';
      if (event.eventType.includes('Lab')) return 'Labs';
      if (event.eventType.includes('Medication')) return 'Medication';
      if (event.eventType.includes('Diagnosis')) return 'Diagnosis';
      if (event.eventType.includes('Note')) return 'ClinicalNote';
      if (event.eventType.includes('Summary')) return 'Summary';
      if (event.eventType.includes('Prescription')) return 'Prescription';
      if (event.eventType.includes('Discharge')) return 'Discharge';
    }
    return 'General';
  };

  const filteredTimeline = timeline.filter(event => {
    if (selectedCategory === 'All') return true;
    return getEventCategory(event) === selectedCategory;
  });

  const getEventIcon = (category: string) => {
    switch (category) {
      case 'Admission':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'Document':
        return <Upload className="w-4 h-4 text-amber-600" />;
      case 'Vitals':
        return <HeartPulse className="w-4 h-4 text-rose-600" />;
      case 'Labs':
        return <FileSpreadsheet className="w-4 h-4 text-emerald-600" />;
      case 'Medication':
        return <Pill className="w-4 h-4 text-purple-600" />;
      case 'Diagnosis':
      case 'ClinicalNote':
        return <Stethoscope className="w-4 h-4 text-indigo-600" />;
      case 'Summary':
        return <Sparkles className="w-4 h-4 text-blue-600" />;
      case 'Prescription':
        return <FileText className="w-4 h-4 text-cyan-600" />;
      case 'Discharge':
        return <LogOut className="w-4 h-4 text-amber-600" />;
      default:
        return <Activity className="w-4 h-4 text-slate-600" />;
    }
  };

  const categories = ['All', 'Admission', 'Document', 'Vitals', 'Labs', 'Medication', 'Diagnosis', 'ClinicalNote', 'Prescription', 'Summary', 'Discharge'];

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-blue-100 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">Patient Clinical Timeline</h3>
          <p className="text-xs text-slate-500">
            Immutable chronological audit of every clinical admission, document upload, vital check, medication order, and summary.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Timeline Feed */}
      {filteredTimeline.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-blue-200 shadow-xs text-xs text-slate-500">
          No timeline events matching category "{selectedCategory}".
        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-blue-100 shadow-xs">
          <div className="relative pl-6 sm:pl-8 space-y-8 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-blue-100">
            {filteredTimeline.map((event, idx) => (
              <div key={event.id || idx} className="relative group">
                
                {/* Icon Bullet */}
                <div className="absolute -left-6 sm:-left-8 top-0.5 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-white border-2 border-blue-500 shadow-xs flex items-center justify-center -translate-x-1/2 group-hover:scale-110 transition-transform">
                  {getEventIcon(getEventCategory(event))}
                </div>

                {/* Event Card */}
                <div className="bg-slate-50/80 hover:bg-slate-100/70 p-4 sm:p-5 rounded-2xl border border-slate-200 transition-colors space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 uppercase tracking-wider">
                        {getEventCategory(event)}
                      </span>
                      <h4 className="font-bold text-slate-900 text-sm">{event.title || event.eventType || 'Event Recorded'}</h4>
                    </div>
                    <span className="text-xs text-slate-500 font-mono">
                      {new Date(event.timestamp).toLocaleDateString()} at {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-xs text-slate-700 leading-relaxed">{event.description}</p>

                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400">
                    <span>Action by: <strong className="text-slate-700">{event.performedBy || event.createdByName || 'Medical Staff'}</strong></span>
                    <span>MediVerse Audit Record</span>
                  </div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};
