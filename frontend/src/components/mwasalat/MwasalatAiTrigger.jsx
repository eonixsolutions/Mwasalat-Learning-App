import { useTranslation } from 'react-i18next';
import { Bot } from 'lucide-react';
import { useMwasalatAiStore } from '../../store/mwasalatAiStore.js';

// Floating action button, pinned to the bottom-end corner of the viewport
// (not inline in the header) so it stays reachable from anywhere in the app.
// Hides itself while the panel is open — MwasalatAiPanel has its own close
// button, so a duplicate control at the corner would just be visual noise.
export default function MwasalatAiTrigger() {
  const { t } = useTranslation('mwasalatApp');
  const isOpen = useMwasalatAiStore((s) => s.isOpen);
  const toggleOpen = useMwasalatAiStore((s) => s.toggleOpen);

  return (
    <button
      type="button"
      onClick={toggleOpen}
      aria-label={t('aiAssistant.triggerLabel')}
      aria-expanded={isOpen}
      className={`group fixed bottom-5 end-5 sm:bottom-6 sm:end-6 z-40 w-14 h-14 rounded-full
        flex items-center justify-center overflow-visible
        bg-gradient-to-br from-mwasalatInk-400 to-mwasalatInk-500
        shadow-[0_10px_28px_rgba(35,24,26,0.4)]
        ring-1 ring-white/10
        transition-all duration-300 ease-out
        hover:scale-110 hover:shadow-[0_14px_36px_rgba(35,24,26,0.5)]
        active:scale-95
        motion-safe:animate-ai-fab-in
        ${isOpen ? 'opacity-0 scale-0 pointer-events-none' : 'opacity-100 scale-100'}`}
    >
      <span className="absolute inset-0 rounded-full motion-safe:animate-ai-glow-pulse" />
      <span className="absolute inset-0 rounded-full bg-mwasalatRed-500/0 group-hover:bg-mwasalatRed-500/10 transition-colors duration-300" />
      <Bot className="w-6 h-6 text-white relative motion-safe:animate-ai-bot-float" />
      <span className="absolute -top-0.5 -end-0.5 w-3.5 h-3.5 rounded-full bg-mwasalatRed-500 ring-2 ring-white" />
    </button>
  );
}
