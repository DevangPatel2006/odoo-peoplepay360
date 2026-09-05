import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  Select, 
  Badge, 
  Card, 
  Modal, 
  Tabs, 
  Dropdown, 
  Alert, 
  Breadcrumbs, 
  Pagination, 
  Tooltip, 
  Spinner, 
  Skeleton, 
  EmptyState, 
  ErrorState, 
  Table 
} from '../../components/ui';
import { Plus, Download, MoreVertical, Edit, Trash, HelpCircle, Check, Search, Filter } from 'lucide-react';

export const DesignSystemShowcase = () => {
  const [activeTab, setActiveTab] = useState('components');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const tabs = [
    { id: 'components', label: 'UI Components' },
    { id: 'colors', label: 'Color Tokens' },
    { id: 'typography', label: 'Typography & Spacing' },
  ];

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header & Breadcrumbs */}
      <div style={{ marginBottom: '24px' }}>
        <Breadcrumbs 
          items={[
            { label: 'System', href: '#' },
            { label: 'Design System Tokens & UI Components' }
          ]} 
        />
        <h1 style={{ marginTop: '12px', marginBottom: '8px' }}>PeoplePay360 Visual Language</h1>
        <p className="text-secondary">
          Consistent design system tokens, CSS variables, and reusable UI components built for PeoplePay360.
        </p>
      </div>

      {/* Navigation Tabs */}
      <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />

      {/* SECTION 1: COMPONENTS */}
      {activeTab === 'components' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Alerts Section */}
          <Card title="Alerts & Notifications" subtitle="Feedback banners for system events">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Alert type="info" title="System Update">
                Payrun formula engine updated to v2.4. All active contracts automatically bound.
              </Alert>
              <Alert type="success" title="Success">
                Payslips generated successfully for September 2026.
              </Alert>
              <Alert type="warning" title="Warning Anomaly">
                3 employees are missing verified bank routing numbers.
              </Alert>
              <Alert type="error" title="Validation Failed">
                Payrun cannot be validated due to unapproved attendance dispute.
              </Alert>
            </div>
          </Card>

          {/* Buttons Section */}
          <Card title="Buttons & Action Controls" subtitle="Primary, Accent, Secondary, Outline, Danger & Sizes">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <Button variant="primary" icon={Plus}>Primary Action</Button>
              <Button variant="accent">Accent Action</Button>
              <Button variant="secondary" icon={Download}>Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="primary" size="sm">Small</Button>
              <Button variant="primary" size="lg">Large Button</Button>
              <Button variant="primary" loading>Loading...</Button>
              <Button variant="primary" disabled>Disabled</Button>
            </div>
          </Card>

          {/* Form Inputs & Selects */}
          <Card title="Form Inputs, Selects & Validation" subtitle="Standard input controls with error and help text">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
              <Input 
                label="Employee Name" 
                placeholder="e.g. Alexander Wright" 
                helpText="Full legal name as listed on passport."
              />
              <Select 
                label="Department"
                options={[
                  { value: 'hr', label: 'Human Resources' },
                  { value: 'eng', label: 'Software Engineering' },
                  { value: 'fin', label: 'Finance & Accounting' }
                ]}
              />
              <Input 
                label="Base Salary ($)" 
                placeholder="75,000" 
                error="Salary must be greater than zero."
              />
            </div>
          </Card>

          {/* Badges & Status Pills */}
          <Card title="Badges & Status Pills" subtitle="Pill status indicators for HR & Payroll lifecycle states">
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
              <Badge variant="primary" dot>Running Contract</Badge>
              <Badge variant="accent">Draft Payrun</Badge>
              <Badge variant="success" dot>Approved Request</Badge>
              <Badge variant="warning" dot>Pending Review</Badge>
              <Badge variant="error" dot>Expired / Cancelled</Badge>
              <Badge variant="neutral">Archived</Badge>
            </div>
          </Card>

          {/* Tables & Data Grid */}
          <Card title="Tables & Data Display" subtitle="Clean data grids with generous whitespace and badges">
            <Table headers={['Employee', 'Department', 'Contract Status', 'Basic Wage', 'Actions']}>
              <tr>
                <td><strong>Alexander Wright</strong><br/><span className="text-xs text-muted">alex.w@peoplepay.io</span></td>
                <td>Software Engineering</td>
                <td><Badge variant="success" dot>Running</Badge></td>
                <td>$8,500.00 / mo</td>
                <td>
                  <Dropdown 
                    trigger={<Button variant="ghost" size="sm" icon={MoreVertical} />}
                    items={[
                      { label: 'Edit Profile', icon: Edit, onClick: () => {} },
                      { label: 'Delete Record', icon: Trash, onClick: () => {} }
                    ]}
                  />
                </td>
              </tr>
              <tr>
                <td><strong>Sophia Martinez</strong><br/><span className="text-xs text-muted">sophia.m@peoplepay.io</span></td>
                <td>Human Resources</td>
                <td><Badge variant="warning" dot>Draft</Badge></td>
                <td>$6,200.00 / mo</td>
                <td>
                  <Button variant="outline" size="sm">Review</Button>
                </td>
              </tr>
            </Table>
            <Pagination 
              currentPage={currentPage} 
              totalPages={5} 
              onPageChange={setCurrentPage} 
              totalRecords={48}
            />
          </Card>

          {/* Modals & Overlays */}
          <Card title="Modals, Overlays & Tooltips" subtitle="Interactive overlays with 14px surface radius">
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
              <Button variant="accent" onClick={() => setIsModalOpen(true)}>
                Open Demo Modal
              </Button>
              <Tooltip content="Hover tooltip with background #0F172A">
                <Button variant="outline" icon={HelpCircle}>Hover Tooltip</Button>
              </Tooltip>
            </div>
          </Card>

          {/* Modal Demo Instance */}
          <Modal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            title="Confirm Payrun Execution"
            footer={
              <>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button variant="primary" onClick={() => setIsModalOpen(false)}>Proceed & Compute</Button>
              </>
            }
          >
            <p className="text-secondary" style={{ marginBottom: '16px' }}>
              Are you sure you want to compute salary rules for 42 active employees in the September 2026 Payrun scope?
            </p>
            <Alert type="warning">
              This action will recalculate allowances, deductions, and tax withholdings based on active contracts.
            </Alert>
          </Modal>

          {/* Loading, Empty & Error States */}
          <Card title="Loading, Empty & Error States" subtitle="Handling empty lists, async loaders, and runtime errors">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
              <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px' }}>
                <h4 style={{ marginBottom: '12px' }}>Loading Skeleton & Spinner</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                  <Spinner size="md" />
                  <span className="text-sm text-secondary">Fetching active payrun...</span>
                </div>
                <Skeleton height="16px" style={{ marginBottom: '8px' }} />
                <Skeleton height="16px" width="70%" />
              </div>

              <EmptyState 
                title="No Contracts Found"
                description="There are no active or expired contracts matching your query filter."
                action={<Button variant="primary" size="sm" icon={Plus}>Create Contract</Button>}
              />

              <ErrorState 
                title="API Service Offline"
                message="Could not connect to the payroll engine server endpoint."
                onRetry={() => {}}
              />
            </div>
          </Card>

        </div>
      )}

      {/* SECTION 2: COLORS */}
      {activeTab === 'colors' && (
        <Card title="Exact Color Palette Specification" subtitle="Color system CSS custom properties">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
            {[
              { name: 'Primary', hex: '#172554', var: '--color-primary', dark: true },
              { name: 'Primary Hover', hex: '#1E3A8A', var: '--color-primary-hover', dark: true },
              { name: 'Accent', hex: '#7C3AED', var: '--color-accent', dark: true },
              { name: 'Accent Light', hex: '#EDE9FE', var: '--color-accent-light', dark: false },
              { name: 'Success', hex: '#059669', var: '--color-success', dark: true },
              { name: 'Success Light', hex: '#D1FAE5', var: '--color-success-light', dark: false },
              { name: 'Warning', hex: '#D97706', var: '--color-warning', dark: true },
              { name: 'Warning Light', hex: '#FEF3C7', var: '--color-warning-light', dark: false },
              { name: 'Error', hex: '#E11D48', var: '--color-error', dark: true },
              { name: 'Error Light', hex: '#FFE4E6', var: '--color-error-light', dark: false },
              { name: 'Background', hex: '#F8FAFC', var: '--color-bg', dark: false },
              { name: 'Surface', hex: '#FFFFFF', var: '--color-surface', dark: false },
              { name: 'Border', hex: '#E2E8F0', var: '--color-border', dark: false },
              { name: 'Primary Text', hex: '#0F172A', var: '--color-text-primary', dark: true },
              { name: 'Secondary Text', hex: '#64748B', var: '--color-text-secondary', dark: false },
              { name: 'Muted Text', hex: '#94A3B8', var: '--color-text-muted', dark: false },
            ].map((color) => (
              <div key={color.name} style={{
                border: '1px solid var(--color-border)',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <div style={{
                  backgroundColor: color.hex,
                  height: '80px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: color.dark ? '#ffffff' : '#0F172A',
                  fontWeight: 'bold',
                  fontSize: '0.875rem'
                }}>
                  {color.hex}
                </div>
                <div style={{ padding: '12px' }}>
                  <div style={{ fontWeight: '600', fontSize: '0.875rem' }}>{color.name}</div>
                  <div className="text-xs text-muted" style={{ fontFamily: 'monospace' }}>{color.var}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* SECTION 3: TYPOGRAPHY & SPACING */}
      {activeTab === 'typography' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <Card title="Typography Scale & Hierarchy" subtitle="Inter modern sans-serif typography tokens">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><h1>Heading 1 (30px / Bold)</h1></div>
              <div><h2>Heading 2 (24px / Semibold)</h2></div>
              <div><h3>Heading 3 (20px / Semibold)</h3></div>
              <div><h4>Heading 4 (18px / Medium)</h4></div>
              <div><p className="text-base">Body Base Text (16px / Regular) - Modern enterprise human resource management & payroll platform.</p></div>
              <div><p className="text-sm text-secondary">Body Small Secondary Text (14px / Regular) - Used for table headers, hints, and card descriptions.</p></div>
              <div><p className="text-xs text-muted">Caption Extra Small Muted Text (12px / Regular) - Used for metadata timestamps, badges, and helper notes.</p></div>
            </div>
          </Card>

          <Card title="Surface Elevation & Radius Rules" subtitle="Generous whitespace, thin borders, 10–14px radius">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px' }}>
              <div style={{ border: '1px solid var(--color-border)', borderRadius: '10px', padding: '16px', background: '#FFFFFF' }}>
                <strong>Radius 10px (--radius-md)</strong>
                <p className="text-xs text-muted">Used for Buttons, Inputs, Dropdown Menus.</p>
              </div>
              <div style={{ border: '1px solid var(--color-border)', borderRadius: '12px', padding: '16px', background: '#FFFFFF', boxShadow: 'var(--shadow-sm)' }}>
                <strong>Radius 12px (--radius-lg)</strong>
                <p className="text-xs text-muted">Used for Cards, Data Tables, Alert Boxes.</p>
              </div>
              <div style={{ border: '1px solid var(--color-border)', borderRadius: '14px', padding: '16px', background: '#FFFFFF', boxShadow: 'var(--shadow-md)' }}>
                <strong>Radius 14px (--radius-xl)</strong>
                <p className="text-xs text-muted">Used for Major Containers, Overlays & Modals.</p>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
