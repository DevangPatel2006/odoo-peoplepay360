-- =============================================================================
-- Seed 07: Production Users Setup
-- Demo user accounts removed. Only production Administrator is maintained.
-- =============================================================================

-- Ensure production Admin user exists
INSERT INTO users (employee_id, work_email, password_hash, is_active) VALUES
(1, 'admin@peoplepay360.com', '$2b$10$9YExRphQKzq0hTVYno5qTu76c5VhdlcfYtWiSPfNyMD1JDFROyvV6', true)
ON CONFLICT (work_email) DO UPDATE SET 
    password_hash = EXCLUDED.password_hash,
    is_active = EXCLUDED.is_active;

-- Map Admin role (5)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.work_email = 'admin@peoplepay360.com' AND r.name = 'Admin'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Clean up any residual non-admin demo users
DELETE FROM user_roles WHERE user_id IN (SELECT id FROM users WHERE work_email <> 'admin@peoplepay360.com');
DELETE FROM users WHERE work_email <> 'admin@peoplepay360.com';
