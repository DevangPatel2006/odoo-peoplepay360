import timeOffModel from '../timeOff.model.js';
import employeeModel from '../../employees/employee.model.js';
import env from '../../../config/env.js';
import { resolveOwnershipScope } from '../../../common/utils/scope.js';
import { AppError } from '../../../middleware/errorHandler.js';
import { query } from '../../../config/db.js';

export const listRequests = async (user, queryParams = {}) => {
  const { scope, employeeId } = resolveOwnershipScope(user, 'TimeOff');

  const page = parseInt(queryParams.page, 10) || 1;
  const pageSize = Math.min(
    parseInt(queryParams.pageSize, 10) || env.pagination.defaultPageSize,
    env.pagination.maxPageSize
  );
  const offset = (page - 1) * pageSize;

  const filterEmployeeId =
    scope === 'own'
      ? employeeId
      : queryParams.employee_id
      ? parseInt(queryParams.employee_id, 10)
      : undefined;

  const { rows, total } = await timeOffModel.findRequests({
    company_id: user.companyId,
    employee_id: filterEmployeeId,
    time_off_type_id: queryParams.time_off_type_id
      ? parseInt(queryParams.time_off_type_id, 10)
      : undefined,
    status: queryParams.status,
    limit: pageSize,
    offset,
  });

  return {
    data: rows,
    meta: {
      page,
      pageSize,
      total,
    },
  };
};

export const getRequestById = async (id, user) => {
  const { scope, employeeId } = resolveOwnershipScope(user, 'TimeOff');
  const request = await timeOffModel.findRequestById(parseInt(id, 10), user.companyId);

  if (!request) {
    throw new AppError('Time off request not found', 404, 'NOT_FOUND');
  }

  if (scope === 'own' && request.employee_id !== employeeId) {
    throw new AppError(
      'Access denied: You may only view your own time off requests',
      403,
      'FORBIDDEN'
    );
  }

  return request;
};

export const createRequest = async (user, data) => {
  const { scope, employeeId: selfEmployeeId } = resolveOwnershipScope(user, 'TimeOff');
  const targetEmployeeId =
    scope === 'own'
      ? selfEmployeeId
      : data.employee_id
      ? parseInt(data.employee_id, 10)
      : selfEmployeeId;

  if (!targetEmployeeId) {
    throw new AppError(
      'Employee ID is required for time off request',
      400,
      'VALIDATION_ERROR'
    );
  }

  const employee = await employeeModel.findById(targetEmployeeId, user.companyId);
  if (!employee) {
    throw new AppError('Target employee not found in your company', 404, 'NOT_FOUND');
  }

  const timeOffType = await timeOffModel.findTypeById(data.time_off_type_id);
  if (!timeOffType) {
    throw new AppError('Invalid time off type', 400, 'VALIDATION_ERROR');
  }

  let allocationId = data.allocation_id || null;

  // If time off type requires allocation and no allocation_id was explicitly provided, auto-match
  if (timeOffType.requires_allocation) {
    if (allocationId) {
      // Validate provided allocation
      const alloc = await timeOffModel.findAllocationById(
        allocationId,
        user.companyId
      );
      if (!alloc || alloc.employee_id !== targetEmployeeId) {
        throw new AppError(
          'Specified allocation is invalid or does not belong to this employee',
          400,
          'VALIDATION_ERROR'
        );
      }
      if (parseFloat(data.duration) > parseFloat(alloc.remaining_amount)) {
        throw new AppError(
          `Requested duration (${data.duration}) exceeds remaining allocation balance (${alloc.remaining_amount})`,
          422,
          'INSUFFICIENT_ALLOCATION'
        );
      }
    } else {
      // Auto-match an active approved allocation for this employee & type
      const allocRes = await timeOffModel.findAllocations({
        company_id: user.companyId,
        employee_id: targetEmployeeId,
        time_off_type_id: timeOffType.id,
        status: 'Approved',
      });

      const reqStart = new Date(data.start_date);
      const reqEnd = new Date(data.end_date);

      // Filter valid allocations covering date range with sufficient balance
      const validAllocations = allocRes.rows
        .filter((alloc) => {
          const vStart = new Date(alloc.validity_start);
          const vEnd = new Date(alloc.validity_end);
          const hasBalance = parseFloat(alloc.remaining_amount) > 0;
          return reqStart >= vStart && reqEnd <= vEnd && hasBalance;
        })
        .sort(
          (a, b) =>
            parseFloat(b.remaining_amount) - parseFloat(a.remaining_amount)
        );

      if (validAllocations.length > 0) {
        allocationId = validAllocations[0].id;
      }
    }
  }

  const created = await timeOffModel.createRequest({
    ...data,
    employee_id: targetEmployeeId,
    allocation_id: allocationId,
    status: 'To Approve',
  });

  return timeOffModel.findRequestById(created.id, user.companyId);
};

export const approveRequest = async (id, user, data = {}) => {
  const request = await timeOffModel.findRequestById(parseInt(id, 10), user.companyId);
  if (!request) {
    throw new AppError('Time off request not found', 404, 'NOT_FOUND');
  }

  if (request.status === 'Approved') {
    throw new AppError('Request is already approved', 400, 'ALREADY_APPROVED');
  }

  let finalAllocationId = data.allocation_id || request.allocation_id;

  if (request.requires_allocation) {
    if (!finalAllocationId) {
      throw new AppError(
        'This time off type requires an allocation, but none is linked to this request. Please link an approved allocation before approving.',
        422,
        'ALLOCATION_REQUIRED'
      );
    }

    const alloc = await timeOffModel.findAllocationById(
      finalAllocationId,
      user.companyId
    );
    if (!alloc) {
      throw new AppError('Linked allocation not found', 404, 'NOT_FOUND');
    }
    if (alloc.status !== 'Approved') {
      throw new AppError(
        `Linked allocation #${finalAllocationId} is not approved yet (status: ${alloc.status}). Please approve the allocation first before approving this leave request.`,
        422,
        'ALLOCATION_NOT_APPROVED'
      );
    }
    if (parseFloat(request.duration) > parseFloat(alloc.remaining_amount)) {
      throw new AppError(
        `Requested duration (${request.duration}) exceeds remaining allocation balance (${alloc.remaining_amount})`,
        422,
        'INSUFFICIENT_ALLOCATION'
      );
    }
  }

  try {
    // DB trigger fn_deduct_time_off_allocation() automatically deducts allocation balance
    await timeOffModel.updateRequest(parseInt(id, 10), {
      status: 'Approved',
      allocation_id: finalAllocationId || null,
      approver_id: user.employeeId || null,
      reason: data.reason || request.reason,
    });

    // Sync approved leave into attendance records for the request period
    if (request.start_date && request.end_date) {
      const start = new Date(request.start_date);
      const end = new Date(request.end_date);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        try {
          await query(
            `INSERT INTO attendances (employee_id, attendance_date, status, notes)
             VALUES ($1, $2, 'On Leave', $3)
             ON CONFLICT (employee_id, attendance_date)
             DO UPDATE SET status = 'On Leave'`,
            [request.employee_id, dateStr, `Approved Time Off: ${request.time_off_type_name || 'Leave'}`]
          );
        } catch (attErr) {
          console.warn(`Failed to sync attendance for employee ${request.employee_id} on ${dateStr}:`, attErr.message);
        }
      }
    }

    return timeOffModel.findRequestById(parseInt(id, 10), user.companyId);
  } catch (err) {
    if (err.code === 'P0001') {
      throw new AppError(err.message, 422, 'BUSINESS_RULE_VIOLATION');
    }
    throw err;
  }
};

export const refuseRequest = async (id, user, data = {}) => {
  const request = await timeOffModel.findRequestById(parseInt(id, 10), user.companyId);
  if (!request) {
    throw new AppError('Time off request not found', 404, 'NOT_FOUND');
  }

  // If request was previously approved and had an allocation, restore the deducted balance
  if (request.status === 'Approved' && request.allocation_id) {
    await query(
      `UPDATE time_off_allocations 
       SET taken_amount = GREATEST(0, taken_amount - $1),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [parseFloat(request.duration || 0), request.allocation_id]
    );
  }

  await timeOffModel.updateRequest(parseInt(id, 10), {
    status: 'Refused',
    approver_id: user.employeeId || null,
    reason: data.reason || request.reason,
  });

  return timeOffModel.findRequestById(parseInt(id, 10), user.companyId);
};

export const deleteRequest = async (id, user) => {
  const request = await getRequestById(id, user);

  if (request.status === 'Approved') {
    throw new AppError(
      'Cannot delete an approved time off request directly. Please refuse or revert it first to preserve allocation balance tracking.',
      422,
      'APPROVED_REQUEST_NOT_DELETABLE'
    );
  }

  await timeOffModel.removeRequest(parseInt(id, 10));
  return true;
};

export default {
  listRequests,
  getRequestById,
  createRequest,
  approveRequest,
  refuseRequest,
  deleteRequest,
};
