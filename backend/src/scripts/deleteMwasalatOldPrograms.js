import 'dotenv/config';
import mongoose from 'mongoose';
import MwasalatProgram from '../modules/mwasalatProgram/mwasalatProgram.model.js';
import MwasalatEnrollment from '../modules/mwasalatProgram/mwasalatEnrollment.model.js';
import MwasalatTransaction from '../modules/mwasalatPayment/mwasalatTransaction.model.js';

// One-off cleanup: removes the 4 throwaway placeholder programs (Communication
// Skill / sample 2 / ample3 / IT) now that seedMwasalatProgramCatalog.js has
// built a real catalog reusing their Cloudinary video/pdf assets. Also
// deletes any MwasalatEnrollment/MwasalatTransaction rows still pointing at
// those 4 program IDs (Khalifa Al-Maskari has 2 real paid transactions
// against them) so nothing is left dangling — same class of bug as the
// orphaned enrollment we cleaned up earlier for Nawaf Al-Habsi. Run with:
//   npm run seed:mwasalat-delete-old-programs   (from backend/)
const OLD_TITLES = ['Communication Skill', 'sample 2', 'ample3', 'IT'];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const oldPrograms = await MwasalatProgram.find({ title: { $in: OLD_TITLES } }, '_id title');
  if (!oldPrograms.length) {
    console.log('No matching old programs found — nothing to do.');
    await mongoose.disconnect();
    return;
  }

  const oldIds = oldPrograms.map((p) => p._id);
  console.log(`Found ${oldPrograms.length} old program(s): ${oldPrograms.map((p) => p.title).join(', ')}`);

  const enrollmentResult = await MwasalatEnrollment.deleteMany({ program: { $in: oldIds } });
  console.log(`Deleted ${enrollmentResult.deletedCount} enrollment(s) referencing old programs`);

  const transactionResult = await MwasalatTransaction.deleteMany({ program: { $in: oldIds } });
  console.log(`Deleted ${transactionResult.deletedCount} transaction(s) referencing old programs`);

  const programResult = await MwasalatProgram.deleteMany({ _id: { $in: oldIds } });
  console.log(`Deleted ${programResult.deletedCount} old program(s)`);

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
