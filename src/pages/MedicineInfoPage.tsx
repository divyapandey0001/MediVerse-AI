import React, { useState } from 'react';
import {
  Pill,
  Search,
  AlertTriangle,
  Info,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  CheckCircle2,
  PhoneCall,
  Activity
} from 'lucide-react';
import { MedicineInfoResult } from '../types.js';
import { DisclaimerBanner } from '../components/DisclaimerBanner.js';
import { SEOHead } from '../components/SEOHead.js';

interface MedicineInfoPageProps {
  onNavigate: (page: string) => void;
}

export const MedicineInfoPage: React.FC<MedicineInfoPageProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [medicineData, setMedicineData] = useState<MedicineInfoResult | null>(null);

  const commonSearchSuggestions = [
    'Metformin',
    'Amoxicillin',
    'Atorvastatin',
    'Lisinopril',
    'Omeprazole',
    'Paracetamol / Acetaminophen'
  ];

  const handleSearch = async (termToSearch?: string) => {
    const query = (termToSearch || searchTerm).trim();
    if (!query) {
      setError('Please enter a medicine name to search.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/medicine-info', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ medicineName: query })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to retrieve medicine details.');
      }

      setMedicineData(data.result);
    } catch (err: any) {
      console.error('Medicine info error:', err);
      setError(err.message || 'Could not find medicine details. Please check the spelling.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="medicine-info-page" className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <SEOHead
        title="Medicine Information & Prescription Drug Guide | MediVerse AI"
        description="Search medications for verified educational information on generic active ingredients, clinical uses, side effects, precautions, and food/drug interactions."
        canonicalPath="/medicine-info"
        keywords="medicine information, prescription drug guide, medication side effects, drug interactions, generic medicine lookup, healthcare AI"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          "name": "Medicine Information & Drug Reference",
          "description": "Educational medication guide and pharmaceutical active ingredient reference.",
          "url": "https://medi-verse-ai-wine.vercel.app/medicine-info"
        }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
            <Pill className="w-3.5 h-3.5 text-blue-600" />
            <span>Educational Pharmaceutical Reference</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Medicine Information
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Look up medications to understand generic active ingredients, common uses, side effects, precautions, and food/drug interactions.
          </p>
        </div>

        {/* Search Bar Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search medicine by brand or generic name (e.g., Metformin, Lisinopril, Paracetamol)..."
                className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm"
                required
              />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all shrink-0"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  <span>Search Drug Info</span>
                </>
              )}
            </button>
          </form>

          {/* Quick suggestions */}
          <div className="flex flex-wrap items-center gap-2 pt-2 text-xs">
            <span className="text-slate-400 font-medium">Common searches:</span>
            {commonSearchSuggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSearchTerm(item);
                  handleSearch(item);
                }}
                className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 rounded-lg transition-colors"
              >
                {item}
              </button>
            ))}
          </div>

          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Medicine Result Card */}
        {medicineData && (
          <div id="medicine-details-container" className="space-y-6 animate-fadeIn">
            {/* Main Header Banner */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">
                    {medicineData.medicineName}
                  </h2>
                  {medicineData.genericName && (
                    <p className="text-sm text-blue-700 font-medium mt-0.5">
                      Generic / Active: {medicineData.genericName}
                    </p>
                  )}
                </div>
                {medicineData.drugClass && (
                  <span className="self-start sm:self-auto px-3 py-1 bg-blue-50 text-blue-800 border border-blue-200 rounded-full text-xs font-semibold">
                    {medicineData.drugClass}
                  </span>
                )}
              </div>

              {/* Mechanism of Action */}
              <div className="space-y-1.5">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
                  Purpose & Mechanism of Action
                </h3>
                <p className="text-slate-700 text-sm leading-relaxed">
                  {medicineData.mechanismOfAction}
                </p>
              </div>
            </div>

            {/* Common Uses */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h3>Common Clinical Uses</h3>
              </div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-slate-700">
                {medicineData.commonUses.map((use, idx) => (
                  <li key={idx} className="flex items-start gap-2 p-2 rounded-lg bg-slate-50 border border-slate-100">
                    <span className="text-emerald-500 font-bold">•</span>
                    <span>{use}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Side Effects & Precautions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Common Side Effects */}
              <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-base border-b border-amber-100 pb-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <h3>Common Side Effects</h3>
                </div>
                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                  {medicineData.commonSideEffects.map((effect, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-amber-500 font-bold">•</span>
                      <span>{effect}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Important Precautions */}
              <div className="bg-white rounded-2xl p-6 border border-blue-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-blue-800 font-bold text-base border-b border-blue-100 pb-3">
                  <Info className="w-5 h-5 text-blue-600" />
                  <h3>Important Precautions</h3>
                </div>
                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                  {medicineData.importantPrecautions.map((prec, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-blue-500 font-bold">•</span>
                      <span>{prec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Interactions & Contact Doctor Warning */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
              {/* Interactions */}
              <div className="space-y-3">
                <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-2">
                  Common Interaction Warnings
                </h3>
                <ul className="space-y-1.5 text-xs sm:text-sm text-slate-700">
                  {medicineData.commonInteractions.map((inter, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-purple-500 font-bold">•</span>
                      <span>{inter}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* When to contact doctor */}
              <div className="p-4 bg-red-50 border border-red-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  <h4>When to Immediately Contact a Healthcare Professional</h4>
                </div>
                <ul className="space-y-1 text-xs text-red-950">
                  {medicineData.whenToContactDoctor.map((item, idx) => (
                    <li key={idx}>• {item}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 sm:p-5 text-blue-950 text-xs sm:text-sm flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <strong>Important Safety Notice:</strong> Confirm medicine use, exact dosage, and contraindications with a qualified healthcare professional. Do NOT start, stop, or change medications based solely on automated pharmaceutical reference info.
          </div>
        </div>

        <DisclaimerBanner />
      </div>
    </div>
  );
};
