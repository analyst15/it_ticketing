import React, { useState } from 'react';
import { KBArticle, TicketCategory, Ticket } from '../types';
import { CategoryBadge } from './Badges';
import {
  BookOpen,
  Search,
  Plus,
  ThumbsUp,
  Eye,
  Layers,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  X,
  User,
  Clock,
} from 'lucide-react';

interface KnowledgeBaseViewProps {
  articles: KBArticle[];
  onAddArticle: (article: KBArticle) => void;
  onUpvoteArticle: (id: string) => void;
}

export const KnowledgeBaseView: React.FC<KnowledgeBaseViewProps> = ({
  articles,
  onAddArticle,
  onUpvoteArticle,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [copiedStepIdx, setCopiedStepIdx] = useState<number | null>(null);

  // New Article Form state
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TicketCategory>('Software');
  const [newSummary, setNewSummary] = useState('');
  const [newSymptoms, setNewSymptoms] = useState('');
  const [newRootCause, setNewRootCause] = useState('');
  const [newSteps, setNewSteps] = useState('');
  const [newPrevention, setNewPrevention] = useState('');

  const filteredArticles = articles.filter(a => {
    if (selectedCategory !== 'All' && a.category !== selectedCategory) return false;
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.rootCause.toLowerCase().includes(q) ||
      a.keywords.some(k => k.toLowerCase().includes(q)) ||
      a.symptoms.some(s => s.toLowerCase().includes(q))
    );
  });

  const handleCopyStep = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStepIdx(idx);
    setTimeout(() => setCopiedStepIdx(null), 2000);
  };

  const handleCreateArticleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newSummary.trim()) return;

    const article: KBArticle = {
      id: `kb-${Date.now()}`,
      title: newTitle.trim(),
      category: newCategory,
      summary: newSummary.trim(),
      symptoms: newSymptoms
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      rootCause: newRootCause.trim() || 'Configuration or system mismatch.',
      resolutionSteps: newSteps
        .split('\n')
        .map(s => s.trim())
        .filter(Boolean),
      prevention: newPrevention.trim() || undefined,
      keywords: [newCategory.toLowerCase(), 'troubleshooting', 'it-sop'],
      helpfulVotes: 1,
      views: 1,
      createdAt: new Date().toISOString(),
      author: 'IT Knowledge Team',
    };

    onAddArticle(article);
    setShowCreateModal(false);
    // Reset form
    setNewTitle('');
    setNewSummary('');
    setNewSymptoms('');
    setNewRootCause('');
    setNewSteps('');
    setNewPrevention('');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Banner & Search */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              IT Knowledge Base & Standard Operating Procedures (SOP)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified troubleshooting workflows, self-service guides, and remediation procedures
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            New KB Article
          </button>
        </div>

        {/* Search input and category filter chips */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search by keywords, error codes, symptoms, or remediation steps..."
              className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-700 focus:outline-hidden focus:border-blue-500 focus:bg-white transition-all cursor-pointer"
          >
            <option value="All">All Categories</option>
            <option value="Network & VPN">Network & VPN</option>
            <option value="Hardware">Hardware</option>
            <option value="Software">Software</option>
            <option value="Access & IAM">Access & IAM</option>
            <option value="Email & Cloud">Email & Cloud</option>
            <option value="Security Incident">Security Incident</option>
          </select>
        </div>
      </div>

      {/* Articles Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredArticles.map(article => (
          <div
            key={article.id}
            onClick={() => setSelectedArticle(article)}
            className="bg-white hover:border-blue-300 hover:shadow-md border border-slate-200/90 rounded-xl p-5 shadow-xs flex flex-col justify-between cursor-pointer transition-all group space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <CategoryBadge category={article.category} />
                <span className="text-[11px] text-slate-500 flex items-center gap-1">
                  <Eye className="w-3 h-3 text-slate-400" />
                  {article.views} views
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 group-hover:text-blue-600 transition-colors leading-snug line-clamp-2">
                {article.title}
              </h3>

              <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{article.summary}</p>
            </div>

            {/* Symptoms Tags Preview */}
            <div className="space-y-2 pt-2.5 border-t border-slate-100">
              <div className="flex flex-wrap gap-1">
                {article.symptoms.slice(0, 2).map((sym, idx) => (
                  <span
                    key={idx}
                    className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200 line-clamp-1"
                  >
                    • {sym}
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                <span>By {article.author.split(' ')[0]}</span>
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <ThumbsUp className="w-3 h-3" />
                  {article.helpfulVotes} helpful
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredArticles.length === 0 && (
          <div className="col-span-full py-12 text-center text-slate-500 bg-white border border-slate-200 rounded-xl shadow-xs">
            <BookOpen className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p className="text-sm font-medium text-slate-700">No Knowledge Base articles found matching your query.</p>
            <p className="text-xs text-slate-400 mt-1">Try another search term or create a new article.</p>
          </div>
        )}
      </div>

      {/* Article Detail Reader Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white text-slate-800 border border-slate-200 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Top Bar */}
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-wrap">
                <CategoryBadge category={selectedArticle.category} />
                <span className="text-xs text-slate-500">Authored by {selectedArticle.author}</span>
              </div>
              <button
                onClick={() => setSelectedArticle(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Article Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 leading-snug">{selectedArticle.title}</h2>
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                  {selectedArticle.summary}
                </p>
              </div>

              {/* Symptoms */}
              {selectedArticle.symptoms && selectedArticle.symptoms.length > 0 && (
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-red-700 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    Recognized Symptoms & Indicators
                  </h4>
                  <ul className="list-disc list-inside space-y-1 text-red-900 bg-red-50 p-3.5 rounded-xl border border-red-200">
                    {selectedArticle.symptoms.map((s, idx) => (
                      <li key={idx} className="leading-relaxed">
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Root Cause */}
              {selectedArticle.rootCause && (
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-amber-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Root Cause Analysis
                  </h4>
                  <p className="text-amber-950 bg-amber-50 p-3.5 rounded-xl border border-amber-200 leading-relaxed">
                    {selectedArticle.rootCause}
                  </p>
                </div>
              )}

              {/* Resolution Steps */}
              <div className="space-y-2">
                <h4 className="font-semibold text-emerald-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Step-by-Step Remediation Workflow
                </h4>
                <div className="space-y-2">
                  {selectedArticle.resolutionSteps.map((step, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start justify-between gap-3 text-slate-800 leading-relaxed group"
                    >
                      <span>{step}</span>
                      <button
                        onClick={() => handleCopyStep(step, idx)}
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 hover:text-slate-800 shrink-0 cursor-pointer transition-colors shadow-2xs"
                        title="Copy step"
                      >
                        {copiedStepIdx === idx ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Prevention */}
              {selectedArticle.prevention && (
                <div className="space-y-1.5">
                  <h4 className="font-semibold text-blue-800 uppercase tracking-wider text-[11px]">
                    Prevention & Hardening Tips
                  </h4>
                  <p className="text-slate-700 bg-blue-50/50 p-3.5 rounded-xl border border-blue-200 leading-relaxed">
                    {selectedArticle.prevention}
                  </p>
                </div>
              )}
            </div>

            {/* Footer with Upvoting */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
              <span className="text-slate-500">Was this article helpful to your investigation?</span>
              <button
                onClick={() => {
                  onUpvoteArticle(selectedArticle.id);
                  setSelectedArticle(prev => (prev ? { ...prev, helpfulVotes: prev.helpfulVotes + 1 } : null));
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold shadow-xs transition-all cursor-pointer"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                Yes, this resolved my issue ({selectedArticle.helpfulVotes})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Article Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white text-slate-800 border border-slate-200 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in">
            <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-blue-600" />
                Publish Standard Operating Procedure / KB Article
              </h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700 cursor-pointer">✕</button>
            </div>

            <form onSubmit={handleCreateArticleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="font-semibold text-slate-700 block mb-1">Article Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. How to Remediate Expired MDM Certificate in macOS 15"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Category</label>
                  <select
                    value={newCategory}
                    onChange={e => setNewCategory(e.target.value as TicketCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden cursor-pointer"
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Software">Software</option>
                    <option value="Network & VPN">Network & VPN</option>
                    <option value="Access & IAM">Access & IAM</option>
                    <option value="Email & Cloud">Email & Cloud</option>
                    <option value="Security Incident">Security Incident</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold text-slate-700 block mb-1">Summary</label>
                  <input
                    type="text"
                    required
                    value={newSummary}
                    onChange={e => setNewSummary(e.target.value)}
                    placeholder="Brief 1-line overview of the guide"
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Symptoms (1 per line)</label>
                <textarea
                  rows={2}
                  value={newSymptoms}
                  onChange={e => setNewSymptoms(e.target.value)}
                  placeholder="Error 403 authorization failed&#10;VPN disconnected immediately"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Root Cause Explanation</label>
                <input
                  type="text"
                  value={newRootCause}
                  onChange={e => setNewRootCause(e.target.value)}
                  placeholder="Keychain certificate authorization invalidated by OS update"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Resolution Steps (1 per line)</label>
                <textarea
                  rows={4}
                  required
                  value={newSteps}
                  onChange={e => setNewSteps(e.target.value)}
                  placeholder="1. Open Terminal as admin&#10;2. Run sudo profiles renew -type enrollment&#10;3. Restart GlobalProtect client"
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 block mb-1">Prevention Tips (Optional)</label>
                <input
                  type="text"
                  value={newPrevention}
                  onChange={e => setNewPrevention(e.target.value)}
                  placeholder="Ensure MDM enrollment is verified prior to rolling out major updates."
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white shadow-xs cursor-pointer transition-all"
                >
                  Publish Article
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
