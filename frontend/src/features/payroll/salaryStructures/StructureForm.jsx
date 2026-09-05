import React, { useState } from 'react';
import { Button, Input, Select, Alert } from '../../../components/ui';
import { Save } from 'lucide-react';

export const StructureForm = ({ structure, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: structure?.name || '',
    code: structure?.code || '',
    description: structure?.description || '',
    status: structure?.status || 'Active',
    ruleCodes: structure?.ruleCodes || ['BASIC', 'HRA', 'CONV', 'GROSS', 'TAX', 'NET'],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const availableRules = [
    { code: 'BASIC', name: 'Basic Salary' },
    { code: 'HRA', name: 'House Rent Allowance (40%)' },
    { code: 'CONV', name: 'Conveyance Allowance ($200)' },
    { code: 'GROSS', name: 'Gross Salary Computation' },
    { code: 'TAX', name: 'Income Tax Withholding (12%)' },
    { code: 'NET', name: 'Net Pay Computation' },
  ];

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Structure name is required';
    if (!formData.code.trim()) newErrors.code = 'Structure code is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRuleToggle = (code) => {
    setFormData((prev) => {
      const exists = prev.ruleCodes.includes(code);
      return {
        ...prev,
        ruleCodes: exists ? prev.ruleCodes.filter((c) => c !== code) : [...prev.ruleCodes, code],
      };
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onSave({
        ...formData,
        id: structure?.id || `STRUCT-${formData.code.toUpperCase()}`,
        ruleCount: formData.ruleCodes.length,
      });
    }, 400);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input
          label="Structure Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          error={errors.name}
          placeholder="e.g. Standard Software Engineer Structure"
        />
        <Input
          label="Structure Code *"
          value={formData.code}
          onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
          error={errors.code}
          placeholder="e.g. STRUCT_SWE_01"
        />
      </div>

      <Input
        label="Description"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        placeholder="Brief description of applicable employee groups..."
      />

      <Select
        label="Structure Status"
        value={formData.status}
        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
        options={[
          { value: 'Active', label: 'Active (Available for Contracts)' },
          { value: 'Draft', label: 'Draft' },
          { value: 'Archived', label: 'Archived' },
        ]}
      />

      {/* INCLUDED RULES SELECTION */}
      <div style={{ padding: '14px', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
        <label className="form-label" style={{ marginBottom: '10px', display: 'block' }}>
          Included Salary Rules ({formData.ruleCodes.length} selected)
        </label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {availableRules.map((rule) => {
            const isChecked = formData.ruleCodes.includes(rule.code);
            return (
              <label
                key={rule.code}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  backgroundColor: '#FFFFFF',
                  borderRadius: '6px',
                  border: '1px solid #E2E8F0',
                  cursor: 'pointer',
                  fontSize: '0.875rem'
                }}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => handleRuleToggle(rule.code)}
                />
                <span className="font-mono font-semibold" style={{ color: '#7C3AED' }}>{rule.code}</span>
                <span className="text-secondary">— {rule.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading} icon={Save}>
          Save Salary Structure
        </Button>
      </div>
    </form>
  );
};
