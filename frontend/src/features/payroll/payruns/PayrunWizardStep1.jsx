import React, { useState, useEffect } from 'react';
import { Card, Button, Input, Select, Alert, Spinner } from '../../../components/ui';
import { ArrowRight } from 'lucide-react';
import axiosClient from '../../../api/axiosClient';

export const PayrunWizardStep1 = ({ initialConfig, onNext, onCancel }) => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const lastDayOfMonth = new Date(year, today.getMonth() + 1, 0).getDate();

  const defaultStart = `${year}-${month}-01`;
  const defaultEnd = `${year}-${month}-${String(lastDayOfMonth).padStart(2, '0')}`;
  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

  const [structures, setStructures] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [config, setConfig] = useState({
    payrunTitle: initialConfig?.payrunTitle || `${monthName} Regular Payrun`,
    startDate: initialConfig?.startDate || defaultStart,
    endDate: initialConfig?.endDate || defaultEnd,
    paymentDate: initialConfig?.paymentDate || defaultEnd,
    salary_structure_id: initialConfig?.salary_structure_id || '',
    department: initialConfig?.department || 'ALL',
    employeeType: initialConfig?.employeeType || '',
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    let isMounted = true;
    const loadMetadata = async () => {
      setLoadingMeta(true);
      try {
        const [structRes, deptRes] = await Promise.all([
          axiosClient.get('/salary-structures').catch(() => ({ data: [] })),
          axiosClient.get('/departments').catch(() => ({ data: [] })),
        ]);
        if (isMounted) {
          const structData = Array.isArray(structRes.data) ? structRes.data : [];
          setStructures(structData);
          if (structData.length > 0 && !config.salary_structure_id) {
            setConfig((prev) => ({ ...prev, salary_structure_id: String(structData[0].id) }));
          }
          setDepartments(Array.isArray(deptRes.data) ? deptRes.data : []);
        }
      } catch (err) {
        console.error('Failed to load salary structures or departments:', err);
      } finally {
        if (isMounted) setLoadingMeta(false);
      }
    };
    loadMetadata();
    return () => { isMounted = false; };
  }, []);

  const validate = () => {
    const newErrors = {};
    if (!config.payrunTitle.trim()) newErrors.payrunTitle = 'Payrun title is required';
    if (!config.startDate) newErrors.startDate = 'Start date is required';
    if (!config.endDate) newErrors.endDate = 'End date is required';
    if (!config.salary_structure_id) newErrors.salary_structure_id = 'Salary structure selection is required';

    if (config.startDate && config.endDate && config.endDate < config.startDate) {
      newErrors.endDate = 'End date cannot be earlier than start date';
    }

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
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#059669', color: '#FFFFFF', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.875rem' }}>01</div>
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
            <span className="text-xs text-muted">Formulas & validation</span>
          </div>
        </div>
      </div>

      {/* CONFIGURATION FORM */}
      <Card 
        title="Payrun Scope & Configuration (Step 1 of 2)" 
        subtitle="Define the target pay period, evaluation salary structure, and employee criteria"
      >
        {loadingMeta ? (
          <div style={{ padding: '32px', textAlign: 'center' }}>
            <Spinner size="md" />
            <p className="text-sm text-secondary" style={{ marginTop: '8px' }}>Loading configuration options...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <Input
              label="Payrun Title / Label *"
              value={config.payrunTitle}
              onChange={(e) => setConfig({ ...config, payrunTitle: e.target.value })}
              error={errors.payrunTitle}
              placeholder="e.g. October 2026 Regular Payrun"
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
                label="Salary Structure *"
                value={config.salary_structure_id}
                onChange={(e) => setConfig({ ...config, salary_structure_id: e.target.value })}
                error={errors.salary_structure_id}
                options={structures.map((s) => ({
                  value: String(s.id),
                  label: `${s.name} (${s.structure_type || 'Standard'})`,
                }))}
                helpText="Only contracts linked to this salary structure will be eligible"
              />

              <Select
                label="Department Filter (Optional)"
                value={config.department}
                onChange={(e) => setConfig({ ...config, department: e.target.value })}
                options={[
                  { value: 'ALL', label: 'All Departments (Entire Organization)' },
                  ...departments.map((d) => ({
                    value: String(d.id),
                    label: d.name,
                  })),
                ]}
                helpText="Optionally narrow down candidate employees"
              />

              <Select
                label="Employee Type Filter"
                value={config.employeeType}
                onChange={(e) => setConfig({ ...config, employeeType: e.target.value })}
                options={[
                  { value: '', label: 'All Employee Types' },
                  { value: 'Full-time', label: 'Full-time' },
                  { value: 'Part-time', label: 'Part-time' },
                  { value: 'Contractor', label: 'Contractor' },
                  { value: 'Intern', label: 'Intern' },
                ]}
                helpText="Optional filter by employment classification"
              />
            </div>

            <Alert type="info" title="Backend Calculation Scope Notice">
              Clicking continue will query the backend contract resolver to determine employee eligibility, active running contracts, and any prerequisite warnings for the selected dates.
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
        )}
      </Card>
    </div>
  );
};

export default PayrunWizardStep1;
