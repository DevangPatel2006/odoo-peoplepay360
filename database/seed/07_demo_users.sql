-- =============================================================================
-- Seed 07: Verified Demo User Accounts & Role Mappings
-- Password for all demo accounts is 'Password123!' (bcrypt 10 rounds)
-- =============================================================================

INSERT INTO users (employee_id, work_email, password_hash, is_active) VALUES
(1, 'admin@peoplepay360.com', '$2b$10$9YExRphQKzq0hTVYno5qTu76c5VhdlcfYtWiSPfNyMD1JDFROyvV6', true),
(2, 'hrmanager@peoplepay360.com', '$2b$10$9YExRphQKzq0hTVYno5qTu76c5VhdlcfYtWiSPfNyMD1JDFROyvV6', true),
(3, 'payrolluser@peoplepay360.com', '$2b$10$9YExRphQKzq0hTVYno5qTu76c5VhdlcfYtWiSPfNyMD1JDFROyvV6', true),
(4, 'david.engineer@peoplepay360.com', '$2b$10$9YExRphQKzq0hTVYno5qTu76c5VhdlcfYtWiSPfNyMD1JDFROyvV6', true)
ON CONFLICT (work_email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    is_active = EXCLUDED.is_active;

-- Map roles to users based on work email
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.work_email = 'admin@peoplepay360.com' AND r.name = 'Admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.work_email = 'hrmanager@peoplepay360.com' AND r.name = 'HR Manager'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.work_email = 'payrolluser@peoplepay360.com' AND r.name = 'HR Payroll User'
ON CONFLICT (user_id, role_id) DO NOTHING;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.work_email = 'david.engineer@peoplepay360.com' AND r.name = 'Employee'
ON CONFLICT (user_id, role_id) DO NOTHING;
