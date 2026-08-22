import React, { useState, useEffect, Suspense, lazy } from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { HomePage } from './pages/HomePage.js';
import { MessageSquare } from 'lucide-react';
import { useAuth } from './context/AuthContext.js';

// Code-split route components to prevent unused JavaScript and heavy initial payloads
const LabReportPage = lazy(() => import('./pages/LabReportPage.js').then(m => ({ default: m.LabReportPage })));
const SymptomCheckerPage = lazy(() => import('./pages/SymptomCheckerPage.js').then(m => ({ default: m.SymptomCheckerPage })));
const MedicineInfoPage = lazy(() => import('./pages/MedicineInfoPage.js').then(m => ({ default: m.MedicineInfoPage })));
const BmiCalculatorPage = lazy(() => import('./pages/BmiCalculatorPage.js').then(m => ({ default: m.BmiCalculatorPage })));
const AppointmentPage = lazy(() => import('./pages/AppointmentPage.js').then(m => ({ default: m.AppointmentPage })));
const HealthChatPage = lazy(() => import('./pages/HealthChatPage.js').then(m => ({ default: m.HealthChatPage })));
const PatientDashboard = lazy(() => import('./pages/PatientDashboard.js').then(m => ({ default: m.PatientDashboard })));
const DoctorDashboard = lazy(() => import('./pages/DoctorDashboard.js').then(m => ({ default: m.DoctorDashboard })));
const LivePatientRecordPage = lazy(() => import('./pages/LivePatientRecordPage.js').then(m => ({ default: m.LivePatientRecordPage })));
const AboutPage = lazy(() => import('./pages/AboutPage.js').then(m => ({ default: m.AboutPage })));
const ContactPage = lazy(() => import('./pages/ContactPage.js').then(m => ({ default: m.ContactPage })));
const PrivacyPolicyPage = lazy(() => import('./pages/PrivacyPolicyPage.js').then(m => ({ default: m.PrivacyPolicyPage })));
const TermsOfServicePage = lazy(() => import('./pages/TermsOfServicePage.js').then(m => ({ default: m.TermsOfServicePage })));
const LoginPage = lazy(() => import('./pages/AuthPages.js').then(m => ({ default: m.LoginPage })));
const SignUpPage = lazy(() => import('./pages/AuthPages.js').then(m => ({ default: m.SignUpPage })));
const ForgotPasswordPage = lazy(() => import('./pages/AuthPages.js').then(m => ({ default: m.ForgotPasswordPage })));

const PageLoadingFallback: React.FC = () => (
  <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3">
    <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
    <span className="text-xs font-medium text-slate-500 tracking-wide uppercase">Loading MediVerse...</span>
  </div>
);

function AppContent() {
  const [currentPage, setCurrentPage] = useState<string>(() => {
    if (typeof window === 'undefined') return 'home';
    const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
    return path || 'home';
  });
  const { user } = useAuth();

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    const targetPath = page === 'home' ? '/' : `/${page}`;
    if (window.location.pathname !== targetPath) {
      window.history.pushState({ page }, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.replace(/^\/+|\/+$/g, '');
      setCurrentPage(path || 'home');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
      case 'services':
      case 'reviews':
        return <HomePage onNavigate={handleNavigate} />;
      case 'lab-report':
        return <LabReportPage onNavigate={handleNavigate} />;
      case 'symptom-checker':
      case 'symptoms':
        return <SymptomCheckerPage onNavigate={handleNavigate} />;
      case 'medicine-info':
      case 'medicine':
        return <MedicineInfoPage onNavigate={handleNavigate} />;
      case 'bmi':
        return <BmiCalculatorPage onNavigate={handleNavigate} />;
      case 'appointment':
      case 'appointments':
        return <AppointmentPage onNavigate={handleNavigate} />;
      case 'ai-chat':
        return <HealthChatPage onNavigate={handleNavigate} />;
      case 'patient-dashboard':
        return <PatientDashboard onNavigate={handleNavigate} />;
      case 'doctor-dashboard':
        return <DoctorDashboard onNavigate={handleNavigate} />;
      case 'live-patient-record':
      case 'live-ehr':
      case 'patient-record':
        return <LivePatientRecordPage onNavigate={handleNavigate} />;
      case 'profile':
        if (user?.role === 'doctor') {
          return <DoctorDashboard onNavigate={handleNavigate} />;
        }
        return <PatientDashboard onNavigate={handleNavigate} />;
      case 'about':
        return <AboutPage onNavigate={handleNavigate} />;
      case 'contact':
        return <ContactPage />;
      case 'privacy-policy':
      case 'privacy':
        return <PrivacyPolicyPage onNavigate={handleNavigate} />;
      case 'terms-of-service':
      case 'terms':
      case 'terms-and-conditions':
        return <TermsOfServicePage onNavigate={handleNavigate} />;
      case 'login':
        return <LoginPage onNavigate={handleNavigate} />;
      case 'signup':
        return <SignUpPage onNavigate={handleNavigate} />;
      case 'forgot-password':
        return <ForgotPasswordPage onNavigate={handleNavigate} />;
      default:
        return <HomePage onNavigate={handleNavigate} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar currentPage={currentPage} onNavigate={handleNavigate} />

      <main className="flex-1">
        <Suspense fallback={<PageLoadingFallback />}>
          {renderPage()}
        </Suspense>
      </main>

      {/* Floating Quick Action for AI Chat (when not on AI Chat page) */}
      {currentPage !== 'ai-chat' && (
        <aside aria-label="Quick AI Health Assistant" className="no-print">
          <button
            onClick={() => handleNavigate('ai-chat')}
            className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-lg shadow-blue-600/30 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95 cursor-pointer"
            title="Ask AI Health Assistant"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="hidden sm:inline font-semibold text-sm">Ask MediVerse AI</span>
          </button>
        </aside>
      )}

      <Footer onNavigate={handleNavigate} />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
