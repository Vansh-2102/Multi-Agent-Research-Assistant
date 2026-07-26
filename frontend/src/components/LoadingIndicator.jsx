import React, { useState, useEffect } from 'react';
import { Bot, FileText, Search, PenTool, Cpu, CheckCircle2, ShieldCheck } from 'lucide-react';

const LoadingIndicator = ({ topic }) => {
  const [activeStep, setActiveStep] = useState('PLANNER');
  const [statusMessage, setStatusMessage] = useState('Initializing multi-agent research graph pipeline...');

  useEffect(() => {
    if (!topic) return;

    const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080/api/v1';
    const streamUrl = `${apiBaseUrl}/research/stream/${encodeURIComponent(topic)}`;
    
    const eventSource = new EventSource(streamUrl);

    eventSource.addEventListener('agent-event', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.step) {
          setActiveStep(data.step);
        }
        if (data.message) {
          setStatusMessage(data.message);
        }
      } catch (err) {
        console.error('Error parsing SSE agent event:', err);
      }
    });

    eventSource.onerror = (err) => {
      console.warn('SSE EventSource error/closed:', err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [topic]);

  const isPlannerActive = activeStep.includes('PLANNER');
  const isResearcherActive = activeStep.includes('RESEARCHER');
  const isWriterActive = activeStep.includes('WRITER');
  const isReviewerActive = activeStep.includes('REVIEW') || activeStep === 'APPROVED';

  return (
    <div className="w-full max-w-3xl mx-auto my-8 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-2xl backdrop-blur-md">
      <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
        <div className="p-2.5 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 animate-pulse">
          <Bot className="w-6 h-6" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
            Multi-Agent Workflow in Progress...
          </h3>
          <p className="text-xs text-cyan-400 font-mono mt-0.5 animate-pulse">
            ⚡ {statusMessage}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Step 1: Planner Agent */}
        <div className={`flex items-start gap-4 p-3.5 rounded-xl transition-all duration-300 border ${
          isPlannerActive
            ? 'bg-blue-950/40 border-blue-500/50 shadow-lg shadow-blue-500/5'
            : 'bg-slate-950/40 border-slate-800/80 opacity-75'
        }`}>
          <div className="p-2 bg-blue-500/10 border border-blue-500/30 rounded-lg text-blue-400 mt-0.5">
            <FileText className={`w-5 h-5 ${isPlannerActive ? 'animate-bounce' : ''}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-slate-200">1. 📋 Planner Agent</span>
              {isPlannerActive && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 font-mono animate-pulse">Active</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">Formulating 3-point research outline...</p>
          </div>
        </div>

        {/* Step 2: Researcher Agent */}
        <div className={`flex items-start gap-4 p-3.5 rounded-xl transition-all duration-300 border ${
          isResearcherActive
            ? 'bg-purple-950/40 border-purple-500/50 shadow-lg shadow-purple-500/5'
            : 'bg-slate-950/40 border-slate-800/80 opacity-75'
        }`}>
          <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400 mt-0.5">
            <Search className={`w-5 h-5 ${isResearcherActive ? 'animate-spin' : ''}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-slate-200">2. 🔍 Researcher Agent</span>
              {isResearcherActive && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/40 font-mono animate-pulse">Searching</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">Searching DuckDuckGo for live authoritative sources...</p>
          </div>
        </div>

        {/* Step 3: Writer Agent */}
        <div className={`flex items-start gap-4 p-3.5 rounded-xl transition-all duration-300 border ${
          isWriterActive
            ? 'bg-emerald-950/40 border-emerald-500/50 shadow-lg shadow-emerald-500/5'
            : 'bg-slate-950/40 border-slate-800/80 opacity-75'
        }`}>
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 mt-0.5">
            <PenTool className={`w-5 h-5 ${isWriterActive ? 'animate-pulse' : ''}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-slate-200">3. ✍️ Writer Agent</span>
              {isWriterActive && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-mono animate-pulse">Drafting</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">Synthesizing findings into markdown report...</p>
          </div>
        </div>

        {/* Step 4: Reviewer Agent */}
        <div className={`flex items-start gap-4 p-3.5 rounded-xl transition-all duration-300 border ${
          isReviewerActive
            ? 'bg-amber-950/40 border-amber-500/50 shadow-lg shadow-amber-500/5'
            : 'bg-slate-950/40 border-slate-800/80 opacity-75'
        }`}>
          <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 mt-0.5">
            <ShieldCheck className={`w-5 h-5 ${isReviewerActive ? 'animate-pulse' : ''}`} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="font-medium text-sm text-slate-200">4. 🔬 Reviewer Agent</span>
              {isReviewerActive && (
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 font-mono animate-pulse">Reviewing</span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">Evaluating quality and verifying report standards...</p>
          </div>
        </div>
      </div>

      <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-1.5">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>Groq Llama 3.3 70B • Real-time SSE Stream</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="text-cyan-400 font-medium">Live Event Stream</span>
        </div>
      </div>
    </div>
  );
};

export default LoadingIndicator;
