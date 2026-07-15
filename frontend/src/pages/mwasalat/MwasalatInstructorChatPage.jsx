import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import MwasalatInstructorLayout from '../../layouts/MwasalatInstructorLayout.jsx';
import { mwasalatChatService } from '../../services/mwasalatChat.service.js';
import { useMwasalatAuthStore } from '../../store/mwasalatAuthStore.js';
import MwasalatChatPanel from '../../components/mwasalat/MwasalatChatPanel.jsx';

export default function MwasalatInstructorChatPage() {
  const { id, learnerId } = useParams();
  const { user } = useMwasalatAuthStore();
  const [conversation, setConversation] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    mwasalatChatService.getOrCreateAsInstructor(id, learnerId)
      .then(setConversation)
      .finally(() => setIsLoading(false));
  }, [id, learnerId]);

  return (
    <MwasalatInstructorLayout title={conversation?.learner?.name ?? 'Chat'} subtitle={conversation?.program?.title}>
      {isLoading ? (
        <div className="p-10 flex items-center justify-center text-[#94A3B8]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading conversation…
        </div>
      ) : conversation ? (
        <MwasalatChatPanel
          conversationId={conversation._id}
          currentUserId={user?._id}
          otherName={conversation.learner?.name}
          subtitle={conversation.program?.title}
          backTo={`/mwasalat/instructor/programs/${id}`}
        />
      ) : (
        <div className="card p-10 text-center text-sm text-[#475569]">Unable to start this conversation.</div>
      )}
    </MwasalatInstructorLayout>
  );
}
