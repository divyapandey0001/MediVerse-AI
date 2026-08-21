import React from 'react';
import {
  ShieldCheck,
  HeartHandshake,
  Cpu,
  Lock,
  Stethoscope,
  Sparkles,
  FileCheck,
  Users,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { DisclaimerBanner } from '../components/DisclaimerBanner.js';
import { SEOHead } from '../components/SEOHead.js';

interface AboutPageProps {
  onNavigate: (page: string) => void;
}

export const AboutPage: React.FC<AboutPageProps> = ({ onNavigate }) => {
  return (
    <div id="about-page" className="min-h-screen bg-[#f0f6fc] py-10 sm:py-16">
      <SEOHead
        title="About MediVerse AI - Advancing Accessible Healthcare Technology"
        description="Learn about the MediVerse mission: empowering patients and doctors with accurate OCR document extraction, clinical safety boundaries, and privacy-first AI."
        canonicalPath="/about"
        keywords="about MediVerse AI, digital health platform, healthcare AI mission, patient health literacy, clinical safety"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "name": "About MediVerse AI",
          "description": "Our mission to provide transparent, accessible, and privacy-first AI healthcare tools.",
          "url": "https://medi-verse-ai-wine.vercel.app/about"
        }}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-100 border border-blue-200 text-blue-800 text-xs font-semibold">
            <HeartHandshake className="w-3.5 h-3.5 text-blue-600" />
            <span>Advancing Health Literacy</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-slate-900 tracking-tight leading-tight">
            Demystifying Healthcare Information with AI
          </h1>
          <p className="text-slate-600 text-base sm:text-lg leading-relaxed">
            MediVerse is built on a simple premise: medical diagnostic documents and health terms should be transparent, understandable, and actionable for every patient and family.
          </p>
        </div>

        {/* Core Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-100/90 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 text-blue-600 flex items-center justify-center">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Document-Grounded OCR</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              We extract only what is physically printed on your lab document. Our system never invents phantom lab values or fills in unmeasured fields.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-100/90 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Clinical Safety First</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              MediVerse is designed as an educational bridge between patients and clinicians. We strictly avoid automated prescriptions, invasive treatment changes, or definitive diagnosing.
            </p>
          </div>

          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-blue-100/90 shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 text-purple-600 flex items-center justify-center">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">User Data Control</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              You maintain total authority over your medical history. You can remove or purge uploaded lab documents, calculated BMI values, and appointments at any time with zero retention.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-blue-100/90 shadow-sm space-y-8">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              How the MediVerse Engine Works
            </h2>
            <p className="text-slate-500 text-sm">
              From raw uploaded medical reports to structured clinical insights in seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center">
            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-sm shadow-sm shadow-blue-600/30">
                1
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Upload</h4>
              <p className="text-xs text-slate-500">
                Securely drop your blood test, metabolic panel, or lipid report.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-sm shadow-sm shadow-blue-600/30">
                2
              </div>
              <h4 className="font-bold text-slate-900 text-sm">OCR & Extract</h4>
              <p className="text-xs text-slate-500">
                High-precision OCR extracts test names, measured values, units, and references.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-sm shadow-sm shadow-blue-600/30">
                3
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Translate</h4>
              <p className="text-xs text-slate-500">
                AI translates dense medical jargon into clear, plain-language summaries.
              </p>
            </div>

            <div className="space-y-2">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto text-sm shadow-sm shadow-blue-600/30">
                4
              </div>
              <h4 className="font-bold text-slate-900 text-sm">Empower</h4>
              <p className="text-xs text-slate-500">
                Generates actionable questions for your next doctor consultation.
              </p>
            </div>
          </div>

          <div className="text-center pt-4">
            <button
              onClick={() => onNavigate('lab-report')}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-blue-600/20 inline-flex items-center gap-2 transition-all cursor-pointer"
            >
              <span>Try Lab Report Analysis</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        <DisclaimerBanner />
      </div>
    </div>
  );
};
