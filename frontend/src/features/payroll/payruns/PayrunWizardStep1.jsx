import React, { useState } from 'react';
import { Card, Button, Input, Select, Badge, Alert } from '../../../components/ui';
import { Calendar, Layers, Building, ArrowRight, CheckCircle2, ShieldAlert } from 'lucide-react';

export const PayrunWizardStep1 = ({ initialConfig, onNext, onCancel }) => {
  const [config, setConfig] = useState({
    payrunTitle: initialConfig?.payrunTitle || 'September 2026 Monthly Payrun',
    startDate: initialConfig?.startDate || '2026-09-01',
    endDate: initialConfig?.endDate || '2026-09-30',
    salaryStructure: initialConfig?.salaryStructure || 'ALL',
    department: initialConfig?.department || 'ALL',
    paymentDate: initialConfig?.paymentDate || '2026-09-30',
  });

  const [errors, setErrors] = useState({});

  const validate = () => {
    const newErrors = {};
    if (!config.payrunTitle.trim()) newErrors.payrunTitle = 'Payrun title is required';
    if (!config.startDate) newErrors.startDate = 'Start date is required';
    if (!config.endDate) newErrors.endDate = 'End date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    onNext(config);
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#7C3AED', color: '#FFFFFF', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>01</div>
          <div>
            <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.875rem' }}>Step 1: Configuration</strong>
            <span className="text-xs text-secondary">Pay period & structure scope</span>
          </div>
        </div>
        <div className="text-muted" style={{ padding: '0 12px' }}>→</div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, opacity: 0.5 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E2E8F0', color: '#64748B', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>02</div>
          <div>
            <strong style={{ display: 'block', color: '#0F172A', fontSize: '0.875rem' }}>Step 2: Employees</strong>
            <span className="text-xs text-muted">Targeting & warnings</span>
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

      {/* CONFIGURATION FORM CARD */}
      <Card 
        title="Payrun Scope & Configuration (Step 1 of 2)" 
        subtitle="Define the target pay period, evaluation salary structures, and department scope"
      >
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Input
            label="Payrun Title / Label *"
            value={config.payrunTitle}
            onChange={(e) => setConfig({ ...config, payrunTitle: e.target.value })}
            error={errors.payrunTitle}
            placeholder="e.g. September 2026 Monthly Payrun"
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            <Input
              label="Pay Period Start Date *"
              type="date"
              value={config.startDate}
              onChange={(e) => setConfig({ ...config, startDate: e.target.value })}
              error={errors.startDate}
            />
            <Input
              label="Pay Period End Date *"
              type="date"
              value={config.endDate}
              onChange={(e) => setConfig({ ...config, endDate: e.target.value })}
              error={errors.endDate}
            />
            <Input
              label="Scheduled Payment Date"
              type="date"
              value={config.paymentDate}
              onChange={(e) => setConfig({ ...config, paymentDate: e.target.value })}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px' }}>
            <Select
              label="Salary Structure Filter"
              value={config.salaryStructure}
              onChange={(e) => setConfig({ ...config, salaryStructure: e.target.value })}
              options={[
                { value: 'ALL', label: 'All Active Salary Structures (Default)' },
                { value: 'STRUCT_SWE_01', label: 'Standard Software Engineer Structure' },
                { value: 'STRUCT_EXEC_01', label: 'Executive Management Structure' },
                { value: 'STRUCT_HR_01', label: 'HR & Administrative Structure' },
              ]}
              helpText="Restricts rule evaluation to specific contract structure binding"
            />

            <Select
              label="Target Department Scope"
              value={config.department}
              onChange={(e) => setConfig({ ...config, department: e.target.value })}
              options={[
                { value: 'ALL', label: 'All Organization Departments (Full Company)' },
                { value: 'Software Engineering', label: 'Software Engineering' },
                { value: 'Human Resources', label: 'Human Resources' },
                { value: 'Finance & Accounting', label: 'Finance & Accounting' },
                { value: 'Sales & Marketing', label: 'Sales & Marketing' },
              ]}
              helpText="Filters employee target list in Step 2"
            />
          </div>

          <Alert type="info" title="Backend Calculation Scope Notice">
            Targeting all 142 active contracts across 5 departments. Clicking continue will query the backend contract resolver for Step 2 employee eligibility.
          </Alert>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel Wizard
              </Button>
            )}
            <Button type="submit" variant="accent" icon={ArrowRight}>
              Continue to Step 2: Employee Selection
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
