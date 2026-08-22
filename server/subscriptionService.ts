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

export async function getRazorpayClient() {
  const key_id = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mediverse_demo';
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  if (!razorpayClient && key_secret) {
    try {
      const { default: Razorpay } = await import('razorpay');
      razorpayClient = new Razorpay({
        key_id,
        key_secret
      });
    } catch (err) {
      console.warn('Could not initialize Razorpay SDK (operating in Test/Mock Mode):', err);
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
      // Period has expired without renewal -> revert to free limited
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
    // Unauthenticated guest user: allow minimal trial query
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
      error: `Daily limit reached for ${featureLabels[feature]} (${limit}/${limit} used today on ${sub.plan === 'free_limited' ? 'Free Limited Plan' : 'current plan'}). Upgrade to MediVerse Premium for ₹99/month for unlimited access and priority processing.`
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

export async function createRazorpayOrder(params: {
  amount: number; // in paise (e.g. 9900 = ₹99)
  currency?: string;
  receipt?: string;
}): Promise<{
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  testMode: boolean;
}> {
  const amount = params.amount || 9900;
  const currency = params.currency || 'INR';
  const receipt = params.receipt || `rcpt_${Date.now()}`;
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_mediverse_demo';

  const client = await getRazorpayClient();
  if (client) {
    try {
      const order = await client.orders.create({
        amount,
        currency,
        receipt
      });
      return {
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        keyId,
        testMode: true
      };
    } catch (err) {
      console.warn('Razorpay client order create notice (falling back to sandbox test order):', err);
    }
  }

  // Fallback to deterministic Test Mode Order ID
  const testOrderId = `order_test_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  return {
    orderId: testOrderId,
    amount,
    currency,
    keyId,
    testMode: true
  };
}

export function verifyRazorpaySignature(orderId: string, paymentId: string, signature: string): boolean {
  if (!orderId || !paymentId || !signature) {
    return false;
  }

  // In Test Mode / Sandbox, accept test tokens or simulated test signatures
  if (
    paymentId.startsWith('pay_test_') ||
    orderId.startsWith('order_test_') ||
    signature.startsWith('sig_test_')
  ) {
    return true;
  }

  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
    // In Sandbox Test Mode without configured secret, allow test transaction
    return true;
  }

  try {
    const body = `${orderId}|${paymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body)
      .digest('hex');

    const sigBuf = Buffer.from(signature, 'hex');
    const expBuf = Buffer.from(expectedSignature, 'hex');

    if (sigBuf.length !== expBuf.length) {
      return false;
    }

    return crypto.timingSafeEqual(sigBuf, expBuf);
  } catch (err) {
    console.error('Signature verification error:', err);
    return false;
  }
}

export function activatePremiumSubscription(
  userId: string,
  details: {
    paymentId?: string;
    orderId?: string;
    signature?: string;
    durationDays?: number;
  }
): UserSubscription {
  const data = db.get();
  const userIdx = data.users.findIndex(u => u.id === userId);
  if (userIdx === -1) {
    throw new Error('User not found');
  }

  const now = new Date();
  const duration = details.durationDays || 30;
  const currentPeriodStart = now.toISOString();
  const currentPeriodEnd = new Date(now.getTime() + duration * 24 * 60 * 60 * 1000).toISOString();

  const user = data.users[userIdx];
  const newSub: UserSubscription = {
    plan: 'premium',
    status: 'active',
    trialStartDate: user.subscription?.trialStartDate || user.createdAt || now.toISOString(),
    trialEndDate: user.subscription?.trialEndDate || new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    trialDaysRemaining: 0,
    isTrialActive: false,
    currentPeriodStart,
    currentPeriodEnd,
    razorpayPaymentId: details.paymentId || `pay_test_${Date.now()}`,
    razorpayOrderId: details.orderId,
    razorpaySignature: details.signature,
    cancelAtPeriodEnd: false,
    updatedAt: now.toISOString()
  };

  data.users[userIdx].subscription = newSub;
  db.save(data);

  db.logAudit({
    userId: user.id,
    userName: user.name,
    role: user.role,
    action: 'SUBSCRIPTION_UPGRADED' as any,
    details: `User subscribed to MediVerse Premium (Test Mode payment ID: ${newSub.razorpayPaymentId}, Valid until: ${currentPeriodEnd})`
  });

  return newSub;
}

