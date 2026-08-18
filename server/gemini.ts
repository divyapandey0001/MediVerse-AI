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

export async function analyzeLabReportDocument(params: {
  base64Data: string;
  mimeType: string;
  fileName: string;
  fileSize?: number;
  userId?: string;
}): Promise<LabReportAnalysis> {
  const ai = getGeminiClient();

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
8. Assess Urgency Level: "Routine", "Moderate", "Prompt Medical Attention Required", or "Emergency Alert". If there are life-threatening critical laboratory values (e.g. critically high potassium, severe acute markers, critically low platelets/glucose), mark isEmergency as true and emphasize immediate emergency care.

Return a valid JSON object matching the requested schema.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
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
  if (!text) {
    throw new Error('No response returned from AI analysis.');
  }

  const parsed = JSON.parse(text);

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
}

export async function processHealthChat(params: {
  message: string;
  history: Array<{ role: 'user' | 'model'; text: string }>;
  reportContext?: LabReportAnalysis | null;
  userProfile?: any;
}): Promise<string> {
  const ai = getGeminiClient();

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

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
    contents: contents,
    config: {
      systemInstruction: contextPrefix,
      temperature: 0.7
    }
  });

  return response.text || 'I apologize, I could not generate a response. Please try again.';
}

export async function analyzeSymptoms(params: {
  symptoms: string;
  age?: number;
  gender?: string;
  duration?: string;
}): Promise<SymptomAnalysisResult> {
  const ai = getGeminiClient();

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

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
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
  if (!text) {
    throw new Error('Failed to analyze symptoms.');
  }

  const parsed = JSON.parse(text);
  return {
    symptomsEntered: params.symptoms,
    possibleCauses: parsed.possibleCauses || [],
    generalInformation: parsed.generalInformation || '',
    warningSigns: parsed.warningSigns || [],
    whenToSeekCare: parsed.whenToSeekCare || 'Consult a healthcare professional if symptoms worsen or persist.',
    whatToTellDoctor: parsed.whatToTellDoctor || [],
    disclaimer: parsed.disclaimer || 'This information is educational and does not replace professional medical evaluation.'
  };
}

export async function lookupMedicineInfo(medicineName: string): Promise<MedicineInfoResult> {
  const ai = getGeminiClient();

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

  const response = await ai.models.generateContent({
    model: 'gemini-3.7-flash',
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
  if (!text) {
    throw new Error('Failed to retrieve medicine information.');
  }

  const parsed = JSON.parse(text);
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
}
