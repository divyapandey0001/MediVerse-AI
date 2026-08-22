import React, { useState, useEffect } from 'react';
import {
  Crown,
  CheckCircle2,
  Zap,
  Clock,
  Sparkles,
  ShieldCheck,
  AlertCircle,
  X,
  RefreshCw,
  CreditCard,
  ArrowRight,
  Lock,
  Layers,
  FileText,
  MessageSquare,
  Activity,
  Pill
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.js';
import { UserUsageStatus } from '../types.js';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, token, refreshUser } = useAuth();
  const [status, setStatus] = useState<UserUsageStatus | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [selectedInterval, setSelectedInterval] = useState<'monthly' | 'annual'>('monthly');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchStatus = async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      const res = await fetch('/api/subscription/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('Failed to fetch subscription status:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setFeedback(null);
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  const currentPlan = status?.plan || user?.subscription?.plan || 'trial';
  const isTrial = currentPlan === 'trial';
  const isPremium = currentPlan === 'premium';
  const isFreeLimited = currentPlan === 'free_limited';
  const trialDaysRemaining = status?.trialDaysRemaining ?? user?.subscription?.trialDaysRemaining ?? 0;

  const handleSubscribeTestMode = async () => {
    if (!token || !user) return;
    setIsProcessing(true);
    setFeedback(null);

    try {
      // 1. Create order on server (Razorpay Test Mode)
      const orderRes = await fetch('/api/subscription/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          planType: 'premium',
          interval: selectedInterval
        })
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) {
        throw new Error(orderData.error || 'Failed to initialize subscription order.');
      }

      // Check if Razorpay script is present in window, else execute test mode confirmation
      const simulatedPaymentId = `pay_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const simulatedSignature = `sig_test_${Date.now()}_valid`;

      // 2. Verify payment on server
      const verifyRes = await fetch('/api/subscription/verify-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: simulatedPaymentId,
          razorpay_signature: simulatedSignature,
          interval: selectedInterval
        })
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Payment verification failed.');
      }

      setFeedback({
        type: 'success',
        message: 'Payment Successful (Test Mode)! Your account has been upgraded to MediVerse Premium.'
      });

      await refreshUser();
      await fetchStatus();

      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error('Subscription error:', err);
      setFeedback({
        type: 'error',
        message: err.message || 'Subscription processing failed. Please try again.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSimulateExpiry = async () => {
    if (!token) return;
    setIsProcessing(true);
    setFeedback(null);
    try {
      const res = await fetch('/api/subscription/simulate-trial-expiry', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({
          type: 'success',
          message: 'Simulated 14-day trial expiry. Your account is now on Free Limited Plan.'
        });
        await refreshUser();
        await fetchStatus();
      } else {
        throw new Error(data.error || 'Failed to simulate expiry.');
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Error simulating expiry.'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden my-8">
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 p-6 sm:p-8 text-white">
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="p-2.5 bg-amber-400/20 border border-amber-300/30 rounded-2xl">
              <Crown className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-200">
                MediVerse Subscription & Usage
              </span>
              <h2 className="text-2xl font-black text-white">
                {isPremium
                  ? 'MediVerse Premium Active'
                  : isTrial
                  ? `14-Day Free Trial (${trialDaysRemaining} days left)`
                  : 'Free Limited Plan'}
              </h2>
            </div>
          </div>

          <p className="text-sm text-blue-100/90 leading-relaxed max-w-xl">
            {isPremium
              ? 'You have unlimited access to AI lab analyses, longitudinal report comparisons, symptom checker, and clinical summaries.'
              : isTrial
              ? `You are currently enjoying full Premium access during your 14-day trial period. ${trialDaysRemaining} day(s) remaining.`
              : 'Your 14-day trial has concluded. You are currently on the Free Limited Plan with daily quotas.'}
          </p>

          {/* Test Mode Badge */}
          <div className="inline-flex items-center gap-2 mt-4 px-3 py-1 bg-white/15 border border-white/20 rounded-full text-xs font-semibold text-white">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
            <span>Razorpay Test Mode (Simulated Sandbox)</span>
          </div>
        </div>

        {/* Body Content */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* Feedback Alert */}
          {feedback && (
            <div
              className={`p-4 rounded-2xl text-sm flex items-start gap-3 ${
                feedback.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          {/* Today's Usage & Daily Quotas */}
          {status && (
            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 sm:p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Today's Daily Usage & Quotas
                </span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                  Plan: {status.plan.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span>AI Report Analyses</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {status.todayUsage.reportAnalyses} / {status.dailyLimits.reportAnalyses}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <MessageSquare className="w-4 h-4 text-emerald-600" />
                    <span>AI Health Chat</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {status.todayUsage.chatQueries} / {status.dailyLimits.chatQueries}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Activity className="w-4 h-4 text-indigo-600" />
                    <span>Symptom Checks</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {status.todayUsage.symptomChecks} / {status.dailyLimits.symptomChecks}
                  </span>
                </div>

                <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700 font-medium">
                    <Pill className="w-4 h-4 text-purple-600" />
                    <span>Medicine Lookups</span>
                  </div>
                  <span className="font-bold text-slate-900">
                    {status.todayUsage.medicineLookups} / {status.dailyLimits.medicineLookups}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Pricing & Upgrade Options */}
          {!isPremium && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-slate-900 text-base">Select Premium Plan</h3>
                {/* Billing Interval Toggle */}
                <div className="bg-slate-100 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
                  <button
                    onClick={() => setSelectedInterval('monthly')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      selectedInterval === 'monthly'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Monthly (₹99)
                  </button>
                  <button
                    onClick={() => setSelectedInterval('annual')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      selectedInterval === 'annual'
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Annual (₹999 - Save 16%)
                  </button>
                </div>
              </div>

              {/* Plan Card */}
              <div className="p-5 rounded-2xl border-2 border-blue-600 bg-blue-50/40 relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-blue-600 text-white uppercase tracking-wider mb-2">
                      Recommended
                    </span>
                    <h4 className="text-lg font-bold text-slate-900">MediVerse Premium Tier</h4>
                    <p className="text-xs text-slate-600 mt-1">
                      Complete AI medical intelligence suite for individuals and clinicians
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-black text-slate-900">
                      {selectedInterval === 'monthly' ? '₹99' : '₹999'}
                    </span>
                    <span className="text-xs text-slate-500 block">
                      {selectedInterval === 'monthly' ? '/ month' : '/ year'}
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-blue-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>50 AI Lab Report Analyses/day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>250 AI Medical Chat Queries/day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>50 Symptom Checks/day</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>Full PDF Health Summary Exports</span>
                  </div>
                </div>

                <button
                  onClick={handleSubscribeTestMode}
                  disabled={isProcessing}
                  className="mt-5 w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isProcessing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Processing Test Payment...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>
                        Upgrade with Razorpay Test Mode ({selectedInterval === 'monthly' ? '₹99' : '₹999'})
                      </span>
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Test & Simulation Tools for Verification */}
          <div className="pt-4 border-t border-slate-200 text-xs flex flex-wrap items-center justify-between gap-3 text-slate-500">
            <span>Security: Protected by server-side verification and Firestore synchronization.</span>
            {isTrial && (
              <button
                onClick={handleSimulateExpiry}
                disabled={isProcessing}
                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium transition-colors cursor-pointer"
                title="Simulate 14-day trial expiration to test transition to Free Limited Plan"
              >
                Simulate 14-Day Expiry (Test)
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
