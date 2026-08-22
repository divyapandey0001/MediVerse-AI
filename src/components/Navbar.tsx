import React, { useState } from 'react';
import {
  Activity,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ChevronRight,
  FileText,
  Stethoscope,
  Pill,
  Calculator,
  Calendar,
  MessageSquare
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';

interface NavbarProps {
  currentPage: string;
  onNavigate: (page: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentPage, onNavigate }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showToolsSubmenu, setShowToolsSubmenu] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    setMobileMenuOpen(false);
    await logout();
    onNavigate('home');
    if (typeof window !== 'undefined') {
      window.history.replaceState({ page: 'home' }, '', '/');
    }
  };

  const handleNav = (target: string) => {
    setMobileMenuOpen(false);
    setShowToolsSubmenu(false);

    if (target === 'services') {
      if (currentPage === 'home') {
        const el = document.getElementById('services-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      onNavigate('home');
      setTimeout(() => {
        const el = document.getElementById('services-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    if (target === 'reviews') {
      if (currentPage === 'home') {
        const el = document.getElementById('reviews-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      onNavigate('home');
      setTimeout(() => {
        const el = document.getElementById('reviews-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    if (target === 'contact') {
      if (currentPage === 'home') {
        const el = document.getElementById('contact-section');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          return;
        }
      }
      onNavigate('contact');
      return;
    }

    onNavigate(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navItems = [
    { id: 'home', label: 'Home' },
    { id: 'services', label: 'Services' },
    { id: 'blog', label: 'Blog' },
    { id: 'about', label: 'About' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'contact', label: 'Contact' },
  ];

  const directTools = [
    { id: 'live-patient-record', label: 'Live Patient Health Record', icon: Activity },
    { id: 'lab-report', label: 'AI Lab Report Analysis', icon: FileText },
    { id: 'symptom-checker', label: 'Symptom Checker', icon: Stethoscope },
    { id: 'medicine-info', label: 'Medicine Information', icon: Pill },
    { id: 'bmi', label: 'BMI Calculator', icon: Calculator },
    { id: 'appointment', label: 'Doctor Appointment', icon: Calendar },
    { id: 'ai-chat', label: 'AI Health Chat', icon: MessageSquare },
  ];

  return (
    <header id="main-header" className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-blue-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          
          {/* Left: Brand Logo & Subtitle */}
          <div
            id="nav-brand-logo"
            onClick={() => handleNav('home')}
            className="flex items-center gap-3 cursor-pointer group select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:bg-blue-700 transition-colors">
              <Activity className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900 block leading-tight">
                Medi<span className="text-blue-600">Verse</span>
              </span>
              <span className="text-[11px] tracking-normal text-slate-500 font-medium block">
                AI Powered Healthcare Platform
              </span>
            </div>
          </div>

          {/* Center / Nav: Home, Services, Blog, About, Reviews, Contact */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            {navItems.map(item => {
              const isActive = item.id === 'blog'
                ? (currentPage === 'blog' || currentPage.startsWith('blog/'))
                : currentPage === item.id;
              return (
                <button
                  key={item.id}
                  id={`nav-link-${item.id}`}
                  onClick={() => handleNav(item.id)}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'text-blue-600 bg-blue-50/80 font-semibold'
                      : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right: Login / Sign Up or User Profile */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  id="nav-user-profile-btn"
                  onClick={() => handleNav(user.role === 'doctor' ? 'doctor-dashboard' : 'patient-dashboard')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                    currentPage === 'doctor-dashboard' || currentPage === 'patient-dashboard' || currentPage === 'profile'
                      ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/20'
                      : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  }`}
                >
                  {user.role === 'doctor' ? (
                    <Stethoscope className="w-4 h-4 text-blue-600 group-hover:text-white" />
                  ) : (
                    <UserIcon className="w-4 h-4 text-blue-600 group-hover:text-white" />
                  )}
                  <span className="max-w-[130px] truncate">{user.name.split(' ')[0]}</span>
                  <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-white/30 text-current">
                    {user.role === 'doctor' ? 'MD' : (user.patientId || 'PT')}
                  </span>
                </button>
                <button
                  id="nav-logout-btn"
                  onClick={handleLogout}
                  title="Log out"
                  className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="nav-login-btn"
                  onClick={() => handleNav('login')}
                  className="px-4 py-2 text-sm font-medium text-slate-700 hover:text-blue-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
                >
                  Login
                </button>
                <button
                  id="nav-signup-btn"
                  onClick={() => handleNav('signup')}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-600/20 transition-all active:scale-95 cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Toggle */}
          <div className="flex md:hidden items-center gap-2">
            {user && (
              <button
                id="mobile-nav-avatar"
                onClick={() => handleNav('profile')}
                className="p-2 text-blue-700 bg-blue-50 rounded-lg"
                title="Profile"
              >
                <UserIcon className="w-5 h-5" />
              </button>
            )}
            <button
              id="mobile-hamburger-btn"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div id="mobile-menu-drawer" className="md:hidden border-t border-slate-200 bg-white px-4 pt-3 pb-6 space-y-2 shadow-xl animate-fadeIn">
          {navItems.map(item => {
            const isActive = item.id === 'blog'
              ? (currentPage === 'blog' || currentPage.startsWith('blog/'))
              : currentPage === item.id;
            return (
              <button
                key={item.id}
                id={`mobile-nav-${item.id}`}
                onClick={() => handleNav(item.id)}
                className={`w-full text-left px-4 py-3 rounded-lg text-base font-medium flex items-center justify-between ${
                  isActive
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                <span>{item.label}</span>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            );
          })}

          {/* Quick Tools Accordion / Direct Links on mobile */}
          <div className="pt-2">
            <button
              onClick={() => setShowToolsSubmenu(!showToolsSubmenu)}
              className="w-full text-left px-4 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-slate-500 bg-slate-50 flex items-center justify-between"
            >
              <span>Healthcare Tools</span>
              <span className="text-blue-600 font-normal lowercase">{showToolsSubmenu ? 'hide' : 'expand'}</span>
            </button>

            {showToolsSubmenu && (
              <div className="mt-2 space-y-1 pl-2">
                {directTools.map(tool => {
                  const Icon = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={() => handleNav(tool.id)}
                      className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-600 hover:text-blue-600 hover:bg-blue-50 flex items-center gap-2.5"
                    >
                      <Icon className="w-4 h-4 text-blue-500 shrink-0" />
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Auth section */}
          <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
            {user ? (
              <>
                <button
                  id="mobile-drawer-profile"
                  onClick={() => handleNav(user.role === 'doctor' ? 'doctor-dashboard' : 'patient-dashboard')}
                  className="w-full py-3 px-4 rounded-xl bg-blue-600 text-white font-medium text-center flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  {user.role === 'doctor' ? <Stethoscope className="w-5 h-5" /> : <UserIcon className="w-5 h-5" />}
                  <span>
                    {user.role === 'doctor' ? 'Doctor Portal' : 'Patient Portal'} ({user.name})
                  </span>
                </button>
                <button
                  id="mobile-drawer-logout"
                  onClick={handleLogout}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 font-medium text-center hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                >
                  Log Out
                </button>
              </>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="mobile-drawer-login"
                  onClick={() => handleNav('login')}
                  className="w-full py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-medium text-center hover:bg-slate-50 cursor-pointer"
                >
                  Login
                </button>
                <button
                  id="mobile-drawer-signup"
                  onClick={() => handleNav('signup')}
                  className="w-full py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-center shadow-xs cursor-pointer"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
