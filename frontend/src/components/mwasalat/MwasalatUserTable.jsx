import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Ban, CheckCircle2, Loader2, ChevronUp, ChevronDown } from 'lucide-react';
import MwasalatBlockUserModal from './MwasalatBlockUserModal.jsx';

function SortableHeader({ label, active, direction, onClick, className = '' }) {
  return (
    <th className={`px-5 py-3 font-medium ${className}`}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 hover:text-[#1E293B] transition-colors"
      >
        {label}
        {active && (direction === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
      </button>
    </th>
  );
}

export default function MwasalatUserTable({ users, isLoading, pendingId, onToggle, emptyLabel, linkTo, columns }) {
  const [blockTarget, setBlockTarget] = useState(null);
  const [sortKey, setSortKey] = useState(null);
  const [sortDir, setSortDir] = useState('asc');

  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const sortedUsers = useMemo(() => {
    if (!sortKey) return users;
    const dir = sortDir === 'asc' ? 1 : -1;
    const extraCol = columns?.find((c) => c.key === sortKey);
    return [...users].sort((a, b) => {
      let aVal, bVal;
      if (sortKey === 'name') { aVal = a.name ?? ''; bVal = b.name ?? ''; }
      else if (sortKey === 'joined') { aVal = new Date(a.createdAt).getTime(); bVal = new Date(b.createdAt).getTime(); }
      else if (extraCol) { aVal = extraCol.sortValue?.(a) ?? -1; bVal = extraCol.sortValue?.(b) ?? -1; }
      if (aVal < bVal) return -1 * dir;
      if (aVal > bVal) return 1 * dir;
      return 0;
    });
  }, [users, sortKey, sortDir, columns]);

  const handleConfirmBlock = async (reason) => {
    await onToggle(blockTarget, reason);
    setBlockTarget(null);
  };

  if (isLoading) {
    return (
      <div className="p-10 flex items-center justify-center text-[#94A3B8]">
        <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
      </div>
    );
  }

  if (users.length === 0) {
    return <div className="p-10 text-center text-[#94A3B8] text-sm">{emptyLabel}</div>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#E2E8F0] text-left text-xs text-[#94A3B8] uppercase tracking-wide">
            <SortableHeader label="Name" active={sortKey === 'name'} direction={sortDir} onClick={() => toggleSort('name')} />
            {columns ? (
              columns.map((col) => (
                <SortableHeader key={col.key} label={col.label} active={sortKey === col.key} direction={sortDir} onClick={() => toggleSort(col.key)} />
              ))
            ) : (
              <th className="px-5 py-3 font-medium">Email</th>
            )}
            <th className="px-5 py-3 font-medium">Status</th>
            <SortableHeader label="Joined" active={sortKey === 'joined'} direction={sortDir} onClick={() => toggleSort('joined')} />
            <th className="px-5 py-3 font-medium text-right">Action</th>
          </tr>
        </thead>
        <tbody>
          {sortedUsers.map((u) => (
            <tr key={u._id} className="border-b border-[#F1F5F9] last:border-0">
              <td className="px-5 py-3.5 font-medium text-[#1E293B] whitespace-nowrap">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-mwasalatInk-500 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                    {u.name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  {linkTo ? (
                    <Link to={linkTo(u)} className="hover:text-mwasalatInk-500 hover:underline transition-colors">
                      {u.name}
                    </Link>
                  ) : (
                    u.name
                  )}
                </div>
              </td>
              {columns ? (
                columns.map((col) => (
                  <td key={col.key} className="px-5 py-3.5 text-[#475569] whitespace-nowrap">{col.render(u)}</td>
                ))
              ) : (
                <td className="px-5 py-3.5 text-[#475569] whitespace-nowrap">{u.email}</td>
              )}
              <td className="px-5 py-3.5">
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  u.isActive ? 'bg-mwasalatInk-100 text-mwasalatInk-500' : 'bg-[#FBE7E9] text-mwasalatRed-600'
                }`}>
                  {!u.passwordSet ? 'Invited' : u.isActive ? 'Active' : 'Blocked'}
                </span>
              </td>
              <td className="px-5 py-3.5 text-[#94A3B8] whitespace-nowrap">
                {new Date(u.createdAt).toLocaleDateString()}
              </td>
              <td className="px-5 py-3.5 text-right">
                <button
                  onClick={() => (u.isActive ? setBlockTarget(u) : onToggle(u))}
                  disabled={pendingId === u._id}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50 whitespace-nowrap ${
                    u.isActive
                      ? 'bg-[#FBE7E9] text-mwasalatRed-600 hover:bg-mwasalatRed-100'
                      : 'bg-mwasalatInk-100 text-mwasalatInk-500 hover:bg-mwasalatInk-200'
                  }`}
                >
                  {pendingId === u._id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : u.isActive ? (
                    <Ban className="w-3.5 h-3.5" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  {u.isActive ? 'Block' : 'Unblock'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {blockTarget && (
        <MwasalatBlockUserModal
          user={blockTarget}
          isSubmitting={pendingId === blockTarget._id}
          onConfirm={handleConfirmBlock}
          onClose={() => setBlockTarget(null)}
        />
      )}
    </div>
  );
}
