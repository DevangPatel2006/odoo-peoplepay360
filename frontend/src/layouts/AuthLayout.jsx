import React from 'react';
import { Outlet } from 'react-router-dom';

export const AuthLayout = () => {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#F8FAFC',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px'
    }}>
      <div style={{
        width: '100%',
        maxWidth: '440px',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 10px 25px -5px rgba(15, 23, 42, 0.08)',
        padding: '32px'
      }}>
        {/* Brand Header */}
        <div style={{ textCenter: 'center', marginBottom: '28px', textAlign: 'center' }}>
          <div style={{
            width: '44px',
            height: '44px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #059669 0%, #10B981 100%)',
            color: '#FFFFFF',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '700',
            fontSize: '1.25rem',
            marginBottom: '12px'
          }}>
            P
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#12151A' }}>PayOps</h2>
          <p style={{ fontSize: '0.875rem', color: '#64748B', marginTop: '4px' }}>
            Enterprise HR & Payroll Platform
          </p>
        </div>

        <Outlet />
      </div>
    </div>
  );
};
