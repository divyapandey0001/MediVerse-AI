import React, { useState } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Eye,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  FileCheck,
  CheckSquare,
  Square,
  PlusCircle,
  FileCode,
  FileSpreadsheet,
  Image as ImageIcon
} from 'lucide-react';
import { LivePatientRecord, PatientDocument, ExtractedClinicalData } from '../../types.js';
import { useAuth } from '../../context/AuthContext.js';

interface PatientDocumentsTabProps {
  patient: LivePatientRecord;
  onRefreshPatient: (updatedPatient: LivePatientRecord) => void;
}

export const PatientDocumentsTab: React.FC<PatientDocumentsTabProps> = ({
  patient,
  onRefreshPatient
}) => {
  const { token, user } = useAuth();

  // Upload Form State
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string>('');
  const [docCategory, setDocCategory] = useState<PatientDocument['category']>('Laboratory Report');
  const [docNotes, setDocNotes] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // View Document Modal
  const [viewingDoc, setViewingDoc] = useState<PatientDocument | null>(null);

  // AI Document Analysis State
  const [analyzingDocId, setAnalyzingDocId] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Review & Save Extracted Information Modal
  const [extractedDataModal, setExtractedDataModal] = useState<{
    doc: PatientDocument;
    data: ExtractedClinicalData;
    selectedTests: Record<number, boolean>;
    selectedDiagnoses: Record<number, boolean>;
    selectedMeds: Record<number, boolean>;
    notes: string;
  } | null>(null);
  const [savingExtracted, setSavingExtracted] = useState(false);
  const [saveExtractedMsg, setSaveExtractedMsg] = useState<string | null>(null);

  // File selection handler
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (up to 30MB)
    if (file.size > 30 * 1024 * 1024) {
      setUploadError('File size exceeds 30MB limit. Please upload a smaller document.');
      return;
    }

    setSelectedFile(file);
    setUploadError(null);

    const reader = new FileReader();
    reader.onload = () => {
      setFileBase64(reader.result as string);
    };
    reader.onerror = () => {
      setUploadError('Failed to read file data.');
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !fileBase64) {
      setUploadError('Please choose a medical document to upload.');
      return;
    }

    try {
      setUploading(true);
      setUploadError(null);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/patients/${patient.id}/documents`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type || 'application/pdf',
          fileSize: selectedFile.size,
          category: docCategory,
          notes: docNotes.trim() || undefined,
          dataUrl: fileBase64
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to upload document.');
      }

      onRefreshPatient(data.patient);
      setShowUploadModal(false);
      setSelectedFile(null);
      setFileBase64('');
      setDocNotes('');
    } catch (err: any) {
      setUploadError(err.message || 'Error uploading document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId: string, docName: string) => {
    if (!window.confirm(`Are you sure you want to remove "${docName}" from this patient record?`)) {
      return;
    }

    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/patients/${patient.id}/documents/${docId}`, {
        method: 'DELETE',
        headers
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete document.');
      onRefreshPatient(data.patient);
    } catch (err: any) {
      alert(err.message || 'Error deleting document.');
    }
  };

  const handleAnalyzeDocument = async (doc: PatientDocument) => {
    try {
      setAnalyzingDocId(doc.id);
      setAnalysisError(null);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/patients/${patient.id}/documents/${doc.id}/analyze`, {
        method: 'POST',
        headers
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze document.');

      onRefreshPatient(data.patient);

      // Open Extracted Clinical Data Review Modal
      const extracted: ExtractedClinicalData = data.extractedData;
      const initialSelectedTests: Record<number, boolean> = {};
      extracted.tests?.forEach((_, idx) => { initialSelectedTests[idx] = true; });

      const initialSelectedDiag: Record<number, boolean> = {};
      extracted.diagnosesMentioned?.forEach((_, idx) => { initialSelectedDiag[idx] = true; });

      const initialSelectedMeds: Record<number, boolean> = {};
      extracted.medicationsMentioned?.forEach((_, idx) => { initialSelectedMeds[idx] = true; });

      setExtractedDataModal({
        doc,
        data: extracted,
        selectedTests: initialSelectedTests,
        selectedDiagnoses: initialSelectedDiag,
        selectedMeds: initialSelectedMeds,
        notes: extracted.summaryOfFindings || ''
      });
    } catch (err: any) {
      setAnalysisError(err.message || 'Error running AI clinical extraction.');
    } finally {
      setAnalyzingDocId(null);
    }
  };

  const handleOpenExistingAnalysis = (doc: PatientDocument) => {
    if (!doc.analysis) return;
    const extracted: ExtractedClinicalData = doc.analysis;
    const initialSelectedTests: Record<number, boolean> = {};
    extracted.tests?.forEach((_, idx) => { initialSelectedTests[idx] = true; });

    const initialSelectedDiag: Record<number, boolean> = {};
    extracted.diagnosesMentioned?.forEach((_, idx) => { initialSelectedDiag[idx] = true; });

    const initialSelectedMeds: Record<number, boolean> = {};
    extracted.medicationsMentioned?.forEach((_, idx) => { initialSelectedMeds[idx] = true; });

    setExtractedDataModal({
      doc,
      data: extracted,
      selectedTests: initialSelectedTests,
      selectedDiagnoses: initialSelectedDiag,
      selectedMeds: initialSelectedMeds,
      notes: extracted.summaryOfFindings || ''
    });
  };

  const handleSaveExtractedToRecord = async () => {
    if (!extractedDataModal) return;

    try {
      setSavingExtracted(true);
      setSaveExtractedMsg(null);

      const chosenTests = (extractedDataModal.data.tests || []).filter(
        (_, idx) => extractedDataModal.selectedTests[idx]
      );
      const chosenDiagnoses = (extractedDataModal.data.diagnosesMentioned || []).filter(
        (_, idx) => extractedDataModal.selectedDiagnoses[idx]
      );
      const chosenMeds = (extractedDataModal.data.medicationsMentioned || []).filter(
        (_, idx) => extractedDataModal.selectedMeds[idx]
      );

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/patients/${patient.id}/documents/save-extracted`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          documentId: extractedDataModal.doc.id,
          documentName: extractedDataModal.doc.fileName,
          tests: chosenTests,
          diagnoses: chosenDiagnoses,
          medications: chosenMeds,
          clinicalNotes: extractedDataModal.notes
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save extracted information.');

      onRefreshPatient(data.patient);
      setSaveExtractedMsg('Successfully imported extracted clinical data into patient record!');
      setTimeout(() => {
        setSaveExtractedMsg(null);
        setExtractedDataModal(null);
      }, 1500);
    } catch (err: any) {
      alert(err.message || 'Error saving extracted clinical data.');
    } finally {
      setSavingExtracted(false);
    }
  };

  const docs = patient.documents || [];

  return (
    <div className="space-y-6">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-3xl p-6 border border-blue-100 shadow-xs">
        <div>
          <h3 className="text-lg font-bold text-slate-900 leading-tight">Patient Documents Archive</h3>
          <p className="text-xs text-slate-500">
            Upload real lab reports, radiology imaging, prescriptions, or clinical letters (PDF, JPG, PNG, WEBP).
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-xs shadow-md shadow-blue-600/20 hover:shadow-lg transition-all"
        >
          <Upload className="w-4 h-4" />
          <span>Upload Medical Document</span>
        </button>
      </div>

      {analysisError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{analysisError}</span>
        </div>
      )}

      {/* Document Grid / Table */}
      {docs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-dashed border-blue-200 shadow-xs space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
            <FileText className="w-7 h-7" />
          </div>
          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">No medical documents uploaded yet</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Upload patient reports in PDF or image formats to automatically extract test parameters, diagnoses, and medications using AI.
            </p>
          </div>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
          >
            Upload First Document
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {docs.map(doc => {
            const isAnalyzing = analyzingDocId === doc.id;
            const isImage = doc.fileType?.startsWith('image/') || doc.dataUrl?.startsWith('data:image/');
            const isPdf = doc.fileType?.includes('pdf') || doc.fileName?.toLowerCase().endsWith('.pdf');

            return (
              <div
                key={doc.id}
                className="bg-white rounded-3xl p-5 border border-blue-100 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0 border border-blue-100">
                      {isImage ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <span className="text-[10px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {doc.category}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-bold text-slate-900 truncate" title={doc.fileName}>
                      {doc.fileName}
                    </h4>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Uploaded on {new Date(doc.uploadedAt).toLocaleDateString()} by {doc.uploadedBy || 'Staff'}
                      {doc.fileSize ? ` • ${(doc.fileSize / (1024 * 1024)).toFixed(2)} MB` : ''}
                    </p>
                    {doc.notes && (
                      <p className="text-xs text-slate-600 mt-1 italic line-clamp-2">"{doc.notes}"</p>
                    )}
                  </div>

                  {/* AI Status Badge */}
                  <div>
                    {doc.analyzed ? (
                      <button
                        onClick={() => handleOpenExistingAnalysis(doc)}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-[11px] font-semibold border border-emerald-200 hover:bg-emerald-100 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>AI Analyzed — View Extracted Data</span>
                      </button>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-medium">
                        Not yet analyzed with AI
                      </span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewingDoc(doc)}
                      className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="View Document"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <a
                      href={doc.dataUrl}
                      download={doc.fileName}
                      className="p-2 rounded-xl text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      title="Download Document"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => handleDeleteDocument(doc.id, doc.fileName)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      title="Delete Document"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* AI Analyze Button */}
                  <button
                    onClick={() => handleAnalyzeDocument(doc)}
                    disabled={isAnalyzing}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 transition-all"
                  >
                    {isAnalyzing ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Analyzing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                        <span>{doc.analyzed ? 'Re-Analyze' : 'Analyze AI'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 1. Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-blue-100 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5" />
                <h3 className="font-bold text-base">Upload Medical Document</h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* File Input Box */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Document (PDF, JPG, JPEG, PNG, WEBP) <span className="text-red-500">*</span>
                </label>
                <div className="border-2 border-dashed border-blue-200 hover:border-blue-400 rounded-2xl p-5 text-center transition-colors">
                  <input
                    type="file"
                    id="patient-file-input"
                    accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <label htmlFor="patient-file-input" className="cursor-pointer flex flex-col items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-blue-600 block">
                        {selectedFile ? selectedFile.name : 'Click to select file from device'}
                      </span>
                      <span className="text-[10px] text-slate-400">PDF, PNG, JPG or WEBP up to 30MB</span>
                    </div>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Document Category</label>
                <select
                  value={docCategory}
                  onChange={e => setDocCategory(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Laboratory Report">Laboratory Report</option>
                  <option value="Radiology & Imaging">Radiology & Imaging (X-Ray, CT, MRI)</option>
                  <option value="Discharge Summary">Discharge Summary</option>
                  <option value="Clinical Note">Clinical Note / Consultation</option>
                  <option value="Prescription">Prescription Document</option>
                  <option value="Pathology">Pathology / Histopathology</option>
                  <option value="Other">Other Medical File</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Clinical Remarks / Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Complete blood count and lipid profile from central diagnostic lab."
                  value={docNotes}
                  onChange={e => setDocNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <span>Save & Upload</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. View Document Preview Modal */}
      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-4xl w-full h-[85vh] border border-blue-100 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="truncate">
                <h3 className="font-bold text-sm text-white truncate">{viewingDoc.fileName}</h3>
                <span className="text-[10px] text-slate-400">{viewingDoc.category}</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={viewingDoc.dataUrl}
                  download={viewingDoc.fileName}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  onClick={() => setViewingDoc(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 bg-slate-100 p-4 overflow-auto flex items-center justify-center">
              {viewingDoc.fileType?.startsWith('image/') || viewingDoc.dataUrl?.startsWith('data:image/') ? (
                <img
                  src={viewingDoc.dataUrl}
                  alt={viewingDoc.fileName}
                  className="max-w-full max-h-full object-contain rounded-xl shadow-md"
                />
              ) : (
                <iframe
                  src={viewingDoc.dataUrl}
                  title={viewingDoc.fileName}
                  className="w-full h-full rounded-xl border border-slate-300 bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. Review & Save Extracted Clinical Information Modal */}
      {extractedDataModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] border border-blue-100 shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95">
            
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-blue-200" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">Review & Save Extracted Clinical Information</h3>
                  <p className="text-xs text-blue-100/80">Extracted from: {extractedDataModal.doc.fileName}</p>
                </div>
              </div>
              <button
                onClick={() => setExtractedDataModal(null)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {saveExtractedMsg && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{saveExtractedMsg}</span>
                </div>
              )}

              {/* Summary of Findings */}
              {extractedDataModal.data.summaryOfFindings && (
                <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-100 space-y-1.5">
                  <span className="text-[11px] uppercase font-bold text-blue-800 tracking-wider">
                    Document Findings Overview:
                  </span>
                  <p className="text-xs text-slate-700 leading-relaxed">
                    {extractedDataModal.data.summaryOfFindings}
                  </p>
                </div>
              )}

              {/* Extracted Tests */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Extracted Laboratory Parameters ({extractedDataModal.data.tests?.length || 0})
                  </h4>
                  <span className="text-[10px] text-slate-500">Select tests to commit into patient labs</span>
                </div>

                {(!extractedDataModal.data.tests || extractedDataModal.data.tests.length === 0) ? (
                  <p className="text-xs text-slate-400 italic">No specific lab test parameters detected.</p>
                ) : (
                  <div className="space-y-2">
                    {extractedDataModal.data.tests.map((t, idx) => {
                      const isSelected = !!extractedDataModal.selectedTests[idx];
                      const isAbnormal = t.status === 'High' || t.status === 'Low' || t.status === 'Critical';

                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setExtractedDataModal({
                              ...extractedDataModal,
                              selectedTests: {
                                ...extractedDataModal.selectedTests,
                                [idx]: !isSelected
                              }
                            });
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-blue-50/60 border-blue-300'
                              : 'bg-slate-50/60 border-slate-200 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {isSelected ? (
                              <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400 shrink-0" />
                            )}
                            <div>
                              <span className="font-bold text-slate-900 text-xs">{t.testName}</span>
                              <span className="text-xs text-slate-600 ml-2">
                                Result: <strong>{t.result} {t.unit}</strong>
                              </span>
                              {t.referenceRange && (
                                <span className="text-[10px] text-slate-400 ml-2 font-mono">[Ref: {t.referenceRange}]</span>
                              )}
                            </div>
                          </div>

                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              t.status === 'Critical'
                                ? 'bg-rose-100 text-rose-800'
                                : t.status === 'High' || t.status === 'Low'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {t.status || 'Normal'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Extracted Diagnoses */}
              {extractedDataModal.data.diagnosesMentioned && extractedDataModal.data.diagnosesMentioned.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                    Diagnoses / Clinical Findings Mentioned ({extractedDataModal.data.diagnosesMentioned.length})
                  </h4>
                  <div className="space-y-2">
                    {extractedDataModal.data.diagnosesMentioned.map((d, idx) => {
                      const isSelected = !!extractedDataModal.selectedDiagnoses[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setExtractedDataModal({
                              ...extractedDataModal,
                              selectedDiagnoses: {
                                ...extractedDataModal.selectedDiagnoses,
                                [idx]: !isSelected
                              }
                            });
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                            isSelected ? 'bg-indigo-50/60 border-indigo-300' : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-indigo-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-slate-900">{d}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Extracted Medications */}
              {extractedDataModal.data.medicationsMentioned && extractedDataModal.data.medicationsMentioned.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 mb-2">
                    Medications Mentioned ({extractedDataModal.data.medicationsMentioned.length})
                  </h4>
                  <div className="space-y-2">
                    {extractedDataModal.data.medicationsMentioned.map((m, idx) => {
                      const isSelected = !!extractedDataModal.selectedMeds[idx];
                      return (
                        <div
                          key={idx}
                          onClick={() => {
                            setExtractedDataModal({
                              ...extractedDataModal,
                              selectedMeds: {
                                ...extractedDataModal.selectedMeds,
                                [idx]: !isSelected
                              }
                            });
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                            isSelected ? 'bg-purple-50/60 border-purple-300' : 'bg-slate-50 border-slate-200 opacity-60'
                          }`}
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-purple-600 shrink-0" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-400 shrink-0" />
                          )}
                          <span className="text-xs font-semibold text-slate-900">{m}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-xs text-slate-500">
                Data will be appended to patient Labs, Diagnoses, and Medications with document attribution.
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setExtractedDataModal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingExtracted}
                  onClick={handleSaveExtractedToRecord}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs disabled:opacity-50 flex items-center gap-1.5"
                >
                  {savingExtracted ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving Data...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Save Extracted Data to Patient Record</span>
                    </>
                  )}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
