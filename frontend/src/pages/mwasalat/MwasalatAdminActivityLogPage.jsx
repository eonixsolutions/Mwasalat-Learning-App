import { useState, useEffect } from 'react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import { mwasalatActivityLogService } from '../../services/mwasalatActivityLog.service.js';

const ACTION_LABELS = {
  login: 'Logged in',
  invite_instructor: 'Invited instructor',
  block_user: 'Blocked user',
  unblock_user: 'Unblocked user',
  create_program: 'Created program',
  update_program: 'Updated program',
  delete_program: 'Deleted program',
  send_notification: 'Sent notification',
  update_settings: 'Updated settings',
};

const COLUMNS = [
  {
    key: 'actor',
    label: 'Actor',
    render: (log) => (
      <>
        <p className="font-medium text-[#1E293B]">{log.actorName ?? 'Unknown'}</p>
        <p className="text-xs text-[#94A3B8] capitalize">{log.actorRole?.replace('_', ' ')}</p>
      </>
    ),
  },
  {
    key: 'action',
    label: 'Action',
    render: (log) => (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-[#F1F5F9] text-[#475569]">
        {ACTION_LABELS[log.action] ?? log.action}
      </span>
    ),
  },
  {
    key: 'metadata',
    label: 'Detail',
    render: (log) => (
      <span className="text-[#475569]">
        {log.metadata?.title ?? log.metadata?.targetName ?? log.metadata?.email ?? '—'}
      </span>
    ),
  },
  {
    key: 'createdAt',
    label: 'When',
    render: (log) => (
      <span className="text-[#94A3B8]">
        {new Date(log.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
      </span>
    ),
  },
];

export default function MwasalatAdminActivityLogPage() {
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mwasalatActivityLogService.list({ page: 1, limit: 200 })
      .then((data) => setLogs(data.logs))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <MwasalatAdminLayout title="Activity Log" subtitle="Audit trail of admin and account actions">
      <div className="max-w-6xl mx-auto">
        <MwasalatDataTable
          columns={COLUMNS}
          rows={logs}
          isLoading={isLoading}
          emptyLabel="No activity recorded yet."
          searchPlaceholder="Search by actor or action…"
          searchable={(log) => `${log.actorName ?? ''} ${ACTION_LABELS[log.action] ?? log.action}`}
        />
      </div>
    </MwasalatAdminLayout>
  );
}
