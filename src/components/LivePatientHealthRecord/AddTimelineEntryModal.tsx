import React, { useState } from 'react';
import {
  X,
  FileText,
  FlaskConical,
  Scan,
  Pill,
  HeartPulse,
  Stethoscope,
  Users,
  LogOut,
  Paperclip,
  Plus,
  Trash2,
  AlertCircle,
  Upload,
  CheckCircle2
} from 'lucide-react';
import {
  PatientTimelineEntry,
  TimelineEntryType,
  LabTestItem,
  MedicationOrderItem,
  VitalsData
} from '../../types.js';

interface AddTimelineEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  patientRecordId: string;
  uhid: string;
  patientName: string;
  defaultAuthorName?: string;
  initialEntryType?: string;
  onEntryAdded: (newEntry: PatientTimelineEntry) => void;
}

export const AddTimelineEntryModal: React.FC<AddTimelineEntryModalProps> = ({
  isOpen,
  onClose,
  patientRecordId,
  uhid,
  patientName,
  defaultAuthorName = 'Dr. Staff, MD',
  initialEntryType,
  onEntryAdded
}) => {
  const [entryType, setEntryType] = useState<TimelineEntryType>(
    (initialEntryType as TimelineEntryType) || 'Doctor / Progress Note'
  );

  React.useEffect(() => {
    if (initialEntryType) {
      setEntryType(initialEntryType as TimelineEntryType);
    }
  }, [initialEntryType]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [authorName, setAuthorName] = useState(defaultAuthorName);
  const [authorRole, setAuthorRole] = useState('Attending Physician');
  const [isCritical, setIsCritical] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Structured Lab Tests
  const [labTests, setLabTests] = useState<LabTestItem[]>([]);

  // Structured Medications
  const [medications, setMedications] = useState<MedicationOrderItem[]>([]);

  // Structured Vitals
  const [vitals, setVitals] = useState<VitalsData>({
    bp: '',
    pulse: '',
    temp: '',
    spo2: '',
    rr: ''
  });

  // Structured Imaging
  const [imagingModality, setImagingModality] = useState('X-Ray');
  const [imagingImpression, setImagingImpression] = useState('');

  // Attachments
  const [attachments, setAttachments] = useState<Array<{ name: string; type: 'pdf' | 'image' | 'doc'; size?: string; dataUrl?: string }>>([]);

  if (!isOpen) return null;

  const entryTypeOptions: Array<{ type: TimelineEntryType; label: string; icon: any; color: string }> = [
    { type: 'Doctor / Progress Note', label: 'Doctor Note', icon: FileText, color: 'text-blue-600' },
    { type: 'Lab Result', label: 'Lab Result', icon: FlaskConical, color: 'text-emerald-600' },
    { type: 'Imaging / Radiology Report', label: 'Imaging / Radiology', icon: Scan, color: 'text-purple-600' },
    { type: 'Medication Admin / Order', label: 'Medication Order', icon: Pill, color: 'text-amber-600' },
    { type: 'Nursing Note / Vitals', label: 'Nursing / Vitals', icon: HeartPulse, color: 'text-rose-600' },
    { type: 'Procedure / Treatment', label: 'Procedure / Rx', icon: Stethoscope, color: 'text-indigo-600' },
    { type: 'Consultation Note', label: 'Consultation', icon: Users, color: 'text-teal-600' },
    { type: 'Discharge Information', label: 'Discharge Info', icon: LogOut, color: 'text-orange-600' },
    { type: 'Document / Attachment', label: 'Document / Photo', icon: Paperclip, color: 'text-slate-600' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      const isPdf = file.type.includes('pdf');
      const isImg = file.type.includes('image');

      reader.onload = () => {
        setAttachments(prev => [
          ...prev,
          {
            name: file.name,
            type: isPdf ? 'pdf' : isImg ? 'image' : 'doc',
            size: `${(file.size / 1024).toFixed(1)} KB`,
            dataUrl: reader.result as string
          }
        ]);
      };
      reader.readAsDataURL(file);
    }
  };

  const addLabTestRow = () => {
    setLabTests(prev => [
      ...prev,
      { testName: '', result: '', unit: '', referenceRange: '', status: 'Normal' }
    ]);
  };

  const removeLabTestRow = (idx: number) => {
    setLabTests(prev => prev.filter((_, i) => i !== idx));
  };

  const addMedRow = () => {
    setMedications(prev => [
      ...prev,
      { name: '', dose: '', frequency: 'Once daily', route: 'Oral', action: 'Started', instructions: '' }
    ]);
  };

  const removeMedRow = (idx: number) => {
    setMedications(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!title.trim()) {
      setErrorMessage('Please enter an entry title.');
      return;
    }
    if (!content.trim()) {
      setErrorMessage('Please write the clinical notes or findings description.');
      return;
    }

    setIsSubmitting(true);

    try {
      // Build structured data based on entry type
      const structuredData: any = {};
      if (entryType === 'Lab Result') {
        structuredData.tests = labTests.filter(t => t.testName.trim().length > 0);
      } else if (entryType === 'Medication Admin / Order' || entryType === 'Prescription') {
        structuredData.medications = medications.filter(m => m.name.trim().length > 0);
      } else if (entryType === 'Nursing Note / Vitals') {
        structuredData.vitals = vitals;
      } else if (entryType === 'Imaging / Radiology Report') {
        structuredData.imagingModality = imagingModality;
        structuredData.impression = imagingImpression || content;
      }

      const res = await fetch(`/api/live-records/${patientRecordId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          entryType,
          title: title.trim(),
          content: content.trim(),
          authorName: authorName.trim() || 'Authorized Staff',
          authorRole: authorRole.trim() || 'Staff Physician',
          structuredData,
          attachments,
          isCritical,
          timestamp: new Date().toISOString()
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to record entry');
      }

      onEntryAdded(data.entry);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred while saving the clinical entry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6">
      <div
        id="add-timeline-entry-modal"
        className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-700 to-indigo-800 text-white flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-blue-200">
              Live Clinical Documentation
            </span>
            <h2 className="text-lg font-bold text-white">Add Patient Timeline Entry</h2>
            <p className="text-xs text-blue-100 mt-0.5">
              Patient: <strong className="text-white">{patientName}</strong> | UHID: <span className="font-mono">{uhid}</span>
            </p>
          </div>
          <button
            id="close-add-entry-modal-btn"
            onClick={onClose}
            className="p-2 rounded-xl text-blue-100 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-6 flex-1">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Entry Type Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Select Clinical Entry Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {entryTypeOptions.map(opt => {
                const Icon = opt.icon;
                const isSelected = entryType === opt.type;
                return (
                  <button
                    key={opt.type}
                    type="button"
                    onClick={() => {
                      setEntryType(opt.type);
                      if (!title || title.startsWith('Progress') || title.startsWith('Lab') || title.startsWith('Imaging') || title.startsWith('Vitals')) {
                        setTitle(
                          opt.type === 'Doctor / Progress Note' ? 'Progress Note - Clinical Round' :
                          opt.type === 'Lab Result' ? 'Routine Biochemistry / Hematology' :
                          opt.type === 'Imaging / Radiology Report' ? 'Diagnostic Imaging Report' :
                          opt.type === 'Medication Admin / Order' ? 'Inpatient Medication Order' :
                          opt.type === 'Nursing Note / Vitals' ? 'Nursing Vitals & Shift Assessment' :
                          opt.type === 'Procedure / Treatment' ? 'Bedside Clinical Procedure' :
                          opt.type === 'Consultation Note' ? 'Specialist Consultation Note' :
                          opt.type === 'Discharge Information' ? 'Hospital Discharge Summary' : 'Clinical Document & Scans'
                        );
                      }
                    }}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-left text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-500/20 shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isSelected ? 'text-blue-600' : opt.color}`} />
                    <span className="truncate">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Entry Title & Critical Flag */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Entry Title <span className="text-rose-500">*</span>
              </label>
              <input
                id="entry-title-input"
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Daily Progress Round, Serum Electrolytes, Chest CT"
                className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden text-slate-900"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Priority / Critical
              </label>
              <label className="flex items-center gap-2.5 px-3.5 py-2.5 border border-slate-300 rounded-xl bg-slate-50 hover:bg-slate-100 cursor-pointer transition-colors">
                <input
                  type="checkbox"
                  checked={isCritical}
                  onChange={e => setIsCritical(e.target.checked)}
                  className="w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-slate-300"
                />
                <span className={`text-xs font-semibold ${isCritical ? 'text-rose-700' : 'text-slate-700'}`}>
                  {isCritical ? 'High Alert / Critical' : 'Routine Priority'}
                </span>
              </label>
            </div>
          </div>

          {/* Author Name & Role */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Author / Doctor Name
              </label>
              <input
                type="text"
                value={authorName}
                onChange={e => setAuthorName(e.target.value)}
                placeholder="e.g. Dr. Marcus Vance, MD"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden text-slate-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Role / Department
              </label>
              <input
                type="text"
                value={authorRole}
                onChange={e => setAuthorRole(e.target.value)}
                placeholder="e.g. Attending Cardiologist, Staff Nurse, Radiologist"
                className="w-full px-3.5 py-2 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden text-slate-900"
              />
            </div>
          </div>

          {/* Type-Specific Structured Inputs */}
          {entryType === 'Lab Result' && (
            <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-emerald-600" /> Lab Test Parameters
                </span>
                <button
                  type="button"
                  onClick={addLabTestRow}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Test
                </button>
              </div>

              <div className="space-y-2">
                {labTests.map((test, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-emerald-100">
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Test Name (e.g. Potassium)"
                        value={test.testName}
                        onChange={e => {
                          const updated = [...labTests];
                          updated[idx].testName = e.target.value;
                          setLabTests(updated);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:bg-white focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Result"
                        value={test.result}
                        onChange={e => {
                          const updated = [...labTests];
                          updated[idx].result = e.target.value;
                          setLabTests(updated);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:bg-white focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Unit (e.g. mmol/L)"
                        value={test.unit}
                        onChange={e => {
                          const updated = [...labTests];
                          updated[idx].unit = e.target.value;
                          setLabTests(updated);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:bg-white focus:ring-1 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <select
                        value={test.status}
                        onChange={e => {
                          const updated = [...labTests];
                          updated[idx].status = e.target.value as any;
                          setLabTests(updated);
                        }}
                        className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden"
                      >
                        <option value="Normal">Normal</option>
                        <option value="High">High</option>
                        <option value="Low">Low</option>
                        <option value="Critical">Critical</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2 flex justify-end">
                      {labTests.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeLabTestRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entryType === 'Medication Admin / Order' && (
            <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1.5">
                  <Pill className="w-4 h-4 text-amber-600" /> Prescribed Medications
                </span>
                <button
                  type="button"
                  onClick={addMedRow}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Medication
                </button>
              </div>

              <div className="space-y-2">
                {medications.map((med, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white p-2.5 rounded-xl border border-amber-100">
                    <div className="sm:col-span-3">
                      <input
                        type="text"
                        placeholder="Drug Name (e.g. Atorvastatin)"
                        value={med.name}
                        onChange={e => {
                          const updated = [...medications];
                          updated[idx].name = e.target.value;
                          setMedications(updated);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Dose (e.g. 40 mg)"
                        value={med.dose}
                        onChange={e => {
                          const updated = [...medications];
                          updated[idx].dose = e.target.value;
                          setMedications(updated);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Freq (e.g. Once daily)"
                        value={med.frequency}
                        onChange={e => {
                          const updated = [...medications];
                          updated[idx].frequency = e.target.value;
                          setMedications(updated);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:bg-white"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <select
                        value={med.action}
                        onChange={e => {
                          const updated = [...medications];
                          updated[idx].action = e.target.value as any;
                          setMedications(updated);
                        }}
                        className="w-full px-2 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden"
                      >
                        <option value="Started">Started (New)</option>
                        <option value="Modified">Modified (Dose)</option>
                        <option value="Continued">Continued</option>
                        <option value="Discontinued">Discontinued</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <input
                        type="text"
                        placeholder="Instructions"
                        value={med.instructions || ''}
                        onChange={e => {
                          const updated = [...medications];
                          updated[idx].instructions = e.target.value;
                          setMedications(updated);
                        }}
                        className="w-full px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg outline-hidden focus:bg-white"
                      />
                    </div>
                    <div className="sm:col-span-1 flex justify-end">
                      {medications.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMedRow(idx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {entryType === 'Nursing Note / Vitals' && (
            <div className="p-4 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-800 flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600" /> Recorded Vital Signs
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Blood Pressure</label>
                  <input
                    type="text"
                    value={vitals.bp || ''}
                    onChange={e => setVitals({ ...vitals, bp: e.target.value })}
                    placeholder="120/80 mmHg"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-200 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Heart Rate</label>
                  <input
                    type="text"
                    value={vitals.pulse || ''}
                    onChange={e => setVitals({ ...vitals, pulse: e.target.value })}
                    placeholder="76 bpm"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-200 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Temperature</label>
                  <input
                    type="text"
                    value={vitals.temp || ''}
                    onChange={e => setVitals({ ...vitals, temp: e.target.value })}
                    placeholder="37.0 °C"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-200 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">SpO2 Oxygen</label>
                  <input
                    type="text"
                    value={vitals.spo2 || ''}
                    onChange={e => setVitals({ ...vitals, spo2: e.target.value })}
                    placeholder="98%"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-200 rounded-lg outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Resp. Rate</label>
                  <input
                    type="text"
                    value={vitals.rr || ''}
                    onChange={e => setVitals({ ...vitals, rr: e.target.value })}
                    placeholder="16 /min"
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-rose-200 rounded-lg outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {entryType === 'Imaging / Radiology Report' && (
            <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl space-y-3">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-800 flex items-center gap-1.5">
                <Scan className="w-4 h-4 text-purple-600" /> Imaging Modality & Impression
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Modality</label>
                  <select
                    value={imagingModality}
                    onChange={e => setImagingModality(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded-lg outline-hidden"
                  >
                    <option value="Chest X-Ray (PA View)">Chest X-Ray (PA View)</option>
                    <option value="CT Scan Chest / Abdomen">CT Scan Chest / Abdomen</option>
                    <option value="MRI Brain / Spine">MRI Brain / Spine</option>
                    <option value="Ultrasound Abdomen / Pelvis">Ultrasound Abdomen / Pelvis</option>
                    <option value="2D Echocardiography">2D Echocardiography</option>
                    <option value="Coronary Angiography">Coronary Angiography</option>
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Radiological Impression</label>
                  <input
                    type="text"
                    value={imagingImpression}
                    onChange={e => setImagingImpression(e.target.value)}
                    placeholder="e.g. Mild bilateral basilar subsegmental atelectasis. No acute consolidation."
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-purple-200 rounded-lg outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Clinical Findings / Progress Notes Textarea */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Clinical Findings & Detailed Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="entry-content-textarea"
              rows={4}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Enter comprehensive clinical narrative, examination observations, assessment, and treatment orders..."
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all outline-hidden text-slate-900"
              required
            />
          </div>

          {/* Optional Attachments / Documents / Scans Upload */}
          <div className="border border-dashed border-slate-300 rounded-2xl p-4 bg-slate-50/60">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Paperclip className="w-4 h-4 text-slate-500" /> Optional Attached Documents & Photos
              </span>
              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white border border-slate-300 text-slate-700 rounded-xl hover:bg-slate-100 cursor-pointer transition-colors shadow-2xs">
                <Upload className="w-3.5 h-3.5 text-blue-600" /> Browse PDF / Image
                <input
                  type="file"
                  multiple
                  accept="image/*,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {attachments.length === 0 ? (
              <p className="text-xs text-slate-500">
                Staff can optionally attach lab PDFs, ECG tracings, clinical photos, or scanned paper forms directly to this timeline entry. (Direct digital entry is fully supported without uploads).
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {attachments.map((att, i) => (
                  <div
                    key={i}
                    className="inline-flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 shadow-2xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="max-w-[150px] truncate">{att.name}</span>
                    <span className="text-[10px] text-slate-400">({att.size})</span>
                    <button
                      type="button"
                      onClick={() => setAttachments(prev => prev.filter((_, idx) => idx !== i))}
                      className="text-slate-400 hover:text-rose-600 transition-colors ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              id="submit-timeline-entry-btn"
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 rounded-xl shadow-md shadow-blue-500/20 transition-all disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Saving to Timeline...' : 'Save to Patient Timeline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
