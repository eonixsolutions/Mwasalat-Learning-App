import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import toast from 'react-hot-toast';
import { X, Send, Loader2, Bot, Download, Trash2 } from 'lucide-react';
import { useMwasalatAiStore } from '../../store/mwasalatAiStore.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import { mwasalatAiService } from '../../services/mwasalatAi.service.js';
import { formatAiAnswer } from '../../utils/mwasalatAiFormat.js';
import { downloadAiAnswerPdf } from '../../utils/mwasalatAiPdf.js';
import { TrendChart, HBarChart, DonutChart } from './MwasalatCharts.jsx';
import { localizeNumber } from '../../utils/mwasalatLocalize.js';

const TEAL = '#23181A';

function AiAnswerBlocks({ blocks }) {
  return blocks.map((block, i) => {
    if (block.type === 'list') {
      const Tag = block.ordered ? 'ol' : 'ul';
      return (
        <Tag key={i} className={`ps-4 space-y-1 ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
          {block.items.map((parts, j) => (
            <li key={j}>
              {parts.map((p) => (p.bold ? <strong key={p.key}>{p.text}</strong> : <span key={p.key}>{p.text}</span>))}
            </li>
          ))}
        </Tag>
      );
    }
    return (
      <p key={i}>
        {block.parts.map((p) => (p.bold ? <strong key={p.key}>{p.text}</strong> : <span key={p.key}>{p.text}</span>))}
      </p>
    );
  });
}

function AiChart({ chart }) {
  const { t, i18n } = useTranslation('mwasalatApp');
  if (!chart?.series?.length) return null;

  const formatValue = (v) => (chart.unit ? `${localizeNumber(v, i18n.language)} ${chart.unit}` : localizeNumber(v, i18n.language));

  return (
    <div className="mt-3 p-3 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0]">
      <p className="text-xs font-semibold text-[#1E293B] mb-2">{chart.title}</p>
      {chart.chartType === 'line' ? (
        <TrendChart data={chart.series.map((s) => s.value)} formatValue={formatValue} height={140} />
      ) : chart.chartType === 'donut' ? (
        <DonutChart data={chart.series} formatValue={formatValue} />
      ) : (
        <HBarChart data={chart.series} formatValue={formatValue} rowH={28} />
      )}
      <p className="sr-only">{t('charts.trendAriaLabel')}</p>
    </div>
  );
}

function AiTable({ table }) {
  if (!table?.rows?.length) return null;
  return (
    <div className="mt-3 overflow-x-auto rounded-xl border border-[#E2E8F0]">
      <table className="w-full text-xs">
        <thead className="bg-[#F1F5F9]">
          <tr>
            {(table.columns ?? []).map((col, i) => (
              <th key={i} className="px-3 py-2 text-start font-semibold text-[#1E293B] whitespace-nowrap">{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((row, i) => (
            <tr key={i} className="border-t border-[#F1F5F9]">
              {row.map((cell, j) => (
                <td key={j} className="px-3 py-2 text-[#475569] whitespace-nowrap">{cell}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function MwasalatAiPanel() {
  const { t } = useTranslation('mwasalatApp');
  const isOpen = useMwasalatAiStore((s) => s.isOpen);
  const close = useMwasalatAiStore((s) => s.close);
  const messages = useMwasalatAiStore((s) => s.messages);
  const isAsking = useMwasalatAiStore((s) => s.isAsking);
  const addMessage = useMwasalatAiStore((s) => s.addMessage);
  const setAsking = useMwasalatAiStore((s) => s.setAsking);
  const clearConversation = useMwasalatAiStore((s) => s.clearConversation);
  const getHistoryForApi = useMwasalatAiStore((s) => s.getHistoryForApi);

  const role = useMwasalatAuthStore((s) => s.user?.role) ?? 'learner';
  const [question, setQuestion] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleKey = (e) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isAsking]);

  const handleAsk = async (e) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || isAsking) return;

    const history = getHistoryForApi();
    addMessage({ _id: `local-${Date.now()}-u`, role: 'user', text: trimmed, createdAt: new Date().toISOString() });
    setQuestion('');
    setAsking(true);

    try {
      const result = await mwasalatAiService.ask({ question: trimmed, history });
      addMessage({
        _id: `local-${Date.now()}-a`,
        role: 'assistant',
        text: result.answer,
        chart: result.chart,
        table: result.table,
        toolCalls: result.toolCalls,
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      const status = err.response?.status;
      toast.error(status === 429 ? t('aiAssistant.rateLimited') : (err.response?.data?.message || t('aiAssistant.errorFallback')));
    } finally {
      setAsking(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/40" onClick={close} />

      <div className="fixed inset-y-0 end-0 w-full sm:w-[420px] bg-white flex flex-col shadow-xl z-50">
        <div className="px-5 py-4 border-b border-[#E2E8F0] flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-mwasalatInk-500 flex items-center justify-center flex-shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-semibold text-[#1E293B] truncate">{t('aiAssistant.panelTitle')}</p>
          </div>
          <div className="flex items-center gap-1 flex-shrink-0">
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearConversation}
                aria-label={t('aiAssistant.clearConversation')}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="button"
              onClick={close}
              aria-label={t('aiAssistant.close')}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[#475569] hover:bg-[#F1F5F9] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 bg-[#F8F9FB] space-y-3">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <div className="w-14 h-14 rounded-2xl bg-mwasalatInk-100 flex items-center justify-center mb-4">
                <Bot className="w-6 h-6 text-mwasalatInk-500" />
              </div>
              <p className="text-sm font-semibold text-[#1E293B] mb-1">{t('aiAssistant.panelTitle')}</p>
              <p className="text-xs text-[#94A3B8] max-w-[240px]">{t(`aiAssistant.emptyStates.${role}`)}</p>
            </div>
          ) : (
            messages.map((m) => (
              <div key={m._id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.role === 'user' ? 'text-white rounded-ee-md' : 'bg-white text-[#1E293B] rounded-es-md border border-[#E2E8F0]'
                  }`}
                  style={m.role === 'user' ? { background: TEAL } : undefined}
                >
                  {m.role === 'user' ? (
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <AiAnswerBlocks blocks={formatAiAnswer(m.text)} />
                      </div>
                      <AiChart chart={m.chart} />
                      <AiTable table={m.table} />
                      <button
                        type="button"
                        onClick={() => downloadAiAnswerPdf({ answer: m.text, chart: m.chart, table: m.table })}
                        className="mt-2 inline-flex items-center gap-1.5 text-[11px] font-medium text-mwasalatInk-500 hover:text-mwasalatInk-400 transition-colors"
                      >
                        <Download className="w-3 h-3" /> {t('aiAssistant.downloadPdf')}
                      </button>
                      {m.toolCalls?.length > 0 && (
                        <p className="mt-2 text-[10px] text-[#94A3B8] truncate">
                          {t('aiAssistant.dataSourcesUsed')}: {m.toolCalls.join(', ')}
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))
          )}
          {isAsking && (
            <div className="flex justify-start">
              <div className="px-4 py-2.5 rounded-2xl rounded-es-md bg-white border border-[#E2E8F0] flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-mwasalatInk-500" />
                <span className="text-xs text-[#94A3B8]">{t('aiAssistant.thinking')}</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleAsk} className="p-4 border-t border-[#E2E8F0] flex items-center gap-2 flex-shrink-0 bg-white">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t(`aiAssistant.placeholders.${role}`)}
            className="flex-1 px-4 py-2.5 rounded-full border border-[#E2E8F0] text-sm bg-[#F8F9FB] text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-mwasalatInk-500/20 focus:bg-white transition-colors"
          />
          <button
            type="submit"
            disabled={!question.trim() || isAsking}
            aria-label={t('aiAssistant.send')}
            className="w-10 h-10 rounded-full bg-mwasalatInk-500 hover:bg-mwasalatInk-400 disabled:opacity-50 text-white flex items-center justify-center transition-colors flex-shrink-0"
          >
            {isAsking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4 rtl:scale-x-[-1]" />}
          </button>
        </form>
      </div>
    </div>
  );
}
