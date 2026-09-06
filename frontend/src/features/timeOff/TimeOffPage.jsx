import React, { useState, useEffect } from 'react';
import { Card, Tabs, Badge, Button, Spinner } from '../../components/ui';
import { RequestList } from './RequestList';
import { AllocationList } from './AllocationList';
import { Calendar, RefreshCw, ArrowRight } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export const TimeOffPage = () => {
  const [activeTab, setActiveTab] = useState('requests');
  const [stats, setStats] = useState({ allocated: 0, used: 0, remaining: 0 });
  const [loadingStats, setLoadingStats] = useState(true);

  const tabs = [
    { id: 'requests', label: 'Time Off Requests' },
    { id: 'allocations', label: 'Leave Allocations' },
  ];

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const response = await axiosClient.get('/time-off/allocations');
      const allocs = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      const approvedAllocs = allocs.filter((a) => a.status === 'Approved');
      const totalAlloc = approvedAllocs.reduce((acc, a) => acc + parseFloat(a.allocated_amount || 0), 0);
      const totalUsed = approvedAllocs.reduce((acc, a) => acc + parseFloat(a.taken_amount || 0), 0);
      const totalRem = approvedAllocs.reduce((acc, a) => acc + parseFloat(a.remaining_amount ?? (a.allocated_amount - a.taken_amount)), 0);

      setStats({
        allocated: totalAlloc,
        used: totalUsed,
        remaining: totalRem,
      });
    } catch (err) {
      console.error('Failed to load leave statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

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
        <div className="page-actions">
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchStats} loading={loadingStats}>
            Refresh Balances
          </Button>
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
          Leave Lifecycle Workflow
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
          <Badge variant="success">5. BALANCE DEDUCTION</Badge>
        </div>
      </div>

      

      {/* NAVIGATION TABS & TAB CONTENT */}
      <Card>
        <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        {activeTab === 'requests' && <RequestList onRefreshBalances={fetchStats} />}
        {activeTab === 'allocations' && <AllocationList onRefreshBalances={fetchStats} />}
      </Card>
    </div>
  );
};

export default TimeOffPage;
