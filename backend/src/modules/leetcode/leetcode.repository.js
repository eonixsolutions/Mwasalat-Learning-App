import LeetCodeProblem from './leetcode-problem.model.js';
import LeetCodeSubmission from './leetcode-submission.model.js';

// ── Problems ──────────────────────────────────────────────────────────────────

const findAllProblems = (filter = {}) =>
  LeetCodeProblem.find(filter).sort({ list: 1, order: 1 });

const findProblemById = (id) => LeetCodeProblem.findById(id);

const createProblem = (data) => LeetCodeProblem.create(data);

const updateProblemById = (id, data) =>
  LeetCodeProblem.findByIdAndUpdate(id, data, { new: true, runValidators: true });

const deleteProblemById = (id) => LeetCodeProblem.findByIdAndDelete(id);

const countProblems = (list) =>
  LeetCodeProblem.countDocuments({ isActive: true, list });

// ── Submissions ───────────────────────────────────────────────────────────────

const findStudentSubmissions = (studentId) =>
  LeetCodeSubmission.find({ student: studentId })
    .populate('problem', 'title order list topic leetcodeUrl hints')
    .sort({ createdAt: 1 });

const findSubmission = (studentId, problemId) =>
  LeetCodeSubmission.findOne({ student: studentId, problem: problemId });

const createSubmission = (data) => LeetCodeSubmission.create(data);

export const leetcodeRepository = {
  findAllProblems,
  findProblemById,
  createProblem,
  updateProblemById,
  deleteProblemById,
  countProblems,
  findStudentSubmissions,
  findSubmission,
  createSubmission,
};
