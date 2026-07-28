import { z } from 'zod';

const objectId = z.string().regex(/^[a-f\d]{24}$/i, 'Invalid id');

export const createGroupSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  nameAr: z.string().trim().max(100).optional(),
  description: z.string().trim().max(1000).optional(),
  department: objectId.nullable().optional(),
  members: z.array(objectId).optional(),
});

export const updateGroupSchema = createGroupSchema.partial().extend({
  isActive: z.boolean().optional(),
});
