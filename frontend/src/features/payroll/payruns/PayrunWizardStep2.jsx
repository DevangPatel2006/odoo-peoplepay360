import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Alert, Spinner } from '../../../components/ui';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowLeft, 
  Play
} from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

export const PayrunWizardStep2 = ({ config, onBack, onCreatePayrun }) => {
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    let isMounted = true;
    const fetchEligibleEmployees = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axiosClient.post('/payruns/preview-eligible-employees', {
          salary_structure_id: Number(config.salary_structure_id),
          period_start: config.startDate,
          period_end: config.endDate,
          employee_type_filter: config.employeeType || null,
        });

        if (!isMounted) return;

        const eligibleList = Array.isArray(response.data) ? response.data : [];
        const skippedList = Array.isArray(response.meta?.skipped) ? response.meta.skipped : [];
        const warningsList = Array.isArray(response.meta?.warnings) ? response.meta.warnings : [];

        const mappedEligible = eligibleList.map((item) => {
          const emp = item.employee;
          const contract = item.resolved_contract;
          return {
            id: `EMP-${emp.id}`,
            numericId: emp.id,
            name: `${emp.first_name} ${emp.last_name}`,
            department: emp.department_name || 'General',
            departmentId: emp.department_id,
            contractId: contract?.contract_number || (contract?.id ? `CON-${contract.id}` : 'None'),
            salary: contract?.wage_per_month ? `$${parseFloat(contract.wage_per_month).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A',
            eligibility: 'Eligible',
            warning: null,
            selected: true,
          };
        });

        const mappedWarnings = warningsList.map((item) => {
          const emp = item.employee;
          const contract = item.resolved_contract;
          const warningText = Array.isArray(item.warning_reasons)
            ? item.warning_reasons.join(', ')
            : (item.warning || item.reason || 'Flagged issue detected');

          return {
            id: `WRN-${emp.id}`,
            numericId: emp.id,
            name: `${emp.first_name} ${emp.last_name}`,
            department: emp.department_name || 'General',
            departmentId: emp.department_id,
            contractId: contract?.contract_number || (contract?.id ? `CON-${contract.id}` : 'None'),
            salary: contract?.wage_per_month ? `$${parseFloat(contract.wage_per_month).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A',
            eligibility: 'Warning',
            warning: warningText,
            selected: true,
          };
        });

        const mappedSkipped = skippedList.map((item, idx) => {
          const emp = item.employee;
          return {
            id: `SKP-${emp.id || idx}`,
            numericId: emp.id,
            name: `${emp.first_name} ${emp.last_name}`,
            department: emp.department_name || 'General',
            departmentId: emp.department_id,
            contractId: 'No Applicable Contract',
            salary: 'N/A',
            eligibility: 'Blocked',
            warning: item.reason || 'Missing running contract for period',
            selected: false,
          };
        });

        let combined = [...mappedEligible, ...mappedWarnings, ...mappedSkipped];

        // If department filter specified in step 1 and not ALL
        if (config.department && config.department !== 'ALL') {
          combined = combined.filter((e) => String(e.departmentId) === String(config.department) || e.department === config.department);
        }

        setEmployees(combined);
      } catch (err) {
        console.error('Failed to preview eligible employees:', err);
        if (isMounted) {
          setError(err.response?.data?.error?.message || 'Failed to fetch eligible employees for this configuration.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchEligibleEmployees();
    return () => { isMounted = false; };
  }, [config]);

  const selectedCount = employees.filter((e) => e.selected).length;
  const eligibleCount = employees.filter((e) => e.eligibility === 'Eligible').length;
  const warningCount = employees.filter((e) => e.eligibility === 'Warning').length;
  const blockedCount = employees.filter((e) => e.eligibility === 'Blocked').length;

  const handleToggleSelect = (id) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e))
    );
  };

  const handleSelectAll = () => {
    const allEligibleSelected = employees
      .filter((e) => e.eligibility !== 'Blocked')
      .every((e) => e.selected);

    setEmployees((prev) =>
      prev.map((e) => ({
        ...e,
        selected: e.eligibility !== 'Blocked' ? !allEligibleSelected : false,
      }))
    );
  };

  const handleSubmitPayrun = async () => {
    const selectedList = employees.filter((e) => e.selected);
    const selectedIds = selectedList.map((e) => e.numericId).filter(Boolean);

    if (selectedIds.length === 0) {
      setError('Please select at least one eligible employee to create a payrun.');
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const response = await axiosClient.post('/payruns', {
        name: config.payrunTitle,
        salary_structure_id: Number(config.salary_structure_id),
        period_start: config.startDate,
        period_end: config.endDate,
        employee_type_filter: config.employeeType || null,
        employee_ids: selectedIds,
      });

      onCreatePayrun(response.data);
    } catch (err) {
      console.error('Failed to create payrun:', err);
      setError(err.response?.data?.error?.message || 'Error creating payrun batch.');
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* STEPPER HEADER */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 24px',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, opacity: 0.7 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#059669', color: '#FFFFFF', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>✓</div>
          <div>
            <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.875rem' }}>Step 1: Configuration</strong>
            <span className="text-xs text-success font-medium">Completed</span>
          </div>
        </div>
        <div className="text-muted" style={{ padding: '0 12px' }}>→</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#7C3AED', color: '#FFFFFF', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>02</div>
          <div>
            <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.875rem' }}>Step 2: Employees</strong>
            <span className="text-xs text-secondary">Targeting & eligibility</span>
          </div>
        </div>
        <div className="text-muted" style={{ padding: '0 12px' }}>→</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, opacity: 0.5 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E2E8F0', color: '#64748B', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>03</div>
          <div>
            <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.875rem' }}>Step 3: Processing</strong>
            <span className="text-xs text-muted">Formula calculation</span>
          </div>
        </div>
      </div>

      {/* STATS SUMMARY BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '16px 20px',
        backgroundColor: '#172554',
        color: '#FFFFFF',
        borderRadius: '14px',
        boxShadow: 'var(--shadow-sm)'
      }}>
        <div>
          <h3 style={{ color: '#FFFFFF', fontSize: '1.25rem', fontWeight: 700 }}>
            {config.payrunTitle}
          </h3>
          <p style={{ color: '#94A3B8', fontSize: '0.875rem', marginTop: '2px' }}>
            Period: {config.startDate} to {config.endDate}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Badge variant="accent" style={{ fontSize: '0.875rem', padding: '6px 12px' }}>
            Selected Employees: {selectedCount} of {employees.length}
          </Badge>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {/* EMPLOYEE SELECTION TABLE */}
      <Card title="Employee Target Selection & Validation" subtitle="Live backend eligibility resolver results">
        {loading ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <Spinner size="lg" />
            <p className="text-sm text-secondary" style={{ marginTop: '8px' }}>Evaluating employee contracts for period...</p>
          </div>
        ) : employees.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#64748B' }}>
            <Users size={32} style={{ margin: '0 auto 8px', opacity: 0.5 }} />
            <p>No active employees found matching the chosen salary structure and criteria.</p>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Button variant="outline" size="sm" onClick={handleSelectAll}>
                Toggle Select All Eligible
              </Button>
              <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 600 }}>
                  ● Eligible ({eligibleCount})
                </span>
                {warningCount > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#D97706', fontWeight: 600 }}>
                    ● Warning ({warningCount})
                  </span>
                )}
                {blockedCount > 0 && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#E11D48', fontWeight: 600 }}>
                    ● Blocked ({blockedCount})
                  </span>
                )}
              </div>
            </div>

            <Table headers={['Select', 'Employee', 'Department', 'Contract', 'Base Salary', 'Eligibility Status', 'Notes / Warnings']}>
              {employees.map((emp) => {
                const isEligible = emp.eligibility === 'Eligible';
                const isWarning = emp.eligibility === 'Warning';
                const isBlocked = emp.eligibility === 'Blocked';

                return (
                  <tr key={emp.id} style={{ opacity: isBlocked ? 0.6 : 1 }}>
                    <td>
                      <input
                        type="checkbox"
                        checked={emp.selected}
                        disabled={isBlocked}
                        onChange={() => handleToggleSelect(emp.id)}
                        style={{ width: '18px', height: '18px', cursor: isBlocked ? 'not-allowed' : 'pointer' }}
                      />
                    </td>
                    <td>
                      <strong style={{ color: '#0F172A' }}>{emp.name}</strong>
                      <div className="text-xs text-muted">ID: {emp.id}</div>
                    </td>
                    <td>{emp.department}</td>
                    <td><span className="font-mono text-sm">{emp.contractId}</span></td>
                    <td><strong style={{ color: '#059669' }}>{emp.salary}</strong></td>
                    <td>
                      <Badge variant={isEligible ? 'success' : isWarning ? 'warning' : 'error'} dot>
                        {emp.eligibility}
                      </Badge>
                    </td>
                    <td>
                      {emp.warning ? (
                        <span style={{ fontSize: '0.75rem', color: isBlocked ? '#E11D48' : '#D97706', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={14} /> {emp.warning}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">Valid running contract</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </Table>
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
          <Button variant="outline" icon={ArrowLeft} onClick={onBack}>
            Back to Step 1: Configuration
          </Button>

          <Button 
            variant="accent" 
            size="lg" 
            icon={Play}
            loading={creating}
            disabled={selectedCount === 0 || loading}
            onClick={handleSubmitPayrun}
          >
            Create Payrun Batch ({selectedCount} Employees)
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default PayrunWizardStep2;
