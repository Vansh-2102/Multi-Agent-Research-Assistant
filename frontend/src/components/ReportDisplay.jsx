import React, { useState, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import html2pdf from 'html2pdf.js';
import { Copy, Check, FileText, Sparkles, Download, Loader2 } from 'lucide-react';

const ReportDisplay = ({ topic, report }) => {
  const [copied, setCopied] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const reportRef = useRef(null);

  const handleCopy = () => {
    if (report) {
      navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportRef.current || downloadingPdf) return;

    setDownloadingPdf(true);
    try {
      const element = reportRef.current;
      const topicSlug = (topic || 'report')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');

      const options = {
        margin: 0.5,
        filename: `Research_Report_${topicSlug}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      await html2pdf().set(options).from(element).save();
    } catch (err) {
      console.error('Error generating PDF:', err);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto my-8 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-xl">
      {/* Header Bar */}
      <div className="px-6 py-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-xl text-cyan-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
              Research Report: <span className="text-cyan-400 font-bold">{topic}</span>
            </h2>
            <p className="text-xs text-slate-400">Verified multi-agent research synthesis</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Copy Report Button */}
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-all duration-200"
            title="Copy Markdown Report"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 font-medium">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 text-slate-400" />
                <span>Copy Report</span>
              </>
            )}
          </button>

          {/* Download PDF Button */}
          <button
            onClick={handleDownloadPdf}
            disabled={downloadingPdf}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white text-xs font-medium border border-cyan-500/40 shadow-md transition-all duration-200 disabled:opacity-50"
            title="Export Report as PDF"
          >
            {downloadingPdf ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-cyan-200" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 text-cyan-200" />
                <span>Download PDF</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Markdown Content */}
      <div
        ref={reportRef}
        className="p-6 md:p-8 text-slate-200 prose prose-invert max-w-none prose-headings:text-slate-100 prose-h1:text-2xl prose-h2:text-xl prose-h3:text-lg prose-a:text-cyan-400 prose-code:text-cyan-300 prose-code:bg-slate-950 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-pre:bg-slate-950 prose-pre:border prose-pre:border-slate-800 leading-relaxed bg-slate-900"
      >
        <ReactMarkdown>{report}</ReactMarkdown>
      </div>

      {/* Footer info */}
      <div className="px-6 py-3 bg-slate-950/60 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Multi-Agent AI Research Assistant
        </span>
        <span>Cached in Redis • Spring Boot Gateway</span>
      </div>
    </div>
  );
};

export default ReportDisplay;
