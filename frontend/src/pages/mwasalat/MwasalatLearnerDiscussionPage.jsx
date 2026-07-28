import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';
import MwasalatLearnerLayout from '../../layouts/MwasalatLearnerLayout.jsx';
import { mwasalatProgramService } from '../../services/mwasalatProgram.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import MwasalatDiscussionPanel from '../../components/mwasalat/MwasalatDiscussionPanel.jsx';
import { getLocalizedProgramField } from '../../utils/mwasalatLocalize.js';

export default function MwasalatLearnerDiscussionPage() {
  const { t, i18n } = useTranslation('mwasalatApp');
  const { id } = useParams();
  const { user } = useMwasalatAuthStore();
  const [program, setProgram] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mwasalatProgramService.getById(id).then(setProgram).finally(() => setIsLoading(false));
  }, [id]);

  return (
    <MwasalatLearnerLayout title={t('discussion.title')} subtitle={getLocalizedProgramField(program, 'title', i18n.language)}>
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin me-2" /> {t('discussion.loading')}
          </div>
        ) : (
          <MwasalatDiscussionPanel
            programId={id}
            currentUser={user}
            programTitle={getLocalizedProgramField(program, 'title', i18n.language)}
            backTo={`/learner/programs/${id}`}
          />
        )}
      </div>
    </MwasalatLearnerLayout>
  );
}
