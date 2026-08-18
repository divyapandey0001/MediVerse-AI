import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  ShieldAlert,
  Trash2,
  Printer,
  MessageSquare,
  Sparkles,
  Info,
  Apple,
  Droplets,
  Heart,
  HelpCircle,
  RefreshCw,
  Clock,
  ArrowRight
} from 'lucide-react';
import { LabReportAnalysis, TestStatus } from '../types.js';
import { useAuth } from '../context/AuthContext.js';
import { DisclaimerBanner } from '../components/DisclaimerBanner.js';

interface LabReportPageProps {
  onNavigate: (page: string) => void;
}

export const LabReportPage: React.FC<LabReportPageProps> = ({ onNavigate }) => {
  const { user, token, activeReport, setActiveReport } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [reportResult, setReportResult] = useState<LabReportAnalysis | null>(activeReport);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMessage(null);
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      validateAndSetFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setErrorMessage(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      setErrorMessage('Please upload a valid PDF or image file (JPG, JPEG, PNG, WEBP).');
      return;
    }

    if (file.size > 25 * 1024 * 1024) {
      setErrorMessage('File size exceeds 25MB. Please upload a smaller file.');
      return;
    }

    setSelectedFile(file);

    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setFilePreview(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) return;

    setIsAnalyzing(true);
    setErrorMessage(null);
    setAnalysisStep('Reading uploaded document bytes...');

    try {
      // Convert file to base64
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          const base64 = result.split(',')[1];
          resolve(base64);
        };
        reader.onerror = reject;
      });
      reader.readAsDataURL(selectedFile);

      const base64Data = await base64Promise;

      setAnalysisStep('Performing OCR and medical parameter extraction...');

      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      setAnalysisStep('Validating test reference ranges & clinical indicators...');

      const response = await fetch('/api/ai/analyze-report', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          base64Data,
          mimeType: selectedFile.type,
          fileName: selectedFile.name,
          fileSize: selectedFile.size
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze report.');
      }

      setAnalysisStep('Finalizing plain-language health summary...');
      setReportResult(data.analysis);
      setActiveReport(data.analysis);
    } catch (err: any) {
      console.error('Analysis error:', err);
      setErrorMessage(
        err.message ||
          'Unable to read this file. Please upload a clearer PDF or image, or verify the document format.'
      );
    } finally {
      setIsAnalyzing(false);
      setAnalysisStep('');
    }
  };

  const handleRemoveReport = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setReportResult(null);
    setActiveReport(null);
    setErrorMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusBadge = (status: TestStatus) => {
    switch (status) {
      case 'Normal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle className="w-3.5 h-3.5" />
            Normal
          </span>
        );
      case 'Low':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertCircle className="w-3.5 h-3.5" />
            Low
          </span>
        );
      case 'High':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
            <AlertTriangle className="w-3.5 h-3.5" />
            High
          </span>
        );
      case 'Needs Attention':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Info className="w-3.5 h-3.5" />
            Needs Attention
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            {status}
          </span>
        );
    }
  };

  return (
    <div id="lab-report-page" className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Title */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
            <FileText className="w-3.5 h-3.5 text-blue-600" />
            <span>Document OCR & Clinical Parameter Parsing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            AI Lab Report Analysis
          </h1>
          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            Upload your laboratory test report (blood tests, lipid profiles, metabolic panels, thyroid tests). Our AI reads the document, extracts parameters, validates reference ranges, and explains findings in plain language.
          </p>
        </div>

        {/* Upload Card */}
        {!reportResult && (
          <div
            id="lab-report-upload-box"
            className="bg-white rounded-2xl p-6 sm:p-10 border-2 border-dashed border-blue-200 shadow-sm max-w-3xl mx-auto transition-all hover:border-blue-400"
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/*"
              className="hidden"
              id="lab-report-file-input"
            />

            {!selectedFile ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                  <Upload className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-semibold text-slate-900">
                    Upload your Medical Report
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Drag and drop your file here, or click to browse from your device
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-sm transition-all inline-flex items-center gap-2"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Select File (PDF, JPG, PNG)</span>
                  </button>
                </div>
                <p className="text-[11px] text-slate-400">
                  Supported formats: PDF, JPG, JPEG, PNG, WEBP • Max size: 25MB • Zero fake sample data
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-blue-50/60 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-slate-500">
                        {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Document'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleRemoveReport}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove file"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>

                {filePreview && (
                  <div className="max-h-60 overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center">
                    <img
                      src={filePreview}
                      alt="Uploaded report preview"
                      className="max-h-56 object-contain rounded-lg shadow-xs"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                )}

                {isAnalyzing ? (
                  <div className="p-6 bg-blue-50 rounded-xl border border-blue-200 text-center space-y-3">
                    <div className="flex items-center justify-center gap-2 text-blue-700 font-semibold text-sm">
                      <RefreshCw className="w-5 h-5 animate-spin" />
                      <span>{analysisStep || 'Analyzing Document with Gemini AI...'}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Please wait while we perform OCR, extract medical parameters, and validate against clinical reference ranges.
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <button
                      type="button"
                      onClick={handleAnalyze}
                      className="flex-1 py-3 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>Start AI Analysis</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRemoveReport}
                      className="py-3 px-5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-sm transition-all"
                    >
                      Choose Different File
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="max-w-3xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-800 text-sm">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-semibold">Analysis Notice</p>
              <p>{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Analysis Results Display */}
        {reportResult && (
          <div id="report-analysis-results" className="space-y-8 animate-fadeIn">
            {/* Top Toolbar */}
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-slate-900">
                    {reportResult.fileName}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                    <span>Uploaded: {new Date(reportResult.uploadedAt).toLocaleDateString()}</span>
                    {reportResult.patientNameDetected && (
                      <span>• Patient: {reportResult.patientNameDetected}</span>
                    )}
                    {reportResult.labNameDetected && (
                      <span>• Lab: {reportResult.labNameDetected}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={() => onNavigate('ai-chat')}
                  className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-colors"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Ask AI About This Report</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                  title="Print Report"
                >
                  <Printer className="w-4 h-4" />
                  <span className="hidden sm:inline">Print</span>
                </button>

                <button
                  onClick={handleRemoveReport}
                  className="px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs sm:text-sm flex items-center gap-1.5 transition-colors"
                  title="Analyze another report"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="hidden sm:inline">Clear</span>
                </button>
              </div>
            </div>

            {/* Urgency & Emergency Alert Banner */}
            {reportResult.isEmergency ? (
              <div className="p-5 bg-red-600 text-white rounded-2xl shadow-md flex items-start gap-4">
                <ShieldAlert className="w-7 h-7 text-white shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <h3 className="text-lg font-bold">EMERGENCY ALERT: Immediate Medical Care Advised</h3>
                  <p className="text-sm text-red-100 leading-relaxed">
                    {reportResult.urgencyExplanation ||
                      'The uploaded report contains one or more critical clinical values that may indicate an urgent medical situation. Please seek immediate emergency medical care (Call 911 / 112 or go to the nearest emergency department).'}
                  </p>
                </div>
              </div>
            ) : reportResult.urgencyLevel === 'Prompt Medical Attention Required' ? (
              <div className="p-4 sm:p-5 bg-amber-500 text-white rounded-2xl shadow-sm flex items-start gap-4">
                <AlertTriangle className="w-6 h-6 text-white shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-base sm:text-lg font-bold">Prompt Medical Attention Required</h3>
                  <p className="text-xs sm:text-sm text-amber-50 leading-relaxed">
                    {reportResult.urgencyExplanation ||
                      'Please consult a qualified healthcare professional promptly to review these abnormal findings and coordinate appropriate clinical evaluation.'}
                  </p>
                </div>
              </div>
            ) : null}

            {/* Health Summary Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-lg border-b border-slate-100 pb-3">
                <Sparkles className="w-5 h-5" />
                <h2>Health Summary</h2>
              </div>
              <p className="text-slate-700 text-sm sm:text-base leading-relaxed">
                {reportResult.healthSummary}
              </p>
              {reportResult.unreadableNotes && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 flex items-start gap-2">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span>{reportResult.unreadableNotes}</span>
                </div>
              )}
            </div>

            {/* Complete Extracted Parameters Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Extracted Test Results ({reportResult.testResults.length} parameters)
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Values extracted directly from the uploaded diagnostic document
                  </p>
                </div>
              </div>

              {reportResult.testResults.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No explicit lab parameters were clearly detected from the uploaded report. Please ensure the image is clear and well-lit.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm border-collapse">
                    <thead className="bg-slate-50 text-slate-700 text-xs uppercase font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4 sm:px-6">Test Name</th>
                        <th className="py-3.5 px-4">Result</th>
                        <th className="py-3.5 px-4">Unit</th>
                        <th className="py-3.5 px-4">Reference Range</th>
                        <th className="py-3.5 px-4 sm:px-6">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {reportResult.testResults.map((item, idx) => (
                        <tr
                          key={idx}
                          className={`hover:bg-slate-50/80 transition-colors ${
                            item.status !== 'Normal' ? 'bg-amber-50/20' : ''
                          }`}
                        >
                          <td className="py-3.5 px-4 sm:px-6 font-semibold text-slate-900">
                            {item.testName}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-800">
                            {item.result}
                          </td>
                          <td className="py-3.5 px-4 text-slate-500">
                            {item.unit || '—'}
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                            {item.referenceRange || 'Not clearly detected'}
                          </td>
                          <td className="py-3.5 px-4 sm:px-6">
                            {getStatusBadge(item.status)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Abnormal Results Section */}
            {reportResult.abnormalFindings && reportResult.abnormalFindings.length > 0 && (
              <div className="bg-white rounded-2xl p-6 sm:p-8 border border-amber-200 shadow-xs space-y-6">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-lg border-b border-amber-100 pb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h2>Abnormal Results & Clinical Context ({reportResult.abnormalFindings.length})</h2>
                </div>

                <div className="grid grid-cols-1 gap-6">
                  {reportResult.abnormalFindings.map((finding, idx) => (
                    <div
                      key={idx}
                      className="p-5 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-900 text-base">{finding.testName}</h4>
                          <span className="font-mono font-bold text-sm text-slate-700 bg-white px-2.5 py-0.5 rounded border border-slate-200">
                            {finding.value}
                          </span>
                        </div>
                        {getStatusBadge(finding.status)}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm pt-2">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-700 text-xs uppercase tracking-wide">
                            What It Measures
                          </p>
                          <p className="text-slate-600 leading-relaxed">{finding.whatItMeasures}</p>
                        </div>

                        <div className="space-y-1">
                          <p className="font-semibold text-slate-700 text-xs uppercase tracking-wide">
                            Discuss With Doctor
                          </p>
                          <p className="text-slate-600 leading-relaxed">{finding.discussWithDoctor}</p>
                        </div>
                      </div>

                      {finding.possibleReasons && finding.possibleReasons.length > 0 && (
                        <div className="pt-2 border-t border-slate-200/60">
                          <p className="font-semibold text-slate-700 text-xs uppercase tracking-wide mb-1">
                            Possible General Considerations
                          </p>
                          <ul className="list-disc list-inside text-xs text-slate-600 space-y-1">
                            {finding.possibleReasons.map((reason, rIdx) => (
                              <li key={rIdx}>{reason}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Food & Lifestyle Guidance */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-lg border-b border-slate-100 pb-3">
                <Heart className="w-5 h-5" />
                <h2>Educational Food & Lifestyle Guidance</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Helpful Foods */}
                <div className="p-5 rounded-xl bg-emerald-50/60 border border-emerald-100 space-y-3">
                  <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                    <Apple className="w-4 h-4 text-emerald-600" />
                    <h3>Foods That May Be Helpful</h3>
                  </div>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-emerald-950">
                    {reportResult.foodAndLifestyle.helpfulFoods.length > 0 ? (
                      reportResult.foodAndLifestyle.helpfulFoods.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-emerald-500 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500">Maintain a balanced, nutrient-dense diet.</li>
                    )}
                  </ul>
                </div>

                {/* Foods to Limit */}
                <div className="p-5 rounded-xl bg-amber-50/60 border border-amber-100 space-y-3">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                    <h3>Foods & Habits to Limit</h3>
                  </div>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-amber-950">
                    {reportResult.foodAndLifestyle.foodsToLimit.length > 0 ? (
                      reportResult.foodAndLifestyle.foodsToLimit.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-amber-500 font-bold">•</span>
                          <span>{item}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-slate-500">Limit ultra-processed foods and excess sodium.</li>
                    )}
                  </ul>
                </div>

                {/* Hydration */}
                <div className="p-5 rounded-xl bg-blue-50/60 border border-blue-100 space-y-3">
                  <div className="flex items-center gap-2 text-blue-800 font-bold text-sm">
                    <Droplets className="w-4 h-4 text-blue-600" />
                    <h3>Hydration Guidance</h3>
                  </div>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-blue-950">
                    {reportResult.foodAndLifestyle.hydrationTips.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-blue-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Lifestyle Suggestions */}
                <div className="p-5 rounded-xl bg-purple-50/60 border border-purple-100 space-y-3">
                  <div className="flex items-center gap-2 text-purple-800 font-bold text-sm">
                    <Clock className="w-4 h-4 text-purple-600" />
                    <h3>General Lifestyle Suggestions</h3>
                  </div>
                  <ul className="space-y-1.5 text-xs sm:text-sm text-purple-950">
                    {reportResult.foodAndLifestyle.generalLifestyle.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-purple-500 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Doctor Discussion Questions */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-3">
                <HelpCircle className="w-5 h-5 text-blue-600" />
                <h2>What Should I Ask My Doctor?</h2>
              </div>
              <p className="text-xs text-slate-500">
                Take these customized questions to your next consultation with your physician:
              </p>

              <div className="space-y-2.5 pt-2">
                {reportResult.doctorQuestions.map((q, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 bg-slate-50 hover:bg-blue-50/50 border border-slate-200 rounded-xl text-slate-800 text-sm font-medium flex items-start gap-3 transition-colors"
                  >
                    <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{q}</span>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => onNavigate('appointment')}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm inline-flex items-center justify-center gap-2 transition-all"
                >
                  <span>Book Doctor Appointment</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => onNavigate('ai-chat')}
                  className="px-6 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-sm inline-flex items-center justify-center gap-2 transition-all"
                >
                  <MessageSquare className="w-4 h-4 text-blue-600" />
                  <span>Discuss Further in AI Chat</span>
                </button>
              </div>
            </div>
          </div>
        )}

        <DisclaimerBanner />
      </div>
    </div>
  );
};
