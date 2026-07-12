import { leetcodeRepository } from './leetcode.repository.js';
import { AppError } from '../../utils/AppError.js';
import Student from '../student/student.model.js';
import Staff from '../staff/staff.model.js';
import { holidayRepository } from '../holiday/holiday.repository.js';
import { leaveRepository } from '../leave/leave.repository.js';
import { notifyUser } from '../notification/notification.service.js';
import { emitToUser } from '../../sockets/socket.js';

// ── Working-day calculation ───────────────────────────────────────────────────

const countWorkingDays = (startDate, endDate, holidaySet, leaveSet) => {
  let count = 0;
  const current = new Date(startDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(endDate);
  end.setHours(0, 0, 0, 0);

  while (current <= end) {
    const dow = current.getDay();
    const key = current.toISOString().split('T')[0];
    if (dow !== 0 && !holidaySet.has(key) && !leaveSet.has(key)) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
};

const getDayNumber = async (student, startDate, endDate = null) => {
  const from = new Date(startDate ?? student.enrollmentDate);
  from.setHours(0, 0, 0, 0);
  const to = new Date(endDate ?? new Date());
  to.setHours(0, 0, 0, 0);

  if (to < from) return 0;

  const branchId = student.user?.branch ?? null;
  const [holidayDocs, leaveSet] = await Promise.all([
    holidayRepository.findHolidaysInRange(from, to, branchId),
    leaveRepository.findApprovedLeaveDatesInRange(student._id, from, to),
  ]);

  const holidaySet = new Set(
    holidayDocs.map((h) => new Date(h.date).toISOString().split('T')[0])
  );
  return countWorkingDays(from, to, holidaySet, leaveSet);
};

// ── Admin: problem management ─────────────────────────────────────────────────

const getAllProblems = () => leetcodeRepository.findAllProblems();

const getProblemById = async (id) => {
  const problem = await leetcodeRepository.findProblemById(id);
  if (!problem) throw new AppError('Problem not found', 404);
  return problem;
};

const createProblem = async (data, createdBy) => {
  if (!data.order) {
    const count = await leetcodeRepository.countProblems(data.list);
    data.order = count + 1;
  }
  return leetcodeRepository.createProblem({ ...data, createdBy });
};

const updateProblem = async (id, data) => {
  const problem = await leetcodeRepository.updateProblemById(id, data);
  if (!problem) throw new AppError('Problem not found', 404);
  return problem;
};

const deleteProblem = async (id) => {
  const problem = await leetcodeRepository.deleteProblemById(id);
  if (!problem) throw new AppError('Problem not found', 404);
};

// ── Student: progress ─────────────────────────────────────────────────────────

const buildStudentProgress = async (student) => {
  const onJsList = student.leetcodeList === 'javascript';

  const dayNumber = onJsList && student.listSwitchDate
    ? await getDayNumber(student, student.listSwitchDate)
    : await getDayNumber(student, student.enrollmentDate);

  const [allProblems, submissions] = await Promise.all([
    leetcodeRepository.findAllProblems({ isActive: true }),
    leetcodeRepository.findStudentSubmissions(student._id),
  ]);

  const subMap = {};
  submissions.forEach((s) => { if (s.problem) subMap[String(s.problem._id)] = s; });

  const generalProblems = allProblems.filter((p) => p.list === 'general');
  const jsProblems      = allProblems.filter((p) => p.list === 'javascript');
  const totalGeneral    = generalProblems.length || 1;

  let todayProblem = null;
  const history = [];
  let cycleNumber = 1;

  if (onJsList) {
    todayProblem = jsProblems.find((p) => p.order === dayNumber) ?? null;

    generalProblems
      .filter((p) => p.order <= student.generalDaysCompleted)
      .forEach((p) => history.push({ ...p.toObject(), submission: subMap[String(p._id)] ?? null }));

    jsProblems
      .filter((p) => p.order < dayNumber)
      .forEach((p) => history.push({ ...p.toObject(), submission: subMap[String(p._id)] ?? null }));
  } else {
    const todayOrder = ((dayNumber - 1) % totalGeneral) + 1;
    cycleNumber      = Math.ceil(dayNumber / totalGeneral) || 1;
    todayProblem     = generalProblems.find((p) => p.order === todayOrder) ?? null;

    if (dayNumber <= totalGeneral) {
      generalProblems
        .filter((p) => p.order < dayNumber)
        .forEach((p) => history.push({ ...p.toObject(), submission: subMap[String(p._id)] ?? null }));
    } else {
      generalProblems
        .filter((p) => p.order !== todayOrder)
        .forEach((p) => history.push({ ...p.toObject(), submission: subMap[String(p._id)] ?? null }));
    }
  }

  // Auto-hold: if the last 2 consecutive assigned problems are both unsubmitted,
  // activate hold automatically. Only applies during first pass (no cycling complexity).
  if (!student.leetcodeHold && dayNumber > 2) {
    const checkable = !onJsList ? dayNumber <= totalGeneral : true;
    if (checkable) {
      const problems = onJsList ? jsProblems : generalProblems;
      const p1 = problems.find((p) => p.order === dayNumber - 1);
      const p2 = problems.find((p) => p.order === dayNumber - 2);
      if (p1 && p2 && !subMap[String(p1._id)] && !subMap[String(p2._id)]) {
        student.leetcodeHold = true;
        await student.save();
      }
    }
  }

  return {
    studentId: student._id,
    leetcodeHold: student.leetcodeHold,
    leetcodeUsername: student.leetcodeUsername ?? null,
    leetcodeList: student.leetcodeList,
    dayNumber,
    cycleNumber,
    todayProblem: todayProblem
      ? { ...todayProblem.toObject(), submission: subMap[String(todayProblem._id)] ?? null }
      : null,
    history,
  };
};

const getMyProgress = async (userId) => {
  const student = await Student.findOne({ user: userId }).populate('user', 'branch');
  if (!student) throw new AppError('Student profile not found', 404);
  return buildStudentProgress(student);
};

const getStudentProgress = async (studentId) => {
  const student = await Student.findById(studentId).populate('user', 'branch name email');
  if (!student) throw new AppError('Student not found', 404);
  return buildStudentProgress(student);
};

const submitSolution = async (userId, problemId) => {
  const student = await Student.findOne({ user: userId }).populate('user', 'name branch');
  if (!student) throw new AppError('Student profile not found', 404);

  const problem = await leetcodeRepository.findProblemById(problemId);
  if (!problem) throw new AppError('Problem not found', 404);

  const existing = await leetcodeRepository.findSubmission(student._id, problemId);
  if (existing) throw new AppError('You have already marked this problem as done', 400);

  // Calculate how many working days late the submission is
  const onJsList = student.leetcodeList === 'javascript';
  const dayNumber = onJsList && student.listSwitchDate
    ? await getDayNumber(student, student.listSwitchDate)
    : await getDayNumber(student, student.enrollmentDate);

  let assignedDayNumber;
  if (onJsList) {
    assignedDayNumber = problem.order;
  } else {
    const totalGeneral = await leetcodeRepository.countProblems('general');
    const total = totalGeneral || 1;
    const cycleOfCurrentDay = Math.ceil(dayNumber / total);
    const assignedInCurrentCycle = (cycleOfCurrentDay - 1) * total + problem.order;
    // If current-cycle's assigned day is still in the future, use the previous cycle
    assignedDayNumber = assignedInCurrentCycle <= dayNumber
      ? assignedInCurrentCycle
      : (cycleOfCurrentDay - 2) * total + problem.order;
  }

  const daysLate = Math.max(0, dayNumber - assignedDayNumber);
  const submission = await leetcodeRepository.createSubmission({
    student: student._id,
    problem: problemId,
    daysLate,
  });

  // Auto-lift hold: if hold was auto-triggered, check if the streak is now broken.
  // The hold condition is "last 2 assigned problems both unsubmitted". Re-evaluate
  // after this new submission — if broken, remove the hold automatically.
  if (student.leetcodeHold) {
    const allProblems = await leetcodeRepository.findAllProblems({ isActive: true });
    const allSubmissions = await leetcodeRepository.findStudentSubmissions(student._id);
    const subMap = {};
    allSubmissions.forEach((s) => { if (s.problem) subMap[String(s.problem._id)] = s; });

    const problems = onJsList
      ? allProblems.filter((p) => p.list === 'javascript')
      : allProblems.filter((p) => p.list === 'general');

    const p1 = problems.find((p) => p.order === dayNumber - 1);
    const p2 = problems.find((p) => p.order === dayNumber - 2);
    const stillBlocked = p1 && p2 && !subMap[String(p1._id)] && !subMap[String(p2._id)];

    if (!stillBlocked) {
      student.leetcodeHold = false;
      await student.save();
    }
  }

  // Notify batch mentors
  if (student.batch) {
    const mentors = await Staff.find({ batches: student.batch }).select('user');
    if (mentors.length) {
      const studentName = student.user?.name ?? 'A student';
      const lateLabel = daysLate === 0 ? 'on time' : `${daysLate} day${daysLate > 1 ? 's' : ''} late`;
      await Promise.all(
        mentors.map((m) =>
          notifyUser(m.user, {
            type:       'leetcode_submission',
            title:      'LeetCode Problem Marked Done',
            message:    `${studentName} marked #${problem.order} "${problem.title}" as done (${lateLabel}).`,
            data:       { submissionId: submission._id, studentId: student._id, problemId: problem._id },
            targetRole: 'technical_mentor',
          })
        )
      );
    }
  }

  return submission;
};

const switchStudentToJavaScript = async (studentId) => {
  const student = await Student.findById(studentId).populate('user', 'branch');
  if (!student) throw new AppError('Student not found', 404);
  if (student.leetcodeList === 'javascript')
    throw new AppError('Student is already on the JavaScript list', 400);

  const generalDaysCompleted = await getDayNumber(student, student.enrollmentDate);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  student.leetcodeList = 'javascript';
  student.listSwitchDate = today;
  student.generalDaysCompleted = generalDaysCompleted;
  await student.save();

  return { leetcodeList: 'javascript', generalDaysCompleted };
};

const setLeetcodeUsername = async (userId, username) => {
  const student = await Student.findOneAndUpdate(
    { user: userId },
    { leetcodeUsername: username },
    { new: true }
  );
  if (!student) throw new AppError('Student profile not found', 404);
  return { leetcodeUsername: student.leetcodeUsername };
};

// ── Staff: hold & batch overview ──────────────────────────────────────────────

const toggleHold = async (studentId) => {
  const student = await Student.findById(studentId).select('user leetcodeHold');
  if (!student) throw new AppError('Student not found', 404);
  student.leetcodeHold = !student.leetcodeHold;
  await student.save();

  // Push the change to the student's open browser tab immediately
  if (student.user) {
    emitToUser(student.user.toString(), 'leetcode_hold_update', {
      leetcodeHold: student.leetcodeHold,
    });
  }

  return { leetcodeHold: student.leetcodeHold };
};

const getBatchProgress = async (batchId, staffUserId) => {
  // Verify the requesting staff member is assigned to this batch
  const staffMember = await Staff.findOne({ user: staffUserId, batches: batchId });
  if (!staffMember) throw new AppError('You are not assigned to this batch', 403);

  // LeetCode is only for Code2Career students
  const Course = (await import('../course/course.model.js')).default;
  const code2careerCourses = await Course.find({ slug: /code2career/ }).select('_id');
  const courseIds = code2careerCourses.map((c) => c._id);

  const students = await Student.find({ batch: batchId, course: { $in: courseIds } })
    .populate('user', 'name email')
    .select('user leetcodeUsername leetcodeHold leetcodeList');

  const results = await Promise.all(
    students.map(async (student) => {
      const submissions = await leetcodeRepository.findStudentSubmissions(student._id);

      const stats = {
        submitted: submissions.length,
        onTime:    submissions.filter((s) => s.daysLate === 0).length,
        late1:     submissions.filter((s) => s.daysLate === 1).length,
        late2:     submissions.filter((s) => s.daysLate === 2).length,
        lateMore:  submissions.filter((s) => s.daysLate >= 3).length,
      };

      // Last 10 submissions sorted newest-first for the mini timeline
      const recent = [...submissions]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 10)
        .map((s) => ({
          problemId:   s.problem?._id,
          title:       s.problem?.title,
          order:       s.problem?.order,
          daysLate:    s.daysLate,
          submittedAt: s.createdAt,
        }));

      return {
        studentId:        student._id,
        name:             student.user?.name,
        email:            student.user?.email,
        leetcodeUsername: student.leetcodeUsername ?? null,
        leetcodeHold:     student.leetcodeHold,
        leetcodeList:     student.leetcodeList,
        stats,
        recent,
      };
    })
  );

  return results;
};

export const leetcodeService = {
  getAllProblems,
  getProblemById,
  createProblem,
  updateProblem,
  deleteProblem,
  getMyProgress,
  getStudentProgress,
  submitSolution,
  setLeetcodeUsername,
  switchStudentToJavaScript,
  toggleHold,
  getBatchProgress,
};
