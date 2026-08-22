import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  Database,
  Server,
  KeyRound,
  FileText,
  UserX,
  Mail,
  AlertTriangle,
  Cookie,
  Cpu,
  ArrowLeft,
  Printer,
  Calendar,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ChevronRight,
  Search
} from 'lucide-react';
import { SEOHead } from '../components/SEOHead.js';
import { DisclaimerBanner } from '../components/DisclaimerBanner.js';

interface PrivacyPolicyPageProps {
  onNavigate: (page: string) => void;
}

export const PrivacyPolicyPage: React.FC<PrivacyPolicyPageProps> = ({ onNavigate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSection, setActiveSection] = useState<string>('intro');
  const lastUpdated = 'August 21, 2026';

  const sections = [
    { id: 'intro', title: '1. Introduction & Educational Scope', icon: FileText },
    { id: 'data-collected', title: '2. What Data We Collect', icon: Database },
    { id: 'storage-security', title: '3. Data Storage & Security Architecture', icon: Lock },
    { id: 'third-parties', title: '4. Third-Party Services & AI Inference', icon: Cpu },
    { id: 'retention-deletion', title: '5. Data Retention & Account Deletion', icon: UserX },
    { id: 'cookies-analytics', title: '6. Cookies & Tracking Technologies', icon: Cookie },
    { id: 'user-rights', title: '7. Your Privacy Rights & Controls', icon: CheckCircle2 },
    { id: 'contact', title: '8. Contact & Privacy Inquiries', icon: Mail },
    { id: 'legal-disclaimer', title: '9. Legal Notice & Disclaimer', icon: AlertTriangle }
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
        title="Privacy Policy | MediVerse AI - Educational Health Intelligence"
        description="Learn how MediVerse AI collects, protects, stores, and handles medical documents, account credentials, and health data with owner-level security rules."
        canonicalPath="/privacy-policy"
        keywords="MediVerse privacy policy, medical data protection, healthcare AI privacy, Firebase security rules, patient health data confidentiality"
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
              <span className="text-slate-800">Privacy Policy</span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20 inline-flex">
                <Lock className="w-7 h-7" />
              </div>
              <span>Privacy Policy</span>
            </h1>
            <p className="mt-2 text-sm text-slate-600 max-w-2xl">
              Transparent disclosures on how MediVerse AI collects, protects, and stores user information, medical documents, and AI interactions.
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
              title="Print Policy"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">Print Document</span>
            </button>
          </div>
        </div>

        {/* Legal Disclaimer Box */}
        <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 sm:p-5 flex items-start gap-3.5 text-blue-950">
          <div className="p-2 bg-blue-600 text-white rounded-xl shrink-0 mt-0.5 shadow-sm">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div className="space-y-1 text-xs sm:text-sm">
            <h3 className="font-bold text-blue-950">Privacy & Data Custody Notice</h3>
            <p className="text-blue-900/80 leading-relaxed">
              MediVerse AI is an educational healthcare intelligence platform designed to foster health literacy and accessible medical document comprehension. <strong>We do not sell, rent, or monetize your personal medical data.</strong> All stored health records are protected by owner-level access rules in Firebase Firestore and Cloud Storage.
            </p>
          </div>
        </div>

        {/* Main Grid: Sidebar + Content */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Quick Jump Sidebar */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm sticky top-20 space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                <span>Table of Contents</span>
                <span className="text-[11px] font-normal text-blue-600">{sections.length} Sections</span>
              </h2>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
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
                          ? 'bg-blue-600 text-white shadow-sm font-semibold'
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                      <span className="truncate">{sec.title}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Summary Metrics */}
              <div className="pt-4 border-t border-slate-100 space-y-2 text-[11px] text-slate-500">
                <div className="flex items-center justify-between">
                  <span>Owner Isolation:</span>
                  <span className="font-semibold text-emerald-600">Strict UID Matching</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Encryption:</span>
                  <span className="font-semibold text-slate-800">TLS 1.3 & AES-256</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Data Commercialization:</span>
                  <span className="font-semibold text-rose-600">Zero / Never Sold</span>
                </div>
              </div>
            </div>
          </div>

          {/* Policy Detail Sections */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* 1. Introduction */}
            <section id="intro" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <FileText className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">1. Introduction & Educational Scope</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  Welcome to <strong>MediVerse AI</strong> (&quot;MediVerse&quot;, &quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). MediVerse operates as an educational and interactive digital healthcare platform offering automated laboratory report breakdown, symptom triage guidance, medicine information exploration, digital prescriptions, and longitudinal wellness tracking.
                </p>
                <p>
                  We are deeply committed to safeguarding your privacy and ensuring maximum transparency regarding how your data is ingested, processed, and preserved. This Privacy Policy explains our data practices when you visit our website, register for an account, submit text or files to our AI tools, and utilize our patient or physician portals.
                </p>
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p>
                    <strong>Notice:</strong> This policy applies to all MediVerse web applications, APIs, and associated services. Please read this document carefully before interacting with our AI features or uploading medical documents.
                  </p>
                </div>
              </div>
            </section>

            {/* 2. What Data We Collect */}
            <section id="data-collected" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Database className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">2. What Data We Collect</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>We collect information you explicitly provide to us as well as automatic telemetry necessary for platform operation:</p>
                
                <div className="space-y-3 mt-3">
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-700">A. Account & Identity Information</h3>
                    <p className="text-xs text-slate-600">
                      When you register or log in via <strong>Firebase Authentication</strong> (email/password or Google Single Sign-On), we securely store your name, email address, assigned patient/doctor ID, role type, and cryptographic authentication tokens. We never store plain-text passwords.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-700">B. Uploaded Medical & Lab Reports</h3>
                    <p className="text-xs text-slate-600">
                      When you upload documents (PDFs, scan images, test reports) into the Lab Report Analyzer or Patient Portal, the file is processed through our OCR and multi-modal pipeline to extract clinical biomarkers, reference ranges, and test parameters for your personalized dashboard.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-700">C. User Symptoms & Interactive Clinical Inputs</h3>
                    <p className="text-xs text-slate-600">
                      Information you type into the Symptom Checker, Medicine Explorer, BMI Tracker, or AI Health Assistant Chat (such as symptom duration, severity, age group, medications, and wellness notes) is processed to generate contextual educational guidance.
                    </p>
                  </div>

                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider text-blue-700">D. Technical & Usage Analytics</h3>
                    <p className="text-xs text-slate-600">
                      Through <strong>Google Analytics</strong> (Measurement ID: <code>G-CCLDSHRY3R</code>), we collect aggregated, non-personally identifiable metrics including browser type, operating system, pages visited, session duration, and interface interactions to enhance application performance and resolve bugs.
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Storage & Security Architecture */}
            <section id="storage-security" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Lock className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">3. Data Storage & Security Architecture</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  We prioritize health data isolation and modern cloud security protocols. All data persistence is handled by Google Cloud Platform infrastructure:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Server className="w-4 h-4 text-emerald-600" />
                      <span>Firebase Firestore</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Structured data including user profiles, lab metrics, BMI logs, and appointments are stored in Firestore with granular document rules.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                    <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                      <Database className="w-4 h-4 text-emerald-600" />
                      <span>Firebase Cloud Storage</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Uploaded raw medical files (PDFs, images) are stored in secure buckets partitioned under user-specific path identifiers (<code>medical-records/&#123;userId&#125;/*</code>).
                    </p>
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 space-y-2 mt-4">
                  <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wider text-emerald-900">
                    <KeyRound className="w-4 h-4 text-emerald-700" />
                    <span>Owner-Level Security Rules (RBAC)</span>
                  </div>
                  <p className="text-xs text-emerald-900/90 leading-relaxed">
                    Our database and storage infrastructure enforce strict <strong>owner-level security rules</strong>. A user&apos;s data is exclusively queryable and accessible when the authenticated request token&apos;s <code>request.auth.uid</code> matches the document or folder owner UID. Cross-tenant access is prohibited at the database engine level.
                  </p>
                </div>
              </div>
            </section>

            {/* 4. Third-Party Services */}
            <section id="third-parties" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Cpu className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">4. Third-Party Services & AI Processing</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>To provide high-reliability services, MediVerse integrates with select enterprise cloud partners:</p>

                <ul className="space-y-2 text-xs text-slate-700 list-disc pl-5">
                  <li>
                    <strong>Google Firebase (Google LLC):</strong> Used for secure user authentication, Firestore NoSQL cloud database storage, and Cloud Storage for documents.
                  </li>
                  <li>
                    <strong>Google Analytics:</strong> Used strictly for anonymized website traffic and feature utilization telemetry to optimize page performance.
                  </li>
                  <li>
                    <strong>Google Gemini / Vertex AI (Cloud Run Server API):</strong> Health questions, report texts, and symptom descriptions are transmitted securely to our server-side API proxy (which utilizes Google GenAI TypeScript SDK). Prompts are processed ephemerally to generate explanations and are not used to train public generative models.
                  </li>
                  <li>
                    <strong>Cloudinary CDN:</strong> Delivers optimized, compressed static educational media and responsive posters with high-efficiency edge caching.
                  </li>
                </ul>

                <p className="text-xs text-slate-500 italic mt-2">
                  We do not embed third-party advertising SDKs, behavioral ad tracking pixels, or data brokerage widgets.
                </p>
              </div>
            </section>

            {/* 5. Retention & Deletion */}
            <section id="retention-deletion" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <UserX className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">5. Data Retention & Account Deletion</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  You retain full ownership and sovereignty over your health information. You can exercise your right to access, export, or delete your data at any time:
                </p>

                <div className="space-y-2 mt-2">
                  <div className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Individual Report Deletion:</strong> You can delete specific lab reports, BMI entries, or saved prescriptions directly from your Patient Dashboard with immediate cascade deletion in Firestore.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Complete Account Purge:</strong> You may submit an account and complete data deletion request via the Profile settings page or by contacting our team. Upon verification, all associated Firestore documents, files in Storage, and Auth identities are permanently expunged within 30 days.
                    </span>
                  </div>
                  <div className="flex items-start gap-2 text-xs text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Guest Sessions:</strong> Users who analyze reports or use the symptom checker without logging in operate in transient browser memory; inputs are not stored in persistent database user collections.
                    </span>
                  </div>
                </div>
              </div>
            </section>

            {/* 6. Cookies & Tracking */}
            <section id="cookies-analytics" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Cookie className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">6. Cookies & Tracking Technologies</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>MediVerse utilizes minimal cookies and local browser storage strictly required for platform operation:</p>

                <div className="overflow-x-auto mt-3">
                  <table className="min-w-full text-xs text-left border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 font-semibold">
                      <tr>
                        <th className="py-2.5 px-3 border-b border-slate-200">Cookie / Storage Key</th>
                        <th className="py-2.5 px-3 border-b border-slate-200">Category</th>
                        <th className="py-2.5 px-3 border-b border-slate-200">Purpose</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 text-slate-600">
                      <tr>
                        <td className="py-2 px-3 font-mono font-medium text-slate-800">mediverse_token</td>
                        <td className="py-2 px-3">Essential / Auth</td>
                        <td className="py-2 px-3">Maintains secure user session authentication</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-medium text-slate-800">_ga, _ga_*</td>
                        <td className="py-2 px-3">Analytics</td>
                        <td className="py-2 px-3">Google Analytics anonymous telemetry</td>
                      </tr>
                      <tr>
                        <td className="py-2 px-3 font-mono font-medium text-slate-800">mediverse_reports_cache</td>
                        <td className="py-2 px-3">Functional</td>
                        <td className="py-2 px-3">Client-side caching for fast offline report viewing</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <p className="text-xs text-slate-600 mt-2">
                  You can configure your browser to reject cookies or notify you when cookies are being sent. Note that disabling essential authentication cookies will prevent logging in to your patient portal.
                </p>
              </div>
            </section>

            {/* 7. Your Privacy Rights */}
            <section id="user-rights" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">7. Your Privacy Rights & Controls</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>Depending on your jurisdiction (such as GDPR in Europe or CCPA/CPRA in California), you possess fundamental rights regarding your personal information:</p>
                
                <ul className="space-y-1.5 text-xs text-slate-700 list-disc pl-5">
                  <li><strong>Right to Access:</strong> Request a comprehensive export of all health records and profile details associated with your account.</li>
                  <li><strong>Right to Rectification:</strong> Edit and update your personal details, vitals, and profile entries.</li>
                  <li><strong>Right to Erasure (&quot;Right to be Forgotten&quot;):</strong> Request permanent deletion of all documents, logs, and account credentials.</li>
                  <li><strong>Right to Restrict Processing:</strong> Opt out of non-essential analytics tracking.</li>
                  <li><strong>Non-Discrimination:</strong> MediVerse will never deny services or charge differing rates for exercising your privacy rights.</li>
                </ul>
              </div>
            </section>

            {/* 8. Contact Information */}
            <section id="contact" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Mail className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">8. Contact & Privacy Inquiries</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <p>
                  If you have questions, concerns, feedback, or formal data requests concerning this Privacy Policy or our security practices, please contact our designated privacy team:
                </p>

                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">Privacy Support Email:</span>
                    <a href="mailto:divyapandey30bst@gmail.com" className="text-blue-600 hover:underline">
                      divyapandey30bst@gmail.com
                    </a>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">General Inquiries:</span>
                    <button onClick={() => onNavigate('contact')} className="text-blue-600 hover:underline cursor-pointer">
                      MediVerse Contact Center
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900">Platform:</span>
                    <span>MediVerse AI Healthcare Technologies</span>
                  </div>
                </div>
              </div>
            </section>

            {/* 9. Legal Notice Disclaimer */}
            <section id="legal-disclaimer" className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-7 shadow-sm space-y-4">
              <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <h2 className="text-xl font-bold text-slate-900">9. Legal Notice & Disclaimer</h2>
              </div>
              <div className="prose prose-sm text-slate-600 leading-relaxed space-y-3">
                <div className="p-4 bg-amber-50/80 rounded-xl border border-amber-200 text-amber-950 text-xs space-y-2">
                  <p className="font-bold">Important Notice Regarding Legal Advice:</p>
                  <p className="leading-relaxed">
                    This Privacy Policy is a generalized public disclosure of technical architecture, data handling practices, and platform policies for MediVerse AI. <strong>It is provided for informational and transparency purposes and does not constitute formal legal advice or substitute for consultation with licensed legal counsel.</strong> Privacy regulations vary by state, country, and clinical regulatory framework.
                  </p>
                </div>
                <p className="text-xs text-slate-500">
                  By using MediVerse AI, you acknowledge that you have read, understood, and agreed to the data practices described in this Privacy Policy and our associated Terms of Service.
                </p>
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
            <button onClick={() => onNavigate('terms-of-service')} className="hover:text-blue-600 hover:underline cursor-pointer">
              Terms of Service
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
