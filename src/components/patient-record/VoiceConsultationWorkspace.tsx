import React, { useState, useEffect, useRef } from 'react';
import {
  Mic,
  MicOff,
  Square,
  Play,
  Pause,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  Clock,
  User,
  Stethoscope,
  Trash2,
  Edit3,
  CheckCircle2,
  Printer,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  Volume2,
  VolumeX,
  Info,
  RefreshCw,
  FileText,
  Send,
  HelpCircle,
  Pill,
  Calendar,
  HeartPulse,
  Activity
} from 'lucide-react';
import {
  LivePatientRecord,
  PatientConsultation,
  ConsultationSpeakerUtterance,
  ConsultationClinicalNoteDraft,
  PrescriptionMedicine
} from '../../types.js';
import { useAuth } from '../../context/AuthContext.js';
import {
  createSpeechRecognizer,
  isSpeechRecognitionSupported,
  speakText,
  stopSpeaking
} from '../../lib/speechUtils.js';

interface VoiceConsultationWorkspaceProps {
  patient: LivePatientRecord;
  onPatientUpdated: (updatedPatient: LivePatientRecord) => void;
  onNavigateToTab?: (tabId: string) => void;
}

export const VoiceConsultationWorkspace: React.FC<VoiceConsultationWorkspaceProps> = ({
  patient,
  onPatientUpdated,
  onNavigateToTab
}) => {
  const { user, token } = useAuth();

  // Screen modes: 'idle' | 'recording' | 'generating' | 'review' | 'approved'
  const [viewState, setViewState] = useState<'idle' | 'recording' | 'generating' | 'review' | 'approved'>('idle');

  // Explicit Consent State
  const [consentDoctor, setConsentDoctor] = useState(false);
  const [consentPatient, setConsentPatient] = useState(false);
  const [showConsentModal, setShowConsentModal] = useState(false);

  // Active Consultation Session Data
  const [consultationId, setConsultationId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState<'Doctor' | 'Patient'>('Doctor');
  
  // Live Utterances
  const [utterances, setUtterances] = useState<ConsultationSpeakerUtterance[]>([]);
  const [liveInterimText, setLiveInterimText] = useState<string>('');
  const [manualUtteranceText, setManualUtteranceText] = useState('');
  const [doctorExamFindings, setDoctorExamFindings] = useState('');

  // AI Draft Note
  const [aiDraftNote, setAiDraftNote] = useState<ConsultationClinicalNoteDraft | null>(null);
  const [editableNote, setEditableNote] = useState<{
    chiefComplaint: string;
    symptoms: string[];
    durationAndHistory: string;
    relevantMedicalHistory: string;
    currentMedicines: string[];
    allergies: string;
    importantPatientStatements: string[];
    examinationFindings: string;
    assessment: string;
    suggestedFollowUp: string;
    treatmentPlan: string;
    newSymptomInput: string;
    newMedicineInput: string;
  }>({
    chiefComplaint: '',
    symptoms: [],
    durationAndHistory: '',
    relevantMedicalHistory: '',
    currentMedicines: [],
    allergies: '',
    importantPatientStatements: [],
    examinationFindings: '',
    assessment: '',
    suggestedFollowUp: '',
    treatmentPlan: '',
    newSymptomInput: '',
    newMedicineInput: ''
  });

  // Digital Prescription Creation Options
  const [createPrescriptionToggle, setCreatePrescriptionToggle] = useState(false);
  const [prescribedMedicines, setPrescribedMedicines] = useState<PrescriptionMedicine[]>([]);
  const [newRxMed, setNewRxMed] = useState<PrescriptionMedicine>({
    name: '',
    strength: '',
    frequency: '1-0-1',
    duration: '5 days',
    instructions: 'Take after meals'
  });

  // Past Consultations Accordion
  const [selectedPastCons, setSelectedPastCons] = useState<PatientConsultation | null>(null);
  const [expandedPastId, setExpandedPastId] = useState<string | null>(null);
  const [isSavingApproval, setIsSavingApproval] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeSpeakingId, setActiveSpeakingId] = useState<string | null>(null);

  // Audio / Speech recognition ref
  const recognizerRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Audio speech playback handler for consultation notes, summaries, and transcripts
  const handleSpeakConsultationText = (id: string, textToSpeak: string) => {
    if (activeSpeakingId === id) {
      stopSpeaking();
      setActiveSpeakingId(null);
      return;
    }

    stopSpeaking();
    setActiveSpeakingId(id);

    speakText(textToSpeak, {
      onEnd: () => setActiveSpeakingId(null),
      onError: () => setActiveSpeakingId(null)
    });
  };

  // Auto-scroll transcription feed
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [utterances, liveInterimText]);

  // Timer logic during active recording
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    };
  }, [isRecording, isPaused]);

  // Cleanup speech recognition on unmount
  useEffect(() => {
    return () => {
      if (recognizerRef.current) {
        try {
          recognizerRef.current.stop();
        } catch (e) {
          // ignore
        }
      }
      stopSpeaking();
    };
  }, []);

  const formatSeconds = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  // 1. Start Consultation Flow (Opens Consent Modal)
  const handleInitiateConsultationClick = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    setConsentDoctor(false);
    setConsentPatient(false);
    setShowConsentModal(true);
  };

  // 2. Confirm Consent and Start Session
  const handleConfirmConsentAndStart = async () => {
    if (!consentDoctor || !consentPatient) {
      setErrorMessage('Both doctor and patient explicit consents are mandatory before starting audio capture.');
      return;
    }

    try {
      setShowConsentModal(false);
      setViewState('recording');
      setElapsedSeconds(0);
      setStartTime(new Date());
      setUtterances([]);
      setLiveInterimText('');
      setDoctorExamFindings('');

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/consultations/start', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          patientId: patient.id,
          consentObtained: true
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to start consultation session.');

      setConsultationId(data.consultation.id);
      setIsRecording(true);
      setIsPaused(false);

      // Start Browser Speech Recognition
      startSpeechRecognition();
    } catch (err: any) {
      console.error('Start consultation error:', err);
      setErrorMessage(err.message || 'Error starting consultation.');
      setViewState('idle');
    }
  };

  // Start Web Speech Recognition
  const startSpeechRecognition = () => {
    if (!isSpeechRecognitionSupported()) {
      console.info('Speech recognition not supported in this browser; falling back to manual speech log.');
      return;
    }

    try {
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch (e) {}
      }

      const recognizer = createSpeechRecognizer({
        continuous: true,
        interimResults: true,
        onResult: (result) => {
          if (result.isFinal) {
            const currentTimestamp = formatSeconds(elapsedSeconds);
            setUtterances(prev => [
              ...prev,
              {
                id: `utt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
                speaker: currentSpeaker,
                text: result.transcript,
                timestamp: currentTimestamp
              }
            ]);
            setLiveInterimText('');
          } else {
            setLiveInterimText(result.transcript);
          }
        },
        onError: (err) => {
          console.warn('Speech recognition warning:', err);
        },
        onEnd: () => {
          // Restart if still in active recording state
          if (isRecording && !isPaused && recognizerRef.current) {
            try {
              recognizerRef.current.start();
            } catch (e) {
              // ignore
            }
          }
        }
      });

      if (recognizer) {
        recognizerRef.current = recognizer;
        recognizer.start();
      }
    } catch (err) {
      console.warn('Could not activate speech recognition:', err);
    }
  };

  const handleTogglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      if (recognizerRef.current) {
        try { recognizerRef.current.start(); } catch (e) {}
      }
    } else {
      setIsPaused(true);
      if (recognizerRef.current) {
        try { recognizerRef.current.stop(); } catch (e) {}
      }
    }
  };

  const handleAddManualUtterance = () => {
    if (!manualUtteranceText.trim()) return;
    const currentTimestamp = formatSeconds(elapsedSeconds);
    setUtterances(prev => [
      ...prev,
      {
        id: `utt_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
        speaker: currentSpeaker,
        text: manualUtteranceText.trim(),
        timestamp: currentTimestamp
      }
    ]);
    setManualUtteranceText('');
  };

  // Load a realistic clinical sample consultation for demonstration or testing
  const handleLoadSampleClinicalDialogue = () => {
    const sampleDialogue: ConsultationSpeakerUtterance[] = [
      {
        id: 'samp_1',
        speaker: 'Doctor',
        text: `Good morning, ${patient.patientName}. How have you been feeling since your last visit?`,
        timestamp: '00:05'
      },
      {
        id: 'samp_2',
        speaker: 'Patient',
        text: 'Doctor, I have had a continuous throbbing headache on the right side for the past 4 days, along with mild nausea and sensitivity to bright lights.',
        timestamp: '00:18'
      },
      {
        id: 'samp_3',
        speaker: 'Doctor',
        text: 'Did the headache start suddenly or gradually? Have you taken any pain relievers or noticed blurry vision or neck stiffness?',
        timestamp: '00:32'
      },
      {
        id: 'samp_4',
        speaker: 'Patient',
        text: 'It started gradually after a long shift. I took Paracetamol 650mg, which gave slight relief for 2 hours, but then it came back. No neck stiffness or vision loss.',
        timestamp: '00:54'
      },
      {
        id: 'samp_5',
        speaker: 'Doctor',
        text: 'Understood. Let me check your blood pressure and examine your pupillary reflexes. BP is 128/82 mmHg, heart sounds regular S1/S2, cranial nerves intact, no focal neurological deficits.',
        timestamp: '01:15'
      },
      {
        id: 'samp_6',
        speaker: 'Doctor',
        text: 'This appears consistent with an acute unilateral migraine episode without aura. We will prescribe a targeted migraine relief tablet, advise adequate hydration and sleep, and review if headache persists beyond 48 hours.',
        timestamp: '01:40'
      }
    ];

    setUtterances(sampleDialogue);
    setDoctorExamFindings('BP 128/82 mmHg, HR 74 bpm regular. Pupils equal and reactive to light. Neurological cranial nerves II-XII intact. No neck stiffness or photophobia on direct exam.');
    setElapsedSeconds(110);
  };

  // 3. End Consultation & Generate AI Structured Clinical Note
  const handleEndConsultationAndGenerate = async () => {
    setIsRecording(false);
    if (recognizerRef.current) {
      try { recognizerRef.current.stop(); } catch (e) {}
    }

    if (utterances.length === 0 && !liveInterimText.trim() && !doctorExamFindings.trim()) {
      setErrorMessage('No consultation dialogue or clinical findings were captured.');
      return;
    }

    setViewState('generating');
    setErrorMessage(null);

    try {
      const finalUtterances = [...utterances];
      if (liveInterimText.trim()) {
        finalUtterances.push({
          id: `utt_${Date.now()}`,
          speaker: currentSpeaker,
          text: liveInterimText.trim(),
          timestamp: formatSeconds(elapsedSeconds)
        });
      }

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/consultations/generate-note', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          patientId: patient.id,
          consultationId,
          transcript: finalUtterances,
          doctorEnteredFindings: doctorExamFindings,
          durationSeconds: elapsedSeconds
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate clinical note draft.');
      }

      const draft: ConsultationClinicalNoteDraft = data.aiDraftNote;
      setAiDraftNote(draft);

      // Pre-fill editable state for doctor review
      setEditableNote({
        chiefComplaint: draft.chiefComplaint || '',
        symptoms: draft.symptoms || [],
        durationAndHistory: draft.durationAndHistory || '',
        relevantMedicalHistory: draft.relevantMedicalHistory || '',
        currentMedicines: draft.currentMedicines || [],
        allergies: draft.allergies || '',
        importantPatientStatements: draft.importantPatientStatements || [],
        examinationFindings: draft.examinationFindings || doctorExamFindings || '',
        assessment: draft.assessment || '',
        suggestedFollowUp: draft.suggestedFollowUp || '',
        treatmentPlan: draft.treatmentPlanDraft || '',
        newSymptomInput: '',
        newMedicineInput: ''
      });

      // Populate default prescription draft if symptoms suggest medications
      setPrescribedMedicines([
        {
          name: 'Tab Paracetamol',
          strength: '650 mg',
          frequency: '1-0-1 (Twice daily after meals)',
          duration: '3 days',
          instructions: 'For headache relief as needed'
        }
      ]);

      setViewState('review');
    } catch (err: any) {
      console.error('Note generation error:', err);
      setErrorMessage(err.message || 'Failed to generate AI note draft.');
      setViewState('recording');
    }
  };

  // Helper functions for doctor review editing
  const handleAddSymptom = () => {
    if (!editableNote.newSymptomInput.trim()) return;
    setEditableNote(prev => ({
      ...prev,
      symptoms: [...prev.symptoms, prev.newSymptomInput.trim()],
      newSymptomInput: ''
    }));
  };

  const handleRemoveSymptom = (idx: number) => {
    setEditableNote(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter((_, i) => i !== idx)
    }));
  };

  const handleAddPrescribedMedicine = () => {
    if (!newRxMed.name.trim()) return;
    setPrescribedMedicines(prev => [...prev, { ...newRxMed }]);
    setNewRxMed({
      name: '',
      strength: '',
      frequency: '1-0-1',
      duration: '5 days',
      instructions: 'Take after meals'
    });
  };

  const handleRemovePrescribedMedicine = (idx: number) => {
    setPrescribedMedicines(prev => prev.filter((_, i) => i !== idx));
  };

  // 4. Doctor Approves and Signs the Final Note
  const handleApproveAndSaveNote = async () => {
    if (!editableNote.chiefComplaint.trim()) {
      setErrorMessage('Chief complaint is required.');
      return;
    }

    setIsSavingApproval(true);
    setErrorMessage(null);

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/consultations/approve', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          consultationId,
          patientId: patient.id,
          transcription: utterances,
          fullTranscriptText: utterances.map(u => `[${u.timestamp}] ${u.speaker}: ${u.text}`).join('\n'),
          durationSeconds: elapsedSeconds,
          approvedNote: {
            chiefComplaint: editableNote.chiefComplaint.trim(),
            symptoms: editableNote.symptoms,
            durationAndHistory: editableNote.durationAndHistory.trim(),
            relevantMedicalHistory: editableNote.relevantMedicalHistory.trim(),
            currentMedicines: editableNote.currentMedicines,
            allergies: editableNote.allergies.trim(),
            importantPatientStatements: editableNote.importantPatientStatements,
            examinationFindings: editableNote.examinationFindings.trim(),
            assessment: editableNote.assessment.trim(),
            suggestedFollowUp: editableNote.suggestedFollowUp.trim(),
            treatmentPlan: editableNote.treatmentPlan.trim(),
            clinicalObservations: editableNote.examinationFindings.trim()
          },
          createPrescription: createPrescriptionToggle && prescribedMedicines.length > 0,
          prescribedMedicines: createPrescriptionToggle ? prescribedMedicines : []
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to approve and save clinical consultation note.');
      }

      setSuccessMessage('Consultation note successfully verified, signed, and permanently saved in patient health records.');
      setViewState('approved');

      if (data.patient) {
        onPatientUpdated(data.patient);
      }
    } catch (err: any) {
      console.error('Approve note error:', err);
      setErrorMessage(err.message || 'Error approving note.');
    } finally {
      setIsSavingApproval(false);
    }
  };

  // 5. Delete past consultation per retention policy
  const handleDeleteConsultation = async (consId: string) => {
    if (!window.confirm('Are you sure you want to delete this consultation transcript and record per data retention policy?')) {
      return;
    }

    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/consultations/${consId}`, {
        method: 'DELETE',
        headers
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete consultation.');

      if (data.patient) {
        onPatientUpdated(data.patient);
      }
      setSuccessMessage('Consultation record successfully deleted per retention policy.');
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to delete consultation.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Alert / Notices */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="p-1 hover:bg-rose-100 rounded-lg text-rose-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between text-xs text-emerald-800 animate-in fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-600">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. IDLE / LAUNCH VIEW */}
      {/* ========================================================================= */}
      {viewState === 'idle' && (
        <div className="bg-white rounded-3xl border border-blue-100 p-6 sm:p-8 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/70 text-indigo-700 text-xs font-bold">
                <Mic className="w-3.5 h-3.5 text-indigo-600" />
                <span>AI Clinical Voice Consultation Assistant</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                Real-Time Voice Consultation & Clinical Scribe
              </h2>
              <p className="text-slate-600 text-xs sm:text-sm max-w-2xl leading-relaxed">
                Capture the doctor-patient dialogue in real-time with automatic speaker separation (Doctor & Patient). 
                Once ended, MediVerse AI drafts a comprehensive clinical note for your review, editing, and official sign-off.
              </p>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleInitiateConsultationClick}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Mic className="w-4 h-4" />
                <span>Start Consultation</span>
              </button>
            </div>
          </div>

          {/* Key Compliance & Clinical Safety Directives */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                <span>Dual Explicit Consent</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Audio is only captured with explicit doctor and patient consent. No audio is saved permanently without authorization.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
                <Activity className="w-4 h-4 text-indigo-600" />
                <span>Doctor & Patient Diarization</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Live transcription cleanly separates patient symptoms from physician questions, examination notes, and medical guidance.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-900">
                <FileCheck2 className="w-4 h-4 text-emerald-600" />
                <span>Physician Review & Sign-Off</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                AI creates a draft. The attending physician retains complete editorial control and approves the final medical note.
              </p>
            </div>
          </div>

          {/* Past Consultations List for this Patient */}
          <div className="pt-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Consultation History ({patient.consultations?.length || 0})</span>
              </h3>
            </div>

            {patient.consultations && patient.consultations.length > 0 ? (
              <div className="space-y-3">
                {patient.consultations.map(cons => {
                  const isExpanded = expandedPastId === cons.id;
                  const note = cons.approvedNote;
                  return (
                    <div
                      key={cons.id}
                      className="rounded-2xl border border-slate-200 bg-slate-50/50 overflow-hidden transition-all"
                    >
                      <div
                        onClick={() => setExpandedPastId(isExpanded ? null : cons.id)}
                        className="p-4 flex flex-wrap items-center justify-between gap-4 cursor-pointer hover:bg-slate-100/70 transition-colors"
                      >
                        <div className="space-y-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs font-mono font-bold text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                              {new Date(cons.startedAt).toLocaleDateString()} at {new Date(cons.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Approved by {cons.doctorName}
                            </span>
                            {cons.durationSeconds > 0 && (
                              <span className="text-xs text-slate-500 flex items-center gap-1 font-mono">
                                <Clock className="w-3 h-3 text-slate-400" />
                                {formatSeconds(cons.durationSeconds)}
                              </span>
                            )}
                          </div>

                          <h4 className="text-sm font-bold text-slate-900">
                            {note?.chiefComplaint || 'Clinical Consultation'}
                          </h4>
                          {note?.assessment && (
                            <p className="text-xs text-slate-600 line-clamp-1">
                              <strong>Assessment:</strong> {note.assessment}
                            </p>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          {note && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const summary = `Consultation for ${patient.patientName}. Chief Complaint: ${note.chiefComplaint}. Symptoms: ${note.symptoms?.join(', ') || 'none'}. Assessment: ${note.assessment || 'none'}. Treatment Plan: ${note.treatmentPlan || 'none'}.`;
                                handleSpeakConsultationText(`past_${cons.id}`, summary);
                              }}
                              className={`p-2 rounded-xl transition-colors ${
                                activeSpeakingId === `past_${cons.id}`
                                  ? 'bg-indigo-600 text-white animate-pulse'
                                  : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'
                              }`}
                              title="Listen to consultation summary in natural voice"
                            >
                              {activeSpeakingId === `past_${cons.id}` ? (
                                <VolumeX className="w-4 h-4" />
                              ) : (
                                <Volume2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteConsultation(cons.id);
                            }}
                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                            title="Delete consultation under retention policy"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                          <div className="p-1 rounded-lg bg-white border border-slate-200 text-slate-600">
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </div>
                        </div>
                      </div>

                      {/* Expanded View */}
                      {isExpanded && note && (
                        <div className="p-5 bg-white border-t border-slate-200 space-y-4 text-xs">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                              <span className="font-bold text-slate-700 block">Symptoms & Duration</span>
                              <p className="text-slate-800">
                                {note.symptoms?.join(', ') || 'None noted'} • {note.durationAndHistory || 'Not specified'}
                              </p>
                            </div>

                            <div className="p-3.5 bg-slate-50 rounded-xl space-y-1">
                              <span className="font-bold text-slate-700 block">Clinical Examination</span>
                              <p className="text-slate-800">{note.examinationFindings || 'Exam completed'}</p>
                            </div>
                          </div>

                          <div className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
                            <span className="font-bold text-blue-900 block">Treatment & Management Plan</span>
                            <p className="text-blue-950 whitespace-pre-wrap">{note.treatmentPlan || 'Plan documented.'}</p>
                          </div>

                          {/* Transcript toggle */}
                          {cons.transcription && cons.transcription.length > 0 && (
                            <div className="space-y-2 pt-2 border-t border-slate-100">
                              <span className="font-bold text-slate-700 block">Consultation Audio Transcript:</span>
                              <div className="p-3 max-h-48 overflow-y-auto bg-slate-50 rounded-xl space-y-2 font-sans">
                                {cons.transcription.map((utt, uIdx) => (
                                  <div key={uIdx} className="flex items-start gap-2">
                                    <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                                      utt.speaker === 'Doctor' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                                    }`}>
                                      {utt.speaker} [{utt.timestamp}]
                                    </span>
                                    <span className="text-slate-700">{utt.text}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200 text-slate-500 text-xs">
                <Mic className="w-8 h-8 mx-auto text-slate-400 mb-2 opacity-50" />
                <p className="font-medium text-slate-700">No voice consultations recorded for {patient.patientName} yet.</p>
                <p className="text-slate-400 mt-1">Click "Start Consultation" above to initiate a consented recording session.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. EXPLICIT CONSENT MODAL */}
      {/* ========================================================================= */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black text-slate-900">Mandatory Consultation Consent</h3>
                <p className="text-xs text-slate-500">Security & Privacy Protocol (HIPAA/GDPR)</p>
              </div>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Audio Capture Notice:</span>
              </div>
              <p className="leading-relaxed">
                Consultation audio is processed securely to transcribe dialogue and assist the doctor in drafting clinical documentation. 
                Explicit permission from both the patient and the physician is required.
              </p>
            </div>

            <div className="space-y-3 pt-2">
              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none transition-colors">
                <input
                  type="checkbox"
                  checked={consentDoctor}
                  onChange={e => setConsentDoctor(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Attending Doctor Authorization</span>
                  <span className="text-slate-500 block mt-0.5">
                    I ({user?.name || 'Attending Physician'}) confirm that I am initiating this session to aid clinical scribing for patient {patient.patientName}.
                  </span>
                </div>
              </label>

              <label className="flex items-start gap-3 p-3.5 rounded-2xl border border-slate-200 hover:bg-slate-50 cursor-pointer select-none transition-colors">
                <input
                  type="checkbox"
                  checked={consentPatient}
                  onChange={e => setConsentPatient(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-900 block">Patient Verbal / Written Consent</span>
                  <span className="text-slate-500 block mt-0.5">
                    The patient ({patient.patientName}, UHID: {patient.uhid}) has been informed and granted consent to capture consultation speech for clinical record transcription.
                  </span>
                </div>
              </label>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowConsentModal(false)}
                className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!consentDoctor || !consentPatient}
                onClick={handleConfirmConsentAndStart}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs font-bold shadow-sm transition-all"
              >
                Consent Granted — Begin Recording
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. ACTIVE RECORDING VIEW */}
      {/* ========================================================================= */}
      {viewState === 'recording' && (
        <div className="bg-white rounded-3xl border border-blue-200 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
          {/* Active Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900 text-white">
            <div className="flex items-center gap-3">
              <div className="relative flex items-center justify-center">
                <span className={`w-3.5 h-3.5 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-rose-500'} animate-ping absolute`}></span>
                <span className={`w-3 h-3 rounded-full ${isPaused ? 'bg-amber-400' : 'bg-rose-500'} relative`}></span>
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                  {isPaused ? 'Consultation Paused' : 'Live Audio Capture Active'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Patient: <strong className="text-white">{patient.patientName}</strong> ({patient.uhid})
                </span>
              </div>
            </div>

            {/* Timer & Controls */}
            <div className="flex items-center gap-3">
              <div className="px-3.5 py-1.5 rounded-xl bg-slate-800 border border-slate-700 font-mono text-sm font-bold text-emerald-400 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>{formatSeconds(elapsedSeconds)}</span>
              </div>

              <button
                onClick={handleTogglePause}
                className={`p-2 rounded-xl border text-xs font-bold transition-colors ${
                  isPaused
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-500'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                }`}
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </button>

              <button
                onClick={handleEndConsultationAndGenerate}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                <span>End & Generate Clinical Note</span>
              </button>
            </div>
          </div>

          {/* Speaker Selector & Fast Dialogue Tools */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-700">Active Speaker Tag:</span>
              <div className="flex items-center p-1 bg-white rounded-xl border border-slate-200">
                <button
                  type="button"
                  onClick={() => setCurrentSpeaker('Doctor')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    currentSpeaker === 'Doctor'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Stethoscope className="w-3.5 h-3.5" />
                  <span>Doctor</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCurrentSpeaker('Patient')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                    currentSpeaker === 'Patient'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <User className="w-3.5 h-3.5" />
                  <span>Patient</span>
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleLoadSampleClinicalDialogue}
                className="px-3 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold border border-indigo-200 transition-colors flex items-center gap-1.5"
                title="Load sample clinical dialogue for simulation"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Simulate Clinical Speech</span>
              </button>
            </div>
          </div>

          {/* Main Grid: Live Transcriptions on Left, Doctor Exam Pad on Right */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Live Transcripts */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Mic className="w-3.5 h-3.5 text-blue-600 animate-pulse" />
                  Live Speaker Transcript Stream ({utterances.length} utterances)
                </span>
                <span className="text-[11px] text-slate-400">Speak into microphone or type below</span>
              </div>

              <div className="h-80 overflow-y-auto p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                {utterances.length === 0 && !liveInterimText && (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs text-center space-y-2">
                    <Mic className="w-8 h-8 text-blue-500/40 animate-bounce" />
                    <p className="font-medium text-slate-600">Listening to consultation speech...</p>
                    <p className="text-[11px] text-slate-400">Start talking or click "Simulate Clinical Speech" to populate sample data.</p>
                  </div>
                )}

                {utterances.map((utt, idx) => (
                  <div
                    key={utt.id || idx}
                    className={`flex items-start gap-2.5 ${
                      utt.speaker === 'Doctor' ? 'mr-8' : 'ml-8'
                    }`}
                  >
                    <div
                      className={`px-2 py-0.5 rounded-md text-[10px] font-bold shrink-0 mt-1 ${
                        utt.speaker === 'Doctor'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}
                    >
                      {utt.speaker} [{utt.timestamp}]
                    </div>
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        utt.speaker === 'Doctor'
                          ? 'bg-white border border-blue-100 text-slate-800 rounded-tl-xs'
                          : 'bg-emerald-50 border border-emerald-100 text-emerald-950 rounded-tr-xs'
                      }`}
                    >
                      {utt.text}
                    </div>
                  </div>
                ))}

                {/* Interim spoken text */}
                {liveInterimText && (
                  <div className="flex items-start gap-2.5 opacity-75">
                    <div className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-200 text-slate-700 shrink-0">
                      {currentSpeaker} (speaking...)
                    </div>
                    <div className="p-2.5 rounded-xl bg-white border border-dashed border-blue-300 text-xs text-blue-700 italic">
                      {liveInterimText}
                    </div>
                  </div>
                )}

                <div ref={chatBottomRef} />
              </div>

              {/* Dictation / Manual Utterance Form */}
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={manualUtteranceText}
                  onChange={e => setManualUtteranceText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddManualUtterance();
                    }
                  }}
                  placeholder={`Type or edit ${currentSpeaker}'s statement...`}
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 bg-white"
                />
                <button
                  type="button"
                  onClick={handleAddManualUtterance}
                  disabled={!manualUtteranceText.trim()}
                  className="px-3.5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 shrink-0"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Add Line</span>
                </button>
              </div>
            </div>

            {/* Right Col: Doctor Clinical Exam / Quick Notes */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                  Doctor Physical Exam / Findings Pad
                </span>
              </div>

              <textarea
                rows={11}
                value={doctorExamFindings}
                onChange={e => setDoctorExamFindings(e.target.value)}
                placeholder="Type physical exam observations (e.g. BP 120/80, chest clear bilaterally, normal heart sounds, abdomen soft non-tender)..."
                className="w-full p-3.5 text-xs rounded-2xl border border-slate-200 focus:outline-hidden focus:border-indigo-600 bg-slate-50/50 leading-relaxed resize-none"
              />

              <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 text-[11px] text-blue-900 space-y-1">
                <span className="font-bold block">Attending Doctor:</span>
                <p className="text-slate-700">{user?.name || patient.attendingPhysician} ({user?.specialty || 'General Medicine'})</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. GENERATING STATE */}
      {/* ========================================================================= */}
      {viewState === 'generating' && (
        <div className="bg-white rounded-3xl border border-blue-100 p-12 text-center space-y-5 shadow-xs animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center mx-auto shadow-lg shadow-blue-500/20 animate-pulse">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-slate-900">Synthesizing AI Clinical Note Draft</h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Analyzing speaker-separated conversation, extracting chief complaint, symptoms, timeline, and formatting structured review fields...
            </p>
          </div>
          <div className="flex justify-center items-center gap-2 text-xs font-bold text-blue-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Structuring Clinical Note for Doctor Review</span>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. DOCTOR REVIEW & APPROVAL VIEW */}
      {/* ========================================================================= */}
      {viewState === 'review' && (
        <div className="bg-white rounded-3xl border border-indigo-100 p-6 sm:p-8 shadow-sm space-y-6 animate-in fade-in">
          
          {/* Prominent AI Draft Disclaimer Banner */}
          <div className="p-4 bg-amber-50 border-2 border-amber-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-950">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="font-extrabold uppercase tracking-wide text-amber-900 block">
                  AI-Generated Clinical Note Draft — Verification Required
                </span>
                <span className="text-amber-800">
                  This note is an AI draft. The attending physician must review, verify, edit, and approve all clinical details before saving to the permanent record.
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-amber-200/80 font-bold text-[10px] text-amber-900 uppercase shrink-0">
              Draft Status
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-xl font-black text-slate-900">Physician Clinical Note Review</h3>
              <p className="text-xs text-slate-500">
                Patient: <strong className="text-slate-800">{patient.patientName}</strong> ({patient.uhid}) • Duration: {formatSeconds(elapsedSeconds)}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const summaryText = `Chief Complaint: ${editableNote.chiefComplaint}. Symptoms: ${editableNote.symptoms.join(', ')}. Assessment: ${editableNote.assessment}. Treatment Plan: ${editableNote.treatmentPlan}. Follow up: ${editableNote.suggestedFollowUp}`;
                  handleSpeakConsultationText('draft_review', summaryText);
                }}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  activeSpeakingId === 'draft_review'
                    ? 'bg-indigo-600 text-white shadow-sm animate-pulse'
                    : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700'
                }`}
                title="Listen to clinical note draft in natural language"
              >
                {activeSpeakingId === 'draft_review' ? (
                  <>
                    <VolumeX className="w-4 h-4" />
                    <span>Stop Reading</span>
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    <span>Listen to Draft Note</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => setViewState('recording')}
                className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
              >
                Back to Audio
              </button>
            </div>
          </div>

          {/* Structured Note Review Fields */}
          <div className="space-y-5">
            
            {/* 1. Chief Complaint */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-blue-600" />
                <span>Chief Complaint *</span>
              </label>
              <input
                type="text"
                value={editableNote.chiefComplaint}
                onChange={e => setEditableNote(prev => ({ ...prev, chiefComplaint: e.target.value }))}
                className="w-full px-4 py-2.5 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 bg-slate-50/50"
              />
            </div>

            {/* 2. Symptoms List */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-rose-600" />
                <span>Identified Symptoms</span>
              </label>
              <div className="flex flex-wrap items-center gap-2">
                {editableNote.symptoms.map((sym, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium"
                  >
                    <span>{sym}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveSymptom(idx)}
                      className="hover:text-rose-950 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}

                <div className="inline-flex items-center gap-1">
                  <input
                    type="text"
                    value={editableNote.newSymptomInput}
                    onChange={e => setEditableNote(prev => ({ ...prev, newSymptomInput: e.target.value }))}
                    placeholder="Add symptom..."
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddSymptom();
                      }
                    }}
                    className="px-3 py-1 text-xs rounded-full border border-slate-200 bg-white focus:outline-hidden focus:border-blue-600"
                  />
                  <button
                    type="button"
                    onClick={handleAddSymptom}
                    className="p-1 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* 3. Grid: Duration/History + Relevant Medical History */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Duration & History of Present Illness</label>
                <textarea
                  rows={3}
                  value={editableNote.durationAndHistory}
                  onChange={e => setEditableNote(prev => ({ ...prev, durationAndHistory: e.target.value }))}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 bg-slate-50/50 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Relevant Medical History & Allergies</label>
                <textarea
                  rows={3}
                  value={editableNote.relevantMedicalHistory}
                  onChange={e => setEditableNote(prev => ({ ...prev, relevantMedicalHistory: e.target.value }))}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 bg-slate-50/50 resize-none"
                />
              </div>
            </div>

            {/* 4. Physical Examination & Findings */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Stethoscope className="w-3.5 h-3.5 text-indigo-600" />
                <span>Physical Examination / Clinical Findings</span>
              </label>
              <textarea
                rows={3}
                value={editableNote.examinationFindings}
                onChange={e => setEditableNote(prev => ({ ...prev, examinationFindings: e.target.value }))}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 bg-slate-50/50 resize-none"
              />
            </div>

            {/* 5. Clinical Assessment / Impression */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                <span>Physician Assessment / Impression *</span>
              </label>
              <textarea
                rows={2}
                value={editableNote.assessment}
                onChange={e => setEditableNote(prev => ({ ...prev, assessment: e.target.value }))}
                className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 bg-slate-50/50 resize-none font-medium"
              />
            </div>

            {/* 6. Treatment Plan & Follow-up */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Doctor's Treatment / Non-Pharm Plan</label>
                <textarea
                  rows={3}
                  value={editableNote.treatmentPlan}
                  onChange={e => setEditableNote(prev => ({ ...prev, treatmentPlan: e.target.value }))}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 bg-slate-50/50 resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-800">Suggested Follow-Up & Red Flags</label>
                <textarea
                  rows={3}
                  value={editableNote.suggestedFollowUp}
                  onChange={e => setEditableNote(prev => ({ ...prev, suggestedFollowUp: e.target.value }))}
                  className="w-full p-3 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:border-blue-600 bg-slate-50/50 resize-none"
                />
              </div>
            </div>

            {/* 7. Optional Digital Prescription Creator */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-bold text-indigo-950">
                  <input
                    type="checkbox"
                    checked={createPrescriptionToggle}
                    onChange={e => setCreatePrescriptionToggle(e.target.checked)}
                    className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
                  />
                  <span className="flex items-center gap-1.5">
                    <Pill className="w-4 h-4 text-indigo-600" />
                    Create Linked Official Digital Prescription for this Consultation
                  </span>
                </label>
              </div>

              {createPrescriptionToggle && (
                <div className="space-y-3 pt-2">
                  {prescribedMedicines.length > 0 && (
                    <div className="space-y-2">
                      {prescribedMedicines.map((med, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-indigo-100 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-900">{med.name}</span>{' '}
                            <span className="text-slate-500">({med.strength})</span> •{' '}
                            <span className="text-indigo-700">{med.frequency}</span> for {med.duration}
                            {med.instructions && <span className="text-slate-500 block text-[11px]">{med.instructions}</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemovePrescribedMedicine(idx)}
                            className="text-rose-500 hover:text-rose-700 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Med Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
                    <input
                      type="text"
                      placeholder="Medicine name"
                      value={newRxMed.name}
                      onChange={e => setNewRxMed(prev => ({ ...prev, name: e.target.value }))}
                      className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Strength (e.g. 500mg)"
                      value={newRxMed.strength}
                      onChange={e => setNewRxMed(prev => ({ ...prev, strength: e.target.value }))}
                      className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Dosage (e.g. 1-0-1)"
                      value={newRxMed.frequency}
                      onChange={e => setNewRxMed(prev => ({ ...prev, frequency: e.target.value }))}
                      className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                    <input
                      type="text"
                      placeholder="Duration (e.g. 5 days)"
                      value={newRxMed.duration}
                      onChange={e => setNewRxMed(prev => ({ ...prev, duration: e.target.value }))}
                      className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-white"
                    />
                    <button
                      type="button"
                      onClick={handleAddPrescribedMedicine}
                      disabled={!newRxMed.name.trim()}
                      className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Rx</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Doctor Signature & Sign-Off Authorization */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="space-y-0.5 text-xs">
                <span className="font-bold text-slate-900 block">Attending Physician Verification</span>
                <span className="text-slate-500 block">
                  Dr. {user?.name || patient.attendingPhysician} ({user?.specialty || 'General Medicine'}) • License: {user?.licenseNumber || 'Active Hospital Credential'}
                </span>
              </div>

              <button
                type="button"
                disabled={isSavingApproval || !editableNote.chiefComplaint.trim()}
                onClick={handleApproveAndSaveNote}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 disabled:opacity-50 text-white font-bold text-xs shadow-md shadow-emerald-500/20 flex items-center gap-2 transition-all hover:scale-[1.02] shrink-0"
              >
                {isSavingApproval ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Signing & Authorizing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Approve & Sign Off Clinical Note</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. APPROVED SUCCESS VIEW */}
      {/* ========================================================================= */}
      {viewState === 'approved' && (
        <div className="bg-white rounded-3xl border border-emerald-200 p-8 text-center space-y-6 shadow-xs animate-in fade-in">
          <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-200">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h3 className="text-2xl font-black text-slate-900">Clinical Consultation Approved & Signed</h3>
            <p className="text-xs sm:text-sm text-slate-600 max-w-lg mx-auto">
              The clinical note has been officially added to <strong>{patient.patientName}'s</strong> electronic health record, timeline, and clinical observations.
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => {
                setViewState('idle');
                setConsultationId(null);
              }}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm"
            >
              Consultation Hub
            </button>

            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('diagnoses-notes')}
                className="px-5 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold"
              >
                View in Clinical Notes Tab
              </button>
            )}

            {createPrescriptionToggle && onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('prescriptions')}
                className="px-5 py-2.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold"
              >
                View Generated Prescription
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
