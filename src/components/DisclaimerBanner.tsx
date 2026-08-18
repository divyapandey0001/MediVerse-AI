import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface DisclaimerBannerProps {
  compact?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ compact }) => {
  if (compact) {
    return (
      <div id="disclaimer-banner-compact" className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2 max-w-6xl mx-auto w-full">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Educational Purpose Only:</strong> MediVerse does not provide clinical diagnoses or replace medical doctors. Always verify results with a qualified physician.
          </span>
        </div>
      </div>
    );
  }

  return (
    <div id="disclaimer-banner" className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 text-xs sm:text-sm">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-blue-100 text-blue-700 rounded-lg shrink-0 mt-0.5">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <p className="font-semibold text-slate-900">Medical Information & Safety Notice</p>
          <p className="text-slate-600 leading-relaxed">
            MediVerse provides AI-generated health information for educational purposes only. It does not provide medical diagnosis or replace a qualified healthcare professional. Do not start, stop, or change medication based solely on AI information. If experiencing a medical emergency, immediately call emergency services (911 / 112) or visit your nearest hospital.
          </p>
        </div>
      </div>
    </div>
  );
};
