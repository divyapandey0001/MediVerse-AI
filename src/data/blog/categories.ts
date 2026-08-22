import { BlogCategory } from '../../types/blog.js';

export const BLOG_CATEGORIES: BlogCategory[] = [
  {
    id: 'medical-reports',
    name: 'Medical Reports',
    slug: 'medical-reports',
    description: 'Learn how to decipher blood tests, CBC, lipid profiles, metabolic panels, and pathology lab metrics.',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    iconName: 'FileText'
  },
  {
    id: 'symptoms',
    name: 'Symptoms',
    slug: 'symptoms',
    description: 'Practical guides on evaluating health signals, tracking symptoms over time, and preparing for clinical visits.',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    iconName: 'Stethoscope'
  },
  {
    id: 'medicines',
    name: 'Medicines',
    slug: 'medicines',
    description: 'Understand pharmaceutical generic names, mechanism of action, precautions, and drug interactions.',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    iconName: 'Pill'
  },
  {
    id: 'wellness-bmi',
    name: 'Wellness & BMI',
    slug: 'wellness-bmi',
    description: 'Evidence-based insights into body mass index, body composition, metabolic health, and nutritional wellness.',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    iconName: 'Calculator'
  },
  {
    id: 'ai-in-healthcare',
    name: 'AI in Healthcare',
    slug: 'ai-in-healthcare',
    description: 'How modern artificial intelligence assists health literacy, clinical documentation, and triage support.',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    iconName: 'Bot'
  },
  {
    id: 'medical-records',
    name: 'Medical Records',
    slug: 'medical-records',
    description: 'Best practices for organizing patient records, longitudinal history, digital archiving, and EHR portability.',
    color: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    iconName: 'FolderHeart'
  },
  {
    id: 'doctor-patient-care',
    name: 'Doctor & Patient Care',
    slug: 'doctor-patient-care',
    description: 'Empowering collaborative clinical care, digital consultation preparation, and doctor-patient communication.',
    color: 'bg-sky-50 text-sky-700 border-sky-200',
    iconName: 'Users'
  },
  {
    id: 'appointments',
    name: 'Appointments',
    slug: 'appointments',
    description: 'Maximize your clinical consultation time, digital booking workflows, and visit question checklists.',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    iconName: 'Calendar'
  },
  {
    id: 'digital-health',
    name: 'Digital Health',
    slug: 'digital-health',
    description: 'Navigating modern telemedicine, remote vitals monitoring, consumer health apps, and digital health tools.',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    iconName: 'Activity'
  },
  {
    id: 'privacy-healthcare',
    name: 'Privacy & Healthcare',
    slug: 'privacy-healthcare',
    description: 'Safeguarding personal health data, encryption standards, HIPAA/GDPR principles, and digital consent.',
    color: 'bg-slate-100 text-slate-800 border-slate-300',
    iconName: 'ShieldCheck'
  }
];
