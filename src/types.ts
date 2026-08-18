export type UserRole = 'patient' | 'admin';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  allergies?: string;
  emergencyContact?: string;
  createdAt: string;
}

export type TestStatus = 'Normal' | 'Low' | 'High' | 'Needs Attention';

export interface LabTestItem {
  testName: string;
  result: string;
  unit: string;
  referenceRange: string;
  status: TestStatus;
}

export interface AbnormalFinding {
  testName: string;
  value: string;
  status: TestStatus;
  whatItMeasures: string;
  possibleReasons: string[];
  discussWithDoctor: string;
}

export interface FoodAndLifestyleGuidance {
  helpfulFoods: string[];
  foodsToLimit: string[];
  hydrationTips: string[];
  generalLifestyle: string[];
}

export type UrgencyLevel = 'Routine' | 'Moderate' | 'Prompt Medical Attention Required' | 'Emergency Alert';

export interface LabReportAnalysis {
  id: string;
  userId?: string;
  fileName: string;
  fileSize?: number;
  uploadedAt: string;
  reportDate?: string;
  patientNameDetected?: string;
  labNameDetected?: string;
  testResults: LabTestItem[];
  healthSummary: string;
  abnormalFindings: AbnormalFinding[];
  foodAndLifestyle: FoodAndLifestyleGuidance;
  doctorQuestions: string[];
  urgencyLevel: UrgencyLevel;
  urgencyExplanation?: string;
  isEmergency: boolean;
  unreadableNotes?: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

export interface SymptomAnalysisResult {
  symptomsEntered: string;
  possibleCauses: Array<{
    name: string;
    description: string;
    likelihood?: string;
  }>;
  generalInformation: string;
  warningSigns: string[];
  whenToSeekCare: string;
  whatToTellDoctor: string[];
  disclaimer: string;
}

export interface MedicineInfoResult {
  searchedTerm: string;
  medicineName: string;
  genericName?: string;
  drugClass?: string;
  commonUses: string[];
  mechanismOfAction: string;
  commonSideEffects: string[];
  importantPrecautions: string[];
  commonInteractions: string[];
  whenToContactDoctor: string[];
  disclaimer: string;
}

export interface BmiRecord {
  id: string;
  userId?: string;
  date: string;
  age: number;
  sex?: string;
  heightCm: number;
  weightKg: number;
  bmi: number;
  category: 'Underweight' | 'Normal weight' | 'Overweight' | 'Obesity Class I' | 'Obesity Class II' | 'Severe Obesity';
  guidance: string[];
}

export interface Appointment {
  id: string;
  appointmentCode: string;
  userId?: string;
  patientName: string;
  email: string;
  phone: string;
  specialty: string;
  doctorName: string;
  appointmentDate: string;
  appointmentTime: string;
  reason: string;
  status: 'Confirmed' | 'Completed' | 'Cancelled';
  createdAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  phone?: string;
  message: string;
  createdAt: string;
}

export interface Review {
  id: string;
  name: string;
  email?: string;
  rating: number; // 1 to 5
  review: string;
  date: string;
  status: 'approved' | 'pending';
  userId?: string;
}

export type FeedbackType =
  | 'Website Experience'
  | 'AI Feature'
  | 'Lab Report Analysis'
  | 'Symptom Checker'
  | 'Medicine Information'
  | 'Other';

export interface UserFeedback {
  id: string;
  name: string;
  email?: string;
  feedbackType: FeedbackType;
  message: string;
  createdAt: string;
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  qualification: string;
  department: string;
  experience: string;
  availableDays: string[];
}
