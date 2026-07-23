import { useTranslation } from 'react-i18next';
import { Bot } from 'lucide-react';
import { useMwasalatAiStore } from '../../store/mwasalatAiStore.js';

// See MwasalatNotificationBell for the same dark/light header split.
const TRIGGER_THEME_CLASSES = {
  dark: 'text-white/80 hover:bg-white/10 hover:text-white',
  light: 'text-[#475569] hover:bg-[#F1F5F9] hover:text-mwasalatInk-500',
};

export default function MwasalatAiTrigger({ theme = 'dark' }) {
  const { t } = useTranslation('mwasalatApp');
  const isOpen = useMwasalatAiStore((s) => s.isOpen);
  const toggleOpen = useMwasalatAiStore((s) => s.toggleOpen);

  return (
    <button
      type="button"
      onClick={toggleOpen}
      aria-label={t('aiAssistant.triggerLabel')}
      aria-expanded={isOpen}
      className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${TRIGGER_THEME_CLASSES[theme]}`}
    >
      <Bot className="w-[18px] h-[18px] animate-ai-bot-float" />
    </button>
  );
}
