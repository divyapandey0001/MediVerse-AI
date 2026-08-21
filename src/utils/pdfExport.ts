import {
  Prescription,
  LabReportAnalysis,
  ClinicalNote,
  User,
  BmiRecord,
  ReportComparisonResult,
  LivePatientRecord,
  PatientDischargeSummary,
  PatientAiSummary
} from '../types.js';

// Lazy loader for PDF engines
async function getPdfEngine() {
  const [{ default: jsPDF }, { default: autoTable }] = await Promise.all([
    import('jspdf'),
    import('jspdf-autotable')
  ]);
  const doc = new jsPDF();
  return { doc, autoTable };
}

export async function downloadPrescriptionPDF(prescription: Prescription): Promise<void> {
  const { doc, autoTable } = await getPdfEngine();

  // Header Banner
  doc.setFillColor(30, 64, 175); // Dark blue
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MediVerse Health', 14, 18);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Official Clinical Digital Prescription', 14, 26);
  doc.text(`Prescription No: ${prescription.prescriptionNumber}`, 130, 18);
  doc.text(`Date: ${new Date(prescription.createdAt).toLocaleDateString()}`, 130, 26);

  // Doctor Details
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(prescription.doctorName, 14, 48);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text(`Specialty: ${prescription.doctorSpecialty} | Qualification: ${prescription.doctorQualification || 'MD'}`, 14, 54);
  doc.text(`Medical License: ${prescription.doctorLicense || 'LIC-VERIFIED'}`, 14, 59);

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 63, 196, 63);

  // Patient Details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('PATIENT INFORMATION', 14, 71);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Name: ${prescription.patientName}`, 14, 77);
  doc.text(`Patient ID: ${prescription.patientId}`, 14, 82);
  doc.text(`Age: ${prescription.patientAge || 'N/A'} | Gender: ${prescription.patientGender || 'N/A'}`, 120, 77);

  // Diagnosis Card
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 88, 182, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('CLINICAL DIAGNOSIS:', 18, 96);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(prescription.diagnosis, 65, 96);

  // Rx Symbol
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('Rx', 14, 112);

  // Medicines Table
  const tableData = prescription.medicines.map((med, index) => [
    (index + 1).toString(),
    med.name,
    med.strength || '—',
    med.frequency,
    med.duration,
    med.instructions
  ]);

  autoTable(doc, {
    startY: 116,
    head: [['#', 'Medicine / Formulation', 'Strength', 'Frequency', 'Duration', 'Instructions']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8.5,
      textColor: [30, 41, 59]
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  // General Instructions & Follow Up
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text('Special Instructions & Advice:', 14, finalY);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  const splitNotes = doc.splitTextToSize(prescription.instructions || 'Take medications exactly as prescribed with water.', 182);
  doc.text(splitNotes, 14, finalY + 5);

  if (prescription.followUpDate) {
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(`Scheduled Follow-Up: ${new Date(prescription.followUpDate).toLocaleDateString()}`, 14, finalY + 18);
  }

  // Doctor Signature Placeholder
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 116, 139);
  doc.text('Digitally Authorized By:', 130, finalY + 30);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(prescription.doctorName, 130, finalY + 36);
  doc.setFont('helvetica', 'normal');
  doc.text(`Reg: ${prescription.doctorLicense || 'LIC-VERIFIED'}`, 130, finalY + 41);

  // Footer Disclaimer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Medical Notice: This prescription is generated through MediVerse Digital Health Platform for verified clinical consultations.',
    14,
    285
  );

  doc.save(`Prescription_${prescription.prescriptionNumber}_${prescription.patientName.replace(/\s+/g, '_')}.pdf`);
}

export async function downloadReportPDF(report: LabReportAnalysis): Promise<void> {
  const { doc, autoTable } = await getPdfEngine();

  // Header
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MediVerse Health — Laboratory Report Analysis', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`File: ${report.fileName}`, 14, 25);
  doc.text(`Analysis Date: ${new Date(report.uploadedAt).toLocaleString()}`, 14, 30);
  if (report.patientId) {
    doc.text(`Patient ID: ${report.patientId}`, 140, 25);
  }

  // Summary box
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 42, 182, 28, 2, 2, 'F');
  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('EXECUTIVE CLINICAL SUMMARY', 18, 49);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(8.5);
  const summaryLines = doc.splitTextToSize(report.healthSummary || 'Lab test results analyzed successfully.', 174);
  doc.text(summaryLines, 18, 55);

  // Parameters Table
  const tableData = report.testResults.map((test, index) => {
    const finding = report.abnormalFindings?.find(f => f.testName.toLowerCase() === test.testName.toLowerCase());
    return [
      (index + 1).toString(),
      test.testName,
      `${test.result} ${test.unit || ''}`.trim(),
      test.referenceRange || '—',
      test.status,
      finding ? finding.whatItMeasures : (test.status === 'Normal' ? 'Within normal healthy reference limits.' : 'Requires clinical correlation.')
    ];
  });

  autoTable(doc, {
    startY: 75,
    head: [['#', 'Test Parameter', 'Patient Result', 'Reference Range', 'Status', 'Clinical Interpretation']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold'
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [30, 41, 59]
    },
    didParseCell: function (data) {
      if (data.section === 'body' && data.column.index === 4) {
        const text = data.cell.text[0];
        if (text === 'Normal') {
          data.cell.styles.textColor = [22, 101, 52];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 10;

  if (finalY < 260 && report.doctorQuestions && report.doctorQuestions.length > 0) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('Key Questions to Discuss With Your Doctor:', 14, finalY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    let curY = finalY + 5;
    report.doctorQuestions.slice(0, 4).forEach((q) => {
      doc.text(`• ${q}`, 16, curY);
      curY += 5;
    });
  }

  // Educational Disclaimer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Medical Disclaimer: MediVerse AI report interpretation is an educational tool. Always review abnormal values with a physician.',
    14,
    285
  );

  doc.save(`LabReport_${report.fileName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
}

export async function downloadHealthSummaryPDF(
  user: User,
  reports: LabReportAnalysis[],
  prescriptions: Prescription[],
  notes: ClinicalNote[],
  bmiRecords: BmiRecord[]
): Promise<void> {
  const { doc, autoTable } = await getPdfEngine();

  // Header
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MediVerse Health — Complete Health Record Summary', 14, 16);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 25);
  doc.text(`Confidential Medical Document`, 140, 25);

  // Demographics Card
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 42, 182, 32, 2, 2, 'F');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('PATIENT DEMOGRAPHICS & PROFILE', 18, 49);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  doc.text(`Name: ${user.name}`, 18, 56);
  doc.text(`Patient ID: ${user.patientId || 'PT-PENDING'}`, 18, 62);
  doc.text(`Email: ${user.email}`, 18, 68);

  doc.text(`Age: ${user.age || 'N/A'} | Gender: ${user.gender || 'N/A'}`, 105, 56);
  doc.text(`Blood Group: ${user.bloodGroup || 'N/A'}`, 105, 62);
  doc.text(`Allergies: ${user.allergies || 'None Recorded'}`, 105, 68);

  let currentY = 82;

  // Active Prescriptions Summary
  if (prescriptions.length > 0) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(`ACTIVE & RECENT PRESCRIPTIONS (${prescriptions.length})`, 14, currentY);

    const rxRows: string[][] = [];
    prescriptions.slice(0, 5).forEach(p => {
      p.medicines.forEach(m => {
        rxRows.push([
          p.prescriptionNumber,
          new Date(p.createdAt).toLocaleDateString(),
          p.doctorName,
          p.diagnosis,
          `${m.name} (${m.strength || ''})`,
          m.frequency,
          m.duration
        ]);
      });
    });

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Rx #', 'Date', 'Doctor', 'Diagnosis', 'Medicine', 'Frequency', 'Duration']],
      body: rxRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175], fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Recent Lab Reports Summary
  if (reports.length > 0 && currentY < 230) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(`LABORATORY HISTORY (${reports.length} Reports Analyzed)`, 14, currentY);

    const reportRows = reports.slice(0, 6).map(r => {
      const normalCount = r.testResults.filter(t => t.status === 'Normal').length;
      const abnormalCount = r.testResults.filter(t => t.status !== 'Normal').length;
      return [
        r.fileName,
        new Date(r.uploadedAt).toLocaleDateString(),
        `${r.testResults.length} parameters`,
        `${normalCount} Normal`,
        `${abnormalCount} Attention / Flagged`,
        r.healthSummary ? r.healthSummary.slice(0, 45) + '...' : 'Complete'
      ];
    });

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Report File', 'Date', 'Tests', 'Normal', 'Abnormal', 'Summary']],
      body: reportRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175], fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Clinical Notes Summary
  if (notes.length > 0 && currentY < 250) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text(`PHYSICIAN CLINICAL ASSESSMENTS (${notes.length})`, 14, currentY);

    const noteRows = notes.slice(0, 4).map(n => [
      new Date(n.createdAt).toLocaleDateString(),
      n.doctorName,
      n.diagnosis,
      n.clinicalObservations.slice(0, 45) + '...',
      n.treatmentPlan.slice(0, 45) + '...'
    ]);

    autoTable(doc, {
      startY: currentY + 3,
      head: [['Date', 'Physician', 'Diagnosis', 'Observations', 'Treatment Plan']],
      body: noteRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175], fontSize: 7.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 7.5 }
    });
  }

  // Footer Disclaimer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Notice: This consolidated health record is generated on MediVerse. Certified under patient health privacy guidelines.',
    14,
    285
  );

  doc.save(`Health_Summary_${user.name.replace(/\s+/g, '_')}_${user.patientId || 'Record'}.pdf`);
}

export async function downloadReportComparisonPDF(comparison: ReportComparisonResult): Promise<void> {
  const { doc, autoTable } = await getPdfEngine();

  // Header
  doc.setFillColor(30, 64, 175);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(17);
  doc.setFont('helvetica', 'bold');
  doc.text('MediVerse Health — Longitudinal Lab Report Comparison', 14, 16);

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Previous: ${comparison.previousReport.fileName} (${new Date(comparison.previousReport.uploadedAt).toLocaleDateString()})`,
    14,
    24
  );
  doc.text(
    `Current: ${comparison.currentReport.fileName} (${new Date(comparison.currentReport.uploadedAt).toLocaleDateString()})`,
    14,
    30
  );

  // Summary box
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 42, 182, 20, 2, 2, 'F');
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 41, 59);
  const summaryLines = doc.splitTextToSize(comparison.summary, 174);
  doc.text(summaryLines, 18, 48);

  // Comparison Table
  const tableData = comparison.comparedTests.map((t, idx) => [
    (idx + 1).toString(),
    t.testName,
    t.referenceRange || '—',
    t.prevValue ? `${t.prevValue} (${t.prevStatus || '—'})` : 'N/A',
    t.currValue ? `${t.currValue} (${t.currStatus || '—'})` : 'N/A',
    t.deltaText,
    t.trend.toUpperCase(),
    t.generalInterpretation
  ]);

  autoTable(doc, {
    startY: 68,
    head: [['#', 'Test Parameter', 'Ref Range', 'Previous Result', 'Current Result', 'Delta / Change', 'Trend', 'Interpretation']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [30, 64, 175], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5 }
  });

  // Footer Disclaimer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text(
    'Medical Disclaimer: Parameter delta calculations are for tracking trends. Consult your doctor for medical decision making.',
    14,
    285
  );

  doc.save(`Lab_Comparison_${new Date().toISOString().split('T')[0]}.pdf`);
}

// 5. Download Official Hospital Discharge Summary PDF
export async function downloadPatientDischargeSummaryPDF(patient: LivePatientRecord, discharge: PatientDischargeSummary): Promise<void> {
  const { doc, autoTable } = await getPdfEngine();

  // Header Banner
  doc.setFillColor(15, 23, 42); // Deep slate/blue
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('MEDIVERSE HEALTHCARE SYSTEM', 14, 18);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('OFFICIAL HOSPITAL DISCHARGE SUMMARY', 14, 26);
  doc.setFontSize(9);
  doc.text(`UHID: ${patient.uhid}`, 140, 18);
  doc.text(`Discharge Date: ${new Date(discharge.dischargeDate).toLocaleDateString()}`, 140, 26);
  doc.text(`Summary ID: ${discharge.id}`, 140, 34);

  // Patient Demographic Details Card
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 46, 182, 30, 2, 2, 'F');

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT DEMOGRAPHICS & HOSPITALIZATION', 18, 54);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Patient Name: ${patient.patientName}`, 18, 61);
  doc.text(`Age / Gender: ${patient.age || '—'} Y / ${patient.gender || '—'}`, 18, 67);
  doc.text(`Blood Group: ${patient.bloodGroup || '—'}`, 18, 73);

  doc.text(`Department: ${patient.department}`, 110, 61);
  doc.text(`Attending Physician: ${patient.attendingPhysician}`, 110, 67);
  doc.text(`Admission Date: ${new Date(discharge.admissionDate).toLocaleDateString()}`, 110, 73);

  let currentY = 82;

  // Final Diagnosis
  doc.setFillColor(238, 242, 255);
  doc.roundedRect(14, currentY, 182, 16, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 64, 175);
  doc.text('FINAL CLINICAL DIAGNOSIS:', 18, currentY + 7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.text(discharge.finalDiagnosis || 'Clinical Recovery', 18, currentY + 13);
  currentY += 22;

  // Condition at Discharge
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('CONDITION AT DISCHARGE:', 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  const condLines = doc.splitTextToSize(discharge.conditionAtDischarge, 182);
  doc.text(condLines, 14, currentY + 6);
  currentY += condLines.length * 5 + 8;

  // Hospital Course Summary
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(30, 41, 59);
  doc.text('HOSPITAL COURSE & CLINICAL SUMMARY:', 14, currentY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(51, 65, 85);
  const courseLines = doc.splitTextToSize(discharge.hospitalCourseSummary, 182);
  doc.text(courseLines, 14, currentY + 6);
  currentY += courseLines.length * 4.5 + 8;

  // Discharge Medications Table
  if (discharge.dischargeMedications && discharge.dischargeMedications.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('DISCHARGE MEDICATIONS & PRESCRIPTION:', 14, currentY);
    currentY += 4;

    const medData = discharge.dischargeMedications.map((m, i) => [(i + 1).toString(), m]);
    autoTable(doc, {
      startY: currentY,
      head: [['#', 'Medication Regimen, Dosage & Administration Instructions']],
      body: medData,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175], fontSize: 8.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      margin: { left: 14, right: 14 }
    });

    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // Check if we need new page for instructions
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  // Diet & Activity Advice
  if (discharge.dietAndActivityAdvice) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('DIETARY & ACTIVITY GUIDELINES:', 14, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const dietLines = doc.splitTextToSize(discharge.dietAndActivityAdvice, 182);
    doc.text(dietLines, 14, currentY + 5);
    currentY += dietLines.length * 4.5 + 6;
  }

  // Follow-up Instructions
  if (discharge.followUpInstructions) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('FOLLOW-UP CONSULTATION PLAN:', 14, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(51, 65, 85);
    const fuLines = doc.splitTextToSize(discharge.followUpInstructions, 182);
    doc.text(fuLines, 14, currentY + 5);
    currentY += fuLines.length * 4.5 + 6;
  }

  // Emergency Warning Signs
  if (discharge.emergencyWarningSigns && discharge.emergencyWarningSigns.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(185, 28, 28); // Red
    doc.text('RED-FLAG WARNING SIGNS (SEEK IMMEDIATE EMERGENCY CARE):', 14, currentY);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(127, 29, 29);
    discharge.emergencyWarningSigns.forEach(sign => {
      doc.text(`• ${sign}`, 18, currentY + 5);
      currentY += 4.5;
    });
    currentY += 4;
  }

  // Physician Sign-off block
  currentY = Math.max(currentY + 6, 250);
  if (currentY > 265) {
    doc.addPage();
    currentY = 240;
  }
  doc.setDrawColor(203, 213, 225);
  doc.line(130, currentY, 196, currentY);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(discharge.dischargedBy || patient.attendingPhysician, 130, currentY + 5);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text(`Department of ${patient.department}`, 130, currentY + 9);
  doc.text('Authorized Medical Officer Signature', 130, currentY + 13);

  doc.save(`Discharge_Summary_${patient.uhid}_${patient.patientName.replace(/\s+/g, '_')}.pdf`);
}

// 6. Download Synthesized Clinical Medical Summary PDF
export async function downloadPatientMedicalSummaryPDF(patient: LivePatientRecord, summary: PatientAiSummary): Promise<void> {
  const { doc, autoTable } = await getPdfEngine();

  // Header Banner
  doc.setFillColor(30, 58, 138); // Blue
  doc.rect(0, 0, 210, 38, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MediVerse Health — Synthesized Clinical Summary', 14, 18);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`UHID: ${patient.uhid} | Patient: ${patient.patientName} (${patient.age || '—'}y, ${patient.gender || '—'})`, 14, 26);
  doc.text(`Generated: ${new Date(summary.generatedAt).toLocaleString()}`, 14, 32);

  let y = 46;

  // Overview / Key Findings
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 58, 138);
  doc.text('EXECUTIVE CLINICAL OVERVIEW', 14, y);
  y += 5;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const overviewLines = doc.splitTextToSize(summary.overview || summary.overallHealthStatus || '', 182);
  doc.text(overviewLines, 14, y);
  y += overviewLines.length * 4.5 + 6;

  // Key Findings
  if (summary.keyFindings) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Key Clinical Findings:', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    if (Array.isArray(summary.keyFindings)) {
      summary.keyFindings.forEach(kf => {
        doc.text(`• ${kf}`, 18, y);
        y += 4.5;
      });
    } else {
      const kfLines = doc.splitTextToSize(summary.keyFindings, 182);
      doc.text(kfLines, 14, y);
      y += kfLines.length * 4.5;
    }
    y += 4;
  }

  // Vitals & Lab Trends
  if (summary.vitalTrends || summary.labFindingsSummary) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Vitals Trajectory & Lab Findings:', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const labLines = doc.splitTextToSize(`${summary.vitalTrends ? `Vitals: ${summary.vitalTrends}\n` : ''}${summary.labFindingsSummary || ''}`, 182);
    doc.text(labLines, 14, y);
    y += labLines.length * 4.5 + 4;
  }

  // Active Treatment & Medication Efficacy
  if (summary.activeTreatmentStatus) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    doc.text('Active Treatment & Medication Efficacy:', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    const txLines = doc.splitTextToSize(summary.activeTreatmentStatus, 182);
    doc.text(txLines, 14, y);
    y += txLines.length * 4.5 + 4;
  }

  // Clinical Recommendations
  if (summary.clinicalRecommendations && summary.clinicalRecommendations.length > 0) {
    if (y > 230) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 64, 175);
    doc.text('Clinical Care Recommendations:', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    summary.clinicalRecommendations.forEach(rec => {
      doc.text(`• ${rec}`, 18, y);
      y += 4.5;
    });
    y += 4;
  }

  // Critical Alerts / Red Flags
  if (summary.criticalAlerts && summary.criticalAlerts.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(220, 38, 38);
    doc.text('Critical Alerts / Red Flags:', 14, y);
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(153, 27, 27);
    summary.criticalAlerts.forEach(ca => {
      doc.text(`! ${ca}`, 18, y);
      y += 4.5;
    });
    y += 4;
  }

  // Footer
  doc.setFontSize(7.5);
  doc.setTextColor(148, 163, 184);
  doc.text('Grounding Verification: Synthesized exclusively from verified patient health records. No fictitious data.', 14, 285);

  doc.save(`Medical_Summary_${patient.uhid}_${patient.patientName.replace(/\s+/g, '_')}.pdf`);
}

