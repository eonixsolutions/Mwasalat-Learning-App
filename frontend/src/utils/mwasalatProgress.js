// Engagement-based progress: only counts things the learner actually did.
// Enrolling isn't itself a step — it's what gets the card onto the dashboard
// in the first place — so a fresh enrollment starts at a true 0%. A course
// with no quiz doesn't get a free "quiz passed" stage either; the step count
// shrinks instead, so progress never jumps just from the course's own setup.
//
// The "content opened" step is a single value in the outer step list, but for
// a course combining multiple content types (e.g. PDF + Recording) it's the
// average of each type's own fraction, so one finished type can't stand in
// for the whole step:
//   - pdf: day fraction (pdfProgress) if the course sets a day count,
//     else a plain open/not-open flag
//   - recording: watched fraction (videoProgress.furthestSeconds / duration)
//     for an uploaded video, else a plain open/not-open flag for a pasted link
//   - live / ilt: open/not-open flag (attended or not — no partial credit)
function contentTypeFraction(c, type) {
  if (type === 'pdf' && c?.pdfProgress) {
    return Math.min(1, (c.pdfProgress.openedDays ?? 0) / (c.pdfProgress.totalDays || 1));
  }
  if (type === 'recording' && c?.videoProgress) {
    return Math.min(1, (c.videoProgress.furthestSeconds ?? 0) / (c.videoProgress.durationSeconds || 1));
  }
  return c?.openedContentTypes?.includes(type) ? 1 : 0;
}

export function stageProgress(c) {
  const contentTypes = c?.contentTypes ?? [];
  const contentStep = contentTypes.length
    ? contentTypes.reduce((sum, type) => sum + contentTypeFraction(c, type), 0) / contentTypes.length
    : (c?.contentOpened ? 1 : 0);

  const steps = [contentStep, c?.hasQuiz ? (c?.quizPassed ? 1 : 0) : null, c?.feedbackSubmitted ? 1 : 0]
    .filter((step) => step !== null);
  const done = steps.reduce((sum, step) => sum + step, 0);
  return Math.round((done / steps.length) * 100);
}
