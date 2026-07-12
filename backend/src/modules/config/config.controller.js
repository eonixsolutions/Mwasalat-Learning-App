import { asyncHandler } from '../../middlewares/asyncHandler.js';
import { successResponse } from '../../utils/response.js';
import {
  ROLES,
  STAFF_ROLES,
  STUDENT_STATUS,
  ACCESS_RESTRICTION,
  APPLICATION_STATUS,
  FEE_STATUS,
  NOTIFICATION_TYPES,
  ATTENDANCE_STATUS,
} from '../../constants/index.js';

const getConfig = asyncHandler(async (req, res) => {
  successResponse(res, 'Config fetched', {
    roles:               Object.values(ROLES),
    staffRoles:          STAFF_ROLES,
    studentStatuses:     Object.values(STUDENT_STATUS),
    accessRestrictions:  Object.values(ACCESS_RESTRICTION),
    applicationStatuses: Object.values(APPLICATION_STATUS),
    feeStatuses:         Object.values(FEE_STATUS),
    notificationTypes:   Object.values(NOTIFICATION_TYPES),
    attendanceStatuses:  Object.values(ATTENDANCE_STATUS),
  });
});

export const configController = { getConfig };
