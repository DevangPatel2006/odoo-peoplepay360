import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { Button, Input, Alert } from '../components/ui';
import { LogIn } from 'lucide-react';
import axiosClient from '../api/axiosClient';

export const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useApp();
  const navigate = useNavigate();

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

      const userRoles = Array.isArray(apiUser.roles) && apiUser.roles.length > 0 
        ? apiUser.roles 
        : ['Employee'];

      const appUser = {
        id: apiUser.id,
        employeeId: apiUser.employee?.employee_code || `EMP-${apiUser.id}`,
        employeeDbId: apiUser.employee_id || apiUser.employee?.id,
        name: apiUser.employee
          ? `${apiUser.employee.first_name} ${apiUser.employee.last_name}`
          : apiUser.work_email.split('@')[0],
        email: apiUser.work_email,
        role: userRoles[0] || 'Employee',
        roles: userRoles,
        department: apiUser.employee?.department_name || 'General Management',
      };

      login(appUser, authToken);
      setLoading(false);

      const isEmployeeOnly = userRoles.length > 0 && userRoles.every((r) => r === 'Employee');
      if (isEmployeeOnly) {
        navigate('/attendance');
      } else {
        navigate('/dashboard');
      }
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
        Sign In to PayOps
      </h3>
      <p className="text-sm text-secondary" style={{ textAlign: 'center', marginBottom: '20px' }}>
        Enter your enterprise credentials to access HR & Payroll.
      </p>

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
