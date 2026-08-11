import { AppShell } from '@/components/layout/AppShell';
import Sidebar from '@/components/layout/Sidebar';
import ChatMain from '@/components/features/chat/ChatMain';
import { CandidateModal } from '@/components/features/candidate/CandidateModal';

export function ChatPage() {
  return (
    <AppShell>
      <Sidebar />
      <ChatMain />
      <CandidateModal />
    </AppShell>
  );
}

export default ChatPage;

