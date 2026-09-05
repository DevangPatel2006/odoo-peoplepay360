import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Select, Input, EmptyState, Spinner } from '../../components/ui';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  DollarSign, 
  Calendar, 
  Clock, 
  FileText, 
  Download, 
  Filter,
  PieChart
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

import { useApp } from '../../store';

export const ReportsPage = () => {
  const { addToast } = useApp();
  const [periodFilter, setPeriodFilter] = useState('2026-09');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(false);
  const [activeReportTab, setActiveReportTab] = useState('payroll-dept');

  // Executive Data Reports
  const deptReportData = [
    { name: 'Software Engineering', headcount: 54, grossCost: 215000, avgWage: 3981.48, percentage: 44.3, color: '#7C3AED' },
    { name: 'Finance & Accounting', headcount: 24, grossCost: 92000, avgWage: 3833.33, percentage: 18.9, color: '#059669' },
    { name: 'Sales & Marketing', headcount: 32, grossCost: 85200, avgWage: 2662.50, percentage: 17.6, color: '#D97706' },
    { name: 'Human Resources', headcount: 18, grossCost: 68000, avgWage: 3777.78, percentage: 14.0, color: '#3B82F6' },
    { name: 'Executive & Admin', headcount: 14, grossCost: 25000, avgWage: 1785.71, percentage: 5.2, color: '#172554' },
  ];

  const periodTrendData = [
    { period: 'September 2026', employees: 142, totalGross: 485200, totalDeductions: 58224, netPayroll: 426976, status: 'Active' },
    { period: 'August 2026', employees: 138, totalGross: 472100, totalDeductions: 56652, netPayroll: 415448, status: 'Paid' },
    { period: 'July 2026', employees: 135, totalGross: 461000, totalDeductions: 55320, netPayroll: 405680, status: 'Paid' },
    { period: 'June 2026', employees: 130, totalGross: 445000, totalDeductions: 53400, netPayroll: 391600, status: 'Paid' },
  ];

  const employeeTypeData = [
    { type: 'Full-Time Permanent', count: 112, avgHours: 40.0, payrollShare: '$395,000.00' },
    { type: 'Part-Time Regular', count: 18, avgHours: 24.5, payrollShare: '$48,200.00' },
    { type: 'Contractor / Temporary', count: 12, avgHours: 35.0, payrollShare: '$42,000.00' },
  ];

  const contractCoverageData = [
    { status: 'Running Contracts', count: 138, percentage: '97.2%', health: 'Active Coverage', variant: 'success' },
    { status: 'Expired Contracts', count: 4, percentage: '2.8%', health: 'Action Required', variant: 'warning' },
    { status: 'Draft Contracts', count: 1, percentage: '0.7%', health: 'Pending Binding', variant: 'accent' },
  ];

  const filteredDepts = deptReportData.filter((d) => deptFilter === 'ALL' || d.name === deptFilter);
  const filteredTypes = employeeTypeData.filter((t) => typeFilter === 'ALL' || t.type.includes(typeFilter));

  const totalPayrollCost = filteredDepts.reduce((acc, curr) => acc + curr.grossCost, 0);

  const handleExportCSV = () => {
    addToast('Executive report exported as CSV document', 'success');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Executive Reports & Analytics</h1>
          <p className="page-description">
            High-level workforce analytics, departmental salary cost breakdowns, monthly trends, and contract coverage.
          </p>
        </div>
        <div className="page-actions">
          <Button variant="outline" icon={Download} onClick={handleExportCSV}>
            Export Executive Report (CSV)
          </Button>
        </div>
      </div>

      {/* FILTERS CONTROL BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '16px',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#172554', fontWeight: 600 }}>
          <Filter size={18} />
          <span>Report Filters</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <Select
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            style={{ width: '180px' }}
          >
            <option value="2026-09">September 2026</option>
            <option value="2026-08">August 2026</option>
            <option value="2026-Q3">Q3 2026 Summary</option>
            <option value="2026-YTD">Year to Date 2026</option>
          </Select>

          <Select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{ width: '200px' }}
          >
            <option value="ALL">All Departments</option>
            <option value="Software Engineering">Software Engineering</option>
            <option value="Human Resources">Human Resources</option>
            <option value="Finance & Accounting">Finance & Accounting</option>
            <option value="Sales & Marketing">Sales & Marketing</option>
          </Select>

          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: '170px' }}
          >
            <option value="ALL">All Employee Types</option>
            <option value="Full-Time">Full-Time</option>
            <option value="Part-Time">Part-Time</option>
            <option value="Contractor">Contractor</option>
          </Select>

          {(deptFilter !== 'ALL' || typeFilter !== 'ALL') && (
            <Button variant="ghost" size="sm" onClick={() => { setDeptFilter('ALL'); setTypeFilter('ALL'); }}>
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* EXECUTIVE SUMMARY METRIC CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-sm text-secondary font-medium">Filtered Salary Cost</span>
            <DollarSign size={18} className="text-accent" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0F172A', marginTop: '8px' }}>
            ${totalPayrollCost.toLocaleString()}
          </div>
          <span className="text-xs text-success font-medium">Est. Sep 2026 Gross</span>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-sm text-secondary font-medium">Headcount in Scope</span>
            <Users size={18} className="text-primary" />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0F172A', marginTop: '8px' }}>
            {filteredDepts.reduce((a, c) => a + c.headcount, 0)} Employees
          </div>
          <span className="text-xs text-muted">Across selected departments</span>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-sm text-secondary font-medium">Contract Coverage</span>
            <FileText size={18} style={{ color: '#059669' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#059669', marginTop: '8px' }}>
            97.2%
          </div>
          <span className="text-xs text-muted">138 of 142 Active</span>
        </Card>

        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="text-sm text-secondary font-medium">Avg Worked Hours</span>
            <Clock size={18} style={{ color: '#D97706' }} />
          </div>
          <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0F172A', marginTop: '8px' }}>
            39.4 hrs / wk
          </div>
          <span className="text-xs text-muted">Full-time standard</span>
        </Card>
      </div>

      {/* REPORT 1: PAYROLL COST BY DEPARTMENT */}
      <Card title="1. Payroll Cost & Headcount by Department" subtitle="Departmental salary allocation and average wage breakdown">
        {filteredDepts.length === 0 ? (
          <EmptyState title="No Department Data" description="No department records match your filter criteria." />
        ) : (
          <>
            {/* Visual Stacked Progress Bar */}
            <div style={{
              display: 'flex',
              height: '16px',
              borderRadius: '8px',
              overflow: 'hidden',
              marginBottom: '20px',
              backgroundColor: '#E2E8F0'
            }}>
              {filteredDepts.map((d, idx) => (
                <div
                  key={idx}
                  style={{
                    width: `${d.percentage}%`,
                    backgroundColor: d.color,
                    transition: 'width 300ms ease'
                  }}
                  title={`${d.name}: $${d.grossCost.toLocaleString()} (${d.percentage}%)`}
                />
              ))}
            </div>

            <Table headers={['Department Name', 'Employee Count', 'Total Gross Cost ($)', 'Average Wage per Employee', 'Share of Total Payroll']}>
              {filteredDepts.map((d, idx) => (
                <tr key={idx}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: d.color, display: 'inline-block' }} />
                      <strong style={{ color: '#0F172A' }}>{d.name}</strong>
                    </div>
                  </td>
                  <td><span className="font-semibold text-sm">{d.headcount}</span></td>
                  <td><strong style={{ color: '#059669' }}>${d.grossCost.toLocaleString()}</strong></td>
                  <td><span className="text-sm">${d.avgWage.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></td>
                  <td>
                    <Badge variant="accent">{d.percentage}%</Badge>
                  </td>
                </tr>
              ))}
            </Table>
          </>
        )}
      </Card>

      {/* REPORT 2: MONTHLY PAYROLL TREND ANALYSIS */}
      <Card title="2. Monthly Payroll Trend Analysis" subtitle="Historical monthly gross salary, tax deductions, and net transfers">
        <Table headers={['Pay Period', 'Active Employees', 'Total Gross Payroll', 'Statutory Deductions', 'Net Payroll Disbursed', 'Status']}>
          {periodTrendData.map((pt, idx) => (
            <tr key={idx}>
              <td><strong style={{ color: '#0F172A' }}>{pt.period}</strong></td>
              <td><span className="font-semibold text-sm">{pt.employees}</span></td>
              <td><span className="font-medium text-sm">${pt.totalGross.toLocaleString()}</span></td>
              <td><span className="text-sm text-error">-${pt.totalDeductions.toLocaleString()}</span></td>
              <td><strong className="text-success" style={{ fontSize: '0.95rem' }}>${pt.netPayroll.toLocaleString()}</strong></td>
              <td>
                <Badge variant={pt.status === 'Paid' ? 'primary' : 'success'} dot>
                  {pt.status}
                </Badge>
              </td>
            </tr>
          ))}
        </Table>
      </Card>

      {/* REPORT 3 & 4 GRID: EMPLOYEE TYPE & CONTRACT COVERAGE */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {/* Employee Type Distribution */}
        <Card title="3. Employee Type Breakdown" subtitle="Headcount by employment classification">
          {filteredTypes.length === 0 ? (
            <EmptyState title="No Employee Type Match" description="No employees match selected type." />
          ) : (
            <Table headers={['Employment Type', 'Headcount', 'Avg Weekly Hours', 'Monthly Share']}>
              {filteredTypes.map((t, idx) => (
                <tr key={idx}>
                  <td><strong style={{ color: '#0F172A' }}>{t.type}</strong></td>
                  <td><span className="font-semibold text-sm">{t.count}</span></td>
                  <td><span className="text-sm">{t.avgHours} hrs</span></td>
                  <td><span className="text-sm font-medium text-success">{t.payrollShare}</span></td>
                </tr>
              ))}
            </Table>
          )}
        </Card>

        {/* Contract Coverage Report */}
        <Card title="4. Contract Resolver Coverage" subtitle="Active vs Expired contract audit trail">
          <Table headers={['Contract Status', 'Count', 'Share (%)', 'Resolver Health']}>
            {contractCoverageData.map((c, idx) => (
              <tr key={idx}>
                <td><strong style={{ color: '#0F172A' }}>{c.status}</strong></td>
                <td><span className="font-semibold text-sm">{c.count}</span></td>
                <td><span className="text-sm font-mono">{c.percentage}</span></td>
                <td>
                  <Badge variant={c.variant} dot>{c.health}</Badge>
                </td>
              </tr>
            ))}
          </Table>
        </Card>
      </div>
    </div>
  );
};

export default ReportsPage;
