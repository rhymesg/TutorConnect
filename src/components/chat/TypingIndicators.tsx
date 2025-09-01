'use client';

import { useState, useEffect } from 'react';
import { User } from 'lucide-react';
import { TypingIndicator } from '@/types/chat';
import { Language, chat as chatTranslations } from '@/lib/translations';

interface TypingIndicatorsProps {
  typingUsers: TypingIndicator[];
  currentUserId: string;
  language: Language;
  className?: string;
  showAvatars?: boolean;
  maxDisplayUsers?: number;
  autoHideDelay?: number;
}

export default function TypingIndicators({
  typingUsers,
  currentUserId,
  language,
  className = '',
  showAvatars = true,
  maxDisplayUsers = 3,
  autoHideDelay = 5000,
}: TypingIndicatorsProps) {
  const t = chatTranslations[language];
  const [displayUsers, setDisplayUsers] = useState<TypingIndicator[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  // Enhanced filtering and state management
  useEffect(() => {
    // Convert string array to TypingIndicator objects if needed
    const typingIndicators: TypingIndicator[] = typingUsers.map((user) => {
      if (typeof user === 'string') {
        return {
          chatId: '',
          userId: '',
          userName: user,
          timestamp: new Date(),
        };
      }
      return user;
    });

    const now = new Date();
    const activeTypingUsers = typingIndicators.filter(
      indicator => 
        indicator.userId !== currentUserId &&
        indicator.timestamp &&
        now.getTime() - indicator.timestamp.getTime() < autoHideDelay
    );

    setDisplayUsers(activeTypingUsers.slice(0, maxDisplayUsers));
    setIsVisible(activeTypingUsers.length > 0);
  }, [typingUsers, currentUserId, autoHideDelay, maxDisplayUsers]);

  if (!isVisible || displayUsers.length === 0) {
    return null;
  }

  // Enhanced Norwegian typing text with proper grammar
  const getTypingText = () => {
    const userCount = displayUsers.length;
    const totalTyping = typingUsers.filter(u => u.userId !== currentUserId).length;
    
    if (userCount === 1) {
      const user = displayUsers[0];
      return language === 'no' 
        ? `${user.userName} skriver...`
        : `${user.userName} is typing...`;
    } else if (userCount === 2) {
      const [user1, user2] = displayUsers;
      return language === 'no'
        ? `${user1.userName} og ${user2.userName} skriver...`
        : `${user1.userName} and ${user2.userName} are typing...`;
    } else if (userCount === 3 && totalTyping === 3) {
      const [user1, user2, user3] = displayUsers;
      return language === 'no'
        ? `${user1.userName}, ${user2.userName} og ${user3.userName} skriver...`
        : `${user1.userName}, ${user2.userName} and ${user3.userName} are typing...`;
    } else {
      const [user1] = displayUsers;
      const others = totalTyping - 1;
      return language === 'no'
        ? `${user1.userName} og ${others} andre skriver...`
        : `${user1.userName} and ${others} others are typing...`;
    }
  };

  return (
    <div className={`flex justify-start mb-2 transition-all duration-300 ease-in-out ${className}`}>
      <div className="max-w-sm mr-12">
        {/* Avatar section - show multiple avatars for multiple users */}
        {showAvatars && (
          <div className="flex items-end gap-1 mb-1 ml-1">
            {displayUsers.slice(0, 3).map((user, index) => (
              <div 
                key={user.userId}
                className={`w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center flex-shrink-0 border-2 border-white shadow-sm ${
                  index > 0 ? '-ml-2' : ''
                }`}
                style={{ zIndex: 3 - index }}
                title={user.userName}
              >
                {user.userName ? (
                  <span className="text-xs font-semibold text-white">
                    {user.userName.charAt(0).toUpperCase()}
                  </span>
                ) : (
                  <User className="h-3 w-3 text-white" />
                )}
              </div>
            ))}
          </div>
        )}

        {/* Enhanced typing bubble with Norwegian styling */}
        <div className="bg-gray-100 px-4 py-3 rounded-2xl shadow-sm border border-gray-50 animate-fade-in">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-gray-700 font-medium flex-1">
              {getTypingText()}
            </span>
            
            {/* Enhanced Norwegian-style typing animation */}
            <div className="flex gap-1 items-center">
              <div 
                className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-typing-bounce"
                style={{ animationDelay: '0ms' }}
              ></div>
              <div 
                className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-typing-bounce"
                style={{ animationDelay: '200ms' }}
              ></div>
              <div 
                className="w-1.5 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-typing-bounce"
                style={{ animationDelay: '400ms' }}
              ></div>
            </div>
          </div>

          {/* Progress bar showing typing duration */}
          <div className="mt-2 h-0.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full animate-typing-progress"
              style={{ 
                animationDuration: `${autoHideDelay}ms`,
                animationTimingFunction: 'linear'
              }}
            ></div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes typing-bounce {
          0%, 60%, 100% {
            transform: translateY(0);
            opacity: 0.4;
          }
          30% {
            transform: translateY(-4px);
            opacity: 1;
          }
        }
        
        @keyframes typing-progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-typing-bounce {
          animation: typing-bounce 1.4s infinite;
        }
        
        .animate-typing-progress {
          animation: typing-progress linear forwards;
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}