'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatInterface } from '@/components/chat';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const initialChatId = searchParams.get('id') || undefined;

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Full-screen Chat Interface without MainLayout */}
      <ChatInterface initialChatId={initialChatId} />
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-white">
        <LoadingSpinner />
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}