import 'dotenv/config';
import mongoose from 'mongoose';
import User from '../modules/user/user.model.js';
import Student from '../modules/student/student.model.js';
import Course from '../modules/course/course.model.js';

const STUDENTS = [
  {
    name: 'Arjun Kumar',
    email: 'student@eonixsolutions.in',
    password: 'Student@1234',
    courseSlug: 'zero2code',
    currentWeek: 3,
  },
  {
    name: 'Priya Nair',
    email: 'student2@eonixsolutions.in',
    password: 'Student@1234',
    courseSlug: 'code2career',
    currentWeek: 1,
  },
];

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB\n');

  for (const s of STUDENTS) {
    const course = await Course.findOne({ slug: s.courseSlug, isActive: true })
      ?? await Course.findOne({ isActive: true });

    if (!course) {
      console.error(`No active course found for slug "${s.courseSlug}". Skipping.`);
      continue;
    }

    const existing = await User.findOne({ email: s.email });
    if (existing) {
      await Student.deleteOne({ user: existing._id });
      await User.deleteOne({ _id: existing._id });
      console.log(`Removed previous dummy student: ${s.email}`);
    }

    const user = await User.create({
      name: s.name,
      email: s.email,
      password: s.password,
      roles: ['student'],
      phone: '+919876543210',
      isEmailVerified: true,
      isActive: true,
    });

    await Student.create({
      user: user._id,
      course: course._id,
      studentStatus: 'active',
      isApproved: true,
      registrationFeePaid: true,
      currentWeek: s.currentWeek,
      educationQualification: 'Graduation In Any Stream',
      mentorshipMode: 'online',
      location: 'Kerala, India',
    });

    console.log(`✅ Created dummy student`);
    console.log(`   Name     : ${s.name}`);
    console.log(`   Email    : ${s.email}`);
    console.log(`   Password : ${s.password}`);
    console.log(`   Course   : ${course.name}`);
    console.log('');
  }

  process.exit(0);
};

run().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
