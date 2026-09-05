import React, { useState } from 'react';
import { Button, Input, Select, Alert } from '../../../components/ui';
import { Save, Code, Layers, Percent, DollarSign } from 'lucide-react';

export const RuleForm = ({ rule, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    name: rule?.name || '',
    code: rule?.code || '',
    category: rule?.category || 'Allowances',
    sequence: rule?.sequence || '10',
    calculationType: rule?.calculationType || 'Percentage',
    amountValue: rule?.amountValue || '40',
    formulaDisplay: rule?.formulaDisplay || '40% of BASIC',
    status: rule?.status || 'Active',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Rule name is required';
    if (!formData.code.trim()) newErrors.code = 'Rule code is required';
    if (!formData.sequence) newErrors.sequence = 'Sequence order is required';

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
      setSuccessMsg(`Salary Rule ${formData.code} saved!`);
      setTimeout(() => {
        onSave({
          ...formData,
          id: rule?.id || `RULE-${formData.code.toUpperCase()}`,
        });
      }, 400);
    }, 300);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {successMsg && <Alert type="success">{successMsg}</Alert>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Input
          label="Rule Name *"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          placeholder="e.g. House Rent Allowance"
        />
        <Input
          label="Rule Code *"
          value={formData.code}
          onChange={(e) => handleChange('code', e.target.value.toUpperCase())}
          error={errors.code}
          placeholder="e.g. HRA"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Select
          label="Category *"
          value={formData.category}
          onChange={(e) => handleChange('category', e.target.value)}
          options={[
            { value: 'Basic', label: 'Basic Salary' },
            { value: 'Allowances', label: 'Allowances' },
            { value: 'Gross', label: 'Gross Computation' },
            { value: 'Deductions', label: 'Statutory Deductions' },
            { value: 'Net', label: 'Net Salary Pay' },
          ]}
        />
        <Input
          label="Evaluation Sequence *"
          type="number"
          value={formData.sequence}
          onChange={(e) => handleChange('sequence', e.target.value)}
          error={errors.sequence}
          helpText="Order in which rule is evaluated by backend"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <Select
          label="Calculation Type *"
          value={formData.calculationType}
          onChange={(e) => handleChange('calculationType', e.target.value)}
          options={[
            { value: 'Fixed', label: 'Fixed Amount ($)' },
            { value: 'Percentage', label: 'Percentage (%) of Base' },
            { value: 'Formula', label: 'Custom Python/JS Formula' },
          ]}
        />
        <Input
          label="Value / Amount"
          value={formData.amountValue}
          onChange={(e) => handleChange('amountValue', e.target.value)}
          placeholder="e.g. 40 or 200"
        />
      </div>

      <Input
        label="Human-Readable Formula Display"
        value={formData.formulaDisplay}
        onChange={(e) => handleChange('formulaDisplay', e.target.value)}
        placeholder="e.g. 40% of BASIC"
        helpText="Backend evaluation rule description"
      />

      <Select
        label="Rule Status"
        value={formData.status}
        onChange={(e) => handleChange('status', e.target.value)}
        options={[
          { value: 'Active', label: 'Active' },
          { value: 'Inactive', label: 'Inactive' },
        ]}
      />

      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading} icon={Save}>
          Save Salary Rule
        </Button>
      </div>
    </form>
  );
};
