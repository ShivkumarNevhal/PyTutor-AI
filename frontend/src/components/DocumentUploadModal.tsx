import React, { useState, useRef } from 'react';
import { X, UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { uploadPdfDocument } from '../services/api';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: (filename: string) => void;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUploadSuccess,
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      if (!selected.name.toLowerCase().endsWith('.pdf')) {
        setStatusMessage({
          type: 'error',
          text: 'Please choose a PDF document.',
        });
        return;
      }
      setFile(selected);
      setStatusMessage(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const dropped = e.dataTransfer.files[0];
      if (!dropped.name.toLowerCase().endsWith('.pdf')) {
        setStatusMessage({
          type: 'error',
          text: 'Only PDF documents are supported.',
        });
        return;
      }
      setFile(dropped);
      setStatusMessage(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setIsUploading(true);
    setStatusMessage(null);

    try {
      const res = await uploadPdfDocument(file);
      setStatusMessage({
        type: 'success',
        text: `Indexed ${res.filename} (${res.chunks_added} chunks added to ChromaDB).`,
      });
      onUploadSuccess(file.name);
      setFile(null);
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Failed to index document.',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#111726] border border-slate-700/80 rounded-2xl shadow-2xl p-6 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400 border border-brand-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-white text-base">Upload Document</h3>
              <p className="text-xs text-slate-400">Add custom PDF manuals or tutorials into ChromaDB</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dropzone */}
        <div className="mt-5 space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
              file
                ? 'border-brand-500/50 bg-brand-500/5'
                : 'border-slate-700 hover:border-brand-500/40 bg-slate-900/40 hover:bg-slate-900/80'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".pdf"
              className="hidden"
            />
            {file ? (
              <div className="flex flex-col items-center">
                <FileText className="w-10 h-10 text-brand-400 mb-2" />
                <span className="font-medium text-slate-200 text-sm">{file.name}</span>
                <span className="text-xs text-slate-400 mt-1">
                  {(file.size / 1024 / 1024).toFixed(2)} MB • Ready to embed
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <UploadCloud className="w-10 h-10 text-slate-500 mb-2" />
                <span className="text-sm font-medium text-slate-300">
                  Click or drag and drop a PDF file here
                </span>
                <span className="text-xs text-slate-500 mt-1">
                  Supports official documentation, cheatsheets, and book chapters
                </span>
              </div>
            )}
          </div>

          {/* Feedback message */}
          {statusMessage && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 border ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20'
                  : 'bg-red-500/10 text-red-300 border-red-500/20'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-sm font-medium rounded-xl text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Close
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className="px-5 py-2 text-sm font-medium rounded-xl bg-gradient-to-r from-brand-600 to-emerald-500 text-white shadow-glow-emerald hover:from-brand-500 hover:to-emerald-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing & Indexing...</span>
                </>
              ) : (
                <span>Upload & Ingest</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
