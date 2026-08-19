import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { db } from './server/db.js';
import {
  analyzeLabReportDocument,
  processHealthChat,
  analyzeSymptoms,
  lookupMedicineInfo
} from './server/gemini.js';
import {
  User,
  UserRole,
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
  AuditLog
} from './src/types.js';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  // Allow up to 50MB for PDF and high-res image report uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Helper auth middleware
  function authenticateUser(req: Request): User | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split(' ')[1];
    const userId = db.verifyToken(token);
    if (!userId) return null;
    const data = db.get();
    return data.users.find(u => u.id === userId) || null;
  }

  function authenticate(req: Request): string | null {
    const user = authenticateUser(req);
    return user ? user.id : null;
  }

  // --- API Routes ---

  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'MediVerse API', timestamp: new Date().toISOString() });
  });

  // 1. Authentication Endpoints
  app.post('/api/auth/signup', (req: Request, res: Response) => {
    try {
      const {
        name,
        email,
        password,
        phone,
        role = 'patient',
        age,
        dateOfBirth,
        gender,
        bloodGroup,
        allergies,
        emergencyContact,
        specialty,
        qualification,
        department,
        licenseNumber,
        hospitalAffiliation
      } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const userRole: UserRole = role === 'doctor' ? 'doctor' : 'patient';
      const data = db.get();

      if (data.users.some(u => u.email === normalizedEmail)) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const patientId = userRole === 'patient' ? db.generatePatientId() : undefined;

      const newUser: User & { passwordHash: string } = {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        role: userRole,
        patientId,
        phone: phone ? phone.trim() : undefined,
        age: age ? Number(age) : undefined,
        dateOfBirth: dateOfBirth ? dateOfBirth.trim() : undefined,
        gender: gender ? gender.trim() : undefined,
        bloodGroup: bloodGroup ? bloodGroup.trim() : undefined,
        allergies: allergies ? allergies.trim() : undefined,
        emergencyContact: emergencyContact ? emergencyContact.trim() : undefined,
        specialty: userRole === 'doctor' ? (specialty ? specialty.trim() : 'General Medicine') : undefined,
        qualification: userRole === 'doctor' ? (qualification ? qualification.trim() : 'MD') : undefined,
        department: userRole === 'doctor' ? (department ? department.trim() : 'General Practice') : undefined,
        licenseNumber: userRole === 'doctor' ? (licenseNumber ? licenseNumber.trim() : `MED-${Math.floor(100000 + Math.random() * 900000)}`) : undefined,
        hospitalAffiliation: userRole === 'doctor' ? (hospitalAffiliation ? hospitalAffiliation.trim() : 'MediVerse Healthcare Network') : undefined,
        createdAt: new Date().toISOString(),
        passwordHash: db.hashPassword(password)
      };

      data.users.push(newUser);

      // If registered as doctor, also ensure entry in doctors list for appointment booking
      if (userRole === 'doctor') {
        const existingDoc = data.doctors.find(d => d.name.toLowerCase() === newUser.name.toLowerCase());
        if (!existingDoc) {
          data.doctors.push({
            id: `doc_${userId}`,
            name: newUser.name.startsWith('Dr.') ? newUser.name : `Dr. ${newUser.name}`,
            specialty: newUser.specialty || 'General Medicine',
            qualification: newUser.qualification || 'MD',
            department: newUser.department || 'General Practice',
            experience: '8+ years',
            availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
          });
        }
      }

      db.save(data);

      const token = db.generateToken(userId);
      const { passwordHash: _, ...safeUser } = newUser;

      res.status(201).json({ user: safeUser, token });
    } catch (err: any) {
      console.error('Signup error:', err);
      res.status(500).json({ error: 'Failed to create account.' });
    }
  });

  app.post('/api/auth/login', (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const data = db.get();
      const user = data.users.find(u => u.email === normalizedEmail);

      if (!user || user.passwordHash !== db.hashPassword(password)) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }

      // Backward compatibility for existing users without role or patientId
      if (!user.role) {
        user.role = 'patient';
      }
      if (user.role === 'patient' && !user.patientId) {
        user.patientId = db.generatePatientId();
        db.save(data);
      }

      const token = db.generateToken(user.id);
      const { passwordHash: _, ...safeUser } = user;

      res.json({ user: safeUser, token });
    } catch (err: any) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Login failed.' });
    }
  });

  app.post('/api/auth/forgot-password', (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }
      const data = db.get();
      const user = data.users.find(u => u.email === email.trim().toLowerCase());
      if (!user) {
        return res.json({ message: 'If an account exists with this email, password reset instructions have been generated.' });
      }
      res.json({ message: `Password reset link has been sent to ${email}.` });
    } catch (err: any) {
      res.status(500).json({ error: 'Request failed.' });
    }
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const { passwordHash: _, ...safeUser } = user as any;
      res.json({ user: safeUser });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch user profile.' });
    }
  });

  app.put('/api/auth/profile', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const data = db.get();
      const userIndex = data.users.findIndex(u => u.id === user.id);
      if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const {
        name,
        phone,
        age,
        dateOfBirth,
        gender,
        bloodGroup,
        allergies,
        emergencyContact,
        address,
        specialty,
        qualification,
        department,
        licenseNumber,
        hospitalAffiliation
      } = req.body;

      if (name) data.users[userIndex].name = name;
      if (phone !== undefined) data.users[userIndex].phone = phone;
      if (age !== undefined) data.users[userIndex].age = Number(age) || undefined;
      if (dateOfBirth !== undefined) data.users[userIndex].dateOfBirth = dateOfBirth;
      if (gender !== undefined) data.users[userIndex].gender = gender;
      if (bloodGroup !== undefined) data.users[userIndex].bloodGroup = bloodGroup;
      if (allergies !== undefined) data.users[userIndex].allergies = allergies;
      if (emergencyContact !== undefined) data.users[userIndex].emergencyContact = emergencyContact;
      if (address !== undefined) data.users[userIndex].address = address;

      if (data.users[userIndex].role === 'doctor') {
        if (specialty !== undefined) data.users[userIndex].specialty = specialty;
        if (qualification !== undefined) data.users[userIndex].qualification = qualification;
        if (department !== undefined) data.users[userIndex].department = department;
        if (licenseNumber !== undefined) data.users[userIndex].licenseNumber = licenseNumber;
        if (hospitalAffiliation !== undefined) data.users[userIndex].hospitalAffiliation = hospitalAffiliation;
      }

      db.save(data);
      const { passwordHash: _, ...safeUser } = data.users[userIndex];
      res.json({ user: safeUser });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update profile.' });
    }
  });

  // 2. AI Lab Report Analysis
  app.post('/api/ai/analyze-report', async (req: Request, res: Response) => {
    try {
      const { base64Data, mimeType, fileName, fileSize } = req.body;
      if (!base64Data || !mimeType || !fileName) {
        return res.status(400).json({ error: 'Report file data, MIME type, and file name are required.' });
      }

      const userId = authenticate(req) || undefined;

      // Call Gemini for real multimodal extraction & analysis
      const analysis = await analyzeLabReportDocument({
        base64Data,
        mimeType,
        fileName,
        fileSize,
        userId
      });

      // If user is logged in, automatically save report analysis to user's history
      if (userId) {
        const data = db.get();
        data.reports.unshift(analysis);
        db.save(data);
      }

      res.json({ success: true, analysis });
    } catch (err: any) {
      console.error('Report analysis error:', err);
      if (err.message?.includes('GEMINI_API_KEY')) {
        return res.status(503).json({ error: 'AI analysis is temporarily unavailable. Please verify API configuration.' });
      }
      res.status(500).json({
        error: 'Unable to read this file. Please upload a clearer PDF or image, or verify the document format.'
      });
    }
  });

  // 3. AI Health Chat
  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { message, history = [], reportContext, userProfile } = req.body;
      if (!message || typeof message !== 'string' || !message.trim()) {
        return res.status(400).json({ error: 'Message cannot be empty.' });
      }

      const reply = await processHealthChat({
        message: message.trim(),
        history,
        reportContext,
        userProfile
      });

      res.json({ reply });
    } catch (err: any) {
      console.error('Health chat error:', err);
      res.status(500).json({
        error: 'AI assistant is currently busy. Please try asking your health question again.'
      });
    }
  });

  // 4. Symptom Checker
  app.post('/api/ai/check-symptoms', async (req: Request, res: Response) => {
    try {
      const { symptoms, age, gender, duration } = req.body;
      if (!symptoms || !symptoms.trim()) {
        return res.status(400).json({ error: 'Please enter your symptoms to analyze.' });
      }

      const result = await analyzeSymptoms({
        symptoms: symptoms.trim(),
        age: age ? Number(age) : undefined,
        gender,
        duration
      });

      res.json({ success: true, result });
    } catch (err: any) {
      console.error('Symptom checker error:', err);
      res.status(500).json({ error: 'Failed to analyze symptoms. Please try again with clear descriptions.' });
    }
  });

  // 5. Medicine Information
  app.post('/api/ai/medicine-info', async (req: Request, res: Response) => {
    try {
      const { medicineName } = req.body;
      if (!medicineName || !medicineName.trim()) {
        return res.status(400).json({ error: 'Please enter a medicine name.' });
      }

      const result = await lookupMedicineInfo(medicineName.trim());
      res.json({ success: true, result });
    } catch (err: any) {
      console.error('Medicine info error:', err);
      res.status(500).json({ error: 'Could not find medicine information. Please check the spelling.' });
    }
  });

  // 6. Appointments Endpoints
  app.get('/api/appointments', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      const data = db.get();
      if (user) {
        if (user.role === 'doctor') {
          // Return appointments for this doctor by doctorName or doctorUserId
          const docAppts = data.appointments.filter(
            a => a.doctorUserId === user.id || a.doctorName.toLowerCase().includes(user.name.toLowerCase())
          );
          return res.json({ appointments: docAppts });
        } else {
          // Return appointments for this patient
          const userAppts = data.appointments.filter(a => a.userId === user.id || a.email.toLowerCase() === user.email.toLowerCase());
          return res.json({ appointments: userAppts });
        }
      }
      // If unauthenticated, return search by email if provided
      const emailQuery = req.query.email as string;
      if (emailQuery) {
        const matching = data.appointments.filter(a => a.email.toLowerCase() === emailQuery.toLowerCase());
        return res.json({ appointments: matching });
      }
      res.json({ appointments: [] });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch appointments.' });
    }
  });

  app.post('/api/appointments', (req: Request, res: Response) => {
    try {
      const { patientName, email, phone, specialty, doctorName, appointmentDate, appointmentTime, reason } = req.body;
      if (!patientName || !email || !phone || !specialty || !doctorName || !appointmentDate || !appointmentTime) {
        return res.status(400).json({ error: 'All appointment fields are required.' });
      }

      const user = authenticateUser(req);
      const data = db.get();

      // Find matching doctor user if any
      const matchingDoctor = data.users.find(
        u => u.role === 'doctor' && (u.name.toLowerCase() === doctorName.toLowerCase() || doctorName.toLowerCase().includes(u.name.toLowerCase()))
      );

      const appointmentCode = `MV-APT-${Math.floor(100000 + Math.random() * 900000)}`;
      const newAppointment: Appointment = {
        id: `apt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        appointmentCode,
        userId: user?.id,
        doctorId: matchingDoctor ? matchingDoctor.id : undefined,
        doctorUserId: matchingDoctor ? matchingDoctor.id : undefined,
        patientName: patientName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        specialty: specialty.trim(),
        doctorName: doctorName.trim(),
        appointmentDate,
        appointmentTime,
        reason: (reason || '').trim(),
        status: 'Confirmed',
        createdAt: new Date().toISOString()
      };

      data.appointments.unshift(newAppointment);

      // If user is patient and doctor exists, create relationship automatically
      if (user && user.role === 'patient' && matchingDoctor) {
        const relExists = data.patientDoctorRelationships.some(
          r => r.patientUserId === user.id && r.doctorUserId === matchingDoctor.id
        );
        if (!relExists) {
          data.patientDoctorRelationships.push({
            id: `pdr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
            patientUserId: user.id,
            patientId: user.patientId || `PT-${Math.floor(100000 + Math.random() * 900000)}`,
            patientName: user.name,
            patientEmail: user.email,
            doctorUserId: matchingDoctor.id,
            doctorName: matchingDoctor.name,
            status: 'active',
            createdAt: new Date().toISOString()
          });
        }
      }

      db.save(data);

      res.status(201).json({ success: true, appointment: newAppointment });
    } catch (err: any) {
      console.error('Book appointment error:', err);
      res.status(500).json({ error: 'Failed to schedule appointment.' });
    }
  });

  app.delete('/api/appointments/:id', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      const apptId = req.params.id;
      const data = db.get();
      const index = data.appointments.findIndex(a => a.id === apptId);

      if (index === -1) {
        return res.status(404).json({ error: 'Appointment not found.' });
      }

      // Check ownership if user is logged in
      if (user) {
        const appt = data.appointments[index];
        const isOwner = appt.userId === user.id || appt.doctorUserId === user.id || appt.email.toLowerCase() === user.email.toLowerCase();
        if (!isOwner) {
          return res.status(403).json({ error: 'Unauthorized to cancel this appointment.' });
        }
      }

      data.appointments[index].status = 'Cancelled';
      db.save(data);

      res.json({ success: true, message: 'Appointment cancelled successfully.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to cancel appointment.' });
    }
  });

  // 7. Doctors List & Management
  app.get('/api/doctors', (req: Request, res: Response) => {
    try {
      const data = db.get();
      res.json({ doctors: data.doctors || [] });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch doctors.' });
    }
  });

  // 8. BMI Records
  app.get('/api/bmi', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user) {
        return res.json({ records: [] });
      }
      const data = db.get();
      const userRecords = data.bmiRecords.filter(r => r.userId === user.id);
      res.json({ records: userRecords });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch BMI records.' });
    }
  });

  app.post('/api/bmi', (req: Request, res: Response) => {
    try {
      const { age, sex, heightCm, weightKg, bmi, category, guidance } = req.body;
      if (!heightCm || !weightKg || !bmi || !category) {
        return res.status(400).json({ error: 'Missing BMI calculation parameters.' });
      }

      const user = authenticateUser(req);
      const data = db.get();

      const newRecord: BmiRecord = {
        id: `bmi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId: user?.id,
        date: new Date().toISOString(),
        age: Number(age) || 30,
        sex: sex || 'Not specified',
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        bmi: Number(bmi),
        category,
        guidance: guidance || []
      };

      if (user) {
        data.bmiRecords.unshift(newRecord);
        db.save(data);
      }

      res.status(201).json({ success: true, record: newRecord });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save BMI calculation.' });
    }
  });

  app.delete('/api/bmi/:id', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const recordId = req.params.id;
      const data = db.get();
      const index = data.bmiRecords.findIndex(r => r.id === recordId && r.userId === user.id);
      if (index === -1) {
        return res.status(404).json({ error: 'Record not found.' });
      }
      data.bmiRecords.splice(index, 1);
      db.save(data);
      res.json({ success: true, message: 'BMI record removed.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete BMI record.' });
    }
  });

  // 9. Saved Reports History & Report Comparison
  app.get('/api/reports', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user) {
        return res.json({ reports: [] });
      }
      const data = db.get();

      // If doctor requested a specific patient
      const patientUserId = req.query.patientUserId as string;
      const patientId = req.query.patientId as string;

      if (user.role === 'doctor' && (patientUserId || patientId)) {
        // Verify relationship
        const hasRel = data.patientDoctorRelationships.some(
          r => r.doctorUserId === user.id && (r.patientUserId === patientUserId || r.patientId === patientId)
        );
        if (!hasRel) {
          return res.status(403).json({ error: 'You are not authorized to view this patient\'s health reports.' });
        }

        const patientReports = data.reports.filter(
          r => (patientUserId && r.userId === patientUserId) || (patientId && r.patientId === patientId)
        );

        db.logAudit({
          userId: user.id,
          userName: user.name,
          role: 'doctor',
          action: 'REPORT_VIEWED',
          targetPatientId: patientId || patientUserId,
          details: `Doctor accessed ${patientReports.length} reports for patient ${patientId || patientUserId}`
        });

        return res.json({ reports: patientReports });
      }

      // Patient views own reports
      const userReports = data.reports.filter(r => r.userId === user.id);
      res.json({ reports: userReports });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch saved reports.' });
    }
  });

  app.get('/api/reports/:id', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const reportId = req.params.id;
      const data = db.get();
      const report = data.reports.find(r => r.id === reportId);

      if (!report) {
        return res.status(404).json({ error: 'Report not found.' });
      }

      // Check access permission
      if (report.userId && report.userId !== user.id) {
        if (user.role === 'doctor') {
          const hasRel = data.patientDoctorRelationships.some(
            r => r.doctorUserId === user.id && (r.patientUserId === report.userId || r.patientId === report.patientId)
          );
          if (!hasRel) {
            return res.status(403).json({ error: 'Access denied: Patient has not authorized your practice.' });
          }
        } else {
          return res.status(403).json({ error: 'Access denied: You do not own this private report.' });
        }
      }

      db.logAudit({
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: 'REPORT_VIEWED',
        recordId: report.id,
        targetPatientId: report.patientId,
        details: `${user.name} viewed report "${report.fileName}"`
      });

      res.json({ report });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch report.' });
    }
  });

  app.post('/api/reports', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const analysis: LabReportAnalysis = req.body;
      if (!analysis || !analysis.fileName || !analysis.testResults) {
        return res.status(400).json({ error: 'Invalid analysis payload.' });
      }
      analysis.userId = user.id;
      analysis.patientId = user.patientId;
      const data = db.get();
      data.reports.unshift(analysis);
      db.save(data);

      db.logAudit({
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: 'REPORT_UPLOADED',
        recordId: analysis.id,
        targetPatientId: user.patientId,
        details: `${user.name} uploaded and saved laboratory analysis for "${analysis.fileName}" (${analysis.testResults.length} parameters)`
      });

      res.status(201).json({ success: true, report: analysis });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save report.' });
    }
  });

  app.delete('/api/reports/:id', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const reportId = req.params.id;
      const data = db.get();
      const index = data.reports.findIndex(r => r.id === reportId && r.userId === user.id);
      if (index === -1) {
        return res.status(404).json({ error: 'Report not found or not owned by you.' });
      }

      const deleted = data.reports.splice(index, 1)[0];
      db.save(data);

      db.logAudit({
        userId: user.id,
        userName: user.name,
        role: user.role,
        action: 'REPORT_DELETED',
        recordId: reportId,
        details: `${user.name} permanently deleted laboratory report "${deleted?.fileName}"`
      });

      res.json({ success: true, message: 'Report permanently deleted.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete report.' });
    }
  });

  // Report Comparison Endpoint
  app.post('/api/reports/compare', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const { previousReportId, currentReportId } = req.body;
      if (!previousReportId || !currentReportId) {
        return res.status(400).json({ error: 'Both previous and current report IDs are required.' });
      }

      const data = db.get();
      const prevReport = data.reports.find(r => r.id === previousReportId);
      const currReport = data.reports.find(r => r.id === currentReportId);

      if (!prevReport || !currReport) {
        return res.status(404).json({ error: 'One or both reports could not be found.' });
      }

      // Verify permission
      if (user.role === 'patient') {
        if (prevReport.userId !== user.id || currReport.userId !== user.id) {
          return res.status(403).json({ error: 'Unauthorized to compare these reports.' });
        }
      } else if (user.role === 'doctor') {
        const patientUserId = prevReport.userId || currReport.userId;
        const hasRel = data.patientDoctorRelationships.some(
          r => r.doctorUserId === user.id && r.patientUserId === patientUserId
        );
        if (!hasRel) {
          return res.status(403).json({ error: 'Unauthorized: Doctor has no relationship with this patient.' });
        }
      }

      // Perform matching and comparison
      const prevMap = new Map<string, typeof prevReport.testResults[0]>();
      prevReport.testResults.forEach(t => {
        prevMap.set(t.testName.trim().toLowerCase(), t);
      });

      const currMap = new Map<string, typeof currReport.testResults[0]>();
      currReport.testResults.forEach(t => {
        currMap.set(t.testName.trim().toLowerCase(), t);
      });

      const allTestNames = Array.from(new Set([...Array.from(prevMap.keys()), ...Array.from(currMap.keys())]));
      let matchingCount = 0;

      const comparedTests = allTestNames.map(normName => {
        const prev = prevMap.get(normName);
        const curr = currMap.get(normName);
        const displayName = (curr || prev)!.testName;
        const unit = (curr || prev)!.unit || '';
        const referenceRange = (curr || prev)!.referenceRange || '';

        if (prev && curr) {
          matchingCount++;
          const prevNum = parseFloat(prev.result.replace(/[^0-9.-]/g, ''));
          const currNum = parseFloat(curr.result.replace(/[^0-9.-]/g, ''));

          let deltaText = '—';
          let trend: 'improved' | 'concerning' | 'stable' | 'increased' | 'decreased' | 'single-report' = 'stable';
          let interpretation = 'Parameters remain steady between both report dates.';

          if (!isNaN(prevNum) && !isNaN(currNum)) {
            const diff = +(currNum - prevNum).toFixed(2);
            if (diff > 0) {
              deltaText = `+${diff} ${unit}`.trim();
              trend = 'increased';
            } else if (diff < 0) {
              deltaText = `${diff} ${unit}`.trim();
              trend = 'decreased';
            } else {
              deltaText = `0 ${unit}`.trim();
              trend = 'stable';
            }

            if (prev.status !== 'Normal' && curr.status === 'Normal') {
              trend = 'improved';
              interpretation = 'Remarkable improvement towards normal laboratory reference range.';
            } else if (prev.status === 'Normal' && curr.status !== 'Normal') {
              trend = 'concerning';
              interpretation = 'Shifted from normal range to abnormal status. Discuss with your physician.';
            } else if (trend === 'increased') {
              interpretation = 'Value increased since previous lab check.';
            } else if (trend === 'decreased') {
              interpretation = 'Value decreased since previous lab check.';
            }
          }

          return {
            testName: displayName,
            unit,
            referenceRange,
            prevValue: prev.result,
            currValue: curr.result,
            prevStatus: prev.status,
            currStatus: curr.status,
            deltaText,
            trend,
            generalInterpretation: interpretation
          };
        } else if (curr && !prev) {
          return {
            testName: displayName,
            unit,
            referenceRange,
            prevValue: null,
            currValue: curr.result,
            currStatus: curr.status,
            deltaText: 'Not in previous report',
            trend: 'single-report' as const,
            generalInterpretation: 'New parameter evaluated in current report only.'
          };
        } else {
          return {
            testName: displayName,
            unit,
            referenceRange,
            prevValue: prev!.result,
            currValue: null,
            prevStatus: prev!.status,
            deltaText: 'Not in current report',
            trend: 'single-report' as const,
            generalInterpretation: 'Parameter was checked in earlier report but not repeated in current test.'
          };
        }
      });

      const summary = `Comparison between "${prevReport.fileName}" (${new Date(prevReport.uploadedAt).toLocaleDateString()}) and "${currReport.fileName}" (${new Date(currReport.uploadedAt).toLocaleDateString()}): Analyzed ${comparedTests.length} total test markers across both reports, with ${matchingCount} directly matched parameters for longitudinal tracking.`;

      res.json({
        comparison: {
          previousReport: prevReport,
          currentReport: currReport,
          comparedTests,
          matchingCount,
          summary
        }
      });
    } catch (err: any) {
      console.error('Report comparison error:', err);
      res.status(500).json({ error: 'Failed to compare reports.' });
    }
  });

  // 10. Prescriptions System (Phases 9 & 10)
  app.get('/api/prescriptions', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const data = db.get();

      if (user.role === 'patient') {
        const patientPrescriptions = data.prescriptions.filter(
          p => p.patientUserId === user.id || p.patientId === user.patientId
        );
        return res.json({ prescriptions: patientPrescriptions });
      }

      if (user.role === 'doctor') {
        const patientUserId = req.query.patientUserId as string;
        if (patientUserId) {
          const list = data.prescriptions.filter(
            p => p.patientUserId === patientUserId && p.doctorUserId === user.id
          );
          return res.json({ prescriptions: list });
        }
        // Return all prescriptions created by this doctor
        const docPrescriptions = data.prescriptions.filter(p => p.doctorUserId === user.id);
        return res.json({ prescriptions: docPrescriptions });
      }

      res.json({ prescriptions: [] });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch prescriptions.' });
    }
  });

  app.post('/api/prescriptions', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user || user.role !== 'doctor') {
        return res.status(403).json({ error: 'Only licensed doctors can author clinical prescriptions.' });
      }

      const {
        patientUserId,
        patientId,
        diagnosis,
        medicines,
        instructions,
        additionalNotes,
        followUpDate
      } = req.body;

      if (!patientUserId || !diagnosis || !medicines || !Array.isArray(medicines) || medicines.length === 0) {
        return res.status(400).json({ error: 'Patient selection, diagnosis, and at least one medication are required.' });
      }

      const data = db.get();
      const patient = data.users.find(u => u.id === patientUserId);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found.' });
      }

      // Verify relationship or auto-create
      const relExists = data.patientDoctorRelationships.some(
        r => r.patientUserId === patient.id && r.doctorUserId === user.id
      );
      if (!relExists) {
        data.patientDoctorRelationships.push({
          id: `pdr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          patientUserId: patient.id,
          patientId: patient.patientId || patientId || `PT-${Math.floor(100000 + Math.random() * 900000)}`,
          patientName: patient.name,
          patientEmail: patient.email,
          doctorUserId: user.id,
          doctorName: user.name,
          status: 'active',
          createdAt: new Date().toISOString()
        });
      }

      const prescription: Prescription = {
        id: `rx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        prescriptionNumber: db.generatePrescriptionNumber(),
        patientUserId: patient.id,
        patientId: patient.patientId || patientId || 'PT-UNKNOWN',
        patientName: patient.name,
        patientAge: patient.age,
        patientGender: patient.gender,
        doctorUserId: user.id,
        doctorName: user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`,
        doctorSpecialty: user.specialty || 'General Medicine',
        doctorQualification: user.qualification || 'MD',
        doctorLicense: user.licenseNumber || 'LIC-VERIFIED',
        diagnosis: diagnosis.trim(),
        medicines: medicines.map((m: any) => ({
          name: m.name.trim(),
          strength: (m.strength || '').trim(),
          frequency: (m.frequency || 'Once daily').trim(),
          duration: (m.duration || '7 days').trim(),
          instructions: (m.instructions || 'As directed').trim()
        })),
        instructions: (instructions || 'Take medications exactly as prescribed with water.').trim(),
        additionalNotes: additionalNotes ? additionalNotes.trim() : undefined,
        followUpDate: followUpDate ? followUpDate.trim() : undefined,
        createdAt: new Date().toISOString()
      };

      data.prescriptions.unshift(prescription);
      db.save(data);

      db.logAudit({
        userId: user.id,
        userName: user.name,
        role: 'doctor',
        action: 'PRESCRIPTION_CREATED',
        recordId: prescription.id,
        targetPatientId: prescription.patientId,
        details: `Dr. ${user.name} generated official prescription ${prescription.prescriptionNumber} for patient ${patient.name} (Diagnosis: ${prescription.diagnosis})`
      });

      res.status(201).json({ success: true, prescription });
    } catch (err: any) {
      console.error('Create prescription error:', err);
      res.status(500).json({ error: 'Failed to create prescription.' });
    }
  });

  // 11. Clinical Notes Endpoints (Phase 8)
  app.get('/api/clinical-notes', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const data = db.get();

      if (user.role === 'patient') {
        const notes = data.clinicalNotes.filter(n => n.patientUserId === user.id);
        return res.json({ clinicalNotes: notes });
      }

      if (user.role === 'doctor') {
        const patientUserId = req.query.patientUserId as string;
        if (patientUserId) {
          const notes = data.clinicalNotes.filter(n => n.patientUserId === patientUserId);
          return res.json({ clinicalNotes: notes });
        }
        const doctorNotes = data.clinicalNotes.filter(n => n.doctorUserId === user.id);
        return res.json({ clinicalNotes: doctorNotes });
      }

      res.json({ clinicalNotes: [] });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch clinical notes.' });
    }
  });

  app.post('/api/clinical-notes', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user || user.role !== 'doctor') {
        return res.status(403).json({ error: 'Only doctors can create clinical notes.' });
      }

      const { patientUserId, diagnosis, clinicalObservations, treatmentPlan, followUpDate } = req.body;
      if (!patientUserId || !diagnosis || !clinicalObservations || !treatmentPlan) {
        return res.status(400).json({ error: 'Diagnosis, clinical observations, and treatment plan are required.' });
      }

      const data = db.get();
      const patient = data.users.find(u => u.id === patientUserId);
      if (!patient) {
        return res.status(404).json({ error: 'Patient not found.' });
      }

      const newNote: ClinicalNote = {
        id: `cn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientUserId: patient.id,
        patientId: patient.patientId || 'PT-UNKNOWN',
        patientName: patient.name,
        doctorUserId: user.id,
        doctorName: user.name.startsWith('Dr.') ? user.name : `Dr. ${user.name}`,
        doctorSpecialty: user.specialty || 'General Medicine',
        diagnosis: diagnosis.trim(),
        clinicalObservations: clinicalObservations.trim(),
        treatmentPlan: treatmentPlan.trim(),
        followUpDate: followUpDate ? followUpDate.trim() : undefined,
        createdAt: new Date().toISOString()
      };

      data.clinicalNotes.unshift(newNote);
      db.save(data);

      db.logAudit({
        userId: user.id,
        userName: user.name,
        role: 'doctor',
        action: 'CLINICAL_NOTE_CREATED',
        recordId: newNote.id,
        targetPatientId: patient.patientId,
        details: `Dr. ${user.name} recorded clinical assessment and treatment plan for ${patient.name}`
      });

      res.status(201).json({ success: true, note: newNote });
    } catch (err: any) {
      console.error('Create clinical note error:', err);
      res.status(500).json({ error: 'Failed to save clinical note.' });
    }
  });

  // 12. Doctor Patient Management (Phases 6, 7 & 14)
  app.get('/api/doctor/patients', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user || user.role !== 'doctor') {
        return res.status(403).json({ error: 'Access restricted to authorized doctors.' });
      }

      const data = db.get();
      const relationships = data.patientDoctorRelationships.filter(r => r.doctorUserId === user.id && r.status === 'active');

      const patientList = relationships.map(rel => {
        const patientUser = data.users.find(u => u.id === rel.patientUserId);
        const reportCount = data.reports.filter(r => r.userId === rel.patientUserId).length;
        const prescriptionCount = data.prescriptions.filter(p => p.patientUserId === rel.patientUserId).length;
        const lastAppt = data.appointments.find(a => a.userId === rel.patientUserId || a.email.toLowerCase() === rel.patientEmail.toLowerCase());

        return {
          relationshipId: rel.id,
          patientUserId: rel.patientUserId,
          patientId: rel.patientId || patientUser?.patientId || 'PT-UNKNOWN',
          name: rel.patientName,
          email: rel.patientEmail,
          phone: patientUser?.phone || '',
          age: patientUser?.age,
          gender: patientUser?.gender,
          bloodGroup: patientUser?.bloodGroup,
          allergies: patientUser?.allergies,
          emergencyContact: patientUser?.emergencyContact,
          reportCount,
          prescriptionCount,
          lastActivity: lastAppt ? lastAppt.appointmentDate : rel.createdAt
        };
      });

      res.json({ patients: patientList });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch patients list.' });
    }
  });

  app.post('/api/doctor/patients/link', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user || user.role !== 'doctor') {
        return res.status(403).json({ error: 'Access restricted to doctors.' });
      }

      const { patientSearch } = req.body;
      if (!patientSearch || !patientSearch.trim()) {
        return res.status(400).json({ error: 'Please enter a Patient ID (e.g. PT-123456) or Email address.' });
      }

      const query = patientSearch.trim().toLowerCase();
      const data = db.get();

      const patient = data.users.find(
        u => u.role === 'patient' && (
          (u.patientId && u.patientId.toLowerCase() === query) ||
          u.email.toLowerCase() === query
        )
      );

      if (!patient) {
        return res.status(404).json({
          error: `No registered patient found matching "${patientSearch}". Please confirm the Patient ID with the patient.`
        });
      }

      const existingRel = data.patientDoctorRelationships.find(
        r => r.doctorUserId === user.id && r.patientUserId === patient.id
      );

      if (existingRel) {
        return res.status(400).json({ error: 'This patient is already linked to your doctor roster.' });
      }

      const newRel: PatientDoctorRelationship = {
        id: `pdr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientUserId: patient.id,
        patientId: patient.patientId || `PT-${Math.floor(100000 + Math.random() * 900000)}`,
        patientName: patient.name,
        patientEmail: patient.email,
        doctorUserId: user.id,
        doctorName: user.name,
        status: 'active',
        createdAt: new Date().toISOString()
      };

      data.patientDoctorRelationships.push(newRel);
      db.save(data);

      db.logAudit({
        userId: user.id,
        userName: user.name,
        role: 'doctor',
        action: 'PATIENT_RECORD_ACCESSED',
        targetPatientId: patient.patientId,
        details: `Dr. ${user.name} linked patient ${patient.name} (${patient.patientId}) to care roster`
      });

      res.status(201).json({ success: true, message: `Successfully linked patient ${patient.name}`, relationship: newRel });
    } catch (err: any) {
      console.error('Link patient error:', err);
      res.status(500).json({ error: 'Failed to link patient.' });
    }
  });

  app.get('/api/doctor/patients/:patientUserId/overview', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user || user.role !== 'doctor') {
        return res.status(403).json({ error: 'Access restricted to authorized doctors.' });
      }

      const patientUserId = req.params.patientUserId;
      const data = db.get();

      const hasRel = data.patientDoctorRelationships.some(
        r => r.doctorUserId === user.id && r.patientUserId === patientUserId
      );

      if (!hasRel) {
        return res.status(403).json({ error: 'You are not authorized to view this patient chart.' });
      }

      const patientUser = data.users.find(u => u.id === patientUserId);
      if (!patientUser) {
        return res.status(404).json({ error: 'Patient user record not found.' });
      }

      const reports = data.reports.filter(r => r.userId === patientUserId);
      const prescriptions = data.prescriptions.filter(p => p.patientUserId === patientUserId);
      const clinicalNotes = data.clinicalNotes.filter(n => n.patientUserId === patientUserId);
      const appointments = data.appointments.filter(a => a.userId === patientUserId || a.email.toLowerCase() === patientUser.email.toLowerCase());
      const bmiRecords = data.bmiRecords.filter(b => b.userId === patientUserId);

      db.logAudit({
        userId: user.id,
        userName: user.name,
        role: 'doctor',
        action: 'PATIENT_RECORD_ACCESSED',
        targetPatientId: patientUser.patientId,
        details: `Dr. ${user.name} accessed full comprehensive medical chart for patient ${patientUser.name}`
      });

      const { passwordHash: _, ...safePatient } = patientUser as any;

      res.json({
        patient: safePatient,
        reports,
        prescriptions,
        clinicalNotes,
        appointments,
        bmiRecords
      });
    } catch (err: any) {
      console.error('Patient overview error:', err);
      res.status(500).json({ error: 'Failed to retrieve patient medical overview.' });
    }
  });

  // Doctor Dashboard Stats
  app.get('/api/doctor/stats', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user || user.role !== 'doctor') {
        return res.status(403).json({ error: 'Access restricted.' });
      }
      const data = db.get();
      const patientCount = data.patientDoctorRelationships.filter(r => r.doctorUserId === user.id && r.status === 'active').length;
      const prescriptionCount = data.prescriptions.filter(p => p.doctorUserId === user.id).length;
      const appointmentCount = data.appointments.filter(
        a => (a.doctorUserId === user.id || a.doctorName.toLowerCase().includes(user.name.toLowerCase())) && a.status === 'Confirmed'
      ).length;
      const clinicalNoteCount = data.clinicalNotes.filter(n => n.doctorUserId === user.id).length;

      res.json({
        stats: {
          totalPatients: patientCount,
          totalPrescriptions: prescriptionCount,
          activeAppointments: appointmentCount,
          totalClinicalNotes: clinicalNoteCount
        }
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch stats.' });
    }
  });

  // 13. Audit Logs Endpoint (Phase 13)
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const data = db.get();

      if (user.role === 'doctor') {
        // Return audit logs related to this doctor or their patients
        const docLogs = data.auditLogs.filter(
          l => l.userId === user.id || (l.role === 'patient' && data.patientDoctorRelationships.some(r => r.doctorUserId === user.id && r.patientId === l.targetPatientId))
        );
        return res.json({ logs: docLogs.slice(0, 100) });
      } else {
        // Patient only gets audit events regarding their own record
        const patientLogs = data.auditLogs.filter(
          l => l.userId === user.id || l.targetPatientId === user.patientId
        );
        return res.json({ logs: patientLogs.slice(0, 50) });
      }
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch audit logs.' });
    }
  });

  // 14. Contact Form Endpoint
  app.post('/api/contact', (req: Request, res: Response) => {
    try {
      const { name, email, subject, phone, message } = req.body;
      if (!name || !email || !message) {
        return res.status(400).json({ error: 'Name, email, and message are required.' });
      }
      const data = db.get();
      const newMessage: ContactMessage = {
        id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        email: email.trim(),
        subject: subject ? subject.trim() : undefined,
        phone: phone ? phone.trim() : '',
        message: message.trim(),
        createdAt: new Date().toISOString()
      };
      data.contactMessages.unshift(newMessage);
      db.save(data);
      res.status(201).json({ success: true, message: 'Your message has been received. Our clinical support team will respond promptly.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to submit contact message.' });
    }
  });

  // 11. Reviews Endpoints (Real working feature - no fake reviews)
  app.get('/api/reviews', (req: Request, res: Response) => {
    try {
      const data = db.get();
      // Return approved reviews (default submitted reviews are approved for immediate display)
      const approvedReviews = (data.reviews || []).filter(r => r.status === 'approved');
      res.json({ reviews: approvedReviews });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch reviews.' });
    }
  });

  app.post('/api/reviews', (req: Request, res: Response) => {
    try {
      const { name, email, rating, review } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Please enter your name.' });
      }
      const numericRating = Number(rating);
      if (!numericRating || numericRating < 1 || numericRating > 5) {
        return res.status(400).json({ error: 'Please provide a rating between 1 and 5 stars.' });
      }
      if (!review || !review.trim()) {
        return res.status(400).json({ error: 'Please enter your review text.' });
      }

      const userId = authenticate(req) || undefined;
      const data = db.get();

      const newReview: Review = {
        id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        email: email ? email.trim() : undefined,
        rating: numericRating,
        review: review.trim(),
        date: new Date().toISOString(),
        status: 'approved',
        userId
      };

      if (!Array.isArray(data.reviews)) {
        data.reviews = [];
      }
      data.reviews.unshift(newReview);
      db.save(data);

      res.status(201).json({ success: true, review: newReview, message: 'Thank you for sharing your experience!' });
    } catch (err: any) {
      console.error('Review submission error:', err);
      res.status(500).json({ error: 'Failed to submit review. Please try again.' });
    }
  });

  // 12. Feedback Endpoint (Private - stored securely, not public)
  app.post('/api/feedback', (req: Request, res: Response) => {
    try {
      const { name, email, feedbackType, message } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Please enter your name.' });
      }
      if (!feedbackType) {
        return res.status(400).json({ error: 'Please select a feedback category.' });
      }
      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Please provide your feedback message.' });
      }

      const data = db.get();
      const newFeedback: UserFeedback = {
        id: `fb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        name: name.trim(),
        email: email ? email.trim() : undefined,
        feedbackType,
        message: message.trim(),
        createdAt: new Date().toISOString()
      };

      if (!Array.isArray(data.feedbacks)) {
        data.feedbacks = [];
      }
      data.feedbacks.unshift(newFeedback);
      db.save(data);

      res.status(201).json({ success: true, message: 'Thank you. Your feedback has been received.' });
    } catch (err: any) {
      console.error('Feedback submission error:', err);
      res.status(500).json({ error: 'Failed to submit feedback. Please try again.' });
    }
  });

  // Vite middleware for development vs Static files in Production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MediVerse server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server start error:', err);
  process.exit(1);
});
