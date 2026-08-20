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
import { AboutPage } from './pages/AboutPage.js';
import { ContactPage } from './pages/ContactPage.js';
import { LivePatientRecordPage } from './pages/LivePatientRecordPage.js';
import { LoginPage, SignUpPage, ForgotPasswordPage } from './pages/AuthPages.js';
import { MessageSquare } from 'lucide-react';
import { useAuth } from './context/AuthContext.js';

function AppContent() {
  const [currentPage, setCurrentPage] = useState<string>('home');
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentPage]);

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
      case 'services':
      case 'reviews':
        return <HomePage onNavigate={setCurrentPage} />;
      case 'lab-report':
        return <LabReportPage onNavigate={setCurrentPage} />;
      case 'symptom-checker':
      case 'symptoms':
        return <SymptomCheckerPage onNavigate={setCurrentPage} />;
      case 'medicine-info':
      case 'medicine':
        return <MedicineInfoPage onNavigate={setCurrentPage} />;
      case 'bmi':
        return <BmiCalculatorPage onNavigate={setCurrentPage} />;
      case 'appointment':
      case 'appointments':
        return <AppointmentPage onNavigate={setCurrentPage} />;
      case 'ai-chat':
        return <HealthChatPage onNavigate={setCurrentPage} />;
      case 'live-records':
      case 'patient-records':
      case 'live-record':
        return <LivePatientRecordPage onNavigate={setCurrentPage} />;
      case 'patient-dashboard':
        return <PatientDashboard onNavigate={setCurrentPage} />;
      case 'doctor-dashboard':
        return <DoctorDashboard onNavigate={setCurrentPage} />;
      case 'profile':
        if (user?.role === 'doctor') {
          return <DoctorDashboard onNavigate={setCurrentPage} />;
        }
        return <PatientDashboard onNavigate={setCurrentPage} />;
      case 'about':
        return <AboutPage onNavigate={setCurrentPage} />;
      case 'contact':
        return <ContactPage />;
      case 'login':
        return <LoginPage onNavigate={setCurrentPage} />;
      case 'signup':
        return <SignUpPage onNavigate={setCurrentPage} />;
      case 'forgot-password':
        return <ForgotPasswordPage onNavigate={setCurrentPage} />;
      default:
        return <HomePage onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900 selection:bg-blue-100 selection:text-blue-900">
      <Navbar currentPage={currentPage} onNavigate={setCurrentPage} />

      <main className="flex-1">
        {renderPage()}
      </main>

      {/* Floating Quick Action for AI Chat (when not on AI Chat page) */}
      {currentPage !== 'ai-chat' && (
        <aside aria-label="Quick AI Health Assistant" className="no-print">
          <button
            onClick={() => setCurrentPage('ai-chat')}
            className="fixed bottom-6 right-6 z-40 bg-blue-600 hover:bg-blue-700 text-white p-3.5 sm:px-5 sm:py-3.5 rounded-full shadow-lg shadow-blue-600/30 flex items-center gap-2.5 transition-all transform hover:scale-105 active:scale-95"
            title="Ask AI Health Assistant"
          >
            <MessageSquare className="w-5 h-5" />
            <span className="hidden sm:inline font-semibold text-sm">Ask MediVerse AI</span>
          </button>
        </aside>
      )}

      <Footer onNavigate={setCurrentPage} />
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
