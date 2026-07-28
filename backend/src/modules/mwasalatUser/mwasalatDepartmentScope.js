import MwasalatUser from './mwasalatUser.model.js';
import { MWASALAT_ROLES } from './mwasalatUser.constants.js';

// Department Admin is the only role whose queries get filtered down to a
// single department — everyone else (Super Admin, Platform Admin, and every
// other tier) sees the whole platform. Kept as a named check rather than an
// inline role comparison so every call site reads the same way.
const isDepartmentScoped = (actor) => actor?.role === MWASALAT_ROLES.DEPARTMENT_ADMIN;

// Programs/enrollments/certificates/activity-logs don't carry a department
// field of their own — only MwasalatUser does (see mwasalatUser.model.js).
// Every department-scoped query joins through this: "which users belong to
// this department" is the one fact every other scoped query is filtered by.
const getDepartmentUserIds = async (departmentId) => {
  if (!departmentId) return [];
  const users = await MwasalatUser.find({ department: departmentId }, '_id');
  return users.map((u) => u._id);
};

export const mwasalatDepartmentScope = { isDepartmentScoped, getDepartmentUserIds };
