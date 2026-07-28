import { z } from 'zod';

export const createDepartmentSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  nameAr: z.string().trim().max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  descriptionAr: z.string().trim().max(1000).optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial().extend({
  isActive: z.boolean().optional(),
});
