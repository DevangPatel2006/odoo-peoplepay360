import employeeService from './employee.service.js';
import contractService from '../contracts/contract.service.js';
import attendanceService from '../attendance/attendance.service.js';
import timeOffService from '../timeOff/requests/request.service.js';
import allocationService from '../timeOff/allocations/allocation.controller.js';
import { ok } from '../../common/utils/apiResponse.js';

export const list = async (req, res) => {
  const { data, meta } = await employeeService.listEmployees(req.user, req.query);
  return ok(res, data, meta);
};

export const getById = async (req, res) => {
  const employee = await employeeService.getEmployeeById(req.params.id, req.user);
  return ok(res, employee);
};

export const create = async (req, res) => {
  const employee = await employeeService.createEmployee(req.user, req.body);
  return ok(res, employee, undefined, 201);
};

export const update = async (req, res) => {
  const employee = await employeeService.updateEmployee(req.params.id, req.user, req.body);
  return ok(res, employee);
};

export const remove = async (req, res) => {
  await employeeService.deleteEmployee(req.params.id, req.user);
  return ok(res, { message: 'Employee deleted successfully' });
};

export const resetCredentials = async (req, res) => {
  const result = await employeeService.resetCredentials(req.params.id, req.user);
  return ok(res, result);
};

/**
 * Smart Button Passthroughs (Enforce employee-id scoping)
 */
export const getEmployeeContracts = async (req, res, next) => {
  try {
    await employeeService.getEmployeeById(req.params.id, req.user);
    req.query.employee_id = req.params.id;
    return contractService.listContracts(req.user, req.query).then(({ data, meta }) => {
      return ok(res, data, meta);
    });
  } catch (err) {
    return next(err);
  }
};

export const getEmployeeAttendance = async (req, res, next) => {
  try {
    await employeeService.getEmployeeById(req.params.id, req.user);
    req.query.employee_id = req.params.id;
    return attendanceService.listAttendances(req.user, req.query).then(({ data, meta }) => {
      return ok(res, data, meta);
    });
  } catch (err) {
    return next(err);
  }
};

export const getEmployeeTimeOff = async (req, res, next) => {
  try {
    await employeeService.getEmployeeById(req.params.id, req.user);
    req.query.employee_id = req.params.id;
    return timeOffService.listRequests(req.user, req.query).then(({ data, meta }) => {
      return ok(res, data, meta);
    });
  } catch (err) {
    return next(err);
  }
};

export const getEmployeeAllocations = async (req, res, next) => {
  try {
    await employeeService.getEmployeeById(req.params.id, req.user);
    req.query.employee_id = req.params.id;
    return allocationService.listAllocationsDirect(req.user, req.query).then(({ data, meta }) => {
      return ok(res, data, meta);
    });
  } catch (err) {
    return next(err);
  }
};

export default {
  list,
  getById,
  create,
  update,
  remove,
  getEmployeeContracts,
  getEmployeeAttendance,
  getEmployeeTimeOff,
  getEmployeeAllocations,
  resetCredentials,
};
