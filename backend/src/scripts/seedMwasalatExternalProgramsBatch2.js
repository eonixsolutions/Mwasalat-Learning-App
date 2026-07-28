import 'dotenv/config';
import mongoose from 'mongoose';
import MwasalatProgram from '../modules/mwasalatProgram/mwasalatProgram.model.js';
import MwasalatUser from '../modules/mwasalatUser/mwasalatUser.model.js';
import MwasalatQuiz from '../modules/mwasalatQuiz/mwasalatQuiz.model.js';
import MwasalatAssignment from '../modules/mwasalatAssignment/mwasalatAssignment.model.js';

// Second batch of external-learner-visible programs (audience 'all' or
// 'external_only'), on top of seedMwasalatExternalPrograms.js. Same
// conventions: reuse existing Cloudinary video/pdf assets, backdate
// createdAt per instructor, fresh subcategories from
// mwasalatProgram.suggestions.js not used by the catalog yet.
// Run with:
//   npm run seed:mwasalat-external-programs-2   (from backend/)

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

  const instructorEmails = { rami: 'rami.alkharusi@mwasalat.om', dana: 'dana.alshibli@mwasalat.om', yasir: 'yasir.alismaili@mwasalat.om', farah: 'farah.alkiyumi@mwasalat.om', anwar: 'anwar.albalushi@mwasalat.om' };
  const instructors = {};
  for (const [key, email] of Object.entries(instructorEmails)) {
    const u = await MwasalatUser.findOne({ email });
    if (!u) throw new Error(`Instructor not found: ${email}`);
    instructors[key] = u;
  }

  const PROGRAMS = [
    {
      title: 'Communication Skills for Frontline Staff',
      titleAr: 'مهارات التواصل لموظفي الخط الأمامي',
      category: 'Customer Service', subCategory: 'Communication Skills (Arabic + English)',
      description: 'Builds bilingual (Arabic + English) communication skills for staff interacting directly with passengers and the public.',
      contentTypes: ['recording'], ...videoA,
      duration: '1.5 hours', durationAr: 'ساعة ونصف',
      audience: 'all', price: 18, departments: [],
      instructor: instructors.rami._id, createdAt: '2026-02-18T10:05:00',
    },
    {
      title: 'Handling Passengers with Special Needs',
      titleAr: 'التعامل مع الركاب ذوي الاحتياجات الخاصة',
      category: 'Customer Service', subCategory: 'Handling Passengers with Special Needs',
      description: 'Practical guidance for respectfully and effectively assisting passengers with special needs and accessibility requirements.',
      contentTypes: ['pdf'], pdfUrl: pdfAsset.pdfUrl,
      documents: pdfAsset.pdfUrl ? [{ url: pdfAsset.pdfUrl, name: 'special-needs-assistance.pdf', publicId: pdfAsset.documents?.[0]?.publicId }] : [],
      duration: '1 hour', durationAr: 'ساعة واحدة',
      audience: 'all', price: 12, departments: [],
      instructor: instructors.dana._id, createdAt: '2026-03-05T11:20:00',
    },
    {
      title: 'Occupational Health & Safety (OHS) Essentials',
      titleAr: 'أساسيات الصحة والسلامة المهنية',
      category: 'Health, Safety & Compliance', subCategory: 'Occupational Health & Safety (OHS)',
      description: 'A self-paced foundation in occupational health and safety principles, open to Mwasalat partners and contractors.',
      contentTypes: ['modular'],
      modules: [
        mod('Understanding OHS', 0, [
          lesson('intro', 'What is OHS?', 0, { content: 'An introduction to occupational health and safety principles and why they matter.' }),
          lesson('video', 'OHS in Practice', 1, videoA.recordingLink ? { videoLink: videoA.recordingLink } : { videoPublicId: videoA.recordingVideoPublicId, videoDurationSeconds: videoA.recordingVideoDurationSeconds }),
          lesson('quiz', 'Module 1 Quiz', 2),
        ]),
        mod('Applying OHS Practices', 1, [
          lesson('intro', 'Spotting & Reporting Hazards', 0, { content: 'How to identify and report workplace hazards before they cause harm.' }),
          lesson('pdf', 'OHS Checklist', 1, { fileUrl: pdfAsset.pdfUrl, fileName: 'ohs-checklist.pdf', filePublicId: pdfAsset.documents?.[0]?.publicId }),
          lesson('assignment', 'Workplace Hazard Spot-Check', 2),
        ]),
      ],
      duration: '2 weeks (self-paced)', durationAr: 'أسبوعان (ذاتية الوتيرة)',
      audience: 'external_only', price: 30, departments: [],
      instructor: instructors.yasir._id, createdAt: '2026-04-02T09:40:00',
      quizzes: [
        { moduleIndex: 0, ...quiz([
          q('What does OHS stand for?', ['Office Health Standards', 'Occupational Health & Safety', 'Organizational Hazard System', 'Onsite Hazard Supervision'], 1),
          q('Who is responsible for workplace safety?', ['Only management', 'Only safety officers', 'Every employee', 'No one specifically'], 2),
          q('What should you do first when you notice a workplace hazard?', ['Ignore it', 'Report it promptly', 'Fix it yourself without training', 'Wait for someone else to notice'], 1),
        ]) },
      ],
      assignment: { moduleIndex: 1, title: 'Workplace Hazard Spot-Check', instructions: 'Complete a short hazard spot-check of your own work area and submit a list of at least 3 observations with recommended actions.', maxScore: 100 },
    },
    {
      title: 'Performance Management for Managers',
      titleAr: 'إدارة الأداء للمديرين',
      category: 'Leadership & Soft Skills', subCategory: 'Performance Management for Managers',
      description: 'A live session on setting expectations, giving feedback, and managing performance effectively as a manager.',
      contentTypes: ['live'], liveScheduledAt: new Date('2026-09-15T13:00:00'), liveMeetingLink: 'https://zoom.us/j/9821488120', liveMeetingProvider: 'zoom',
      capacity: 60,
      duration: '1.5 hours (live session)', durationAr: 'ساعة ونصف (جلسة مباشرة)',
      audience: 'all', price: 25, departments: [],
      instructor: instructors.farah._id, createdAt: '2026-05-08T14:30:00',
    },
    {
      title: 'Fuel Efficiency & Eco-Driving Techniques',
      titleAr: 'تقنيات القيادة الاقتصادية وكفاءة الوقود',
      category: 'Driver & Operations Training', subCategory: 'Fuel Efficiency Driving Techniques',
      description: 'Hands-on techniques for fuel-efficient, eco-conscious driving that reduces cost and environmental impact.',
      contentTypes: ['ilt'], iltVenue: 'Mwasalat Community Training Center, Muscat', iltScheduledAt: new Date('2026-09-20T09:00:00'),
      capacity: 20, requiresApproval: true,
      duration: 'Half-day workshop', durationAr: 'ورشة عمل نصف يوم',
      audience: 'all', price: 45, departments: [],
      instructor: instructors.anwar._id, createdAt: '2026-06-02T10:15:00',
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
