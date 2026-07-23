import { Type } from '@google/genai';

// Shared by every role's tool set (admin/instructor/learner) — these have no
// DB access, so mwasalatAi.service.js special-cases these two names instead
// of routing them through a role's data-tool executors.
export const RENDER_TOOL_NAMES = new Set(['renderChart', 'renderTable']);

export const RENDER_TOOL_DECLARATIONS = [
  {
    name: 'renderChart',
    description: 'Call this as your last step, before your closing text, when a chart would help illustrate your answer. Renders one chart in the chat panel.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        chartType: { type: Type.STRING, enum: ['line', 'bar', 'donut'], description: 'line for trends over time, bar for ranked comparisons, donut for category share breakdowns' },
        title: { type: Type.STRING, description: 'Short chart title' },
        series: {
          type: Type.ARRAY,
          description: 'Data points to plot',
          items: {
            type: Type.OBJECT,
            properties: { label: { type: Type.STRING }, value: { type: Type.NUMBER } },
            required: ['label', 'value'],
          },
        },
        unit: { type: Type.STRING, description: 'Optional unit label, e.g. "OMR" or "learners"' },
      },
      required: ['chartType', 'title', 'series'],
    },
  },
  {
    name: 'renderTable',
    description: 'Call this as your last step, before your closing text, when a table would help present a list of rows. Renders one table in the chat panel.',
    parameters: {
      type: Type.OBJECT,
      properties: {
        title: { type: Type.STRING, description: 'Short table title' },
        columns: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Column headers, in order' },
        rows: {
          type: Type.ARRAY,
          description: 'Table rows — each row is an array of cell values (as strings) matching the columns order',
          items: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
      },
      required: ['title', 'columns', 'rows'],
    },
  },
];
