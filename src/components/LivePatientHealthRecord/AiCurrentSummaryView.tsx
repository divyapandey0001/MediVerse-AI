import React, { useState } from 'react';
import {
  Sparkles,
  RefreshCw,
  Clock,
  AlertTriangle,
  FileCheck2,
  FileText,
  FlaskConical,
  Scan,
  Pill,
  HeartPulse,
  Stethoscope,
  Info,
  ExternalLink,
  Printer,
  Copy,
  Check,
  Download,
  ShieldAlert,
  HelpCircle,
  Activity,
  History,
  AlertCircle
} from 'lucide-react';
import { LivePatientRecord, LivePatientAiSummary, PatientTimelineEntry } from '../../types.js';

interface AiCurrentSummaryViewProps {
  patient: LivePatientRecord;
  summary: LivePatientAiSummary | null;
  entriesCount: number;
  isGenerating: boolean;
  onRefreshSummary: () => void;
  onJumpToTimelineEntry?: (sourceDateOrText: string) => void;
}

export const AiCurrentSummaryView: React.FC<AiCurrentSummaryViewProps> = ({
  patient,
  summary,
  entriesCount,
  isGenerating,
  onRefreshSummary,
  onJumpToTimelineEntry
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopySummary = () => {
    if (!summary) return;
    const textToCopy = `MEDIVERSE - LIVE PATIENT AI CURRENT SUMMARY
Patient: ${patient.patientName} (UHID: ${patient.uhid})
Age/Gender: ${patient.patientAge}yo ${patient.patientGender} | Blood Group: ${patient.bloodGroup}
Admitted: ${new Date(patient.admissionDateTime).toLocaleString()} | Dept: ${patient.department} | Doctor: ${patient.attendingDoctor}
Bed/Room: ${patient.bedRoomNo} | Status: ${patient.status}
Generated: ${new Date(summary.generatedAt).toLocaleString()}

--- 1. REASON FOR ADMISSION ---
${summary.reasonForAdmission.statement} (Sources: ${summary.reasonForAdmission.sources.join(', ')})

--- 2. RELEVANT HISTORY ---
${summary.relevantHistory.statement}

--- 3. DOCUMENTED DIAGNOSES ---
${summary.documentedDiagnoses.map(d => `• [${d.type}] ${d.diagnosis} (${d.status}) - Source: ${d.sourceRecord}`).join('\n')}

--- 4. CURRENT TREATMENT & MEDICATIONS ---
Treatment: ${summary.currentTreatment.map(t => `${t.treatment}: ${t.details}`).join('; ')}
Active Medications:
${summary.currentMedications.map(m => `• ${m.name} ${m.dosage} ${m.frequency} via ${m.route} [${m.status}] - Source: ${m.sourceRecord}`).join('\n')}

--- 5. MEDICATION CHANGES ---
${summary.medicationChanges.map(c => `• ${c.medicine}: ${c.changeType} (${c.reason || 'Clinical adjustment'}) [${c.sourceDate}]`).join('\n')}

--- 6. CURRENT DOCUMENTED STATUS ---
Condition: ${summary.currentDocumentedStatus.clinicalCondition}
Vitals: ${summary.currentDocumentedStatus.vitalTrends}

--- 7. IMPORTANT INVESTIGATION FINDINGS ---
${summary.importantInvestigationFindings.map(f => `• [${f.category} - ${f.status}] ${f.finding} - Source: ${f.sourceRecord}`).join('\n')}

--- 8. SECOND-OPINION BRIEF ---
${summary.secondOpinionBrief.synthesis}
Key Considerations:
${summary.secondOpinionBrief.keyConsiderations.map(k => `• ${k}`).join('\n')}

--- 9. MISSING / CONFLICTING INFORMATION ---
${summary.missingOrConflictingInformation.map(m => `• [${m.issueType}] ${m.description} ${m.flaggedForHumanReview ? '(FLAGGED FOR HUMAN REVIEW)' : ''}`).join('\n')}

DISCLAIMER: ${summary.disclaimer}`;

    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleDownloadSummary = () => {
    if (!summary) return;
    const textContent = `# MEDIVERSE AI CURRENT CLINICAL SUMMARY
**Patient Name:** ${patient.patientName}  
**UHID / Record ID:** ${patient.uhid}  
**Demographics:** ${patient.patientAge} Years | ${patient.patientGender} | Blood Group: ${patient.bloodGroup || 'N/A'}  
**Department:** ${patient.department} | **Attending Physician:** ${patient.attendingDoctor}  
**Admitted On:** ${new Date(patient.admissionDateTime).toLocaleString()}  
**Status:** ${patient.status}  
**Generated At:** ${new Date(summary.generatedAt).toLocaleString()}  

---

## 1. Reason for Admission
${summary.reasonForAdmission.statement}  
*Sources:* ${summary.reasonForAdmission.sources.join(', ')}

## 2. Relevant History
${summary.relevantHistory.statement}

## 3. Documented Diagnoses
${summary.documentedDiagnoses.map(d => `- **[${d.type}]** ${d.diagnosis} (${d.status}) — *Source: ${d.sourceRecord}*`).join('\n')}

## 4. Current Treatment & Medications
**Active Treatments:**  
${summary.currentTreatment.map(t => `- **${t.treatment}:** ${t.details}`).join('\n')}

**Current Medications:**  
${summary.currentMedications.map(m => `- **${m.name}** ${m.dosage} ${m.frequency} via ${m.route} [${m.status}] — *Source: ${m.sourceRecord}*`).join('\n')}

## 5. Chronological Medication Changes
${summary.medicationChanges.map(c => `- **${c.medicine}:** ${c.changeType} (${c.reason || 'Regimen change'}) [${c.sourceDate}]`).join('\n')}

## 6. Current Documented Status
- **Clinical Condition:** ${summary.currentDocumentedStatus.clinicalCondition}
- **Vital Signs Trends:** ${summary.currentDocumentedStatus.vitalTrends}

## 7. Important Investigation & Lab Findings
${summary.importantInvestigationFindings.map(f => `- **[${f.category} - ${f.status}]** ${f.finding} — *Source: ${f.sourceRecord}*`).join('\n')}

## 8. Second-Opinion & Clinical Synthesis Brief
${summary.secondOpinionBrief.synthesis}

**Key Considerations:**  
${summary.secondOpinionBrief.keyConsiderations.map(k => `- ${k}`).join('\n')}

## 9. Missing / Conflicting Information & Flags
${summary.missingOrConflictingInformation.map(m => `- **[${m.issueType}]** ${m.description} ${m.flaggedForHumanReview ? '*(FLAGGED FOR CLINICIAN REVIEW)*' : ''}`).join('\n')}

---
*Disclaimer:* ${summary.disclaimer}
`;

    const blob = new Blob([textContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `AI_Clinical_Summary_${patient.uhid}_${new Date().toISOString().slice(0, 10)}.md`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = () => {
    if (patient.summaryStatus === 'Up to Date') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
          <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
          AI Summary Up to Date
        </span>
      );
    }
    if (patient.summaryStatus === 'Updated information available') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 text-xs font-bold rounded-full border border-amber-200 animate-pulse">
          <RefreshCw className="w-3.5 h-3.5 text-amber-600 animate-spin" />
          New clinical entries recorded (Refresh Summary)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 text-xs font-bold rounded-full border border-slate-300">
        <Sparkles className="w-3.5 h-3.5 text-blue-600" />
        Summary Ready to Generate
      </span>
    );
  };

  return (
    <div id="ai-current-summary-container" className="space-y-6">
      {/* Top Banner & Refresh Controls */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-5 sm:p-6 rounded-3xl shadow-lg border border-indigo-900/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-blue-500/20 text-blue-400 rounded-lg">
                <Sparkles className="w-5 h-5" />
              </span>
              <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                Live AI Current Summary
              </h3>
              {getStatusBadge()}
            </div>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Analyzes all {entriesCount} chronological patient timeline records into a clinical summary with source attribution.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            {summary && (
              <>
                <button
                  type="button"
                  onClick={handleCopySummary}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                  title="Copy formatted clinical summary"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  type="button"
                  onClick={handleDownloadSummary}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                  title="Download clinical summary as Markdown / Document"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-200 bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                  title="Print summary"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
              </>
            )}

            <button
              id="refresh-ai-summary-btn"
              type="button"
              onClick={onRefreshSummary}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/25 transition-all disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
              {isGenerating ? 'Synthesizing Records...' : summary ? 'Refresh AI Summary' : 'Generate AI Summary'}
            </button>
          </div>
        </div>

        {summary && (
          <div className="mt-4 pt-3 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400 font-mono">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> Last AI Synthesis:{' '}
              <strong className="text-slate-200 font-sans">{new Date(summary.generatedAt).toLocaleString()}</strong>
            </span>
            <span className="text-slate-400 font-sans">
              UHID: <strong className="text-blue-300 font-mono">{summary.uhid}</strong>
            </span>
          </div>
        )}
      </div>

      {/* Mandatory Clinical Disclaimer Banner */}
      <div className="p-4 bg-amber-50/90 border border-amber-300/80 rounded-2xl flex items-start gap-3 text-amber-900 shadow-2xs">
        <ShieldAlert className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <strong className="font-bold text-amber-950 block mb-0.5">Clinical Decision Support Notice:</strong>
          This system is an AI-assisted clinical documentation and summarization aid synthesized directly from hospital staff entries. It does not replace clinical judgment. Final diagnostic, pharmacological, and treatment decisions remain solely with qualified healthcare professionals.
        </div>
      </div>

      {!summary ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-bold text-slate-900">No AI Summary Generated Yet</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1 mb-6">
              Generate an up-to-date synthesized overview of this patient's admission history, investigation findings, diagnoses, medication changes, alerts, and second-opinion considerations.
            </p>
            <button
              onClick={onRefreshSummary}
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-6 py-3 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md transition-all disabled:opacity-60 cursor-pointer"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'Generating Summary...' : 'Generate AI Current Summary Now'}
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Missing / Conflicting Information Flags (Critical Alert Box) */}
          {summary.missingOrConflictingInformation && summary.missingOrConflictingInformation.length > 0 && (
            <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-5 shadow-xs">
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-5 h-5 text-rose-600" />
                <h4 className="text-sm font-bold text-rose-950 uppercase tracking-wide">
                  Documentation Review & Potential Conflict Flags
                </h4>
              </div>
              <div className="space-y-2">
                {summary.missingOrConflictingInformation.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-white rounded-xl border border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                  >
                    <div>
                      <span className="font-bold text-rose-900">[{item.issueType}]</span>{' '}
                      <span className="text-slate-800">{item.description}</span>
                      {item.recordsInvolved && item.recordsInvolved.length > 0 && (
                        <div className="text-[11px] text-slate-500 mt-0.5">
                          Sources involved: {item.recordsInvolved.join(', ')}
                        </div>
                      )}
                    </div>
                    {item.flaggedForHumanReview && (
                      <span className="px-2.5 py-1 bg-rose-100 text-rose-800 font-bold rounded-lg text-[11px] shrink-0">
                        Flagged for Clinician Review
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 1 & 2: Admission & Relevant History */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Reason for Admission */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Stethoscope className="w-4 h-4 text-blue-600" /> 1. Reason for Admission
                </h4>
                {summary.reasonForAdmission.sources && (
                  <span className="text-[11px] font-mono text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                    Source: {summary.reasonForAdmission.sources.join(', ')}
                  </span>
                )}
              </div>
              <p className="text-sm font-semibold text-slate-900 leading-relaxed">
                {summary.reasonForAdmission.statement || 'Not documented'}
              </p>
            </div>

            {/* Relevant History */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-indigo-600" /> 2. Relevant History & Demographics
                </h4>
                {summary.relevantHistory.sources && (
                  <span className="text-[11px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                    Source: {summary.relevantHistory.sources.join(', ')}
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-800 leading-relaxed">
                {summary.relevantHistory.statement || 'Not documented'}
              </p>
            </div>
          </div>

          {/* Section 3: Documented Diagnoses / Clinical Impressions */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-blue-600" /> 3. Documented Diagnoses & Clinical Impressions
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {summary.documentedDiagnoses.length === 0 ? (
                <p className="text-xs text-slate-400 italic">Not documented</p>
              ) : (
                summary.documentedDiagnoses.map((diag, idx) => (
                  <div key={idx} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 font-bold rounded text-[10px]">
                        {diag.type}
                      </span>
                      <span
                        className={`text-[10px] font-bold ${
                          diag.status === 'Active'
                            ? 'text-emerald-700'
                            : diag.status === 'Resolved'
                            ? 'text-slate-500'
                            : 'text-amber-700'
                        }`}
                      >
                        {diag.status}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">{diag.diagnosis}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Source: {diag.sourceRecord}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Section 4: Current Status & Vitals Trends */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <HeartPulse className="w-4 h-4 text-rose-600" /> 4. Current Documented Status & Vital Trends
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[11px] font-bold uppercase text-slate-500 block mb-1">
                  Clinical Condition
                </span>
                <p className="text-sm text-slate-800 leading-relaxed font-medium">
                  {summary.currentDocumentedStatus.clinicalCondition || 'Not documented'}
                </p>
              </div>
              <div className="p-4 bg-rose-50/50 rounded-xl border border-rose-200">
                <span className="text-[11px] font-bold uppercase text-rose-800 block mb-1">
                  Vital Signs Parameters & Trends
                </span>
                <p className="text-sm text-slate-800 leading-relaxed font-mono font-medium">
                  {summary.currentDocumentedStatus.vitalTrends || 'Not documented'}
                </p>
              </div>
            </div>
            {summary.currentDocumentedStatus.sources && summary.currentDocumentedStatus.sources.length > 0 && (
              <div className="text-[11px] text-slate-500 font-mono">
                Cited Sources: {summary.currentDocumentedStatus.sources.join(' • ')}
              </div>
            )}
          </div>

          {/* Section 5: Current Treatment & Active Medications */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Active Medications */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-amber-600" /> 5. Current Active Medications
                </h4>
                <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-0.5 rounded-full">
                  {summary.currentMedications.length} Prescribed
                </span>
              </div>
              {summary.currentMedications.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">Not documented</p>
              ) : (
                <div className="space-y-2">
                  {summary.currentMedications.map((m, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900">{m.name}</div>
                        <div className="text-slate-600 font-mono">
                          {m.dosage} • {m.frequency} • {m.route}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">Source: {m.sourceRecord}</div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          m.status === 'New'
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.status === 'Changed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Medication Changes History */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-indigo-600" /> 6. Tracked Medication Changes
              </h4>
              {summary.medicationChanges.length === 0 ? (
                <p className="text-xs text-slate-400 italic p-3 bg-slate-50 rounded-xl">
                  No medication modifications recorded during current admission.
                </p>
              ) : (
                <div className="space-y-2">
                  {summary.medicationChanges.map((c, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-indigo-50/40 rounded-xl border border-indigo-100 text-xs space-y-1"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-slate-900">{c.medicine}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.changeType === 'Initiated'
                              ? 'bg-emerald-100 text-emerald-800'
                              : c.changeType === 'Discontinued'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {c.changeType}
                        </span>
                      </div>
                      {c.reason && <p className="text-slate-600 text-[11px]">{c.reason}</p>}
                      <div className="text-[10px] text-slate-400 font-mono">
                        {c.sourceDate} • {c.sourceRecord}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Section 6: Important Investigation Findings */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FlaskConical className="w-4 h-4 text-emerald-600" /> 7. Important Investigation Findings (Labs & Imaging)
            </h4>
            {summary.importantInvestigationFindings.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Not documented</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {summary.importantInvestigationFindings.map((f, idx) => (
                  <div
                    key={idx}
                    className={`p-3.5 rounded-xl border text-xs space-y-1.5 ${
                      f.status === 'Critical'
                        ? 'bg-rose-50/70 border-rose-200'
                        : f.status === 'Abnormal'
                        ? 'bg-amber-50/60 border-amber-200'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-700 uppercase text-[10px]">{f.category}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          f.status === 'Critical'
                            ? 'bg-rose-600 text-white'
                            : f.status === 'Abnormal'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {f.status}
                      </span>
                    </div>
                    <div className="font-semibold text-slate-900">{f.finding}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      {f.sourceDate} • {f.sourceRecord}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 7: Clinical Milestones Timeline Overview */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-purple-600" /> 8. Synthesized Clinical Timeline Milestones
            </h4>
            <div className="space-y-2">
              {summary.clinicalTimeline.map((item, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 hover:bg-blue-50/40 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors"
                >
                  <div>
                    <span className="font-bold text-slate-900 font-mono text-[11px] block sm:inline sm:mr-2">
                      [{item.timeframe}]
                    </span>
                    <span className="text-slate-800 font-medium">{item.milestone}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono shrink-0">
                    Source: {item.sourceRecord}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Section 8: Second-Opinion Clinical Brief */}
          <div className="bg-gradient-to-br from-indigo-50/80 to-blue-50/60 p-5 rounded-2xl border border-indigo-200/80 shadow-xs space-y-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-indigo-600 text-white rounded-lg">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-indigo-950">9. Second-Opinion Clinical Synthesis Brief</h4>
                <p className="text-xs text-indigo-700">AI-assisted clinical overview and questions for attending team review</p>
              </div>
            </div>

            <div className="p-3.5 bg-white rounded-xl border border-indigo-100 text-xs sm:text-sm text-slate-800 leading-relaxed font-medium">
              {summary.secondOpinionBrief.synthesis}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 bg-white rounded-xl border border-indigo-100 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                  Key Clinical Considerations
                </span>
                <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                  {summary.secondOpinionBrief.keyConsiderations.map((c, i) => (
                    <li key={i}>{c}</li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 bg-white rounded-xl border border-indigo-100 space-y-1.5">
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 block">
                  Suggested Attending Questions
                </span>
                <ul className="text-xs text-slate-700 space-y-1 list-disc pl-4">
                  {summary.secondOpinionBrief.suggestedClinicalQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom Disclaimer */}
          <div className="p-4 bg-slate-100 border border-slate-200 rounded-2xl text-[11px] text-slate-500 text-center">
            {summary.disclaimer}
          </div>
        </div>
      )}
    </div>
  );
};
