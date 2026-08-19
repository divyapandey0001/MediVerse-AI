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
