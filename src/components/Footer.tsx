import React from 'react';
import { Activity, ShieldAlert, Lock } from 'lucide-react';

interface FooterProps {
  onNavigate: (page: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const handleLinkClick = (target: string) => {
    if (target === 'services') {
      const el = document.getElementById('services-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      onNavigate('home');
      setTimeout(() => {
        const el = document.getElementById('services-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    if (target === 'reviews') {
      const el = document.getElementById('reviews-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      onNavigate('home');
      setTimeout(() => {
        const el = document.getElementById('reviews-section');
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
      return;
    }

    if (target === 'contact') {
      const el = document.getElementById('contact-section');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      onNavigate('contact');
      return;
    }

    onNavigate(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer id="main-footer" className="bg-[#061229] text-slate-300 border-t border-blue-950">
      {/* Emergency Alert Strip */}
      <div className="bg-red-950/70 border-b border-red-900/60 py-3 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm text-red-200">
          <div className="flex items-center gap-2 text-center sm:text-left">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>
              <strong>Emergency Notice:</strong> If you are having chest pain, severe breathing difficulty, sudden speech/vision loss, or trauma, call emergency services immediately.
            </span>
          </div>
          <div className="flex items-center gap-3 font-semibold text-red-100">
            <span>US/CA: 911</span>
            <span>•</span>
            <span>UK: 999</span>
            <span>•</span>
            <span>INT: 112</span>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Brand Col */}
          <div className="space-y-4 lg:col-span-2">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleLinkClick('home')}>
              <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xl font-bold text-white tracking-tight block leading-none">
                  Medi<span className="text-blue-400">Verse</span>
                </span>
                <span className="text-xs text-blue-200/70 font-medium">AI Powered Healthcare Platform</span>
              </div>
            </div>

            <p className="text-sm text-slate-300/80 leading-relaxed max-w-md">
              AI-powered healthcare information platform. MediVerse provides accessible medical report analysis, symptom guidance, and educational health intelligence to help you understand your wellness.
            </p>

            <div className="flex items-center gap-2 text-xs text-blue-200/70">
              <Lock className="w-3.5 h-3.5 text-blue-400" />
              <span>Privacy focused. We do not sell or monetize personal medical data.</span>
            </div>
          </div>

          {/* Platform Navigation */}
          <div>
            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-4">Navigation</h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <button
                  id="footer-link-home"
                  onClick={() => handleLinkClick('home')}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  id="footer-link-services"
                  onClick={() => handleLinkClick('services')}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  Services
                </button>
              </li>
              <li>
                <button
                  id="footer-link-about"
                  onClick={() => handleLinkClick('about')}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  About
                </button>
              </li>
              <li>
                <button
                  id="footer-link-reviews"
                  onClick={() => handleLinkClick('reviews')}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  Reviews
                </button>
              </li>
              <li>
                <button
                  id="footer-link-contact"
                  onClick={() => handleLinkClick('contact')}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  Contact
                </button>
              </li>
              <li>
                <button
                  id="footer-link-privacy"
                  onClick={() => handleLinkClick('privacy-policy')}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  Privacy Policy
                </button>
              </li>
              <li>
                <button
                  id="footer-link-terms"
                  onClick={() => handleLinkClick('terms-of-service')}
                  className="hover:text-blue-400 transition-colors text-left"
                >
                  Terms of Service
                </button>
              </li>
            </ul>
          </div>

          {/* Medical Safety Disclaimer */}
          <div className="bg-[#091b3a] rounded-2xl p-5 border border-blue-900/60 space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              Medical Disclaimer
            </h4>
            <p className="text-xs text-blue-100/80 leading-relaxed">
              MediVerse provides AI-generated health information for educational purposes only. It does not provide medical diagnosis or replace a qualified healthcare professional.
            </p>
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-blue-950 text-xs text-slate-400 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} MediVerse. All rights reserved.</p>
          <div className="flex items-center gap-4 text-slate-400">
            <span>AI Powered Healthcare Platform</span>
            <span>•</span>
            <button onClick={() => handleLinkClick('privacy-policy')} className="hover:underline hover:text-blue-300">Privacy Policy</button>
            <span>•</span>
            <button onClick={() => handleLinkClick('terms-of-service')} className="hover:underline hover:text-blue-300">Terms of Service</button>
          </div>
        </div>
      </div>
    </footer>
  );
};
