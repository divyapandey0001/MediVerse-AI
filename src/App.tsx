import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext.js';
import { Navbar } from './components/Navbar.js';
import { Footer } from './components/Footer.js';
import { HomePage } from './pages/HomePage.js';
import { LabReportPage } from './pages/LabReportPage.js';
import { SymptomCheckerPage } from './pages/SymptomCheckerPage.js';
import { MedicineInfoPage } from './pages/MedicineInfoPage.js';
import { BmiCalculatorPage } from './pages/BmiCalculatorPage.js';
import { AppointmentPage } from './pages/AppointmentPage.js';
import { HealthChatPage } from './pages/HealthChatPage.js';
import { ProfilePage } from './pages/ProfilePage.js';
import { PatientDashboard } from './pages/PatientDashboard.js';
import { DoctorDashboard } from './pages/DoctorDashboard.js';
import { LivePatientRecordPage } from './pages/LivePatientRecordPage.js';
import { AboutPage } from './pages/AboutPage.js';
import { ContactPage } from './pages/ContactPage.js';
import { LoginPage, SignUpPage, ForgotPasswordPage } from './pages/AuthPages.js';
import { MessageSquare } from 'lucide-react';
import { useAuth } from './context/AuthContext.js';

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
        {renderPage()}
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
