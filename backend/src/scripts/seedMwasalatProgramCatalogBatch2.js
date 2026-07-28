import 'dotenv/config';
import mongoose from 'mongoose';
import MwasalatProgram from '../modules/mwasalatProgram/mwasalatProgram.model.js';
import MwasalatUser from '../modules/mwasalatUser/mwasalatUser.model.js';
import MwasalatDepartment from '../modules/mwasalatDepartment/mwasalatDepartment.model.js';
import MwasalatQuiz from '../modules/mwasalatQuiz/mwasalatQuiz.model.js';
import MwasalatAssignment from '../modules/mwasalatAssignment/mwasalatAssignment.model.js';

// Second batch on top of seedMwasalatProgramCatalog.js — one more program per
// existing category (10 -> 20 total), same 5 content types, reusing the same
// 2 video assets + 1 pdf asset (now read off the *current* 10 real programs,
// since the original 4 placeholder programs that first carried them were
// already deleted by deleteMwasalatOldPrograms.js).
// createdAt is spread across new dates — some filling gaps between the first
// batch's dates, a couple landing just a few days before "today" — so
// dashboard charts that bucket by date (revenue/signups/etc. feed off
// enrollments, but the Delivery Type chart counts programs directly) show a
// richer, more active-looking history instead of one flat batch.
// Run with:
//   npm run seed:mwasalat-program-catalog-2   (from backend/)

async function extractReusableAssets() {
  const existingPrograms = await MwasalatProgram.find({});
  const videoAssets = [];
  const pdfAssets = [];

  for (const p of existingPrograms) {
    if (p.recordingLink) {
      videoAssets.push({ recordingLink: p.recordingLink });
    } else if (p.recordingVideoPublicId) {
      videoAssets.push({ recordingVideoPublicId: p.recordingVideoPublicId, recordingVideoDurationSeconds: p.recordingVideoDurationSeconds });
    }
    if (p.pdfUrl || (p.documents && p.documents.length)) {
      pdfAssets.push({ pdfUrl: p.pdfUrl, documents: p.documents });
    }
  }

  console.log(`Found ${videoAssets.length} video asset(s) and ${pdfAssets.length} pdf asset(s) across ${existingPrograms.length} existing program(s).`);

  const fallbackVideo = { recordingLink: 'https://res.cloudinary.com/demo/video/upload/sample.mp4' };
  const fallbackPdf = { pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', documents: [] };

  const videoA = videoAssets[0] ?? fallbackVideo;
  const videoB = videoAssets[1] ?? videoAssets[0] ?? fallbackVideo;
  const pdfAsset = pdfAssets[0] ?? fallbackPdf;

  return { videoA, videoB, pdfAsset };
}

const lesson = (type, title, order, extra = {}) => ({ type, title, order, ...extra });
const mod = (title, order, lessons) => ({ title, order, lessons });
const quiz = (questions, passPercentage = 70) => ({ questions, passPercentage });
const q = (text, options, correctIndex) => ({ text, options, correctIndex });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const { videoA, videoB, pdfAsset } = await extractReusableAssets();

  const instructorEmails = {
    rami: 'rami.alkharusi@mwasalat.om',
    dana: 'dana.alshibli@mwasalat.om',
    yasir: 'yasir.alismaili@mwasalat.om',
    farah: 'farah.alkiyumi@mwasalat.om',
    anwar: 'anwar.albalushi@mwasalat.om',
    samira: 'samira.alzadjali@mwasalat.om',
    firas: 'firas.almukhaini@mwasalat.om',
    lamia: 'lamia.alajmi@mwasalat.om',
  };
  const instructors = {};
  for (const [key, email] of Object.entries(instructorEmails)) {
    const u = await MwasalatUser.findOne({ email });
    if (!u) throw new Error(`Instructor not found: ${email}`);
    instructors[key] = u;
  }

  const deptNames = ['Operations', 'Health, Safety & Environment', 'Customer Experience', 'Legal & Compliance', 'Fleet & Maintenance', 'Information Technology', 'Human Resources'];
  const departments = {};
  for (const name of deptNames) {
    const d = await MwasalatDepartment.findOne({ name });
    if (!d) throw new Error(`Department not found: ${name}`);
    departments[name] = d;
  }

  const PROGRAMS = [
    {
      title: 'Vehicle Inspection & Pre-Trip Checks',
      titleAr: 'فحص المركبات والفحوصات قبل الرحلة',
      category: 'Driver & Operations Training', subCategory: 'Vehicle Inspection & Pre-Trip Checks',
      description: 'Practical training on daily vehicle inspection and pre-trip check procedures to catch issues before they become incidents on the road.',
      contentTypes: ['recording'], ...videoA,
      duration: '2 hours', durationAr: 'ساعتان',
      audience: 'internal_only', departments: [departments.Operations._id],
      isMandatory: true, expectedCompletionDays: 21,
      instructor: instructors.yasir._id, createdAt: '2026-03-10T09:20:00',
    },
    {
      title: 'First Aid & Emergency Response Basics',
      titleAr: 'أساسيات الإسعافات الأولية والاستجابة للطوارئ',
      category: 'Health, Safety & Compliance', subCategory: 'First Aid & Emergency Response',
      description: 'Core first aid and emergency response skills every Mwasalat employee should know, from basic wound care to responding to a medical emergency on site.',
      contentTypes: ['pdf'], pdfUrl: pdfAsset.pdfUrl,
      documents: pdfAsset.pdfUrl ? [{ url: pdfAsset.pdfUrl, name: 'first-aid-basics.pdf', publicId: pdfAsset.documents?.[0]?.publicId }] : [],
      duration: '2 hours', durationAr: 'ساعتان',
      audience: 'internal_only', departments: [departments['Health, Safety & Environment']._id],
      isMandatory: true, expectedCompletionDays: 21, certificateValidityMonths: 12,
      instructor: instructors.farah._id, createdAt: '2026-03-30T10:40:00',
    },
    {
      title: 'Complaint Handling & De-escalation',
      titleAr: 'معالجة الشكاوى وتهدئة المواقف',
      category: 'Customer Service', subCategory: 'Conflict De-escalation',
      description: 'Techniques for handling passenger complaints calmly and professionally, and de-escalating tense situations before they escalate further.',
      contentTypes: ['recording'], ...videoB,
      duration: '1.5 hours', durationAr: 'ساعة ونصف',
      audience: 'all', price: 15, departments: [departments['Customer Experience']._id],
      instructor: instructors.anwar._id, createdAt: '2026-04-22T11:15:00',
    },
    {
      title: 'Data Protection & Confidentiality Essentials',
      titleAr: 'أساسيات حماية البيانات والسرية',
      category: 'Compliance & Governance', subCategory: 'Data Protection & Confidentiality',
      description: 'Covers how Mwasalat handles personal and confidential data, and what every employee must do to keep it protected.',
      contentTypes: ['pdf'], pdfUrl: pdfAsset.pdfUrl,
      documents: pdfAsset.pdfUrl ? [{ url: pdfAsset.pdfUrl, name: 'data-protection-essentials.pdf', publicId: pdfAsset.documents?.[0]?.publicId }] : [],
      duration: '1 hour', durationAr: 'ساعة واحدة',
      audience: 'internal_only', departments: [departments['Legal & Compliance']._id],
      isMandatory: true, expectedCompletionDays: 14,
      instructor: instructors.samira._id, createdAt: '2026-05-15T13:30:00',
    },
    {
      title: 'Workshop Safety Procedures',
      titleAr: 'إجراءات السلامة في الورشة',
      category: 'Technical & Maintenance Staff Training', subCategory: 'Workshop Safety Procedures',
      description: 'Hands-on workshop covering safe tool use, hazard controls, and housekeeping standards for Mwasalat\'s maintenance workshops.',
      contentTypes: ['ilt'], iltVenue: 'Mwasalat Central Workshop, Muscat', iltScheduledAt: new Date('2026-08-22T09:00:00'),
      capacity: 15,
      duration: 'Half-day workshop', durationAr: 'ورشة عمل نصف يوم',
      audience: 'internal_only', departments: [departments['Fleet & Maintenance']._id],
      instructor: instructors.firas._id, createdAt: '2026-06-14T09:10:00',
    },
    {
      title: 'Cybersecurity Awareness Fundamentals',
      titleAr: 'أساسيات التوعية بالأمن السيبراني',
      category: 'IT & Digital Skills', subCategory: 'Cybersecurity Awareness',
      description: 'A self-paced introduction to spotting phishing attempts, using strong passwords, and staying safe online at work.',
      contentTypes: ['modular'],
      modules: [
        mod('Recognizing Threats', 0, [
          lesson('intro', 'Why Cybersecurity Matters', 0, { content: 'An introduction to the everyday cyber threats Mwasalat staff should watch for.' }),
          lesson('video', 'Spotting Phishing Emails', 1, videoA.recordingLink ? { videoLink: videoA.recordingLink } : { videoPublicId: videoA.recordingVideoPublicId, videoDurationSeconds: videoA.recordingVideoDurationSeconds }),
          lesson('quiz', 'Module 1 Quiz', 2),
        ]),
        mod('Staying Safe Online', 1, [
          lesson('intro', 'Passwords & Safe Browsing', 0, { content: 'Practical habits for strong passwords and safe browsing at work.' }),
          lesson('pdf', 'Cybersecurity Quick Reference', 1, { fileUrl: pdfAsset.pdfUrl, fileName: 'cybersecurity-reference.pdf', filePublicId: pdfAsset.documents?.[0]?.publicId }),
          lesson('assignment', 'Phishing Awareness Report', 2),
        ]),
      ],
      duration: '2 weeks (self-paced)', durationAr: 'أسبوعان (ذاتية الوتيرة)',
      audience: 'internal_only', departments: [departments['Information Technology']._id],
      instructor: instructors.lamia._id, createdAt: '2026-07-08T10:00:00',
      quizzes: [
        { moduleIndex: 0, ...quiz([
          q('What is phishing?', ['A type of computer virus', 'A fraudulent attempt to obtain sensitive information', 'A software update', 'A firewall setting'], 1),
          q('Which of these is a sign of a phishing email?', ['Urgent request + suspicious link', 'Comes from a known colleague', 'Has no attachments', 'Is written in plain text'], 0),
          q('What should you do with a suspicious email?', ['Click the link to check it', 'Reply with your password', 'Report it to IT/Cybersecurity', 'Forward it to friends'], 2),
        ]) },
      ],
      assignment: { moduleIndex: 1, title: 'Phishing Awareness Report', instructions: 'Review the sample email provided in class and write a short report identifying at least 3 phishing red flags you noticed.', maxScore: 100 },
    },
    {
      title: 'Time Management for Supervisors',
      titleAr: 'إدارة الوقت للمشرفين',
      category: 'Leadership & Soft Skills', subCategory: 'Time Management',
      description: 'Practical time-management techniques, including the Eisenhower matrix, to help supervisors prioritize effectively.',
      contentTypes: ['modular'],
      modules: [
        mod('Prioritization Basics', 0, [
          lesson('intro', 'Why Time Management Matters', 0, { content: 'An introduction to prioritization frameworks supervisors can apply immediately.' }),
          lesson('video', 'The Eisenhower Matrix Explained', 1, videoB.recordingLink ? { videoLink: videoB.recordingLink } : { videoPublicId: videoB.recordingVideoPublicId, videoDurationSeconds: videoB.recordingVideoDurationSeconds }),
          lesson('quiz', 'Module 1 Quiz', 2),
        ]),
        mod('Building Better Habits', 1, [
          lesson('intro', 'Turning Theory Into Habits', 0, { content: 'How to turn prioritization theory into a repeatable weekly routine.' }),
          lesson('pdf', 'Weekly Planning Template', 1, { fileUrl: pdfAsset.pdfUrl, fileName: 'weekly-planning-template.pdf', filePublicId: pdfAsset.documents?.[0]?.publicId }),
          lesson('assignment', 'Weekly Schedule Exercise', 2),
        ]),
      ],
      duration: '2 weeks (self-paced)', durationAr: 'أسبوعان (ذاتية الوتيرة)',
      audience: 'internal_only', departments: [],
      instructor: instructors.rami._id, createdAt: '2026-01-28T14:00:00',
      quizzes: [
        { moduleIndex: 0, ...quiz([
          q('What does the Eisenhower Matrix help you prioritize by?', ['Alphabetical order', 'Urgency and importance', 'Who asked first', 'Task length'], 1),
          q('Which is an example of an "urgent but not important" task?', ['Strategic planning', 'Most interruptions/some emails', 'Long-term career development', 'Exercise'], 1),
          q('What is a common cause of poor time management?', ['Setting clear goals', 'Failing to prioritize tasks', 'Delegating effectively', 'Using a calendar'], 1),
        ]) },
      ],
      assignment: { moduleIndex: 1, title: 'Weekly Schedule Exercise', instructions: 'Submit a personal weekly schedule that applies the Eisenhower matrix to prioritize your top 5 tasks for the week.', maxScore: 100 },
    },
    {
      title: 'HR Policies & Procedures Refresher',
      titleAr: 'مراجعة سياسات وإجراءات الموارد البشرية',
      category: 'HR & Onboarding', subCategory: 'HR Policies & Procedures',
      description: 'A refresher on Mwasalat\'s core HR policies and procedures, for employees who completed induction a while ago.',
      contentTypes: ['pdf'], pdfUrl: pdfAsset.pdfUrl,
      documents: pdfAsset.pdfUrl ? [{ url: pdfAsset.pdfUrl, name: 'hr-policies-refresher.pdf', publicId: pdfAsset.documents?.[0]?.publicId }] : [],
      duration: '45 minutes', durationAr: '45 دقيقة',
      audience: 'internal_only', departments: [departments['Human Resources']._id],
      instructor: instructors.dana._id, createdAt: '2026-07-20T11:25:00',
    },
    {
      title: 'CPD Tracked Professional Development',
      titleAr: 'التطوير المهني المستمر (CPD)',
      category: 'Specialized & Regulatory Certifications', subCategory: 'CPD Tracked Courses',
      description: 'A live session for staff pursuing Continuing Professional Development (CPD) tracked training hours.',
      contentTypes: ['live'], liveScheduledAt: new Date('2026-08-28T10:00:00'), liveMeetingLink: 'https://zoom.us/j/9821412233', liveMeetingProvider: 'zoom',
      capacity: 80, certificateValidityMonths: 24,
      duration: '2 hours (live session)', durationAr: 'ساعتان (جلسة مباشرة)',
      audience: 'internal_only', departments: [],
      instructor: instructors.yasir._id, createdAt: '2026-07-23T09:45:00',
    },
    {
      title: 'Business Continuity Planning Workshop',
      titleAr: 'ورشة عمل التخطيط لاستمرارية الأعمال',
      category: 'Emergency & Crisis Management', subCategory: 'Business Continuity Training',
      description: 'A workshop on Mwasalat\'s business continuity plan, preparing key staff to keep operations running through a disruption.',
      contentTypes: ['ilt'], iltVenue: 'Mwasalat Head Office, Muscat', iltScheduledAt: new Date('2026-09-02T09:30:00'),
      capacity: 30, requiresApproval: true,
      duration: 'Half-day workshop', durationAr: 'ورشة عمل نصف يوم',
      audience: 'internal_only', departments: [],
      instructor: instructors.farah._id, createdAt: '2026-07-25T14:50:00',
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
    // Mongoose marks createdAt as immutable (via the timestamps plugin), so
    // Model.updateOne() silently drops changes to it — use the raw
    // collection driver, which bypasses Mongoose schema casting.
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

    console.log(`Created: ${p.title} (${p.contentTypes.join(',')}, backdated to ${backdate.toISOString().slice(0, 10)})`);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
