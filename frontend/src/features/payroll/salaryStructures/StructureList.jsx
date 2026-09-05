import React, { useState, useEffect } from 'react';
import { Card, Table, Badge, Button, Modal, Spinner, Alert, EmptyState } from '../../../components/ui';
import { StructureForm } from './StructureForm';
import { Plus, Edit, Trash2, Layers, RefreshCw } from 'lucide-react';
import { useApp } from '../../../store';
import { ConfirmModal } from '../../../components/ui';
import axiosClient from '../../../api/axiosClient';

export const StructureList = () => {
  const { addToast } = useApp();
  const [structures, setStructures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingStructure, setEditingStructure] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStructures = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axiosClient.get('/salary-structures');
      const list = Array.isArray(response.data) ? response.data : [];
      setStructures(list);
    } catch (err) {
      console.error('Failed to load salary structures:', err);
      setError(err.response?.data?.error?.message || 'Failed to load salary structures.');
      setStructures([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStructures();
  }, []);

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await axiosClient.delete(`/salary-structures/${deleteTarget.id}`);
      addToast(`Deleted salary structure ${deleteTarget.name}`, 'info');
      setDeleteTarget(null);
      fetchStructures();
    } catch (err) {
      console.error('Failed to delete salary structure:', err);
      addToast(err.response?.data?.error?.message || 'Failed to delete salary structure.', 'error');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#0F172A' }}>Configured Salary Structures</h3>
          <p className="text-sm text-secondary">Structures define salary rule groupings evaluated for employee contracts.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button variant="outline" size="sm" icon={RefreshCw} onClick={fetchStructures} loading={loading}>
            Refresh
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            icon={Plus}
            onClick={() => { setEditingStructure(null); setIsFormModalOpen(true); }}
          >
            Create Structure
          </Button>
        </div>
      </div>

      {error && <Alert type="error">{error}</Alert>}

      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center' }}><Spinner size="lg" /></div>
      ) : structures.length === 0 ? (
        <EmptyState 
          title="No Salary Structures Configured" 
          description="Create your first salary structure to bind salary rules together." 
        />
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '16px' }}>
          {structures.map((struct) => (
            <Card key={struct.id}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#0F172A' }}>{struct.name}</h4>
                  <span className="font-mono text-xs text-accent font-semibold">Type: {struct.structure_type || 'Regular'}</span>
                </div>
                <Badge variant={struct.is_active ? 'success' : 'neutral'} dot>
                  {struct.is_active ? 'Active' : 'Inactive'}
                </Badge>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748B', fontSize: '0.875rem', marginBottom: '16px' }}>
                <Layers size={16} />
                <span>Structure ID: #{struct.id}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #E2E8F0', paddingTop: '12px' }}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={Edit} 
                  onClick={() => { setEditingStructure(struct); setIsFormModalOpen(true); }}
                >
                  Edit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  icon={Trash2} 
                  onClick={() => setDeleteTarget(struct)}
                  style={{ color: '#E11D48', borderColor: '#FECDD3' }}
                >
                  Delete
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* CREATE / EDIT MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setEditingStructure(null); }}
        title={editingStructure ? `Edit Structure: ${editingStructure.name}` : 'Create New Salary Structure'}
      >
        <StructureForm
          structure={editingStructure}
          onSave={() => {
            setIsFormModalOpen(false);
            setEditingStructure(null);
            fetchStructures();
          }}
          onCancel={() => {
            setIsFormModalOpen(false);
            setEditingStructure(null);
          }}
        />
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Salary Structure"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? Contracts linked to this structure may be affected.`}
        confirmText="Delete Structure"
        variant="danger"
      />
    </div>
  );
};

export default StructureList;
