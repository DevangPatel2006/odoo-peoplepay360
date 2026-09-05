-- =============================================================================
-- Seed 04: Working Schedules & Lines
-- Sample working schedule "40 Hours / Week" with auto-computed total hours
-- Mon–Fri, 9:00–18:00, 1h break each day (= 8h/day, 40h/week)
-- =============================================================================

INSERT INTO working_schedules (id, company_id, name, calendar_type, timezone, status) VALUES
(1, 1, 'Standard 40 Hours / Week', 'Standard', 'America/New_York', 'Active')
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name;

SELECT setval('working_schedules_id_seq', (SELECT MAX(id) FROM working_schedules));

INSERT INTO working_schedule_lines (working_schedule_id, day_of_week, start_time, end_time, break_minutes) VALUES
(1, 'Monday', '09:00:00', '18:00:00', 60),
(1, 'Tuesday', '09:00:00', '18:00:00', 60),
(1, 'Wednesday', '09:00:00', '18:00:00', 60),
(1, 'Thursday', '09:00:00', '18:00:00', 60),
(1, 'Friday', '09:00:00', '18:00:00', 60)
ON CONFLICT (working_schedule_id, day_of_week) DO UPDATE SET 
start_time = EXCLUDED.start_time, end_time = EXCLUDED.end_time, break_minutes = EXCLUDED.break_minutes;
