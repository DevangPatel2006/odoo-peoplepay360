import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Spinner, Alert } from '../../../components/ui';
import { Plus, Eye, Calendar, RefreshCw } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

export const PayrunList = ({ onStartWizard, onSelectPayrun }) => {
  const [payruns, setPayruns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchPayruns = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get('/payruns');
      const list = Array.isArray(response.data) ? response.data : [];
      setPayruns(list);
    } catch (err) {
      console.error('Failed to load payruns:', err);
      setError(err.response?.data?.error?.message || 'Failed to load payruns.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayruns();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0F172A' }}>Payrun Execution Directory</h3>
          <p className="text-sm text-secondary">Historical payruns, payslip evaluation batches, and payment states.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchPayruns} loading={loading}>
            Refresh
          </Button>
          <Button variant="accent" icon={Plus} onClick={onStartWizard}>
            Launch 2-Step Payrun Wizard
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <Spinner size="lg" />
          <p className="text-sm text-secondary" style={{ marginTop: '8px' }}>Loading payrun batches...</p>
        </div>
      ) : payruns.length === 0 ? (
        <Card>
          <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
            <Calendar size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
            <h4 style={{ color: '#0F172A', marginBottom: '4px' }}>No Payruns Executed Yet</h4>
            <p className="text-sm" style={{ marginBottom: '16px' }}>
              Launch your first payrun to compute employee payslips, evaluate salary structures, and initiate payroll disbursement.
            </p>
            <Button variant="accent" icon={Plus} onClick={onStartWizard}>
              Launch 2-Step Payrun Wizard
            </Button>
          </div>
        </Card>
      ) : (
        <Table headers={['Payrun Title', 'Period', 'Structure', 'Employees', 'Gross Payroll', 'Net Payroll', 'Status', 'Actions']}>
          {payruns.map((pr) => {
            const start = pr.period_start ? String(pr.period_start).slice(0, 10) : '';
            const end = pr.period_end ? String(pr.period_end).slice(0, 10) : '';
            const periodStr = start ? `${start} to ${end}` : 'N/A';
            const gross = pr.total_gross_amount ? `$${parseFloat(pr.total_gross_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00';
            const net = pr.total_net_amount ? `$${parseFloat(pr.total_net_amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '$0.00';
            const empCount = pr.total_employees_count ?? pr.employees_count ?? 0;

            const badgeVariant = pr.status === 'Paid' 
              ? 'success' 
              : pr.status === 'Validated' 
                ? 'accent' 
                : pr.status === 'Computed' 
                  ? 'primary' 
                  : 'warning';

            return (
              <tr key={pr.id}>
                <td>
                  <strong style={{ color: '#0F172A' }}>{pr.name}</strong>
                  <div className="text-xs text-muted">ID: #{pr.id}</div>
                </td>
                <td><span className="text-sm">{periodStr}</span></td>
                <td><span className="text-sm text-secondary">{pr.salary_structure_name || 'Standard'}</span></td>
                <td><span className="font-semibold text-sm">{empCount}</span></td>
                <td><span className="font-medium text-sm">{gross}</span></td>
                <td><strong className="text-success">{net}</strong></td>
                <td>
                  <Badge variant={badgeVariant} dot>
                    {pr.status}
                  </Badge>
                </td>
                <td>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    icon={Eye}
                    onClick={() => onSelectPayrun && onSelectPayrun(pr)}
                  >
                    View / Process
                  </Button>
                </td>
              </tr>
            );
          })}
        </Table>
      )}
    </div>
  );
};

export default PayrunList;
