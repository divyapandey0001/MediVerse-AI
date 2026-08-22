export type BlogCategoryName =
  | 'Medical Reports'
  | 'Symptoms'
  | 'Medicines'
  | 'Wellness & BMI'
  | 'AI in Healthcare'
  | 'Medical Records'
  | 'Doctor & Patient Care'
  | 'Appointments'
  | 'Digital Health'
  | 'Privacy & Healthcare';

export interface BlogCategory {
  id: string;
  name: BlogCategoryName;
  slug: string;
  description: string;
  color: string;
  iconName: string;
}

export interface BlogAuthor {
  name: string;
  role: string;
  avatarUrl?: string;
}

export interface BlogMedicalReviewer {
  name: string;
  credentials: string;
}

export interface BlogSection {
  id: string;
  heading: string;
  paragraphs: string[];
  bulletPoints?: string[];
  callout?: {
    type: 'info' | 'tip' | 'warning' | 'alert';
    title?: string;
    text: string;
  };
  table?: {
    headers: string[];
    rows: string[][];
  };
}

export interface BlogFAQ {
  question: string;
  answer: string;
}

export interface BlogTargetService {
  name: string;
  path: string; // e.g. 'lab-report', 'symptom-checker', 'medicine-info', 'bmi', 'ai-chat', 'appointment', 'live-patient-record'
  title: string;
  description: string;
  buttonText: string;
}

export interface BlogArticle {
  slug: string;
  title: string;
  excerpt: string;
  category: BlogCategoryName;
  categorySlug: string;
  coverImage: string;
  coverImageAlt: string;
  publishedAt: string;
  updatedAt?: string;
  readTime: string;
  isFeatured?: boolean;
  author: BlogAuthor;
  medicalReviewer?: BlogMedicalReviewer;
  keyTakeaways: string[];
  sections: BlogSection[];
  faqs?: BlogFAQ[];
  keywords: string[];
  relatedSlugs: string[];
  targetService: BlogTargetService;
}
