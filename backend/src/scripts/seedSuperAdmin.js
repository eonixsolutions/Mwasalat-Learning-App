import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../modules/user/user.model.js';
import { ROLES } from '../constants/index.js';

const NAME     = process.env.SUPER_ADMIN_NAME     || 'Super Admin';
const EMAIL    = process.env.SUPER_ADMIN_EMAIL    || 'admin@eonixsolutions.in';
const PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'ChangeMe@1234';

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const existing = await User.findOne({ roles: ROLES.SUPER_ADMIN });
  if (existing) {
    console.log(`Super admin already exists: ${existing.email}`);
    process.exit(0);
  }

  await User.create({
    name: NAME,
    email: EMAIL,
    password: PASSWORD,
    roles: [ROLES.SUPER_ADMIN],
    isEmailVerified: true,
    isActive: true,
  });

  console.log('');
  console.log('Super admin created successfully.');
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
