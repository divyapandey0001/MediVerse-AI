import React, { useState } from 'react';
import {
  FileCheck2,
  ShieldAlert,
  AlertTriangle,
  Scale,
  UserCheck,
  Ban,
  HelpCircle,
  Calendar,
  ArrowLeft,
  Printer,
  ChevronRight,
  BookOpen,
  Mail,
  Search,
  CheckCircle,
  Building,
  Gavel
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead.js';
import { DisclaimerBanner } from '../components/DisclaimerBanner.js';

interface TermsOfServicePageProps {
  onNavigate: (page: string) => void;
}

export const TermsOfServicePage: React.FC<TermsOfServicePageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('educational-scope');
  const lastUpdated = 'August 21, 2026';

  const sections = [
    { id: 'educational-scope', title: '1. Educational Purpose & Non-Diagnostic Scope', icon: ShieldAlert },
    { id: 'acceptance-eligibility', title: '2. Acceptance & User Eligibility', icon: UserCheck },
    { id: 'user-responsibilities', title: '3. User Responsibilities & Conduct', icon: CheckCircle },
    { id: 'prohibited-activities', title: '4. Prohibited Uses & Unlawful Activities', icon: Ban },
    { id: 'intellectual-property', title: '5. Intellectual Property & AI Content', icon: BookOpen },
    { id: 'limitation-liability', title: '6. Limitation of Liability & No Warranties', icon: Scale },
    { id: 'account-termination', title: '7. Account Termination & Suspension', icon: FileCheck2 },
    { id: 'governing-law', title: '8. Governing Law & Jurisdiction', icon: Gavel },
    { id: 'modifications', title: '9. Modifications to Terms', icon: Calendar },
    { id: 'contact-info', title: '10. Contact & Inquiries', icon: Mail }
  ];

  const filteredSections = searchQuery
    ? sections.filter((s) => s.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : sections;

  const scrollToSection = (id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6 lg:px-8">
      <SEOHead
        title="Terms of Service | MediVerse AI - Educational Health Intelligence"
        description="Review the Terms of Service for MediVerse AI. Understand our educational scope, user responsibilities, prohibited uses, and limitation of liability."
        canonicalPath="/terms-of-service"
        keywords="MediVerse terms of service, medical AI disclaimer, healthcare educational software terms, patient responsibilities"
      />

      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Navigation & Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-blue-600 mb-2">
              <button
                onClick={() => onNavigate('home')}
                className="hover:underline flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Home</span>
              </button>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-500">Legal</span>
              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-800">Terms of Service</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-600 text-white shadow-md shadow-indigo-500/20 inline-flex">
                <Scale className="w-7 h-7" />
              </div>
              <span>Terms of Service</span>
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Terms governing the use of MediVerse AI educational tools, lab report analysis, health records, and clinical interfaces.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 text-slate-700 rounded-lg text-xs font-medium border border-slate-200">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Effective: {lastUpdated}</span>
            </div>
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
              title="Print Terms"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print Document</span>
            </button>
          </div>
        </div>

        {/* Critical Medical Warning Callout */}
        <div className="bg-red-950 text-red-100 rounded-2xl p-5 sm:p-6 border border-red-900 shadow-sm space-y-3">
          <div className="flex items-center gap-2.5 text-red-400 font-bold text-sm tracking-wide uppercase">
            <ShieldAlert className="w-5 h-5 text-red-400 shrink-0" />
            <span>Critical Notice: Strictly For Educational Purposes Only</span>
          </div>
          <p className="text-xs sm:text-sm text-red-100/90 leading-relaxed">
            MediVerse AI provides automated algorithmic synthesis of health information to enhance patient health literacy and document comprehension. <strong>MediVerse does NOT provide medical diagnoses, treatment plans, prescriptions, or clinical triage.</strong> It is not a substitute for the clinical judgment of a licensed medical practitioner.
          </p>
          <div className="pt-2 border-t border-red-900/60 flex flex-wrap items-center gap-4 text-xs font-semibold text-red-300">
            <span>🚨 In a Medical Emergency, immediately dial:</span>
            <span className="text-white bg-red-900/80 px-2.5 py-1 rounded-md border border-red-700">US/CA: 911</span>
            <span className="text-white bg-red-900/80 px-2.5 py-1 rounded-md border border-red-700">UK: 999</span>
            <span className="text-white bg-red-900/80 px-2.5 py-1 rounded-md border border-red-700">EU/INT: 112</span>
          </div>
        </div>

        {/* Main Grid: Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Quick Jump Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm sticky top-20 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Table of Contents</span>
                <span className="text-[11px] font-normal text-indigo-600">{sections.length} Sections</span>
              </h2>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter terms..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white"
                />
              </div>

              {/* Jump Links */}
              <nav className="space-y-1 max-h-[50vh] overflow-y-auto pr-1">
                {filteredSections.map((sec) => {
                  const Icon = sec.icon;
                  const isActive = activeSection === sec.id;
                  return (
                    <button
                      key={sec.id}
                      onClick={() => scrollToSection(sec.id)}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium flex items-center gap-2.5 transition-all cursor-pointer ${
                        isActive
                          ? 'bg-indigo-600 text-white shadow-sm font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{sec.title}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Summary Points */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Nature:</span>
                  <span className="font-semibold text-amber-600">Educational Software</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Medical Advice:</span>
                  <span className="font-semibold text-rose-600">Not Provided</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Account Control:</span>
                  <span className="font-semibold text-emerald-600">Full Self-Service</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms Detail Sections */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Educational Purpose & Non-Diagnostic Scope */}
            <section id="educational-scope" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-red-50 text-red-600">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">1. Educational Purpose & Non-Diagnostic Scope</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  MediVerse AI is designed and maintained exclusively as an <strong>educational tool, document organizer, and informational resource</strong>. By using this service, you understand and explicitly agree to the following:
                </p>

                <div className="space-y-2.5 mt-2">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <strong className="text-slate-900 block mb-1">A. No Doctor-Patient Relationship</strong>
                    No doctor-patient, fiduciary, or confidential clinical relationship is created between you and MediVerse, its developers, or its automated models by accessing this site or uploading files.
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <strong className="text-slate-900 block mb-1">B. No Direct Medical Diagnosis or Prescriptions</strong>
                    AI outputs (such as biomarker severity ratings, possible conditions, food guidance, or drug information) are generated through statistical pattern synthesis and natural language processing. They do not constitute a clinical diagnosis or definitive medical opinion.
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700">
                    <strong className="text-slate-900 block mb-1">C. Mandatory Physician Verification</strong>
                    Never disregard professional medical advice, delay seeking an in-person clinical assessment, or modify prescription dosages based on information displayed on or generated by MediVerse AI.
                  </div>
                </div>
              </div>
            </section>

            {/* 2. Acceptance & User Eligibility */}
            <section id="acceptance-eligibility" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <UserCheck className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">2. Acceptance & User Eligibility</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  By creating an account, browsing the website, or accessing any MediVerse tools, you agree to be legally bound by these Terms of Service and our Privacy Policy.
                </p>
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-5">
                  <li><strong>Age Requirement:</strong> You must be at least 18 years of age (or the legal age of majority in your jurisdiction) to create an account, or have the explicit consent and supervision of a legal guardian.</li>
                  <li><strong>Account Security:</strong> You are responsible for safeguarding your login credentials and are solely liable for all activities occurring under your authenticated session.</li>
                </ul>
              </div>
            </section>

            {/* 3. User Responsibilities */}
            <section id="user-responsibilities" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">3. User Responsibilities & Conduct</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>When utilizing MediVerse AI, you agree to uphold the following user standards:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <h3 className="font-bold text-slate-900 text-xs">Accurate Submissions</h3>
                    <p className="text-xs text-slate-600">Provide truthful, legitimate health information and uncorrupted document scans for educational analysis.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                    <h3 className="font-bold text-slate-900 text-xs">Independent Judgment</h3>
                    <p className="text-xs text-slate-600">Acknowledge that AI summaries must always be corroborated with licensed healthcare professionals.</p>
                  </div>
                </div>
              </div>
            </section>

            {/* 4. Prohibited Uses */}
            <section id="prohibited-activities" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Ban className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">4. Prohibited Uses & Unlawful Activities</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>You strictly agree that you will NOT engage in any of the following activities:</p>
                
                <div className="space-y-2 mt-2">
                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-950 text-xs space-y-1">
                    <strong className="block font-bold">1. Uploading Third-Party Medical Data Without Consent:</strong>
                    Uploading, analyzing, or storing health records, blood reports, or clinical notes belonging to another individual without their verifiable legal authorization or power of attorney.
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-950 text-xs space-y-1">
                    <strong className="block font-bold">2. Fraudulent Clinical Claims or Fake Prescriptions:</strong>
                    Attempting to forge digital prescriptions, impersonate licensed medical practitioners, or submit false medical claims.
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-950 text-xs space-y-1">
                    <strong className="block font-bold">3. System Abuse & AI Exploitation:</strong>
                    Attempting prompt injections, jailbreaks, API rate limit bypassing, denial-of-service attacks, automated web scraping, or reverse engineering proprietary codebase logic.
                  </div>

                  <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-200 text-rose-950 text-xs space-y-1">
                    <strong className="block font-bold">4. Unlawful Medical Practice:</strong>
                    Using MediVerse to practice telemedicine without requisite state or national clinical licenses.
                  </div>
                </div>
              </div>
            </section>

            {/* 5. Intellectual Property */}
            <section id="intellectual-property" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <BookOpen className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">5. Intellectual Property & AI Content</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  The platform interface, branding, algorithms, visual styles, and UI components are the intellectual property of MediVerse AI and its licensors.
                </p>
                <p className="text-xs text-slate-600">
                  <strong>User Content Ownership:</strong> You retain all ownership rights to the raw medical files and documents you upload. MediVerse does not claim intellectual property rights over your personal health records.
                </p>
              </div>
            </section>

            {/* 6. Limitation of Liability */}
            <section id="limitation-liability" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Scale className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">6. Limitation of Liability & No Warranties</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <div className="p-4 bg-slate-100 rounded-xl border border-slate-200 text-xs text-slate-800 space-y-2 uppercase font-medium">
                  <p>
                    MEDIVERSE AI IS PROVIDED ON AN &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; BASIS WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR ACCURACY OF MEDICAL INTERPRETATION.
                  </p>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  To the maximum extent permitted by applicable law, in no event shall MediVerse, its creators, contributors, service providers, or affiliates be liable for any direct, indirect, incidental, special, consequential, or punitive damages, including personal injury, emotional distress, lost records, or medical complications arising out of or in connection with the use or inability to use this platform.
                </p>
              </div>
            </section>

            {/* 7. Account Termination */}
            <section id="account-termination" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <FileCheck2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">7. Account Termination & Suspension</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  We reserve the right to suspend or terminate your account and restrict access to MediVerse AI at our sole discretion, without prior notice, if we believe you have violated these Terms of Service or engaged in abusive or harmful conduct.
                </p>
                <p className="text-xs text-slate-600">
                  You may close and delete your account at any time from your account settings, which initiates permanent removal of your stored documents in accordance with our Privacy Policy.
                </p>
              </div>
            </section>

            {/* 8. Governing Law Placeholder */}
            <section id="governing-law" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Gavel className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">8. Governing Law & Jurisdiction</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  These Terms of Service shall be governed by and construed in accordance with the applicable laws of the jurisdiction in which the service operates, without regard to its conflict of law provisions.
                </p>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600">
                  <span className="font-semibold text-slate-900 block mb-1">Jurisdiction Clause:</span>
                  Any disputes or legal proceedings arising out of or related to these terms shall be subject to the exclusive jurisdiction of the competent courts of the applicable operating authority.
                </div>
              </div>
            </section>

            {/* 9. Modifications to Terms */}
            <section id="modifications" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Calendar className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">9. Modifications to Terms</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  We reserve the right to revise or update these Terms of Service at any time. When changes are made, the revised date at the top of this document will be updated. Your continued use of MediVerse following published revisions constitutes acceptance of the modified terms.
                </p>
              </div>
            </section>

            {/* 10. Contact */}
            <section id="contact-info" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">10. Contact & Inquiries</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>For questions or inquiries regarding these Terms of Service, please contact:</p>
                
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">Email:</span>
                    <a href="mailto:divyapandey30bst@gmail.com" className="text-blue-600 hover:underline">
                      divyapandey30bst@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">Support Desk:</span>
                    <button onClick={() => onNavigate('contact')} className="text-blue-600 hover:underline cursor-pointer">
                      MediVerse Contact Form
                    </button>
                  </div>
                </div>
              </div>
            </section>

          </div>

        </div>

        {/* Global Medical Disclaimer Banner */}
        <DisclaimerBanner />

        {/* Footer Quick Links */}
        <div className="pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} MediVerse AI. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <button onClick={() => onNavigate('privacy-policy')} className="hover:text-blue-600 hover:underline cursor-pointer">
              Privacy Policy
            </button>
            <span>•</span>
            <button onClick={() => onNavigate('about')} className="hover:text-blue-600 hover:underline cursor-pointer">
              About MediVerse
            </button>
            <span>•</span>
            <button onClick={() => onNavigate('contact')} className="hover:text-blue-600 hover:underline cursor-pointer">
              Support
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
