import { GoogleGenAI, Type } from '@google/genai';
import { AppError } from '../../utils/AppError.js';
import logger from '../../utils/logger.js';
import { mwasalatActivityLogService } from '../mwasalatActivityLog/mwasalatActivityLog.service.js';
import { MWASALAT_ROLES } from '../mwasalatUser/mwasalatUser.constants.js';
import { ADMIN_TOOL_DECLARATIONS, ADMIN_TOOL_EXECUTORS } from './mwasalatAi.tools.js';
import { INSTRUCTOR_TOOL_DECLARATIONS, buildInstructorToolExecutors } from './mwasalatAi.instructorTools.js';
import { LEARNER_TOOL_DECLARATIONS, buildLearnerToolExecutors } from './mwasalatAi.learnerTools.js';
import { RENDER_TOOL_NAMES } from './mwasalatAi.renderTools.js';
import { MAX_TOOL_ROUNDS, DEFAULT_GEMINI_MODEL, MAX_QUESTION_LENGTH, MAX_HISTORY_TURNS, DEFAULT_QUIZ_QUESTIONS } from './mwasalatAi.constants.js';

const SHARED_RULES = `Rules:
- Any number, name, or fact about THIS PLATFORM (its learners, revenue, programs, instructors, etc.) may ONLY come from a tool result in this conversation. Never estimate, guess, or invent platform data.
- You may also answer general industry-knowledge questions (market trends, in-demand skills, emerging course topics) from your own training knowledge. Clearly frame these as general knowledge/industry insight, not platform statistics — never dress up a general-knowledge answer with invented platform numbers.
- You have no ability to send notifications, edit records, delete anything, or take any other action beyond reading data. If asked to do something like that, explain that you can only report on data, not take actions.
- Reply in the same language the question was asked in — English or Arabic. Match the question's language exactly.
- When a chart or table would make your answer clearer, call renderChart or renderTable as your last step, immediately before your closing text answer.
- Keep answers concise — a few sentences or a short list, not long essays.
- All monetary amounts are in OMR (Omani Rial).`;

const SYSTEM_INSTRUCTIONS = {
  [MWASALAT_ROLES.SUPER_ADMIN]: `You are the AI assistant inside the Mwasalat Learning Platform's super-admin dashboard. You can answer questions about platform-wide data: revenue, learners, instructors, programs, attendance, quiz results, and certificates. You can also share general industry insight — workforce/skills trends and training market demand in the transport & logistics sector — to help inform course strategy.\n\n${SHARED_RULES}`,
  [MWASALAT_ROLES.INSTRUCTOR]: `You are the AI assistant inside the Mwasalat Learning Platform's instructor dashboard. You may ONLY discuss this instructor's own programs, students, and teaching-related tasks — never other instructors' data, platform-wide financials, or admin operations. You can also share general insight on emerging course topics and in-demand skills relevant to their subject area. If asked about something outside that scope, explain that you can only help with their own courses/students plus general industry insight.\n\n${SHARED_RULES}`,
  [MWASALAT_ROLES.LEARNER]: `You are the AI assistant inside the Mwasalat Learning Platform's learner dashboard. You may ONLY discuss this learner's own courses, progress, achievements, and certificates, or help them discover available courses — never other learners' data, instructor tools, or admin/financial data. If asked about something outside that scope, explain that you can only help with their own learning.\n\n${SHARED_RULES}`,
};

const getToolConfigForRole = (actor) => {
  if (actor?.role === MWASALAT_ROLES.SUPER_ADMIN) {
    return { declarations: ADMIN_TOOL_DECLARATIONS, executors: ADMIN_TOOL_EXECUTORS };
  }
  if (actor?.role === MWASALAT_ROLES.INSTRUCTOR) {
    return { declarations: INSTRUCTOR_TOOL_DECLARATIONS, executors: buildInstructorToolExecutors(actor) };
  }
  if (actor?.role === MWASALAT_ROLES.LEARNER) {
    return { declarations: LEARNER_TOOL_DECLARATIONS, executors: buildLearnerToolExecutors(actor) };
  }
  throw new AppError('AI assistant is not available for this account', 403);
};

// Lazy singleton so a missing key fails per-request (503) instead of crashing
// the server at boot — mirrors getStripe() in mwasalatPayment.service.js.
let client;
const getClient = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new AppError('AI assistant is not configured yet. Contact support.', 503);
  }
  if (!client) client = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  return client;
};

// Drops malformed history entries instead of throwing, so a stale client-side
// store can never break the endpoint — only role 'user'/'model' with
// non-empty text survive, and only the last MAX_HISTORY_TURNS of them.
const toContents = (history, question) => {
  const trimmed = Array.isArray(history) ? history.slice(-MAX_HISTORY_TURNS) : [];
  const validTurns = trimmed.filter(
    (turn) => turn && (turn.role === 'user' || turn.role === 'model') && typeof turn.text === 'string' && turn.text.trim()
  );
  return [
    ...validTurns.map((turn) => ({ role: turn.role, parts: [{ text: turn.text }] })),
    { role: 'user', parts: [{ text: question }] },
  ];
};

const ask = async (actor, question, history) => {
  if (!question?.trim()) throw new AppError('A question is required', 400);
  if (question.length > MAX_QUESTION_LENGTH) {
    throw new AppError(`Question is too long (max ${MAX_QUESTION_LENGTH} characters)`, 400);
  }

  const { declarations, executors } = getToolConfigForRole(actor);
  const systemInstruction = SYSTEM_INSTRUCTIONS[actor.role];

  const ai = getClient();
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;
  const contents = toContents(history, question.trim());

  let pendingChart = null;
  let pendingTable = null;
  const toolCallNames = [];
  let response;

  try {
    for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
      // eslint-disable-next-line no-await-in-loop
      response = await ai.models.generateContent({
        model,
        contents,
        config: { systemInstruction, tools: [{ functionDeclarations: declarations }] },
      });

      const calls = response.functionCalls;
      if (!calls?.length) break;

      // Echo the model's own function-call turn back before our responses —
      // Gemini requires the full round-trip in `contents`, not just our reply.
      const modelContent = response.candidates?.[0]?.content;
      if (modelContent) contents.push(modelContent);

      const responseParts = [];
      // eslint-disable-next-line no-await-in-loop
      for (const call of calls) {
        toolCallNames.push(call.name);

        if (RENDER_TOOL_NAMES.has(call.name)) {
          if (call.name === 'renderChart') pendingChart = call.args;
          else pendingTable = call.args;
          responseParts.push({ functionResponse: { name: call.name, response: { rendered: true } } });
          continue;
        }

        const executor = executors[call.name];
        if (!executor) {
          responseParts.push({ functionResponse: { name: call.name, response: { error: 'Unknown tool' } } });
          continue;
        }

        try {
          // A failed tool call is fed back to the model as data (not thrown to
          // HTTP), so Gemini can explain the failure in plain language instead
          // of the whole request hard-failing.
          // eslint-disable-next-line no-await-in-loop
          const result = await executor(call.args ?? {});
          responseParts.push({ functionResponse: { name: call.name, response: { result } } });
        } catch (err) {
          const message = err instanceof AppError ? err.message : 'This lookup failed unexpectedly.';
          responseParts.push({ functionResponse: { name: call.name, response: { error: message } } });
        }
      }

      contents.push({ role: 'user', parts: responseParts });
    }
  } catch (err) {
    if (err instanceof AppError) throw err;
    logger.error(`[mwasalat-ai] Gemini request failed: ${err.message}`);
    throw new AppError('AI assistant is temporarily unavailable. Please try again shortly.', 502);
  }

  const finalText = response?.text?.trim();
  const answer = finalText || "I wasn't able to fully answer that — try asking a more specific question.";
  if (!finalText) {
    logger.warn(`[mwasalat-ai] No final text answer after ${MAX_TOOL_ROUNDS} tool rounds for question: "${question}"`);
  }

  // Fire-and-forget, same convention as mwasalatProgram.service.js — record()
  // never rejects (it catches its own logging failures internally).
  mwasalatActivityLogService.record({
    actorId: actor?._id,
    actorName: actor?.name,
    actorRole: actor?.role,
    action: 'ai_ask',
    targetType: 'MwasalatAiQuery',
    metadata: { question: question.slice(0, 500), answerPreview: answer.slice(0, 300), toolCalls: toolCallNames },
  });

  return { answer, chart: pendingChart, table: pendingTable, toolCalls: toolCallNames };
};

// Real-AI replacement for the old keyword-matching suggestFromTitle heuristic
// (still kept as the fallback — see aiAutofill in mwasalatProgram.service.js).
// Single-shot structured JSON output, no tool-calling loop needed here.
const autofillCourseDetails = async (title) => {
  const ai = getClient();
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  const response = await ai.models.generateContent({
    model,
    contents: [{
      role: 'user',
      parts: [{
        text: `Suggest a category, sub-category, and a 1-2 sentence marketing description for this staff training course title on the Mwasalat Learning Platform (a transport company's internal training LMS): "${title}".\n\nPick a category that fits a transport-company training platform — e.g. Driver & Operations Training, Health/Safety & Compliance, Customer Service, Compliance & Governance, Technical & Maintenance Staff Training, IT & Digital Skills, Leadership & Soft Skills, HR & Onboarding, Specialized & Regulatory Certifications, or Emergency & Crisis Management — or another close fit if none of those match well.`,
      }],
    }],
    config: {
      systemInstruction: 'You suggest course metadata for an internal corporate training platform. Respond only with the requested JSON.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          category: { type: Type.STRING },
          subCategory: { type: Type.STRING },
          description: { type: Type.STRING },
        },
        required: ['category', 'subCategory', 'description'],
      },
    },
  });

  const text = response.text?.trim();
  if (!text) throw new AppError('AI did not return a suggestion', 502);

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AppError('AI returned an invalid suggestion', 502);
  }
  if (!parsed.category?.trim() || !parsed.subCategory?.trim() || !parsed.description?.trim()) {
    throw new AppError('AI returned an incomplete suggestion', 502);
  }
  return parsed;
};

// Drafts multiple-choice questions from just the course title/description (no
// lesson transcript is stored in the DB) — instructor reviews/edits the draft
// in the quiz builder before saving via the existing upsertQuiz endpoint.
// Unlike autofillCourseDetails there's no keyword-heuristic fallback here, so
// callers should surface a clean error rather than degrade silently.
const generateQuizQuestions = async (title, description, numQuestions = DEFAULT_QUIZ_QUESTIONS) => {
  const ai = getClient();
  const model = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  const response = await ai.models.generateContent({
    model,
    contents: [{
      role: 'user',
      parts: [{
        text: `Write ${numQuestions} multiple-choice quiz questions to test understanding of this staff training course on the Mwasalat Learning Platform (a transport company's internal training LMS).\n\nCourse title: "${title}"\nCourse description: "${description?.trim() || 'No description provided.'}"\n\nEach question must have exactly 4 answer options with exactly one correct answer. Base every question only on what this title and description imply the course covers — do not invent specific facts, figures, or procedures that aren't implied by them.`,
      }],
    }],
    config: {
      systemInstruction: 'You write quiz questions for an internal corporate training platform. Respond only with the requested JSON.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                text: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctIndex: { type: Type.INTEGER, description: 'Zero-based index into options of the correct answer' },
              },
              required: ['text', 'options', 'correctIndex'],
            },
          },
        },
        required: ['questions'],
      },
    },
  });

  const text = response.text?.trim();
  if (!text) throw new AppError('AI did not return any questions', 502);

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new AppError('AI returned invalid quiz data', 502);
  }

  const questions = (Array.isArray(parsed.questions) ? parsed.questions : []).filter(
    (q) => q?.text?.trim() && Array.isArray(q.options) && q.options.length >= 2
      && Number.isInteger(q.correctIndex) && q.correctIndex >= 0 && q.correctIndex < q.options.length
  );
  if (!questions.length) throw new AppError('AI did not return any usable questions', 502);

  return { questions };
};

export const mwasalatAiService = { ask, autofillCourseDetails, generateQuizQuestions };
