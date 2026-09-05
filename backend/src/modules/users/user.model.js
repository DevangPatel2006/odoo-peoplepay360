import { query } from '../../config/db.js';

export const findAll = async ({ limit, offset }) => {
  const countRes = await query('SELECT COUNT(*) FROM users');
  const total = parseInt(countRes.rows[0].count, 10);

  const usersRes = await query(
    `SELECT u.id, u.employee_id, u.work_email, u.is_active, u.last_login_at, u.created_at, u.updated_at,
            e.first_name, e.last_name, e.employee_code,
            COALESCE(
              json_agg(json_build_object('id', r.id, 'name', r.name)) FILTER (WHERE r.id IS NOT NULL),
              '[]'
            ) AS roles
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     GROUP BY u.id, e.id
     ORDER BY u.id ASC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return { rows: usersRes.rows, total };
};

export const findById = async (id) => {
  const res = await query(
    `SELECT u.id, u.employee_id, u.work_email, u.is_active, u.last_login_at, u.created_at, u.updated_at,
            e.first_name, e.last_name, e.employee_code,
            COALESCE(
              json_agg(json_build_object('id', r.id, 'name', r.name)) FILTER (WHERE r.id IS NOT NULL),
              '[]'
            ) AS roles
     FROM users u
     LEFT JOIN employees e ON e.id = u.employee_id
     LEFT JOIN user_roles ur ON ur.user_id = u.id
     LEFT JOIN roles r ON r.id = ur.role_id
     WHERE u.id = $1
     GROUP BY u.id, e.id`,
    [id]
  );

  return res.rows[0] || null;
};

export const create = async ({ employee_id, work_email, password_hash, is_active = true }) => {
  const res = await query(
    `INSERT INTO users (employee_id, work_email, password_hash, is_active)
     VALUES ($1, $2, $3, $4)
     RETURNING id, employee_id, work_email, is_active, created_at, updated_at`,
    [employee_id || null, work_email, password_hash, is_active]
  );
  return res.rows[0];
};

export const update = async (id, fields) => {
  const setClauses = [];
  const values = [];
  let idx = 1;

  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) {
      setClauses.push(`${key} = $${idx}`);
      values.push(value);
      idx++;
    }
  }

  if (setClauses.length === 0) {
    return findById(id);
  }

  values.push(id);
  const sql = `
    UPDATE users
    SET ${setClauses.join(', ')}
    WHERE id = $${idx}
    RETURNING id, employee_id, work_email, is_active, updated_at
  `;

  const res = await query(sql, values);
  return res.rows[0] || null;
};

export const remove = async (id) => {
  const res = await query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
  return res.rows[0] || null;
};

export const addRole = async (userId, roleId) => {
  await query(
    'INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [userId, roleId]
  );
};

export const removeRole = async (userId, roleId) => {
  await query('DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2', [userId, roleId]);
};

export const findRoleIdByName = async (roleName) => {
  const res = await query('SELECT id FROM roles WHERE name = $1', [roleName]);
  return res.rows[0]?.id || null;
};

export default {
  findAll,
  findById,
  create,
  update,
  remove,
  addRole,
  removeRole,
  findRoleIdByName,
};
