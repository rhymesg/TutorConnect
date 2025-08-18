'use client';

import { User } from 'lucide-react';
import { TypingIndicator } from '@/types/chat';
import { Language, chat as chatTranslations } from '@/lib/translations';

interface TypingIndicatorsProps {
  typingUsers: TypingIndicator[];
  currentUserId: string;
  language: Language;
}

export default function TypingIndicators({
  typingUsers,
  currentUserId,
  language,
}: TypingIndicatorsProps) {
  const t = chatTranslations[language];
  
  // Filter out current user and expired typing indicators (older than 5 seconds)
  const now = new Date();
  const activeTypingUsers = typingUsers.filter(
    indicator => 
      indicator.userId !== currentUserId &&
      now.getTime() - indicator.timestamp.getTime() < 5000
  );

  if (activeTypingUsers.length === 0) {
    return null;
  }

  const getTypingText = () => {
    if (activeTypingUsers.length === 1) {
      return t.typing.user.replace('{name}', activeTypingUsers[0].userName);
    } else if (activeTypingUsers.length === 2) {
      return `${activeTypingUsers[0].userName} ${language === 'no' ? 'og' : 'and'} ${activeTypingUsers[1].userName} ${language === 'no' ? 'skriver' : 'are typing'}...`;
    } else {
      return t.typing.multiple.replace('{count}', activeTypingUsers.length.toString());
    }
  };

  return (
    <div className="flex justify-start mb-2">
      <div className="max-w-sm mr-12">
        <div className="flex items-end gap-2 mb-1">
          {/* Show avatar of first typing user */}
          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-gray-400" />
          </div>
        </div>

        <div className="bg-gray-100 px-4 py-2 rounded-2xl">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {getTypingText()}
            </span>
            
            {/* Animated typing dots */}
            <div className="flex gap-1">
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse"></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.1s' }}></div>
              <div className="w-1 h-1 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}