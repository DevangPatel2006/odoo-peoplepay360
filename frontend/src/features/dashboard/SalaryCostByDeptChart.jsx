import React from 'react';
import { Card } from '../../components/ui';

export const SalaryCostByDeptChart = ({ data = [] }) => {
  const defaultDeptData = [
    { name: 'Software Engineering', count: 54, cost: 215000, percentage: 44.3, color: '#7C3AED' },
    { name: 'Human Resources', count: 18, cost: 68000, percentage: 14.0, color: '#3B82F6' },
    { name: 'Finance & Operations', count: 24, cost: 92000, percentage: 18.9, color: '#059669' },
    { name: 'Sales & Marketing', count: 32, cost: 85200, percentage: 17.6, color: '#D97706' },
    { name: 'Executive & Admin', count: 14, cost: 25000, percentage: 5.2, color: '#172554' },
  ];

  const depts = data.length > 0 ? data : defaultDeptData;
  const totalCost = depts.reduce((acc, curr) => acc + curr.cost, 0);

  return (
    <Card 
      title="Salary Cost Breakdown by Department" 
      subtitle={`Total Monthly Salary Cost: $${totalCost.toLocaleString()}`}
    >
      {/* Progress Bar Stack */}
      <div style={{
        display: 'flex',
        height: '14px',
        borderRadius: '7px',
        overflow: 'hidden',
        marginBottom: '20px',
        backgroundColor: '#E2E8F0'
      }}>
        {depts.map((dept, idx) => (
          <div
            key={idx}
            style={{
              width: `${dept.percentage}%`,
              backgroundColor: dept.color,
              transition: 'width 300ms ease'
            }}
            title={`${dept.name}: ${dept.percentage}%`}
          />
        ))}
      </div>

      {/* Breakdown Rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {depts.map((dept, idx) => (
          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: dept.color, display: 'inline-block' }} />
              <span className="font-medium">{dept.name}</span>
              <span className="text-xs text-muted">({dept.count} employees)</span>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span className="font-semibold" style={{ marginRight: '8px' }}>${dept.cost.toLocaleString()}</span>
              <span className="text-xs text-secondary">({dept.percentage}%)</span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
