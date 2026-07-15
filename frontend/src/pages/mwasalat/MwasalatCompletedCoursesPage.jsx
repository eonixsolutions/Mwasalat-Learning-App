import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, GraduationCap, Compass } from 'lucide-react';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import MwasalatLearnerLayout from '../../layouts/MwasalatLearnerLayout.jsx';
import MwasalatEnrollmentCard from '../../components/mwasalat/MwasalatEnrollmentCard.jsx';

export default function MwasalatCompletedCoursesPage() {
  const [enrollments, setEnrollments] = useState([]);
  const [completion, setCompletion] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mwasalatProgramService.listMyEnrollments().then(async (e) => {
      setEnrollments(e);
      const entries = await Promise.all(
        e.map(async (enr) => [enr.program?._id, await mwasalatProgramService.getCompletionStatus(enr.program?._id)])
      );
      setCompletion(Object.fromEntries(entries));
    }).finally(() => setIsLoading(false));
  }, []);

  const completedEnrollments = enrollments.filter((e) => completion[e.program?._id]?.certificateIssued);

  return (
    <MwasalatLearnerLayout title="Completed" subtitle="Courses you've finished and certificates you've earned">
      {isLoading ? (
        <div className="p-10 flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading…
        </div>
      ) : completedEnrollments.length === 0 ? (
        <div className="card p-12 text-center max-w-md mx-auto">
          <GraduationCap className="w-10 h-10 text-mwasalatInk-400 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-[#1E293B] mb-1.5">Nothing completed yet</h2>
          <p className="text-sm text-[#475569] mb-5">Finish a course's assessment and feedback to earn your first certificate.</p>
          <Link
            to="/mwasalat/learner/dashboard"
            className="inline-flex items-center gap-2 bg-mwasalatInk-500 hover:bg-mwasalatInk-400 text-white font-semibold px-5 py-2.5 rounded-xl transition-colors text-sm"
          >
            <Compass className="w-4 h-4" /> Go to My Learning
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {completedEnrollments.map((e) => (
            <MwasalatEnrollmentCard key={e._id} enrollment={e} completion={completion[e.program?._id]} />
          ))}
        </div>
      )}
    </MwasalatLearnerLayout>
  );
}
