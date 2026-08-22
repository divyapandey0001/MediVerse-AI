import crypto from 'crypto';
import { db } from './db.js';
import {
  User,
  UserSubscription,
  SubscriptionPlanType,
  SubscriptionStatusType,
  DailyUsageMetrics,
  PlanLimits,
  UserUsageStatus
} from '../src/types.js';

// Lazy Razorpay instance
let razorpayClient: any = null;

export function getRazorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!key_id || !key_secret) {
    return null;
  }

  if (!razorpayClient) {
    try {
      // Use dynamic require or import for Razorpay
      const Razorpay = require('razorpay');
      razorpayClient = new Razorpay({
        key_id,
        key_secret
      });
    } catch (err) {
      console.warn('Could not initialize Razorpay SDK:', err);
      return null;
    }
  }

  return razorpayClient;
}

export const PLAN_LIMITS: Record<SubscriptionPlanType, PlanLimits> = {
  free_limited: {
    reportAnalyses: 2,
    chatQueries: 10,
    symptomChecks: 3,
    medicineLookups: 5,
    clinicalSummaries: 1,
    reportComparisons: 1
  },
  trial: {
    reportAnalyses: 50,
    chatQueries: 250,
    symptomChecks: 50,
    medicineLookups: 100,
    clinicalSummaries: 50,
    reportComparisons: 50
  },
  premium: {
    reportAnalyses: 50,
    chatQueries: 250,
    symptomChecks: 50,
    medicineLookups: 100,
    clinicalSummaries: 50,
    reportComparisons: 50
  }
};

export function getTodayDateKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getUserSubscription(user: User): UserSubscription {
  const now = new Date();
  const nowMs = now.getTime();

  // If user has an explicit active premium plan
  if (user.subscription?.plan === 'premium' && user.subscription.status === 'active') {
    const endMs = user.subscription.currentPeriodEnd
      ? new Date(user.subscription.currentPeriodEnd).getTime()
      : 0;

    // Check if premium period is still valid
    if (endMs > nowMs) {
      return {
        ...user.subscription,
        plan: 'premium',
        status: 'active',
        isTrialActive: false,
        trialDaysRemaining: 0
      };
    } else if (endMs > 0) {
      // Period has expired without renewal
      return {
        ...user.subscription,
        plan: 'free_limited',
        status: 'expired',
        isTrialActive: false,
        trialDaysRemaining: 0
      };
    }
  }

  // Calculate 14-day trial from user creation or trialStartDate
  const trialStartDate = user.subscription?.trialStartDate || user.createdAt || now.toISOString();
  const trialStartMs = new Date(trialStartDate).getTime();
  const trialEndMs = user.subscription?.trialEndDate
    ? new Date(user.subscription.trialEndDate).getTime()
    : trialStartMs + 14 * 24 * 60 * 60 * 1000;

  const trialEndDate = new Date(trialEndMs).toISOString();
  const remainingMs = trialEndMs - nowMs;
  const isTrialActive = remainingMs > 0;
  const trialDaysRemaining = isTrialActive
    ? Math.max(1, Math.ceil(remainingMs / (1000 * 60 * 60 * 24)))
    : 0;

  if (isTrialActive) {
    return {
      plan: 'trial',
      status: 'trialing',
      trialStartDate,
      trialEndDate,
      trialDaysRemaining,
      isTrialActive: true,
      updatedAt: user.subscription?.updatedAt || now.toISOString()
    };
  }

  return {
    plan: 'free_limited',
    status: 'expired',
    trialStartDate,
    trialEndDate,
    trialDaysRemaining: 0,
    isTrialActive: false,
    updatedAt: user.subscription?.updatedAt || now.toISOString()
  };
}

export function getUserUsageStatus(user: User): UserUsageStatus {
  const sub = getUserSubscription(user);
  const limits = PLAN_LIMITS[sub.plan];
  const dateKey = getTodayDateKey();

  const userUsage = user.dailyUsage?.[dateKey] || {
    reportAnalyses: 0,
    chatQueries: 0,
    symptomChecks: 0,
    medicineLookups: 0,
    clinicalSummaries: 0,
    reportComparisons: 0
  };

  const todayUsage: DailyUsageMetrics = {
    reportAnalyses: userUsage.reportAnalyses || 0,
    chatQueries: userUsage.chatQueries || 0,
    symptomChecks: userUsage.symptomChecks || 0,
    medicineLookups: userUsage.medicineLookups || 0,
    clinicalSummaries: userUsage.clinicalSummaries || 0,
    reportComparisons: userUsage.reportComparisons || 0
  };

  const remainingQuota: DailyUsageMetrics = {
    reportAnalyses: Math.max(0, limits.reportAnalyses - todayUsage.reportAnalyses),
    chatQueries: Math.max(0, limits.chatQueries - todayUsage.chatQueries),
    symptomChecks: Math.max(0, limits.symptomChecks - todayUsage.symptomChecks),
    medicineLookups: Math.max(0, limits.medicineLookups - todayUsage.medicineLookups),
    clinicalSummaries: Math.max(0, limits.clinicalSummaries - todayUsage.clinicalSummaries),
    reportComparisons: Math.max(0, limits.reportComparisons - todayUsage.reportComparisons)
  };

  return {
    plan: sub.plan,
    status: sub.status,
    trialDaysRemaining: sub.trialDaysRemaining || 0,
    isTrialActive: !!sub.isTrialActive,
    trialEndDate: sub.trialEndDate,
    currentPeriodEnd: sub.currentPeriodEnd,
    todayUsage,
    dailyLimits: limits,
    remainingQuota
  };
}

export function checkAndIncrementUsage(
  userId: string,
  feature: keyof DailyUsageMetrics
): {
  allowed: boolean;
  current: number;
  limit: number;
  plan: SubscriptionPlanType;
  trialDaysRemaining: number;
  error?: string;
} {
  const data = db.get();
  const user = data.users.find(u => u.id === userId);

  if (!user) {
    // Guest or unauthenticated user: allow minimal trial query or restrict
    return {
      allowed: true,
      current: 1,
      limit: 2,
      plan: 'free_limited',
      trialDaysRemaining: 0
    };
  }

  const sub = getUserSubscription(user);
  const limits = PLAN_LIMITS[sub.plan];
  const limit = limits[feature];
  const dateKey = getTodayDateKey();

  if (!user.dailyUsage) {
    user.dailyUsage = {};
  }
  if (!user.dailyUsage[dateKey]) {
    user.dailyUsage[dateKey] = {
      reportAnalyses: 0,
      chatQueries: 0,
      symptomChecks: 0,
      medicineLookups: 0,
      clinicalSummaries: 0,
      reportComparisons: 0
    };
  }

  const currentUsage = user.dailyUsage[dateKey][feature] || 0;

  if (currentUsage >= limit) {
    const featureLabels: Record<keyof DailyUsageMetrics, string> = {
      reportAnalyses: 'AI Lab Report Analyses',
      chatQueries: 'AI Health Chat Queries',
      symptomChecks: 'AI Symptom Checks',
      medicineLookups: 'Medicine Info Lookups',
      clinicalSummaries: 'AI Clinical Summaries',
      reportComparisons: 'Lab Report Comparisons'
    };

    return {
      allowed: false,
      current: currentUsage,
      limit,
      plan: sub.plan,
      trialDaysRemaining: sub.trialDaysRemaining || 0,
      error: `Daily limit reached for ${featureLabels[feature]} (${limit}/${limit} used today). Upgrade to Premium for ₹99/month to get unlimited access and priority AI processing.`
    };
  }

  // Increment usage
  user.dailyUsage[dateKey][feature] = currentUsage + 1;
  user.subscription = sub;
  db.save(data);

  return {
    allowed: true,
    current: currentUsage + 1,
    limit,
    plan: sub.plan,
    trialDaysRemaining: sub.trialDaysRemaining || 0
  };
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    // If no secret configured in test/sandbox mode, check format
    return Boolean(orderId && paymentId && signature);
  }

  try {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    return expectedSignature === signature;
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

export function verifyWebhookSignature(payload: string | Buffer, signature: string): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    return true; // Test mode allow
  }

  try {
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');

    return expectedSignature === signature;
  } catch (err) {
    console.error('Webhook signature verification error:', err);
    return false;
  }
}
