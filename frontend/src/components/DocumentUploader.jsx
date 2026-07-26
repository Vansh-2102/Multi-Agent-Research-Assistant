import React, { useState, useEffect } from 'react';
import { uploadDocument, clearDocuments, fetchIndexedDocs } from '../services/api.js';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  Database,
  FileCheck,
  Sparkles,
  Trash2
} from 'lucide-react';

const DocumentUploader = ({ onDocumentUploaded }) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [indexedDocs, setIndexedDocs] = useState([]);

  // Fetch indexed documents on component load
  useEffect(() => {
    const loadIndexedDocs = async () => {
      try {
        const data = await fetchIndexedDocs();
        if (data && data.documents && Array.isArray(data.documents)) {
          setIndexedDocs(data.documents);
        }
      } catch (err) {
        console.error('Failed to load indexed documents:', err);
      }
    };
    loadIndexedDocs();
  }, []);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFileUpload = async (file) => {
    if (!file) return;

    const validExtensions = ['.pdf', '.txt', '.md'];
    const fileName = file.name.toLowerCase();
    const isValid = validExtensions.some((ext) => fileName.endsWith(ext));

    if (!isValid) {
      setErrorMessage('Unsupported file format. Please upload PDF, TXT, or Markdown (.md) files.');
      return;
    }

    setUploading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const data = await uploadDocument(file);
      const chunks = data.chunks_ingested || data.chunks || 1;
      const message = data.message || `Successfully indexed "${file.name}" (${chunks} text chunks embedded).`;
      
      setSuccessMessage(message);

      if (data.indexed_documents && Array.isArray(data.indexed_documents)) {
        setIndexedDocs(data.indexed_documents);
      } else {
        setIndexedDocs((prev) => Array.from(new Set([...prev, file.name])));
      }

      if (onDocumentUploaded) {
        onDocumentUploaded(data);
      }
    } catch (err) {
      console.error('File upload failed:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Failed to upload and index document in ChromaDB.';
      setErrorMessage(msg);
    } finally {
      setUploading(false);
    }
  };

  const handleClearIndex = async () => {
    if (!window.confirm('Are you sure you want to clear all indexed knowledge documents from ChromaDB?')) {
      return;
    }

    setClearing(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await clearDocuments();
      setIndexedDocs([]);
      setSuccessMessage('Successfully cleared all indexed knowledge documents from vector store.');
    } catch (err) {
      console.error('Failed to clear vector store:', err);
      const msg =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Failed to clear knowledge base index.';
      setErrorMessage(msg);
    } finally {
      setClearing(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFileUpload(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-8">
      <div 
        className={`relative overflow-hidden rounded-2xl border transition-all duration-300 backdrop-blur-xl p-6 ${
          dragActive 
            ? 'border-cyan-400 bg-cyan-950/30 shadow-lg shadow-cyan-500/10 scale-[1.01]' 
            : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-700/80'
        }`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
      >
        <div className="flex flex-col sm:flex-row items-center gap-5 justify-between">
          {/* Icon & Description */}
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-xl text-cyan-400 shrink-0 shadow-inner">
              {uploading ? (
                <Loader2 className="w-7 h-7 animate-spin text-cyan-400" />
              ) : (
                <UploadCloud className="w-7 h-7 text-cyan-400" />
              )}
            </div>
            <div>
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="text-sm font-semibold text-slate-200">
                  Knowledge Base Document Indexer
                </h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-[10px] font-medium text-cyan-300">
                  <Sparkles className="w-2.5 h-2.5" /> ChromaDB RAG
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Upload PDF, TXT, or Markdown documents to enable local vector search alongside web queries.
              </p>
            </div>
          </div>

          {/* Upload Button */}
          <div className="shrink-0 w-full sm:w-auto">
            <label className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-medium text-xs text-white transition-all duration-200 cursor-pointer shadow-md w-full sm:w-auto ${
              uploading || clearing
                ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700' 
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 active:scale-95 border border-cyan-400/30'
            }`}>
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Embedding...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  Upload Document
                </>
              )}
              <input 
                type="file" 
                className="hidden" 
                accept=".pdf,.txt,.md"
                onChange={handleChange}
                disabled={uploading || clearing}
              />
            </label>
          </div>
        </div>

        {/* Feedback Banners */}
        {successMessage && (
          <div className="mt-4 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-red-950/40 border border-red-800/60 text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Indexed Knowledge List */}
        {indexedDocs.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-800/60">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <div className="flex items-center gap-2">
                <Database className="w-3.5 h-3.5 text-cyan-400" />
                <span className="font-medium text-slate-300">Indexed Knowledge Sources ({indexedDocs.length}):</span>
              </div>
              <button
                onClick={handleClearIndex}
                disabled={clearing || uploading}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800/50 text-red-300 text-[11px] font-medium transition-colors disabled:opacity-50"
              >
                {clearing ? (
                  <Loader2 className="w-3 h-3 animate-spin text-red-400" />
                ) : (
                  <Trash2 className="w-3 h-3 text-red-400" />
                )}
                Clear Knowledge Base
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {indexedDocs.map((doc, idx) => (
                <span 
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-[11px] font-medium text-slate-300 shadow-sm"
                >
                  <FileCheck className="w-3 h-3 text-cyan-400" />
                  {doc}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUploader;
