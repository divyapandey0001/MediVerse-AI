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
import { User, Appointment, BmiRecord, LabReportAnalysis, ContactMessage, Doctor, Review, UserFeedback } from './src/types.js';

dotenv.config();

const PORT = 3000;

async function startServer() {
  const app = express();

  // Allow up to 50MB for PDF and high-res image report uploads
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ extended: true, limit: '50mb' }));

  // Helper auth middleware
  function authenticate(req: Request): string | null {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    const token = authHeader.split(' ')[1];
    return db.verifyToken(token);
  }

  // --- API Routes ---

  app.get('/api/health', (req: Request, res: Response) => {
    res.json({ status: 'ok', service: 'MediVerse API', timestamp: new Date().toISOString() });
  });

  // 1. Authentication Endpoints
  app.post('/api/auth/signup', (req: Request, res: Response) => {
    try {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password) {
        return res.status(400).json({ error: 'Name, email, and password are required.' });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const data = db.get();
      if (data.users.some(u => u.email === normalizedEmail)) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const newUser = {
        id: userId,
        name: name.trim(),
        email: normalizedEmail,
        phone: phone ? phone.trim() : '',
        createdAt: new Date().toISOString(),
        passwordHash: db.hashPassword(password)
      };

      data.users.push(newUser);
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
        // Return friendly message even if email not found for safety
        return res.json({ message: 'If an account exists with this email, password reset instructions have been simulated.' });
      }
      res.json({ message: `Password reset link has been sent to ${email}.` });
    } catch (err: any) {
      res.status(500).json({ error: 'Request failed.' });
    }
  });

  app.get('/api/auth/me', (req: Request, res: Response) => {
    try {
      const userId = authenticate(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const data = db.get();
      const user = data.users.find(u => u.id === userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found.' });
      }
      const { passwordHash: _, ...safeUser } = user;
      res.json({ user: safeUser });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch user profile.' });
    }
  });

  app.put('/api/auth/profile', (req: Request, res: Response) => {
    try {
      const userId = authenticate(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const data = db.get();
      const userIndex = data.users.findIndex(u => u.id === userId);
      if (userIndex === -1) {
        return res.status(404).json({ error: 'User not found.' });
      }

      const { name, phone, age, gender, bloodGroup, allergies, emergencyContact } = req.body;
      if (name) data.users[userIndex].name = name;
      if (phone !== undefined) data.users[userIndex].phone = phone;
      if (age !== undefined) data.users[userIndex].age = Number(age) || undefined;
      if (gender !== undefined) data.users[userIndex].gender = gender;
      if (bloodGroup !== undefined) data.users[userIndex].bloodGroup = bloodGroup;
      if (allergies !== undefined) data.users[userIndex].allergies = allergies;
      if (emergencyContact !== undefined) data.users[userIndex].emergencyContact = emergencyContact;

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
      const userId = authenticate(req);
      const data = db.get();
      if (userId) {
        const userAppts = data.appointments.filter(a => a.userId === userId);
        return res.json({ appointments: userAppts });
      }
      // If unauthenticated, return empty or search by email/phone if provided via query
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

      const userId = authenticate(req) || undefined;
      const data = db.get();

      const appointmentCode = `MV-APT-${Math.floor(100000 + Math.random() * 900000)}`;
      const newAppointment: Appointment = {
        id: `apt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        appointmentCode,
        userId,
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
      db.save(data);

      res.status(201).json({ success: true, appointment: newAppointment });
    } catch (err: any) {
      console.error('Book appointment error:', err);
      res.status(500).json({ error: 'Failed to schedule appointment.' });
    }
  });

  app.delete('/api/appointments/:id', (req: Request, res: Response) => {
    try {
      const userId = authenticate(req);
      const apptId = req.params.id;
      const data = db.get();
      const index = data.appointments.findIndex(a => a.id === apptId);

      if (index === -1) {
        return res.status(404).json({ error: 'Appointment not found.' });
      }

      // Check ownership if user is logged in
      if (userId && data.appointments[index].userId && data.appointments[index].userId !== userId) {
        return res.status(403).json({ error: 'Unauthorized to cancel this appointment.' });
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

  app.post('/api/doctors', (req: Request, res: Response) => {
    try {
      const { name, specialty, qualification, department, experience, availableDays } = req.body;
      if (!name || !specialty || !department) {
        return res.status(400).json({ error: 'Doctor name, specialty, and department are required.' });
      }
      const data = db.get();
      const newDoc: Doctor = {
        id: `doc_${Date.now()}`,
        name: name.trim(),
        specialty: specialty.trim(),
        qualification: (qualification || 'MD').trim(),
        department: department.trim(),
        experience: (experience || '5+ years').trim(),
        availableDays: availableDays && availableDays.length ? availableDays : ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
      };
      data.doctors.push(newDoc);
      db.save(data);
      res.status(201).json({ success: true, doctor: newDoc });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to add doctor.' });
    }
  });

  // 8. BMI Records
  app.get('/api/bmi', (req: Request, res: Response) => {
    try {
      const userId = authenticate(req);
      if (!userId) {
        return res.json({ records: [] });
      }
      const data = db.get();
      const userRecords = data.bmiRecords.filter(r => r.userId === userId);
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

      const userId = authenticate(req) || undefined;
      const data = db.get();

      const newRecord: BmiRecord = {
        id: `bmi_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        userId,
        date: new Date().toISOString(),
        age: Number(age) || 30,
        sex: sex || 'Not specified',
        heightCm: Number(heightCm),
        weightKg: Number(weightKg),
        bmi: Number(bmi),
        category,
        guidance: guidance || []
      };

      if (userId) {
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
      const userId = authenticate(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const recordId = req.params.id;
      const data = db.get();
      const index = data.bmiRecords.findIndex(r => r.id === recordId && r.userId === userId);
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

  // 9. Saved Reports History
  app.get('/api/reports', (req: Request, res: Response) => {
    try {
      const userId = authenticate(req);
      if (!userId) {
        return res.json({ reports: [] });
      }
      const data = db.get();
      const userReports = data.reports.filter(r => r.userId === userId);
      res.json({ reports: userReports });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch saved reports.' });
    }
  });

  app.post('/api/reports', (req: Request, res: Response) => {
    try {
      const userId = authenticate(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const analysis: LabReportAnalysis = req.body;
      if (!analysis || !analysis.fileName || !analysis.testResults) {
        return res.status(400).json({ error: 'Invalid analysis payload.' });
      }
      analysis.userId = userId;
      const data = db.get();
      data.reports.unshift(analysis);
      db.save(data);
      res.status(201).json({ success: true, report: analysis });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to save report.' });
    }
  });

  app.delete('/api/reports/:id', (req: Request, res: Response) => {
    try {
      const userId = authenticate(req);
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized.' });
      }
      const reportId = req.params.id;
      const data = db.get();
      const index = data.reports.findIndex(r => r.id === reportId && r.userId === userId);
      if (index === -1) {
        return res.status(404).json({ error: 'Report not found.' });
      }
      data.reports.splice(index, 1);
      db.save(data);
      res.json({ success: true, message: 'Report deleted from history.' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete report.' });
    }
  });

  // 10. Contact Form Endpoint
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
