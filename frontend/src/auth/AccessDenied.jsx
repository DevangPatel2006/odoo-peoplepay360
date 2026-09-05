import React from 'react';
import { Card, Button, Badge } from '../components/ui';
import { ShieldAlert, ArrowLeft, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../store';

export const AccessDenied = ({ requiredRole }) => {
  const navigate = useNavigate();
  const { user } = useApp();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '60vh',
      padding: '24px'
    }}>
      <Card style={{ maxWidth: '480px', width: '100%', textAlign: 'center', padding: '36px 24px' }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          backgroundColor: '#FFE4E6',
          color: '#E11D48',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '16px'
        }}>
          <ShieldAlert size={32} />
        </div>

        <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#0F172A', marginBottom: '8px' }}>
          403 - Access Restricted
        </h2>

        <p className="text-sm text-secondary" style={{ marginBottom: '20px' }}>
          Your active authenticated account role <strong>({user?.role || 'Employee'})</strong> does not have permission to view or manage this module.
        </p>

        <div style={{
          padding: '12px',
          backgroundColor: '#F8FAFC',
          borderRadius: '10px',
          border: '1px solid #E2E8F0',
          marginBottom: '24px',
          fontSize: '0.875rem'
        }}>
          <span className="text-xs text-muted" style={{ display: 'block', marginBottom: '4px' }}>
            Required Role Permission
          </span>
          <Badge variant="error">
            <Lock size={12} /> {requiredRole || 'HR Manager / Admin'}
          </Badge>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
          <Button variant="primary" icon={ArrowLeft} onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default AccessDenied;
