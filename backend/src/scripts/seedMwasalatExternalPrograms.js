import 'dotenv/config';
import mongoose from 'mongoose';
import MwasalatProgram from '../modules/mwasalatProgram/mwasalatProgram.model.js';
import MwasalatUser from '../modules/mwasalatUser/mwasalatUser.model.js';
import MwasalatQuiz from '../modules/mwasalatQuiz/mwasalatQuiz.model.js';
import MwasalatAssignment from '../modules/mwasalatAssignment/mwasalatAssignment.model.js';

// Adds 4 more programs specifically visible to external learners — of the 20
// programs from seedMwasalatProgramCatalog(.js/Batch2.js), only 3 have
// audience 'all' (2 recording + 1 live), which is why the external learner
// catalog page was so thin. `audience` is immutable once a program exists
// (see mwasalatProgram.model.js), so rather than mutate existing rows, this
// adds new pdf/ilt/modular programs — including one `external_only` course,
// which no program in the catalog demonstrated yet.
// Same conventions as every other seed script: real Cloudinary assets reused
// from the existing catalog, createdAt backdated per instructor.
// Run with:
//   npm run seed:mwasalat-external-programs   (from backend/)

async function extractReusableAssets() {
  const existingPrograms = await MwasalatProgram.find({});
  const videoAssets = [];
  const pdfAssets = [];
  for (const p of existingPrograms) {
    if (p.recordingLink) videoAssets.push({ recordingLink: p.recordingLink });
    else if (p.recordingVideoPublicId) videoAssets.push({ recordingVideoPublicId: p.recordingVideoPublicId, recordingVideoDurationSeconds: p.recordingVideoDurationSeconds });
    if (p.pdfUrl || (p.documents && p.documents.length)) pdfAssets.push({ pdfUrl: p.pdfUrl, documents: p.documents });
  }
  const videoA = videoAssets[0] ?? { recordingLink: 'https://res.cloudinary.com/demo/video/upload/sample.mp4' };
  const pdfAsset = pdfAssets[0] ?? { pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', documents: [] };
  return { videoA, pdfAsset };
}

const lesson = (type, title, order, extra = {}) => ({ type, title, order, ...extra });
const mod = (title, order, lessons) => ({ title, order, lessons });
const quiz = (questions, passPercentage = 70) => ({ questions, passPercentage });
const q = (text, options, correctIndex) => ({ text, options, correctIndex });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const { videoA, pdfAsset } = await extractReusableAssets();

  const instructorEmails = { anwar: 'anwar.albalushi@mwasalat.om', samira: 'samira.alzadjali@mwasalat.om', firas: 'firas.almukhaini@mwasalat.om', lamia: 'lamia.alajmi@mwasalat.om' };
  const instructors = {};
  for (const [key, email] of Object.entries(instructorEmails)) {
    const u = await MwasalatUser.findOne({ email });
    if (!u) throw new Error(`Instructor not found: ${email}`);
    instructors[key] = u;
  }

  const PROGRAMS = [
    {
      title: 'Traffic Law & Regulatory Updates (Oman)',
      titleAr: 'التحديثات القانونية المرورية (عُمان)',
      category: 'Health, Safety & Compliance', subCategory: 'Traffic Law & Regulatory Updates (Oman)',
      description: 'Stay current with Oman\'s traffic laws and public transport regulatory updates — open to both Mwasalat staff and the public.',
      contentTypes: ['pdf'], pdfUrl: pdfAsset.pdfUrl,
      documents: pdfAsset.pdfUrl ? [{ url: pdfAsset.pdfUrl, name: 'traffic-law-updates.pdf', publicId: pdfAsset.documents?.[0]?.publicId }] : [],
      duration: '1 hour', durationAr: 'ساعة واحدة',
      audience: 'all', price: 15, departments: [],
      instructor: instructors.anwar._id, createdAt: '2026-04-28T10:10:00',
    },
    {
      title: 'New Systems & Digital Tools for External Partners',
      titleAr: 'الأنظمة الجديدة والأدوات الرقمية',
      category: 'IT & Digital Skills', subCategory: 'New Systems Onboarding',
      description: 'A self-paced introduction to the digital systems and tools used when working with Mwasalat, built for external partners and contractors.',
      contentTypes: ['modular'],
      modules: [
        mod('System Overview', 0, [
          lesson('intro', 'Welcome & Overview', 0, { content: 'An overview of the digital systems external partners use when working with Mwasalat.' }),
          lesson('video', 'Introduction to the Ticketing System', 1, videoA.recordingLink ? { videoLink: videoA.recordingLink } : { videoPublicId: videoA.recordingVideoPublicId, videoDurationSeconds: videoA.recordingVideoDurationSeconds }),
          lesson('quiz', 'Module 1 Quiz', 2),
        ]),
        mod('Getting Hands-On', 1, [
          lesson('intro', 'Submitting Your First Request', 0, { content: 'A walkthrough of submitting and tracking a request in the system.' }),
          lesson('pdf', 'System Quick Reference Guide', 1, { fileUrl: pdfAsset.pdfUrl, fileName: 'system-quick-reference.pdf', filePublicId: pdfAsset.documents?.[0]?.publicId }),
          lesson('assignment', 'New System Walkthrough', 2),
        ]),
      ],
      duration: '2 weeks (self-paced)', durationAr: 'أسبوعان (ذاتية الوتيرة)',
      audience: 'external_only', price: 35, departments: [],
      instructor: instructors.samira._id, createdAt: '2026-05-20T11:35:00',
      quizzes: [
        { moduleIndex: 0, ...quiz([
          q('What is the main benefit of using a centralized ticketing system?', ['It\'s decorative', 'It tracks and organizes requests in one place', 'It replaces email entirely', 'It only works for IT'], 1),
          q('Before raising a new ticket, what should you check first?', ['Nothing', 'Whether a similar ticket already exists', 'Delete your account', 'Call a random colleague'], 1),
          q('Who can typically see the status of a submitted ticket?', ['No one', 'The requester and assigned support staff', 'Only the CEO', 'The public'], 1),
        ]) },
      ],
      assignment: { moduleIndex: 1, title: 'New System Walkthrough', instructions: 'Submit a short screenshot walkthrough (3-5 screenshots) showing you completing one sample task in the new system.', maxScore: 100 },
    },
    {
      title: 'Defensive Driving — Public Safety Workshop',
      titleAr: 'القيادة الدفاعية - ورشة السلامة العامة',
      category: 'Driver & Operations Training', subCategory: 'Defensive Driving / Road Safety',
      description: 'A public, instructor-led defensive driving workshop open to anyone looking to build safer driving habits on Oman\'s roads.',
      contentTypes: ['ilt'], iltVenue: 'Mwasalat Community Training Center, Muscat', iltScheduledAt: new Date('2026-09-05T09:00:00'),
      capacity: 25, requiresApproval: true,
      duration: 'Half-day workshop', durationAr: 'ورشة عمل نصف يوم',
      audience: 'all', price: 40, departments: [],
      instructor: instructors.firas._id, createdAt: '2026-06-18T09:25:00',
    },
    {
      title: 'Road Safety Awareness — Public Webinar',
      titleAr: 'التوعية بالسلامة المرورية - ندوة عامة',
      category: 'Emergency & Crisis Management', subCategory: 'Emergency Evacuation Drills',
      description: 'A free public webinar raising road safety awareness ahead of Mwasalat\'s community safety campaigns.',
      contentTypes: ['live'], liveScheduledAt: new Date('2026-09-10T17:00:00'), liveMeetingLink: 'https://zoom.us/j/9821477001', liveMeetingProvider: 'zoom',
      capacity: 200,
      duration: '1 hour (live session)', durationAr: 'ساعة واحدة (جلسة مباشرة)',
      audience: 'all', price: 0, departments: [],
      instructor: instructors.lamia._id, createdAt: '2026-07-10T14:20:00',
    },
  ];

  for (const p of PROGRAMS) {
    const existing = await MwasalatProgram.findOne({ title: p.title });
    if (existing) {
      console.log(`Skipped (already exists): ${p.title}`);
      continue; // eslint-disable-line no-continue
    }

    const { createdAt, quizzes, assignment, ...programData } = p;
    const doc = await MwasalatProgram.create(programData);

    const backdate = new Date(createdAt);
    await MwasalatProgram.collection.updateOne(
      { _id: doc._id },
      { $set: { createdAt: backdate, updatedAt: backdate } }
    );

    if (quizzes) {
      for (const qz of quizzes) {
        const moduleId = doc.modules[qz.moduleIndex]._id;
        await MwasalatQuiz.create({ program: doc._id, moduleId, questions: qz.questions, passPercentage: qz.passPercentage });
      }
    }
    if (assignment) {
      const moduleId = doc.modules[assignment.moduleIndex]._id;
      const lessonDoc = doc.modules[assignment.moduleIndex].lessons.find((l) => l.type === 'assignment');
      await MwasalatAssignment.create({ program: doc._id, moduleId, lessonId: lessonDoc._id, title: assignment.title, instructions: assignment.instructions, maxScore: assignment.maxScore });
    }

    console.log(`Created: ${p.title} (${p.contentTypes.join(',')}, audience: ${p.audience}, backdated to ${backdate.toISOString().slice(0, 10)})`);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
