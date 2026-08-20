import React, { useState } from 'react';
import {
  Clock,
  Filter,
  Search,
  FileText,
  FlaskConical,
  Scan,
  Pill,
  HeartPulse,
  Stethoscope,
  Users,
  LogOut,
  Paperclip,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Trash2,
  ExternalLink,
  Plus,
  Calendar,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { PatientTimelineEntry, TimelineEntryType } from '../../types.js';

interface PatientTimelineProps {
  entries: PatientTimelineEntry[];
  highlightedEntryId?: string | null;
  onAddEntryClick: () => void;
  onDeleteEntry?: (entryId: string) => void;
  onSelectSourceEntry?: (entry: PatientTimelineEntry) => void;
}

export const PatientTimeline: React.FC<PatientTimelineProps> = ({
  entries,
  highlightedEntryId,
  onAddEntryClick,
  onDeleteEntry,
  onSelectSourceEntry
}) => {
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedEntryIds, setExpandedEntryIds] = useState<Record<string, boolean>>({});
  const [selectedSourceModalEntry, setSelectedSourceModalEntry] = useState<PatientTimelineEntry | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedEntryIds(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getEntryBadge = (type: TimelineEntryType) => {
    switch (type) {
      case 'Doctor / Progress Note':
        return { icon: FileText, bg: 'bg-blue-100 text-blue-800 border-blue-200', dot: 'bg-blue-500' };
      case 'Lab Result':
        return { icon: FlaskConical, bg: 'bg-emerald-100 text-emerald-800 border-emerald-200', dot: 'bg-emerald-500' };
      case 'Imaging / Radiology Report':
        return { icon: Scan, bg: 'bg-purple-100 text-purple-800 border-purple-200', dot: 'bg-purple-500' };
      case 'Medication Admin / Order':
      case 'Prescription':
        return { icon: Pill, bg: 'bg-amber-100 text-amber-800 border-amber-200', dot: 'bg-amber-500' };
      case 'Nursing Note / Vitals':
        return { icon: HeartPulse, bg: 'bg-rose-100 text-rose-800 border-rose-200', dot: 'bg-rose-500' };
      case 'Procedure / Treatment':
        return { icon: Stethoscope, bg: 'bg-indigo-100 text-indigo-800 border-indigo-200', dot: 'bg-indigo-500' };
      case 'Consultation Note':
        return { icon: Users, bg: 'bg-teal-100 text-teal-800 border-teal-200', dot: 'bg-teal-500' };
      case 'Discharge Information':
        return { icon: LogOut, bg: 'bg-orange-100 text-orange-800 border-orange-200', dot: 'bg-orange-500' };
      default:
        return { icon: Paperclip, bg: 'bg-slate-100 text-slate-800 border-slate-200', dot: 'bg-slate-500' };
    }
  };

  const filteredEntries = entries.filter(e => {
    const matchesType = selectedTypeFilter === 'All' || e.entryType === selectedTypeFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      e.title.toLowerCase().includes(q) ||
      e.content.toLowerCase().includes(q) ||
      e.authorName.toLowerCase().includes(q) ||
      e.entryType.toLowerCase().includes(q);
    return matchesType && matchesSearch;
  });

  const filterOptions = [
    'All',
    'Doctor / Progress Note',
    'Lab Result',
    'Imaging / Radiology Report',
    'Medication Admin / Order',
    'Nursing Note / Vitals',
    'Procedure / Treatment',
    'Consultation Note',
    'Discharge Information'
  ];

  return (
    <div id="patient-timeline-container" className="space-y-4">
      {/* Controls & Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search clinical notes, labs, meds, author..."
              className="w-full pl-9 pr-3.5 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500 text-slate-900"
            />
          </div>

          <select
            value={selectedTypeFilter}
            onChange={e => setSelectedTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl outline-hidden font-medium text-slate-700"
          >
            {filterOptions.map(opt => (
              <option key={opt} value={opt}>
                {opt === 'All' ? 'All Entry Types' : opt}
              </option>
            ))}
          </select>
        </div>

        <button
          id="add-entry-timeline-btn"
          onClick={onAddEntryClick}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
        >
          <Plus className="w-4 h-4" /> Add Clinical Entry
        </button>
      </div>

      {/* Timeline List */}
      {filteredEntries.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200 shadow-xs">
          <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
            <Clock className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No Timeline Entries Found</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            {searchQuery || selectedTypeFilter !== 'All'
              ? 'No records match your active search filter. Clear your filter to view all chronological entries.'
              : 'Continuous digital records for this patient have not been recorded yet. Click "Add Clinical Entry" to log a progress note, lab, or medication order.'}
          </p>
          {(searchQuery || selectedTypeFilter !== 'All') ? (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedTypeFilter('All');
              }}
              className="px-4 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors"
            >
              Clear Filters
            </button>
          ) : (
            <button
              onClick={onAddEntryClick}
              className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors"
            >
              Add First Clinical Entry
            </button>
          )}
        </div>
      ) : (
        <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
          {filteredEntries.map((entry, index) => {
            const badge = getEntryBadge(entry.entryType);
            const Icon = badge.icon;
            const isHighlighted = highlightedEntryId === entry.id;
            const isExpanded = expandedEntryIds[entry.id] ?? true;
            const entryDate = new Date(entry.timestamp);

            return (
              <div
                key={entry.id}
                id={`timeline-entry-${entry.id}`}
                className={`relative bg-white rounded-2xl border p-5 shadow-xs transition-all ${
                  isHighlighted
                    ? 'border-blue-500 ring-4 ring-blue-500/20 shadow-md bg-blue-50/20'
                    : 'border-slate-200/80 hover:border-slate-300'
                }`}
              >
                {/* Timeline node icon */}
                <div
                  className={`absolute -left-6 sm:-left-8 top-5 w-6 h-6 rounded-full border-2 border-white flex items-center justify-center shadow-xs ${badge.dot} text-white`}
                >
                  <span className="w-2 h-2 rounded-full bg-white" />
                </div>

                {/* Entry Header */}
                <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${badge.bg}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {entry.entryType}
                    </span>

                    {entry.isCritical && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 text-rose-600" /> Critical Alert
                      </span>
                    )}

                    <h4 className="text-sm sm:text-base font-bold text-slate-900">
                      {entry.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {entryDate.toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}{' '}
                      at{' '}
                      {entryDate.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </span>

                    {/* View Source Modal Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedSourceModalEntry(entry);
                        if (onSelectSourceEntry) onSelectSourceEntry(entry);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors"
                      title="View original clinical record"
                    >
                      <ExternalLink className="w-3 h-3" /> Source
                    </button>

                    {onDeleteEntry && (
                      <button
                        type="button"
                        onClick={() => onDeleteEntry(entry.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Author Info */}
                <div className="py-2 text-xs text-slate-500 flex items-center gap-2">
                  <span className="font-semibold text-slate-700">Documented by:</span>
                  <span>{entry.authorName}</span>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-500 italic">{entry.authorRole}</span>
                </div>

                {/* Content Body */}
                <div className="mt-2 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {entry.content}
                </div>

                {/* Structured Data: Labs */}
                {entry.structuredData?.tests && entry.structuredData.tests.length > 0 && (
                  <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                      <FlaskConical className="w-3.5 h-3.5 text-emerald-600" /> Lab Test Values
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {entry.structuredData.tests.map((t, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-white rounded-lg border border-slate-200 flex items-center justify-between text-xs"
                        >
                          <div>
                            <div className="font-semibold text-slate-800">{t.testName}</div>
                            {t.referenceRange && (
                              <div className="text-[10px] text-slate-400">Ref: {t.referenceRange}</div>
                            )}
                          </div>
                          <div className="text-right">
                            <span className="font-mono font-bold text-slate-900">
                              {t.result} {t.unit}
                            </span>
                            <div
                              className={`text-[10px] font-bold ${
                                t.status === 'Critical'
                                  ? 'text-rose-600'
                                  : t.status === 'High' || t.status === 'Low'
                                  ? 'text-amber-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {t.status}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structured Data: Medications */}
                {entry.structuredData?.medications && entry.structuredData.medications.length > 0 && (
                  <div className="mt-4 p-3.5 bg-amber-50/50 rounded-xl border border-amber-200/80 space-y-2">
                    <div className="text-xs font-bold uppercase tracking-wider text-amber-900 flex items-center gap-1.5">
                      <Pill className="w-3.5 h-3.5 text-amber-600" /> Medication Orders
                    </div>
                    <div className="space-y-1.5">
                      {entry.structuredData.medications.map((m, idx) => (
                        <div
                          key={idx}
                          className="p-2 bg-white rounded-lg border border-amber-100 flex flex-wrap items-center justify-between text-xs gap-2"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{m.name}</span>{' '}
                            <span className="text-slate-600 font-mono">({m.dose} - {m.frequency} via {m.route})</span>
                            {m.instructions && (
                              <p className="text-[11px] text-slate-500 mt-0.5">{m.instructions}</p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              m.action === 'Started'
                                ? 'bg-emerald-100 text-emerald-800'
                                : m.action === 'Modified'
                                ? 'bg-blue-100 text-blue-800'
                                : m.action === 'Discontinued'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}
                          >
                            {m.action}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Structured Data: Vitals */}
                {entry.structuredData?.vitals && (
                  <div className="mt-4 p-3 bg-rose-50/50 rounded-xl border border-rose-200/80">
                    <div className="text-xs font-bold uppercase tracking-wider text-rose-900 flex items-center gap-1.5 mb-2">
                      <HeartPulse className="w-3.5 h-3.5 text-rose-600" /> Recorded Vital Signs
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs">
                      <div className="bg-white p-2 rounded-lg border border-rose-100 text-center">
                        <span className="text-[10px] text-slate-400 block">BP</span>
                        <span className="font-bold text-slate-800 font-mono">{entry.structuredData.vitals.bp || 'N/A'}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-rose-100 text-center">
                        <span className="text-[10px] text-slate-400 block">Heart Rate</span>
                        <span className="font-bold text-slate-800 font-mono">{entry.structuredData.vitals.pulse || 'N/A'}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-rose-100 text-center">
                        <span className="text-[10px] text-slate-400 block">Temp</span>
                        <span className="font-bold text-slate-800 font-mono">{entry.structuredData.vitals.temp || 'N/A'}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-rose-100 text-center">
                        <span className="text-[10px] text-slate-400 block">SpO2</span>
                        <span className="font-bold text-slate-800 font-mono">{entry.structuredData.vitals.spo2 || 'N/A'}</span>
                      </div>
                      <div className="bg-white p-2 rounded-lg border border-rose-100 text-center">
                        <span className="text-[10px] text-slate-400 block">RR</span>
                        <span className="font-bold text-slate-800 font-mono">{entry.structuredData.vitals.rr || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Structured Data: Imaging */}
                {entry.structuredData?.imagingModality && (
                  <div className="mt-4 p-3 bg-purple-50/50 rounded-xl border border-purple-200/80 text-xs">
                    <div className="font-bold text-purple-900 flex items-center gap-1.5 mb-1">
                      <Scan className="w-3.5 h-3.5 text-purple-600" /> Modality: {entry.structuredData.imagingModality}
                    </div>
                    {entry.structuredData.impression && (
                      <p className="text-slate-700 font-medium">
                        <strong className="text-purple-900">Impression:</strong> {entry.structuredData.impression}
                      </p>
                    )}
                  </div>
                )}

                {/* Attachments */}
                {entry.attachments && entry.attachments.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                    {entry.attachments.map((att, i) => (
                      <div
                        key={i}
                        className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700"
                      >
                        <Paperclip className="w-3 h-3 text-slate-400" />
                        <span className="font-medium">{att.name}</span>
                        {att.size && <span className="text-[10px] text-slate-400">({att.size})</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* View Source Detail Modal */}
      {selectedSourceModalEntry && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-mono text-blue-400 uppercase tracking-wider">
                  Original Source Record
                </span>
                <h3 className="text-base font-bold text-white">
                  {selectedSourceModalEntry.title}
                </h3>
              </div>
              <button
                onClick={() => setSelectedSourceModalEntry(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
              >
                <ChevronDown className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto text-xs sm:text-sm">
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[11px]">Record Type:</span>
                  <span className="font-bold text-slate-800">{selectedSourceModalEntry.entryType}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Timestamp:</span>
                  <span className="font-mono text-slate-800">
                    {new Date(selectedSourceModalEntry.timestamp).toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Author / Attending:</span>
                  <span className="font-semibold text-slate-800">{selectedSourceModalEntry.authorName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Role / Department:</span>
                  <span className="text-slate-700">{selectedSourceModalEntry.authorRole}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 mb-1">Clinical Record Narrative:</h4>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-800 whitespace-pre-line leading-relaxed">
                  {selectedSourceModalEntry.content}
                </div>
              </div>

              {selectedSourceModalEntry.structuredData && Object.keys(selectedSourceModalEntry.structuredData).length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1">Structured Parameters:</h4>
                  <pre className="p-3 bg-slate-900 text-emerald-400 rounded-xl text-xs overflow-x-auto font-mono">
                    {JSON.stringify(selectedSourceModalEntry.structuredData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
            <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedSourceModalEntry(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
