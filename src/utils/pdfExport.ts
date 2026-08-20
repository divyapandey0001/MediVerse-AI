import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  Prescription,
  LabReportAnalysis,
  ClinicalNote,
  User,
  BmiRecord,
  ReportComparisonResult,
  LivePatientRecord,
  PatientTimelineEntry,
  LivePatientAiSummary
} from '../types.js';

export function downloadPrescriptionPDF(prescription: Prescription): void {
  const doc = new jsPDF();

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

export function downloadReportPDF(report: LabReportAnalysis): void {
  const doc = new jsPDF();

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

export function downloadHealthSummaryPDF(
  user: User,
  reports: LabReportAnalysis[],
  prescriptions: Prescription[],
  notes: ClinicalNote[],
  bmiRecords: BmiRecord[]
): void {
  const doc = new jsPDF();

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

export function downloadReportComparisonPDF(comparison: ReportComparisonResult): void {
  const doc = new jsPDF();

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

export function downloadLivePatientRecordPDF(
  patient: LivePatientRecord,
  entries: PatientTimelineEntry[],
  summary: LivePatientAiSummary | null
): void {
  const doc = new jsPDF();

  // Header Banner
  doc.setFillColor(30, 64, 175); // Royal blue
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('MediVerse Health — Continuous Inpatient Chart', 14, 18);

  doc.setFontSize(9.5);
  doc.setFont('helvetica', 'normal');
  doc.text('Live Electronic Medical Record (EMR) & Clinical Timeline', 14, 26);
  doc.text(`UHID / Patient ID: ${patient.uhid}`, 130, 18);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 130, 26);
  doc.text(`Admission Status: ${patient.status.toUpperCase()}`, 130, 34);

  // Demographics Grid
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('PATIENT DEMOGRAPHICS & ADMISSION DATA', 14, 50);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`Patient Name: ${patient.patientName}`, 14, 57);
  doc.text(`Age / Gender: ${patient.patientAge} Years / ${patient.patientGender}`, 14, 63);
  doc.text(`Blood Group: ${patient.bloodGroup || 'Not Specified'}`, 14, 69);
  doc.text(`Documented Allergies: ${patient.allergies || 'No Known Drug Allergies (NKDA)'}`, 14, 75);

  doc.text(`Department: ${patient.department}`, 115, 57);
  doc.text(`Attending Doctor: ${patient.attendingDoctor}`, 115, 63);
  doc.text(`Bed / Ward: ${patient.bedRoomNo || 'General Inpatient'}`, 115, 69);
  doc.text(`Admission Date: ${new Date(patient.admissionDateTime).toLocaleString()}`, 115, 75);

  // Reason for admission
  doc.setFillColor(241, 245, 249);
  doc.roundedRect(14, 80, 182, 14, 2, 2, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 64, 175);
  doc.text('REASON FOR ADMISSION:', 18, 88);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  const reasonLines = doc.splitTextToSize(patient.reasonForAdmission, 125);
  doc.text(reasonLines, 70, 88);

  let currentY = 102;

  // AI Current Summary Section if available
  if (summary) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 64, 175);
    doc.text('AI CURRENT CLINICAL SYNTHESIS', 14, currentY);
    currentY += 6;

    // Diagnoses & Status Box
    const diagnosesText = (summary.documentedDiagnoses || []).map(d => `${d.diagnosis} (${d.type} - ${d.status})`).join(', ') || 'Under clinical evaluation';
    const medsText = (summary.currentMedications || []).map(m => `${m.name} ${m.dosage} (${m.frequency})`).join(', ') || 'None documented';

    const briefSynthesis = summary.secondOpinionBrief?.synthesis
      ? summary.secondOpinionBrief.synthesis
      : typeof summary.reasonForAdmission === 'string'
      ? summary.reasonForAdmission
      : summary.reasonForAdmission?.statement || 'Clinical evaluation ongoing.';

    const summaryTable: string[][] = [
      ['Documented Diagnoses', diagnosesText],
      ['Active Medications', medsText],
      ['Vital Trends & Status', `${summary.currentDocumentedStatus?.clinicalCondition || 'Stable'} — ${summary.currentDocumentedStatus?.vitalTrends || 'Monitoring ongoing'}`],
      ['Clinical Brief / Synthesis', briefSynthesis]
    ];

    autoTable(doc, {
      startY: currentY,
      head: [['Category', 'Synthesized Clinical Information']],
      body: summaryTable,
      theme: 'grid',
      headStyles: { fillColor: [30, 64, 175], fontSize: 8.5, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: [30, 41, 59] },
      columnStyles: {
        0: { cellWidth: 50, fontStyle: 'bold' },
        1: { cellWidth: 132 }
      }
    });

    currentY = (doc as any).lastAutoTable.finalY + 10;
  }

  // Check if we need new page for timeline
  if (currentY > 220) {
    doc.addPage();
    currentY = 20;
  }

  // Chronological Timeline Entries Table
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 41, 59);
  doc.text(`CHRONOLOGICAL CLINICAL TIMELINE (${entries.length} RECORDS)`, 14, currentY);
  currentY += 6;

  const timelineRows = entries.map((entry, idx) => {
    const timeStr = new Date(entry.timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    return [
      (idx + 1).toString(),
      timeStr,
      entry.entryType,
      entry.title,
      entry.content.length > 100 ? `${entry.content.substring(0, 97)}...` : entry.content,
      `${entry.authorName} (${entry.authorRole})`
    ];
  });

  autoTable(doc, {
    startY: currentY,
    head: [['#', 'Date & Time', 'Entry Type', 'Clinical Title', 'Notes & Impression', 'Staff / Author']],
    body: timelineRows.length > 0 ? timelineRows : [['-', '-', '-', 'No timeline entries recorded yet', '-', '-']],
    theme: 'striped',
    headStyles: { fillColor: [51, 65, 85], fontSize: 8, fontStyle: 'bold' },
    bodyStyles: { fontSize: 7.5, textColor: [30, 41, 59] },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 26 },
      2: { cellWidth: 32 },
      3: { cellWidth: 40 },
      4: { cellWidth: 46 },
      5: { cellWidth: 30 }
    }
  });

  const finalY = (doc as any).lastAutoTable.finalY + 12;

  // Add footer disclaimer
  if (finalY > 270) {
    doc.addPage();
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Medical Disclaimer: Live Patient Health Records are generated for clinical documentation and decision support. Final care decisions remain with qualified hospital staff.',
      14,
      285
    );
  } else {
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'Medical Disclaimer: Live Patient Health Records are generated for clinical documentation and decision support. Final care decisions remain with qualified hospital staff.',
      14,
      285
    );
  }

  doc.save(`Patient_Record_${patient.uhid}_${new Date().toISOString().split('T')[0]}.pdf`);
}
