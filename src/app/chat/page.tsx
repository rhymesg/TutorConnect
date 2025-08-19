'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import MainLayout from '@/components/layout/MainLayout';
import { ChatInterface } from '@/components/chat';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { chat as chatTranslations, useLanguage } from '@/lib/translations';

function ChatPageContent() {
  const searchParams = useSearchParams();
  const initialChatId = searchParams.get('id') || undefined;
  const language = useLanguage();
  const t = chatTranslations[language];

  return (
    <MainLayout>
      <div className="flex-1 flex flex-col">
        {/* Page Header - Hidden on mobile to save space */}
        <div className="hidden md:block border-b border-gray-200 bg-white px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {t.title}
          </h1>
        </div>

        {/* Enhanced Chat Interface */}
        <div className="flex-1 overflow-hidden">
          <ChatInterface initialChatId={initialChatId} />
        </div>
      </div>
    </MainLayout>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <MainLayout>
        <div className="flex-1 flex items-center justify-center">
          <LoadingSpinner />
        </div>
      </MainLayout>
    }>
      <ChatPageContent />
    </Suspense>
  );
}