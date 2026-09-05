-- =============================================================================
-- Seed 06: Standard Time Off Types
-- Only system time off types are provisioned.
-- Sample contracts and allocations removed for clean production state.
-- =============================================================================

INSERT INTO time_off_types (
    id, name, unit, requires_allocation, approval_level, affects_payroll, display_color, is_active
) VALUES
(1, 'Paid Time Off', 'Days', true, 'Manager', true, '#10B981', true),
(2, 'Sick Leave', 'Days', false, 'Manager', true, '#EF4444', true),
(3, 'Comp Off', 'Hours', true, 'Officer', true, '#F59E0B', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

SELECT setval('time_off_types_id_seq', (SELECT MAX(id) FROM time_off_types));
