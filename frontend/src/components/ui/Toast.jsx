import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';

export const Toast = ({ message, type = 'success', onClose }) => {
  const icons = {
    success: CheckCircle2,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  };

  const colors = {
    success: { bg: '#D1FAE5', border: '#A7F3D0', text: '#065F46', icon: '#059669' },
    error: { bg: '#FFE4E6', border: '#FECDD3', text: '#9F1239', icon: '#E11D48' },
    warning: { bg: '#FEF3C7', border: '#FDE68A', text: '#92400E', icon: '#D97706' },
    info: { bg: '#EFF6FF', border: '#BFDBFE', text: '#1E40AF', icon: '#1D4ED8' },
  };

  const current = colors[type] || colors.success;
  const IconComponent = icons[type] || CheckCircle2;

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      padding: '12px 16px',
      backgroundColor: current.bg,
      border: `1px solid ${current.border}`,
      color: current.text,
      borderRadius: '10px',
      boxShadow: '0 10px 15px -3px rgba(15, 23, 42, 0.12)',
      fontSize: '0.875rem',
      fontWeight: '500',
      animation: 'slideUp 200ms ease-out',
      maxWidth: '380px',
      width: '100%'
    }}>
      <IconComponent size={20} style={{ color: current.icon, flexShrink: 0 }} />
      <span style={{ flex: 1 }}>{message}</span>
      {onClose && (
        <button 
          onClick={onClose}
          style={{
            background: 'transparent',
            border: 'none',
            color: current.text,
            cursor: 'pointer',
            padding: '2px',
            display: 'flex',
            alignItems: 'center'
          }}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>
      )}
    </div>
  );
};

export const ToastContainer = ({ toasts = [], removeToast }) => {
  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      zIndex: 2000,
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      alignItems: 'flex-end',
      pointerEvents: 'none'
    }}>
      {toasts.map((toast) => (
        <div key={toast.id} style={{ pointerEvents: 'auto' }}>
          <Toast 
            message={toast.message} 
            type={toast.type} 
            onClose={() => removeToast && removeToast(toast.id)} 
          />
        </div>
      ))}
    </div>
  );
};

export default Toast;
