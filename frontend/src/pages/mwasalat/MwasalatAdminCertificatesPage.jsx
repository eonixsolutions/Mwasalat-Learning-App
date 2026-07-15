import { useState, useEffect } from 'react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import MwasalatDataTable from '../../components/mwasalat/MwasalatDataTable.jsx';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { themeForCategory } from '../../utils/mwasalatCategoryTheme.js';

const COLUMNS = [
  {
    key: 'learner',
    label: 'Learner',
    render: (c) => (
      <>
        <p className="font-medium text-[#1E293B]">{c.learner?.name}</p>
        <p className="text-xs text-[#94A3B8]">{c.learner?.email}</p>
      </>
    ),
  },
  { key: 'course', label: 'Course', render: (c) => <span className="text-[#475569]">{c.program?.title}</span> },
  {
    key: 'category',
    label: 'Category',
    render: (c) => {
      const theme = themeForCategory(c.program?.category);
      return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium capitalize ${theme.bg} ${theme.text}`}>
          {c.program?.category || 'General'}
        </span>
      );
    },
  },
  {
    key: 'issuedAt',
    label: 'Issued',
    render: (c) => (
      <span className="text-[#94A3B8]">
        {new Date(c.issuedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
      </span>
    ),
  },
  { key: 'certificateNumber', label: 'Certificate No.', render: (c) => <span className="text-[#94A3B8]">{c.certificateNumber}</span> },
];

export default function MwasalatAdminCertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mwasalatProgramService.listAllCertificates().then(setCertificates).finally(() => setIsLoading(false));
  }, []);

  return (
    <MwasalatAdminLayout title="Certificates Issued" subtitle="Every certificate earned across the platform">
      <div className="max-w-5xl mx-auto">
        <MwasalatDataTable
          columns={COLUMNS}
          rows={certificates}
          isLoading={isLoading}
          emptyLabel="No certificates issued yet."
          searchPlaceholder="Search by learner or course…"
          searchable={(c) => `${c.learner?.name ?? ''} ${c.learner?.email ?? ''} ${c.program?.title ?? ''}`}
        />
      </div>
    </MwasalatAdminLayout>
  );
}
