#!/usr/bin/env bash
set -e

echo "[Docker Init] Running PeoplePay360 database initialization..."

SCRIPT_DIR="/docker-entrypoint-initdb.d"
if [ ! -d "$SCRIPT_DIR" ]; then
  SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
fi

FILES=(
  "schema.sql"
  "triggers_and_functions.sql"
  "views.sql"
  "migrations/002_hardening_fixes.sql"
  "migrations/003_bugfixes.sql"
  "seed/01_roles_and_permissions.sql"
  "seed/02_companies_departments_positions.sql"
  "seed/03_working_schedules.sql"
  "seed/04_employees.sql"
  "seed/05_salary_structures_rules.sql"
  "seed/06_time_off_types.sql"
  "seed/07_demo_users.sql"
)

for f in "${FILES[@]}"; do
  echo "[Docker Init] Executing $f..."
  psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -f "$SCRIPT_DIR/$f"
  if [ "$f" == "views.sql" ]; then
    psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" -c "INSERT INTO companies (id, name, currency_code) VALUES (1, 'PeoplePay Inc.', 'USD') ON CONFLICT (id) DO NOTHING; INSERT INTO salary_structures (id, company_id, name, structure_type) VALUES (1, 1, 'Regular Salary Structure', 'Regular') ON CONFLICT (id) DO NOTHING;"
  fi
done

echo "[Docker Init] Database initialization complete!"
