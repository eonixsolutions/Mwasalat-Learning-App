import { Router } from 'express';
import mwasalatAuthRoutes from './modules/mwasalatAuth/mwasalatAuth.routes.js';
import mwasalatUserRoutes from './modules/mwasalatUser/mwasalatUser.routes.js';
import mwasalatProgramRoutes from './modules/mwasalatProgram/mwasalatProgram.routes.js';
import mwasalatQuizRoutes from './modules/mwasalatQuiz/mwasalatQuiz.routes.js';
import mwasalatPaymentRoutes from './modules/mwasalatPayment/mwasalatPayment.routes.js';
import mwasalatNotificationRoutes from './modules/mwasalatNotification/mwasalatNotification.routes.js';
import mwasalatActivityLogRoutes from './modules/mwasalatActivityLog/mwasalatActivityLog.routes.js';
import mwasalatSettingsRoutes from './modules/mwasalatSettings/mwasalatSettings.routes.js';
import mwasalatChatRoutes from './modules/mwasalatChat/mwasalatChat.routes.js';
import mwasalatAdminChatRoutes from './modules/mwasalatAdminChat/mwasalatAdminChat.routes.js';
import mwasalatDiscussionRoutes from './modules/mwasalatDiscussion/mwasalatDiscussion.routes.js';
import mwasalatAiRoutes from './modules/mwasalatAi/mwasalatAi.routes.js';
import mwasalatCategoryRoutes from './modules/mwasalatCategory/mwasalatCategory.routes.js';
import mwasalatAssignmentRoutes from './modules/mwasalatAssignment/mwasalatAssignment.routes.js';
import mwasalatDepartmentRoutes from './modules/mwasalatDepartment/mwasalatDepartment.routes.js';
import mwasalatGroupRoutes from './modules/mwasalatGroup/mwasalatGroup.routes.js';

const router = Router();

router.use('/mwasalat-auth', mwasalatAuthRoutes);
router.use('/mwasalat-users', mwasalatUserRoutes);
router.use('/mwasalat-programs', mwasalatProgramRoutes);
router.use('/mwasalat-quiz', mwasalatQuizRoutes);
router.use('/mwasalat-payments', mwasalatPaymentRoutes);
router.use('/mwasalat-notifications', mwasalatNotificationRoutes);
router.use('/mwasalat-activity', mwasalatActivityLogRoutes);
router.use('/mwasalat-settings', mwasalatSettingsRoutes);
router.use('/mwasalat-chat', mwasalatChatRoutes);
router.use('/mwasalat-admin-chat', mwasalatAdminChatRoutes);
router.use('/mwasalat-discussions', mwasalatDiscussionRoutes);
router.use('/mwasalat-ai', mwasalatAiRoutes);
router.use('/mwasalat-categories', mwasalatCategoryRoutes);
router.use('/mwasalat-assignments', mwasalatAssignmentRoutes);
router.use('/mwasalat-departments', mwasalatDepartmentRoutes);
router.use('/mwasalat-groups', mwasalatGroupRoutes);

export default router;
