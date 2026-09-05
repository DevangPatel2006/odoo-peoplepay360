import React from 'react';
import { Card, Badge, Button } from '../../components/ui';
import { Mail, Phone, ExternalLink, MoreVertical } from 'lucide-react';

export const EmployeeKanban = ({ employees = [], onSelect }) => {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
      {employees.map((emp) => (
        <Card 
          key={emp.id || emp.employeeId} 
          interactive 
          onClick={() => onSelect(emp)}
          style={{ position: 'relative' }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', marginBottom: '14px' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '50%',
              backgroundColor: '#172554',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '700',
              fontSize: '1.125rem',
              flexShrink: 0
            }}>
              {emp.name ? emp.name.split(' ').map(n => n[0]).join('') : 'E'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="font-semibold text-base" style={{ color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {emp.name}
              </div>
              <div className="text-xs text-secondary" style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {emp.position}
              </div>
              <div className="text-xs text-muted" style={{ marginTop: '2px' }}>
                ID: {emp.id || emp.employeeId}
              </div>
            </div>
          </div>

          <div style={{ padding: '8px 10px', background: '#F8FAFC', borderRadius: '8px', marginBottom: '12px', border: '1px solid #E2E8F0', fontSize: '0.75rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span className="text-muted">Department:</span>
              <span className="font-medium">{emp.department}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="text-muted">Type:</span>
              <span className="font-medium">{emp.employeeType || 'Full-Time'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Badge variant={emp.status === 'Active' ? 'success' : 'warning'}>
              {emp.status}
            </Badge>
            <Button variant="ghost" size="sm" icon={ExternalLink}>
              Central Hub
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
};
