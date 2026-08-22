import React, { useState } from 'react';
import {
  Sparkles,
  FileCheck2,
  Download,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  LogOut,
  X,
  Stethoscope,
  Activity,
  Volume2,
  VolumeX
} from 'lucide-react';
import { LivePatientRecord, PatientAiSummary, PatientDischargeSummary } from '../../types.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  downloadPatientMedicalSummaryPDF,
  downloadPatientDischargeSummaryPDF
} from '../../utils/pdfExport.js';
import {
  speakText,
  stopSpeaking,
  detectTextLanguage
} from '../../lib/speechUtils.js';

interface PatientSummariesTabProps {
  patient: LivePatientRecord;
  onRefreshPatient: (updated: LivePatientRecord) => void;
  initialShowDischargeModal?: boolean;
}

export const PatientSummariesTab: React.FC<PatientSummariesTabProps> = ({
  patient,
  onRefreshPatient,
  initialShowDischargeModal = false
}) => {
  const { token, user } = useAuth();

  // Summary generation states
  const [generatingSummary, setGeneratingSummary] = useState(false);
  const [summaryError, setSummaryError] = useState<string | null>(null);

  // Discharge modal states
  const [showDischargeModal, setShowDischargeModal] = useState(initialShowDischargeModal);
  const [dischargeDateTime, setDischargeDateTime] = useState(new Date().toISOString().slice(0, 16));
  const [finalDiagnosis, setFinalDiagnosis] = useState(patient.diagnoses?.[0]?.diagnosisName || '');
  const [conditionAtDischarge, setConditionAtDischarge] = useState('Clinically stable, afebrile, vital signs within normal limits.');
  const [hospitalCourse, setHospitalCourse] = useState('');
  const [dietAdvice, setDietAdvice] = useState('Balanced nutrition, adequate hydration, avoid smoking and alcohol.');
  const [followUpInstructions, setFollowUpInstructions] = useState('Follow up in Outpatient Clinic in 1 week for routine assessment.');
  const [warningSigns, setWarningSigns] = useState('High fever (>101°F), severe shortness of breath, sudden chest pain, or intractable vomiting.');
  const [generatingAiDischarge, setGeneratingAiDischarge] = useState(false);
  const [submittingDischarge, setSubmittingDischarge] = useState(false);
  const [dischargeError, setDischargeError] = useState<string | null>(null);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);

  const handleSpeakText = (id: string, text: string) => {
    if (activeSpeakingId === id) {
      stopSpeaking();
      setActiveSpeakingId(null);
      return;
    }

    stopSpeaking();
    setActiveSpeakingId(id);

    speakText(text, {
      onEnd: () => setActiveSpeakingId(null),
      onError: () => setActiveSpeakingId(null)
    });
  };

  // 1. Generate AI Clinical Medical Summary
  const handleGenerateMedicalSummary = async () => {
    try {
      setGeneratingSummary(true);
      setSummaryError(null);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/patients/${patient.id}/summary`, {
        method: 'POST',
        headers
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to synthesize medical summary.');

      onRefreshPatient(data.patient);
    } catch (err: any) {
      setSummaryError(err.message || 'Error generating clinical summary.');
    } finally {
      setGeneratingSummary(false);
    }
  };

  // 2. AI Auto-fill Discharge Summary Draft
  const handleAiAutoFillDischarge = async () => {
    try {
      setGeneratingAiDischarge(true);
      setDischargeError(null);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/patients/${patient.id}/discharge-summary`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          finalDiagnosis: finalDiagnosis || undefined,
          conditionAtDischarge: conditionAtDischarge || undefined,
          hospitalCourseSummary: hospitalCourse || undefined,
          dietAndActivityAdvice: dietAdvice || undefined,
          followUpInstructions: followUpInstructions || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to generate discharge summary.');

      if (data.dischargeSummary) {
        const ds = data.dischargeSummary;
        setFinalDiagnosis(ds.finalDiagnosis || finalDiagnosis);
        setConditionAtDischarge(ds.conditionAtDischarge || conditionAtDischarge);
        setHospitalCourse(ds.hospitalCourseSummary || hospitalCourse);
        setDietAdvice(ds.dietAndActivityAdvice || dietAdvice);
        setFollowUpInstructions(ds.followUpInstructions || followUpInstructions);
        if (ds.emergencyWarningSigns && ds.emergencyWarningSigns.length > 0) {
          setWarningSigns(ds.emergencyWarningSigns.join(', '));
        }
      }

      onRefreshPatient(data.patient);
    } catch (err: any) {
      setDischargeError(err.message || 'Error auto-generating discharge summary.');
    } finally {
      setGeneratingAiDischarge(false);
    }
  };

  // 3. Mark Discharged & Save Discharge Summary
  const handleSaveDischarge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!finalDiagnosis.trim()) {
      setDischargeError('Please specify final clinical diagnosis.');
      return;
    }

    try {
      setSubmittingDischarge(true);
      setDischargeError(null);

      const warningArray = warningSigns.split(',').map(s => s.trim()).filter(Boolean);
      const activeMedsStrings = (patient.medications || [])
        .filter(m => m.status === 'Active')
        .map(m => `${m.medicineName} ${m.strength || ''} - ${m.frequency} (${m.duration})`);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      // 1. Save discharge summary
      const summaryRes = await fetch(`/api/patients/${patient.id}/discharge-summary`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          finalDiagnosis: finalDiagnosis.trim(),
          conditionAtDischarge: conditionAtDischarge.trim(),
          hospitalCourseSummary: hospitalCourse.trim() || 'Patient managed according to clinical protocols with good response.',
          dischargeMedications: activeMedsStrings,
          dietAndActivityAdvice: dietAdvice.trim(),
          followUpInstructions: followUpInstructions.trim(),
          emergencyWarningSigns: warningArray
        })
      });

      const summaryData = await summaryRes.json();
      if (!summaryRes.ok) throw new Error(summaryData.error || 'Failed to save discharge summary.');

      // 2. Mark patient discharged
      const dischargeRes = await fetch(`/api/patients/${patient.id}/discharge`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          dischargeDateTime: dischargeDateTime ? new Date(dischargeDateTime).toISOString() : new Date().toISOString(),
          dischargeNotes: conditionAtDischarge.trim()
        })
      });

      const dischargeData = await dischargeRes.json();
      if (!dischargeRes.ok) throw new Error(dischargeData.error || 'Failed to update patient discharge status.');

      onRefreshPatient(dischargeData.patient);
      setShowDischargeModal(false);
    } catch (err: any) {
      setDischargeError(err.message || 'Error processing patient discharge.');
    } finally {
      setSubmittingDischarge(false);
    }
  };

  const latestSummary = patient.aiSummaries?.[0];
  const dischargeRecord: PatientDischargeSummary | null =
    patient.dischargeData ||
    (typeof patient.dischargeSummary === 'object' && patient.dischargeSummary !== null
      ? (patient.dischargeSummary as PatientDischargeSummary)
      : null);
  const isAdmitted = patient.status === 'Admitted';

  return (
    <div className="space-y-8">
      
      {/* 1. Official Hospital Discharge Summary Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200/80">
              <LogOut className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">Official Hospital Discharge Summary</h3>
              <p className="text-xs text-slate-500">
                Formal hospitalization discharge certificate, clinical course, medications, and follow-up guidance.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAdmitted ? (
              <button
                onClick={() => setShowDischargeModal(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white font-semibold text-xs shadow-md shadow-amber-600/20 hover:shadow-lg transition-all"
              >
                <LogOut className="w-4 h-4" />
                <span>Mark Patient Discharged & Create Summary</span>
              </button>
            ) : (
              <button
                onClick={() => setShowDischargeModal(true)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors"
              >
                <span>Edit Discharge Summary</span>
              </button>
            )}

            {dischargeRecord && (
              <button
                onClick={() => downloadPatientDischargeSummaryPDF(patient, dischargeRecord)}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Download Discharge PDF</span>
              </button>
            )}
          </div>
        </div>

        {!dischargeRecord ? (
          <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            {isAdmitted
              ? "Patient is currently Admitted. Click 'Mark Patient Discharged & Create Summary' when treatment concludes."
              : 'No formal discharge document created yet.'}
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/30 border border-slate-200 space-y-5">
            {/* Header info */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pb-4 border-b border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 font-medium block">Admission Date</span>
                <strong className="text-slate-800 text-sm">
                  {new Date(dischargeRecord.admissionDate).toLocaleDateString()}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Discharge Date</span>
                <strong className="text-emerald-700 text-sm">
                  {new Date(dischargeRecord.dischargeDate).toLocaleDateString()}
                </strong>
              </div>
              <div>
                <span className="text-slate-400 font-medium block">Discharging Physician</span>
                <strong className="text-slate-800 text-sm">{dischargeRecord.dischargedBy}</strong>
              </div>
            </div>

            {/* Final Diagnosis */}
            <div className="p-4 rounded-xl bg-blue-50/80 border border-blue-100">
              <span className="text-[10px] uppercase font-bold text-blue-700 block mb-1">
                Final Clinical Diagnosis
              </span>
              <p className="text-sm font-bold text-slate-900">{dischargeRecord.finalDiagnosis}</p>
            </div>

            {/* Condition at Discharge & Hospital Course */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Condition at Discharge</span>
                <p className="text-slate-700 leading-relaxed">{dischargeRecord.conditionAtDischarge}</p>
              </div>

              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">Hospital Course Summary</span>
                <p className="text-slate-700 leading-relaxed">{dischargeRecord.hospitalCourseSummary}</p>
              </div>
            </div>

            {/* Discharge Medications */}
            {dischargeRecord.dischargeMedications && dischargeRecord.dischargeMedications.length > 0 && (
              <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 block">
                  Discharge Medication Plan
                </span>
                <ul className="list-disc list-inside text-xs text-slate-700 space-y-1">
                  {dischargeRecord.dischargeMedications.map((m, idx) => (
                    <li key={idx}>{m}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Advice & Warning Signs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              {dischargeRecord.dietAndActivityAdvice && (
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">Diet & Activity Advice:</span>
                  <p className="text-slate-600">{dischargeRecord.dietAndActivityAdvice}</p>
                </div>
              )}
              {dischargeRecord.followUpInstructions && (
                <div className="p-3.5 rounded-xl bg-white border border-slate-200">
                  <span className="font-bold text-slate-700 block mb-1">Follow-up Consultation:</span>
                  <p className="text-slate-600">{dischargeRecord.followUpInstructions}</p>
                </div>
              )}
            </div>

            {dischargeRecord.emergencyWarningSigns && dischargeRecord.emergencyWarningSigns.length > 0 && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block uppercase text-[10px] text-rose-700">
                    Emergency Red-Flag Warnings (Seek Immediate Hospital Care):
                  </span>
                  <p className="mt-0.5">{dischargeRecord.emergencyWarningSigns.join(', ')}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 2. AI Synthesized Medical Summary Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-blue-100 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200/80">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 leading-tight">
                AI Clinical Medical Summary
              </h3>
              <p className="text-xs text-slate-500">
                Synthesized exclusively from this patient's actual recorded labs, vitals, medications, and notes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleGenerateMedicalSummary}
              disabled={generatingSummary}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg disabled:opacity-50 transition-all"
            >
              {generatingSummary ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Synthesizing from Records...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-blue-200" />
                  <span>{latestSummary ? 'Re-Generate Medical Summary' : 'Generate Medical Summary'}</span>
                </>
              )}
            </button>

            {latestSummary && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    const text = `Medical Summary for ${patient.patientName}. Overview: ${latestSummary.overview || latestSummary.overallHealthStatus}. Key findings: ${Array.isArray(latestSummary.keyFindings) ? latestSummary.keyFindings.join('. ') : latestSummary.keyFindings}. Active Treatment: ${latestSummary.activeTreatmentStatus || ''}`;
                    handleSpeakText('medical_summary', text);
                  }}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-semibold text-xs border transition-colors ${
                    activeSpeakingId === 'medical_summary'
                      ? 'bg-indigo-600 text-white border-indigo-600 animate-pulse'
                      : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                  }`}
                  title="Listen to medical summary in natural language voice"
                >
                  {activeSpeakingId === 'medical_summary' ? (
                    <>
                      <VolumeX className="w-4 h-4" />
                      <span>Stop Reading</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4" />
                      <span>Listen to Summary</span>
                    </>
                  )}
                </button>

                <button
                  onClick={() => downloadPatientMedicalSummaryPDF(patient, latestSummary)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs border border-blue-200 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
              </>
            )}
          </div>
        </div>

        {summaryError && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{summaryError}</span>
          </div>
        )}

        {!latestSummary ? (
          <div className="p-8 text-center bg-slate-50/80 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-500">
            Click 'Generate Medical Summary' to create an AI-synthesized clinical overview grounded in this patient's actual verified data.
          </div>
        ) : (
          <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 space-y-5">
            <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-200">
              <span className="text-slate-500">
                Generated: {new Date(latestSummary.generatedAt).toLocaleString()}
              </span>
              <span className="font-semibold text-blue-700">
                Model: {latestSummary.modelUsed || 'Gemini Clinical AI'}
              </span>
            </div>

            {/* Executive Overview */}
            <div className="space-y-1.5">
              <span className="text-[11px] uppercase font-bold text-blue-700 tracking-wider">
                Executive Clinical Overview
              </span>
              <p className="text-xs text-slate-800 leading-relaxed bg-white p-4 rounded-xl border border-slate-200">
                {latestSummary.overview || latestSummary.overallHealthStatus}
              </p>
            </div>

            {/* Key Findings */}
            {latestSummary.keyFindings && (
              <div className="space-y-1.5">
                <span className="text-[11px] uppercase font-bold text-slate-700 tracking-wider">
                  Key Diagnostic & Clinical Findings
                </span>
                {Array.isArray(latestSummary.keyFindings) ? (
                  <ul className="list-disc list-inside text-xs text-slate-700 bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                    {latestSummary.keyFindings.map((kf, i) => (
                      <li key={i}>{kf}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-xs text-slate-700 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed whitespace-pre-wrap">
                    {latestSummary.keyFindings}
                  </p>
                )}
              </div>
            )}

            {/* Vitals & Lab Trends */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {latestSummary.vitalTrends && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700 block">Vitals Trajectory:</span>
                  <p className="text-slate-600 leading-relaxed">{latestSummary.vitalTrends}</p>
                </div>
              )}
              {latestSummary.labFindingsSummary && (
                <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-1">
                  <span className="font-bold text-slate-700 block">Laboratory Findings:</span>
                  <p className="text-slate-600 leading-relaxed">{latestSummary.labFindingsSummary}</p>
                </div>
              )}
            </div>

            {/* Treatment Status */}
            {latestSummary.activeTreatmentStatus && (
              <div className="bg-white p-4 rounded-xl border border-slate-200 text-xs space-y-1">
                <span className="font-bold text-slate-700 block">Active Treatment & Medication Response:</span>
                <p className="text-slate-600 leading-relaxed">{latestSummary.activeTreatmentStatus}</p>
              </div>
            )}

            {/* Clinical Recommendations */}
            {latestSummary.clinicalRecommendations && latestSummary.clinicalRecommendations.length > 0 && (
              <div className="bg-white p-4 rounded-xl border border-blue-200 text-xs space-y-2">
                <span className="font-bold text-blue-800 block uppercase text-[10px]">
                  Clinical Recommendations & Care Plan:
                </span>
                <ul className="list-disc list-inside text-slate-700 space-y-1">
                  {latestSummary.clinicalRecommendations.map((rec, i) => (
                    <li key={i}>{rec}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Critical Alerts */}
            {latestSummary.criticalAlerts && latestSummary.criticalAlerts.length > 0 && (
              <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-xs space-y-1 text-rose-900">
                <span className="font-bold text-rose-800 block uppercase text-[10px]">
                  Red-Flag Clinical Alerts:
                </span>
                <ul className="list-disc list-inside space-y-1">
                  {latestSummary.criticalAlerts.map((ca, i) => (
                    <li key={i}>{ca}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hospital Discharge Modal */}
      {showDischargeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] border border-blue-100 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            
            <div className="px-6 py-4 bg-gradient-to-r from-amber-600 to-indigo-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <LogOut className="w-5 h-5 text-amber-200" />
                <div>
                  <h3 className="font-bold text-base text-white">Hospital Discharge Protocol</h3>
                  <p className="text-xs text-amber-100/80">Patient: {patient.patientName} ({patient.uhid})</p>
                </div>
              </div>
              <button
                onClick={() => setShowDischargeModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveDischarge} className="p-6 overflow-y-auto space-y-4 flex-1">
              {dischargeError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs">
                  {dischargeError}
                </div>
              )}

              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs text-slate-500">
                  Fill in clinical discharge summary details or let AI generate from existing logs.
                </span>
                <button
                  type="button"
                  onClick={handleAiAutoFillDischarge}
                  disabled={generatingAiDischarge}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline disabled:opacity-50"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{generatingAiDischarge ? 'Generating...' : 'AI Auto-Fill Draft'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Discharge Date & Time <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="datetime-local"
                    required
                    value={dischargeDateTime}
                    onChange={e => setDischargeDateTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Final Clinical Diagnosis <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Acute Bronchitis - Resolved"
                    value={finalDiagnosis}
                    onChange={e => setFinalDiagnosis(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Condition at Discharge</label>
                <input
                  type="text"
                  placeholder="e.g. Afebrile, stable vitals, ambulatory without distress."
                  value={conditionAtDischarge}
                  onChange={e => setConditionAtDischarge(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Hospital Course Summary</label>
                <textarea
                  rows={3}
                  placeholder="e.g. Admitted with productive cough and fever. Commenced on IV/Oral antibiotics and bronchodilators. Vitals stabilized by Day 2. Blood counts normalized."
                  value={hospitalCourse}
                  onChange={e => setHospitalCourse(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Diet & Activity Advice</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Normal diet, rest for 3 days, drink warm fluids."
                    value={dietAdvice}
                    onChange={e => setDietAdvice(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Follow-up Instructions</label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Review in OPD in 7 days with repeat CBC."
                    value={followUpInstructions}
                    onChange={e => setFollowUpInstructions(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Emergency Warning Signs (comma separated)</label>
                <input
                  type="text"
                  placeholder="High fever, breathing difficulty, chest pain, hemoptysis"
                  value={warningSigns}
                  onChange={e => setWarningSigns(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowDischargeModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingDischarge}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50"
                >
                  {submittingDischarge ? 'Processing Discharge...' : 'Save & Mark Discharged'}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
};
