import React, { useState, useEffect } from 'react';
import { Button, Input, Select, Alert } from '../../components/ui';
import { Save, X, User, Briefcase, Building, Clock, CheckCircle2 } from 'lucide-react';

export const EmployeeForm = ({ employee, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    firstName: employee?.firstName || '',
    lastName: employee?.lastName || '',
    email: employee?.email || '',
    phone: employee?.phone || '',
    employeeId: employee?.employeeId || `EMP-${Math.floor(100 + Math.random() * 900)}`,
    hireDate: employee?.hireDate || new Date().toISOString().split('T')[0],
    employeeType: employee?.employeeType || 'Full-Time',
    department: employee?.department || 'Software Engineering',
    position: employee?.position || 'Software Engineer',
    manager: employee?.manager || 'Sarah Jenkins',
    schedule: employee?.schedule || 'Standard 40h/week',
    bankAccount: employee?.bankAccount || '',
    status: employee?.status || 'Active',
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Enter a valid email address';
    }
    if (!formData.department) newErrors.department = 'Please select a department';
    if (!formData.position.trim()) newErrors.position = 'Job position is required';

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
      setSuccessMsg(`Employee ${formData.firstName} ${formData.lastName} saved successfully!`);
      setTimeout(() => {
        onSave({
          ...formData,
          name: `${formData.firstName} ${formData.lastName}`,
          id: employee?.id || formData.employeeId,
        });
      }, 600);
    }, 500);
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {successMsg && (
        <Alert type="success" title="Success">
          {successMsg}
        </Alert>
      )}

      {/* SECTION 1: Personal Information */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#172554', fontWeight: 600 }}>
          <User size={18} />
          <span>1. Personal Information</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Input
            label="First Name *"
            value={formData.firstName}
            onChange={(e) => handleChange('firstName', e.target.value)}
            error={errors.firstName}
            placeholder="e.g. Alexander"
          />
          <Input
            label="Last Name *"
            value={formData.lastName}
            onChange={(e) => handleChange('lastName', e.target.value)}
            error={errors.lastName}
            placeholder="e.g. Wright"
          />
          <Input
            label="Email Address *"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            error={errors.email}
            placeholder="alex.w@peoplepay360.io"
          />
          <Input
            label="Phone Number"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+1 (555) 019-2834"
          />
        </div>
      </div>

      {/* SECTION 2: Employment Information */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#172554', fontWeight: 600 }}>
          <Briefcase size={18} />
          <span>2. Employment Information</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Input
            label="Employee ID"
            value={formData.employeeId}
            onChange={(e) => handleChange('employeeId', e.target.value)}
            disabled
          />
          <Input
            label="Hire Date"
            type="date"
            value={formData.hireDate}
            onChange={(e) => handleChange('hireDate', e.target.value)}
          />
          <Select
            label="Employee Type"
            value={formData.employeeType}
            onChange={(e) => handleChange('employeeType', e.target.value)}
            options={[
              { value: 'Full-Time', label: 'Full-Time Permanent' },
              { value: 'Part-Time', label: 'Part-Time' },
              { value: 'Contractor', label: 'Contractor / Temporary' },
            ]}
          />
        </div>
      </div>

      {/* SECTION 3: Organization */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#172554', fontWeight: 600 }}>
          <Building size={18} />
          <span>3. Organization & Hierarchy</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Select
            label="Department *"
            value={formData.department}
            onChange={(e) => handleChange('department', e.target.value)}
            error={errors.department}
            options={[
              { value: 'Software Engineering', label: 'Software Engineering' },
              { value: 'Human Resources', label: 'Human Resources' },
              { value: 'Finance & Accounting', label: 'Finance & Accounting' },
              { value: 'Sales & Marketing', label: 'Sales & Marketing' },
              { value: 'Executive Management', label: 'Executive Management' },
            ]}
          />
          <Input
            label="Job Position *"
            value={formData.position}
            onChange={(e) => handleChange('position', e.target.value)}
            error={errors.position}
            placeholder="e.g. Senior Frontend Engineer"
          />
          <Select
            label="Reporting Manager"
            value={formData.manager}
            onChange={(e) => handleChange('manager', e.target.value)}
            options={[
              { value: 'Sarah Jenkins', label: 'Sarah Jenkins (HR Director)' },
              { value: 'Devang Patel', label: 'Devang Patel (CTO)' },
              { value: 'Robert Chen', label: 'Robert Chen (VP Finance)' },
            ]}
          />
        </div>
      </div>

      {/* SECTION 4 & 5: Working Info & Status */}
      <div style={{ padding: '16px', background: '#F8FAFC', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px', color: '#172554', fontWeight: 600 }}>
          <Clock size={18} />
          <span>4 & 5. Working Info & Status</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
          <Select
            label="Working Schedule"
            value={formData.schedule}
            onChange={(e) => handleChange('schedule', e.target.value)}
            options={[
              { value: 'Standard 40h/week', label: 'Standard 40h/week (Mon-Fri 9-5)' },
              { value: 'Flexible 35h/week', label: 'Flexible 35h/week' },
              { value: 'Shift Pattern A', label: 'Rotational Shift Pattern A' },
            ]}
          />
          <Input
            label="Bank Account / IBAN"
            value={formData.bankAccount}
            onChange={(e) => handleChange('bankAccount', e.target.value)}
            placeholder="US89370001928374"
            helpText="Required for payroll direct deposit"
          />
          <Select
            label="Employee Status"
            value={formData.status}
            onChange={(e) => handleChange('status', e.target.value)}
            options={[
              { value: 'Active', label: 'Active' },
              { value: 'On Leave', label: 'On Leave' },
              { value: 'Terminated', label: 'Terminated / Inactive' },
            ]}
          />
        </div>
      </div>

      {/* FORM ACTION BUTTONS */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading} icon={Save}>
          Save Employee Record
        </Button>
      </div>
    </form>
  );
};
