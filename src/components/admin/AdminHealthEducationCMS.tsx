import React, { useState, useEffect } from 'react';
import {
  getHealthEducationArticles,
  saveHealthEducationArticle,
} from '../../services/healthEducationService';
import { HealthEducationArticle } from '../../types';
import {
  BookOpen,
  Plus,
  Search,
  CheckCircle,
  Tag,
  Clock,
  User,
  Eye,
  FileText,
} from 'lucide-react';

export const AdminHealthEducationCMS: React.FC = () => {
  const [articles, setArticles] = useState<HealthEducationArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<HealthEducationArticle['category']>('Chronic Illness');
  const [summary, setSummary] = useState('');
  const [content, setContent] = useState('');
  const [readTime, setReadTime] = useState(4);
  const [authorName, setAuthorName] = useState('Dr. Arthur Ssenabulya');
  const [authorTitle, setAuthorTitle] = useState('Supervising Pharmacist');
  const [tagsInput, setTagsInput] = useState('Hypertension, Diet, Health');

  useEffect(() => {
    setArticles(getHealthEducationArticles(false));
  }, []);

  const handleCreateArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !summary || !content) return;

    const newArt = saveHealthEducationArticle({
      title,
      category,
      summary,
      contentMarkdown: content,
      readTimeMinutes: readTime,
      authorName,
      authorTitle,
      isPublished: true,
      tags: tagsInput.split(',').map((t) => t.trim()),
      featured: false,
    });

    setArticles([newArt, ...articles]);
    setIsModalOpen(false);

    setTitle('');
    setSummary('');
    setContent('');
  };

  const filtered = articles.filter(
    (a) =>
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.summary.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 text-xs font-bold px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
              <BookOpen className="w-3.5 h-3.5" />
              Patient Health Education CMS (§7, §29)
            </span>
            <span className="text-xs font-semibold text-slate-500">Chronic Self-Care &amp; Antibiotic Stewardship</span>
          </div>
          <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-slate-100 mt-1">
            Patient Health Library &amp; Content Management
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
            Publish verified medication counseling guides, chronic illness self-care advice, and nutrition articles directly to the Patient Web &amp; PWA Portal.
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer transform hover:scale-102"
        >
          <Plus className="w-4 h-4" />
          <span>Publish New Health Guide</span>
        </button>
      </div>

      {/* Articles Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800">
          <div className="relative w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search published health articles..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {filtered.map((art) => (
          <div
            key={art.id}
            className="p-5 hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-md">
                  {art.category}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {art.readTimeMinutes} min read
                </span>
                {art.featured && (
                  <span className="text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 px-1.5 py-0.2 rounded">
                    Featured
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">{art.title}</h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">{art.summary}</p>

              <div className="text-[11px] text-slate-500 flex flex-wrap gap-x-4 gap-y-1">
                <span>Author: <strong>{art.authorName}</strong> ({art.authorTitle})</span>
                <span>Published: {new Date(art.publishedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="shrink-0">
              <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-1.5 rounded-xl">
                <CheckCircle className="w-3.5 h-3.5" />
                Live on Patient PWA
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* New Article Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl max-w-2xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100">Publish Health Education Guide</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 text-xs font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateArticle} className="space-y-4 mt-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Article Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Living Well with Type 2 Diabetes"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  >
                    <option value="Chronic Illness">Chronic Illness</option>
                    <option value="Medication Safety">Medication Safety</option>
                    <option value="Antibiotic Stewardship">Antibiotic Stewardship</option>
                    <option value="Child Health">Child Health</option>
                    <option value="Women Health">Women Health</option>
                    <option value="Nutrition & Lifestyle">Nutrition & Lifestyle</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Estimated Read Time (Min)</label>
                  <input
                    type="number"
                    value={readTime}
                    onChange={(e) => setReadTime(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Executive Summary *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Short engaging summary for the patient mobile card..."
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-400 mb-1">Full Clinical Content (Markdown) *</label>
                <textarea
                  required
                  rows={6}
                  placeholder="Write clear, compassionate, clinically sound instructions..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-xs font-bold text-slate-600">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm">
                  Publish to Patient Portal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
