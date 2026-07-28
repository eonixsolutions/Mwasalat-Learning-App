import 'dotenv/config';
import mongoose from 'mongoose';
import MwasalatDepartment from '../modules/mwasalatDepartment/mwasalatDepartment.model.js';

// One-off seed for a fresh Mwasalat database — creates the starter set of
// departments an Oman-based transport/mobility company's academy would have.
// createdAt is backdated per-department (staggered over the last ~5 months)
// so admin analytics (e.g. "departments over time") show organic growth
// instead of a single spike on the day this script was run. Run with:
//   npm run seed:mwasalat-departments   (from backend/)
const SEED_DEPARTMENTS = [
  {
    name: 'Operations',
    nameAr: 'العمليات',
    description: 'Day-to-day bus and transit operations, scheduling, and route management.',
    descriptionAr: 'العمليات اليومية للحافلات والنقل، وجدولة المسارات وإدارتها.',
    createdAt: '2026-02-08T09:14:00',
  },
  {
    name: 'Fleet & Maintenance',
    nameAr: 'الأسطول والصيانة',
    description: 'Vehicle maintenance, workshop management, and fleet reliability.',
    descriptionAr: 'صيانة المركبات وإدارة الورش وموثوقية الأسطول.',
    createdAt: '2026-02-08T09:20:00',
  },
  {
    name: 'Human Resources',
    nameAr: 'الموارد البشرية',
    description: 'Recruitment, employee relations, and workforce development.',
    descriptionAr: 'التوظيف وعلاقات الموظفين وتطوير القوى العاملة.',
    createdAt: '2026-02-15T11:02:00',
  },
  {
    name: 'Finance',
    nameAr: 'الشؤون المالية',
    description: 'Budgeting, payroll, and financial planning across the company.',
    descriptionAr: 'إعداد الميزانيات والرواتب والتخطيط المالي على مستوى الشركة.',
    createdAt: '2026-02-22T14:47:00',
  },
  {
    name: 'Information Technology',
    nameAr: 'تقنية المعلومات',
    description: 'Systems, digital platforms, and technical support for all departments.',
    descriptionAr: 'الأنظمة والمنصات الرقمية والدعم الفني لجميع الإدارات.',
    createdAt: '2026-03-10T10:05:00',
  },
  {
    name: 'Customer Experience',
    nameAr: 'تجربة العملاء',
    description: 'Passenger service standards, complaints handling, and service quality.',
    descriptionAr: 'معايير خدمة الركاب ومعالجة الشكاوى وجودة الخدمة.',
    createdAt: '2026-03-28T16:20:00',
  },
  {
    name: 'Health, Safety & Environment',
    nameAr: 'الصحة والسلامة والبيئة',
    description: 'Workplace safety standards, incident response, and environmental compliance.',
    descriptionAr: 'معايير السلامة في العمل والاستجابة للحوادث والامتثال البيئي.',
    createdAt: '2026-04-19T09:40:00',
  },
  {
    name: 'Legal & Compliance',
    nameAr: 'الشؤون القانونية والامتثال',
    description: 'Regulatory compliance, contracts, and legal affairs.',
    descriptionAr: 'الامتثال التنظيمي والعقود والشؤون القانونية.',
    createdAt: '2026-05-06T13:15:00',
  },
  {
    name: 'Marketing & Communications',
    nameAr: 'التسويق والاتصالات',
    description: 'Brand, public relations, and internal/external communications.',
    descriptionAr: 'العلامة التجارية والعلاقات العامة والاتصالات الداخلية والخارجية.',
    createdAt: '2026-05-30T10:55:00',
  },
  {
    name: 'Training & Development',
    nameAr: 'التدريب والتطوير',
    description: 'Learning programs, upskilling, and career development for staff.',
    descriptionAr: 'برامج التعلم وتطوير المهارات والمسار المهني للموظفين.',
    createdAt: '2026-06-21T15:30:00',
  },
];

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  for (const dept of SEED_DEPARTMENTS) {
    const existing = await MwasalatDepartment.findOne({ name: dept.name });
    if (existing) {
      console.log(`Skipped (already exists): ${dept.name}`);
      continue; // eslint-disable-line no-continue
    }

    const backdate = new Date(dept.createdAt);
    const created = await MwasalatDepartment.create({
      name: dept.name,
      nameAr: dept.nameAr,
      description: dept.description,
      descriptionAr: dept.descriptionAr,
      isActive: true,
    });

    // create() always stamps createdAt/updatedAt with "now". Mongoose's
    // timestamps plugin marks createdAt as `immutable: true`, so a normal
    // Model.updateOne() silently drops any change to it (even with
    // {timestamps: false}) — go through the raw collection driver instead,
    // which isn't subject to Mongoose schema casting.
    await MwasalatDepartment.collection.updateOne(
      { _id: created._id },
      { $set: { createdAt: backdate, updatedAt: backdate } }
    );

    console.log(`Created: ${dept.name} (backdated to ${backdate.toISOString().slice(0, 10)})`);
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
