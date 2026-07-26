import React from 'react';
import { Search, Sparkles } from 'lucide-react';

const SearchBar = ({ topic, setTopic, onSubmit, loading }) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (topic && topic.trim() && !loading) {
      onSubmit(topic.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-3xl mx-auto my-6">
      <div className="relative flex items-center shadow-2xl rounded-2xl overflow-hidden border border-slate-700/60 bg-slate-900/80 backdrop-blur-xl focus-within:border-cyan-500/80 focus-within:ring-2 focus-within:ring-cyan-500/20 transition-all duration-300">
        <div className="pl-5 text-slate-400">
          <Search className="w-6 h-6" />
        </div>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Enter a research topic (e.g., Quantum Computing, LPU Accelerators)..."
          disabled={loading}
          className="w-full py-4 px-4 bg-transparent text-slate-100 placeholder-slate-500 focus:outline-none text-base disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={loading || !topic.trim()}
          className="mr-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-xl flex items-center gap-2 shadow-lg transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:from-cyan-500 disabled:hover:to-blue-600"
        >
          <Sparkles className="w-4 h-4" />
          <span>Research</span>
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
