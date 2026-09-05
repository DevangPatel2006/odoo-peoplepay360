import React from 'react';
import { Card } from '../../components/ui';

export const SalaryCostByDeptChart = ({ data = [] }) => {
  const depts = data || [];
  const totalCost = depts.reduce((acc, curr) => acc + (curr.cost || 0), 0);
  const chartColors = ['#059669', '#0284C7', '#D97706', '#7C3AED', '#475569', '#10B981'];

  return (
    <Card 
      className="dashboard-card"
      title="Salary Cost Breakdown by Department" 
      subtitle={depts.length > 0 ? `Total Monthly Salary Cost: $${totalCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'Live department payroll distribution'}
    >
      {depts.length === 0 ? (
        <div className="text-sm text-secondary" style={{ padding: '24px', textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No finalized department salary expenditure computed yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
          {/* Progress Bar Stack */}
          <div style={{
            display: 'flex',
            height: '14px',
            borderRadius: '7px',
            overflow: 'hidden',
            marginBottom: '20px',
            backgroundColor: '#E2E8F0'
          }}>
            {depts.map((dept, idx) => {
              const color = dept.color || chartColors[idx % chartColors.length];
              return (
                <div
                  key={idx}
                  style={{
                    width: `${dept.percentage}%`,
                    backgroundColor: color,
                    transition: 'width 300ms ease'
                  }}
                  title={`${dept.name}: ${dept.percentage}%`}
                />
              );
            })}
          </div>

          {/* Breakdown Rows */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {depts.map((dept, idx) => {
              const color = dept.color || chartColors[idx % chartColors.length];
              return (
                <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color, display: 'inline-block' }} />
                    <span className="font-medium">{dept.name}</span>
                    <span className="text-xs text-muted">({dept.count} employees)</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="font-semibold" style={{ marginRight: '8px' }}>${dept.cost.toLocaleString()}</span>
                    <span className="text-xs text-secondary">({dept.percentage}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </Card>
  );
};
