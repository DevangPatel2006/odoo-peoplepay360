import React, { useState, useEffect } from 'react';
import { Table, Badge, Button, Input, Select, Modal, Pagination, EmptyState, Spinner, Alert } from '../../components/ui';
import { AttendanceWidget } from './AttendanceWidget';
import { AttendanceForm } from './AttendanceForm';
import { 
  Clock, 
  Search, 
  Filter, 
  AlertTriangle, 
  CheckCircle2, 
  Eye, 
  Edit, 
  Calendar,
  AlertCircle
} from 'lucide-react';
import axiosClient from '../../api/axiosClient';

import { useApp } from '../../store';

export const AttendanceList = () => {
  const { addToast } = useApp();
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [employeeFilter, setEmployeeFilter] = useState('ALL');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState(null);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const mapAttendance = (a) => ({
    ...a,
    id: `ATT-${a.id}`,
    dbId: a.id,
    employeeName: a.employeeName || `${a.employee_first_name || ''} ${a.employee_last_name || ''}`.trim() || 'Employee',
    employeeId: a.employeeId || a.employee_code || `EMP-${a.employee_id}`,
    date: a.date || (a.attendance_date ? String(a.attendance_date).split('T')[0] : ''),
    checkIn: a.checkIn || (a.check_in ? new Date(a.check_in).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'),
    checkOut: a.checkOut || (a.check_out ? new Date(a.check_out).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : (a.check_in ? 'In Progress' : 'Missing')),
    workedHours: a.workedHours || (a.worked_hours != null ? `${a.worked_hours} hrs` : '0.0 hrs'),
    status: a.status || 'Present',
    isAbnormal: a.is_abnormal ?? false,
    anomalyReason: a.anomaly_reason || '',
  });

  const fetchAttendances = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/attendance');
      const list = Array.isArray(response.data) ? response.data : (response.data?.data || []);
      setAttendances(list.map(mapAttendance));
    } catch (err) {
      console.error('Failed to load attendances:', err);
      setAttendances([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendances();
  }, []);

  const filteredAttendances = attendances.filter((att) => {
    const matchesSearch =
      att.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.employeeId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDate = !dateFilter || att.date === dateFilter;
    const matchesStatus = statusFilter === 'ALL' || att.status === statusFilter;
    const matchesEmp = employeeFilter === 'ALL' || att.employeeName === employeeFilter;

    return matchesSearch && matchesDate && matchesStatus && matchesEmp;
  });

  const totalPages = Math.ceil(filteredAttendances.length / itemsPerPage) || 1;
  const paginatedAttendances = filteredAttendances.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const missingCheckoutCount = attendances.filter(a => a.status === 'Missing Check-Out').length;
  const disputedCount = attendances.filter(a => a.status === 'Disputed').length;

  const handleSaveAttendance = (savedData) => {
    setAttendances((prev) => prev.map((a) => (a.id === savedData.id ? savedData : a)));
    addToast(`Attendance record updated for ${savedData.employeeName}`, 'success');
    setIsFormModalOpen(false);
    setEditingAttendance(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* PAGE HEADER */}
      <div className="page-header">
        <div className="page-header-text">
          <h1 className="page-title">Attendance & Time Logs</h1>
          <p className="page-description">
            Daily check-in / check-out terminal, worked hours tracking, and dispute resolution.
          </p>
        </div>
      </div>

      {/* ANOMALY WARNING BANNER IF MISSING CHECKOUTS */}
      {(missingCheckoutCount > 0 || disputedCount > 0) && (
        <Alert type="warning" title="Attendance Anomaly Alerts">
          There are <strong>{missingCheckoutCount} missing check-outs</strong> and <strong>{disputedCount} disputed entries</strong> requiring HR manager review.
        </Alert>
      )}

      {/* QUICK CHECK-IN / CHECK-OUT TERMINAL WIDGET */}
      <AttendanceWidget />

      {/* FILTER & SEARCH BAR */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        padding: '16px',
        backgroundColor: '#FFFFFF',
        borderRadius: '14px',
        border: '1px solid #E2E8F0',
        boxShadow: 'var(--shadow-sm)'
      }}>
        {/* Search Input */}
        <div style={{ position: 'relative', width: '240px', flex: '1 1 200px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
          <input
            type="text"
            className="input"
            style={{ paddingLeft: '36px' }}
            placeholder="Search employee..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Date Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <Input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            style={{ width: '160px', marginBottom: 0 }}
          />

          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '170px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="Present">Present (Emerald)</option>
            <option value="Disputed">Disputed (Amber)</option>
            <option value="Missing Check-Out">Missing Check-Out (Rose)</option>
            <option value="On Leave">On Leave</option>
          </Select>

          {(searchQuery || dateFilter || statusFilter !== 'ALL') && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => { setSearchQuery(''); setDateFilter(''); setStatusFilter('ALL'); }}
            >
              Reset Filters
            </Button>
          )}
        </div>
      </div>

      {/* MASTER DATA TABLE */}
      {loading ? (
        <div style={{ padding: '48px', textAlign: 'center' }}>
          <Spinner size="lg" />
        </div>
      ) : paginatedAttendances.length === 0 ? (
        <EmptyState
          title="No Attendance Logs Found"
          description="No records match your selected search and date filters."
        />
      ) : (
        <Table headers={['Employee', 'Date', 'Check In', 'Check Out', 'Worked Hours', 'Status', 'Actions']}>
          {paginatedAttendances.map((att) => {
            const isPresent = att.status === 'Present';
            const isDisputed = att.status === 'Disputed';
            const isMissing = att.status === 'Missing Check-Out';

            return (
              <tr 
                key={att.id}
                style={{
                  backgroundColor: isMissing ? '#FFF1F2' : isDisputed ? '#FEF3C7' : '#FFFFFF'
                }}
              >
                <td>
                  <strong style={{ color: '#0F172A' }}>{att.employeeName}</strong>
                  <div className="text-xs text-muted">ID: {att.employeeId}</div>
                </td>
                <td><span className="font-mono text-sm">{att.date}</span></td>
                <td><span className="font-medium text-sm">{att.checkIn}</span></td>
                <td>
                  <span className={`font-medium text-sm ${isMissing ? 'text-error font-bold' : ''}`}>
                    {att.checkOut}
                  </span>
                </td>
                <td>
                  {/* Worked hours consumed directly from backend API contract */}
                  <strong style={{ color: '#172554' }}>{att.workedHours}</strong>
                </td>
                <td>
                  {/* Color logic: Normal -> Emerald, Warning -> Amber, Error -> Rose */}
                  <Badge 
                    variant={isPresent ? 'success' : isDisputed ? 'warning' : isMissing ? 'error' : 'neutral'}
                    dot
                  >
                    {att.status}
                  </Badge>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={Eye}
                      onClick={() => { setSelectedAttendance(att); setIsDetailModalOpen(true); }}
                    />
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      icon={Edit}
                      onClick={() => { setEditingAttendance(att); setIsFormModalOpen(true); }}
                    />
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      {/* PAGINATION */}
      {filteredAttendances.length > itemsPerPage && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          totalRecords={filteredAttendances.length}
        />
      )}

      {/* EDIT / CORRECTION MODAL */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => { setIsFormModalOpen(false); setEditingAttendance(null); }}
        title={`Attendance Correction: ${editingAttendance?.employeeName}`}
      >
        <AttendanceForm
          attendance={editingAttendance}
          onSave={handleSaveAttendance}
          onCancel={() => { setIsFormModalOpen(false); setEditingAttendance(null); }}
        />
      </Modal>

      {/* ATTENDANCE DETAIL MODAL */}
      {selectedAttendance && (
        <Modal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          title={`Attendance Record: ${selectedAttendance.employeeName}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              padding: '16px',
              backgroundColor: selectedAttendance.status === 'Present' ? '#D1FAE5' : selectedAttendance.status === 'Disputed' ? '#FEF3C7' : '#FFE4E6',
              borderRadius: '10px',
              border: '1px solid #E2E8F0'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <strong>{selectedAttendance.status} Record</strong>
                <Badge variant={selectedAttendance.status === 'Present' ? 'success' : selectedAttendance.status === 'Disputed' ? 'warning' : 'error'}>
                  {selectedAttendance.status}
                </Badge>
              </div>
              {selectedAttendance.anomalyReason && (
                <p className="text-xs text-error" style={{ marginTop: '6px' }}>
                  ⚠️ {selectedAttendance.anomalyReason}
                </p>
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '0.875rem' }}>
              <div><span className="text-muted">Employee:</span> <strong>{selectedAttendance.employeeName}</strong></div>
              <div><span className="text-muted">Date:</span> {selectedAttendance.date}</div>
              <div><span className="text-muted">Check In:</span> {selectedAttendance.checkIn}</div>
              <div><span className="text-muted">Check Out:</span> {selectedAttendance.checkOut}</div>
              <div><span className="text-muted">Worked Hours:</span> <strong className="text-accent">{selectedAttendance.workedHours}</strong></div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AttendanceList;
