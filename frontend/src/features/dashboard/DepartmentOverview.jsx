import React, { useState, useEffect } from 'react';
import { Card, Badge, Spinner } from '../../components/ui';
import { Building2, Users, DollarSign } from 'lucide-react';
import axiosClient from '../../api/axiosClient';

export const DepartmentOverview = ({ data: initialData }) => {
  const [departments, setDepartments] = useState(initialData || []);
  const [loading, setLoading] = useState(!initialData || initialData.length === 0);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (initialData && initialData.length > 0) {
      setDepartments(initialData);
      setLoading(false);
      return;
    }

    const fetchDeptOverview = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axiosClient.get('/dashboard/department-overview');
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setDepartments(list);
      } catch (err) {
        console.error('Failed to fetch department overview:', err);
        setError('Unable to load department metrics');
      } finally {
        setLoading(false);
      }
    };

    fetchDeptOverview();
  }, [initialData]);

  const totalHeadcount = departments.reduce((sum, d) => sum + parseInt(d.headcount || 0, 10), 0);
  const totalCommittedWage = departments.reduce((sum, d) => sum + parseFloat(d.total_monthly_committed_salary || 0), 0);

  return (
    <Card
      className="dashboard-card"
      title="Department Overview & Wage Commitments"
      subtitle={`Total Active Headcount: ${totalHeadcount} across ${departments.length} departments`}
    >
      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <Spinner size="md" />
          <p className="text-xs text-secondary" style={{ marginTop: '6px' }}>Loading departments...</p>
        </div>
      ) : error ? (
        <div className="text-sm text-secondary" style={{ padding: '16px', textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {error}
        </div>
      ) : departments.length === 0 ? (
        <div className="text-sm text-secondary" style={{ padding: '16px', textAlign: 'center', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          No department data available.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', height: '100%', justifyContent: 'space-between' }}>
          {departments.map((dept) => {
            const wage = parseFloat(dept.total_monthly_committed_salary || 0);
            const count = parseInt(dept.headcount || 0, 10);
            const wagePct = totalCommittedWage > 0 ? (wage / totalCommittedWage) * 100 : 0;

            return (
              <div
                key={dept.department_id || dept.department_name}
                style={{
                  padding: '12px',
                  backgroundColor: '#F8FAFC',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Building2 size={16} style={{ color: '#059669' }} />
                    <strong style={{ color: '#12151A', fontSize: '0.875rem' }}>{dept.department_name}</strong>
                  </div>
                  <Badge variant="neutral">
                    <Users size={12} style={{ marginRight: '4px' }} />
                    {count} {count === 1 ? 'employee' : 'employees'}
                  </Badge>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', marginBottom: '6px' }}>
                  <span className="text-secondary">Committed Monthly Wage</span>
                  <strong>${wage.toLocaleString('en-US', { minimumFractionDigits: 2 })}</strong>
                </div>

                <div style={{ height: '6px', backgroundColor: '#E2E8F0', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${Math.min(100, wagePct)}%`,
                      backgroundColor: '#059669',
                      borderRadius: '3px',
                      transition: 'width 300ms ease',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default DepartmentOverview;
