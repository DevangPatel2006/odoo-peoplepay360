import React, { useState } from 'react';
import { Card, Tabs, Badge } from '../../components/ui';
import { RequestList } from './RequestList';
import { AllocationList } from './AllocationList';
import { TimeOffTypeList } from './TimeOffTypeList';
import { Calendar, FileText, CheckCircle2, ArrowRight } from 'lucide-react';

export const TimeOffPage = () => {
  const [activeTab, setActiveTab] = useState('requests');

  const tabs = [
    { id: 'requests', label: 'Time Off Requests' },
    { id: 'allocations', label: 'Leave Allocations' },
    { id: 'types', label: 'Leave Types' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Time Off & Leave Management</h1>
          <p className="page-description">
            Request leave, review allocation balances, and process manager approvals.
          </p>
        </div>
      </div>

      {/* WORKFLOW STEPPER BANNER */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div className="text-xs text-muted font-semibold" style={{ textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
          Source of Truth Business Workflow
        </div>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          fontSize: '0.875rem',
          fontWeight: '600'
        }}>
          <Badge variant="neutral">1. TIME OFF TYPE</Badge>
          <ArrowRight size={14} className="text-muted" />
          <Badge variant="neutral">2. ALLOCATION</Badge>
          <ArrowRight size={14} className="text-muted" />
          <Badge variant="accent">3. REQUEST</Badge>
          <ArrowRight size={14} className="text-muted" />
          <Badge variant="warning">4. APPROVAL / REFUSAL</Badge>
          <ArrowRight size={14} className="text-muted" />
          <Badge variant="success">5. BALANCE</Badge>
        </div>
      </div>

      {/* ALLOCATION BALANCE OVERVIEW CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card>
          <span className="text-sm text-secondary font-medium">Total Allocated Days</span>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0F172A', marginTop: '8px' }}>185 Days</div>
          <div className="text-xs text-muted" style={{ marginTop: '2px' }}>Organization annual quota</div>
        </Card>

        <Card>
          <span className="text-sm text-secondary font-medium">Total Used Days</span>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#64748B', marginTop: '8px' }}>42 Days</div>
          <div className="text-xs text-muted" style={{ marginTop: '2px' }}>Approved leave consumption</div>
        </Card>

        <Card>
          <span className="text-sm text-secondary font-medium">Remaining Available Balance</span>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#059669', marginTop: '8px' }}>143 Days</div>
          <div className="text-xs text-success" style={{ marginTop: '2px' }}>Healthy available balance</div>
        </Card>
      </div>

      {/* NAVIGATION TABS & TAB CONTENT */}
      <Card>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === 'requests' && <RequestList />}
        {activeTab === 'allocations' && <AllocationList />}
        {activeTab === 'types' && <TimeOffTypeList />}
      </Card>
    </div>
  );
};

export default TimeOffPage;
