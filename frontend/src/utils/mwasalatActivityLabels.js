// Shared by the Activity Log page and the admin dashboard's recent-activity
// feed so the two never drift out of sync on what a raw `action` value means.
export const MWASALAT_ACTIVITY_ACTION_KEYS = {
  login: 'loggedIn',
  invite_instructor: 'invitedInstructor',
  block_user: 'blockedUser',
  unblock_user: 'unblockedUser',
  create_program: 'createdProgram',
  update_program: 'updatedProgram',
  delete_program: 'deletedProgram',
  send_notification: 'sentNotification',
  update_settings: 'updatedSettings',
};

// Actions that represent a negative/destructive event — rendered in the
// brand's red accent everywhere else they're already surfaced (block/unblock
// pill, payment status), so the activity feed reuses the same two-tone rule.
export const MWASALAT_NEGATIVE_ACTIONS = new Set(['block_user', 'delete_program']);
