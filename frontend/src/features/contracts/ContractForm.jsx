import React, { useState } from 'react';
import { Button, Input, Select, Alert } from '../../components/ui';
import { Save, FileText, Calendar, DollarSign, Clock, Layers } from 'lucide-react';

export const ContractForm = ({ contract, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    contractName: contract?.contractName || `CNT-${Math.floor(100 + Math.random() * 900)}`,
    employeeName: contract?.employeeName || 'Alexander Wright',
    employeeId: contract?.employeeId || 'EMP-101',
    startDate: contract?.startDate || '2023-01-15',
    endDate: contract?.endDate || '',
    wage: contract?.wage || '8500',
    salaryStructure: contract?.salaryStructure || 'Standard Software Engineer Structure',
    workingSchedule: contract?.workingSchedule || 'Standard 40h/week',
    status: contract?.status || 'Running',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.employeeName) newErrors.employeeName = 'Employee selection is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.wage || Number(formData.wage) <= 0) newErrors.wage = 'Valid wage amount is required';
    if (!formData.salaryStructure) newErrors.salaryStructure = 'Salary structure is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setSuccessMsg('');

    setTimeout(() => {
      setLoading(false);
      setSuccessMsg(`Contract ${formData.contractName} saved successfully!`);
      setTimeout(() => {
        onSave({
          ...formData,
          id: contract?.id || formData.contractName,
          formattedWage: `$${Number(formData.wage).toLocaleString()}/mo`,
        });
      }, 500);
    }, 400);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {successMsg && <Alert type="success">{successMsg}</Alert>}

      {/* Contract & Employee Selection */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#172554', fontWeight: 600 }}>
          <FileText size={18} />
          <span>1. Contract Reference & Employee</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Input
            label="Contract Code"
            value={formData.contractName}
            onChange={(e) => handleChange('contractName', e.target.value)}
            disabled
          />
          <Select
            label="Employee *"
            value={formData.employeeName}
            onChange={(e) => handleChange('employeeName', e.target.value)}
            error={errors.employeeName}
            options={[
              { value: 'Alexander Wright', label: 'Alexander Wright (EMP-101)' },
              { value: 'Sophia Martinez', label: 'Sophia Martinez (EMP-102)' },
              { value: 'Marcus Vance', label: 'Marcus Vance (EMP-103)' },
              { value: 'Elena Rostova', label: 'Elena Rostova (EMP-104)' },
              { value: 'David Chen', label: 'David Chen (EMP-105)' },
            ]}
          />
        </div>
      </div>

      {/* Contract Duration */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#172554', fontWeight: 600 }}>
          <Calendar size={18} />
          <span>2. Contract Duration & Dates</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Input
            label="Start Date *"
            type="date"
            value={formData.startDate}
            onChange={(e) => handleChange('startDate', e.target.value)}
            error={errors.startDate}
          />
          <Input
            label="End Date (Leave empty if ongoing)"
            type="date"
            value={formData.endDate}
            onChange={(e) => handleChange('endDate', e.target.value)}
            helpText="Open-ended contract if left blank"
          />
        </div>
      </div>

      {/* Salary & Structure */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#172554', fontWeight: 600 }}>
          <DollarSign size={18} />
          <span>3. Wage & Salary Structure</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Input
            label="Monthly Wage ($) *"
            type="number"
            value={formData.wage}
            onChange={(e) => handleChange('wage', e.target.value)}
            error={errors.wage}
            placeholder="8500"
          />
          <Select
            label="Salary Structure *"
            value={formData.salaryStructure}
            onChange={(e) => handleChange('salaryStructure', e.target.value)}
            error={errors.salaryStructure}
            options={[
              { value: 'Standard Software Engineer Structure', label: 'Standard Software Engineer Structure' },
              { value: 'Executive Management Structure', label: 'Executive Management Structure' },
              { value: 'HR & Administrative Structure', label: 'HR & Administrative Structure' },
              { value: 'Sales Commission Structure', label: 'Sales Commission Structure' },
            ]}
          />
        </div>
      </div>

      {/* Working Schedule & Status */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#172554', fontWeight: 600 }}>
          <Clock size={18} />
          <span>4. Working Schedule & Contract Status</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Select
            label="Working Schedule"
            value={formData.workingSchedule}
            onChange={(e) => handleChange('workingSchedule', e.target.value)}
            options={[
              { value: 'Standard 40h/week', label: 'Standard 40h/week (Mon-Fri 9-5)' },
              { value: 'Flexible 35h/week', label: 'Flexible 35h/week' },
              { value: 'Shift Pattern A', label: 'Rotational Shift Pattern A' },
            ]}
          />
          <Select
            label="Contract Status"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            options={[
              { value: 'Running', label: 'Running (Active for Payrun Resolver)' },
              { value: 'Draft', label: 'Draft' },
              { value: 'Expired', label: 'Expired (Historical)' },
              { value: 'Cancelled', label: 'Cancelled' },
            ]}
          />
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading} icon={Save}>
          Save Contract
        </Button>
      </div>
    </form>
  );
};
