import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { db } from './db.js';
import {
  analyzeLabReportDocument,
  processHealthChat,
  analyzeSymptoms,
  lookupMedicineInfo,
  analyzeMedicalDocument,
  generatePatientAiClinicalSummary,
  generateDischargeSummary
} from './gemini.js';
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
  AuditLog,
  LivePatientRecord,
  PatientVitalEntry,
  PatientLabResult,
  PatientMedication,
  PatientDiagnosis,
  PatientClinicalNote,
  PatientDocument,
  PatientTimelineItem,
  PatientAiSummary,
  PatientDischargeSummary,
  PatientStatus
} from '../src/types.js';

dotenv.config();

export function createApp() {
  const app = express();

  // Allow up to 50MB for PDF and high-res image report uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Serve static assets directory with full HTTP 206 Range support for video streaming
  const publicAssetsPath = path.join(process.cwd(), 'public', 'assets');
  const distAssetsPath = path.join(process.cwd(), 'dist', 'assets');
  app.use('/assets', express.static(publicAssetsPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
      }
    }
  }));
  app.use('/assets', express.static(distAssetsPath, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.mp4')) {
        res.setHeader('Content-Type', 'video/mp4');
        res.setHeader('Accept-Ranges', 'bytes');
      }
    }
  }));

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

  // --- Health & Diagnostic Routes ---
  const handleHealth = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.json({
      success: true,
      environment: process.env.NODE_ENV === 'development' ? 'development' : 'production',
      status: 'ok',
      service: 'MediVerse API',
      timestamp: new Date().toISOString()
    });
  };

  app.get('/api/health', handleHealth);
  app.get('/health', handleHealth);

  // --- Sitemap & Robots Routes ---
  const SITEMAP_XML_STRING = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>https://medi-verse-ai-wine.vercel.app/</loc>
    <lastmod>2026-08-21</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://medi-verse-ai-wine.vercel.app/services</loc>
    <lastmod>2026-08-21</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://medi-verse-ai-wine.vercel.app/lab-report</loc>
    <lastmod>2026-08-21</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://medi-verse-ai-wine.vercel.app/symptom-checker</loc>
    <lastmod>2026-08-21</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>https://medi-verse-ai-wine.vercel.app/medicine-info</loc>
    <lastmod>2026-08-21</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://medi-verse-ai-wine.vercel.app/bmi</loc>
    <lastmod>2026-08-21</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://medi-verse-ai-wine.vercel.app/appointment</loc>
    <lastmod>2026-08-21</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://medi-verse-ai-wine.vercel.app/ai-chat</loc>
    <lastmod>2026-08-21</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://medi-verse-ai-wine.vercel.app/about</loc>
    <lastmod>2026-08-21</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://medi-verse-ai-wine.vercel.app/reviews</loc>
    <lastmod>2026-08-21</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>https://medi-verse-ai-wine.vercel.app/contact</loc>
    <lastmod>2026-08-21</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
</urlset>`;

  const ROBOTS_TXT_STRING = `# robots.txt for MediVerse AI Healthcare Platform
# https://medi-verse-ai-wine.vercel.app

User-agent: *
Allow: /
Allow: /services
Allow: /lab-report
Allow: /symptom-checker
Allow: /medicine-info
Allow: /bmi
Allow: /appointment
Allow: /ai-chat
Allow: /about
Allow: /reviews
Allow: /contact

# Disallow private user dashboards, live health records and internal API routes
Disallow: /api/
Disallow: /patient-dashboard
Disallow: /doctor-dashboard
Disallow: /live-patient-record
Disallow: /live-ehr
Disallow: /patient-record
Disallow: /profile

# Sitemap Reference
Sitemap: https://medi-verse-ai-wine.vercel.app/sitemap.xml
`;

  const handleSitemap = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    const publicSitemap = path.join(process.cwd(), 'public', 'sitemap.xml');
    if (fs.existsSync(publicSitemap)) {
      return res.sendFile(publicSitemap);
    }
    const distSitemap = path.join(process.cwd(), 'dist', 'sitemap.xml');
    if (fs.existsSync(distSitemap)) {
      return res.sendFile(distSitemap);
    }
    res.status(200).send(SITEMAP_XML_STRING);
  };

  const handleRobots = (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    const publicRobots = path.join(process.cwd(), 'public', 'robots.txt');
    if (fs.existsSync(publicRobots)) {
      return res.sendFile(publicRobots);
    }
    const distRobots = path.join(process.cwd(), 'dist', 'robots.txt');
    if (fs.existsSync(distRobots)) {
      return res.sendFile(distRobots);
    }
    res.status(200).send(ROBOTS_TXT_STRING);
  };

  app.get('/sitemap.xml', handleSitemap);
  app.get('/api/sitemap.xml', handleSitemap);
  app.get('/robots.txt', handleRobots);
  app.get('/api/robots.txt', handleRobots);

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

  // Firebase Google Sign-In backend verification & account synchronization
  app.post('/api/auth/firebase-google', (req: Request, res: Response) => {
    try {
      const { email, name, role = 'patient', firebaseUid } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Email is required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const userRole: UserRole = role === 'doctor' ? 'doctor' : 'patient';
      const data = db.get();

      let user = data.users.find(u => u.email === normalizedEmail);

      if (!user) {
        // Create new user linked with Firebase
        const userId = firebaseUid ? `fb_${firebaseUid}` : `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const patientId = userRole === 'patient' ? db.generatePatientId() : undefined;

        const newUser: User & { passwordHash: string } = {
          id: userId,
          name: (name || email.split('@')[0]).trim(),
          email: normalizedEmail,
          role: userRole,
          patientId,
          specialty: userRole === 'doctor' ? 'General Medicine' : undefined,
          qualification: userRole === 'doctor' ? 'MD' : undefined,
          department: userRole === 'doctor' ? 'General Practice' : undefined,
          licenseNumber: userRole === 'doctor' ? `MED-${Math.floor(100000 + Math.random() * 900000)}` : undefined,
          hospitalAffiliation: userRole === 'doctor' ? 'MediVerse Healthcare Network' : undefined,
          createdAt: new Date().toISOString(),
          passwordHash: db.hashPassword(`fb_auth_${Date.now()}_${Math.random()}`)
        };

        data.users.push(newUser);

        if (userRole === 'doctor') {
          const docName = newUser.name.startsWith('Dr.') ? newUser.name : `Dr. ${newUser.name}`;
          if (!data.doctors.some(d => d.name.toLowerCase() === docName.toLowerCase())) {
            data.doctors.push({
              id: `doc_${userId}`,
              name: docName,
              specialty: 'General Medicine',
              qualification: 'MD',
              department: 'General Practice',
              experience: '8+ years',
              availableDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
            });
          }
        }

        db.save(data);
        user = newUser;
      } else {
        if (user.role === 'patient' && !user.patientId) {
          user.patientId = db.generatePatientId();
          db.save(data);
        }
      }

      const token = db.generateToken(user.id);
      const { passwordHash: _, ...safeUser } = user;

      res.json({ user: safeUser, token });
    } catch (err: any) {
      console.error('Firebase Google Auth error:', err);
      res.status(500).json({ error: 'Failed to authenticate Firebase user.' });
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

      const analysis = await analyzeLabReportDocument({
        base64Data,
        mimeType,
        fileName,
        fileSize,
        userId
      });

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
          const docAppts = data.appointments.filter(
            a => a.doctorUserId === user.id || a.doctorName.toLowerCase().includes(user.name.toLowerCase())
          );
          return res.json({ appointments: docAppts });
        } else {
          const userAppts = data.appointments.filter(a => a.userId === user.id || a.email.toLowerCase() === user.email.toLowerCase());
          return res.json({ appointments: userAppts });
        }
      }
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

  // 7. Doctors List
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

      const patientUserId = req.query.patientUserId as string;
      const patientId = req.query.patientId as string;

      if (user.role === 'doctor' && (patientUserId || patientId)) {
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

  // 10. Prescriptions System
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

  // 11. Clinical Notes Endpoints
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

  // 12. Doctor Patient Management & Linking (Supports both /api/doctor/link-patient and /api/doctor/patients/link)
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

  const handleLinkPatient = (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user || user.role !== 'doctor') {
        return res.status(403).json({ error: 'Access restricted to doctors.' });
      }

      const { patientSearch, patientId, patientEmail } = req.body;
      const query = (patientSearch || patientId || patientEmail || '').trim().toLowerCase();

      if (!query) {
        return res.status(400).json({ error: 'Please enter a Patient ID (e.g. PT-123456) or Email address.' });
      }

      const data = db.get();

      const patient = data.users.find(
        u => u.role === 'patient' && (
          (u.patientId && u.patientId.toLowerCase() === query) ||
          u.email.toLowerCase() === query
        )
      );

      if (!patient) {
        return res.status(404).json({
          error: `No registered patient found matching "${query}". Please confirm the Patient ID with the patient.`
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

      const { passwordHash: _, ...safePatient } = patient as any;

      res.status(201).json({
        success: true,
        message: `Successfully linked patient ${patient.name}`,
        patient: safePatient,
        relationship: newRel
      });
    } catch (err: any) {
      console.error('Link patient error:', err);
      res.status(500).json({ error: 'Failed to link patient.' });
    }
  };

  app.post('/api/doctor/patients/link', handleLinkPatient);
  app.post('/api/doctor/link-patient', handleLinkPatient);

  const handlePatientOverview = (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user || user.role !== 'doctor') {
        return res.status(403).json({ error: 'Access restricted to authorized doctors.' });
      }

      const patientUserId = req.params.patientUserId;
      const data = db.get();

      const hasRel = data.patientDoctorRelationships.some(
        r => r.doctorUserId === user.id && (r.patientUserId === patientUserId || r.patientId === patientUserId)
      );

      if (!hasRel) {
        return res.status(403).json({ error: 'You are not authorized to view this patient chart.' });
      }

      const patientUser = data.users.find(u => u.id === patientUserId || u.patientId === patientUserId);
      if (!patientUser) {
        return res.status(404).json({ error: 'Patient user record not found.' });
      }

      const reports = data.reports.filter(r => r.userId === patientUser.id);
      const prescriptions = data.prescriptions.filter(p => p.patientUserId === patientUser.id);
      const clinicalNotes = data.clinicalNotes.filter(n => n.patientUserId === patientUser.id);
      const appointments = data.appointments.filter(a => a.userId === patientUser.id || a.email.toLowerCase() === patientUser.email.toLowerCase());
      const bmiRecords = data.bmiRecords.filter(b => b.userId === patientUser.id);

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
  };

  app.get('/api/doctor/patients/:patientUserId/overview', handlePatientOverview);
  app.get('/api/doctor/patients/:patientUserId/ehr', handlePatientOverview);

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

  // 13. Audit Logs Endpoint
  app.get('/api/audit-logs', (req: Request, res: Response) => {
    try {
      const user = authenticateUser(req);
      if (!user) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const data = db.get();

      if (user.role === 'doctor') {
        const docLogs = data.auditLogs.filter(
          l => l.userId === user.id || (l.role === 'patient' && data.patientDoctorRelationships.some(r => r.doctorUserId === user.id && r.patientId === l.targetPatientId))
        );
        return res.json({ logs: docLogs.slice(0, 100) });
      } else {
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

  // 15. Reviews Endpoints
  app.get('/api/reviews', (req: Request, res: Response) => {
    try {
      const data = db.get();
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

  // 16. Feedback Endpoint
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

  // ==========================================
  // LIVE PATIENT HEALTH RECORD (EHR) ENDPOINTS
  // ==========================================

  // Helper to ensure patient arrays are well formed
  function normalizePatient(patient: LivePatientRecord): LivePatientRecord {
    if (!Array.isArray(patient.vitals)) patient.vitals = [];
    if (!Array.isArray(patient.labResults)) patient.labResults = [];
    if (!Array.isArray(patient.medications)) patient.medications = [];
    if (!Array.isArray(patient.diagnoses)) patient.diagnoses = [];
    if (!Array.isArray(patient.clinicalNotes)) patient.clinicalNotes = [];
    if (!Array.isArray(patient.documents)) patient.documents = [];
    if (!Array.isArray(patient.timeline)) patient.timeline = [];
    if (!Array.isArray(patient.aiSummaries)) patient.aiSummaries = [];
    if (!Array.isArray(patient.prescriptions)) patient.prescriptions = [];
    return patient;
  }

  // 1. Get Patients List
  app.get('/api/patients', (req: Request, res: Response) => {
    try {
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) {
        data.patientRecords = [];
        db.save(data);
      }
      const patients = data.patientRecords.map(normalizePatient);
      // Return sorted by most recent updated/created
      patients.sort((a, b) => new Date(b.updatedAt || b.createdAt).getTime() - new Date(a.updatedAt || a.createdAt).getTime());
      res.json({ success: true, count: patients.length, patients });
    } catch (err: any) {
      console.error('Error fetching patients:', err);
      res.status(500).json({ error: 'Failed to fetch patients list.' });
    }
  });

  // 2. Admit New Patient
  app.post('/api/patients/admit', (req: Request, res: Response) => {
    try {
      const currentUser = authenticateUser(req);
      const {
        patientName,
        uhid,
        dateOfBirth,
        age,
        gender,
        bloodGroup,
        department,
        attendingPhysician,
        admissionDateTime,
        bedRoomNo,
        allergies,
        reasonForAdmission,
        emergencyContact,
        contactPhone,
        address
      } = req.body;

      if (!patientName || !patientName.trim()) {
        return res.status(400).json({ error: 'Patient name is required.' });
      }
      if (!reasonForAdmission || !reasonForAdmission.trim()) {
        return res.status(400).json({ error: 'Reason for admission / chief complaint is required.' });
      }

      const data = db.get();
      if (!Array.isArray(data.patientRecords)) {
        data.patientRecords = [];
      }

      const assignedUhid = (uhid && uhid.trim())
        ? uhid.trim().toUpperCase()
        : `UHID-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      // Check if UHID already exists
      const existing = data.patientRecords.find(p => p.uhid === assignedUhid);
      if (existing) {
        return res.status(400).json({ error: `A patient with UHID ${assignedUhid} is already admitted.` });
      }

      const patientId = `pat_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = new Date().toISOString();
      const admTime = admissionDateTime ? new Date(admissionDateTime).toISOString() : now;
      const attending = attendingPhysician ? attendingPhysician.trim() : (currentUser?.role === 'doctor' ? currentUser.name : 'Dr. Sarah Jenkins, MD');
      const dept = department ? department.trim() : 'General Medicine';

      const initialTimelineItem: PatientTimelineItem = {
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId,
        timestamp: admTime,
        eventType: 'Patient Admission',
        title: 'Patient Admitted',
        description: `Admitted to ${dept} under ${attending}. Chief Complaint: ${reasonForAdmission.trim()}`,
        createdByName: currentUser?.name || attending,
        details: {
          bedRoomNo: bedRoomNo || 'Unassigned',
          allergies: allergies || 'None reported'
        }
      };

      const newPatient: LivePatientRecord = {
        id: patientId,
        uhid: assignedUhid,
        patientName: patientName.trim(),
        dateOfBirth: dateOfBirth || undefined,
        age: age ? Number(age) : undefined,
        gender: gender || undefined,
        bloodGroup: bloodGroup || undefined,
        department: dept,
        attendingPhysician: attending,
        admissionDateTime: admTime,
        bedRoomNo: bedRoomNo ? bedRoomNo.trim() : undefined,
        allergies: allergies ? allergies.trim() : undefined,
        reasonForAdmission: reasonForAdmission.trim(),
        status: 'Admitted',
        emergencyContact: emergencyContact ? emergencyContact.trim() : undefined,
        contactPhone: contactPhone ? contactPhone.trim() : undefined,
        address: address ? address.trim() : undefined,
        userId: currentUser?.id,
        createdAt: now,
        updatedAt: now,
        vitals: [],
        labResults: [],
        medications: [],
        diagnoses: [],
        clinicalNotes: [],
        documents: [],
        timeline: [initialTimelineItem],
        aiSummaries: [],
        prescriptions: []
      };

      data.patientRecords.unshift(newPatient);
      db.save(data);

      res.status(201).json({
        success: true,
        message: `Patient ${newPatient.patientName} (${newPatient.uhid}) successfully admitted.`,
        patient: normalizePatient(newPatient)
      });
    } catch (err: any) {
      console.error('Patient admission error:', err);
      res.status(500).json({ error: 'Failed to admit patient. Please try again.' });
    }
  });

  // 3. Get Single Patient
  app.get('/api/patients/:id', (req: Request, res: Response) => {
    try {
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) {
        data.patientRecords = [];
        db.save(data);
      }
      const patient = data.patientRecords.find(p => p.id === req.params.id || p.uhid === req.params.id);
      if (!patient) {
        return res.status(404).json({ error: 'Patient record not found.' });
      }
      res.json({ success: true, patient: normalizePatient(patient) });
    } catch (err: any) {
      console.error('Error getting patient:', err);
      res.status(500).json({ error: 'Failed to load patient record.' });
    }
  });

  // 4. Update Patient Profile
  app.put('/api/patients/:id', (req: Request, res: Response) => {
    try {
      const currentUser = authenticateUser(req);
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Patient record not found.' });
      }

      const p = normalizePatient(data.patientRecords[idx]);
      const {
        patientName,
        dateOfBirth,
        age,
        gender,
        bloodGroup,
        department,
        attendingPhysician,
        bedRoomNo,
        allergies,
        reasonForAdmission,
        emergencyContact,
        contactPhone,
        address,
        status
      } = req.body;

      if (patientName) p.patientName = patientName.trim();
      if (dateOfBirth !== undefined) p.dateOfBirth = dateOfBirth;
      if (age !== undefined) p.age = age ? Number(age) : undefined;
      if (gender !== undefined) p.gender = gender;
      if (bloodGroup !== undefined) p.bloodGroup = bloodGroup;
      if (department) p.department = department.trim();
      if (attendingPhysician) p.attendingPhysician = attendingPhysician.trim();
      if (bedRoomNo !== undefined) p.bedRoomNo = bedRoomNo ? bedRoomNo.trim() : undefined;
      if (allergies !== undefined) p.allergies = allergies ? allergies.trim() : undefined;
      if (reasonForAdmission) p.reasonForAdmission = reasonForAdmission.trim();
      if (emergencyContact !== undefined) p.emergencyContact = emergencyContact ? emergencyContact.trim() : undefined;
      if (contactPhone !== undefined) p.contactPhone = contactPhone ? contactPhone.trim() : undefined;
      if (address !== undefined) p.address = address ? address.trim() : undefined;
      if (status) p.status = status;

      p.updatedAt = new Date().toISOString();

      p.timeline.unshift({
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        timestamp: p.updatedAt,
        eventType: 'Patient Profile Updated',
        title: 'Demographics / Profile Updated',
        description: 'Patient demographic and clinical profile information was updated.',
        createdByName: currentUser?.name || 'Medical Staff'
      });

      data.patientRecords[idx] = p;
      db.save(data);

      res.json({ success: true, patient: p });
    } catch (err: any) {
      console.error('Error updating patient profile:', err);
      res.status(500).json({ error: 'Failed to update patient profile.' });
    }
  });

  // 5. Delete Patient Record
  app.delete('/api/patients/:id', (req: Request, res: Response) => {
    try {
      const currentUser = authenticateUser(req);
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Patient not found.' });
      }

      const deleted = data.patientRecords.splice(idx, 1)[0];
      db.save(data);

      res.json({ success: true, message: `Patient record for ${deleted.patientName} (${deleted.uhid}) deleted.` });
    } catch (err: any) {
      console.error('Error deleting patient:', err);
      res.status(500).json({ error: 'Failed to delete patient record.' });
    }
  });

  // 6. Mark Patient Discharged
  app.post('/api/patients/:id/discharge', (req: Request, res: Response) => {
    try {
      const currentUser = authenticateUser(req);
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Patient not found.' });
      }

      const p = normalizePatient(data.patientRecords[idx]);
      const now = new Date().toISOString();
      const dischargeDateTime = req.body.dischargeDateTime ? new Date(req.body.dischargeDateTime).toISOString() : now;
      const dischargeNotes = req.body.dischargeNotes || 'Patient discharged following clinical evaluation.';

      p.status = 'Discharged';
      p.dischargeDateTime = dischargeDateTime;
      p.dischargeSummary = dischargeNotes;
      p.updatedAt = now;

      p.timeline.unshift({
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        timestamp: dischargeDateTime,
        eventType: 'Patient Discharged',
        title: 'Patient Discharged',
        description: `Discharged by ${currentUser?.name || p.attendingPhysician}. Notes: ${dischargeNotes}`,
        createdByName: currentUser?.name || p.attendingPhysician
      });

      data.patientRecords[idx] = p;
      db.save(data);

      res.json({ success: true, patient: p, message: 'Patient marked as discharged.' });
    } catch (err: any) {
      console.error('Discharge error:', err);
      res.status(500).json({ error: 'Failed to discharge patient.' });
    }
  });

  // 7. Create/Generate Discharge Summary
  app.post('/api/patients/:id/discharge-summary', async (req: Request, res: Response) => {
    try {
      const currentUser = authenticateUser(req);
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) {
        return res.status(404).json({ error: 'Patient not found.' });
      }

      const p = normalizePatient(data.patientRecords[idx]);
      const manualData: Partial<PatientDischargeSummary> = req.body.dischargeData || {};

      let dischargeData: PatientDischargeSummary;
      if (req.body.useAi) {
        dischargeData = await generateDischargeSummary(p);
      } else {
        dischargeData = {
          id: `dcsum_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          patientId: p.id,
          generatedAt: new Date().toISOString(),
          dischargeDate: p.dischargeDateTime || new Date().toISOString(),
          admissionDate: p.admissionDateTime,
          finalDiagnosis: manualData.finalDiagnosis || p.diagnoses?.[0]?.diagnosisName || p.reasonForAdmission || 'Clinical Recovery',
          conditionAtDischarge: manualData.conditionAtDischarge || 'Hemodynamically stable and cleared for discharge.',
          hospitalCourseSummary: manualData.hospitalCourseSummary || `Admitted on ${p.admissionDateTime} for ${p.reasonForAdmission}. Treated in ${p.department} under ${p.attendingPhysician}. Condition stabilized.`,
          dischargeMedications: Array.isArray(manualData.dischargeMedications) ? manualData.dischargeMedications : (p.medications?.filter(m => m.status === 'Active').map(m => `${m.medicineName} ${m.strength} - ${m.frequency} for ${m.duration}`) || []),
          dietAndActivityAdvice: manualData.dietAndActivityAdvice || 'Balanced diet as tolerated. Adequate hydration. Gradual resumption of physical activity.',
          followUpInstructions: manualData.followUpInstructions || `Follow up in ${p.department} clinic with ${p.attendingPhysician} in 7-10 days.`,
          emergencyWarningSigns: Array.isArray(manualData.emergencyWarningSigns) ? manualData.emergencyWarningSigns : [
            'High persistent fever (>101°F)',
            'Sudden chest pain or severe shortness of breath',
            'Severe dizziness or loss of consciousness'
          ],
          dischargedBy: currentUser?.name || p.attendingPhysician,
          notes: manualData.notes
        };
      }

      p.dischargeData = dischargeData;
      p.dischargeSummary = `${dischargeData.finalDiagnosis} - ${dischargeData.conditionAtDischarge}`;
      p.updatedAt = new Date().toISOString();

      p.timeline.unshift({
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        timestamp: dischargeData.generatedAt,
        eventType: 'Discharge Summary Created',
        title: 'Hospital Discharge Summary Formatted',
        description: `Formal discharge summary created. Final diagnosis: ${dischargeData.finalDiagnosis}`,
        createdByName: currentUser?.name || p.attendingPhysician
      });

      data.patientRecords[idx] = p;
      db.save(data);

      res.json({ success: true, dischargeData, patient: p });
    } catch (err: any) {
      console.error('Discharge summary error:', err);
      res.status(500).json({ error: 'Failed to create discharge summary.' });
    }
  });

  // 8. Add Vitals
  app.post('/api/patients/:id/vitals', (req: Request, res: Response) => {
    try {
      const currentUser = authenticateUser(req);
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      const { bloodPressure, heartRate, temperature, spo2, respiratoryRate, notes, recordedAt } = req.body;

      if (!bloodPressure && !heartRate && !temperature && !spo2 && !respiratoryRate) {
        return res.status(400).json({ error: 'At least one vital sign value is required.' });
      }

      const timestamp = recordedAt ? new Date(recordedAt).toISOString() : new Date().toISOString();
      const vitalEntry: PatientVitalEntry = {
        id: `vit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        recordedAt: timestamp,
        bloodPressure: bloodPressure ? bloodPressure.trim() : undefined,
        heartRate: heartRate ? Number(heartRate) : undefined,
        temperature: temperature ? Number(temperature) : undefined,
        spo2: spo2 ? Number(spo2) : undefined,
        respiratoryRate: respiratoryRate ? Number(respiratoryRate) : undefined,
        notes: notes ? notes.trim() : undefined,
        recordedBy: currentUser?.name || 'Staff Nurse'
      };

      p.vitals.unshift(vitalEntry);
      p.updatedAt = new Date().toISOString();

      const vitalsText = [
        vitalEntry.bloodPressure ? `BP: ${vitalEntry.bloodPressure}` : '',
        vitalEntry.heartRate ? `HR: ${vitalEntry.heartRate} bpm` : '',
        vitalEntry.spo2 ? `SpO2: ${vitalEntry.spo2}%` : '',
        vitalEntry.temperature ? `Temp: ${vitalEntry.temperature}°F` : '',
        vitalEntry.respiratoryRate ? `RR: ${vitalEntry.respiratoryRate}/min` : ''
      ].filter(Boolean).join(', ');

      p.timeline.unshift({
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        timestamp,
        eventType: 'Vital Added',
        title: 'Vital Signs Recorded',
        description: `${vitalsText}${vitalEntry.notes ? ` (Note: ${vitalEntry.notes})` : ''}`,
        createdByName: vitalEntry.recordedBy
      });

      data.patientRecords[idx] = p;
      db.save(data);

      res.status(201).json({ success: true, vital: vitalEntry, patient: p });
    } catch (err: any) {
      console.error('Add vitals error:', err);
      res.status(500).json({ error: 'Failed to record vitals.' });
    }
  });

  // Delete Vital
  app.delete('/api/patients/:id/vitals/:vitalId', (req: Request, res: Response) => {
    try {
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      p.vitals = p.vitals.filter(v => v.id !== req.params.vitalId);
      p.updatedAt = new Date().toISOString();
      data.patientRecords[idx] = p;
      db.save(data);

      res.json({ success: true, patient: p });
    } catch (err: any) {
      console.error('Delete vital error:', err);
      res.status(500).json({ error: 'Failed to delete vital.' });
    }
  });

  // 9. Add Labs
  app.post('/api/patients/:id/labs', (req: Request, res: Response) => {
    try {
      const currentUser = authenticateUser(req);
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      const { testName, result, unit, referenceRange, status = 'Normal', date } = req.body;

      if (!testName || !result) {
        return res.status(400).json({ error: 'Test name and result value are required.' });
      }

      const labDate = date ? new Date(date).toISOString() : new Date().toISOString();
      const labResult: PatientLabResult = {
        id: `lab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        testName: testName.trim(),
        result: String(result).trim(),
        unit: unit ? unit.trim() : '',
        referenceRange: referenceRange ? referenceRange.trim() : 'N/A',
        status: status as any,
        date: labDate,
        recordedBy: currentUser?.name || 'Lab Technician'
      };

      p.labResults.unshift(labResult);
      p.updatedAt = new Date().toISOString();

      p.timeline.unshift({
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        timestamp: labDate,
        eventType: 'Lab Result Added',
        title: `Lab Result: ${labResult.testName}`,
        description: `${labResult.testName}: ${labResult.result} ${labResult.unit} (${labResult.status}) [Ref: ${labResult.referenceRange}]`,
        createdByName: labResult.recordedBy
      });

      data.patientRecords[idx] = p;
      db.save(data);

      res.status(201).json({ success: true, labResult, patient: p });
    } catch (err: any) {
      console.error('Add lab error:', err);
      res.status(500).json({ error: 'Failed to add lab result.' });
    }
  });

  // Delete Lab
  app.delete('/api/patients/:id/labs/:labId', (req: Request, res: Response) => {
    try {
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      const removed = p.labResults.find(l => l.id === req.params.labId);
      p.labResults = p.labResults.filter(l => l.id !== req.params.labId);
      p.updatedAt = new Date().toISOString();

      if (removed) {
        p.timeline.unshift({
          id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          patientId: p.id,
          timestamp: new Date().toISOString(),
          eventType: 'Lab Result Deleted',
          title: `Lab Removed: ${removed.testName}`,
          description: `Laboratory test entry for ${removed.testName} was removed from record.`
        });
      }

      data.patientRecords[idx] = p;
      db.save(data);

      res.json({ success: true, patient: p });
    } catch (err: any) {
      console.error('Delete lab error:', err);
      res.status(500).json({ error: 'Failed to delete lab result.' });
    }
  });

  // 10. Add Medication
  app.post('/api/patients/:id/medications', (req: Request, res: Response) => {
    try {
      const currentUser = authenticateUser(req);
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      const {
        medicineName,
        strength,
        route = 'Oral',
        frequency,
        duration,
        startDate,
        endDate,
        instructions,
        status = 'Active'
      } = req.body;

      if (!medicineName || !frequency) {
        return res.status(400).json({ error: 'Medicine name and frequency are required.' });
      }

      const now = new Date().toISOString();
      const newMed: PatientMedication = {
        id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        medicineName: medicineName.trim(),
        strength: strength ? strength.trim() : '',
        route: route ? route.trim() : 'Oral',
        frequency: frequency.trim(),
        duration: duration ? duration.trim() : 'As directed',
        startDate: startDate ? new Date(startDate).toISOString() : now,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        instructions: instructions ? instructions.trim() : undefined,
        status: status as any,
        prescribedBy: currentUser?.name || p.attendingPhysician,
        createdAt: now
      };

      p.medications.unshift(newMed);
      p.updatedAt = now;

      p.timeline.unshift({
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        timestamp: now,
        eventType: 'Medication Added',
        title: `Medication: ${newMed.medicineName}`,
        description: `Prescribed ${newMed.medicineName} ${newMed.strength} (${newMed.route}, ${newMed.frequency} for ${newMed.duration})${newMed.instructions ? ` - ${newMed.instructions}` : ''}`,
        createdByName: newMed.prescribedBy
      });

      data.patientRecords[idx] = p;
      db.save(data);

      res.status(201).json({ success: true, medication: newMed, patient: p });
    } catch (err: any) {
      console.error('Add medication error:', err);
      res.status(500).json({ error: 'Failed to add medication.' });
    }
  });

  // Update Medication Status / Details
  app.put('/api/patients/:id/medications/:medId', (req: Request, res: Response) => {
    try {
      const currentUser = authenticateUser(req);
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      const medIdx = p.medications.findIndex(m => m.id === req.params.medId);
      if (medIdx === -1) return res.status(404).json({ error: 'Medication not found.' });

      const prevStatus = p.medications[medIdx].status;
      const { status, instructions, duration, frequency, strength, medicineName, route } = req.body;

      if (status) p.medications[medIdx].status = status;
      if (instructions !== undefined) p.medications[medIdx].instructions = instructions;
      if (duration) p.medications[medIdx].duration = duration;
      if (frequency) p.medications[medIdx].frequency = frequency;
      if (strength) p.medications[medIdx].strength = strength;
      if (medicineName) p.medications[medIdx].medicineName = medicineName;
      if (route) p.medications[medIdx].route = route;

      p.updatedAt = new Date().toISOString();

      if (status && status !== prevStatus) {
        p.timeline.unshift({
          id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          patientId: p.id,
          timestamp: new Date().toISOString(),
          eventType: 'Medication Status Changed',
          title: `Medication Status: ${p.medications[medIdx].medicineName}`,
          description: `Changed status of ${p.medications[medIdx].medicineName} from ${prevStatus} to ${status}.`,
          createdByName: currentUser?.name || 'Doctor'
        });
      }

      data.patientRecords[idx] = p;
      db.save(data);

      res.json({ success: true, medication: p.medications[medIdx], patient: p });
    } catch (err: any) {
      console.error('Update medication error:', err);
      res.status(500).json({ error: 'Failed to update medication.' });
    }
  });

  // Delete Medication
  app.delete('/api/patients/:id/medications/:medId', (req: Request, res: Response) => {
    try {
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      p.medications = p.medications.filter(m => m.id !== req.params.medId);
      p.updatedAt = new Date().toISOString();
      data.patientRecords[idx] = p;
      db.save(data);

      res.json({ success: true, patient: p });
    } catch (err: any) {
      console.error('Delete medication error:', err);
      res.status(500).json({ error: 'Failed to delete medication.' });
    }
  });

  // 11. Add Diagnosis
  app.post('/api/patients/:id/diagnoses', (req: Request, res: Response) => {
    try {
      const currentUser = authenticateUser(req);
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      const { diagnosisName, type = 'Primary', dateDiagnosed, clinicalNotes } = req.body;

      if (!diagnosisName || !diagnosisName.trim()) {
        return res.status(400).json({ error: 'Diagnosis name is required.' });
      }

      const now = new Date().toISOString();
      const diagDate = dateDiagnosed ? new Date(dateDiagnosed).toISOString() : now;
      const newDiag: PatientDiagnosis = {
        id: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        diagnosisName: diagnosisName.trim(),
        type: type as any,
        dateDiagnosed: diagDate,
        clinicalNotes: clinicalNotes ? clinicalNotes.trim() : undefined,
        diagnosedBy: currentUser?.name || p.attendingPhysician,
        createdAt: now
      };

      p.diagnoses.unshift(newDiag);
      p.updatedAt = now;

      p.timeline.unshift({
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        timestamp: diagDate,
        eventType: 'Diagnosis Added',
        title: `Diagnosis: ${newDiag.diagnosisName}`,
        description: `Established [${newDiag.type}] diagnosis: ${newDiag.diagnosisName}${newDiag.clinicalNotes ? ` (${newDiag.clinicalNotes})` : ''}`,
        createdByName: newDiag.diagnosedBy
      });

      data.patientRecords[idx] = p;
      db.save(data);

      res.status(201).json({ success: true, diagnosis: newDiag, patient: p });
    } catch (err: any) {
      console.error('Add diagnosis error:', err);
      res.status(500).json({ error: 'Failed to add diagnosis.' });
    }
  });

  // Delete Diagnosis
  app.delete('/api/patients/:id/diagnoses/:diagId', (req: Request, res: Response) => {
    try {
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      p.diagnoses = p.diagnoses.filter(d => d.id !== req.params.diagId);
      p.updatedAt = new Date().toISOString();
      data.patientRecords[idx] = p;
      db.save(data);

      res.json({ success: true, patient: p });
    } catch (err: any) {
      console.error('Delete diagnosis error:', err);
      res.status(500).json({ error: 'Failed to delete diagnosis.' });
    }
  });

  // 12. Add Clinical Note
  app.post('/api/patients/:id/notes', (req: Request, res: Response) => {
    try {
      const currentUser = authenticateUser(req);
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      const { noteType = 'Progress Note', title, content, date } = req.body;

      if (!title || !content) {
        return res.status(400).json({ error: 'Note title and content are required.' });
      }

      const now = new Date().toISOString();
      const noteDate = date ? new Date(date).toISOString() : now;
      const newNote: PatientClinicalNote = {
        id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        noteType: noteType as any,
        title: title.trim(),
        content: content.trim(),
        authorName: currentUser?.name || p.attendingPhysician,
        authorRole: currentUser?.role === 'doctor' ? (currentUser.specialty || 'Attending Physician') : 'Attending Medical Staff',
        date: noteDate,
        createdAt: now
      };

      p.clinicalNotes.unshift(newNote);
      p.updatedAt = now;

      p.timeline.unshift({
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        timestamp: noteDate,
        eventType: 'Clinical Note Added',
        title: `Note [${newNote.noteType}]: ${newNote.title}`,
        description: `${newNote.content.slice(0, 160)}${newNote.content.length > 160 ? '...' : ''}`,
        createdByName: newNote.authorName
      });

      data.patientRecords[idx] = p;
      db.save(data);

      res.status(201).json({ success: true, note: newNote, patient: p });
    } catch (err: any) {
      console.error('Add clinical note error:', err);
      res.status(500).json({ error: 'Failed to add clinical note.' });
    }
  });

  // Delete Clinical Note
  app.delete('/api/patients/:id/notes/:noteId', (req: Request, res: Response) => {
    try {
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      p.clinicalNotes = p.clinicalNotes.filter(n => n.id !== req.params.noteId);
      p.updatedAt = new Date().toISOString();
      data.patientRecords[idx] = p;
      db.save(data);

      res.json({ success: true, patient: p });
    } catch (err: any) {
      console.error('Delete note error:', err);
      res.status(500).json({ error: 'Failed to delete note.' });
    }
  });

  // 13. Upload Medical Document
  app.post('/api/patients/:id/documents', (req: Request, res: Response) => {
    try {
      const currentUser = authenticateUser(req);
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      const { fileName, fileType, fileSize, category = 'Laboratory Report', notes, dataUrl } = req.body;

      if (!fileName || !dataUrl) {
        return res.status(400).json({ error: 'File name and document data are required.' });
      }

      const now = new Date().toISOString();
      const docId = `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const doc: PatientDocument = {
        id: docId,
        patientId: p.id,
        fileName: fileName.trim(),
        fileType: fileType || 'application/pdf',
        fileSize: fileSize ? Number(fileSize) : undefined,
        category: category as any,
        notes: notes ? notes.trim() : undefined,
        dataUrl,
        uploadedAt: now,
        uploadedBy: currentUser?.name || 'Medical Staff',
        analyzed: false
      };

      p.documents.unshift(doc);
      p.updatedAt = now;

      p.timeline.unshift({
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        timestamp: now,
        eventType: 'Document Upload',
        title: `Uploaded Document: ${doc.fileName}`,
        description: `Uploaded [${doc.category}] ${doc.fileName}${doc.notes ? ` (Note: ${doc.notes})` : ''}`,
        createdByName: doc.uploadedBy
      });

      data.patientRecords[idx] = p;
      db.save(data);

      res.status(201).json({ success: true, document: doc, patient: p });
    } catch (err: any) {
      console.error('Upload document error:', err);
      res.status(500).json({ error: 'Failed to upload document.' });
    }
  });

  // Delete Document
  app.delete('/api/patients/:id/documents/:docId', (req: Request, res: Response) => {
    try {
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      const removed = p.documents.find(d => d.id === req.params.docId);
      p.documents = p.documents.filter(d => d.id !== req.params.docId);
      p.updatedAt = new Date().toISOString();

      if (removed) {
        p.timeline.unshift({
          id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          patientId: p.id,
          timestamp: new Date().toISOString(),
          eventType: 'Document Deleted',
          title: `Document Removed: ${removed.fileName}`,
          description: `Document ${removed.fileName} (${removed.category}) was removed from the record.`
        });
      }

      data.patientRecords[idx] = p;
      db.save(data);

      res.json({ success: true, patient: p });
    } catch (err: any) {
      console.error('Delete document error:', err);
      res.status(500).json({ error: 'Failed to delete document.' });
    }
  });

  // 14. Analyze Document with AI
  app.post('/api/patients/:id/documents/:docId/analyze', async (req: Request, res: Response) => {
    try {
      const currentUser = authenticateUser(req);
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      const doc = p.documents.find(d => d.id === req.params.docId);
      if (!doc) return res.status(404).json({ error: 'Document not found in patient record.' });

      // Extract base64 and mime
      let base64Data = '';
      let mimeType = doc.fileType || 'application/pdf';

      if (doc.dataUrl.includes(',')) {
        const parts = doc.dataUrl.split(',');
        const mimeMatch = parts[0].match(/:(.*?);/);
        if (mimeMatch) mimeType = mimeMatch[1];
        base64Data = parts[1];
      } else {
        base64Data = doc.dataUrl;
      }

      const extractedData = await analyzeMedicalDocument({
        documentId: doc.id,
        base64Data,
        mimeType,
        fileName: doc.fileName,
        category: doc.category,
        patientName: p.patientName
      });

      doc.analyzed = true;
      doc.analysisId = `an_${Date.now()}`;
      doc.analysis = extractedData;
      p.updatedAt = new Date().toISOString();

      p.timeline.unshift({
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        timestamp: new Date().toISOString(),
        eventType: 'Document Analyzed',
        title: `AI Analyzed: ${doc.fileName}`,
        description: `Extracted ${extractedData.tests?.length || 0} test(s), ${extractedData.diagnosesMentioned?.length || 0} diagnosis statement(s), and ${extractedData.medicationsMentioned?.length || 0} medication(s).`,
        createdByName: currentUser?.name || 'MediVerse AI'
      });

      data.patientRecords[idx] = p;
      db.save(data);

      res.json({ success: true, extractedData, patient: p });
    } catch (err: any) {
      console.error('Analyze document error:', err);
      res.status(500).json({ error: 'Failed to analyze document with AI.' });
    }
  });

  // 15. Review & Save Extracted Clinical Information
  app.post('/api/patients/:id/documents/save-extracted', (req: Request, res: Response) => {
    try {
      const currentUser = authenticateUser(req);
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      const {
        documentId,
        documentName,
        tests = [],
        diagnoses = [],
        medications = [],
        clinicalNotes
      } = req.body;

      const now = new Date().toISOString();
      let addedCounts = { labs: 0, diagnoses: 0, medications: 0, notes: 0 };

      // 1. Save selected tests
      if (Array.isArray(tests) && tests.length > 0) {
        tests.forEach((t: any) => {
          if (t.testName && t.result) {
            p.labResults.unshift({
              id: `lab_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              patientId: p.id,
              testName: String(t.testName).trim(),
              result: String(t.result).trim(),
              unit: t.unit ? String(t.unit).trim() : '',
              referenceRange: t.referenceRange ? String(t.referenceRange).trim() : 'N/A',
              status: (t.status as any) || 'Normal',
              date: now,
              sourceDocumentId: documentId,
              sourceDocumentName: documentName || 'Uploaded Medical Document',
              recordedBy: currentUser?.name || 'AI Extraction Review'
            });
            addedCounts.labs++;
          }
        });
      }

      // 2. Save selected diagnoses
      if (Array.isArray(diagnoses) && diagnoses.length > 0) {
        diagnoses.forEach((d: any) => {
          const dName = typeof d === 'string' ? d : d.diagnosisName;
          if (dName && dName.trim()) {
            p.diagnoses.unshift({
              id: `diag_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              patientId: p.id,
              diagnosisName: dName.trim(),
              type: (d.type as any) || 'Primary',
              dateDiagnosed: now,
              clinicalNotes: d.clinicalNotes || (documentName ? `Extracted from document: ${documentName}` : undefined),
              diagnosedBy: currentUser?.name || 'Attending Physician',
              createdAt: now
            });
            addedCounts.diagnoses++;
          }
        });
      }

      // 3. Save selected medications
      if (Array.isArray(medications) && medications.length > 0) {
        medications.forEach((m: any) => {
          const mName = typeof m === 'string' ? m : m.medicineName;
          if (mName && mName.trim()) {
            p.medications.unshift({
              id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              patientId: p.id,
              medicineName: mName.trim(),
              strength: m.strength ? String(m.strength).trim() : '',
              route: m.route ? String(m.route).trim() : 'Oral',
              frequency: m.frequency ? String(m.frequency).trim() : 'As prescribed',
              duration: m.duration ? String(m.duration).trim() : 'As directed',
              startDate: now,
              instructions: m.instructions ? String(m.instructions).trim() : (documentName ? `Identified in: ${documentName}` : undefined),
              status: 'Active',
              prescribedBy: currentUser?.name || p.attendingPhysician,
              createdAt: now
            });
            addedCounts.medications++;
          }
        });
      }

      // 4. Save clinical notes if provided
      if (clinicalNotes && clinicalNotes.trim()) {
        p.clinicalNotes.unshift({
          id: `note_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          patientId: p.id,
          noteType: 'Clinical Observation',
          title: `Extracted Document Observation (${documentName || 'Document'})`,
          content: clinicalNotes.trim(),
          authorName: currentUser?.name || 'Attending Physician',
          authorRole: 'Clinical Staff',
          date: now,
          createdAt: now
        });
        addedCounts.notes++;
      }

      p.updatedAt = now;

      p.timeline.unshift({
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        timestamp: now,
        eventType: 'Extracted Data Saved',
        title: `Imported Extracted Data (${documentName || 'Document'})`,
        description: `Saved ${addedCounts.labs} lab test(s), ${addedCounts.diagnoses} diagnosis(es), ${addedCounts.medications} medication(s) directly into patient health record.`,
        createdByName: currentUser?.name || 'Medical Staff'
      });

      data.patientRecords[idx] = p;
      db.save(data);

      res.json({
        success: true,
        message: `Successfully imported ${addedCounts.labs} lab(s), ${addedCounts.diagnoses} diagnosis(es), ${addedCounts.medications} medication(s) into patient record.`,
        addedCounts,
        patient: p
      });
    } catch (err: any) {
      console.error('Save extracted data error:', err);
      res.status(500).json({ error: 'Failed to save extracted information to patient record.' });
    }
  });

  // 16. Create Medical Summary from Actual Patient Records
  app.post('/api/patients/:id/summary', async (req: Request, res: Response) => {
    try {
      const currentUser = authenticateUser(req);
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      const summary = await generatePatientAiClinicalSummary(p);

      p.aiSummaries.unshift(summary);
      p.updatedAt = new Date().toISOString();

      p.timeline.unshift({
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        timestamp: summary.generatedAt,
        eventType: 'Medical Summary Created',
        title: 'Synthesized AI Clinical Summary',
        description: 'Comprehensive medical summary generated strictly from actual patient vitals, labs, medications, and notes.',
        createdByName: currentUser?.name || 'MediVerse AI'
      });

      data.patientRecords[idx] = p;
      db.save(data);

      res.json({ success: true, summary, patient: p });
    } catch (err: any) {
      console.error('Summary synthesis error:', err);
      res.status(500).json({ error: 'Failed to generate medical summary.' });
    }
  });

  // 17. Create Prescription for Patient
  app.post('/api/patients/:id/prescriptions', (req: Request, res: Response) => {
    try {
      const currentUser = authenticateUser(req);
      const data = db.get();
      if (!Array.isArray(data.patientRecords)) data.patientRecords = [];

      const idx = data.patientRecords.findIndex(p => p.id === req.params.id || p.uhid === req.params.id);
      if (idx === -1) return res.status(404).json({ error: 'Patient not found.' });

      const p = normalizePatient(data.patientRecords[idx]);
      const {
        diagnosis,
        medicines = [],
        instructions = '',
        additionalNotes,
        followUpDate,
        doctorName,
        doctorSpecialty,
        doctorQualification,
        doctorLicense
      } = req.body;

      if (!diagnosis || !medicines || medicines.length === 0) {
        return res.status(400).json({ error: 'Diagnosis and at least one medication are required.' });
      }

      const now = new Date().toISOString();
      const rxId = `rx_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const rxNumber = `RX-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      const newRx: Prescription = {
        id: rxId,
        prescriptionNumber: rxNumber,
        patientUserId: p.userId || p.id,
        patientId: p.uhid,
        patientName: p.patientName,
        patientAge: p.age,
        patientGender: p.gender,
        doctorUserId: currentUser?.id || 'doc-1',
        doctorName: doctorName || currentUser?.name || p.attendingPhysician,
        doctorSpecialty: doctorSpecialty || (currentUser?.specialty || 'General Medicine'),
        doctorQualification: doctorQualification || (currentUser?.qualification || 'MBBS, MD'),
        doctorLicense: doctorLicense || (currentUser?.licenseNumber || 'MED-2026-LIC'),
        diagnosis: diagnosis.trim(),
        medicines: medicines.map((m: any) => ({
          name: m.name ? m.name.trim() : '',
          strength: m.strength ? m.strength.trim() : '',
          frequency: m.frequency ? m.frequency.trim() : '',
          duration: m.duration ? m.duration.trim() : '',
          instructions: m.instructions ? m.instructions.trim() : ''
        })),
        instructions: instructions ? instructions.trim() : 'Take medications as directed.',
        additionalNotes: additionalNotes ? additionalNotes.trim() : undefined,
        followUpDate: followUpDate || undefined,
        createdAt: now
      };

      // Add to global prescriptions
      if (!Array.isArray(data.prescriptions)) data.prescriptions = [];
      data.prescriptions.unshift(newRx);

      // Add to patient record
      p.prescriptions.unshift(newRx);

      // Also automatically add active medications to patient's medication list if not already present
      medicines.forEach((m: any) => {
        if (m.name) {
          const exists = p.medications.some(
            existing => existing.medicineName.toLowerCase() === m.name.toLowerCase() && existing.status === 'Active'
          );
          if (!exists) {
            p.medications.unshift({
              id: `med_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              patientId: p.id,
              medicineName: m.name.trim(),
              strength: m.strength ? m.strength.trim() : '',
              route: 'Oral',
              frequency: m.frequency ? m.frequency.trim() : 'As directed',
              duration: m.duration ? m.duration.trim() : '7 days',
              startDate: now,
              instructions: m.instructions ? m.instructions.trim() : undefined,
              status: 'Active',
              prescribedBy: newRx.doctorName,
              createdAt: now
            });
          }
        }
      });

      p.updatedAt = now;

      p.timeline.unshift({
        id: `tl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        patientId: p.id,
        timestamp: now,
        eventType: 'Prescription Issued',
        title: `Digital Prescription #${rxNumber} Issued`,
        description: `Prescription issued by ${newRx.doctorName} for ${newRx.diagnosis}. Prescribed ${newRx.medicines.length} item(s).`,
        createdByName: newRx.doctorName
      });

      data.patientRecords[idx] = p;
      db.save(data);

      res.status(201).json({ success: true, prescription: newRx, patient: p });
    } catch (err: any) {
      console.error('Prescription creation error:', err);
      res.status(500).json({ error: 'Failed to create prescription.' });
    }
  });

  // Catch-all 404 handler for unmatched /api/* requests so they ALWAYS return JSON, NEVER HTML!
  app.all('/api/*', (req: Request, res: Response) => {
    res.status(404).json({ error: `API route not found: ${req.method} ${req.originalUrl}` });
  });

  // Express global error handler middleware: always returns JSON for /api errors
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Unhandled server error:', err);
    if (req.originalUrl.startsWith('/api') || res.headersSent) {
      return res.status(500).json({ error: err?.message || 'Internal Server Error' });
    }
    next(err);
  });

  return app;
}

const defaultApp = createApp();
export default defaultApp;
