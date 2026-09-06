import React, { useState, useEffect, useCallback } from 'react';
import { KpiCards } from './KpiCards';
import { AlertsPanel } from './AlertsPanel';
import { SalaryCostByDeptChart } from './SalaryCostByDeptChart';
import { DepartmentOverview } from './DepartmentOverview';
import { MonthlyTrendChart } from './MonthlyTrendChart';
import { AttendanceOverview } from './AttendanceOverview';
import { TimeOffOverview } from './TimeOffOverview';
import { Button, Spinner, Alert, Select, Input } from '../../components/ui';
import { Play, RefreshCw, Filter, X, Calendar } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axiosClient from '../../api/axiosClient';

export const DashboardPage = () => {
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedType, setSelectedType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Load departments once for filter dropdown
  useEffect(() => {
    let isMounted = true;
    axiosClient.get('/departments')
      .then((res) => {
        if (isMounted) {
          const list = Array.isArray(res.data) ? res.data : [];
          setDepartments(list);
        }
      })
      .catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {};
      if (selectedDept) params.department_id = selectedDept;
      if (selectedType) params.employee_type = selectedType;
      if (startDate) params.period_start = startDate;
      if (endDate) params.period_end = endDate;

      const response = await axiosClient.get('/dashboard', { params });
      setDashboardData(response.data);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError(err.response?.data?.error?.message || 'Unable to connect to the backend server. Please verify your connection.');
      setDashboardData(null);
    } finally {
      setLoading(false);
    }
  }, [selectedDept, selectedType, startDate, endDate]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const hasActiveFilters = Boolean(selectedDept || selectedType || startDate || endDate);

  const clearFilters = () => {
    setSelectedDept('');
    setSelectedType('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* TOP HEADER SECTION */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">PayOps Dashboard</h1>
          <p className="page-description">Real-time workforce, attendance, and strategic payroll intelligence.</p>
        </div>
        <div className="page-actions">
          <Button 
            variant="outline" 
            size="sm" 
            icon={RefreshCw} 
            loading={loading}
            onClick={fetchDashboardData}
          >
            Refresh
          </Button>
          <Button 
            variant="accent" 
            icon={Play}
            onClick={() => navigate('/payroll')}
          >
            Launch Payrun Wizard
          </Button>
        </div>
      </div>

      {/* FILTER CONTROL BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '14px 18px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#1E293B', fontWeight: 600, fontSize: '0.875rem' }}>
            <Filter size={16} color="var(--color-accent)" />
            <span>Filter Analytics:</span>
          </div>

          <div style={{ width: '205px' }}>
            <Select
              value={selectedDept}
              onChange={(e) => setSelectedDept(e.target.value)}
              options={[
                { value: '', label: 'All Departments' },
                ...departments.map((d) => ({ value: String(d.id), label: d.name })),
              ]}
            />
          </div>

          <div style={{ width: '220px' }}>
            <Select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              options={[
                { value: '', label: 'All Employment Types' },
                { value: 'Full-time', label: 'Full-time' },
                { value: 'Part-time', label: 'Part-time' },
                { value: 'Contract', label: 'Contract' },
                { value: 'Intern', label: 'Intern' },
              ]}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              style={{ width: '145px', marginBottom: 0 }}
              placeholder="Start Date"
            />
            <span className="text-xs text-muted">to</span>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              style={{ width: '145px', marginBottom: 0 }}
              placeholder="End Date"
            />
          </div>

          {hasActiveFilters && (
            <Button variant="ghost" size="sm" icon={X} onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        {hasActiveFilters && (
          <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 500 }}>
            Showing filtered metrics for strategic decision-making
          </div>
        )}
      </div>

      {error && (
        <Alert type="error">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span>{error}</span>
            <Button size="xs" variant="outline" onClick={fetchDashboardData}>Try Again</Button>
          </div>
        </Alert>
      )}

      {/* KPI CARDS GRID */}
      {loading && !dashboardData ? (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p className="text-sm text-secondary" style={{ marginTop: '8px' }}>Loading organization metrics...</p>
        </div>
      ) : (
        <KpiCards data={dashboardData || {}} />
      )}

      {/* ATTENTION REQUIRED (Actionable Warnings Section) */}
      <AlertsPanel warnings={[]} />

      {/* FINANCIAL ANALYTICS (2 EQUAL COLUMNS) */}
      <div className="dashboard-row-financials">
        <SalaryCostByDeptChart data={dashboardData?.salaryCost || []} />
        <MonthlyTrendChart data={dashboardData?.monthlyTrend || []} />
      </div>

      {/* WORKFORCE & HR OPERATIONS (3 EQUAL COLUMNS) */}
      <div className="dashboard-row-operations">
        <DepartmentOverview data={dashboardData?.departmentOverview || []} />
        <AttendanceOverview data={dashboardData?.attendance} />
        <TimeOffOverview data={dashboardData?.timeOff} recentRequests={dashboardData?.recentRequests} />
      </div>
    </div>
  );
};

export default DashboardPage;
