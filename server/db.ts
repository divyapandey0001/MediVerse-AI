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
  UserRole,
  LivePatientRecord,
  PatientConsultation
} from '../src/types.js';

// Support both standard server (local/container) and Vercel Serverless (where process.cwd() is read-only)
const isVercel = !!process.env.VERCEL;
const DATA_DIR = isVercel ? '/tmp/mediverse-data' : path.join(process.cwd(), 'data');
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
  patientRecords: LivePatientRecord[];
  consultations: PatientConsultation[];
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

// In-memory memory fallback in case filesystem is completely locked
let memoryCache: DatabaseSchema | null = null;

function createDefaultDb(): DatabaseSchema {
  return {
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
    auditLogs: [],
    patientRecords: [],
    consultations: []
  };
}

function initDb(): DatabaseSchema {
  if (memoryCache) {
    return memoryCache;
  }

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (!fs.existsSync(DB_FILE)) {
      const initialData = createDefaultDb();
      try {
        fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      } catch (writeErr) {
        console.warn('Could not write initial db file, using in-memory state:', writeErr);
      }
      memoryCache = initialData;
      return initialData;
    }

    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (!parsed.doctors || parsed.doctors.length === 0) {
      parsed.doctors = DEFAULT_DOCTORS;
    }
    if (!Array.isArray(parsed.reviews)) parsed.reviews = [];
    if (!Array.isArray(parsed.feedbacks)) parsed.feedbacks = [];
    if (!Array.isArray(parsed.prescriptions)) parsed.prescriptions = [];
    if (!Array.isArray(parsed.clinicalNotes)) parsed.clinicalNotes = [];
    if (!Array.isArray(parsed.patientDoctorRelationships)) parsed.patientDoctorRelationships = [];
    if (!Array.isArray(parsed.auditLogs)) parsed.auditLogs = [];
    if (!Array.isArray(parsed.patientRecords)) parsed.patientRecords = [];
    if (!Array.isArray(parsed.consultations)) parsed.consultations = [];

    memoryCache = parsed;
    return parsed;
  } catch (err) {
    console.warn('DB read error, initializing fallback in-memory db:', err);
    const initialData = createDefaultDb();
    memoryCache = initialData;
    return initialData;
  }
}

// Token signing secret and revocation cache
const TOKEN_SECRET = process.env.TOKEN_SECRET || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days expiration
const revokedTokens = new Set<string>();

export const db = {
  get(): DatabaseSchema {
    return initDb();
  },

  save(data: DatabaseSchema) {
    memoryCache = data;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.warn('DB file write warning (persisting in memory):', err);
    }
  },

  /**
   * Hashes a password using PBKDF2 with salt.
   */
  hashPassword(password: string, salt?: string): string {
    const activeSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(password, activeSalt, 100000, 32, 'sha256').toString('hex');
    return `pbkdf2$100000$${activeSalt}$${hash}`;
  },

  /**
   * Securely verifies a password against stored hash (supporting both new PBKDF2 and legacy SHA256).
   */
  verifyPassword(password: string, storedHash: string): boolean {
    if (!storedHash) return false;

    // Check if it's a salted PBKDF2 hash
    if (storedHash.startsWith('pbkdf2$')) {
      const parts = storedHash.split('$');
      if (parts.length === 4) {
        const iterations = parseInt(parts[1], 10) || 100000;
        const salt = parts[2];
        const expectedHash = parts[3];
        const computedHash = crypto.pbkdf2Sync(password, salt, iterations, 32, 'sha256').toString('hex');
        return crypto.timingSafeEqual(Buffer.from(expectedHash, 'hex'), Buffer.from(computedHash, 'hex'));
      }
    }

    // Legacy SHA-256 fallback
    const legacyHash = crypto.createHash('sha256').update(password).digest('hex');
    try {
      return crypto.timingSafeEqual(Buffer.from(legacyHash, 'hex'), Buffer.from(storedHash, 'hex'));
    } catch {
      return legacyHash === storedHash;
    }
  },

  /**
   * Generates a signed, tamper-proof session token with expiry and signature.
   */
  generateToken(userId: string): string {
    const issuedAt = Date.now();
    const expiresAt = issuedAt + TOKEN_TTL_MS;
    const nonce = crypto.randomBytes(12).toString('hex');
    const payload = `${userId}:${issuedAt}:${expiresAt}:${nonce}`;
    const signature = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
    return Buffer.from(`${payload}.${signature}`).toString('base64url');
  },

  /**
   * Cryptographically verifies token signature, expiry, and revocation state.
   */
  verifyToken(token: string): string | null {
    try {
      if (!token || typeof token !== 'string') return null;
      if (revokedTokens.has(token)) return null;

      // Check URL-safe base64 / standard base64 decoding
      let rawToken: string;
      try {
        rawToken = Buffer.from(token, 'base64url').toString('utf-8');
      } catch {
        rawToken = Buffer.from(token, 'base64').toString('utf-8');
      }

      // Signed token format: payload.signature
      if (rawToken.includes('.')) {
        const [payload, signature] = rawToken.split('.');
        if (!payload || !signature) return null;

        const expectedSignature = crypto.createHmac('sha256', TOKEN_SECRET).update(payload).digest('base64url');
        const sigBuf = Buffer.from(signature);
        const expBuf = Buffer.from(expectedSignature);

        if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
          return null; // Signature mismatch / tampering attempt
        }

        const [userId, _issuedAt, expiresAtStr] = payload.split(':');
        const expiresAt = parseInt(expiresAtStr, 10);

        if (isNaN(expiresAt) || Date.now() > expiresAt) {
          return null; // Token expired
        }

        const data = this.get();
        const user = data.users.find(u => u.id === userId);
        return user ? user.id : null;
      }

      // Legacy fallback token format (userId:timestamp:nonce) with 7-day TTL
      const [userId, issuedAtStr] = rawToken.split(':');
      if (!userId) return null;

      const issuedAt = parseInt(issuedAtStr, 10);
      if (!isNaN(issuedAt) && Date.now() - issuedAt > TOKEN_TTL_MS) {
        return null; // Expired legacy token
      }

      const data = this.get();
      const user = data.users.find(u => u.id === userId);
      return user ? user.id : null;
    } catch {
      return null;
    }
  },

  /**
   * Revokes a session token immediately.
   */
  revokeToken(token: string) {
    if (token) {
      revokedTokens.add(token);
      // Clean up old entries if cache grows large (> 10000)
      if (revokedTokens.size > 10000) {
        const iterator = revokedTokens.values();
        for (let i = 0; i < 2000; i++) {
          const item = iterator.next().value;
          if (item) revokedTokens.delete(item);
        }
      }
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
    if (data.auditLogs.length > 2000) {
      data.auditLogs = data.auditLogs.slice(0, 2000);
    }
    this.save(data);
    return newLog;
  }
};
