import 'dotenv/config';
import mongoose from 'mongoose';
import MwasalatUser from '../modules/mwasalatUser/mwasalatUser.model.js';
import MwasalatDepartment from '../modules/mwasalatDepartment/mwasalatDepartment.model.js';
import { MWASALAT_ROLES } from '../modules/mwasalatUser/mwasalatUser.constants.js';

// Reverts seedMwasalatDepartments.js + seedMwasalatDepartmentAdmins.js +
// seedMwasalatPersons.js. Removes every MwasalatDepartment and every
// MwasalatUser whose role those scripts create (department_admin,
// supervisor, instructor, learner, external_learner). Leaves super_admin /
// platform_admin accounts untouched. Run with:
//   npm run seed:mwasalat-reset   (from backend/)
const SEEDED_ROLES = [
  MWASALAT_ROLES.DEPARTMENT_ADMIN,
  MWASALAT_ROLES.SUPERVISOR,
  MWASALAT_ROLES.INSTRUCTOR,
  MWASALAT_ROLES.LEARNER,
  MWASALAT_ROLES.EXTERNAL_LEARNER,
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const users = await MwasalatUser.deleteMany({ role: { $in: SEEDED_ROLES } });
  const departments = await MwasalatDepartment.deleteMany({});

  console.log(`Deleted ${users.deletedCount} user(s) (roles: ${SEEDED_ROLES.join(', ')})`);
  console.log(`Deleted ${departments.deletedCount} department(s)`);

  await mongoose.disconnect();
  console.log('Done.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
