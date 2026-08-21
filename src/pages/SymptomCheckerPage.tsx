import React, { useState } from 'react';
import {
  Stethoscope,
  AlertTriangle,
  HelpCircle,
  Clock,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  ArrowRight,
  Info,
  Calendar,
  CheckCircle2
} from 'lucide-react';
import { SymptomAnalysisResult } from '../types.js';
import { DisclaimerBanner } from '../components/DisclaimerBanner.js';
import { SEOHead } from '../components/SEOHead.js';

interface SymptomCheckerPageProps {
  onNavigate: (page: string) => void;
}

export const SymptomCheckerPage: React.FC<SymptomCheckerPageProps> = ({ onNavigate }) => {
  const [symptoms, setSymptoms] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('');
  const [duration, setDuration] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SymptomAnalysisResult | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!symptoms.trim()) {
      setError('Please describe your symptoms.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/ai/check-symptoms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          symptoms: symptoms.trim(),
          age: age ? Number(age) : undefined,
          gender: gender || undefined,
          duration: duration || undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to analyze symptoms.');
      }

      setResult(data.result);
    } catch (err: any) {
      console.error('Symptom check error:', err);
      setError(err.message || 'Unable to analyze symptoms. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSymptoms('');
    setAge('');
    setGender('');
    setDuration('');
    setResult(null);
    setError(null);
  };

  return (
    <div id="symptom-checker-page" className="min-h-screen bg-slate-50 py-8 sm:py-12">
      <SEOHead
        title="AI Symptom Checker & Clinical Health Triage | MediVerse AI"
        description="Check your symptoms with our AI health assistant. Understand possible common causes, critical warning signs, and get guidance on when to seek medical care."
        canonicalPath="/symptom-checker"
        keywords="AI symptom checker, symptom triage, AI health assistant, check symptoms online, health warning signs, digital healthcare"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "MedicalWebPage",
          "name": "AI Symptom Checker",
          "description": "Educational symptom triage guide and common health factor assessments.",
          "url": "https://medi-verse-ai-wine.vercel.app/symptom-checker"
        }}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-semibold">
            <Stethoscope className="w-3.5 h-3.5 text-blue-600" />
            <span>Clinical Symptom Triage & Education</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Symptom Checker
          </h1>
          <p className="text-slate-600 text-sm sm:text-base">
            Enter what you are feeling to understand possible common causes, critical warning signs, and how to discuss them with a healthcare professional.
          </p>
        </div>

        {/* Input Form Card */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-900">
                What symptoms are you experiencing? <span className="text-red-500">*</span>
              </label>
              <textarea
                value={symptoms}
                onChange={e => setSymptoms(e.target.value)}
                placeholder="e.g. fever, cough, mild sore throat, and headache for the past 2 days..."
                rows={4}
                className="w-full p-4 rounded-xl border border-slate-300 focus:outline-hidden focus:border-blue-600 focus:ring-2 focus:ring-blue-100 text-sm"
                required
              />
              <p className="text-xs text-slate-400">
                Be as descriptive as possible regarding location, severity, and onset.
              </p>
            </div>

            {/* Optional Demographics & Duration */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Age (Optional)
                </label>
                <input
                  type="number"
                  value={age}
                  onChange={e => setAge(e.target.value)}
                  placeholder="e.g. 35"
                  min={1}
                  max={120}
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Sex / Gender (Optional)
                </label>
                <select
                  value={gender}
                  onChange={e => setGender(e.target.value)}
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm bg-white focus:outline-hidden focus:border-blue-600"
                >
                  <option value="">Select (Optional)</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other / Prefer not to say</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Duration (Optional)
                </label>
                <input
                  type="text"
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder="e.g. 2 days, 1 week"
                  className="w-full p-3 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:border-blue-600"
                />
              </div>
            </div>

            {error && (
              <div className="p-3.5 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm">
                {error}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="flex-1 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold text-sm shadow-md shadow-blue-600/20 flex items-center justify-center gap-2 transition-all"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Analyzing Reported Symptoms...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Check Symptoms with AI</span>
                  </>
                )}
              </button>

              {result && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="py-3.5 px-5 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-sm font-medium"
                >
                  Clear
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Results View */}
        {result && (
          <div id="symptom-analysis-result" className="space-y-6 animate-fadeIn">
            {/* General Overview Card */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-blue-700 font-bold text-lg border-b border-slate-100 pb-3">
                <Info className="w-5 h-5" />
                <h2>Clinical Overview</h2>
              </div>
              <p className="text-slate-700 text-sm leading-relaxed">
                {result.generalInformation}
              </p>
            </div>

            {/* Possible Common Causes */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-3">
                <Stethoscope className="w-5 h-5 text-blue-600" />
                <h2>Possible Common Causes</h2>
              </div>
              <p className="text-xs text-slate-500">
                These are educational possibilities to consider and discuss with your healthcare provider. This is NOT a definitive diagnosis.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {result.possibleCauses.map((cause, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-900 text-sm">{cause.name}</h4>
                      {cause.likelihood && (
                        <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                          {cause.likelihood}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{cause.description}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Warning Signs & When to Seek Care */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Red Flag Warning Signs */}
              <div className="bg-white rounded-2xl p-6 border border-red-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-red-800 font-bold text-base border-b border-red-100 pb-3">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                  <h3>Red Flag Warning Signs</h3>
                </div>
                <ul className="space-y-2 text-xs sm:text-sm text-red-950">
                  {result.warningSigns.map((sign, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span className="text-red-500 font-bold">⚠</span>
                      <span>{sign}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* When to Seek Care */}
              <div className="bg-white rounded-2xl p-6 border border-amber-200 shadow-xs space-y-4">
                <div className="flex items-center gap-2 text-amber-800 font-bold text-base border-b border-amber-100 pb-3">
                  <Clock className="w-5 h-5 text-amber-600" />
                  <h3>When to Seek Medical Care</h3>
                </div>
                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                  {result.whenToSeekCare}
                </p>
              </div>
            </div>

            {/* What Information to Tell a Doctor */}
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-lg border-b border-slate-100 pb-3">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <h2>What Information to Tell Your Doctor</h2>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-700">
                {result.whatToTellDoctor.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>

              <div className="pt-4 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => onNavigate('appointment')}
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm shadow-sm inline-flex items-center justify-center gap-2"
                >
                  <span>Book Doctor Appointment</span>
                  <ArrowRight className="w-4 h-4" />
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
