import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, Loader2, CheckCircle2, User, Phone, Mail, Search, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { contactService } from '../../../services/contact.service.js';

function InquiryCard({ item, onClose, closing }) {
  const isOpen = item.status === 'open';
  const date = new Date(item.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
  const time = new Date(item.createdAt).toLocaleTimeString('en-IN', {
    hour: '2-digit', minute: '2-digit',
  });

  const isEmail = item.contact.includes('@');

  return (
    <div className="bg-white rounded-2xl border border-[#E2E8F0] p-5" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-xl bg-[#FDEFEE] flex items-center justify-center flex-shrink-0">
          <User className="w-5 h-5 text-[#CA6357]" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-[#1E293B]">{item.name}</p>
            <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${
              isOpen
                ? 'bg-amber-50 text-amber-700'
                : 'bg-green-50 text-green-700'
            }`}>
              {isOpen ? <Clock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
              {isOpen ? 'Open' : 'Closed'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-1">
            {isEmail
              ? <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
              : <Phone className="w-3.5 h-3.5 text-[#94A3B8]" />}
            <p className="text-xs text-[#94A3B8]">{item.contact}</p>
          </div>

          <p className="text-sm text-[#475569] mt-3 leading-relaxed">{item.message}</p>

          <div className="flex items-center justify-between mt-4 flex-wrap gap-2">
            <p className="text-xs text-[#94A3B8]">{date} · {time}</p>

            {isOpen && (
              <button
                onClick={() => onClose(item._id)}
                disabled={closing}
                className="inline-flex items-center gap-1.5 bg-[#CA6357] hover:bg-[#b85548] text-white text-xs font-semibold px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
              >
                {closing
                  ? <Loader2 className="w-3 h-3 animate-spin" />
                  : <CheckCircle2 className="w-3 h-3" />}
                Mark Closed
              </button>
            )}

            {!isOpen && item.handledBy && (
              <p className="text-xs text-[#94A3B8]">
                Closed by {item.handledBy.name}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ContactInquiriesPage() {
  const [filter, setFilter] = useState('open');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['contact-inquiries', filter],
    queryFn: () => contactService.getAll(filter || undefined),
    refetchInterval: 30_000,
  });

  const closeMutation = useMutation({
    mutationFn: (id) => contactService.close(id),
    onSuccess: () => {
      toast.success('Inquiry closed');
      qc.invalidateQueries({ queryKey: ['contact-inquiries'] });
    },
    onError: (e) => toast.error(e.response?.data?.message ?? 'Failed to close'),
  });

  const filtered = inquiries.filter((item) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      item.name.toLowerCase().includes(s) ||
      item.contact.toLowerCase().includes(s) ||
      item.message.toLowerCase().includes(s)
    );
  });

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div
        className="relative rounded-2xl overflow-hidden p-6"
        style={{ background: 'linear-gradient(135deg, #CA6357 0%, #A94E43 100%)' }}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-white/15 flex items-center justify-center">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold tracking-widest text-[#F2B3AC] uppercase mb-0.5">Support</p>
            <h1 className="text-xl font-bold text-white">Contact Inquiries</h1>
          </div>
          {!isLoading && (
            <div className="ml-auto bg-[#C76D64] text-white text-sm font-bold px-3 py-1.5 rounded-xl">
              {inquiries.filter(i => i.status === 'open').length} open
            </div>
          )}
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-2">
          {['open', 'closed', ''].map((val) => {
            const label = val === '' ? 'All' : val === 'open' ? 'Open' : 'Closed';
            return (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
                  filter === val
                    ? 'bg-[#CA6357] text-white'
                    : 'bg-white border border-[#E2E8F0] text-[#475569] hover:border-[#CA6357]'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94A3B8]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, contact or message…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[#E2E8F0] text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#CA6357] bg-white"
          />
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-40">
          <Loader2 className="w-5 h-5 text-[#CA6357] animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center" style={{ boxShadow: '0 2px 16px rgba(0,0,0,0.05)' }}>
          <MessageSquare className="w-10 h-10 text-[#F2B3AC] mx-auto mb-3" strokeWidth={1.5} />
          <p className="text-base font-bold text-[#1E293B]">No inquiries found</p>
          <p className="text-sm text-[#94A3B8] mt-1">
            {filter === 'open' ? 'All caught up — no open inquiries.' : 'Nothing matches your search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <InquiryCard
              key={item._id}
              item={item}
              onClose={(id) => closeMutation.mutate(id)}
              closing={closeMutation.isPending && closeMutation.variables === item._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
