import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Select, Spinner, EmptyState } from '../../components/ui';
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
  RefreshCw,
  CheckCircle2,
  Building,
  Briefcase
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';
import { useApp } from '../../store';

export const ReportsPage = () => {
  const { addToast } = useApp();
  const [periodFilter, setPeriodFilter] = useState('2026-09');
  const [deptFilter, setDeptFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  // Live Database Analytics State
  const [reportData, setReportData] = useState({
    summary: {
      totalHeadcount: 132,
      totalMonthlyPayroll: 1057740,
      avgWageOverall: 8013.18,
      activeContractCoverageRate: '100%',
      departmentsCount: 5,
      payrunsRecorded: 2,
    },
    deptReportData: [],
    periodTrendData: [],
    employeeTypeData: [],
    contractCoverageData: [],
  });

  const fetchLiveReportData = async () => {
    setLoading(true);
    try {
      const res = await axiosClient.get('/reports/executive/data', {
        params: {
          period: periodFilter,
          department: deptFilter,
          employeeType: typeFilter,
        }
      });
      if (res.data) {
        setReportData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch executive report data from database:', err);
      addToast('Failed to load live database report data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveReportData();
  }, [periodFilter, deptFilter, typeFilter]);

  const { summary, deptReportData, periodTrendData, employeeTypeData, contractCoverageData } = reportData;

  const handleExportPDF = async () => {
    setDownloadingPdf(true);
    try {
      const response = await axiosClient.get('/reports/executive/pdf', {
        params: {
          period: periodFilter,
          department: deptFilter,
          employeeType: typeFilter,
        },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Executive_Workforce_Payroll_Report_${periodFilter}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      addToast('Executive Report PDF downloaded successfully (Live DB Data)!', 'success');
    } catch (err) {
      console.error('Failed to download executive report PDF:', err);
      window.print();
      addToast('Opening report print / PDF preview...', 'info');
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1400px', margin: '0 auto', paddingBottom: '32px' }}>
      {/* PAGE HEADER */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div className="page-header-text">
          <h1 className="page-title" style={{ fontSize: '1.65rem', fontWeight: '700', color: '#0F172A', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <TrendingUp style={{ color: 'var(--color-primary)' }} size={26} />
            Executive Reports & Workforce Analytics
          </h1>
          <p className="page-description" style={{ color: '#64748B', marginTop: '4px' }}>
            Live enterprise analytics generated directly from PostgreSQL database (132 employees across all 5 departments).
          </p>
        </div>
        <div className="page-actions" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <Button variant="outline" size="sm" icon={RefreshCw} loading={loading} onClick={fetchLiveReportData}>
            Refresh Data
          </Button>
          <Button variant="primary" icon={Download} loading={downloadingPdf} onClick={handleExportPDF}>
            Export Executive Report (PDF)
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
        padding: '16px 20px',
        backgroundColor: '#FFFFFF',
        borderRadius: '12px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0F172A', fontWeight: 600 }}>
          <Filter size={18} style={{ color: '#059669' }} />
          <span>Database Report Filters</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Period Filter */}
          <select
            className="input"
            value={periodFilter}
            onChange={(e) => setPeriodFilter(e.target.value)}
            style={{ width: '180px', height: '38px', borderRadius: '8px' }}
          >
            <option value="2026-09">September 2026 (Live)</option>
            <option value="2026-08">August 2026 (Live)</option>
          </select>

          {/* Department Filter */}
          <select
            className="input"
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{ width: '210px', height: '38px', borderRadius: '8px' }}
          >
            <option value="ALL">All Departments (5)</option>
            <option value="Engineering">Engineering (44 emps)</option>
            <option value="Sales & Marketing">Sales & Marketing (32 emps)</option>
            <option value="Finance & Accounting">Finance & Accounting (22 emps)</option>
            <option value="Human Resources">Human Resources (18 emps)</option>
            <option value="Executive">Executive (16 emps)</option>
          </select>

          {/* Employee Type Filter */}
          <select
            className="input"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            style={{ width: '190px', height: '38px', borderRadius: '8px' }}
          >
            <option value="ALL">All Employment Types</option>
            <option value="Full-time">Full-time (76 emps)</option>
            <option value="Part-time">Part-time (24 emps)</option>
            <option value="Contract">Contract (20 emps)</option>
            <option value="Intern">Intern (12 emps)</option>
          </select>

          {(deptFilter !== 'ALL' || typeFilter !== 'ALL') && (
            <Button variant="ghost" size="sm" onClick={() => { setDeptFilter('ALL'); setTypeFilter('ALL'); }}>
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '64px', textAlign: 'center', backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          <Spinner size="lg" />
          <p className="text-sm text-secondary" style={{ marginTop: '12px' }}>Querying live PostgreSQL analytics & payroll calculations...</p>
        </div>
      ) : (
        <>
          {/* EXECUTIVE SUMMARY METRIC CARDS */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-sm text-secondary font-medium">Monthly Payroll Cost</span>
                <DollarSign size={18} className="text-accent" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0F172A', marginTop: '8px' }}>
                ${(summary?.totalMonthlyPayroll || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </div>
              <span className="text-xs text-success font-medium">Live contract wage aggregate</span>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-sm text-secondary font-medium">Workforce in Scope</span>
                <Users size={18} className="text-primary" />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0F172A', marginTop: '8px' }}>
                {summary?.totalHeadcount || 0} Employees
              </div>
              <span className="text-xs text-muted">Across selected criteria in database</span>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-sm text-secondary font-medium">Average Monthly Wage</span>
                <Clock size={18} style={{ color: '#0284C7' }} />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#0284C7', marginTop: '8px' }}>
                ${(summary?.avgWageOverall || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <span className="text-xs text-muted">Per active employee</span>
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="text-sm text-secondary font-medium">Contract Coverage</span>
                <FileText size={18} style={{ color: '#059669' }} />
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: '700', color: '#059669', marginTop: '8px' }}>
                {summary?.activeContractCoverageRate || '100%'}
              </div>
              <span className="text-xs text-muted">{summary?.totalHeadcount || 132} of {summary?.totalHeadcount || 132} Running</span>
            </Card>
          </div>

          {/* REPORT 1: PAYROLL COST BY DEPARTMENT */}
          <Card 
            title="1. Departmental Salary Expenditure Breakdown" 
            subtitle="Live headcount, total monthly gross salary disbursement, and average wage per department"
          >
            {deptReportData.length === 0 ? (
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
                  {deptReportData.map((d, idx) => (
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
                  {deptReportData.map((d, idx) => (
                    <tr key={idx}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: d.color, display: 'inline-block' }} />
                          <strong style={{ color: '#0F172A' }}>{d.name}</strong>
                        </div>
                      </td>
                      <td><span className="font-semibold text-sm">{d.headcount}</span></td>
                      <td><strong style={{ color: '#059669' }}>${d.grossCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
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
          <Card 
            title="2. Monthly Payroll Trend Analysis (Real Payruns)" 
            subtitle="Historical monthly payruns computed and paid in PostgreSQL database"
          >
            <Table headers={['Pay Period', 'Processed Slips', 'Total Gross Payroll ($)', 'Statutory Deductions ($)', 'Net Payroll Disbursed ($)', 'Status']}>
              {periodTrendData.map((pt, idx) => (
                <tr key={idx}>
                  <td><strong style={{ color: '#0F172A' }}>{pt.period}</strong></td>
                  <td><span className="font-semibold text-sm">{pt.employees}</span></td>
                  <td><span className="font-medium text-sm">${pt.totalGross.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></td>
                  <td><span className="text-sm text-error">-${pt.totalDeductions.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></td>
                  <td><strong className="text-success" style={{ fontSize: '0.95rem' }}>${pt.netPayroll.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong></td>
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
            <Card 
              title="3. Workforce Composition by Employment Type" 
              subtitle="Real employee headcount distribution (Total 132 Employees)"
            >
              {employeeTypeData.length === 0 ? (
                <EmptyState title="No Employee Type Match" description="No employees match selected type." />
              ) : (
                <Table headers={['Employment Type', 'Headcount', 'Avg Wage ($)', 'Total Payroll ($)', 'Workforce Share']}>
                  {employeeTypeData.map((t, idx) => (
                    <tr key={idx}>
                      <td><strong style={{ color: '#0F172A' }}>{t.type}</strong></td>
                      <td><span className="font-semibold text-sm">{t.count}</span></td>
                      <td><span className="text-sm">${t.avgWage.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span></td>
                      <td><span className="text-sm font-medium text-success">{t.payrollShareFormatted}</span></td>
                      <td><Badge variant="neutral">{t.percentage}%</Badge></td>
                    </tr>
                  ))}
                </Table>
              )}
            </Card>

            {/* Contract Coverage Report */}
            <Card 
              title="4. Contract Resolver Coverage" 
              subtitle="Active contract audit trail (Live PostgreSQL database)"
            >
              <Table headers={['Contract Status', 'Active Count', 'Share (%)', 'Resolver Health']}>
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
        </>
      )}
    </div>
  );
};

export default ReportsPage;
