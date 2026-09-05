import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { Button, Input, Alert, Badge } from '../components/ui';
import { LogIn, Lock, Mail, Shield, UserCheck, Calculator, User } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export const LoginPage = () => {
  const [email, setEmail] = useState('admin@peoplepay360.com');
  const [password, setPassword] = useState('Password123!');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useApp();
  const navigate = useNavigate();

  const demoAccounts = [
    { label: 'Admin', email: 'admin@peoplepay360.com', role: 'Admin', icon: Shield, color: '#172554' },
    { label: 'HR Manager', email: 'hrmanager@peoplepay360.com', role: 'HR Manager', icon: UserCheck, color: '#2563EB' },
    { label: 'Payroll User', email: 'payrolluser@peoplepay360.com', role: 'HR Payroll User', icon: Calculator, color: '#059669' },
    { label: 'Employee', email: 'david.engineer@peoplepay360.com', role: 'Employee', icon: User, color: '#D97706' },
  ];

  const handleSelectDemo = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axiosClient.post('/auth/login', {
        work_email: email.trim(),
        password: password,
      });

      const payload = response.data;
      const apiUser = payload.user;
      const authToken = payload.token;

      const appUser = {
        id: apiUser.id,
        employeeId: apiUser.employee?.employee_code || `EMP-${apiUser.id}`,
        name: apiUser.employee
          ? `${apiUser.employee.first_name} ${apiUser.employee.last_name}`
          : apiUser.work_email.split('@')[0],
        email: apiUser.work_email,
        role: apiUser.roles?.[0] || 'Admin',
        department: apiUser.employee?.department_name || 'General Management',
      };

      login(appUser, authToken);
      setLoading(false);
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      const errMsg =
        err.response?.data?.error?.message ||
        err.response?.data?.message ||
        'Invalid work email or password. Please verify your credentials.';
      setError(errMsg);
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '4px', textAlign: 'center' }}>
        Sign In to PeoplePay360
      </h3>
      <p className="text-sm text-secondary" style={{ textAlign: 'center', marginBottom: '20px' }}>
        Enter your enterprise credentials to access HR & Payroll.
      </p>

      {/* QUICK ROLE SELECTOR BUTTONS */}
      <div style={{ marginBottom: '20px' }}>
        <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748B', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Quick Demo Login
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px' }}>
          {demoAccounts.map((acc) => {
            const Icon = acc.icon;
            const isSelected = email === acc.email;
            return (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSelectDemo(acc.email)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 10px',
                  borderRadius: '8px',
                  border: isSelected ? `2px solid ${acc.color}` : '1px solid #E2E8F0',
                  backgroundColor: isSelected ? '#EFF6FF' : '#F8FAFC',
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: '#1E293B',
                  textAlign: 'left',
                  transition: 'all 150ms ease',
                }}
              >
                <Icon size={14} style={{ color: acc.color, flexShrink: 0 }} />
                <div style={{ overflow: 'hidden' }}>
                  <div style={{ whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>{acc.label}</div>
                  <div style={{ fontSize: '0.65rem', color: '#64748B', fontWeight: 400 }}>Password123!</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {error && <Alert type="error" style={{ marginBottom: '16px' }}>{error}</Alert>}

      <Input
        label="Work Email"
        type="email"
        placeholder="name@company.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

      <Input
        label="Password"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      <Button
        type="submit"
        variant="primary"
        loading={loading}
        icon={LogIn}
        style={{ width: '100%', marginTop: '12px' }}
      >
        Sign In
      </Button>
    </form>
  );
};
