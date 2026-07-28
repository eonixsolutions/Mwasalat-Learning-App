import 'dotenv/config';
import mongoose from 'mongoose';
import MwasalatProgram from '../modules/mwasalatProgram/mwasalatProgram.model.js';
import MwasalatCategory from '../modules/mwasalatCategory/mwasalatCategory.model.js';
import MwasalatUser from '../modules/mwasalatUser/mwasalatUser.model.js';
import MwasalatDepartment from '../modules/mwasalatDepartment/mwasalatDepartment.model.js';
import MwasalatQuiz from '../modules/mwasalatQuiz/mwasalatQuiz.model.js';
import MwasalatAssignment from '../modules/mwasalatAssignment/mwasalatAssignment.model.js';

// One-off seed: builds a real 10-program Mwasalat course catalog — one per
// category in mwasalatProgram.suggestions.js's taxonomy, spanning every
// contentType (pdf, recording, live, ilt, modular) — reusing the exact
// Cloudinary video/PDF assets already uploaded to the 4 placeholder test
// programs currently in the DB (Communication Skill / sample 2 / ample3 /
// IT). Those 4 are deleted separately by deleteMwasalatOldPrograms.js once
// this catalog is verified.
// createdAt is backdated per program (after that program's instructor's own
// createdAt), same raw-collection-driver technique as every other seed
// script in this session, since Mongoose's timestamps plugin marks
// createdAt as immutable and Model.updateOne() silently drops changes to it.
// Run with:
//   npm run seed:mwasalat-program-catalog   (from backend/)

async function extractReusableAssets() {
  const oldPrograms = await MwasalatProgram.find({});
  const videoAssets = [];
  const pdfAssets = [];

  for (const p of oldPrograms) {
    if (p.recordingLink) {
      videoAssets.push({ recordingLink: p.recordingLink });
    } else if (p.recordingVideoPublicId) {
      videoAssets.push({ recordingVideoPublicId: p.recordingVideoPublicId, recordingVideoDurationSeconds: p.recordingVideoDurationSeconds });
    }
    if (p.pdfUrl || (p.documents && p.documents.length)) {
      pdfAssets.push({ pdfUrl: p.pdfUrl, documents: p.documents });
    }
  }

  console.log(`Found ${videoAssets.length} video asset(s) and ${pdfAssets.length} pdf asset(s) across ${oldPrograms.length} existing program(s).`);

  const fallbackVideo = { recordingLink: 'https://res.cloudinary.com/demo/video/upload/sample.mp4' };
  const fallbackPdf = { pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf', documents: [] };

  const videoA = videoAssets[0] ?? fallbackVideo;
  const videoB = videoAssets[1] ?? videoAssets[0] ?? fallbackVideo;
  const pdfAsset = pdfAssets[0] ?? fallbackPdf;

  if (!videoAssets.length) console.log('WARNING: no video asset found on existing programs — using a placeholder video link.');
  if (!pdfAssets.length) console.log('WARNING: no pdf asset found on existing programs — using a placeholder pdf link.');

  return { videoA, videoB, pdfAsset };
}

const CATEGORIES = [
  {
    name: 'Driver & Operations Training', nameAr: 'تدريب السائقين والعمليات',
    subCategories: ['Defensive Driving / Road Safety', 'Vehicle Inspection & Pre-Trip Checks', 'Bus/Vehicle Maintenance Basics', 'Fuel Efficiency Driving Techniques', 'Passenger Handling & Boarding Safety', 'Route & Schedule Adherence', 'Accident/Incident Reporting Procedures', 'Fatigue Management for Drivers'],
  },
  {
    name: 'Health, Safety & Compliance', nameAr: 'الصحة والسلامة والامتثال',
    subCategories: ['Occupational Health & Safety (OHS)', 'Fire Safety & Evacuation', 'First Aid & Emergency Response', 'Hazard Identification & Risk Assessment', 'PPE Usage', 'Environmental Compliance', 'Traffic Law & Regulatory Updates (Oman)'],
  },
  {
    name: 'Customer Service', nameAr: 'خدمة العملاء',
    subCategories: ['Passenger Service Standards', 'Complaint Handling', 'Communication Skills (Arabic + English)', 'Handling Passengers with Special Needs', 'Conflict De-escalation'],
  },
  {
    name: 'Compliance & Governance', nameAr: 'الامتثال والحوكمة',
    subCategories: ['Anti-Corruption / Code of Conduct', 'Data Protection & Confidentiality', 'Anti-Harassment & Workplace Conduct', 'ISO Certification-Related Training', 'Internal Audit Awareness'],
  },
  {
    name: 'Technical & Maintenance Staff Training', nameAr: 'تدريب الفنيين وموظفي الصيانة',
    subCategories: ['Vehicle Mechanical Systems', 'Electrical/Electronic Systems in Buses', 'Workshop Safety Procedures', 'Spare Parts & Inventory Management'],
  },
  {
    name: 'IT & Digital Skills', nameAr: 'تقنية المعلومات والمهارات الرقمية',
    subCategories: ['MS Office / Digital Literacy', 'Cybersecurity Awareness', 'New Systems Onboarding'],
  },
  {
    name: 'Leadership & Soft Skills', nameAr: 'القيادة والمهارات الشخصية',
    subCategories: ['Supervisory/Management Training', 'Team Leadership', 'Time Management', 'Performance Management for Managers'],
  },
  {
    name: 'HR & Onboarding', nameAr: 'الموارد البشرية والتأهيل',
    subCategories: ['New Employee Induction/Orientation', 'HR Policies & Procedures', 'Benefits & Payroll Orientation'],
  },
  {
    name: 'Specialized & Regulatory Certifications', nameAr: 'الشهادات التخصصية والتنظيمية',
    subCategories: ['Public Transport Operator Licensing Renewal', 'CPD Tracked Courses', 'External Regulator-Mandated Training'],
  },
  {
    name: 'Emergency & Crisis Management', nameAr: 'إدارة الطوارئ والأزمات',
    subCategories: ['Business Continuity Training', 'Crisis Communication', 'Emergency Evacuation Drills'],
  },
];

async function seedCategories() {
  for (const cat of CATEGORIES) {
    const existing = await MwasalatCategory.findOne({ name: cat.name });
    if (existing) {
      console.log(`Category exists, skipped: ${cat.name}`);
      continue; // eslint-disable-line no-continue
    }
    await MwasalatCategory.create({
      name: cat.name,
      nameAr: cat.nameAr,
      subCategories: cat.subCategories.map((name) => ({ name })),
      isActive: true,
    });
    console.log(`Category created: ${cat.name}`);
  }
}

const lesson = (type, title, order, extra = {}) => ({ type, title, order, ...extra });
const mod = (title, order, lessons) => ({ title, order, lessons });

const quiz = (questions, passPercentage = 70) => ({ questions, passPercentage });
const q = (text, options, correctIndex) => ({ text, options, correctIndex });

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  const { videoA, videoB, pdfAsset } = await extractReusableAssets();
  await seedCategories();

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
    if (!u) throw new Error(`Instructor not found: ${email} — run seed:mwasalat-instructors first`);
    instructors[key] = u;
  }

  const deptNames = ['Operations', 'Health, Safety & Environment', 'Customer Experience', 'Legal & Compliance', 'Fleet & Maintenance', 'Information Technology', 'Human Resources'];
  const departments = {};
  for (const name of deptNames) {
    const d = await MwasalatDepartment.findOne({ name });
    if (!d) throw new Error(`Department not found: ${name} — run seed:mwasalat-departments first`);
    departments[name] = d;
  }

  const PROGRAMS = [
    {
      title: 'Defensive Driving & Road Safety Fundamentals',
      titleAr: 'أساسيات القيادة الدفاعية والسلامة المرورية',
      category: 'Driver & Operations Training', subCategory: 'Defensive Driving / Road Safety',
      description: 'Equip Mwasalat drivers with the defensive driving techniques and hazard-awareness habits needed to reduce road incidents. Covers braking distance, blind-spot management, and safe following distances in real operating conditions.',
      contentTypes: ['recording'], ...videoA,
      duration: '3 hours', durationAr: '3 ساعات',
      audience: 'internal_only', departments: [departments.Operations._id],
      isMandatory: true, expectedCompletionDays: 30,
      instructor: instructors.rami._id, createdAt: '2026-02-10T09:30:00',
    },
    {
      title: 'Fire Safety & Evacuation Procedures',
      titleAr: 'إجراءات السلامة من الحريق والإخلاء',
      category: 'Health, Safety & Compliance', subCategory: 'Fire Safety & Evacuation',
      description: 'Covers fire prevention, extinguisher use, and safe evacuation procedures for Mwasalat facilities and vehicles. Mandatory for all staff to maintain a safe working environment.',
      contentTypes: ['pdf'], pdfUrl: pdfAsset.pdfUrl,
      documents: pdfAsset.pdfUrl ? [{ url: pdfAsset.pdfUrl, name: 'fire-safety-evacuation.pdf', publicId: pdfAsset.documents?.[0]?.publicId }] : [],
      duration: '2 hours', durationAr: 'ساعتان',
      audience: 'internal_only', departments: [departments['Health, Safety & Environment']._id],
      isMandatory: true, expectedCompletionDays: 21, certificateValidityMonths: 12,
      instructor: instructors.dana._id, createdAt: '2026-02-25T10:15:00',
    },
    {
      title: 'Passenger Service Excellence',
      titleAr: 'التميز في خدمة الركاب',
      category: 'Customer Service', subCategory: 'Passenger Service Standards',
      description: 'Builds the communication and service skills front-line staff need to deliver a consistently excellent passenger experience, in both Arabic and English.',
      contentTypes: ['recording'], ...videoB,
      duration: '1.5 hours', durationAr: 'ساعة ونصف',
      audience: 'all', price: 20, departments: [departments['Customer Experience']._id],
      instructor: instructors.yasir._id, createdAt: '2026-03-18T11:00:00',
    },
    {
      title: 'Anti-Corruption & Code of Conduct',
      titleAr: 'مكافحة الفساد ومدونة السلوك',
      category: 'Compliance & Governance', subCategory: 'Anti-Corruption / Code of Conduct',
      description: 'Explains Mwasalat\'s code of conduct and anti-corruption policy, including how to identify and report conflicts of interest. Required reading for every employee.',
      contentTypes: ['pdf'], pdfUrl: pdfAsset.pdfUrl,
      documents: pdfAsset.pdfUrl ? [{ url: pdfAsset.pdfUrl, name: 'code-of-conduct.pdf', publicId: pdfAsset.documents?.[0]?.publicId }] : [],
      duration: '1 hour', durationAr: 'ساعة واحدة',
      audience: 'internal_only', departments: [departments['Legal & Compliance']._id],
      isMandatory: true, expectedCompletionDays: 14, certificateValidityMonths: 12,
      instructor: instructors.farah._id, createdAt: '2026-04-10T13:45:00',
    },
    {
      title: 'Vehicle Mechanical Systems Fundamentals',
      titleAr: 'أساسيات الأنظمة الميكانيكية للمركبات',
      category: 'Technical & Maintenance Staff Training', subCategory: 'Vehicle Mechanical Systems',
      description: 'A hands-on workshop covering the core mechanical systems of Mwasalat\'s fleet, for technical and maintenance staff building foundational diagnostic skills.',
      contentTypes: ['ilt'], iltVenue: 'Mwasalat Central Workshop, Muscat', iltScheduledAt: new Date('2026-08-06T09:00:00'),
      capacity: 20, requiresApproval: true,
      duration: '1 day workshop', durationAr: 'ورشة عمل ليوم واحد',
      audience: 'internal_only', departments: [departments['Fleet & Maintenance']._id],
      instructor: instructors.anwar._id, createdAt: '2026-05-02T09:50:00',
    },
    {
      title: 'MS Office & Digital Literacy Essentials',
      titleAr: 'أساسيات مايكروسوفت أوفيس والمهارات الرقمية',
      category: 'IT & Digital Skills', subCategory: 'MS Office / Digital Literacy',
      description: 'A self-paced introduction to Microsoft Office and everyday digital tools used across Mwasalat, from spreadsheets to document formatting.',
      contentTypes: ['modular'],
      modules: [
        mod('Getting Started', 0, [
          lesson('intro', 'Welcome & Course Overview', 0, { content: 'Welcome to MS Office & Digital Literacy Essentials — a self-paced course covering the everyday digital tools you\'ll use at Mwasalat.' }),
          lesson('video', 'Introduction to MS Office', 1, videoA.recordingLink ? { videoLink: videoA.recordingLink } : { videoPublicId: videoA.recordingVideoPublicId, videoDurationSeconds: videoA.recordingVideoDurationSeconds }),
          lesson('quiz', 'Module 1 Quiz', 2),
        ]),
        mod('Excel & Word Fundamentals', 1, [
          lesson('intro', 'Working with Documents & Spreadsheets', 0, { content: 'This module covers the core features of Excel and Word you\'ll use day to day.' }),
          lesson('pdf', 'Excel & Word Quick Reference Guide', 1, { fileUrl: pdfAsset.pdfUrl, fileName: 'excel-word-reference.pdf', filePublicId: pdfAsset.documents?.[0]?.publicId }),
          lesson('video', 'Excel Formulas Walkthrough', 2, videoB.recordingLink ? { videoLink: videoB.recordingLink } : { videoPublicId: videoB.recordingVideoPublicId, videoDurationSeconds: videoB.recordingVideoDurationSeconds }),
          lesson('quiz', 'Module 2 Quiz', 3),
        ]),
        mod('Putting It Into Practice', 2, [
          lesson('intro', 'Final Practical Exercise', 0, { content: 'Apply what you\'ve learned in a short hands-on exercise.' }),
          lesson('assignment', 'MS Office Practical Exercise', 1),
        ]),
      ],
      duration: '4 weeks (self-paced)', durationAr: '4 أسابيع (ذاتية الوتيرة)',
      audience: 'internal_only', departments: [departments['Information Technology']._id],
      instructor: instructors.samira._id, createdAt: '2026-05-25T10:20:00',
      quizzes: [
        { moduleIndex: 0, ...quiz([
          q('Which Microsoft Office application is best suited for creating a budget spreadsheet?', ['Word', 'Excel', 'PowerPoint', 'Outlook'], 1),
          q('What is the keyboard shortcut to save a document in most Office applications?', ['Ctrl+S', 'Ctrl+P', 'Ctrl+N', 'Ctrl+Z'], 0),
          q('Which file format is commonly used to share a read-only version of an Office document?', ['.docx', '.pdf', '.exe', '.zip'], 1),
        ]) },
        { moduleIndex: 1, ...quiz([
          q('In Excel, which symbol must you type first to start a formula?', ['#', '=', '@', '$'], 1),
          q('What does the SUM function do in Excel?', ['Counts cells', 'Adds up a range of numbers', 'Sorts data', 'Formats text'], 1),
          q('In Word, which feature helps you automatically generate a table of contents?', ['Mail Merge', 'Styles & Headings', 'Track Changes', 'Watermark'], 1),
        ]) },
      ],
      assignment: { moduleIndex: 2, title: 'MS Office Practical Exercise', instructions: 'Create a simple budget spreadsheet in Excel using at least one SUM formula, and a one-page Word document summarizing it. Submit both files.', maxScore: 100 },
    },
    {
      title: 'Supervisory & Team Leadership Skills',
      titleAr: 'مهارات الإشراف وقيادة الفريق',
      category: 'Leadership & Soft Skills', subCategory: 'Team Leadership',
      description: 'Develops the leadership, delegation, and performance-management skills new and existing supervisors need to lead their teams effectively.',
      contentTypes: ['modular'],
      modules: [
        mod('Foundations of Leadership', 0, [
          lesson('intro', 'What Makes a Good Supervisor', 0, { content: 'An overview of core leadership principles for first-time and experienced supervisors alike.' }),
          lesson('video', 'Leadership Styles Explained', 1, videoA.recordingLink ? { videoLink: videoA.recordingLink } : { videoPublicId: videoA.recordingVideoPublicId, videoDurationSeconds: videoA.recordingVideoDurationSeconds }),
          lesson('quiz', 'Module 1 Quiz', 2),
        ]),
        mod('Managing Performance', 1, [
          lesson('intro', 'Setting Expectations & Giving Feedback', 0, { content: 'How to set clear expectations and deliver feedback that actually improves performance.' }),
          lesson('pdf', 'Performance Review Toolkit', 1, { fileUrl: pdfAsset.pdfUrl, fileName: 'performance-review-toolkit.pdf', filePublicId: pdfAsset.documents?.[0]?.publicId }),
          lesson('quiz', 'Module 2 Quiz', 2),
        ]),
        mod('Leading Through Change', 2, [
          lesson('intro', 'Change Management Basics', 0, { content: 'Practical techniques for leading a team through operational or organizational change.' }),
          lesson('video', 'Case Study: Leading a Team Through Change', 1, videoB.recordingLink ? { videoLink: videoB.recordingLink } : { videoPublicId: videoB.recordingVideoPublicId, videoDurationSeconds: videoB.recordingVideoDurationSeconds }),
          lesson('assignment', 'Change Management Action Plan', 2),
        ]),
      ],
      duration: '3 weeks (self-paced)', durationAr: '3 أسابيع (ذاتية الوتيرة)',
      audience: 'internal_only', departments: [],
      instructor: instructors.firas._id, createdAt: '2026-06-20T11:40:00',
      quizzes: [
        { moduleIndex: 0, ...quiz([
          q('Which leadership style involves making decisions with input from the team before deciding?', ['Autocratic', 'Democratic', 'Laissez-faire', 'Bureaucratic'], 1),
          q('What is the first step in delegating a task effectively?', ['Ignoring the outcome', 'Clearly defining the expected outcome', 'Doing it yourself', 'Skipping instructions'], 1),
          q('Why is active listening important for a supervisor?', ['It wastes time', 'It builds trust and understanding', 'It is not necessary', 'It slows down decisions'], 1),
        ]) },
        { moduleIndex: 1, ...quiz([
          q('What should a performance review always include?', ['Only criticism', 'Specific, actionable feedback', 'Vague comments', 'Personal opinions unrelated to work'], 1),
          q('How often should a supervisor ideally check in with direct reports on progress?', ['Never', 'Only once a year', 'Regularly, e.g. weekly or biweekly', 'Only when there\'s a problem'], 2),
          q('What is a SMART goal?', ['A goal with no deadline', 'Specific, Measurable, Achievable, Relevant, Time-bound', 'A vague wish', 'A goal set without the employee'], 1),
        ]) },
      ],
      assignment: { moduleIndex: 2, title: 'Change Management Action Plan', instructions: 'Write a one-page action plan for leading your team through an upcoming operational change, covering communication, timeline, and risk mitigation.', maxScore: 100 },
    },
    {
      title: 'New Employee Induction & Onboarding Journey',
      titleAr: 'رحلة تأهيل الموظف الجديد',
      category: 'HR & Onboarding', subCategory: 'New Employee Induction/Orientation',
      description: 'A guided first-30-days journey for every new Mwasalat employee, covering company policies, culture, and what to expect in your first month.',
      contentTypes: ['modular'],
      modules: [
        mod('Welcome to Mwasalat', 0, [
          lesson('intro', 'Welcome Message', 0, { content: 'A warm welcome to Mwasalat and an overview of what this onboarding journey covers.' }),
          lesson('video', 'About Mwasalat', 1, videoA.recordingLink ? { videoLink: videoA.recordingLink } : { videoPublicId: videoA.recordingVideoPublicId, videoDurationSeconds: videoA.recordingVideoDurationSeconds }),
          lesson('quiz', 'Module 1 Quiz', 2),
        ]),
        mod('Policies & Procedures', 1, [
          lesson('intro', 'Key HR Policies', 0, { content: 'A summary of the HR policies every employee should know from day one.' }),
          lesson('pdf', 'Employee Handbook', 1, { fileUrl: pdfAsset.pdfUrl, fileName: 'employee-handbook.pdf', filePublicId: pdfAsset.documents?.[0]?.publicId }),
          lesson('quiz', 'Module 2 Quiz', 2),
        ]),
        mod('Your First 30 Days', 2, [
          lesson('intro', 'Settling In', 0, { content: 'What to expect and complete during your first 30 days at Mwasalat.' }),
          lesson('assignment', '30-Day Onboarding Checklist', 1),
        ]),
      ],
      duration: '2 weeks (self-paced)', durationAr: 'أسبوعان (ذاتية الوتيرة)',
      audience: 'internal_only', departments: [departments['Human Resources']._id],
      isMandatory: true, expectedCompletionDays: 7,
      instructor: instructors.lamia._id, createdAt: '2026-07-14T15:05:00',
      quizzes: [
        { moduleIndex: 0, ...quiz([
          q('Who approves a new employee\'s department assignment at Mwasalat?', ['The employee themselves', 'The department admin/HR', 'A random colleague', 'No approval needed'], 1),
          q('What is the first thing a new employee should do on their first day?', ['Skip orientation', 'Complete the induction module', 'Ignore the handbook', 'Request time off'], 1),
          q('Where can employees find Mwasalat\'s official policies?', ['Social media', 'The HR policies module/handbook', 'A colleague\'s notes', 'Nowhere, they\'re verbal only'], 1),
        ]) },
        { moduleIndex: 1, ...quiz([
          q('What should you do if you\'re unsure about a company policy?', ['Guess', 'Ask your supervisor or HR', 'Ignore it', 'Assume it doesn\'t apply to you'], 1),
          q('How often are Mwasalat\'s HR policies reviewed and updated?', ['Never', 'Periodically, as needed', 'Only once', 'Randomly'], 1),
          q('What is the purpose of the Code of Conduct?', ['To restrict employees unfairly', 'To set clear expectations for professional behavior', 'It has no purpose', 'Only for managers'], 1),
        ]) },
      ],
      assignment: { moduleIndex: 2, title: '30-Day Onboarding Checklist', instructions: 'Complete and submit your first-30-days onboarding checklist, confirming you\'ve met your supervisor, reviewed key policies, and completed required inductions.', maxScore: 100 },
    },
    {
      title: 'Public Transport Operator Licensing Renewal',
      titleAr: 'تجديد ترخيص مشغل النقل العام',
      category: 'Specialized & Regulatory Certifications', subCategory: 'Public Transport Operator Licensing Renewal',
      description: 'A live regulatory session preparing operators for their public transport operator license renewal, in line with PALT requirements.',
      contentTypes: ['live'], liveScheduledAt: new Date('2026-08-12T11:00:00'), liveMeetingLink: 'https://zoom.us/j/9821345670', liveMeetingProvider: 'zoom',
      capacity: 100, requiresApproval: true, certificateValidityMonths: 12,
      duration: '2 hours (live session)', durationAr: 'ساعتان (جلسة مباشرة)',
      audience: 'internal_only', departments: [departments.Operations._id],
      instructor: instructors.rami._id, createdAt: '2026-06-05T10:30:00',
    },
    {
      title: 'Emergency Evacuation Drill Briefing',
      titleAr: 'إحاطة تدريب الإخلاء في حالات الطوارئ',
      category: 'Emergency & Crisis Management', subCategory: 'Emergency Evacuation Drills',
      description: 'A live briefing on Mwasalat\'s emergency evacuation procedures, open to all staff ahead of scheduled evacuation drills.',
      contentTypes: ['live'], liveScheduledAt: new Date('2026-08-19T14:00:00'), liveMeetingLink: 'https://zoom.us/j/9821398765', liveMeetingProvider: 'zoom',
      capacity: 150,
      duration: '1 hour (live session)', durationAr: 'ساعة واحدة (جلسة مباشرة)',
      audience: 'all', departments: [],
      instructor: instructors.dana._id, createdAt: '2026-06-25T13:15:00',
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
