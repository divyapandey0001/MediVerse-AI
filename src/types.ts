export type UserRole = 'patient' | 'doctor' | 'pending_doctor' | 'admin';

export type SubscriptionPlanType = 'trial' | 'free_limited' | 'premium';
export type SubscriptionStatusType = 'active' | 'trialing' | 'canceled' | 'expired' | 'past_due';

export interface UserSubscription {
  plan: SubscriptionPlanType;
  status: SubscriptionStatusType;
  trialStartDate: string;
  trialEndDate: string;
  trialDaysRemaining?: number;
  isTrialActive?: boolean;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  razorpaySubscriptionId?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  razorpaySignature?: string;
  cancelAtPeriodEnd?: boolean;
  updatedAt?: string;
}

export interface DailyUsageMetrics {
  reportAnalyses: number;
  chatQueries: number;
  symptomChecks: number;
  medicineLookups: number;
  clinicalSummaries: number;
  reportComparisons: number;
}

export interface PlanLimits {
  reportAnalyses: number;
  chatQueries: number;
  symptomChecks: number;
  medicineLookups: number;
  clinicalSummaries: number;
  reportComparisons: number;
}

export interface UserUsageStatus {
  plan: SubscriptionPlanType;
  status: SubscriptionStatusType;
  trialDaysRemaining: number;
  isTrialActive: boolean;
  trialEndDate: string;
  currentPeriodEnd?: string;
  todayUsage: DailyUsageMetrics;
  dailyLimits: PlanLimits;
  remainingQuota: DailyUsageMetrics;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  patientId?: string; // e.g. PT-104928 for patients
  phone?: string;
  age?: number;
  dateOfBirth?: string;
  gender?: string;
  bloodGroup?: string;
  allergies?: string;
  emergencyContact?: string;
  address?: string;
  // Doctor-specific fields
  specialty?: string;
  qualification?: string;
  department?: string;
  licenseNumber?: string;
  hospitalAffiliation?: string;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  verificationSubmittedAt?: string;
  verificationNotes?: string;
  emailVerified?: boolean;
  emailVerificationSentAt?: string;
  createdAt: string;
  // Subscription & Rate Limiting
  subscription?: UserSubscription;
  dailyUsage?: Record<string, DailyUsageMetrics>;
}

export type TestStatus = 'Normal' | 'Low' | 'High' | 'Needs Attention' | 'Critical' | 'Abnormal';

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
  patientId?: string;
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

export interface PrescriptionMedicine {
  name: string;
  strength: string; // e.g. 500mg
  frequency: string; // e.g. Twice daily after meals
  duration: string; // e.g. 7 days
  instructions: string; // e.g. Take with full glass of water
}

export interface Prescription {
  id: string;
  prescriptionNumber: string; // e.g. RX-2026-8492
  patientUserId: string;
  patientId: string;
  patientName: string;
  patientAge?: number;
  patientGender?: string;
  doctorUserId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorQualification?: string;
  doctorLicense?: string;
  diagnosis: string;
  symptoms?: string;
  medicines: PrescriptionMedicine[];
  instructions: string;
  additionalNotes?: string;
  followUpDate?: string;
  createdAt: string;
}

export interface ClinicalNote {
  id: string;
  patientUserId: string;
  patientId: string;
  patientName: string;
  doctorUserId: string;
  doctorName: string;
  doctorSpecialty: string;
  diagnosis: string;
  clinicalObservations: string;
  treatmentPlan: string;
  followUpDate?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PatientDoctorRelationship {
  id: string;
  patientUserId: string;
  patientId: string;
  patientName: string;
  patientEmail: string;
  doctorUserId: string;
  doctorName: string;
  status: 'active' | 'archived';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  role: UserRole;
  action:
    | 'REPORT_UPLOADED'
    | 'REPORT_VIEWED'
    | 'REPORT_DOWNLOADED'
    | 'REPORT_DELETED'
    | 'PRESCRIPTION_CREATED'
    | 'PRESCRIPTION_VIEWED'
    | 'PRESCRIPTION_DOWNLOADED'
    | 'CLINICAL_NOTE_CREATED'
    | 'PATIENT_RECORD_ACCESSED'
    | 'ACCOUNT_CREATED'
    | 'DOCTOR_VERIFIED';
  recordId?: string;
  targetPatientId?: string;
  details: string;
  timestamp: string;
}

export interface TestComparisonItem {
  testName: string;
  unit: string;
  referenceRange: string;
  prevValue: string | null;
  currValue: string | null;
  prevStatus?: TestStatus;
  currStatus?: TestStatus;
  deltaText: string;
  trend: 'improved' | 'concerning' | 'stable' | 'increased' | 'decreased' | 'single-report';
  generalInterpretation: string;
}

export interface ReportComparisonResult {
  previousReport: LabReportAnalysis;
  currentReport: LabReportAnalysis;
  comparedTests: TestComparisonItem[];
  matchingCount: number;
  summary: string;
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
  doctorId?: string;
  doctorUserId?: string;
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

export type PatientStatus = 'Admitted' | 'Observation' | 'ICU' | 'Under Treatment' | 'Discharged' | 'Outpatient';

export interface PatientVitalEntry {
  id: string;
  patientId: string;
  recordedAt: string;
  bloodPressure?: string;
  heartRate?: number;
  temperature?: number;
  spo2?: number;
  respiratoryRate?: number;
  notes?: string;
  recordedBy?: string;
}

export interface PatientLabResult {
  id: string;
  patientId: string;
  testName: string;
  result: string;
  unit: string;
  referenceRange: string;
  status: TestStatus;
  date: string;
  sourceDocumentId?: string;
  sourceDocumentName?: string;
  documentName?: string;
  recordedBy?: string;
}

export interface PatientMedication {
  id: string;
  patientId: string;
  medicineName: string;
  strength: string;
  route: string;
  frequency: string;
  duration: string;
  startDate?: string;
  endDate?: string;
  instructions?: string;
  status: 'Active' | 'Completed' | 'Discontinued';
  prescribedBy?: string;
  createdAt: string;
}

export interface PatientDiagnosis {
  id: string;
  patientId: string;
  diagnosisName: string;
  type: 'Primary' | 'Secondary' | 'Differential' | 'Chronic' | 'Resolved';
  dateDiagnosed: string;
  clinicalNotes?: string;
  diagnosedBy?: string;
  createdAt: string;
}

export interface PatientClinicalNote {
  id: string;
  patientId: string;
  noteType: 'Progress Note' | 'Admission Note' | 'Clinical Observation' | 'Care Plan' | 'Consultation Note' | 'Nursing Note' | 'Procedure Note';
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  date?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PatientDocument {
  id: string;
  patientId: string;
  fileName: string;
  fileType: string;
  fileSize?: number;
  category: 'Laboratory Report' | 'Hospital Report' | 'Radiology / Imaging' | 'Clinical Report' | 'Prescription' | 'Other Medical Document';
  notes?: string;
  dataUrl: string;
  uploadedAt: string;
  uploadedBy?: string;
  analyzed?: boolean;
  analysisId?: string;
  analysis?: any;
}

export interface ExtractedDocumentData {
  documentId: string;
  fileName: string;
  reportDate?: string;
  facilityName?: string;
  patientNameDetected?: string;
  tests: Array<{
    testName: string;
    result: string;
    unit: string;
    referenceRange: string;
    status: TestStatus;
  }>;
  abnormalFindings: string[];
  diagnosesMentioned: string[];
  medicationsMentioned: string[];
  clinicalFindings: string;
  summaryOfFindings?: string;
  importantObservations: string[];
  relevantDates: string[];
}

export type TimelineEventType =
  | 'Patient Admission'
  | 'Document Upload'
  | 'Document Deleted'
  | 'Document Analyzed'
  | 'Extracted Data Saved'
  | 'Vital Added'
  | 'Lab Result Added'
  | 'Lab Result Deleted'
  | 'Medication Added'
  | 'Medication Status Changed'
  | 'Diagnosis Added'
  | 'Clinical Note Added'
  | 'Medical Summary Created'
  | 'Prescription Issued'
  | 'Patient Discharged'
  | 'Discharge Summary Created'
  | 'Patient Profile Updated'
  | string;

export interface PatientTimelineItem {
  id: string;
  patientId: string;
  timestamp: string;
  eventType?: TimelineEventType;
  category?: string;
  title?: string;
  description: string;
  source?: string;
  details?: any;
  performedBy?: string;
  createdByName?: string;
}

export type PatientTimelineEvent = PatientTimelineItem;

export interface PatientAiSummary {
  id: string;
  patientId: string;
  generatedAt: string;
  modelUsed?: string;
  patientOverview?: string;
  overview?: string;
  overallHealthStatus?: string;
  clinicalHistory?: string;
  keyFindings?: string | string[];
  vitalTrends?: string;
  labFindingsSummary?: string;
  labAndVitalTrends?: string;
  currentMedications?: string;
  activeTreatmentStatus?: string;
  diagnoses?: string;
  importantClinicalNotes?: string;
  chronologicalTimelineSummary?: string;
  itemsRequiringAttention?: string;
  clinicalRecommendations?: string[];
  criticalAlerts?: string[];
  questionsAndFollowUp?: string;
  disclaimer?: string;
}

export interface PatientDischargeSummary {
  id: string;
  patientId: string;
  generatedAt: string;
  dischargeDate: string;
  admissionDate: string;
  finalDiagnosis: string;
  conditionAtDischarge: string;
  hospitalCourseSummary: string;
  dischargeMedications: string[];
  dietAndActivityAdvice: string;
  followUpInstructions: string;
  emergencyWarningSigns: string[];
  dischargedBy: string;
  notes?: string;
}

export interface ConsultationSpeakerUtterance {
  id: string;
  speaker: 'Doctor' | 'Patient';
  text: string;
  timestamp: string; // e.g. "01:24" or ISO string
}

export interface ConsultationClinicalNoteDraft {
  chiefComplaint: string;
  symptoms: string[];
  durationAndHistory: string;
  relevantMedicalHistory: string;
  currentMedicines: string[];
  allergies: string;
  importantPatientStatements: string[];
  examinationFindings: string;
  assessment: string;
  suggestedFollowUp: string;
  treatmentPlanDraft: string;
  isAiDraft: boolean;
  aiDisclaimer: string;
}

export interface ApprovedConsultationNote {
  chiefComplaint: string;
  symptoms: string[];
  durationAndHistory: string;
  relevantMedicalHistory: string;
  currentMedicines: string[];
  allergies: string;
  importantPatientStatements: string[];
  examinationFindings: string;
  assessment: string;
  suggestedFollowUp: string;
  treatmentPlan: string;
  prescribedMedicines?: PrescriptionMedicine[];
  approvedAt: string;
  approvedByDoctorId: string;
  approvedByDoctorName: string;
  doctorSpecialty?: string;
  clinicalObservations?: string;
}

export interface PatientConsultation {
  id: string;
  patientId: string;
  patientName: string;
  patientUhid?: string;
  patientUserId?: string;
  doctorUserId: string;
  doctorName: string;
  doctorSpecialty?: string;
  startedAt: string;
  endedAt: string;
  durationSeconds: number;
  consentObtained: boolean;
  consentTimestamp: string;
  transcription: ConsultationSpeakerUtterance[];
  fullTranscriptText: string;
  status: 'draft' | 'reviewed_and_approved' | 'discarded';
  aiDraftNote?: ConsultationClinicalNoteDraft;
  approvedNote?: ApprovedConsultationNote;
  createdPrescriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LivePatientRecord {
  id: string;
  uhid: string;
  patientName: string;
  dateOfBirth?: string;
  age?: number;
  gender?: string;
  bloodGroup?: string;
  department: string;
  attendingPhysician: string;
  admissionDateTime: string;
  bedRoomNo?: string;
  allergies?: string;
  reasonForAdmission: string;
  status: PatientStatus;
  dischargeDateTime?: string;
  dischargeSummary?: PatientDischargeSummary | string;
  dischargeData?: PatientDischargeSummary;
  emergencyContact?: string;
  contactPhone?: string;
  address?: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;

  vitals: PatientVitalEntry[];
  labResults: PatientLabResult[];
  medications: PatientMedication[];
  diagnoses: PatientDiagnosis[];
  clinicalNotes: PatientClinicalNote[];
  documents: PatientDocument[];
  timeline: PatientTimelineItem[];
  aiSummaries: PatientAiSummary[];
  prescriptions: Prescription[];
  consultations?: PatientConsultation[];
}

export type ExtractedClinicalData = ExtractedDocumentData;
export type PatientVitalSign = PatientVitalEntry;






