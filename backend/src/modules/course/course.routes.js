import { Router } from 'express';
import { courseController } from './course.controller.js';
import { authMiddleware } from '../auth/auth.middleware.js';
import { validate } from '../../middlewares/validate.js';
import { createCourseSchema, updateCourseSchema } from './course.validation.js';
import { ROLES } from '../../constants/index.js';
const router = Router();

const adminOnly = [
  authMiddleware.authenticate,
  authMiddleware.authorize(ROLES.SUPER_ADMIN, ROLES.BRANCH_ADMIN),
];

// Public
router.get('/active', courseController.getActiveCourses);

// Student
router.get('/enrollment', authMiddleware.authenticate, authMiddleware.authorize(ROLES.STUDENT), courseController.getMyEnrollment);
router.post('/log-activity', authMiddleware.authenticate, authMiddleware.authorize(ROLES.STUDENT), courseController.logActivity);

// Admin
router.get('/',          ...adminOnly,                                courseController.getAllCourses);
router.post('/',         ...adminOnly, validate(createCourseSchema),  courseController.createCourse);
router.patch('/:id',     ...adminOnly, validate(updateCourseSchema),  courseController.updateCourse);
router.delete('/:id',    authMiddleware.authenticate, authMiddleware.authorize(ROLES.SUPER_ADMIN), courseController.deleteCourse);

export default router;
