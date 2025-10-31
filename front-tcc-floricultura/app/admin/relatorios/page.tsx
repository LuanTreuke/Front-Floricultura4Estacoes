import React from 'react';
import ReportsDashboard from './ReportsDashboard';
import AdminLayout from '../AdminLayout';

export default function RelatoriosPage() {
  return (
    <AdminLayout>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <ReportsDashboard />
      </div>
    </AdminLayout>
  );
}
