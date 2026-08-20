import React from 'react';
import { X, Download, FileText, ExternalLink, Paperclip } from 'lucide-react';
import { EntryAttachment } from '../../types.js';

interface DocumentViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  attachment: EntryAttachment | null;
  patientName: string;
}

export const DocumentViewerModal: React.FC<DocumentViewerModalProps> = ({
  isOpen,
  onClose,
  attachment,
  patientName
}) => {
  if (!isOpen || !attachment) return null;

  const isImage = attachment.type.includes('image') || (attachment.dataUrl && attachment.dataUrl.startsWith('data:image'));
  const isPdf = attachment.type.includes('pdf') || (attachment.dataUrl && attachment.dataUrl.startsWith('data:application/pdf'));

  const handleDownload = () => {
    if (!attachment.dataUrl && !attachment.url) return;
    const link = document.createElement('a');
    link.href = attachment.dataUrl || attachment.url || '#';
    link.download = attachment.name || `Medical_Document_${Date.now()}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="document-viewer-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 truncate max-w-md">
                {attachment.name}
              </h3>
              <p className="text-xs text-slate-500">
                Patient: <span className="font-semibold text-slate-700">{patientName}</span>
                {attachment.size ? ` • ${(attachment.size / 1024).toFixed(1)} KB` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" /> Download
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-slate-200 text-slate-400 hover:text-slate-600 flex items-center justify-center transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Viewer Body */}
        <div className="flex-1 overflow-y-auto p-4 flex items-center justify-center bg-slate-900/90 min-h-[400px]">
          {isImage && (attachment.dataUrl || attachment.url) ? (
            <img
              src={attachment.dataUrl || attachment.url}
              alt={attachment.name}
              className="max-h-[75vh] max-w-full object-contain rounded-xl shadow-lg"
              referrerPolicy="no-referrer"
            />
          ) : isPdf && (attachment.dataUrl || attachment.url) ? (
            <iframe
              src={attachment.dataUrl || attachment.url}
              title={attachment.name}
              className="w-full h-[70vh] rounded-xl border border-slate-700 bg-white"
            />
          ) : (
            <div className="text-center p-12 text-white space-y-3">
              <Paperclip className="w-12 h-12 mx-auto text-slate-400" />
              <p className="font-bold text-sm">Document Preview</p>
              <p className="text-xs text-slate-400 max-w-sm">
                This document ({attachment.name}) is securely stored with this patient's digital health record.
              </p>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-md"
              >
                <Download className="w-4 h-4" /> Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
