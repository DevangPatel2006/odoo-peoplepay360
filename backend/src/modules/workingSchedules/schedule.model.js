import { query } from '../../config/db.js';

export const findAll = async ({ company_id, status, limit, offset }) => {
  const conditions = ['ws.company_id = $1'];
  const values = [company_id];
  let idx = 2;

  if (status) {
    conditions.push(`ws.status = $${idx++}`);
    values.push(status);
  }

  const whereClause = conditions.join(' AND ');

  const countQuery = `SELECT COUNT(*) FROM working_schedules ws WHERE ${whereClause}`;
  const countRes = await query(countQuery, values);
  const total = parseInt(countRes.rows[0].count, 10);

  let dataQuery = `
    SELECT ws.*,
           COALESCE(SUM(wsl.computed_hours), 0.00) AS total_weekly_hours,
           COUNT(wsl.id) AS total_lines_count
    FROM working_schedules ws
    LEFT JOIN working_schedule_lines wsl ON wsl.working_schedule_id = ws.id
    WHERE ${whereClause}
    GROUP BY ws.id
    ORDER BY ws.id ASC
  `;

  if (limit !== undefined && offset !== undefined) {
    dataQuery += ` LIMIT $${idx++} OFFSET $${idx++}`;
    values.push(limit, offset);
  }

  const result = await query(dataQuery, values);
  return { rows: result.rows, total };
};

export const findById = async (id, company_id) => {
  const schedRes = await query(
    `SELECT ws.*,
            COALESCE(SUM(wsl.computed_hours), 0.00) AS total_weekly_hours
     FROM working_schedules ws
     LEFT JOIN working_schedule_lines wsl ON wsl.working_schedule_id = ws.id
     WHERE ws.id = $1 AND ws.company_id = $2
     GROUP BY ws.id`,
    [id, company_id]
  );

  const schedule = schedRes.rows[0];
  if (!schedule) return null;

  const linesRes = await query(
    `SELECT * FROM working_schedule_lines 
     WHERE working_schedule_id = $1 
     ORDER BY CASE day_of_week
       WHEN 'Monday' THEN 1
       WHEN 'Tuesday' THEN 2
       WHEN 'Wednesday' THEN 3
       WHEN 'Thursday' THEN 4
       WHEN 'Friday' THEN 5
       WHEN 'Saturday' THEN 6
       WHEN 'Sunday' THEN 7
     END`,
    [id]
  );

  return {
    ...schedule,
    lines: linesRes.rows,
  };
};

export const create = async (client, company_id, data) => {
  const insertSql = `
    INSERT INTO working_schedules (company_id, name, calendar_type, timezone, status)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `;
  const res = await client.query(insertSql, [
    company_id,
    data.name,
    data.calendar_type || 'Standard',
    data.timezone || 'UTC',
    data.status || 'Active',
  ]);
  const schedule = res.rows[0];

  if (Array.isArray(data.lines) && data.lines.length > 0) {
    for (const line of data.lines) {
      await client.query(
        `INSERT INTO working_schedule_lines (working_schedule_id, day_of_week, start_time, end_time, break_minutes)
         VALUES ($1, $2, $3, $4, $5)`,
        [schedule.id, line.day_of_week, line.start_time, line.end_time, line.break_minutes || 0]
      );
    }
  }

  return schedule;
};

export const update = async (client, id, company_id, data) => {
  const setClauses = [];
  const values = [];
  let idx = 1;

  if (data.name !== undefined) {
    setClauses.push(`name = $${idx++}`);
    values.push(data.name);
  }
  if (data.calendar_type !== undefined) {
    setClauses.push(`calendar_type = $${idx++}`);
    values.push(data.calendar_type);
  }
  if (data.timezone !== undefined) {
    setClauses.push(`timezone = $${idx++}`);
    values.push(data.timezone);
  }
  if (data.status !== undefined) {
    setClauses.push(`status = $${idx++}`);
    values.push(data.status);
  }

  if (setClauses.length > 0) {
    values.push(id, company_id);
    await client.query(
      `UPDATE working_schedules SET ${setClauses.join(', ')} WHERE id = $${idx++} AND company_id = $${idx++}`,
      values
    );
  }

  if (Array.isArray(data.lines)) {
    await client.query('DELETE FROM working_schedule_lines WHERE working_schedule_id = $1', [id]);
    for (const line of data.lines) {
      await client.query(
        `INSERT INTO working_schedule_lines (working_schedule_id, day_of_week, start_time, end_time, break_minutes)
         VALUES ($1, $2, $3, $4, $5)`,
        [id, line.day_of_week, line.start_time, line.end_time, line.break_minutes || 0]
      );
    }
  }
};

export const remove = async (id, company_id) => {
  const res = await query('DELETE FROM working_schedules WHERE id = $1 AND company_id = $2 RETURNING id', [
    id,
    company_id,
  ]);
  return res.rows[0] || null;
};

export default {
  findAll,
  findById,
  create,
  update,
  remove,
};
