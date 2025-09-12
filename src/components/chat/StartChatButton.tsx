'use client';

import { useState } from 'react';
import { MessageCircle, Send, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { chat as chatTranslations, useLanguage, forms } from '@/lib/translations';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

interface StartChatButtonProps {
  postId: string;
  postTitle: string;
  postType: 'TEACHER' | 'STUDENT';
  authorId: string;
  authorName: string;
  onChatStarted?: (chatId: string) => void;
  className?: string;
}

export default function StartChatButton({
  postId,
  postTitle,
  postType,
  authorId,
  authorName,
  onChatStarted,
  className = '',
}: StartChatButtonProps) {
  const { user, isAuthenticated } = useAuth();
  const language = useLanguage();
  const t = chatTranslations[language];
  const f = forms[language];
  
  const [showModal, setShowModal] = useState(false);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Don't show button for own posts or if not authenticated
  if (!isAuthenticated || user?.id === authorId) {
    return null;
  }

  const handleStartChat = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
        },
        body: JSON.stringify({
          relatedPostId: postId,
          participantId: authorId,
          initialMessage: message.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to start chat');
      }

      const data = await response.json();
      const chatId = data.data.chat.id;
      
      setShowModal(false);
      setMessage('');
      onChatStarted?.(chatId);
      
      // Navigate to chat page
      window.location.href = `/chat?id=${chatId}`;
      
    } catch (error) {
      console.error('Failed to start chat:', error);
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const getDefaultMessage = () => {
    const greeting = language === 'no' ? 'Hei' : 'Hi';
    const interested = language === 'no' ? 'Jeg er interessert i' : "I'm interested in";
    
    return `${greeting} ${authorName}!\n\n${interested} "${postTitle}".`;
  };

  const handleOpenModal = () => {
    setMessage(getDefaultMessage());
    setShowModal(true);
    setError(null);
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        className={`flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${className}`}
      >
        <MessageCircle className="h-4 w-4" />
        {language === 'no' ? 'Send melding' : 'Send message'}
      </button>

      {/* Chat Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {t.newMessage}
                </h3>
                <p className="text-sm text-gray-600">
                  {language === 'no' ? 'Till' : 'To'} {authorName}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Post Info */}
            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex items-center gap-2 mb-2">
                <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                  postType === 'TEACHER' 
                    ? 'bg-green-100 text-green-700' 
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {postType === 'TEACHER' 
                    ? (language === 'no' ? 'Lærer' : 'Teacher')
                    : (language === 'no' ? 'Student' : 'Student')
                  }
                </div>
                <span className="text-sm text-gray-600">{t.post.relatedTo}</span>
              </div>
              <h4 className="font-medium text-gray-900">{postTitle}</h4>
            </div>

            {/* Message Form */}
            <div className="p-4">
              <label htmlFor="chat-message" className="block text-sm font-medium text-gray-700 mb-2">
                {f.message}
              </label>
              <textarea
                id="chat-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                placeholder={f.enterMessage}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              />
              
              {error && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                  {error}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 p-4 border-t border-gray-200">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={isLoading}
              >
                {language === 'no' ? 'Avbryt' : 'Cancel'}
              </button>
              <button
                onClick={handleStartChat}
                disabled={!message.trim() || isLoading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                {isLoading 
                  ? (language === 'no' ? 'Sender...' : 'Sending...') 
                  : t.sendMessage
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}