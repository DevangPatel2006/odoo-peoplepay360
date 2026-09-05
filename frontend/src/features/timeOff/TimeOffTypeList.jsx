import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Spinner, Alert, EmptyState } from '../../components/ui';
import { Plus, RefreshCw } from 'lucide-react';
import { TimeOffTypeForm } from './TimeOffTypeForm';
import axiosClient from '../../api/axiosClient';

export const TimeOffTypeList = () => {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchTypes = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get('/time-off/types');
      const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setTypes(list);
    } catch (err) {
      console.error('Failed to load time off types:', err);
      setError(err.response?.data?.error?.message || 'Failed to load leave types.');
      setTypes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTypes();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h4 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#0F172A' }}>Time Off Classification Types</h4>
          <p className="text-xs text-secondary">Organization leave types, units, and payroll impact definitions.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchTypes} loading={loading}>
            Refresh
          </Button>
          <Button variant="accent" size="sm" icon={Plus} onClick={() => setIsFormOpen(true)}>
            Add Leave Type
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <div style={{ padding: '32px', textAlign: 'center' }}>
          <Spinner size="md" />
        </div>
      ) : types.length === 0 ? (
        <EmptyState 
          title="No Leave Types Configured" 
          description="Create your first leave category (e.g. Paid Time Off, Sick Leave) to get started." 
        />
      ) : (
        <Table headers={['Leave Type Name', 'Unit', 'Requires Allocation', 'Approval Level', 'Affects Payroll', 'Status']}>
          {types.map((type) => (
            <tr key={type.id}>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span 
                    style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      backgroundColor: type.display_color || '#3B82F6',
                      display: 'inline-block' 
                    }} 
                  />
                  <strong style={{ color: '#0F172A' }}>{type.name}</strong>
                </div>
              </td>
              <td><span className="font-mono text-sm">{type.unit || 'Days'}</span></td>
              <td>
                <Badge variant={type.requires_allocation ? 'accent' : 'neutral'}>
                  {type.requires_allocation ? 'Yes (Quota Needed)' : 'No (Direct Request)'}
                </Badge>
              </td>
              <td><span className="text-sm">{type.approval_level || 'Manager'} Approval</span></td>
              <td>
                <Badge variant={type.affects_payroll ? 'warning' : 'neutral'}>
                  {type.affects_payroll ? 'Payroll Affected' : 'Non-Impact'}
                </Badge>
              </td>
              <td>
                <Badge variant={type.is_active ? 'success' : 'neutral'}>
                  {type.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </td>
            </tr>
          ))}
        </Table>
      )}

      <TimeOffTypeForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={() => {
          setIsFormOpen(false);
          fetchTypes();
        }}
      />
    </div>
  );
};

export default TimeOffTypeList;
