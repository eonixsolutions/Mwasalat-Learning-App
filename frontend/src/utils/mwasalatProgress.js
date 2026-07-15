// Engagement-based progress: only counts things the learner actually did.
// Enrolling isn't itself a step — it's what gets the card onto the dashboard
// in the first place — so a fresh enrollment starts at a true 0%. A course
// with no quiz doesn't get a free "quiz passed" stage either; the step count
// shrinks instead, so progress never jumps just from the course's own setup.
export function stageProgress(c) {
  const steps = [Boolean(c?.contentOpened), c?.hasQuiz ? Boolean(c?.quizPassed) : null, Boolean(c?.feedbackSubmitted)]
    .filter((step) => step !== null);
  const done = steps.filter(Boolean).length;
  return Math.round((done / steps.length) * 100);
}
