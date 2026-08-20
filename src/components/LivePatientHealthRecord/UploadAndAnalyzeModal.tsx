import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Sparkles,
  FileText,
  FlaskConical,
  Scan,
  Pill,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  Paperclip,
  Eye,
  Trash2,
  Calendar,
  User,
  ShieldCheck
} from 'lucide-react';
import { PatientTimelineEntry, LabReportAnalysis, TimelineEntryType } from '../../types.js';

interface UploadAndAnalyzeModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientRecordId: string;
  uhid: string;
  patientName: string;
  defaultAuthorName?: string;
  onEntryAdded: (newEntry: PatientTimelineEntry) => void;
  onRefreshSummaryRequested?: () => void;
}

export const UploadAndAnalyzeModal: React.FC<UploadAndAnalyzeModalProps> = ({
  isOpen,
  onClose,
  patientRecordId,
  uhid,
  patientName,
  defaultAuthorName = 'Dr. Staff, MD',
  onEntryAdded,
  onRefreshSummaryRequested
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [base64Data, setBase64Data] = useState<string>('');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [documentCategory, setDocumentCategory] = useState<TimelineEntryType>('Lab Result');
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [authorRole, setAuthorRole] = useState('Attending Physician / Diagnostics Staff');

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<LabReportAnalysis | null>(null);
  const [createdEntry, setCreatedEntry] = useState<PatientTimelineEntry | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileSelect = (selectedFile: File) => {
    setErrorMessage(null);
    setAnalysisResult(null);
    setCreatedEntry(null);
    setSuccessMessage(null);

    // Validate type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(selectedFile.type)) {
      setErrorMessage('Please upload a PDF document or image file (JPG, PNG, WEBP).');
      return;
    }

    // Max 15MB
    if (selectedFile.size > 15 * 1024 * 1024) {
      setErrorMessage('File size exceeds 15MB limit. Please upload a smaller document.');
      return;
    }

    setFile(selectedFile);

    // Auto-detect initial category
    if (selectedFile.name.toLowerCase().includes('xray') || selectedFile.name.toLowerCase().includes('mri') || selectedFile.name.toLowerCase().includes('ct') || selectedFile.name.toLowerCase().includes('ultrasound') || selectedFile.name.toLowerCase().includes('scan')) {
      setDocumentCategory('Imaging / Radiology Report');
    } else if (selectedFile.name.toLowerCase().includes('prescription') || selectedFile.name.toLowerCase().includes('rx')) {
      setDocumentCategory('Prescription');
    } else if (selectedFile.name.toLowerCase().includes('discharge')) {
      setDocumentCategory('Discharge Information');
    } else {
      setDocumentCategory('Lab Result');
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBase64Data(result);
      if (selectedFile.type.startsWith('image/')) {
        setPreviewUrl(result);
      } else {
        setPreviewUrl(null);
      }
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyzeAndSave = async () => {
    if (!file || !base64Data) {
      setErrorMessage('Please select a medical document to upload.');
      return;
    }

    try {
      setIsAnalyzing(true);
      setErrorMessage(null);

      // Clean base64 string for API
      const base64Content = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;

      const res = await fetch(`/api/live-records/${patientRecordId}/upload-and-analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          base64Data: base64Content,
          mimeType: file.type,
          fileName: file.name,
          fileSize: file.size,
          documentCategory,
          authorName: authorName.trim() || 'AI Diagnostics & OCR System',
          authorRole: authorRole.trim() || 'Clinical Diagnostics Staff'
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze and save medical file.');
      }

      setAnalysisResult(data.analysis);
      setCreatedEntry(data.entry);
      setSuccessMessage(`Document successfully analyzed with AI and saved to ${patientName}'s timeline!`);

      if (data.entry) {
        onEntryAdded(data.entry);
      }

      if (onRefreshSummaryRequested) {
        onRefreshSummaryRequested();
      }
    } catch (err: any) {
      console.error('Error analyzing medical report:', err);
      setErrorMessage(err.message || 'An error occurred while analyzing the document.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setBase64Data('');
    setPreviewUrl(null);
    setAnalysisResult(null);
    setCreatedEntry(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div id="upload-and-analyze-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Upload & AI Analyze Medical Document
              </h3>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-800">{patientName}</span> ({uhid})
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1 text-xs">
          {/* Error Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-start gap-3 text-rose-800">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">Document Processing Error</span>
                <span className="text-rose-700">{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Success Banner */}
          {successMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">AI Analysis & Save Complete</span>
                <span className="text-emerald-700">{successMessage}</span>
              </div>
            </div>
          )}

          {!analysisResult ? (
            <>
              {/* Document Category & Author Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Document Category *
                  </label>
                  <select
                    value={documentCategory}
                    onChange={e => setDocumentCategory(e.target.value as TimelineEntryType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  >
                    <option value="Lab Result">Lab Result / Pathology</option>
                    <option value="Imaging / Radiology Report">Imaging / Radiology Report</option>
                    <option value="Doctor / Progress Note">Doctor / Progress Note</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Consultation Note">Consultation Report</option>
                    <option value="Discharge Information">Discharge Summary</option>
                    <option value="Document / Attachment">Other Clinical Document</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Uploader / Author Name
                  </label>
                  <input
                    type="text"
                    value={authorName}
                    onChange={e => setAuthorName(e.target.value)}
                    placeholder="e.g. Dr. Jane Smith"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Clinical Role / Dept
                  </label>
                  <input
                    type="text"
                    value={authorRole}
                    onChange={e => setAuthorRole(e.target.value)}
                    placeholder="e.g. Attending Physician"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-hidden focus:bg-white focus:ring-2 focus:ring-blue-500 font-medium"
                  />
                </div>
              </div>

              {/* Upload Dropzone */}
              {!file ? (
                <div
                  onDragOver={e => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/40 rounded-3xl p-8 text-center cursor-pointer transition-all space-y-3"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                    className="hidden"
                    onChange={e => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                  />
                  <div className="w-14 h-14 bg-blue-100/70 text-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-xs">
                    <Upload className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">
                      Click to choose or drag & drop medical document
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Supports PDF, PNG, JPG, JPEG, WEBP (Lab reports, scan sheets, prescriptions, doctor notes)
                    </p>
                  </div>
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-600 text-[11px] font-semibold shadow-2xs">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    OCR & Multimodal Clinical Extraction
                  </div>
                </div>
              ) : (
                /* Selected File Card */
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 block truncate max-w-sm">
                          {file.name}
                        </span>
                        <span className="text-[11px] text-slate-500 font-mono">
                          {(file.size / 1024).toFixed(1)} KB • {file.type || 'Document'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={handleReset}
                      className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 p-1.5 rounded-lg hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  </div>

                  {previewUrl && (
                    <div className="mt-2 rounded-xl overflow-hidden border border-slate-200 max-h-48 flex items-center justify-center bg-slate-900">
                      <img
                        src={previewUrl}
                        alt="Document Preview"
                        className="max-h-48 object-contain"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            /* Analysis Results Card */
            <div className="space-y-4">
              {/* Summary Header */}
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-900 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-blue-600" /> Extracted Clinical Synthesis
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      analysisResult.urgencyLevel === 'Emergency Alert'
                        ? 'bg-rose-100 text-rose-800'
                        : analysisResult.urgencyLevel === 'Prompt Medical Attention Required'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {analysisResult.urgencyLevel}
                  </span>
                </div>
                <p className="text-slate-800 leading-relaxed font-medium">
                  {analysisResult.healthSummary}
                </p>
              </div>

              {/* Extracted Lab Test Parameters if any */}
              {analysisResult.testResults && analysisResult.testResults.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <FlaskConical className="w-3.5 h-3.5 text-emerald-600" />
                    Extracted Test Parameters ({analysisResult.testResults.length})
                  </h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-slate-100/70 text-slate-600 font-bold border-b border-slate-200">
                        <tr>
                          <th className="py-2 px-3">Test Parameter</th>
                          <th className="py-2 px-3">Result</th>
                          <th className="py-2 px-3">Reference Range</th>
                          <th className="py-2 px-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {analysisResult.testResults.map((t, idx) => (
                          <tr key={idx} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-semibold text-slate-800">{t.testName}</td>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900">
                              {t.result} {t.unit}
                            </td>
                            <td className="py-2 px-3 text-slate-500 font-mono">{t.referenceRange || '—'}</td>
                            <td className="py-2 px-3">
                              <span
                                className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                                  t.status === 'Normal'
                                    ? 'bg-emerald-50 text-emerald-700'
                                    : t.status === 'High'
                                    ? 'bg-rose-50 text-rose-700'
                                    : t.status === 'Low'
                                    ? 'bg-amber-50 text-amber-700'
                                    : 'bg-purple-50 text-purple-700'
                                }`}
                              >
                                {t.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Abnormal Findings Breakdown if any */}
              {analysisResult.abnormalFindings && analysisResult.abnormalFindings.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    Key Identified Abnormalities ({analysisResult.abnormalFindings.length})
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {analysisResult.abnormalFindings.map((ab, idx) => (
                      <div key={idx} className="p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl space-y-1">
                        <div className="flex items-center justify-between font-bold text-amber-900">
                          <span>{ab.testName}</span>
                          <span className="text-rose-700 font-mono text-[10px] bg-white px-1.5 py-0.5 rounded border border-amber-200">
                            {ab.value} ({ab.status})
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-700">{ab.whatItMeasures}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
          >
            {analysisResult ? 'Close' : 'Cancel'}
          </button>

          {!analysisResult ? (
            <button
              type="button"
              disabled={!file || isAnalyzing}
              onClick={handleAnalyzeAndSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing with AI & Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Analyze with AI & Save to Record
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Another Document
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
