import { BlogArticle } from '../../types/blog.js';

export const symptomsArticles: BlogArticle[] = [
  {
    slug: 'what-should-you-do-when-you-have-a-new-symptom',
    title: 'What Should You Do When You Have a New Symptom?',
    excerpt: 'A clear clinical decision framework for evaluating new health symptoms, recognizing red flag emergency warnings, and seeking appropriate care.',
    category: 'Symptoms',
    categorySlug: 'symptoms',
    coverImage: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Physician consulting a patient about new physical symptoms with digital health tablet',
    publishedAt: 'August 14, 2026',
    readTime: '6 min read',
    author: {
      name: 'Dr. Sarah Jenkins, MD',
      role: 'Internal Medicine Specialist',
    },
    keyTakeaways: [
      'Evaluate new symptoms using the OPQRST method (Onset, Provocation, Quality, Region, Severity, Timing).',
      'Immediately rule out emergency "red flags" such as sudden crushing chest pain, difficulty breathing, or focal neurological deficits.',
      'Document the chronology of your symptom before your doctor appointment.',
      'Use the MediVerse AI Symptom Checker for educational triage support and preparation.'
    ],
    sections: [
      {
        id: 'step-1-red-flags',
        heading: 'Step 1: Immediately Rule Out Emergency Red Flags',
        paragraphs: [
          'Whenever a new or unexpected physical symptom emerges, the first priority is verifying that it does not represent an acute life-threatening emergency.',
          'If you or someone around you experiences any of the following critical signs, call your regional emergency number (911, 999, 112) or go to the nearest emergency department immediately:'
        ],
        bulletPoints: [
          'Crushing chest pressure, pain radiating to the jaw, neck, left arm, or back.',
          'Sudden severe shortness of breath or inability to speak in complete sentences.',
          'Sudden weakness or numbness in the face, arm, or leg, especially on one side (FAST stroke signs).',
          'Sudden severe "thunderclap" headache unlike any previous headache.',
          'Uncontrolled bleeding, high persistent fever with stiff neck, or sudden loss of consciousness.'
        ]
      },
      {
        id: 'step-2-opqrst',
        heading: 'Step 2: Characterize Your Symptom Using the OPQRST Method',
        paragraphs: [
          'If emergency signs are not present, systematically record the details of your symptom. Clinicians use the OPQRST mnemonic to understand disease patterns:'
        ],
        table: {
          headers: ['Letter', 'Clinical Dimension', 'Questions to Answer for Yourself'],
          rows: [
            ['O - Onset', 'When and how did it start?', 'Was it sudden (minutes) or gradual (days)? What were you doing?'],
            ['P - Provocation / Palliation', 'What makes it better or worse?', 'Does rest, heat, cold, posture, or eating change the sensation?'],
            ['Q - Quality', 'What does it feel like?', 'Is it sharp, dull, aching, burning, throbbing, or cramping?'],
            ['R - Region & Radiation', 'Where is it located?', 'Is it localized to one spot, or does it radiate elsewhere?'],
            ['S - Severity', 'How intense is it?', 'On a scale from 1 (barely noticeable) to 10 (unbearable)?'],
            ['T - Timing', 'How does it behave over time?', 'Is it constant, intermittent, or worse in the morning/evening?']
          ]
        }
      },
      {
        id: 'step-3-seeking-care',
        heading: 'Step 3: Choosing the Right Care Setting',
        paragraphs: [
          'Depending on the severity and duration, choose between Primary Care Clinic (routine non-urgent symptoms lasting several days), Urgent Care Center (same-day evaluation for moderate sprains, cuts, minor infections), or Emergency Department (acute emergencies).'
        ]
      }
    ],
    faqs: [
      {
        question: 'Should I search my symptoms on web search engines?',
        answer: 'Unstructured web searches often amplify anxiety by showing worst-case rare diagnoses without clinical context. Using structured, medically reviewed tools like MediVerse AI Symptom Checker provides balanced educational triage.'
      }
    ],
    keywords: ['new symptom guide', 'when to see a doctor', 'OPQRST symptoms', 'emergency red flags', 'symptom triage'],
    relatedSlugs: ['how-does-an-ai-symptom-checker-work', 'what-information-should-you-provide-when-checking-your-symptoms', 'why-tracking-symptoms-over-time-can-be-useful'],
    targetService: {
      name: 'Symptom Checker',
      path: 'symptom-checker',
      title: 'Check Your Symptoms with MediVerse AI',
      description: 'Enter your symptoms, duration, and severity to receive structured educational insights and specialist recommendations.',
      buttonText: 'Check Symptoms Now'
    }
  },
  {
    slug: 'how-does-an-ai-symptom-checker-work',
    title: 'How Does an AI Symptom Checker Work?',
    excerpt: 'An inside look at the probabilistic models, clinical decision logic, and medical ontologies powering modern AI symptom assessment engines.',
    category: 'Symptoms',
    categorySlug: 'symptoms',
    coverImage: 'https://images.unsplash.com/photo-1516549655169-df83a0774514?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Futuristic healthcare digital interface illustrating medical symptom assessment algorithms',
    publishedAt: 'August 09, 2026',
    readTime: '6 min read',
    author: {
      name: 'MediVerse Medical Editorial Board',
      role: 'Health AI Innovation Team',
    },
    keyTakeaways: [
      'AI symptom checkers use natural language processing to convert conversational descriptions into standardized clinical concepts.',
      'Probabilistic reasoning models evaluate risk factors, age, gender, symptom duration, and co-occurring signs.',
      'Symptom checkers are triage and educational instruments, not definitive diagnostic devices.',
      'The output suggests potential educational possibilities to discuss with a licensed medical professional.'
    ],
    sections: [
      {
        id: 'the-architecture',
        heading: 'The Three-Tier Architecture of AI Symptom Checkers',
        paragraphs: [
          'Modern AI symptom checkers are significantly more sophisticated than static flowcharts from the early 2000s. They employ a multi-layered reasoning architecture:'
        ],
        bulletPoints: [
          '1. Natural Language Processing (NLP): Extracts key concepts from free text (e.g., mapping "head spinning after standing up" to "orthostatic lightheadedness/vertigo").',
          '2. Medical Ontology Integration: Links symptoms to established global biomedical databases (UMLS, SNOMED CT, ICD-11).',
          '3. Bayesian & Probabilistic Scoring: Evaluates the statistical likelihood of conditions based on demographic risks, seasonal patterns, and co-occurring symptom clusters.'
        ]
      },
      {
        id: 'safety-and-guardrails',
        heading: 'Safety Guardrails and Urgency Classification',
        paragraphs: [
          'The most critical component of a responsible AI symptom checker is its safety guardrail system. Before generating any diagnostic possibilities, the engine evaluates inputs against a high-priority red-flag detector.',
          'If keywords indicating cardiac distress, respiratory failure, stroke, or anaphylaxis are detected, the system immediately directs the user to emergency services, halting standard symptom evaluation.'
        ]
      }
    ],
    faqs: [
      {
        question: 'Can an AI symptom checker replace a doctor visit?',
        answer: 'No. An AI symptom checker cannot perform physical examinations, auscultate lung sounds, feel abdominal tenderness, or order laboratory tests. It is designed to prepare and educate you for your physician visit.'
      }
    ],
    keywords: ['AI symptom checker', 'how symptom checkers work', 'health triage AI', 'medical NLP', 'MediVerse AI symptoms'],
    relatedSlugs: ['what-should-you-do-when-you-have-a-new-symptom', 'what-information-should-you-provide-when-checking-your-symptoms', 'ai-in-healthcare-what-ai-can-and-cannot-do'],
    targetService: {
      name: 'Symptom Checker',
      path: 'symptom-checker',
      title: 'Try the MediVerse AI Symptom Checker',
      description: 'Explore potential health insights based on your age, gender, symptoms, and medical history.',
      buttonText: 'Start Symptom Assessment'
    }
  },
  {
    slug: 'what-information-should-you-provide-when-checking-your-symptoms',
    title: 'What Information Should You Provide When Checking Your Symptoms?',
    excerpt: 'Maximize the precision of digital health tools by learning which clinical details, timelines, and medical history matter most.',
    category: 'Symptoms',
    categorySlug: 'symptoms',
    coverImage: 'https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Patient writing down health details and symptom notes in a notebook',
    publishedAt: 'August 06, 2026',
    readTime: '5 min read',
    author: {
      name: 'Dr. Sarah Jenkins, MD',
      role: 'Internal Medicine Specialist',
    },
    keyTakeaways: [
      'Accurate age, biological sex, and pregnancy status strongly influence clinical disease probabilities.',
      'Specify exact duration (e.g., "3 days" vs. "a while") and whether the symptom is constant or episodic.',
      'List all current medications, dietary supplements, and preexisting chronic conditions.',
      'Mention relevant environmental exposures, recent travel, or sick contacts.'
    ],
    sections: [
      {
        id: 'essential-inputs',
        heading: 'The 5 Essential Pieces of Information to Include',
        paragraphs: [
          'The quality of insight you receive from any health tool—or from your doctor—is directly proportional to the clarity and detail of the information you provide:'
        ],
        bulletPoints: [
          '1. Primary Symptom & Exact Location: Be specific (e.g., "throbbing ache in the right temple" rather than just "headache").',
          '2. Exact Chronology & Duration: Note when it began, whether it started abruptly or gradually, and if it is getting progressively worse.',
          '3. Associated Symptoms: Mention secondary signs like fever, nausea, dizziness, chills, or skin rash.',
          '4. Existing Health Conditions: Include chronic diagnoses such as diabetes, asthma, hypertension, or autoimmune conditions.',
          '5. Current Medications & Supplements: Include prescription drugs, over-the-counter pain relievers, and herbal supplements.'
        ]
      }
    ],
    faqs: [
      {
        question: 'Why does biological sex matter in symptom checking?',
        answer: 'Biological sex influences anatomical predispositions (e.g., prostate vs. ovarian conditions) and symptom presentation nuances (e.g., women frequently experience atypical heart attack symptoms such as jaw pain and nausea rather than classic chest pressure).'
      }
    ],
    keywords: ['symptom check details', 'what to tell your doctor', 'symptom checklist', 'medical history preparation', 'symptom checker inputs'],
    relatedSlugs: ['what-should-you-do-when-you-have-a-new-symptom', 'why-tracking-symptoms-over-time-can-be-useful', 'how-to-prepare-for-a-doctor-appointment'],
    targetService: {
      name: 'Symptom Checker',
      path: 'symptom-checker',
      title: 'Provide Your Details in the Symptom Checker',
      description: 'Input your detailed symptoms, timeline, and health factors for structured medical analysis.',
      buttonText: 'Open Symptom Checker'
    }
  },
  {
    slug: 'why-tracking-symptoms-over-time-can-be-useful',
    title: 'Why Tracking Symptoms Over Time Can Be Useful',
    excerpt: 'How maintaining a structured symptom log uncovers disease triggers, accelerates accurate diagnosis, and improves doctor visits.',
    category: 'Symptoms',
    categorySlug: 'symptoms',
    coverImage: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=1200&q=80',
    coverImageAlt: 'Person tracking daily wellness habits and symptom logs on mobile health app',
    publishedAt: 'August 02, 2026',
    readTime: '6 min read',
    author: {
      name: 'Dr. Michael Vance, MD',
      role: 'Clinical Contributor',
    },
    keyTakeaways: [
      'Human memory is prone to recall bias; a written or digital log captures objective day-to-day patterns.',
      'Symptom tracking is invaluable for episodic conditions like migraines, IBS, fibromyalgia, and allergies.',
      'Connecting symptoms with diet, sleep, menstrual cycle, or stress helps isolate root triggers.',
      'Doctors can review a structured timeline in 60 seconds, drastically improving consultation efficiency.'
    ],
    sections: [
      {
        id: 'the-power-of-longitudinal-logs',
        heading: 'Why Memory Fails During Clinical Appointments',
        paragraphs: [
          'When a physician asks, "How often have you felt dizzy over the past two months?", most people answer with vague estimates like "often" or "a couple times a week".',
          'When patients maintain a chronological symptom diary, the data is transformed into actionable medical evidence: "I felt dizzy four times this month, each time 30 minutes after taking my morning blood pressure pill."'
        ]
      },
      {
        id: 'what-to-track',
        heading: 'What to Include in Your Symptom Diary',
        paragraphs: [
          'For conditions like headaches, joint pain, digestive upset, or skin flare-ups, record: Date/Time, Severity (1–10), Potential Trigger (meal, weather, exertion, stress), Duration, and Relief Measures tried.'
        ]
      }
    ],
    faqs: [
      {
        question: 'What is the best way to present a symptom log to my doctor?',
        answer: 'Bring a concise 1-page summary highlighting frequency, average severity, top suspected triggers, and what medications provided relief.'
      }
    ],
    keywords: ['symptom tracking', 'symptom diary', 'track health symptoms', 'migraine log', 'chronic illness journal'],
    relatedSlugs: ['what-should-you-do-when-you-have-a-new-symptom', 'how-to-prepare-your-medical-information-before-a-doctor-visit', 'how-to-prepare-for-a-doctor-appointment'],
    targetService: {
      name: 'Symptom Checker',
      path: 'symptom-checker',
      title: 'Analyze Your Symptom History with MediVerse AI',
      description: 'Use the MediVerse AI Symptom Checker and Health Chat to evaluate evolving health patterns.',
      buttonText: 'Start Symptom Log Review'
    }
  }
];
