export type UserRole = 'patient' | 'doctor';

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
    | 'PATIENT_RECORD_ACCESSED';
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

// ==========================================
// LIVE PATIENT HEALTH RECORD & TIMELINE TYPES
// ==========================================

export type PatientAdmissionStatus =
  | 'Admitted'
  | 'Under Observation'
  | 'ICU Care'
  | 'Pre-Op'
  | 'Post-Op'
  | 'Discharged'
  | 'Transferred';

export type SummaryStatus =
  | 'Up to Date'
  | 'Updated information available'
  | 'Generating'
  | 'Not Generated';

export interface InitialVitals {
  bloodPressure?: string;
  heartRate?: string;
  temperature?: string;
  spO2?: string;
  respiratoryRate?: string;
}

export interface LivePatientRecord {
  id: string;
  uhid: string; // Patient ID / UHID
  patientName: string;
  patientAge: number;
  patientGender: string;
  bloodGroup: string;
  contactPhone: string;
  allergies: string;
  emergencyContact: string;
  bedRoomNo: string;
  admissionDateTime: string;
  department: string;
  attendingDoctor: string;
  attendingDoctorUserId?: string;
  reasonForAdmission: string;
  initialVitals?: InitialVitals;
  status: PatientAdmissionStatus;
  dischargeDateTime?: string;
  dischargeSummary?: string;
  summaryStatus: SummaryStatus;
  lastSummaryGeneratedAt?: string;
  entriesCount: number;
  createdAt: string;
  updatedAt: string;
}

export type TimelineEntryType =
  | 'Doctor / Progress Note'
  | 'Lab Result'
  | 'Imaging / Radiology Report'
  | 'Prescription'
  | 'Medication Admin / Order'
  | 'Procedure / Treatment'
  | 'Nursing Note / Vitals'
  | 'Consultation Note'
  | 'Discharge Information'
  | 'Document / Attachment';

export interface StructuredLabItem {
  testName: string;
  result: string;
  unit: string;
  referenceRange?: string;
  status?: 'Normal' | 'Low' | 'High' | 'Critical';
}

export interface StructuredMedicationItem {
  name: string;
  dose: string;
  route: string;
  frequency: string;
  duration?: string;
  action?: 'Started' | 'Modified' | 'Discontinued' | 'Continued';
  instructions?: string;
}
export type MedicationOrderItem = StructuredMedicationItem;

export interface StructuredVitals {
  bp?: string;
  pulse?: string;
  temp?: string;
  spo2?: string;
  rr?: string;
  painScore?: string;
  bloodGlucose?: string;
}
export type VitalsData = StructuredVitals;

export interface EntryAttachment {
  name: string;
  type: string;
  url?: string;
  dataUrl?: string;
  size?: number;
}

export interface PatientTimelineEntry {
  id: string;
  patientRecordId: string;
  uhid: string;
  entryType: TimelineEntryType;
  timestamp: string;
  authorName: string;
  authorRole: string;
  title: string;
  content: string;
  structuredData?: {
    tests?: StructuredLabItem[];
    medications?: StructuredMedicationItem[];
    vitals?: StructuredVitals;
    imagingModality?: string;
    bodyPart?: string;
    impression?: string;
    procedureName?: string;
    performedBy?: string;
    complications?: string;
    outcome?: string;
    consultingSpecialty?: string;
    recommendations?: string;
    dischargeCondition?: string;
  };
  attachments?: EntryAttachment[];
  isCritical?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ClinicalTimelineMilestone {
  timeframe: string;
  milestone: string;
  sourceRecord: string;
  sourceDate: string;
}

export interface InvestigationFinding {
  finding: string;
  category: 'Lab' | 'Imaging' | 'Biomarker' | 'Diagnostic';
  status: 'Normal' | 'Abnormal' | 'Critical';
  sourceRecord: string;
  sourceDate: string;
}

export interface DocumentedDiagnosis {
  diagnosis: string;
  type: 'Primary' | 'Secondary' | 'Differential' | 'Provisional';
  status: 'Active' | 'Resolved' | 'Under Investigation';
  sourceRecord: string;
}

export interface CurrentTreatmentItem {
  treatment: string;
  details: string;
  sourceRecord: string;
}

export interface CurrentMedicationItem {
  name: string;
  dosage: string;
  frequency: string;
  route: string;
  status: 'Active' | 'Changed' | 'New';
  sourceRecord: string;
}

export interface MedicationChangeItem {
  medicine: string;
  changeType: 'Initiated' | 'Dose Adjusted' | 'Discontinued' | 'Substituted';
  reason?: string;
  sourceRecord: string;
  sourceDate: string;
}

export interface DocumentedStatus {
  clinicalCondition: string;
  vitalTrends: string;
  sources: string[];
}

export interface PendingInvestigationItem {
  investigation: string;
  scheduledOrOrderedDate?: string;
  sourceRecord: string;
}

export interface DocumentedAlertItem {
  alert: string;
  severity: 'High' | 'Medium' | 'Info';
  sourceRecord: string;
}

export interface SecondOpinionBrief {
  synthesis: string;
  keyConsiderations: string[];
  suggestedClinicalQuestions: string[];
}

export interface MissingOrConflictingInfo {
  issueType: 'Missing Information' | 'Conflicting Records' | 'Documentation Gap';
  description: string;
  flaggedForHumanReview: boolean;
  recordsInvolved?: string[];
}

export interface LivePatientAiSummary {
  id: string;
  patientRecordId: string;
  uhid: string;
  generatedAt: string;
  reasonForAdmission: {
    statement: string;
    sources: string[];
  };
  relevantHistory: {
    statement: string;
    sources: string[];
  };
  clinicalTimeline: ClinicalTimelineMilestone[];
  importantInvestigationFindings: InvestigationFinding[];
  documentedDiagnoses: DocumentedDiagnosis[];
  currentTreatment: CurrentTreatmentItem[];
  currentMedications: CurrentMedicationItem[];
  medicationChanges: MedicationChangeItem[];
  currentDocumentedStatus: DocumentedStatus;
  pendingInvestigations: PendingInvestigationItem[];
  importantDocumentedAlerts: DocumentedAlertItem[];
  secondOpinionBrief: SecondOpinionBrief;
  missingOrConflictingInformation: MissingOrConflictingInfo[];
  disclaimer: string;
}

