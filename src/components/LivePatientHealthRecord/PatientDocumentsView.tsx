import React, { useState, useRef } from 'react';
import {
  FileText,
  Upload,
  Sparkles,
  Download,
  Eye,
  Trash2,
  Paperclip,
  FlaskConical,
  Scan,
  Pill,
  Search,
  CheckCircle2,
  Calendar,
  User,
  ShieldCheck
} from 'lucide-react';
import { PatientTimelineEntry, EntryAttachment } from '../../types.js';

interface PatientDocumentsViewProps {
  entries: PatientTimelineEntry[];
  patientName: string;
  uhid: string;
  onOpenUploadModal: () => void;
  onPreviewDocument: (attachment: EntryAttachment) => void;
  onDeleteDocument?: (entryId: string) => void;
}

export const PatientDocumentsView: React.FC<PatientDocumentsViewProps> = ({
  entries,
  patientName,
  uhid,
  onOpenUploadModal,
  onPreviewDocument,
  onDeleteDocument
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Extract all attachments from entries
  const allAttachments: Array<{
    attachment: EntryAttachment;
    entry: PatientTimelineEntry;
  }> = [];

  entries.forEach(entry => {
    if (entry.attachments && entry.attachments.length > 0) {
      entry.attachments.forEach(att => {
        allAttachments.push({
          attachment: att,
          entry
        });
      });
    }
  });

  const handleDelete = (entryId: string, fileName: string) => {
    if (window.confirm(`Are you sure you want to delete "${fileName}" and its associated record from this patient's chart?`)) {
      if (onDeleteDocument) {
        onDeleteDocument(entryId);
      }
    }
  };

  const filteredAttachments = allAttachments.filter(({ attachment, entry }) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      attachment.name.toLowerCase().includes(q) ||
      entry.title.toLowerCase().includes(q) ||
      entry.entryType.toLowerCase().includes(q) ||
      entry.authorName.toLowerCase().includes(q);

    const matchesType =
      typeFilter === 'All' ||
      (typeFilter === 'PDF' && (attachment.type.includes('pdf') || attachment.name.endsWith('.pdf'))) ||
      (typeFilter === 'Image' && (attachment.type.includes('image') || attachment.name.match(/\.(jpg|jpeg|png|webp)$/i))) ||
      (typeFilter === 'Lab' && entry.entryType === 'Lab Result') ||
      (typeFilter === 'Imaging' && entry.entryType === 'Imaging / Radiology Report');

    return matchesSearch && matchesType;
  });

  return (
    <div id="patient-documents-view" className="space-y-4">
      {/* Header & Upload Action */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-blue-600 uppercase tracking-wider mb-0.5">
            <Paperclip className="w-4 h-4" /> Medical Files & Diagnostic Documents
          </div>
          <h3 className="text-lg font-extrabold text-slate-900">
            Uploaded Documents & Diagnostic Reports
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Uploaded PDFs, lab reports, radiology scans, and clinical paperwork for {patientName} ({uhid}).
          </p>
        </div>

        <button
          id="upload-doc-tab-btn"
          onClick={onOpenUploadModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer shrink-0"
        >
          <Upload className="w-4 h-4" /> Upload Document
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search uploaded documents, test names, authors..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs outline-hidden font-medium"
          >
            <option value="All">All Document Types ({allAttachments.length})</option>
            <option value="PDF">PDF Documents</option>
            <option value="Image">Radiology & Images (JPG/PNG)</option>
            <option value="Lab">Lab Reports</option>
            <option value="Imaging">Imaging Reports</option>
          </select>
        </div>
      </div>

      {/* Document Grid / List */}
      {allAttachments.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
            <FileText className="w-7 h-7" />
          </div>
          <h4 className="font-bold text-slate-800 text-base">No Medical Documents Uploaded Yet</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Upload diagnostic PDFs, laboratory report sheets (JPG, PNG), discharge summaries, or radiology scans to automatically perform AI analysis and attach them to this patient's digital chart.
          </p>
          <div className="pt-2">
            <button
              onClick={onOpenUploadModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
            >
              <Upload className="w-4 h-4" /> Upload Document
            </button>
          </div>
        </div>
      ) : filteredAttachments.length === 0 ? (
        <div className="bg-white p-8 text-center rounded-2xl border border-slate-200 text-xs text-slate-500">
          No documents matching "{searchQuery}" found.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAttachments.map(({ attachment, entry }, idx) => {
            const isImage = attachment.type.includes('image') || attachment.name.match(/\.(jpg|jpeg|png|webp)$/i);
            const isPdf = attachment.type.includes('pdf') || attachment.name.endsWith('.pdf');

            return (
              <div
                key={idx}
                className="bg-white p-5 rounded-2xl border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all space-y-3 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                        {isPdf ? (
                          <FileText className="w-5 h-5" />
                        ) : isImage ? (
                          <Scan className="w-5 h-5" />
                        ) : (
                          <Paperclip className="w-5 h-5" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-900 line-clamp-1">
                          {attachment.name}
                        </h4>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5">
                          <span className="font-medium text-slate-600">{entry.entryType}</span>
                          <span>•</span>
                          <span>{attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB` : 'Document'}</span>
                        </div>
                      </div>
                    </div>

                    <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-semibold">
                      {isPdf ? 'PDF' : isImage ? 'IMAGE' : 'DOC'}
                    </span>
                  </div>

                  {/* Context from entry */}
                  <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 text-[11px] text-slate-600 line-clamp-2">
                    <strong className="text-slate-800">{entry.title}: </strong>
                    {entry.content}
                  </div>

                  {/* Extracted Tests Badge count if any */}
                  {entry.structuredData?.tests && entry.structuredData.tests.length > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded-lg">
                      <FlaskConical className="w-3 h-3" />
                      {entry.structuredData.tests.length} extracted lab parameters in chart
                    </div>
                  )}
                </div>

                {/* Actions: Preview, Download, Delete */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] text-slate-400">
                    Uploaded: {new Date(entry.timestamp).toLocaleDateString()}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {/* Preview Button */}
                    <button
                      onClick={() => onPreviewDocument(attachment)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                      title="Preview Document"
                    >
                      <Eye className="w-3.5 h-3.5" /> Preview
                    </button>

                    {/* Download Button */}
                    {(attachment.dataUrl || attachment.url) && (
                      <a
                        href={attachment.dataUrl || attachment.url}
                        download={attachment.name}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                        title="Download Document"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    )}

                    {/* Delete Action Button */}
                    {onDeleteDocument && (
                      <button
                        onClick={() => handleDelete(entry.id, attachment.name)}
                        className="inline-flex items-center gap-1 px-2 py-1.5 text-[11px] font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        title="Delete Document & Entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
