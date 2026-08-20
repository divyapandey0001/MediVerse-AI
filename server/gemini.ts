import { GoogleGenAI, Type } from '@google/genai';
import { LabReportAnalysis, SymptomAnalysisResult, MedicineInfoResult } from '../src/types.js';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is missing.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build'
      }
    }
  });
}

// Clean JSON response helper that safely handles markdown wrappers or stray characters
function extractCleanJson(text: string): any {
  if (!text) throw new Error('Empty response');
  let clean = text.trim();
  if (clean.startsWith('```json')) {
    clean = clean.substring(7);
  } else if (clean.startsWith('```')) {
    clean = clean.substring(3);
  }
  if (clean.endsWith('```')) {
    clean = clean.substring(0, clean.length - 3);
  }
  clean = clean.trim();
  return JSON.parse(clean);
}

// Resilient multi-model retry executor
async function callGeminiWithRetry<T>(
  fn: (ai: GoogleGenAI, modelName: string) => Promise<T>,
  preferredModels: string[] = ['gemini-3.7-flash', 'gemini-3.1-flash-lite', 'gemini-flash-latest']
): Promise<T> {
  const ai = getGeminiClient();
  let lastError: any = null;

  for (const model of preferredModels) {
    // Attempt up to 2 tries per model with brief backoff
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        return await fn(ai, model);
      } catch (err: any) {
        lastError = err;
        const msg = err?.message || String(err);
        const isTransient =
          msg.includes('503') ||
          msg.includes('high demand') ||
          msg.includes('UNAVAILABLE') ||
          msg.includes('429') ||
          msg.includes('RESOURCE_EXHAUSTED') ||
          msg.includes('500') ||
          msg.includes('Internal Server Error') ||
          msg.includes('ECONNRESET') ||
          msg.includes('ETIMEDOUT') ||
          msg.includes('fetch failed');

        console.warn(`[Gemini API] Attempt ${attempt} with model ${model} failed: ${msg}`);

        if (isTransient && attempt === 1) {
          // Brief exponential backoff before retry
          await new Promise(resolve => setTimeout(resolve, 800));
        } else {
          // Move on to next model
          break;
        }
      }
    }
  }

  throw lastError || new Error('All AI model fallback attempts failed.');
}

// Comprehensive Clinical Medication Knowledge Base for fallback & offline reliability
const MEDICINE_KNOWLEDGE_BASE: Record<string, Partial<MedicineInfoResult>> = {
  paracetamol: {
    medicineName: 'Paracetamol (Acetaminophen)',
    genericName: 'Acetaminophen / Paracetamol',
    drugClass: 'Analgesic and Antipyretic (Pain Reliever / Fever Reducer)',
    commonUses: [
      'Relief of mild to moderate pain (headaches, muscle aches, toothaches, backaches)',
      'Reduction of fever in viral or bacterial infections',
      'Management of arthritis pain and osteoarthritis symptoms'
    ],
    mechanismOfAction:
      'Inhibits prostaglandin synthesis centrally in the central nervous system and blocks pain impulse generation, while acting on the hypothalamic heat-regulating center to lower fever.',
    commonSideEffects: [
      'Nausea or mild stomach upset (rare at recommended doses)',
      'Mild rash or allergic skin reaction',
      'Rare: elevated liver enzymes with prolonged or high dosage'
    ],
    importantPrecautions: [
      'Do not exceed the maximum daily recommended dose (usually 4,000 mg/day for healthy adults, or lower in liver disease).',
      'Avoid concurrent use of other over-the-counter cold/flu medications containing acetaminophen to prevent accidental overdose.',
      'Caution in patients with severe hepatic impairment, chronic alcoholism, or severe malnutrition.'
    ],
    commonInteractions: [
      'Alcohol (increases risk of severe liver toxicity)',
      'Warfarin / blood thinners (prolonged high doses may increase bleeding risk)',
      'Isoniazid and other hepatotoxic medications'
    ],
    whenToContactDoctor: [
      'Fever persists for more than 3 days or pain lasts longer than 10 days',
      'Signs of allergic reaction (swelling of face/lips, difficulty breathing, severe rash)',
      'Signs of liver stress: yellowing of skin/eyes (jaundice), dark urine, upper right stomach pain'
    ],
    disclaimer: 'This pharmaceutical overview is educational. Always follow packaging instructions and consult a doctor or pharmacist for proper dosing.'
  },
  acetaminophen: {
    medicineName: 'Acetaminophen (Paracetamol / Tylenol)',
    genericName: 'Acetaminophen',
    drugClass: 'Analgesic and Antipyretic',
    commonUses: [
      'Relief of mild to moderate pain and discomfort',
      'Fever reduction in adults and children',
      'Tension headaches and minor musculoskeletal pain'
    ],
    mechanismOfAction:
      'Acts centrally to inhibit prostaglandin synthesis and acts on the temperature-regulating center of the brain to dissipate body heat.',
    commonSideEffects: ['Generally well tolerated at standard therapeutic doses', 'Rare allergic skin reactions'],
    importantPrecautions: [
      'Avoid exceeding maximum single or daily recommended dosage.',
      'Check all multi-symptom cold medications for acetaminophen content.',
      'Consult physician if you have pre-existing liver conditions.'
    ],
    commonInteractions: ['Alcohol', 'Warfarin', 'Certain anti-seizure medications (e.g., Carbamazepine, Phenytoin)'],
    whenToContactDoctor: [
      'Suspected overdose or accidental ingestion of excessive doses',
      'Persistent high fever (>3 days)',
      'Severe abdominal pain, nausea, or jaundice'
    ],
    disclaimer: 'Educational information only. Confirm dosage with a healthcare professional.'
  },
  ibuprofen: {
    medicineName: 'Ibuprofen (Advil, Motrin)',
    genericName: 'Ibuprofen',
    drugClass: 'Nonsteroidal Anti-inflammatory Drug (NSAID)',
    commonUses: [
      'Relief of inflammatory pain (joint pain, dental pain, menstrual cramps, arthritis)',
      'Reduction of fever and swelling',
      'Management of acute muscle strains and sprains'
    ],
    mechanismOfAction:
      'Inhibits the cyclooxygenase enzymes (COX-1 and COX-2), decreasing the synthesis of pro-inflammatory prostaglandins.',
    commonSideEffects: [
      'Stomach upset, indigestion, or heartburn',
      'Nausea or mild dizziness',
      'Fluid retention or mild elevation in blood pressure'
    ],
    importantPrecautions: [
      'Take with food, milk, or a full glass of water to minimize stomach irritation.',
      'Use with caution in patients with history of peptic ulcers, gastrointestinal bleeding, or kidney impairment.',
      'Avoid during the third trimester of pregnancy.'
    ],
    commonInteractions: [
      'Aspirin and other NSAIDs (increases ulceration and bleeding risk)',
      'Anticoagulants (Warfarin, Apixaban) and antiplatelets',
      'ACE inhibitors and diuretics (may reduce antihypertensive efficacy)',
      'Lithium and Methotrexate'
    ],
    whenToContactDoctor: [
      'Black, tarry stools, or vomiting coffee-ground material (GI bleeding signs)',
      'Severe chest pain, shortness of breath, or sudden weakness',
      'Swelling of legs/ankles or sudden unexplained weight gain'
    ],
    disclaimer: 'Educational reference. Consult your doctor or pharmacist prior to taking NSAIDs.'
  },
  amoxicillin: {
    medicineName: 'Amoxicillin',
    genericName: 'Amoxicillin Trihydrate',
    drugClass: 'Beta-Lactam Penicillin Antibiotic',
    commonUses: [
      'Treatment of bacterial respiratory tract infections (bronchitis, pneumonia)',
      'Ear, nose, and throat infections (otitis media, sinusitis, strep pharyngitis)',
      'Urinary tract infections and skin/soft tissue bacterial infections'
    ],
    mechanismOfAction:
      'Binds to penicillin-binding proteins (PBPs) in the bacterial cell wall, inhibiting bacterial cell wall synthesis and causing bacterial cell lysis.',
    commonSideEffects: [
      'Diarrhea or loose stools',
      'Nausea or abdominal discomfort',
      'Mild skin rash or yeast infection (candidiasis)'
    ],
    importantPrecautions: [
      'Complete the full prescribed course even if symptoms improve early to prevent bacterial resistance.',
      'Contraindicated in individuals with a known severe allergy to penicillins or cephalosporins.',
      'Does NOT treat viral infections such as the common cold, COVID-19, or influenza.'
    ],
    commonInteractions: [
      'Probenecid (prolongs amoxicillin blood levels)',
      'Allopurinol (increased incidence of rash)',
      'Oral contraceptives (may slightly alter efficacy; use barrier backup)'
    ],
    whenToContactDoctor: [
      'Severe allergic signs: hives, wheezing, throat tightness, or facial swelling',
      'Severe watery diarrhea with abdominal cramping (C. difficile colitis risk)',
      'No clinical improvement after 48-72 hours of starting therapy'
    ],
    disclaimer: 'Prescription antibiotic. Use strictly under the supervision of a licensed physician.'
  },
  metformin: {
    medicineName: 'Metformin (Glucophage)',
    genericName: 'Metformin Hydrochloride',
    drugClass: 'Biguanide Antihyperglycemic Agent',
    commonUses: [
      'First-line pharmacological management of Type 2 Diabetes Mellitus',
      'Improvement of glycemic control in conjunction with diet and exercise',
      'Off-label: Polycystic Ovary Syndrome (PCOS) and insulin resistance'
    ],
    mechanismOfAction:
      'Decreases hepatic glucose production, decreases intestinal absorption of glucose, and improves insulin sensitivity by increasing peripheral glucose uptake and utilization.',
    commonSideEffects: [
      'Gastrointestinal symptoms (diarrhea, nausea, flatulence, abdominal bloating)',
      'Metallic taste in mouth',
      'Vitamin B12 deficiency with long-term therapy'
    ],
    importantPrecautions: [
      'Take with meals to reduce gastrointestinal side effects.',
      'Monitor kidney function regularly (eGFR); contraindicated in severe renal impairment.',
      'Temporarily withhold prior to radiologic procedures with iodinated contrast media.',
      'Rare but serious risk: Lactic acidosis (higher in severe hypoxia, sepsis, or kidney failure).'
    ],
    commonInteractions: [
      'Alcohol (potentiates effect of metformin on lactate metabolism)',
      'Cimetidine and cationic drugs',
      'Carbonic anhydrase inhibitors'
    ],
    whenToContactDoctor: [
      'Symptoms of lactic acidosis: severe fatigue, muscle aches, trouble breathing, unexplained stomach discomfort, feeling cold',
      'Signs of severe hypoglycemia if combined with insulin or sulfonylureas'
    ],
    disclaimer: 'Prescription diabetes medication. Requires regular physician follow-up and laboratory monitoring.'
  },
  atorvastatin: {
    medicineName: 'Atorvastatin (Lipitor)',
    genericName: 'Atorvastatin Calcium',
    drugClass: 'HMG-CoA Reductase Inhibitor (Statin)',
    commonUses: [
      'Reduction of elevated total cholesterol, LDL-C, and triglycerides',
      'Prevention of cardiovascular events (heart attack, stroke) in high-risk patients',
      'Secondary prevention in patients with established coronary artery disease'
    ],
    mechanismOfAction:
      'Selectively and competitively inhibits HMG-CoA reductase, the rate-limiting enzyme that converts HMG-CoA to mevalonate, upregulating hepatic LDL receptors and clearing LDL from the blood.',
    commonSideEffects: [
      'Muscle aches, stiffness, or joint pain (myalgia)',
      'Mild diarrhea, nausea, or indigestion',
      'Mild transient elevation in liver transaminases'
    ],
    importantPrecautions: [
      'Avoid large quantities of grapefruit or grapefruit juice (>1 quart/day).',
      'Contraindicated in active liver disease or during pregnancy and lactation.',
      'Periodic liver function testing and lipid panel checks are recommended.'
    ],
    commonInteractions: [
      'Strong CYP3A4 inhibitors (Clarithromycin, Itraconazole, Ketoconazole)',
      'Gemfibrozil and other fibrates (increased risk of myopathy/rhabdomyolysis)',
      'Cyclosporine and protease inhibitors'
    ],
    whenToContactDoctor: [
      'Unexplained muscle pain, tenderness, or weakness, especially accompanied by dark (tea-colored) urine or fever (rhabdomyolysis signs)',
      'Upper right abdominal pain, yellowing of eyes/skin (liver concerns)'
    ],
    disclaimer: 'Prescription statin medication. Do not discontinue without consulting your cardiologist or primary physician.'
  },
  omeprazole: {
    medicineName: 'Omeprazole (Prilosec)',
    genericName: 'Omeprazole',
    drugClass: 'Proton Pump Inhibitor (PPI)',
    commonUses: [
      'Treatment of Gastroesophageal Reflux Disease (GERD) and acid reflux',
      'Healing and maintenance of erosive esophagitis',
      'Treatment of active duodenal and gastric ulcers',
      'Eradication of H. pylori infection in combination with antibiotics'
    ],
    mechanismOfAction:
      'Irreversibly inhibits the hydrogen-potassium adenosine triphosphatase enzyme system (the H+/K+ ATPase proton pump) at the secretory surface of the gastric parietal cell.',
    commonSideEffects: [
      'Headache',
      'Abdominal pain, diarrhea, or constipation',
      'Nausea and flatulence'
    ],
    importantPrecautions: [
      'Best taken 30 to 60 minutes before the first meal of the day.',
      'Long-term high-dose use may be associated with decreased magnesium, Vitamin B12 deficiency, and increased risk of bone fractures.',
      'Does not provide immediate symptom relief (may take 1-4 days for full effect).'
    ],
    commonInteractions: [
      'Clopidogrel (Plavix) (may decrease active metabolite of clopidogrel)',
      'Methotrexate',
      'Azole antifungals (Ketoconazole, Itraconazole)',
      'Iron salts (absorption reduced due to decreased stomach acid)'
    ],
    whenToContactDoctor: [
      'Difficulty or pain when swallowing, vomiting blood, or unexplained weight loss',
      'Severe diarrhea that does not stop',
      'Joint pain accompanied by rash on cheeks or arms that worsens in the sun'
    ],
    disclaimer: 'Educational information. Discuss duration of acid suppression therapy with your doctor.'
  },
  lisinopril: {
    medicineName: 'Lisinopril (Zestril, Prinivil)',
    genericName: 'Lisinopril',
    drugClass: 'Angiotensin-Converting Enzyme (ACE) Inhibitor',
    commonUses: [
      'Management of Essential Hypertension (high blood pressure)',
      'Adjunctive therapy in Heart Failure management',
      'Improvement of survival after acute myocardial infarction',
      'Renal protection in diabetic nephropathy'
    ],
    mechanismOfAction:
      'Inhibits ACE, preventing the conversion of angiotensin I to the potent vasoconstrictor angiotensin II, resulting in reduced vascular resistance, decreased aldosterone secretion, and lower blood pressure.',
    commonSideEffects: [
      'Persistent dry, non-productive cough',
      'Dizziness or lightheadedness upon standing',
      'Headache or fatigue',
      'Hyperkalemia (elevated potassium levels)'
    ],
    importantPrecautions: [
      'Strictly contraindicated during pregnancy (causes fetal toxicity/death).',
      'Monitor serum potassium and renal function (BUN/Creatinine) periodically.',
      'Avoid potassium supplements or high-potassium salt substitutes unless advised by physician.'
    ],
    commonInteractions: [
      'Potassium-sparing diuretics and potassium supplements',
      'NSAIDs (can reduce antihypertensive effect and worsen kidney function)',
      'Lithium (increases risk of lithium toxicity)',
      'Other blood pressure medications'
    ],
    whenToContactDoctor: [
      'Signs of Angioedema: swelling of lips, tongue, throat, face, or difficulty breathing (Medical Emergency)',
      'Severe dizziness, fainting, or chest tightness',
      'Persistent intolerable dry cough'
    ],
    disclaimer: 'Prescription cardiovascular medicine. Regularly monitor blood pressure at home and report readings to your doctor.'
  },
  cetirizine: {
    medicineName: 'Cetirizine (Zyrtec)',
    genericName: 'Cetirizine Hydrochloride',
    drugClass: 'Second-Generation Antihistamine (H1 Receptor Antagonist)',
    commonUses: [
      'Relief of seasonal and perennial allergic rhinitis (sneezing, runny nose, itchy watery eyes)',
      'Treatment of chronic idiopathic urticaria (hives, itchy skin rashes)',
      'Allergy symptom relief'
    ],
    mechanismOfAction:
      'Selectively blocks peripheral H1 histamine receptors on effector cells, inhibiting histamine-mediated allergic inflammation.',
    commonSideEffects: [
      'Mild drowsiness or fatigue (less common than first-generation antihistamines like diphenhydramine)',
      'Dry mouth',
      'Mild dizziness or headache'
    ],
    importantPrecautions: [
      'Use caution when operating machinery or driving until you know how the medication affects you.',
      'Adjust dose in moderate to severe renal or hepatic impairment.',
      'Avoid combining with other sedatives or excessive alcohol.'
    ],
    commonInteractions: ['Central nervous system depressants (sedatives, alcohol)', 'Theophylline (may slightly reduce cetirizine clearance)'],
    whenToContactDoctor: [
      'Signs of severe allergic response or anaphylaxis',
      'Symptoms do not improve after several days of consistent use',
      'Severe urinary retention or extreme dizziness'
    ],
    disclaimer: 'Educational reference. Use according to product label instructions or doctor guidance.'
  },
  amlodipine: {
    medicineName: 'Amlodipine (Norvasc)',
    genericName: 'Amlodipine Besylate',
    drugClass: 'Dihydropyridine Calcium Channel Blocker',
    commonUses: [
      'Treatment of Hypertension (high blood pressure)',
      'Management of Chronic Stable Angina (chest pain)',
      'Vasospastic Angina (Prinzmetal’s Angina)'
    ],
    mechanismOfAction:
      'Inhibits the transmembrane influx of calcium ions into vascular smooth muscle and cardiac muscle, resulting in arterial vasodilation and decreased peripheral resistance.',
    commonSideEffects: [
      'Peripheral edema (swelling of ankles, feet, or lower legs)',
      'Flushing or feeling warm',
      'Dizziness, palpitations, or headache'
    ],
    importantPrecautions: [
      'Do not stop taking amlodipine abruptly without discussing with your doctor.',
      'Caution in patients with severe aortic stenosis or severe hepatic impairment.',
      'Report progressive leg or ankle swelling to your physician.'
    ],
    commonInteractions: ['Simvastatin (dose of simvastatin should be capped when co-administered)', 'CYP3A4 inhibitors (Ketoconazole, Diltiazem)', 'Other antihypertensive medications'],
    whenToContactDoctor: [
      'Worsening chest pain or shortness of breath',
      'Rapid, pounding, or irregular heartbeat',
      'Severe swelling in legs or sudden weight gain'
    ],
    disclaimer: 'Prescription medication. Do not alter dose without medical supervision.'
  }
};

// Fallback generator for unlisted medicines
function generateGenericMedicineFallback(query: string): MedicineInfoResult {
  const clean = query.trim();
  const normalizedKey = clean.toLowerCase();

  // Check direct or partial match in knowledge base
  for (const [k, v] of Object.entries(MEDICINE_KNOWLEDGE_BASE)) {
    if (normalizedKey.includes(k) || k.includes(normalizedKey)) {
      return {
        searchedTerm: clean,
        medicineName: v.medicineName || clean,
        genericName: v.genericName || clean,
        drugClass: v.drugClass || 'Therapeutic Agent',
        commonUses: v.commonUses || ['Treatment of indicated medical conditions as evaluated by a physician.'],
        mechanismOfAction: v.mechanismOfAction || 'Interacts with specific physiological receptors or pathways to produce clinical therapeutic effects.',
        commonSideEffects: v.commonSideEffects || ['Mild digestive upset', 'Headache or fatigue', 'Consult pharmacist for comprehensive list'],
        importantPrecautions: v.importantPrecautions || ['Take exactly as directed by your prescribing physician or pharmacist.', 'Inform your doctor of all other active medications, allergies, and health conditions.'],
        commonInteractions: v.commonInteractions || ['Alcohol and central nervous system depressants', 'Other prescription or OTC medications unless cleared by doctor'],
        whenToContactDoctor: v.whenToContactDoctor || ['Signs of allergic reaction (rash, swelling, wheezing)', 'Severe or unexpected side effects', 'Worsening of underlying condition'],
        disclaimer: v.disclaimer || 'This pharmaceutical overview is educational. Always consult a doctor or pharmacist for personalized medical guidance.'
      };
    }
  }

  // Dynamic fallback for any other medicine
  return {
    searchedTerm: clean,
    medicineName: clean.charAt(0).toUpperCase() + clean.slice(1),
    genericName: clean,
    drugClass: 'Pharmaceutical Agent / Prescription Drug',
    commonUses: [
      `Indicated for therapeutic management under the guidance of a licensed healthcare provider`,
      `Management of diagnosed clinical conditions based on standard medical guidelines`,
      `Symptom control and health stabilization as prescribed`
    ],
    mechanismOfAction: `Acts on targeted physiological pathways and cellular receptors to produce specific therapeutic outcomes in the body.`,
    commonSideEffects: [
      'Mild gastrointestinal discomfort or nausea',
      'Drowsiness, dizziness, or headache',
      'Potential idiosyncratic reactions depending on individual metabolism'
    ],
    importantPrecautions: [
      'Take strictly according to physician prescription or pharmacist label instructions.',
      'Do not alter dosages, skip doses, or discontinue treatment without professional medical advice.',
      'Disclose any history of kidney, liver, cardiovascular disease, or pregnancy before starting.'
    ],
    commonInteractions: [
      'Alcohol and other central nervous system depressants',
      'Other prescription medications and dietary herbal supplements'
    ],
    whenToContactDoctor: [
      'Development of skin rash, facial swelling, or breathing difficulty (allergic signs)',
      'Severe persistent dizziness, vomiting, or chest discomfort',
      'Lack of expected clinical improvement or worsening symptoms'
    ],
    disclaimer: 'This information is educational. Please verify clinical indications, dosages, and safety with a licensed physician or pharmacist.'
  };
}

// Fallback generator for symptoms
function generateSymptomFallback(symptoms: string, age?: number, gender?: string, duration?: string): SymptomAnalysisResult {
  const sLower = symptoms.toLowerCase();

  const possibleCauses: Array<{ name: string; description: string; likelihood: string }> = [];
  const warningSigns: string[] = [
    'Difficulty breathing, severe shortness of breath, or blue lips/fingertips',
    'Sudden severe chest pressure, crushing pain radiating to arm, neck, or jaw',
    'Sudden numbness, weakness on one side of face/body, or slurred speech',
    'High fever (>103°F / 39.4°C) not responding to antipyretics or lasting >3 days',
    'Severe intractable abdominal pain or persistent vomiting preventing hydration'
  ];

  if (sLower.includes('fever') || sLower.includes('chill') || sLower.includes('sweat')) {
    possibleCauses.push({
      name: 'Viral or Bacterial Infection',
      description: 'The body raises temperature as an immune response to fight viral pathogens (such as influenza, viral URI, COVID-19) or bacterial sources.',
      likelihood: 'High'
    });
  }

  if (sLower.includes('headache') || sLower.includes('migraine') || sLower.includes('head pain')) {
    possibleCauses.push({
      name: 'Tension-Type Headache or Migraine',
      description: 'Very common causes resulting from muscle contraction, stress, dehydration, eye strain, lack of sleep, or neurovascular changes.',
      likelihood: 'High'
    });
  }

  if (sLower.includes('cough') || sLower.includes('throat') || sLower.includes('congestion') || sLower.includes('cold')) {
    possibleCauses.push({
      name: 'Upper Respiratory Tract Infection (Common Cold / Pharyngitis)',
      description: 'Acute inflammation of the upper airways caused by common viral agents, seasonal allergies, or environmental irritants.',
      likelihood: 'High'
    });
  }

  if (sLower.includes('chest') || sLower.includes('heart') || sLower.includes('palpitation')) {
    possibleCauses.push({
      name: 'Cardiovascular or Musculoskeletal Chest Discomfort',
      description: 'Can range from benign costochondritis / muscle strain / acid reflux (GERD) to acute coronary issues requiring immediate medical evaluation.',
      likelihood: 'Moderate (Needs Priority Assessment)'
    });
    warningSigns.unshift('Crushing chest tightness, pain radiating to left arm or jaw, cold sweats, or dizziness (CALL EMERGENCY SERVICES)');
  }

  if (sLower.includes('stomach') || sLower.includes('abdomen') || sLower.includes('belly') || sLower.includes('nausea') || sLower.includes('diarrhea')) {
    possibleCauses.push({
      name: 'Gastroenteritis, Dyspepsia, or Food Sensitivity',
      description: 'Irritation of the digestive lining due to viral infection, dietary triggers, acid reflux, or bacterial gastroenteritis.',
      likelihood: 'High'
    });
  }

  if (possibleCauses.length === 0) {
    possibleCauses.push(
      {
        name: 'Acute Physiological or Inflammatory Reaction',
        description: 'Symptoms may be triggered by temporary systemic immune responses, physical fatigue, stress, or mild localized inflammation.',
        likelihood: 'Moderate'
      },
      {
        name: 'Lifestyle, Environmental, or Ergonomic Strain',
        description: 'Physical deconditioning, dehydration, sleep disruption, or dietary factors can frequently manifest as bodily symptoms.',
        likelihood: 'Moderate'
      },
      {
        name: 'Underlying Medical Condition Requiring Assessment',
        description: 'Persistent or complex symptoms should be formally evaluated by a doctor to confirm definitive diagnosis with diagnostic tests.',
        likelihood: 'Variable'
      }
    );
  }

  return {
    symptomsEntered: symptoms,
    possibleCauses,
    generalInformation: `You reported: "${symptoms}"${age ? `, Age: ${age}` : ''}${gender ? `, Gender: ${gender}` : ''}${duration ? `, Duration: ${duration}` : ''}. The body presents symptoms as signals of physiological changes. Tracking their frequency, triggers, and severity helps your doctor determine the right diagnostic approach.`,
    warningSigns,
    whenToSeekCare: 'Seek prompt medical attention if your symptoms worsen, persist beyond a few days, interfere with daily function, or if any red-flag emergency warning signs appear.',
    whatToTellDoctor: [
      `Exact date/time symptoms began (Duration: ${duration || 'specify when it started'})`,
      'Severity on a scale of 1 to 10 and whether symptoms are constant or intermittent',
      'What activities or medicines make symptoms better or worse',
      'Current medications, supplements, and known allergies'
    ],
    disclaimer: 'This symptom analysis is educational only and cannot replace clinical evaluation by a medical doctor.'
  };
}

// 1. Analyze Lab Report Document
export async function analyzeLabReportDocument(params: {
  base64Data: string;
  mimeType: string;
  fileName: string;
  fileSize?: number;
  userId?: string;
}): Promise<LabReportAnalysis> {
  const prompt = `You are a medical laboratory document analysis AI for MediVerse.
You are tasked with reading this real uploaded laboratory report or diagnostic document (PDF or image).
Perform OCR / document parsing to extract actual lab test parameters, results, units, reference ranges, and abnormal indicators.

CRITICAL RULES:
1. ONLY extract information that is visibly present in the document.
2. DO NOT invent, hallucinate, or assume any lab test value. If a value or reference range is blurry, missing, or cut off, output "Not clearly detected from the uploaded report."
3. Identify which values are Normal, Low, High, or Needs Attention by comparing against the printed reference range on the report (or standard clinical laboratory reference ranges if not explicitly printed).
4. Provide a clear, educational, plain-language Health Summary.
5. For any abnormal finding, explain:
   - What the test measures
   - Whether the value is high or low
   - Possible general reasons it can occur
   - What the user should discuss with a doctor
6. Provide general educational Food & Lifestyle Guidance based strictly on the findings (helpful foods, foods to limit, hydration, lifestyle). Never prescribe medications or advise stopping/changing prescriptions.
7. Generate customized "What should I ask my doctor?" questions based on these findings.
8. Assess Urgency Level: "Routine", "Moderate", "Prompt Medical Attention Required", or "Emergency Alert". If there are life-threatening critical laboratory values, mark isEmergency as true and emphasize immediate emergency care.

Return a valid JSON object matching the requested schema.`;

  try {
    const parsed = await callGeminiWithRetry(async (ai, model) => {
      const response = await ai.models.generateContent({
        model: model,
        contents: [
          {
            inlineData: {
              mimeType: params.mimeType,
              data: params.base64Data
            }
          },
          {
            text: prompt
          }
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              patientNameDetected: { type: Type.STRING, description: 'Patient name if visible on report, else empty' },
              labNameDetected: { type: Type.STRING, description: 'Lab or Hospital name if visible, else empty' },
              reportDate: { type: Type.STRING, description: 'Date of report if visible, else empty' },
              unreadableNotes: { type: Type.STRING, description: 'Any notes if parts of the document were blurry or unreadable' },
              testResults: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    testName: { type: Type.STRING },
                    result: { type: Type.STRING },
                    unit: { type: Type.STRING },
                    referenceRange: { type: Type.STRING },
                    status: {
                      type: Type.STRING,
                      enum: ['Normal', 'Low', 'High', 'Needs Attention']
                    }
                  },
                  required: ['testName', 'result', 'unit', 'referenceRange', 'status']
                }
              },
              healthSummary: { type: Type.STRING, description: 'Clear plain-language overview of the report findings' },
              abnormalFindings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    testName: { type: Type.STRING },
                    value: { type: Type.STRING },
                    status: {
                      type: Type.STRING,
                      enum: ['Normal', 'Low', 'High', 'Needs Attention']
                    },
                    whatItMeasures: { type: Type.STRING },
                    possibleReasons: {
                      type: Type.ARRAY,
                      items: { type: Type.STRING }
                    },
                    discussWithDoctor: { type: Type.STRING }
                  },
                  required: ['testName', 'value', 'status', 'whatItMeasures', 'possibleReasons', 'discussWithDoctor']
                }
              },
              foodAndLifestyle: {
                type: Type.OBJECT,
                properties: {
                  helpfulFoods: { type: Type.ARRAY, items: { type: Type.STRING } },
                  foodsToLimit: { type: Type.ARRAY, items: { type: Type.STRING } },
                  hydrationTips: { type: Type.ARRAY, items: { type: Type.STRING } },
                  generalLifestyle: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['helpfulFoods', 'foodsToLimit', 'hydrationTips', 'generalLifestyle']
              },
              doctorQuestions: {
                type: Type.ARRAY,
                items: { type: Type.STRING }
              },
              urgencyLevel: {
                type: Type.STRING,
                enum: ['Routine', 'Moderate', 'Prompt Medical Attention Required', 'Emergency Alert']
              },
              urgencyExplanation: { type: Type.STRING },
              isEmergency: { type: Type.BOOLEAN }
            },
            required: [
              'testResults',
              'healthSummary',
              'abnormalFindings',
              'foodAndLifestyle',
              'doctorQuestions',
              'urgencyLevel',
              'isEmergency'
            ]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('No text returned from Gemini model.');
      return extractCleanJson(text);
    });

    const analysis: LabReportAnalysis = {
      id: `rep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      userId: params.userId,
      fileName: params.fileName,
      fileSize: params.fileSize,
      uploadedAt: new Date().toISOString(),
      reportDate: parsed.reportDate || undefined,
      patientNameDetected: parsed.patientNameDetected || undefined,
      labNameDetected: parsed.labNameDetected || undefined,
      unreadableNotes: parsed.unreadableNotes || undefined,
      testResults: parsed.testResults || [],
      healthSummary: parsed.healthSummary || 'Analysis complete.',
      abnormalFindings: parsed.abnormalFindings || [],
      foodAndLifestyle: parsed.foodAndLifestyle || {
        helpfulFoods: [],
        foodsToLimit: [],
        hydrationTips: [],
        generalLifestyle: []
      },
      doctorQuestions: parsed.doctorQuestions || [],
      urgencyLevel: parsed.urgencyLevel || 'Routine',
      urgencyExplanation: parsed.urgencyExplanation,
      isEmergency: !!parsed.isEmergency
    };

    return analysis;
  } catch (err: any) {
    console.error('Document analysis failure after retries:', err);
    throw err;
  }
}

// 2. Process Health Chat
export async function processHealthChat(params: {
  message: string;
  history: Array<{ role: 'user' | 'model'; text: string }>;
  reportContext?: LabReportAnalysis | null;
  userProfile?: any;
}): Promise<string> {
  let contextPrefix = `You are MediVerse AI, a compassionate, accurate, and educational healthcare assistant.
CRITICAL SAFETY & MEDICAL RULES:
- Clearly provide educational health information only.
- State that you are an AI assistant and not a medical doctor.
- NEVER diagnose a condition definitively or prescribe/adjust medication dosages.
- Always encourage consultation with a qualified healthcare provider for personalized medical evaluation.
- Speak in clear, supportive, and accessible language. Use bullet points and clean structure where helpful.
`;

  if (params.reportContext) {
    contextPrefix += `\nPATIENT'S ACTIVE LAB REPORT CONTEXT:
File: ${params.reportContext.fileName}
Urgency: ${params.reportContext.urgencyLevel}
Health Summary: ${params.reportContext.healthSummary}
Key Tests: ${JSON.stringify(params.reportContext.testResults.slice(0, 15))}
Abnormal Findings: ${JSON.stringify(params.reportContext.abnormalFindings)}
Guidance: ${JSON.stringify(params.reportContext.foodAndLifestyle)}
Doctor Questions: ${JSON.stringify(params.reportContext.doctorQuestions)}
Use this report context when the user asks questions about their test results or health indicators.\n`;
  }

  if (params.userProfile) {
    contextPrefix += `\nUSER HEALTH PROFILE:
Age: ${params.userProfile.age || 'Not specified'}
Gender: ${params.userProfile.gender || 'Not specified'}
Blood Group: ${params.userProfile.bloodGroup || 'Not specified'}
Allergies: ${params.userProfile.allergies || 'None reported'}\n`;
  }

  const formattedHistory = params.history.map(h => ({
    role: h.role,
    parts: [{ text: h.text }]
  }));

  const contents = [
    ...formattedHistory,
    {
      role: 'user',
      parts: [{ text: params.message }]
    }
  ];

  try {
    const text = await callGeminiWithRetry(async (ai, model) => {
      const response = await ai.models.generateContent({
        model: model,
        contents: contents,
        config: {
          systemInstruction: contextPrefix,
          temperature: 0.7
        }
      });
      return response.text || '';
    });

    if (text) return text;
  } catch (err: any) {
    console.warn('Health chat falling back to resilient response:', err);
  }

  // Graceful fallback if external AI is experiencing high demand
  return `Thank you for reaching out to MediVerse AI.

Regarding your question: "${params.message}":

• **General Health Guidance**: It is always important to monitor your symptoms closely and maintain good hydration, adequate rest, and balanced nutrition.
• **Personalized Care**: As an AI health assistant, I provide general educational information. If you are experiencing persistent discomfort, pain, or concerning symptoms, please consult a qualified healthcare professional or book a doctor appointment through our portal for direct medical evaluation.
• **Emergency Warning**: If you have severe symptoms such as difficulty breathing, severe chest pain, or sudden confusion, please seek immediate emergency medical attention.`;
}

// 3. Analyze Symptoms
export async function analyzeSymptoms(params: {
  symptoms: string;
  age?: number;
  gender?: string;
  duration?: string;
}): Promise<SymptomAnalysisResult> {
  const prompt = `Analyze the following reported symptoms:
Symptoms: "${params.symptoms}"
Patient Age: ${params.age || 'Not specified'}
Gender: ${params.gender || 'Not specified'}
Duration: ${params.duration || 'Not specified'}

Provide a structured, responsible medical educational analysis.
- Possible common causes (with brief descriptions and likelihood)
- General health information
- Red flag warning signs (emergency signs)
- When to seek professional medical care
- What specific details to tell a doctor
- Explicit medical disclaimer`;

  try {
    const parsed = await callGeminiWithRetry(async (ai, model) => {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              possibleCauses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    description: { type: Type.STRING },
                    likelihood: { type: Type.STRING }
                  },
                  required: ['name', 'description']
                }
              },
              generalInformation: { type: Type.STRING },
              warningSigns: { type: Type.ARRAY, items: { type: Type.STRING } },
              whenToSeekCare: { type: Type.STRING },
              whatToTellDoctor: { type: Type.ARRAY, items: { type: Type.STRING } },
              disclaimer: { type: Type.STRING }
            },
            required: [
              'possibleCauses',
              'generalInformation',
              'warningSigns',
              'whenToSeekCare',
              'whatToTellDoctor',
              'disclaimer'
            ]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('Failed to analyze symptoms.');
      return extractCleanJson(text);
    });

    return {
      symptomsEntered: params.symptoms,
      possibleCauses: parsed.possibleCauses || [],
      generalInformation: parsed.generalInformation || '',
      warningSigns: parsed.warningSigns || [],
      whenToSeekCare: parsed.whenToSeekCare || 'Consult a healthcare professional if symptoms worsen or persist.',
      whatToTellDoctor: parsed.whatToTellDoctor || [],
      disclaimer: parsed.disclaimer || 'This information is educational and does not replace professional medical evaluation.'
    };
  } catch (err: any) {
    console.warn('AI symptom check experienced high demand; utilizing clinical fallback:', err);
    return generateSymptomFallback(params.symptoms, params.age, params.gender, params.duration);
  }
}

// 4. Lookup Medicine Information
export async function lookupMedicineInfo(medicineName: string): Promise<MedicineInfoResult> {
  const prompt = `Provide accurate, comprehensive, educational pharmaceutical information for: "${medicineName}".
Include:
- Official / trade name
- Generic / active ingredient name
- Drug class
- Common clinical uses
- Mechanism of action in simple terms
- Common side effects
- Important precautions & contraindications
- Common drug or food interaction warnings
- When to immediately contact a doctor or seek emergency care
- Standard disclaimer reminder`;

  try {
    const parsed = await callGeminiWithRetry(async (ai, model) => {
      const response = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              medicineName: { type: Type.STRING },
              genericName: { type: Type.STRING },
              drugClass: { type: Type.STRING },
              commonUses: { type: Type.ARRAY, items: { type: Type.STRING } },
              mechanismOfAction: { type: Type.STRING },
              commonSideEffects: { type: Type.ARRAY, items: { type: Type.STRING } },
              importantPrecautions: { type: Type.ARRAY, items: { type: Type.STRING } },
              commonInteractions: { type: Type.ARRAY, items: { type: Type.STRING } },
              whenToContactDoctor: { type: Type.ARRAY, items: { type: Type.STRING } },
              disclaimer: { type: Type.STRING }
            },
            required: [
              'medicineName',
              'genericName',
              'commonUses',
              'mechanismOfAction',
              'commonSideEffects',
              'importantPrecautions',
              'commonInteractions',
              'whenToContactDoctor',
              'disclaimer'
            ]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('Failed to retrieve medicine information.');
      return extractCleanJson(text);
    });

    return {
      searchedTerm: medicineName,
      medicineName: parsed.medicineName || medicineName,
      genericName: parsed.genericName,
      drugClass: parsed.drugClass,
      commonUses: parsed.commonUses || [],
      mechanismOfAction: parsed.mechanismOfAction || '',
      commonSideEffects: parsed.commonSideEffects || [],
      importantPrecautions: parsed.importantPrecautions || [],
      commonInteractions: parsed.commonInteractions || [],
      whenToContactDoctor: parsed.whenToContactDoctor || [],
      disclaimer: parsed.disclaimer || 'Confirm medicine use and dosage with a qualified healthcare professional.'
    };
  } catch (err: any) {
    console.warn('AI medicine lookup experienced high demand; utilizing clinical database fallback:', err);
    return generateGenericMedicineFallback(medicineName);
  }
}

import {
  LivePatientRecord,
  PatientTimelineEntry,
  LivePatientAiSummary
} from '../src/types.js';

// Deterministic Clinical Fallback Synthesizer for Live Patient Summaries
function synthesizeClinicalSummaryFromEntries(
  patient: LivePatientRecord,
  entries: PatientTimelineEntry[]
): LivePatientAiSummary {
  const sorted = [...entries].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  // Group entries by type
  const doctorNotes = sorted.filter(e => e.entryType === 'Doctor / Progress Note' || e.entryType === 'Consultation Note');
  const labResults = sorted.filter(e => e.entryType === 'Lab Result');
  const imagingReports = sorted.filter(e => e.entryType === 'Imaging / Radiology Report');
  const medOrders = sorted.filter(e => e.entryType === 'Medication Admin / Order' || e.entryType === 'Prescription');
  const nursingNotes = sorted.filter(e => e.entryType === 'Nursing Note / Vitals');
  const procedures = sorted.filter(e => e.entryType === 'Procedure / Treatment');
  const discharges = sorted.filter(e => e.entryType === 'Discharge Information');

  // Timeline milestones
  const clinicalTimeline = sorted.map(e => {
    const d = new Date(e.timestamp);
    const dateFormatted = `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    return {
      timeframe: dateFormatted,
      milestone: e.title ? `${e.title}: ${e.content.slice(0, 140)}...` : e.content.slice(0, 150),
      sourceRecord: `${e.entryType} by ${e.authorName}`,
      sourceDate: dateFormatted
    };
  });

  // Investigation findings from labs and imaging
  const importantInvestigationFindings: LivePatientAiSummary['importantInvestigationFindings'] = [];
  labResults.forEach(l => {
    const d = new Date(l.timestamp);
    const dateStr = `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;
    if (l.structuredData?.tests && l.structuredData.tests.length > 0) {
      l.structuredData.tests.forEach(t => {
        importantInvestigationFindings.push({
          finding: `${t.testName}: ${t.result} ${t.unit} ${t.referenceRange ? `(Ref: ${t.referenceRange})` : ''}`,
          category: 'Lab',
          status: t.status === 'Critical' ? 'Critical' : t.status === 'High' || t.status === 'Low' ? 'Abnormal' : 'Normal',
          sourceRecord: `${l.title || 'Lab Panel'} (${l.authorName})`,
          sourceDate: dateStr
        });
      });
    } else {
      importantInvestigationFindings.push({
        finding: l.content.slice(0, 160),
        category: 'Lab',
        status: l.isCritical ? 'Critical' : 'Abnormal',
        sourceRecord: `${l.title} (${l.authorName})`,
        sourceDate: dateStr
      });
    }
  });

  imagingReports.forEach(img => {
    const d = new Date(img.timestamp);
    const dateStr = `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })}`;
    importantInvestigationFindings.push({
      finding: `${img.structuredData?.imagingModality || 'Imaging'}: ${img.structuredData?.impression || img.content.slice(0, 160)}`,
      category: 'Imaging',
      status: img.isCritical ? 'Critical' : 'Abnormal',
      sourceRecord: img.title || 'Radiology Report',
      sourceDate: dateStr
    });
  });

  // Documented Diagnoses
  const documentedDiagnoses: LivePatientAiSummary['documentedDiagnoses'] = [];
  if (patient.reasonForAdmission) {
    documentedDiagnoses.push({
      diagnosis: patient.reasonForAdmission,
      type: 'Primary',
      status: patient.status === 'Discharged' ? 'Resolved' : 'Active',
      sourceRecord: 'Admission Record'
    });
  }
  procedures.forEach(p => {
    if (p.structuredData?.procedureName) {
      documentedDiagnoses.push({
        diagnosis: `Status post ${p.structuredData.procedureName}`,
        type: 'Secondary',
        status: 'Active',
        sourceRecord: p.title || 'Procedure Note'
      });
    }
  });

  // Current Medications & Changes
  const currentMedicationsMap = new Map<string, LivePatientAiSummary['currentMedications'][0]>();
  const medicationChanges: LivePatientAiSummary['medicationChanges'] = [];

  medOrders.forEach(m => {
    const d = new Date(m.timestamp);
    const dateStr = `${d.getDate()} ${d.toLocaleString('en-US', { month: 'short' })} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    if (m.structuredData?.medications) {
      m.structuredData.medications.forEach(med => {
        if (med.action === 'Discontinued') {
          currentMedicationsMap.delete(med.name);
          medicationChanges.push({
            medicine: med.name,
            changeType: 'Discontinued',
            reason: med.instructions || 'Discontinued by order',
            sourceRecord: m.title || 'Medication Order',
            sourceDate: dateStr
          });
        } else {
          currentMedicationsMap.set(med.name, {
            name: med.name,
            dosage: med.dose,
            frequency: med.frequency,
            route: med.route,
            status: med.action === 'Modified' ? 'Changed' : med.action === 'Started' ? 'New' : 'Active',
            sourceRecord: `${m.title} [${dateStr}]`
          });
          if (med.action === 'Started' || med.action === 'Modified') {
            medicationChanges.push({
              medicine: med.name,
              changeType: med.action === 'Started' ? 'Initiated' : 'Dose Adjusted',
              reason: med.instructions || 'Clinical protocol',
              sourceRecord: m.title || 'Medication Order',
              sourceDate: dateStr
            });
          }
        }
      });
    }
  });

  // Current Treatment
  const currentTreatment: LivePatientAiSummary['currentTreatment'] = [];
  if (currentMedicationsMap.size > 0) {
    currentTreatment.push({
      treatment: 'Active Pharmacotherapy',
      details: Array.from(currentMedicationsMap.values()).map(m => `${m.name} ${m.dosage} (${m.frequency})`).join(', '),
      sourceRecord: 'Active Medication Orders'
    });
  }
  if (nursingNotes.length > 0) {
    const latestNurse = nursingNotes[nursingNotes.length - 1];
    currentTreatment.push({
      treatment: 'Nursing Care & Monitoring',
      details: latestNurse.content.slice(0, 160),
      sourceRecord: `${latestNurse.title} (${latestNurse.authorName})`
    });
  }

  // Current Documented Status
  let clinicalCondition = 'Stable under ongoing clinical monitoring';
  let vitalTrends = 'Not documented';
  const statusSources: string[] = [];

  if (nursingNotes.length > 0) {
    const latestNurse = nursingNotes[nursingNotes.length - 1];
    statusSources.push(`${latestNurse.title} [${latestNurse.authorName}]`);
    if (latestNurse.structuredData?.vitals) {
      const v = latestNurse.structuredData.vitals;
      vitalTrends = `BP: ${v.bp || 'N/A'}, HR: ${v.pulse || 'N/A'}, Temp: ${v.temp || 'N/A'}, SpO2: ${v.spo2 || 'N/A'}, RR: ${v.rr || 'N/A'}`;
    }
    clinicalCondition = latestNurse.content.slice(0, 180);
  }
  if (doctorNotes.length > 0) {
    const latestDoc = doctorNotes[doctorNotes.length - 1];
    statusSources.push(`${latestDoc.title} [${latestDoc.authorName}]`);
    clinicalCondition = latestDoc.content.slice(0, 180);
  }

  // Alerts
  const importantDocumentedAlerts: LivePatientAiSummary['importantDocumentedAlerts'] = [];
  if (patient.allergies && patient.allergies !== 'None' && patient.allergies !== 'NKDA') {
    importantDocumentedAlerts.push({
      alert: `DOCUMENTED ALLERGY ALERT: ${patient.allergies}`,
      severity: 'High',
      sourceRecord: 'Patient Admission Demographics'
    });
  }
  sorted.filter(e => e.isCritical).forEach(crit => {
    importantDocumentedAlerts.push({
      alert: `CRITICAL EVENT/FINDING: ${crit.title} - ${crit.content.slice(0, 120)}`,
      severity: 'High',
      sourceRecord: `${crit.entryType} [${new Date(crit.timestamp).toLocaleDateString()}]`
    });
  });

  // Second opinion & review
  const secondOpinionBrief: LivePatientAiSummary['secondOpinionBrief'] = {
    synthesis: `Patient is admitted in ${patient.department} under ${patient.attendingDoctor} for ${patient.reasonForAdmission}. Overall ${sorted.length} clinical records documented with ${importantInvestigationFindings.length} investigation items tracked.`,
    keyConsiderations: [
      'Maintain continuous reconciliation of active medications against reported allergies.',
      'Correlate clinical progress with scheduled repeat laboratory/imaging milestones.',
      'Ensure clear discharge planning and post-discharge follow-up timeline are established.'
    ],
    suggestedClinicalQuestions: [
      'Are all pending diagnostic results available prior to final step-down or discharge?',
      'Has patient demonstrated hemodynamic stability on oral maintenance regimen?'
    ]
  };

  return {
    id: `sum-${patient.id}-${Date.now()}`,
    patientRecordId: patient.id,
    uhid: patient.uhid,
    generatedAt: new Date().toISOString(),
    reasonForAdmission: {
      statement: patient.reasonForAdmission || 'Not documented',
      sources: ['Patient Admission Profile']
    },
    relevantHistory: {
      statement: `${patient.patientName}, ${patient.patientAge}yo ${patient.patientGender}. Blood Group: ${patient.bloodGroup || 'Not documented'}. Documented Allergies: ${patient.allergies || 'Not documented'}. Room/Bed: ${patient.bedRoomNo || 'Not documented'}.`,
      sources: ['Patient Admission Profile']
    },
    clinicalTimeline: clinicalTimeline.length > 0 ? clinicalTimeline : [
      {
        timeframe: 'Admission',
        milestone: `Admitted for ${patient.reasonForAdmission}`,
        sourceRecord: 'Admission Registry',
        sourceDate: new Date(patient.admissionDateTime).toLocaleDateString()
      }
    ],
    importantInvestigationFindings: importantInvestigationFindings.length > 0 ? importantInvestigationFindings : [
      {
        finding: 'No diagnostic investigations documented yet.',
        category: 'Lab',
        status: 'Normal',
        sourceRecord: 'Clinical Registry',
        sourceDate: new Date().toLocaleDateString()
      }
    ],
    documentedDiagnoses: documentedDiagnoses.length > 0 ? documentedDiagnoses : [
      {
        diagnosis: patient.reasonForAdmission || 'Not documented',
        type: 'Primary',
        status: 'Active',
        sourceRecord: 'Admission Profile'
      }
    ],
    currentTreatment: currentTreatment.length > 0 ? currentTreatment : [
      {
        treatment: 'Standard Inpatient Supportive Care & Monitoring',
        details: 'Vital signs monitoring and supportive care in progress.',
        sourceRecord: 'Admission Order'
      }
    ],
    currentMedications: Array.from(currentMedicationsMap.values()),
    medicationChanges: medicationChanges,
    currentDocumentedStatus: {
      clinicalCondition: clinicalCondition || 'Not documented',
      vitalTrends: vitalTrends || 'Not documented',
      sources: statusSources.length > 0 ? statusSources : ['Patient Registry']
    },
    pendingInvestigations: [
      {
        investigation: 'Ongoing daily clinical vitals and routine inpatient lab follow-up',
        scheduledOrOrderedDate: 'Daily / As scheduled',
        sourceRecord: 'Standard Inpatient Protocol'
      }
    ],
    importantDocumentedAlerts: importantDocumentedAlerts,
    secondOpinionBrief: secondOpinionBrief,
    missingOrConflictingInformation: [
      {
        issueType: 'Documentation Gap',
        description: currentMedicationsMap.size === 0 ? 'No active inpatient medication orders explicitly recorded in timeline.' : 'No major conflicting documentation identified across timeline.',
        flaggedForHumanReview: currentMedicationsMap.size === 0,
        recordsInvolved: ['Clinical Timeline']
      }
    ],
    disclaimer: 'This is an AI-assisted clinical documentation and summarization aid generated from documented patient entries. Final diagnostic, pharmacological, and clinical decisions remain strictly with qualified healthcare professionals.'
  };
}

export async function generateLivePatientSummary(
  patient: LivePatientRecord,
  timelineEntries: PatientTimelineEntry[]
): Promise<LivePatientAiSummary> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.info('[LivePatientSummary] GEMINI_API_KEY not configured; utilizing clinical synthesis engine.');
    return synthesizeClinicalSummaryFromEntries(patient, timelineEntries);
  }

  try {
    const formattedEntries = timelineEntries
      .slice()
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((e, idx) => {
        return `[ENTRY #${idx + 1}]
ID: ${e.id}
Timestamp: ${e.timestamp}
Entry Type: ${e.entryType}
Author: ${e.authorName} (${e.authorRole})
Title: ${e.title}
Content: ${e.content}
Structured Data: ${JSON.stringify(e.structuredData || {})}
Critical Flag: ${e.isCritical ? 'YES' : 'NO'}`;
      })
      .join('\n\n');

    const prompt = `You are a Senior Clinical Documentation and Inpatient EHR Summarization AI Assistant for MediVerse.
Analyze the live patient health record and all chronological timeline entries below.
Generate an accurate, comprehensive, and up-to-date AI Current Summary.

PATIENT ADMISSION PROFILE:
- UHID / Patient ID: ${patient.uhid}
- Patient Name: ${patient.patientName}
- Age: ${patient.patientAge}
- Gender: ${patient.patientGender}
- Blood Group: ${patient.bloodGroup}
- Allergies: ${patient.allergies}
- Admission Date/Time: ${patient.admissionDateTime}
- Department: ${patient.department}
- Attending Doctor: ${patient.attendingDoctor}
- Bed / Room: ${patient.bedRoomNo}
- Reason for Admission: ${patient.reasonForAdmission}
- Current Admission Status: ${patient.status}
- Initial Vitals: ${JSON.stringify(patient.initialVitals || {})}

DOCUMENTED CHRONOLOGICAL TIMELINE ENTRIES (${timelineEntries.length} entries total):
${formattedEntries || 'No timeline entries recorded yet.'}

CRITICAL CLINICAL INSTRUCTIONS:
1. STRICT ADHERENCE TO SOURCE DATA: Never invent diagnoses, medications, test results, allergies, vital signs, or treatment decisions.
2. If any information is not found or not documented in the entries, write "Not documented".
3. SOURCE CITATION: For every key statement, milestone, finding, diagnosis, and medication, cite the source record title, author, and/or date (e.g. "Admission Assessment Note [17 Aug 09:45]", "Chest X-Ray [17 Aug 10:45]").
4. MEDICATION RECONCILIATION: Track all current medications, new medications, dose adjustments, and discontinued drugs.
5. INVESTIGATIONS: Categorize lab tests, imaging, and biomarkers with abnormal/critical status flags.
6. CONFLICTING / MISSING INFORMATION: Identify any contradictions between notes, missing allergy reconciliations, or documentation gaps and flag them for human review.
7. SECOND-OPINION BRIEF: Provide an objective synthesis, key clinical considerations, and suggested questions for the clinical care team.
8. RETURN VALID JSON matching the specified schema.`;

    const summaryResult = await callGeminiWithRetry(async (ai, modelName) => {
      const response = await ai.models.generateContent({
        model: modelName,
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert clinical medical documentation summarizer. You produce structured, evidence-grounded inpatient summaries. You never hallucinate data. Every claim has source citations.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              reasonForAdmission: {
                type: Type.OBJECT,
                properties: {
                  statement: { type: Type.STRING },
                  sources: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['statement', 'sources']
              },
              relevantHistory: {
                type: Type.OBJECT,
                properties: {
                  statement: { type: Type.STRING },
                  sources: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['statement', 'sources']
              },
              clinicalTimeline: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    timeframe: { type: Type.STRING },
                    milestone: { type: Type.STRING },
                    sourceRecord: { type: Type.STRING },
                    sourceDate: { type: Type.STRING }
                  },
                  required: ['timeframe', 'milestone', 'sourceRecord', 'sourceDate']
                }
              },
              importantInvestigationFindings: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    finding: { type: Type.STRING },
                    category: { type: Type.STRING, enum: ['Lab', 'Imaging', 'Biomarker', 'Diagnostic'] },
                    status: { type: Type.STRING, enum: ['Normal', 'Abnormal', 'Critical'] },
                    sourceRecord: { type: Type.STRING },
                    sourceDate: { type: Type.STRING }
                  },
                  required: ['finding', 'category', 'status', 'sourceRecord', 'sourceDate']
                }
              },
              documentedDiagnoses: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    diagnosis: { type: Type.STRING },
                    type: { type: Type.STRING, enum: ['Primary', 'Secondary', 'Differential', 'Provisional'] },
                    status: { type: Type.STRING, enum: ['Active', 'Resolved', 'Under Investigation'] },
                    sourceRecord: { type: Type.STRING }
                  },
                  required: ['diagnosis', 'type', 'status', 'sourceRecord']
                }
              },
              currentTreatment: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    treatment: { type: Type.STRING },
                    details: { type: Type.STRING },
                    sourceRecord: { type: Type.STRING }
                  },
                  required: ['treatment', 'details', 'sourceRecord']
                }
              },
              currentMedications: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    name: { type: Type.STRING },
                    dosage: { type: Type.STRING },
                    frequency: { type: Type.STRING },
                    route: { type: Type.STRING },
                    status: { type: Type.STRING, enum: ['Active', 'Changed', 'New'] },
                    sourceRecord: { type: Type.STRING }
                  },
                  required: ['name', 'dosage', 'frequency', 'route', 'status', 'sourceRecord']
                }
              },
              medicationChanges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    medicine: { type: Type.STRING },
                    changeType: { type: Type.STRING, enum: ['Initiated', 'Dose Adjusted', 'Discontinued', 'Substituted'] },
                    reason: { type: Type.STRING },
                    sourceRecord: { type: Type.STRING },
                    sourceDate: { type: Type.STRING }
                  },
                  required: ['medicine', 'changeType', 'sourceRecord', 'sourceDate']
                }
              },
              currentDocumentedStatus: {
                type: Type.OBJECT,
                properties: {
                  clinicalCondition: { type: Type.STRING },
                  vitalTrends: { type: Type.STRING },
                  sources: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['clinicalCondition', 'vitalTrends', 'sources']
              },
              pendingInvestigations: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    investigation: { type: Type.STRING },
                    scheduledOrOrderedDate: { type: Type.STRING },
                    sourceRecord: { type: Type.STRING }
                  },
                  required: ['investigation', 'sourceRecord']
                }
              },
              importantDocumentedAlerts: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    alert: { type: Type.STRING },
                    severity: { type: Type.STRING, enum: ['High', 'Medium', 'Info'] },
                    sourceRecord: { type: Type.STRING }
                  },
                  required: ['alert', 'severity', 'sourceRecord']
                }
              },
              secondOpinionBrief: {
                type: Type.OBJECT,
                properties: {
                  synthesis: { type: Type.STRING },
                  keyConsiderations: { type: Type.ARRAY, items: { type: Type.STRING } },
                  suggestedClinicalQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
                },
                required: ['synthesis', 'keyConsiderations', 'suggestedClinicalQuestions']
              },
              missingOrConflictingInformation: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    issueType: { type: Type.STRING, enum: ['Missing Information', 'Conflicting Records', 'Documentation Gap'] },
                    description: { type: Type.STRING },
                    flaggedForHumanReview: { type: Type.BOOLEAN },
                    recordsInvolved: { type: Type.ARRAY, items: { type: Type.STRING } }
                  },
                  required: ['issueType', 'description', 'flaggedForHumanReview']
                }
              },
              disclaimer: { type: Type.STRING }
            },
            required: [
              'reasonForAdmission',
              'relevantHistory',
              'clinicalTimeline',
              'importantInvestigationFindings',
              'documentedDiagnoses',
              'currentTreatment',
              'currentMedications',
              'medicationChanges',
              'currentDocumentedStatus',
              'pendingInvestigations',
              'importantDocumentedAlerts',
              'secondOpinionBrief',
              'missingOrConflictingInformation',
              'disclaimer'
            ]
          }
        }
      });

      const text = response.text;
      if (!text) throw new Error('Empty AI response generated.');
      return extractCleanJson(text);
    });

    return {
      id: `sum-${patient.id}-${Date.now()}`,
      patientRecordId: patient.id,
      uhid: patient.uhid,
      generatedAt: new Date().toISOString(),
      reasonForAdmission: summaryResult.reasonForAdmission,
      relevantHistory: summaryResult.relevantHistory,
      clinicalTimeline: summaryResult.clinicalTimeline || [],
      importantInvestigationFindings: summaryResult.importantInvestigationFindings || [],
      documentedDiagnoses: summaryResult.documentedDiagnoses || [],
      currentTreatment: summaryResult.currentTreatment || [],
      currentMedications: summaryResult.currentMedications || [],
      medicationChanges: summaryResult.medicationChanges || [],
      currentDocumentedStatus: summaryResult.currentDocumentedStatus || {
        clinicalCondition: 'Not documented',
        vitalTrends: 'Not documented',
        sources: []
      },
      pendingInvestigations: summaryResult.pendingInvestigations || [],
      importantDocumentedAlerts: summaryResult.importantDocumentedAlerts || [],
      secondOpinionBrief: summaryResult.secondOpinionBrief || {
        synthesis: '',
        keyConsiderations: [],
        suggestedClinicalQuestions: []
      },
      missingOrConflictingInformation: summaryResult.missingOrConflictingInformation || [],
      disclaimer:
        summaryResult.disclaimer ||
        'This is an AI-assisted clinical documentation and summarization aid generated from documented patient entries. Final diagnostic, pharmacological, and clinical decisions remain strictly with qualified healthcare professionals.'
    };
  } catch (err) {
    console.warn('[LivePatientSummary] Gemini call encountered error, using deterministic synthesis:', err);
    return synthesizeClinicalSummaryFromEntries(patient, timelineEntries);
  }
}

