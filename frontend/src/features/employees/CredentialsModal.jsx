import React, { useState } from 'react';
import { Modal, Alert, Button } from '../../components/ui';
import { Copy, Check, Key, Mail, ShieldAlert } from 'lucide-react';

export const CredentialsModal = ({
  isOpen,
  onClose,
  email,
  temporaryPassword,
  welcomeEmail,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    if (!temporaryPassword) return;
    try {
      await navigator.clipboard.writeText(temporaryPassword);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy password to clipboard:', err);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Employee Account & Credentials"
      size="md"
      footer={
        <Button variant="primary" onClick={onClose}>
          Done
        </Button>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Email delivery status */}
        {welcomeEmail?.success ? (
          <Alert type="success" title="Welcome Email Sent">
            Login credentials have been dispatched to <strong>{email}</strong>.
          </Alert>
        ) : welcomeEmail?.skipped ? (
          <Alert type="info">
            Welcome email notification was skipped per configuration.
          </Alert>
        ) : (
          <Alert type="warning" title="Email Delivery Notice">
            Email delivery failed — please share the temporary password manually with the employee.
          </Alert>
        )}

        {/* Account Details Box */}
        <div
          style={{
            background: '#F8FAFC',
            borderRadius: '10px',
            border: '1px solid #E2E8F0',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          {/* Work Email */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#64748B',
                marginBottom: '4px',
              }}
            >
              <Mail size={14} />
              <span>Login Email Address</span>
            </label>
            <div
              style={{
                fontSize: '0.9375rem',
                fontWeight: 600,
                color: '#0F172A',
                padding: '8px 12px',
                background: '#FFFFFF',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
              }}
            >
              {email}
            </div>
          </div>

          {/* Temporary Password */}
          <div>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.8125rem',
                fontWeight: 600,
                color: '#64748B',
                marginBottom: '4px',
              }}
            >
              <Key size={14} />
              <span>Temporary Password</span>
            </label>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <div
                style={{
                  flex: 1,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                  fontSize: '1.05rem',
                  fontWeight: 700,
                  letterSpacing: '0.05em',
                  color: '#1E293B',
                  background: '#FFFFFF',
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  userSelect: 'all',
                }}
              >
                {temporaryPassword}
              </div>
              <Button
                variant={copied ? 'secondary' : 'outline'}
                icon={copied ? Check : Copy}
                onClick={handleCopy}
                style={{
                  minWidth: '100px',
                  borderColor: copied ? '#10B981' : undefined,
                  color: copied ? '#059669' : undefined,
                }}
              >
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
          </div>
        </div>

        {/* Security Warning */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px',
            borderRadius: '8px',
            backgroundColor: '#FFFBEB',
            border: '1px solid #FDE68A',
            color: '#92400E',
            fontSize: '0.8125rem',
            lineHeight: 1.5,
          }}
        >
          <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px', color: '#D97706' }} />
          <div>
            <strong>Important:</strong> This password will not be shown again. Share it securely with the employee, or use <strong>Reset Credentials</strong> from their profile if it's lost.
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CredentialsModal;
