import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2, Trophy, Award, BookOpen, Target, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import MwasalatAdminLayout from '../../layouts/MwasalatAdminLayout.jsx';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';

function StatTile({ icon: Icon, label, value, tone, delay }) {
  return (
    <div className="card p-4 flex items-center gap-3 mwasalat-enter" style={{ animationDelay: `${delay}ms` }}>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tone.bg} ${tone.text}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-[#1E293B] leading-tight">{value}</p>
        <p className="text-xs text-[#94A3B8] truncate">{label}</p>
      </div>
    </div>
  );
}

export default function MwasalatAdminLearnerDetailPage() {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    mwasalatProgramService.getLearnerAchievements(id)
      .then(setData)
      .catch((err) => setError(err.response?.data?.message || 'Failed to load learner'))
      .finally(() => setIsLoading(false));
  }, [id]);

  return (
    <MwasalatAdminLayout
      title={data?.learner?.name ?? 'Learner'}
      subtitle={data?.learner?.email ?? 'Achievements & activity'}
    >
      <div className="max-w-5xl mx-auto">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading achievements…
          </div>
        ) : error ? (
          <div className="card p-10 text-center text-sm text-[#475569]">{error}</div>
        ) : (
          <>
            {/* Hero */}
            <div
              className="relative overflow-hidden rounded-2xl p-6 sm:p-7 mb-6"
              style={{ background: 'linear-gradient(120deg, #9C1B29 0%, #C22033 55%, #E8929C 100%)' }}
            >
              <div className="absolute -right-8 -top-10 w-44 h-44 rounded-full bg-white/10" />
              <div className="absolute right-20 -bottom-14 w-36 h-36 rounded-full bg-white/10" />
              <div className="relative flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center flex-shrink-0 stat-pop">
                  <Trophy className="w-7 h-7 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-sm font-medium">{data.learner?.name}'s Total Points</p>
                  <p className="text-3xl sm:text-4xl font-bold text-white stat-pop stat-pop-delay">{data.points}</p>
                </div>
              </div>
            </div>

            {/* Stats strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              <StatTile icon={BookOpen} label="Courses" value={data.totalCourses} tone={{ bg: 'bg-mwasalatInk-100', text: 'text-mwasalatInk-500' }} delay={0} />
              <StatTile icon={Award} label="Certificates" value={data.totalCertificates} tone={{ bg: 'bg-[#DCFCE7]', text: 'text-[#22C55E]' }} delay={60} />
              <StatTile icon={Target} label="Quiz Attempts" value={data.totalAttempts} tone={{ bg: 'bg-[#FEF3C7]', text: 'text-[#F59E0B]' }} delay={120} />
              <StatTile icon={Sparkles} label="Points" value={data.points} tone={{ bg: 'bg-mwasalatRed-100', text: 'text-mwasalatRed-600' }} delay={180} />
            </div>

            {/* Certificates */}
            <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Certificates</h2>
            {data.certificates.length === 0 ? (
              <p className="text-sm text-[#94A3B8] mb-8">No certificates earned yet.</p>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
                {data.certificates.map((c, i) => (
                  <div
                    key={c._id}
                    className="card p-5 flex items-start gap-3 mwasalat-enter"
                    style={{ animationDelay: `${i * 70}ms` }}
                  >
                    <div className="w-10 h-10 rounded-xl bg-mwasalatInk-100 flex items-center justify-center flex-shrink-0">
                      <Award className="w-5 h-5 text-mwasalatInk-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#1E293B] truncate">{c.program?.title}</p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">Issued {new Date(c.issuedAt).toLocaleDateString()}</p>
                      <p className="text-[11px] text-[#94A3B8] mt-1">{c.certificateNumber}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quiz attempt history */}
            <h2 className="text-sm font-semibold text-[#1E293B] mb-3">Assessment History</h2>
            {data.attempts.length === 0 ? (
              <p className="text-sm text-[#94A3B8]">No assessments taken yet.</p>
            ) : (
              <div className="card overflow-hidden">
                <div className="divide-y divide-[#F1F5F9]">
                  {data.attempts.map((a, i) => (
                    <div
                      key={a._id}
                      className="flex items-center gap-4 px-5 py-4 mwasalat-enter"
                      style={{ animationDelay: `${i * 40}ms`, borderLeft: `3px solid ${a.passed ? '#22C55E' : '#C22033'}` }}
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${a.passed ? 'bg-[#DCFCE7]' : 'bg-mwasalatRed-100'}`}>
                        {a.passed ? <CheckCircle2 className="w-4 h-4 text-[#22C55E]" /> : <XCircle className="w-4 h-4 text-mwasalatRed-500" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#1E293B] truncate">{a.program?.title}</p>
                        <p className="text-xs text-[#94A3B8] mt-0.5">
                          Attempt #{a.attemptNumber} · {new Date(a.attemptedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className={`text-sm font-bold ${a.passed ? 'text-[#22C55E]' : 'text-mwasalatRed-500'}`}>{a.score}%</p>
                        <p className="text-[11px] text-[#94A3B8]">{a.passed ? 'Passed' : 'Failed'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MwasalatAdminLayout>
  );
}
