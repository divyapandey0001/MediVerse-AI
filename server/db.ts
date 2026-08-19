import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import {
  User,
  Appointment,
  BmiRecord,
  LabReportAnalysis,
  ContactMessage,
  Doctor,
  Review,
  UserFeedback,
  Prescription,
  ClinicalNote,
  PatientDoctorRelationship,
  AuditLog,
  UserRole
} from '../src/types.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

interface DatabaseSchema {
  users: (User & { passwordHash: string })[];
  appointments: Appointment[];
  bmiRecords: BmiRecord[];
  reports: LabReportAnalysis[];
  contactMessages: ContactMessage[];
  doctors: Doctor[];
  reviews: Review[];
  feedbacks: UserFeedback[];
  prescriptions: Prescription[];
  clinicalNotes: ClinicalNote[];
  patientDoctorRelationships: PatientDoctorRelationship[];
  auditLogs: AuditLog[];
}

const DEFAULT_DOCTORS: Doctor[] = [
  {
    id: 'doc-1',
    name: 'Dr. Sarah Jenkins, MD',
    specialty: 'Internal Medicine & Primary Care',
    qualification: 'MD, Board Certified Internal Medicine',
    department: 'General Medicine',
    experience: '14 years',
    availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  },
  {
    id: 'doc-2',
    name: 'Dr. Marcus Vance, MD',
    specialty: 'Cardiovascular Disease',
    qualification: 'MD, FACC - Cardiology',
    department: 'Cardiology',
    experience: '18 years',
    availableDays: ['Tuesday', 'Wednesday', 'Thursday']
  },
  {
    id: 'doc-3',
    name: 'Dr. Elena Rostova, MD',
    specialty: 'Endocrinology & Diabetes Care',
    qualification: 'MD, Endocrinology & Metabolism',
    department: 'Endocrinology',
    experience: '11 years',
    availableDays: ['Monday', 'Wednesday', 'Friday']
  },
  {
    id: 'doc-4',
    name: 'Dr. David Chen, MD',
    specialty: 'Pulmonology & Respiratory Health',
    qualification: 'MD, FCCP - Pulmonary Medicine',
    department: 'Pulmonology',
    experience: '15 years',
    availableDays: ['Monday', 'Tuesday', 'Thursday']
  },
  {
    id: 'doc-5',
    name: 'Dr. Anita Patel, MD',
    specialty: 'Clinical Hematology & Lab Medicine',
    qualification: 'MD, Clinical Pathology & Hematology',
    department: 'Hematology & Diagnostics',
    experience: '12 years',
    availableDays: ['Monday', 'Wednesday', 'Friday']
  }
];

function initDb(): DatabaseSchema {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    const initialData: DatabaseSchema = {
      users: [],
      appointments: [],
      bmiRecords: [],
      reports: [],
      contactMessages: [],
      doctors: DEFAULT_DOCTORS,
      reviews: [],
      feedbacks: [],
      prescriptions: [],
      clinicalNotes: [],
      patientDoctorRelationships: [],
      auditLogs: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.doctors || parsed.doctors.length === 0) {
      parsed.doctors = DEFAULT_DOCTORS;
    }
    if (!Array.isArray(parsed.reviews)) {
      parsed.reviews = [];
    }
    if (!Array.isArray(parsed.feedbacks)) {
      parsed.feedbacks = [];
    }
    if (!Array.isArray(parsed.prescriptions)) {
      parsed.prescriptions = [];
    }
    if (!Array.isArray(parsed.clinicalNotes)) {
      parsed.clinicalNotes = [];
    }
    if (!Array.isArray(parsed.patientDoctorRelationships)) {
      parsed.patientDoctorRelationships = [];
    }
    if (!Array.isArray(parsed.auditLogs)) {
      parsed.auditLogs = [];
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
    return parsed;
  } catch (err) {
    console.error('Error reading DB file, recreating:', err);
    const initialData: DatabaseSchema = {
      users: [],
      appointments: [],
      bmiRecords: [],
      reports: [],
      contactMessages: [],
      doctors: DEFAULT_DOCTORS,
      reviews: [],
      feedbacks: [],
      prescriptions: [],
      clinicalNotes: [],
      patientDoctorRelationships: [],
      auditLogs: []
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }
}

export const db = {
  get(): DatabaseSchema {
    return initDb();
  },

  save(data: DatabaseSchema) {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  },

  hashPassword(password: string): string {
    return crypto.createHash('sha256').update(password).digest('hex');
  },

  generateToken(userId: string): string {
    const payload = `${userId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
    return Buffer.from(payload).toString('base64');
  },

  verifyToken(token: string): string | null {
    try {
      const decoded = Buffer.from(token, 'base64').toString('utf-8');
      const [userId] = decoded.split(':');
      if (!userId) return null;
      const data = this.get();
      const user = data.users.find(u => u.id === userId);
      return user ? user.id : null;
    } catch {
      return null;
    }
  },

  generatePatientId(): string {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `PT-${randomDigits}`;
  },

  generatePrescriptionNumber(): string {
    const year = new Date().getFullYear();
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    return `RX-${year}-${randomDigits}`;
  },

  logAudit(entry: {
    userId: string;
    userName: string;
    role: UserRole;
    action: AuditLog['action'];
    recordId?: string;
    targetPatientId?: string;
    details: string;
  }) {
    const data = this.get();
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      userId: entry.userId,
      userName: entry.userName,
      role: entry.role,
      action: entry.action,
      recordId: entry.recordId,
      targetPatientId: entry.targetPatientId,
      details: entry.details,
      timestamp: new Date().toISOString()
    };
    data.auditLogs.unshift(newLog);
    // Keep max 2000 logs
    if (data.auditLogs.length > 2000) {
      data.auditLogs = data.auditLogs.slice(0, 2000);
    }
    this.save(data);
    return newLog;
  }
};
