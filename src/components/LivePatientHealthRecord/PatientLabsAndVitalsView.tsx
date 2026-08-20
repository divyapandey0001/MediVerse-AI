import React, { useState } from 'react';
import {
  FlaskConical,
  HeartPulse,
  Plus,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Clock,
  Activity,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { PatientTimelineEntry, StructuredLabItem, StructuredVitals, LivePatientRecord } from '../../types.js';

interface PatientLabsAndVitalsViewProps {
  patient: LivePatientRecord;
  entries: PatientTimelineEntry[];
  onOpenAddEntryModal: (defaultType?: string) => void;
}

export const PatientLabsAndVitalsView: React.FC<PatientLabsAndVitalsViewProps> = ({
  patient,
  entries,
  onOpenAddEntryModal
}) => {
  const [labSearch, setLabSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'All' | 'Abnormal' | 'Normal'>('All');

  // Collect all extracted and recorded lab tests across timeline
  const allLabTests: Array<{
    test: StructuredLabItem;
    entryTitle: string;
    timestamp: string;
    author: string;
  }> = [];

  // Collect all vital recordings
  const allVitals: Array<{
    vitals: StructuredVitals;
    timestamp: string;
    entryTitle: string;
    author: string;
  }> = [];

  // Add initial vitals if present
  if (patient.initialVitals) {
    allVitals.push({
      vitals: {
        bp: patient.initialVitals.bloodPressure,
        pulse: patient.initialVitals.heartRate,
        temp: patient.initialVitals.temperature,
        spo2: patient.initialVitals.spO2,
        rr: patient.initialVitals.respiratoryRate
      },
      timestamp: patient.admissionDateTime,
      entryTitle: 'Baseline Admission Vitals',
      author: patient.attendingDoctor
    });
  }

  entries.forEach(entry => {
    if (entry.structuredData?.tests && entry.structuredData.tests.length > 0) {
      entry.structuredData.tests.forEach(test => {
        allLabTests.push({
          test,
          entryTitle: entry.title,
          timestamp: entry.timestamp,
          author: entry.authorName
        });
      });
    }

    if (entry.structuredData?.vitals) {
      allVitals.push({
        vitals: entry.structuredData.vitals,
        timestamp: entry.timestamp,
        entryTitle: entry.title,
        author: entry.authorName
      });
    }
  });

  const filteredLabTests = allLabTests.filter(({ test }) => {
    const q = labSearch.toLowerCase().trim();
    const matchesSearch = !q || test.testName.toLowerCase().includes(q) || test.unit.toLowerCase().includes(q);

    const isAbnormal = test.status === 'High' || test.status === 'Low' || test.status === 'Critical' || (test.status as any) === 'Needs Attention';
    const matchesStatus =
      statusFilter === 'All' ||
      (statusFilter === 'Abnormal' && isAbnormal) ||
      (statusFilter === 'Normal' && test.status === 'Normal');

    return matchesSearch && matchesStatus;
  });

  return (
    <div id="patient-labs-vitals-view" className="space-y-6">
      {/* 1. Laboratory Results Table Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 uppercase tracking-wider mb-0.5">
              <FlaskConical className="w-4 h-4" /> Comprehensive Pathology & Diagnostic Results
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Laboratory Test Results ({allLabTests.length} Total Parameters)
            </h3>
            <p className="text-xs text-slate-500">
              Extracted from uploaded diagnostic reports and recorded clinical lab panels.
            </p>
          </div>

          <button
            onClick={() => onOpenAddEntryModal('Lab Result')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Record Lab Result
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search test parameters (e.g. Hemoglobin, Creatinine, WBC)..."
              value={labSearch}
              onChange={e => setLabSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:bg-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('All')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'All'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All ({allLabTests.length})
            </button>
            <button
              onClick={() => setStatusFilter('Abnormal')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'Abnormal'
                  ? 'bg-rose-600 text-white'
                  : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
              }`}
            >
              Abnormal Values
            </button>
            <button
              onClick={() => setStatusFilter('Normal')}
              className={`px-3 py-1 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                statusFilter === 'Normal'
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              }`}
            >
              Normal Values
            </button>
          </div>
        </div>

        {/* Labs Table */}
        {allLabTests.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 space-y-2">
            <FlaskConical className="w-8 h-8 mx-auto text-slate-300" />
            <p className="font-bold text-slate-700">No laboratory test records found yet.</p>
            <p className="text-slate-400">
              Upload a lab PDF report or click "Record Lab Result" to add structured test findings.
            </p>
          </div>
        ) : filteredLabTests.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400">
            No lab tests matching your search or filter.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Test Parameter</th>
                  <th className="py-2.5 px-4">Result Value</th>
                  <th className="py-2.5 px-4">Reference Range</th>
                  <th className="py-2.5 px-4">Evaluation</th>
                  <th className="py-2.5 px-4">Date Documented</th>
                  <th className="py-2.5 px-4">Source Record</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLabTests.map(({ test, entryTitle, timestamp, author }, idx) => {
                  const isAbnormal =
                    test.status === 'High' ||
                    test.status === 'Low' ||
                    test.status === 'Critical' ||
                    (test.status as any) === 'Needs Attention';

                  return (
                    <tr
                      key={idx}
                      className={isAbnormal ? 'bg-rose-50/30 hover:bg-rose-50/60' : 'hover:bg-slate-50/80'}
                    >
                      <td className="py-2.5 px-4 font-bold text-slate-900">{test.testName}</td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                        {test.result} <span className="text-slate-500 font-normal">{test.unit}</span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                        {test.referenceRange || '—'}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`px-2 py-0.5 rounded font-bold text-[10px] inline-flex items-center gap-1 ${
                            test.status === 'Normal'
                              ? 'bg-emerald-100 text-emerald-800'
                              : test.status === 'High'
                              ? 'bg-rose-100 text-rose-800'
                              : test.status === 'Low'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {test.status === 'High' && <ArrowUpRight className="w-3 h-3" />}
                          {test.status === 'Low' && <ArrowDownRight className="w-3 h-3" />}
                          {test.status || 'Normal'}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 text-[11px]">
                        {new Date(timestamp).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 text-[11px] truncate max-w-xs">
                        {entryTitle}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 2. Vital Signs Monitoring Log Section */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-rose-600 uppercase tracking-wider mb-0.5">
              <HeartPulse className="w-4 h-4" /> Inpatient Vital Signs Monitoring
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              Vital Signs History ({allVitals.length} Recorded Readings)
            </h3>
          </div>

          <button
            onClick={() => onOpenAddEntryModal('Nursing Note / Vitals')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Log Vitals
          </button>
        </div>

        {allVitals.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400">
            No vital signs documented yet.
          </div>
        ) : (
          <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 text-[11px]">
                <tr>
                  <th className="py-2.5 px-4">Date & Time</th>
                  <th className="py-2.5 px-4">Blood Pressure</th>
                  <th className="py-2.5 px-4">Heart Rate</th>
                  <th className="py-2.5 px-4">Temperature</th>
                  <th className="py-2.5 px-4">SpO2 Oxygen</th>
                  <th className="py-2.5 px-4">Resp Rate</th>
                  <th className="py-2.5 px-4">Recorded By / Note</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {allVitals.map(({ vitals, timestamp, entryTitle, author }, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80">
                    <td className="py-2.5 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {new Date(timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-slate-900">
                      {vitals.bp || '—'}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                      {vitals.pulse || '—'}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                      {vitals.temp || '—'}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-bold text-blue-700">
                      {vitals.spo2 || '—'}
                    </td>
                    <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                      {vitals.rr || '—'}
                    </td>
                    <td className="py-2.5 px-4 text-slate-500 text-[11px] truncate max-w-xs">
                      {author} ({entryTitle})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
