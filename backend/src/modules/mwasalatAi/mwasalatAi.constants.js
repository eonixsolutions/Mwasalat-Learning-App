// Hard cap on Gemini tool-call round-trips per question — prevents a runaway
// loop (and runaway token cost) if the model keeps requesting tools without
// ever settling on a final answer.
export const MAX_TOOL_ROUNDS = 6;

export const DEFAULT_GEMINI_MODEL = 'gemini-2.5-flash';

export const MAX_QUESTION_LENGTH = 2000;

// How many prior turns of client-held chat history are sent back to Gemini
// as context — older turns are dropped rather than rejected.
export const MAX_HISTORY_TURNS = 6;

// Every list-shaped tool result is capped at this many rows (with a `total`
// count alongside) so the model can say "showing top 50 of N" instead of
// silently implying completeness.
export const MAX_LIST_RESULTS = 50;

export const DEFAULT_QUIZ_QUESTIONS = 5;
export const MAX_QUIZ_QUESTIONS = 20;
