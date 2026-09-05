import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { Button, Input, Alert } from '../components/ui';
import { LogIn, Lock, Mail } from 'lucide-react';

export const LoginPage = () => {
  const [email, setEmail] = useState('devang.patel@peoplepay360.io');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useApp();
  const navigate = useNavigate();

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (email && password) {
        login(
          {
            id: 'usr-001',
            name: 'Devang Patel',
            email: email,
            role: 'admin',
            department: 'Executive Management',
          },
          'demo-jwt-token-12345'
        );
        setLoading(false);
        navigate('/dashboard');
      } else {
        setError('Please enter valid email and password.');
        setLoading(false);
      }
    }, 600);
  };

  return (
    <form onSubmit={handleSubmit}>
      <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '4px', textAlign: 'center' }}>
        Sign In to PeoplePay360
      </h3>
      <p className="text-sm text-secondary" style={{ textAlign: 'center', marginBottom: '24px' }}>
        Enter your employee credentials to access payroll.
      </p>

      {error && <Alert type="error">{error}</Alert>}

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
