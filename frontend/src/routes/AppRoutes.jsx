import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../auth/LoginPage';
import { UserManagementPage } from '../auth/UserManagementPage';
import { RoleGuard } from '../auth/RoleGuard';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { EmployeeList } from '../features/employees/EmployeeList';
import { ContractList } from '../features/contracts/ContractList';
import { ScheduleList } from '../features/workingSchedules/ScheduleList';
import { AttendanceList } from '../features/attendance/AttendanceList';
import { TimeOffPage } from '../features/timeOff/TimeOffPage';
import { SalaryConfigPage } from '../features/payroll/SalaryConfigPage';
import { ReportsPage } from '../features/reports/ReportsPage';
import { DesignSystemShowcase } from '../features/designSystem/DesignSystemShowcase';
import { useApp } from '../store';

// Root path redirect: Always sends user to /login as first landing page
const RootRedirect = () => {
  return <Navigate to="/login" replace />;
};

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Root Path: Defaults to /login when unauthenticated */}
      <Route path="/" element={<RootRedirect />} />

      {/* Public Auth Routes */}
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Main Application Shell Protected Routes */}
      <Route element={<RoleGuard />}>
        <Route element={<MainLayout />}>
          {/* Executive Dashboard: Restricted to Admin and HR/Payroll Management */}
          <Route element={<RoleGuard allowedRoles={['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User']} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/employees" element={<EmployeeList />} />
            <Route path="/contracts" element={<ContractList />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['Admin', 'HR Manager', 'HR Payroll Manager', 'HR Payroll User', 'Employee']} />}>
            <Route path="/working-schedules" element={<ScheduleList />} />
            <Route path="/attendance" element={<AttendanceList />} />
            <Route path="/time-off" element={<TimeOffPage />} />
            <Route path="/reports" element={<ReportsPage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['Admin', 'HR Payroll Manager', 'HR Payroll User']} />}>
            <Route path="/payroll" element={<SalaryConfigPage />} />
          </Route>

          <Route element={<RoleGuard allowedRoles={['Admin']} />}>
            <Route path="/user-management" element={<UserManagementPage />} />
          </Route>

          <Route path="/design-system" element={<DesignSystemShowcase />} />
        </Route>
      </Route>

      {/* Fallback Catch-all Route */}
      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
};

export default AppRoutes;
