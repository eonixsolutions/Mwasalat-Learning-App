import { studentRepository } from '../student/student.repository.js';
import Course from '../course/course.model.js';

// Called when any review passes — advances currentWeek past the gate
const unlockNextSection = async (studentId, review) => {
  const student = await studentRepository.findById(studentId.toString());
  if (!student) return;

  if (review.reviewType === 'screening') {
    const course = await Course.findById(student.course).lean();
    const screening = course?.screenings?.find(s => s.part === review.part);
    if (!screening) return;
    if (student.currentWeek === screening.afterWeek) {
      await studentRepository.updateById(studentId, { currentWeek: screening.afterWeek + 1 });
    }
  } else if (review.reviewType === 'weekly') {
    // Advance only if the student is still gated at the reviewed week
    if (student.currentWeek === review.weekNumber) {
      await studentRepository.updateById(studentId, { currentWeek: review.weekNumber + 1 });
    }
  }
};

export const progressService = { unlockNextSection };
