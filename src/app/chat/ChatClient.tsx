'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useActivityTracking } from '@/hooks/useActivityTracking';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AuthGuard from '@/components/auth/AuthGuard';

// Dynamic import ChatInterface with SSR disabled to prevent hydration issues
const ChatInterface = dynamic(() => import('@/components/chat').then(mod => ({ default: mod.ChatInterface })), {
  ssr: false,
  loading: () => (
    <div className="h-full flex items-center justify-center bg-gray-50">
      <LoadingSpinner />
    </div>
  )
});

function ChatPageContent() {
  // Track user activity on chat page
  useActivityTracking();
  
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

export default function ChatClient() {
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