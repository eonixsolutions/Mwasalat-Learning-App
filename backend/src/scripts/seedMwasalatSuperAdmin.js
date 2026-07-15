import 'dotenv/config';
import mongoose from 'mongoose';
import MwasalatUser from '../modules/mwasalatUser/mwasalatUser.model.js';
import { MWASALAT_ROLES } from '../modules/mwasalatUser/mwasalatUser.constants.js';

const NAME     = process.env.MWASALAT_ADMIN_NAME     || 'Mwasalat Admin';
const EMAIL    = process.env.MWASALAT_ADMIN_EMAIL    || 'admin@mwasalat.om';
const PASSWORD = process.env.MWASALAT_ADMIN_PASSWORD || 'ChangeMe@1234';

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await MwasalatUser.findOne({ email: EMAIL });
  if (existing) {
    console.log(`Mwasalat super admin already exists: ${existing.email}`);
    process.exit(0);
  }

  await MwasalatUser.create({
    name: NAME,
    email: EMAIL,
    password: PASSWORD,
    role: MWASALAT_ROLES.SUPER_ADMIN,
    isActive: true,
  });

  console.log('');
  console.log('Mwasalat super admin created successfully.');
  console.log(`  Email    : ${EMAIL}`);
  console.log(`  Password : ${PASSWORD}`);
  console.log('');
  console.log('Change the password immediately after first login.');
  process.exit(0);
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
