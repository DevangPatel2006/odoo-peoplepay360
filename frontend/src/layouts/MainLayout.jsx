import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useApp } from '../store';
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Clock, 
  Calendar, 
  DollarSign, 
  BarChart3, 
  Settings, 
  Palette, 
  Menu, 
  X, 
  Search, 
  Bell, 
  User, 
  LogOut, 
  ChevronDown, 
  ShieldAlert,
  ShieldCheck
} from 'lucide-react';
import { Dropdown, Button, Badge, ToastContainer } from '../components/ui';

export const MainLayout = () => {
  const { 
    user, 
    logout, 
    sidebarOpen, 
    toggleSidebar, 
    mobileSidebarOpen, 
    toggleMobileSidebar, 
    setMobileSidebarOpen,
    searchQuery,
    setSearchQuery,
    notifications,
    toasts,
    removeToast
  } = useApp();

  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const userRoles = Array.isArray(user?.roles) && user.roles.length > 0
    ? user.roles
    : (user?.role ? [user.role] : ['Employee']);

  const userRole = userRoles[0] || 'Employee';
  const isAdmin = userRoles.some((r) => String(r).toLowerCase() === 'admin');

  // All 7 Workflow Modules
  const allNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee'] },
    { path: '/employees', label: 'Employees', icon: Users, roles: ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'] },
    { path: '/contracts', label: 'Contracts', icon: FileText, roles: ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User'] },
    { path: '/attendance', label: 'Attendance', icon: Clock, roles: ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee'] },
    { path: '/time-off', label: 'Time Off', icon: Calendar, roles: ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee'] },
    { path: '/payroll', label: 'Payroll', icon: DollarSign, roles: ['Admin', 'HR Payroll Manager', 'HR Payroll User'] },
    { path: '/reports', label: 'Reports', icon: BarChart3, roles: ['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee'] },
  ];

  // Filter navigation items based on current active user role
  const navItems = allNavItems.filter((item) => isAdmin || item.roles.some((r) => userRoles.includes(r)));

  // Secondary Bottom Navigation Links
  const bottomNavItems = [
    { path: '/user-management', label: 'Settings', icon: Settings, roles: ['Admin'] },
  ].filter((item) => isAdmin || item.roles.some((r) => userRoles.includes(r)));

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="app-shell">
      {/* Mobile Drawer Backdrop */}
      {mobileSidebarOpen && (
        <div 
          className="mobile-drawer-backdrop"
          onClick={() => setMobileSidebarOpen(false)} 
        />
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`sidebar ${!sidebarOpen ? 'sidebar-collapsed' : ''} ${mobileSidebarOpen ? 'sidebar-mobile-open' : ''}`}>
        {/* Sidebar Logo */}
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">P</div>
          {sidebarOpen && <span className="sidebar-logo-text">PayOps</span>}
        </div>

        {/* Primary Workflow Navigation (RBAC Filtered) */}
        <nav className="sidebar-nav">
          {sidebarOpen && <div className="sidebar-section-title">Workflow Modules ({userRole})</div>}
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path) || (item.path === '/dashboard' && location.pathname === '/');

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                onClick={() => setMobileSidebarOpen(false)}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon size={18} className="sidebar-icon" />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom Navigation & Settings */}
        <div className="sidebar-footer">
          {sidebarOpen && <div className="sidebar-section-title">System</div>}
          {bottomNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive ? 'sidebar-item-active' : ''}`}
                onClick={() => setMobileSidebarOpen(false)}
                title={!sidebarOpen ? item.label : undefined}
              >
                <Icon size={18} className="sidebar-icon" />
                {sidebarOpen && <span>{item.label}</span>}
              </NavLink>
            );
          })}
        </div>
      </aside>

      {/* MAIN WRAPPER & TOP BAR */}
      <div className="main-wrapper">
        {/* TOP BAR */}
        <header className="topbar">
          <div className="topbar-left">
            <button 
              className="btn btn-ghost btn-icon"
              onClick={() => {
                if (window.innerWidth <= 768) {
                  toggleMobileSidebar();
                } else {
                  toggleSidebar();
                }
              }}
              aria-label="Toggle Sidebar Navigation"
            >
              <Menu size={20} />
            </button>
          </div>

          <div className="topbar-right">
            {/* Authenticated Role Indicator */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              backgroundColor: '#F1F5F9',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '0.75rem',
              fontWeight: 600,
              color: '#334155',
              border: '1px solid #E2E8F0'
            }}>
              <ShieldCheck size={15} style={{ color: 'var(--color-accent)' }} />
              <span>Role: {userRoles.join(', ') || 'Employee'}</span>
            </div>

            {/* Notifications Bell */}
            <div style={{ position: 'relative' }}>
              <button 
                className="btn btn-ghost btn-icon"
                onClick={() => setShowNotifications(!showNotifications)}
                style={{ position: 'relative' }}
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span style={{
                    position: 'absolute',
                    top: '4px',
                    right: '4px',
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    backgroundColor: '#E11D48'
                  }} />
                )}
              </button>

              {showNotifications && (
                <div className="dropdown-menu" style={{ width: '300px', right: 0 }}>
                  <div style={{ padding: '12px 16px', borderBottom: '1px solid #E2E8F0', fontWeight: 600, fontSize: '0.875rem' }}>
                    Notifications ({unreadCount} unread)
                  </div>
                  {notifications.map((notif) => (
                    <div key={notif.id} className="dropdown-item" style={{ flexDirection: 'column', alignItems: 'flex-start', padding: '10px 16px' }}>
                      <span style={{ fontWeight: notif.read ? 400 : 600, fontSize: '0.875rem' }}>{notif.title}</span>
                      <span className="text-xs text-muted">{notif.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* User Profile Menu */}
            <Dropdown
              trigger={
                <div className="user-profile-menu">
                  <div className="user-avatar">
                    {user?.name ? user.name.split(' ').map(n => n[0]).join('') : 'U'}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{user?.name || 'Devang Patel'}</span>
                    <span className="user-role">{userRole}</span>
                  </div>
                  <ChevronDown size={14} className="text-muted" />
                </div>
              }
              items={[
                { label: user?.email || 'admin@payops.com', icon: User },
                { label: `Active Role: ${userRole}`, icon: ShieldAlert },
                { divider: true },
                { label: 'Logout', icon: LogOut, onClick: handleLogout },
              ]}
            />
          </div>
        </header>

        {/* MAIN CONTENT AREA */}
        <main className="content-area">
          <Outlet />
        </main>
      </div>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};
