import React, { useState } from 'react';
import { Card, Table, Badge, Button, Alert } from '../../../components/ui';
import { 
  Users, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  ArrowLeft, 
  Play, 
  CheckSquare, 
  Square 
} from 'lucide-react';

export const PayrunWizardStep2 = ({ config, onBack, onCreatePayrun, loading }) => {
  // Employee list returned by existing backend API contract with eligibility & warning results
  const backendTargetEmployees = [
    {
      id: 'EMP-101',
      name: 'Alexander Wright',
      department: 'Software Engineering',
      contractId: 'CNT-101',
      salary: '$8,500.00 / mo',
      eligibility: 'Eligible', // Emerald
      warning: null,
      selected: true,
    },
    {
      id: 'EMP-102',
      name: 'Sophia Martinez',
      department: 'Human Resources',
      contractId: 'CNT-102',
      salary: '$6,200.00 / mo',
      eligibility: 'Eligible',
      warning: null,
      selected: true,
    },
    {
      id: 'EMP-103',
      name: 'Marcus Vance',
      department: 'Finance & Accounting',
      contractId: 'CNT-103',
      salary: '$7,100.00 / mo',
      eligibility: 'Warning', // Amber
      warning: 'Contract expiring in 5 days',
      selected: true,
    },
    {
      id: 'EMP-104',
      name: 'Elena Rostova',
      department: 'Sales & Marketing',
      contractId: 'CNT-104-DRAFT',
      salary: '$9,500.00 / mo',
      eligibility: 'Blocked', // Rose
      warning: 'Missing running contract & IBAN routing number',
      selected: false,
    },
    {
      id: 'EMP-105',
      name: 'David Chen',
      department: 'Software Engineering',
      contractId: 'CNT-105',
      salary: '$7,800.00 / mo',
      eligibility: 'Eligible',
      warning: null,
      selected: true,
    },
  ];

  const [employees, setEmployees] = useState(backendTargetEmployees);

  const selectedCount = employees.filter((e) => e.selected).length;

  const handleToggleSelect = (id) => {
    setEmployees((prev) =>
      prev.map((e) => (e.id === id ? { ...e, selected: !e.selected } : e))
    );
  };

  const handleSelectAll = () => {
    const allSelected = employees.every((e) => e.selected || e.eligibility === 'Blocked');
    setEmployees((prev) =>
      prev.map((e) => ({
        ...e,
        selected: e.eligibility !== 'Blocked' && !allSelected,
      }))
    );
  };

  const handleSubmitPayrun = () => {
    const selectedList = employees.filter((e) => e.selected);
    onCreatePayrun(selectedList);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* PROGRESS STEPPER HEADER */}
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
            <span className="text-xs text-secondary">Targeting & warnings</span>
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
        <div className="text-muted" style={{ padding: '0 12px' }}>→</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, opacity: 0.5 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E2E8F0', color: '#64748B', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>04</div>
          <div>
            <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.875rem' }}>Step 4: Complete</strong>
            <span className="text-xs text-muted">Payslips & email PDF</span>
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
            Period: {config.startDate} to {config.endDate} • Target Scope: {config.department}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Badge variant="accent" style={{ fontSize: '0.875rem', padding: '6px 12px' }}>
            Selected Employees: {selectedCount} of {employees.length}
          </Badge>
        </div>
      </div>

      {/* EMPLOYEE SELECTION TABLE */}
      <Card title="Employee Target Selection & Validation" subtitle="Backend eligibility resolver results">
        <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button variant="outline" size="sm" onClick={handleSelectAll}>
            Toggle Select All Eligible
          </Button>
          <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#059669', fontWeight: 600 }}>
              ● Eligible (3)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#D97706', fontWeight: 600 }}>
              ● Warning (1)
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#E11D48', fontWeight: 600 }}>
              ● Blocked (1)
            </span>
          </div>
        </div>

        <Table headers={['Select', 'Employee', 'Department', 'Contract', 'Base Salary', 'Eligibility Status', 'Anomalies & Warnings']}>
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
                  {/* Visual distinction: Eligible -> Emerald, Warning -> Amber, Blocked -> Rose */}
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
                    <span className="text-xs text-muted">Clean</span>
                  )}
                </td>
              </tr>
            );
          })}
        </Table>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px' }}>
          <Button variant="outline" icon={ArrowLeft} onClick={onBack}>
            Back to Step 1: Configuration
          </Button>

          {/* PRIMARY CTA FOR PAYRUN CREATION */}
          <Button 
            variant="accent" 
            size="lg" 
            icon={Play}
            loading={loading}
            disabled={selectedCount === 0}
            onClick={handleSubmitPayrun}
          >
            Create Payrun ({selectedCount} Employees)
          </Button>
        </div>
      </Card>
    </div>
  );
};
