import React, { useState } from 'react';
import SearchBar from './components/SearchBar.jsx';
import DocumentUploader from './components/DocumentUploader.jsx';
import LoadingIndicator from './components/LoadingIndicator.jsx';
import ReportDisplay from './components/ReportDisplay.jsx';
import { fetchResearch } from './services/api.js';
import { Bot, Cpu, AlertCircle, RefreshCw } from 'lucide-react';

function App() {
  const [topic, setTopic] = useState('');
  const [activeTopic, setActiveTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [report, setReport] = useState(null);

  const handleResearch = async (searchTopic) => {
    setLoading(true);
    setError(null);
    setReport(null);
    setActiveTopic(searchTopic);

    try {
      const data = await fetchResearch(searchTopic);
      if (data && data.report) {
        setReport(data.report);
      } else {
        setError('Received an empty research report from server.');
      }
    } catch (err) {
      console.error('Research request error:', err);
      const errorMessage =
        err.response?.data?.detail ||
        err.response?.data?.message ||
        err.message ||
        'Failed to connect to Spring Boot Gateway server (http://localhost:8080).';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-slate-900/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-xl shadow-lg text-white">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-slate-100 via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                Multi-Agent AI Research Studio
              </h1>
              <p className="text-xs text-slate-400 font-medium">FastAPI • LangGraph • Groq Llama 3.3 • ChromaDB RAG • Spring Boot</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 font-mono">
            <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
            <span>Groq Llama-3.3-70b</span>
          </div>
        </div>
      </header>

      {/* Main Content Container */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-10 flex flex-col">
        {/* Intro Hero Header */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-100 tracking-tight mb-3">
            Autonomous Deep <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Research Pipeline</span>
          </h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            Upload domain knowledge documents to embed into ChromaDB vector store, or enter any topic to trigger AI agents (Planner, Researcher, Writer & Peer Reviewer) for hybrid RAG and live web synthesis.
          </p>
        </div>

        {/* Document Uploader Component (ChromaDB RAG) */}
        <DocumentUploader />

        {/* Search Bar Component */}
        <SearchBar
          topic={topic}
          setTopic={setTopic}
          onSubmit={handleResearch}
          loading={loading}
        />


        {/* Loading State */}
        {loading && <LoadingIndicator topic={activeTopic} />}

        {/* Error State */}
        {error && (
          <div className="w-full max-w-3xl mx-auto my-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 flex items-start gap-3 shadow-lg">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm">
              <h4 className="font-semibold text-red-300">Research Request Failed</h4>
              <p className="mt-1 text-red-300/80 text-xs">{error}</p>
              <button
                onClick={() => handleResearch(topic)}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-red-900/60 hover:bg-red-800/80 text-red-100 text-xs font-medium border border-red-700 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Request
              </button>
            </div>
          </div>
        )}

        {/* Final Report Display */}
        {!loading && report && (
          <ReportDisplay topic={activeTopic} report={report} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 text-center text-xs text-slate-500">
        <p>© Multi-Agent Research Assistant System • Built with Spring Boot 3 & FastAPI LangGraph</p>
      </footer>
    </div>
  );
}

export default App;
