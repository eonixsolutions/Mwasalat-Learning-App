import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import MwasalatLearnerLayout from '../../layouts/MwasalatLearnerLayout.jsx';
import { mwasalatChatService } from '../../services/mwasalatChat.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import MwasalatChatPanel from '../../components/mwasalat/MwasalatChatPanel.jsx';

export default function MwasalatLearnerChatPage() {
  const { id } = useParams();
  const { user } = useMwasalatAuthStore();
  const [conversation, setConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mwasalatChatService.getOrCreateAsLearner(id)
      .then(setConversation)
      .finally(() => setIsLoading(false));
  }, [id]);

  return (
    <MwasalatLearnerLayout title={conversation?.instructor?.name ?? 'Chat'} subtitle={conversation?.program?.title}>
      <div className="max-w-2xl mx-auto">
        {isLoading ? (
          <div className="p-10 flex items-center justify-center text-[#94A3B8]">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading conversation…
          </div>
        ) : conversation ? (
          <MwasalatChatPanel
            conversationId={conversation._id}
            currentUserId={user?._id}
            otherName={conversation.instructor?.name}
            subtitle={conversation.program?.title}
            backTo={`/mwasalat/learner/programs/${id}`}
          />
        ) : (
          <div className="card p-10 text-center text-sm text-[#475569]">Unable to start this conversation.</div>
        )}
      </div>
    </MwasalatLearnerLayout>
  );
}
