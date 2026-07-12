import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Code2, Plus, Pencil, Trash2, ExternalLink, Loader2, X, Search,
} from 'lucide-react';
import { leetcodeService } from '../../../services/leetcode.service.js';

const LIST_STYLE = {
  general:    { label: 'General',    color: '#CA6357', bg: '#FDEFEE', desc: 'Any language (C, Java, etc.)' },
  javascript: { label: 'JavaScript', color: '#F59E0B', bg: '#FFFBEB', desc: 'JavaScript only' },
};

function ProblemForm({ problem, onSuccess, onCancel }) {
  const qc = useQueryClient();
  const isEdit = !!problem;

  const hintsToText = (hints) => (Array.isArray(hints) ? hints.join('\n') : '');
  const textToHints = (text) => text.split('\n').map((s) => s.trim()).filter(Boolean);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: problem
      ? { ...problem, hintsText: hintsToText(problem.hints) }
      : { list: 'general', hintsText: '' },
  });

  const mutation = useMutation({
    mutationFn: ({ hintsText, ...rest }) => {
      const payload = { ...rest, hints: textToHints(hintsText ?? '') };
      return isEdit ? leetcodeService.updateProblem(problem._id, payload) : leetcodeService.createProblem(payload);
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Problem updated' : 'Problem added');
      qc.invalidateQueries({ queryKey: ['leetcode', 'problems'] });
      onSuccess();
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Something went wrong'),
  });

  return (
    <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[#475569] mb-1">Title *</label>
          <input
            {...register('title', { required: 'Title is required' })}
            placeholder="Two Sum"
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B]"
          />
          {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[#475569] mb-1">LeetCode URL *</label>
          <input
            {...register('leetcodeUrl', { required: 'URL is required' })}
            placeholder="https://leetcode.com/problems/two-sum/"
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B]"
          />
          {errors.leetcodeUrl && <p className="text-xs text-red-500 mt-1">{errors.leetcodeUrl.message}</p>}
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1">List *</label>
          <select
            {...register('list', { required: true })}
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B] bg-white"
          >
            <option value="general">General (any language)</option>
            <option value="javascript">JavaScript only</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1">Topic</label>
          <input
            {...register('topic')}
            placeholder="Arrays, Strings, Loops…"
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B]"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-[#475569] mb-1">Order #</label>
          <input
            type="number"
            {...register('order', { min: 1, valueAsNumber: true })}
            placeholder="Auto-assigned if blank"
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B]"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold text-[#475569] mb-1">
            Hints <span className="font-normal text-[#94A3B8]">(one per line — guides students without giving away the answer)</span>
          </label>
          <textarea
            {...register('hintsText')}
            rows={4}
            placeholder={"Use a hash map to store each number and its index.\nFor each element, check if (target - current) already exists.\nReturn the indices when the complement is found."}
            className="w-full border border-[#E2E8F0] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B] resize-y placeholder-[#94A3B8]"
          />
        </div>

        {isEdit && (
          <div className="flex items-center gap-2 pt-1">
            <input type="checkbox" id="isActive" {...register('isActive')} className="accent-[#CA6357] w-4 h-4" />
            <label htmlFor="isActive" className="text-sm text-[#475569]">Active (visible to students)</label>
          </div>
        )}
      </div>

      <div className="flex gap-2 pt-2">
        <button
          type="submit"
          disabled={mutation.isPending}
          className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60"
        >
          {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {isEdit ? 'Save Changes' : 'Add Problem'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 border border-[#E2E8F0] text-[#475569] font-semibold px-5 py-2.5 rounded-xl hover:bg-[#F8F9FB] transition-colors text-sm"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function LeetCodeAdminPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState('');
  const [filterList, setFilterList] = useState('all');

  const { data: problems = [], isLoading } = useQuery({
    queryKey: ['leetcode', 'problems'],
    queryFn: leetcodeService.getProblems,
  });

  const deleteMutation = useMutation({
    mutationFn: leetcodeService.deleteProblem,
    onSuccess: () => {
      toast.success('Problem deleted');
      qc.invalidateQueries({ queryKey: ['leetcode', 'problems'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Delete failed'),
  });

  const filtered = problems.filter((p) => {
    const matchSearch = !search
      || p.title.toLowerCase().includes(search.toLowerCase())
      || (p.topic ?? '').toLowerCase().includes(search.toLowerCase());
    const matchList = filterList === 'all' || p.list === filterList;
    return matchSearch && matchList;
  });

  const generalCount = problems.filter((p) => p.list === 'general').length;
  const jsCount = problems.filter((p) => p.list === 'javascript').length;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="relative rounded-2xl overflow-hidden p-6 sm:p-8" style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}>
        <div className="relative z-10 flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">LeetCode Problems</h1>
            <p className="text-white/70 text-sm">Manage the General and JavaScript problem lists</p>
          </div>
          {!showForm && !editing && (
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 bg-[#CA6357] hover:bg-[#b85548] text-white font-semibold px-4 py-2.5 rounded-xl transition-colors text-sm flex-shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Problem
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4">
        {[
          { label: 'General List', value: generalCount, sub: 'Any language · C, Java, etc.', color: '#CA6357', bg: '#FDEFEE' },
          { label: 'JavaScript List', value: jsCount, sub: 'JavaScript only', color: '#F59E0B', bg: '#FFFBEB' },
        ].map(({ label, value, sub, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-5" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
            <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: bg }}>
              <Code2 className="w-4 h-4" style={{ color }} />
            </div>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-sm font-semibold text-[#1E293B] mt-0.5">{label}</p>
            <p className="text-xs text-[#94A3B8]">{sub}</p>
          </div>
        ))}
      </div>

      {/* Add modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#1E293B]">Add New Problem</h3>
              <button onClick={() => setShowForm(false)} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ProblemForm onSuccess={() => setShowForm(false)} onCancel={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(15,23,42,0.45)' }}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ boxShadow: '0 8px 40px rgba(0,0,0,0.18)' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[#1E293B]">Edit Problem #{editing.order}</h3>
              <button onClick={() => setEditing(null)} className="text-[#94A3B8] hover:text-[#475569] transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <ProblemForm problem={editing} onSuccess={() => setEditing(null)} onCancel={() => setEditing(null)} />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or topic…"
            className="w-full pl-9 pr-4 py-2.5 border border-[#E2E8F0] rounded-xl text-sm focus:outline-none focus:border-[#CA6357] text-[#1E293B]"
          />
        </div>
        {['all', 'general', 'javascript'].map((l) => (
          <button
            key={l}
            onClick={() => setFilterList(l)}
            className={`px-4 py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${
              filterList === l
                ? 'bg-[#CA6357] text-white'
                : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#CA6357]'
            }`}
          >
            {l === 'all' ? 'All' : l === 'general' ? 'General' : 'JavaScript'}
          </button>
        ))}
      </div>

      {/* Problem table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <Code2 className="w-10 h-10 text-[#CBD5E1] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-base font-bold text-[#1E293B]">No problems yet</p>
          <p className="text-sm text-[#94A3B8] mt-1">Add problems to build the student lists.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl overflow-hidden" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#F1F5F9]">
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#94A3B8] uppercase tracking-wider w-12">#</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#94A3B8] uppercase tracking-wider hidden sm:table-cell w-20">LC #</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Title</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">List</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#94A3B8] uppercase tracking-wider hidden sm:table-cell">Topic</th>
                  <th className="text-left px-4 py-3 text-xs font-bold text-[#94A3B8] uppercase tracking-wider hidden sm:table-cell">Status</th>
                  <th className="text-right px-4 py-3 text-xs font-bold text-[#94A3B8] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {filtered.map((p) => {
                  const ls = LIST_STYLE[p.list];
                  return (
                    <tr key={p._id} className="hover:bg-[#F8F9FB] transition-colors">
                      <td className="px-4 py-3 font-mono text-[#94A3B8] text-xs">{p.order}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {p.leetcodeNo
                          ? <span className="inline-flex items-center justify-center font-mono text-xs font-bold text-[#CA6357] bg-[#FDEFEE] px-2 py-0.5 rounded-lg">{p.leetcodeNo}</span>
                          : <span className="text-[#CBD5E1] text-xs">—</span>
                        }
                      </td>
                      <td className="px-4 py-3">
                        <a
                          href={p.leetcodeUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold text-[#1E293B] hover:text-[#CA6357] inline-flex items-center gap-1"
                        >
                          {p.title}
                          <ExternalLink className="w-3 h-3 text-[#94A3B8]" />
                        </a>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full"
                          style={{ backgroundColor: ls.bg, color: ls.color }}
                        >
                          {ls.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[#475569] hidden sm:table-cell">{p.topic || '—'}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <span className={`text-xs font-semibold ${p.isActive ? 'text-[#22A66E]' : 'text-[#94A3B8]'}`}>
                          {p.isActive ? 'Active' : 'Hidden'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="inline-flex gap-1">
                          <button
                            onClick={() => { setEditing(p); setShowForm(false); }}
                            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#CA6357] hover:bg-[#FDEFEE] transition-colors"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              if (window.confirm(`Delete "${p.title}"?`)) deleteMutation.mutate(p._id);
                            }}
                            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#C76D64] hover:bg-[#FDEFEE] transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
