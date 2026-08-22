import { BlogArticle } from '../../types/blog.js';

export const appointmentsArticles: BlogArticle[] = [
  {
    slug: 'how-to-prepare-for-a-doctor-appointment',
    title: 'How to Prepare for a Doctor Appointment',
    excerpt: 'A practical, stress-free clinical preparation guide to ensure you communicate your concerns effectively, remember vital instructions, and get the best care.',
    category: 'Appointments',
    categorySlug: 'appointments',
    coverImage: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Patient sitting in modern doctor consultation room with notebook preparing questions',
    publishedAt: 'August 13, 2026',
    readTime: '6 min read',
    author: {
      name: 'Dr. Sarah Jenkins, MD',
      role: 'Internal Medicine Specialist',
    },
    keyTakeaways: [
      'Write down your symptoms, timeline, and questions on paper or in your phone before you arrive.',
      'Bring all your prescription bottles, over-the-counter supplements, and recent test reports.',
      'Be completely honest about your lifestyle habits, alcohol intake, smoking, and medication adherence.',
      'Ask for clarification if medical terms or next steps are unclear; repeat the plan back to the doctor to confirm understanding.'
    ],
    sections: [
      {
        id: 'before-the-visit',
        heading: 'The 3 Days Before: Organizing Your Thoughts and Documents',
        paragraphs: [
          'The key to an empowering, highly productive medical appointment lies in the preparation done before you ever step into the waiting room.',
          'Start by creating a dedicated note on your phone. Record when your symptoms began, what makes them better or worse, and any patterns you have observed.'
        ],
        bulletPoints: [
          'Gather Previous Test Results: Collect recent blood work, imaging discs, and specialist consultation notes.',
          'Formulate Your Top 3 Questions: Limit your primary list to the three most urgent questions so you don’t feel rushed.',
          'Check Insurance & Identification: Have your insurance card, photo ID, and copayment ready.',
          'Identify a Support Companion: If you feel anxious, ask a trusted family member or friend to accompany you to take notes.'
        ]
      },
      {
        id: 'during-the-visit',
        heading: 'During the Consultation: Communicating with Clarity',
        paragraphs: [
          'When the doctor enters the room and asks, "What brings you in today?", state your main reason clearly in the first two sentences. Avoid holding back your most concerning symptom until the doctor has their hand on the doorknob ("the doorknob complaint").'
        ]
      },
      {
        id: 'the-teach-back-method',
        heading: 'The "Teach-Back" Technique for Remembering Instructions',
        paragraphs: [
          'Studies indicate that patients forget 40–80% of medical information immediately after leaving the clinic. Use the Teach-Back technique: "Just to make sure I have everything straight: I should take the new pill with breakfast, stop taking the blue capsule, and get my blood retested in four weeks. Is that right?"'
        ]
      }
    ],
    faqs: [
      {
        question: 'What should I do if I disagree with my doctor’s recommendation?',
        answer: 'Communicate openly: "Can you help me understand the risks and benefits of this approach versus alternative options or watchful waiting?" You always have the right to ask for a second opinion.'
      }
    ],
    keywords: ['prepare for doctor appointment', 'doctor visit checklist', 'how to talk to your doctor', 'teach back method', 'medical consultation tips'],
    relatedSlugs: ['what-information-should-you-have-ready-before-a-healthcare-appointment', 'how-digital-appointment-management-can-make-healthcare-visits-easier', 'how-to-prepare-your-medical-information-before-a-doctor-visit'],
    targetService: {
      name: 'Doctor Appointment',
      path: 'appointment',
      title: 'Schedule Your Next Doctor Appointment',
      description: 'Book and manage your clinical consultations easily through the MediVerse AI digital appointment scheduler.',
      buttonText: 'Book Appointment'
    }
  },
  {
    slug: 'what-information-should-you-have-ready-before-a-healthcare-appointment',
    title: 'What Information Should You Have Ready Before a Healthcare Appointment?',
    excerpt: 'The ultimate patient checklist: medications, past surgeries, allergy lists, family history, and recent vitals logs.',
    category: 'Appointments',
    categorySlug: 'appointments',
    coverImage: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Medical clipboard with patient history checklist and clinical documents',
    publishedAt: 'August 08, 2026',
    readTime: '5 min read',
    author: {
      name: 'MediVerse Medical Editorial Board',
      role: 'Clinical Communication Specialists',
    },
    keyTakeaways: [
      'Have an exact list of all medications including dosage (mg) and frequency.',
      'Know your family medical history (cardiac disease, stroke, diabetes, cancers in first-degree relatives).',
      'Document known drug allergies and the exact reaction you experienced (e.g. hives, swelling, stomach ache).',
      'Keep your emergency contact information and pharmacy location up to date.'
    ],
    sections: [
      {
        id: 'the-master-checklist',
        heading: 'The 6-Part Master Patient Checklist',
        paragraphs: [
          'Before heading to your appointment, verify that you have the following information prepared:'
        ],
        table: {
          headers: ['Category', 'What to Include', 'Why It Matters'],
          rows: [
            ['1. Active Medications', 'Prescriptions, OTC pain relievers, vitamins, herbal teas', 'Prevents dangerous drug interactions and duplicate prescribing'],
            ['2. Allergy Profile', 'Medications, foods, latex, and reaction type', 'Ensures safe prescribing and clinical environment safety'],
            ['3. Surgical History', 'Procedures, approximate years, and implant details', 'Provides vital anatomical context for examinations'],
            ['4. Family History', 'Conditions in parents, siblings, and grandparents', 'Identifies genetic risk profiles and screening recommendations'],
            ['5. Home Vitals Log', 'Blood pressure, blood sugar, or pulse logs', 'Provides real-world baseline data beyond clinic white-coat spikes'],
            ['6. Preferred Pharmacy', 'Name, street address, and phone number of pharmacy', 'Enables instant electronic prescription dispatch']
          ]
        }
      }
    ],
    faqs: [
      {
        question: 'Should I mention vitamins and herbal teas to my doctor?',
        answer: 'Yes. Many natural supplements have potent biochemical effects. For example, St. John\'s Wort interacts with dozens of medications, and Ginkgo Biloba can increase bleeding risk.'
      }
    ],
    keywords: ['appointment checklist', 'medical history checklist', 'what to bring to doctor', 'patient information sheet', 'family medical history'],
    relatedSlugs: ['how-to-prepare-for-a-doctor-appointment', 'how-digital-appointment-management-can-make-healthcare-visits-easier', 'why-you-should-keep-your-medical-records-organized'],
    targetService: {
      name: 'Doctor Appointment',
      path: 'appointment',
      title: 'Manage Your Appointments & Clinical Checklists',
      description: 'Use the MediVerse Appointment Scheduler to organize your upcoming doctor visits and pre-visit documentation.',
      buttonText: 'View Appointments'
    }
  },
  {
    slug: 'how-digital-appointment-management-can-make-healthcare-visits-easier',
    title: 'How Digital Appointment Management Can Make Healthcare Visits Easier',
    excerpt: 'How automated online scheduling, calendar reminders, digital check-ins, and pre-visit questionnaires eliminate waiting room friction.',
    category: 'Appointments',
    categorySlug: 'appointments',
    coverImage: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Calendar digital appointment booking interface on smartphone screen',
    publishedAt: 'August 03, 2026',
    readTime: '5 min read',
    author: {
      name: 'MediVerse Medical Editorial Board',
      role: 'Health Informatics Team',
    },
    keyTakeaways: [
      'Digital appointment booking eliminates phone hold times and allows 24/7 self-scheduling.',
      'Automated SMS and email reminders significantly reduce missed appointments (no-shows).',
      'Pre-visit digital forms allow you to fill out medical history calmly at home rather than on a clipboard in the waiting room.',
      'MediVerse AI integrates appointment booking with automated patient record linkage.'
    ],
    sections: [
      {
        id: 'the-friction-of-traditional-booking',
        heading: 'Why Phone Booking Is Fading in Modern Healthcare',
        paragraphs: [
          'Calling a clinic during limited office hours, waiting on hold for 15 minutes, and playing phone tag to reschedule is frustrating for patients and expensive for clinics.',
          'Digital appointment management platforms empower patients to browse doctor specialties, select convenient open slots, and receive instant confirmation within 60 seconds.'
        ]
      },
      {
        id: 'the-benefits-for-patients-and-doctors',
        heading: 'Benefits of Digital Scheduling on MediVerse AI',
        paragraphs: [
          'MediVerse AI connects the appointment scheduler directly with your health profile. When you book an appointment, your linked physician receives your preliminary symptom summary and past lab trends beforehand, allowing the doctor to prepare before you arrive.'
        ]
      }
    ],
    faqs: [
      {
        question: 'Can I cancel or reschedule my appointment online?',
        answer: 'Yes. MediVerse provides instant cancellation and rescheduling directly from your appointment dashboard.'
      }
    ],
    keywords: ['digital appointment booking', 'online doctor scheduling', 'medical appointment manager', 'healthcare calendar', 'MediVerse appointment scheduler'],
    relatedSlugs: ['how-to-prepare-for-a-doctor-appointment', 'what-information-should-you-have-ready-before-a-healthcare-appointment', 'how-digital-medical-records-can-make-healthcare-information-easier-to-manage'],
    targetService: {
      name: 'Doctor Appointment',
      path: 'appointment',
      title: 'Schedule Your Appointment with MediVerse',
      description: 'Experience fast, seamless digital healthcare scheduling with instant confirmation and automated reminders.',
      buttonText: 'Book an Appointment Now'
    }
  }
];
