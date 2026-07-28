import { z } from 'zod';

const name = z.string().trim().min(2, 'Name must be at least 2 characters').max(100);
const email = z.string().trim().min(1, 'Email is required').email('Enter a valid email address');
const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const inviteUserSchema = z.object({ name, email });

export const updatePlatformAdminSchema = z.object({ name, email });

export const inviteStaffSchema = z.object({
  name,
  email,
  role: z.enum(['department_admin', 'supervisor', 'it_support']),
  department: objectId.optional(),
});

export const setActiveSchema = z.object({
  isActive: z.boolean(),
  reason: z.string().trim().max(500).optional(),
});

export const assignDepartmentSchema = z.object({
  departmentId: objectId.nullable(),
});

export const assignSupervisorSchema = z.object({
  supervisorId: objectId.nullable(),
});
