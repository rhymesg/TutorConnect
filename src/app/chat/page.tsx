'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { ChatInterface } from '@/components/chat';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AuthGuard from '@/components/auth/AuthGuard';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const initialChatId = searchParams.get('id') || undefined;
  const appointmentId = searchParams.get('appointment') || undefined;

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Chat Interface filling available height */}
      <ChatInterface 
        initialChatId={initialChatId} 
        appointmentId={appointmentId}
        className="h-full" 
      />
    </div>
  );
}

export default function ChatPage() {
  return (
    <AuthGuard>
      <Suspense fallback={
        <div className="h-screen flex items-center justify-center bg-white">
          <LoadingSpinner />
        </div>
      }>
        <ChatPageContent />
      </Suspense>
    </AuthGuard>
  );
}