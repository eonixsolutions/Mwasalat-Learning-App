/**
 * One-time migration: converts the old `role: String` field to `roles: [String]`
 * for all existing User documents. Safe to re-run (skips users already migrated).
 *
 * Run with: node src/scripts/migrateRoles.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const collection = mongoose.connection.collection('users');

  // Only update docs that have the old `role` field but no `roles` field yet
  const result = await collection.updateMany(
    { role: { $exists: true }, roles: { $exists: false } },
    [{ $set: { roles: ['$role'] } }]
  );

  console.log(`Migrated ${result.modifiedCount} user(s) from role → roles`);

  // Also update docs where roles exists but is empty (Mongoose wrote the default)
  const result2 = await collection.updateMany(
    { role: { $exists: true }, roles: { $size: 0 } },
    [{ $set: { roles: ['$role'] } }]
  );

  if (result2.modifiedCount > 0) {
    console.log(`Fixed ${result2.modifiedCount} user(s) where roles was empty array`);
  }

  console.log('Migration complete.');
  process.exit(0);
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
