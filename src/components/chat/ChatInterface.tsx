'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, MessageCircle } from 'lucide-react';
import { useLanguage, chat as chatTranslations } from '@/lib/translations';
import { useChat } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { Message } from '@/types/chat';
import ChatRoomList from './ChatRoomList';
import ChatHeader from './ChatHeader';
import MessageList from './MessageList';
import MessageComposer from './MessageComposer';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import AppointmentModal, { AppointmentData } from './AppointmentModal';
import AppointmentResponseModal from './AppointmentResponseModal';

interface ChatInterfaceProps {
  initialChatId?: string;
  appointmentId?: string;
  onClose?: () => void;
  className?: string;
}

export default function ChatInterface({ 
  initialChatId, 
  appointmentId,
  onClose,
  className = '' 
}: ChatInterfaceProps) {
  const router = useRouter();
  const language = useLanguage();
  const t = chatTranslations[language];
  const { user } = useAuth();
  
  // Layout state
  const [selectedChatId, setSelectedChatId] = useState<string | null>(initialChatId || null);
  const [isMobile, setIsMobile] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);
  const [isChangingChat, setIsChangingChat] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [appointmentError, setAppointmentError] = useState<string | null>(null);
  const [showAppointmentResponseModal, setShowAppointmentResponseModal] = useState(false);
  const [selectedAppointmentMessage, setSelectedAppointmentMessage] = useState<Message | null>(null);
  const [appointmentResponseError, setAppointmentResponseError] = useState<string | null>(null);
  
  // Use centralized chat hook
  const {
    chat,
    messages,
    chats,
    totalUnreadCount,
    isLoadingChat,
    isLoadingMessages,
    isLoadingChats,
    chatError,
    messageError,
    chatsError,
    loadChat,
    loadChats,
    sendMessage,
    clearErrors,
  } = useChat({
    chatId: selectedChatId || undefined,
    autoLoad: true,
    enablePolling: true, // Enable polling for updates
  });

  // Check if mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setShowSidebar(!mobile || !selectedChatId);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [selectedChatId]);

  // Initialize with specific chat if provided, or reset if no chat ID
  useEffect(() => {
    if (initialChatId && initialChatId !== selectedChatId) {
      setSelectedChatId(initialChatId);
    } else if (!initialChatId && selectedChatId) {
      // Reset to "Velg en samtale" state when no chatId in URL
      setSelectedChatId(null);
    }
  }, [initialChatId, selectedChatId]);

  // Auto-open appointment modal if appointmentId is provided
  useEffect(() => {
    if (appointmentId && messages && messages.length > 0) {
      // Find the message with the matching appointmentId
      const appointmentMessage = messages.find(msg => msg.appointmentId === appointmentId);
      if (appointmentMessage) {
        setSelectedAppointmentMessage(appointmentMessage);
        setShowAppointmentResponseModal(true);
        setAppointmentResponseError(null);
      }
    }
  }, [appointmentId, messages]);

  // Reset isChangingChat when chat changes and loads
  useEffect(() => {
    if (isChangingChat && chat && chat.id === selectedChatId) {
      // Give a small delay to ensure the UI updates smoothly
      const timer = setTimeout(() => {
        setIsChangingChat(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isChangingChat, chat, selectedChatId]);

  // Event handlers
  const handleSelectChat = async (chatId: string) => {
    if (chatId !== selectedChatId) {
      setIsChangingChat(true);
      setSelectedChatId(chatId);
      clearErrors(); // Clear any previous errors
      
      // Update URL without page refresh
      router.replace(`/chat?id=${chatId}`);
      
      // Immediately start loading the chat
      try {
        await loadChat(chatId);
      } catch (error) {
        // console.error('Error loading chat:', error);
        // Reset changing state on error
        setIsChangingChat(false);
      }
    }
    
    // Hide sidebar on mobile
    if (isMobile) {
      setShowSidebar(false);
    }
  };

  const handleBackToList = () => {
    setSelectedChatId(null);
    setShowSidebar(true);
  };

  const handleSendMessage = async (content: string, type?: Message['type']) => {
    if (!selectedChatId) {
      return;
    }
    
    try {
      await sendMessage(content, type || 'TEXT');
    } catch (error) {
      // console.error('Failed to send message:', error);
      // Error is already handled in the useChat hook
    }
  };

  const handleLoadMoreChats = () => {
    // console.log('Load more chats - TODO');
  };

  const handleLoadMoreMessages = () => {
    // console.log('Load more messages - TODO');
  };

  const handleSearchChats = (query: string) => {
    // console.log('Search chats:', query);
  };

  const handleFilterChats = (filter: any) => {
    // console.log('Filter chats:', filter);
  };

  const handleArchiveChat = (chatId: string) => {
    // console.log('Archive chat:', chatId);
  };

  const handleDeleteChat = (chatId: string) => {
    // console.log('Delete chat:', chatId);
  };

  const handlePinChat = (chatId: string) => {
    // console.log('Pin chat:', chatId);
  };

  const handleRetry = async () => {
    if (selectedChatId) {
      await loadChat(selectedChatId);
    } else {
      await loadChats();
    }
  };

  const handleExploreContacts = () => {
    window.location.href = '/posts';
  };

  const handleMessageAction = (action: string, messageId: string) => {
    // console.log('Message action:', action, messageId);
  };

  const handleRetryMessage = (messageId: string) => {
    // console.log('Retry message:', messageId);
  };

  const handleViewAppointment = (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (message) {
      setSelectedAppointmentMessage(message);
      setShowAppointmentResponseModal(true);
      setAppointmentResponseError(null);
    }
  };

  const handleAcceptAppointment = async () => {
    if (!selectedAppointmentMessage?.appointment?.id) return;
    
    setAppointmentResponseError(null);
    
    try {
      const response = await fetch(`/api/appointments/${selectedAppointmentMessage.appointment.id}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accepted: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Kunne ikke godta avtalen');
      }
      
      // Refresh chat to get updated appointment status
      if (selectedChatId) {
        await loadChat(selectedChatId);
      }
    } catch (error: any) {
      console.error('Failed to accept appointment:', error);
      setAppointmentResponseError(error?.message || 'Kunne ikke godta avtalen');
      throw error; // Re-throw for modal handling
    }
  };

  const handleRejectAppointment = async () => {
    if (!selectedAppointmentMessage?.appointment?.id) return;
    
    setAppointmentResponseError(null);
    
    try {
      const response = await fetch(`/api/appointments/${selectedAppointmentMessage.appointment.id}/respond`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ accepted: false }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Kunne ikke avslå avtalen');
      }
      
      // Refresh chat to get updated appointment status
      if (selectedChatId) {
        await loadChat(selectedChatId);
      }
    } catch (error: any) {
      console.error('Failed to reject appointment:', error);
      setAppointmentResponseError(error?.message || 'Kunne ikke avslå avtalen');
      throw error; // Re-throw for modal handling
    }
  };


  const handleCompletedAppointment = async () => {
    if (!selectedAppointmentMessage?.appointment?.id) return;
    
    setAppointmentResponseError(null);
    
    try {
      const response = await fetch(`/api/appointments/${selectedAppointmentMessage.appointment.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: true }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Kunne ikke bekrefte at avtalen ble gjennomført');
      }
      
      // Refresh chat to get updated appointment status
      if (selectedChatId) {
        await loadChat(selectedChatId);
      }
    } catch (error: any) {
      console.error('Failed to confirm appointment completion:', error);
      setAppointmentResponseError(error?.message || 'Kunne ikke bekrefte at avtalen ble gjennomført');
      throw error; // Re-throw for modal handling
    }
  };

  const handleNotCompletedAppointment = async () => {
    if (!selectedAppointmentMessage?.appointment?.id) return;
    
    setAppointmentResponseError(null);
    
    try {
      const response = await fetch(`/api/appointments/${selectedAppointmentMessage.appointment.id}/complete`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ completed: false }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Kunne ikke markere avtalen som ikke gjennomført');
      }
      
      // Refresh chat to get updated appointment status
      if (selectedChatId) {
        await loadChat(selectedChatId);
      }
    } catch (error: any) {
      console.error('Failed to mark appointment as not completed:', error);
      setAppointmentResponseError(error?.message || 'Kunne ikke markere avtalen som ikke gjennomført');
      throw error; // Re-throw for modal handling
    }
  };

  const handleDeleteAppointment = async () => {
    if (!selectedAppointmentMessage?.appointment?.id) return;
    
    setAppointmentResponseError(null);
    
    try {
      const response = await fetch(`/api/appointments/${selectedAppointmentMessage.appointment.id}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || 'Kunne ikke slette avtalen');
      }
      
      // Refresh chat to get updated appointment status
      if (selectedChatId) {
        await loadChat(selectedChatId);
      }
    } catch (error: any) {
      console.error('Failed to delete appointment:', error);
      setAppointmentResponseError(error?.message || 'Kunne ikke slette avtalen');
      throw error; // Re-throw for modal handling
    }
  };

  const handleScheduleAppointment = () => {
    setShowAppointmentModal(true);
  };

  const handleViewAppointments = () => {
    if (selectedChatId) {
      window.open(`/chat/${selectedChatId}/appointments`, '_blank');
    }
  };

  const handleAppointmentSubmit = async (appointmentData: AppointmentData) => {
    console.log('Sending appointment request:', appointmentData);
    setAppointmentError(null);
    
    // Double-check if appointment exists before sending
    if (selectedChatId) {
      try {
        const checkResponse = await fetch(`/api/chat/${selectedChatId}/appointments/check?date=${appointmentData.date}`, {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          },
        });
        
        if (checkResponse.ok) {
          const checkData = await checkResponse.json();
          if (checkData.data.hasAppointment) {
            setAppointmentError('Det finnes allerede en avtale for denne datoen.');
            return; // Don't send appointment
          }
        }
      } catch (error) {
        console.error('Failed to check appointment before sending:', error);
      }
    }
    
    // Combine date and time
    const dateTime = `${appointmentData.date}T${appointmentData.startTime}`;
    const endDateTime = `${appointmentData.date}T${appointmentData.endTime}`;
    
    // Create appointment request message
    const appointmentMessage = JSON.stringify({
      dateTime,
      endDateTime,
      date: appointmentData.date,
      startTime: appointmentData.startTime,
      endTime: appointmentData.endTime,
      location: appointmentData.location
    });
    
    console.log('Appointment message content:', appointmentMessage);
    console.log('Message type:', 'APPOINTMENT_REQUEST');
    
    try {
      await sendMessage(appointmentMessage, 'APPOINTMENT_REQUEST');
      console.log('Appointment request sent successfully');
      setShowAppointmentModal(false);
      setAppointmentError(null);
    } catch (error: any) {
      console.error('Failed to send appointment request:', error);
      setAppointmentError('Kunne ikke sende avtaleforespørsel. Vennligst prøv igjen.');
    }
  };

  return (
    <div className={`flex h-full bg-gray-50 ${className}`}>
      {/* Chat List Sidebar */}
      <div className={`${
        isMobile 
          ? `fixed inset-y-0 left-0 z-40 w-full transform ${
              showSidebar ? 'translate-x-0' : '-translate-x-full'
            } transition-transform duration-300 ease-in-out`
          : 'w-80 flex-shrink-0'
      } ${!isMobile && !showSidebar ? 'hidden' : ''} bg-white border-r border-gray-200 flex flex-col h-full overflow-hidden`}>
        
        <ChatRoomList
          chats={chats}
          isLoading={isLoadingChats}
          error={chatsError}
          selectedChatId={selectedChatId || undefined}
          isLoadingChat={isChangingChat}
          onSelectChat={handleSelectChat}
          onSearch={handleSearchChats}
          onFilter={handleFilterChats}
          hasMore={false} // TODO: Implement pagination
          onLoadMore={handleLoadMoreChats}
          onArchiveChat={handleArchiveChat}
          onDeleteChat={handleDeleteChat}
          onPinChat={handlePinChat}
          onRetry={handleRetry}
          onExploreContacts={handleExploreContacts}
        />
      </div>

      {/* Conversation View */}
      <div className={`flex-1 flex flex-col ${isMobile && showSidebar ? 'hidden' : ''} h-full overflow-hidden`}>
        {selectedChatId && chat ? (
          <div className="flex flex-col h-full">
            {/* Error display */}
            {(chatError || messageError || appointmentResponseError) && (
              <div className="px-4 py-2 text-sm flex items-center justify-center gap-2 bg-red-50 text-red-700 border-b border-red-200">
                <span>{chatError || messageError || appointmentResponseError}</span>
                <button 
                  onClick={() => {
                    clearErrors();
                    setAppointmentResponseError(null);
                    if (selectedChatId) {
                      handleRetry();
                    }
                  }}
                  className="ml-2 text-xs underline hover:no-underline"
                >
                  {language === 'no' ? 'Lukk' : 'Close'}
                </button>
              </div>
            )}

            {/* Chat Header */}
            <ChatHeader
              chat={chats.find(c => c.id === selectedChatId) || chat}
              language={language}
              onBack={isMobile ? handleBackToList : undefined}
              onShowPostDetails={() => {/* console.log('Show post details') */}}
              onArchiveChat={() => handleArchiveChat(selectedChatId)}
              onDeleteChat={() => handleDeleteChat(selectedChatId)}
              onBlockUser={() => {/* console.log('Block user') */}}
              onReportUser={() => {/* console.log('Report user') */}}
              onSettings={() => {/* console.log('Settings') */}}
              onScheduleAppointment={handleScheduleAppointment}
              onViewAppointments={handleViewAppointments}
            />
            
            {/* Messages - scrollable area */}
            <div className="flex-1 overflow-y-auto">
              <MessageList
                messages={messages}
                currentUserId={user?.id || ""}
                language={language}
                isLoading={isLoadingMessages}
                hasMore={false} // TODO: Implement pagination
                typingUsers={[]}
                onLoadMore={handleLoadMoreMessages}
                onMessageAction={handleMessageAction}
                onRetryMessage={handleRetryMessage}
                onViewAppointment={handleViewAppointment}
              />
            </div>
            
            {/* Message Composer - fixed at bottom */}
            <div className="border-t border-gray-200">
              <MessageComposer
                onSendMessage={handleSendMessage}
                language={language}
                disabled={false}
                chatId={selectedChatId}
              />
            </div>
          </div>
        ) : (
          /* Empty state */
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {language === 'no' ? 'Velg en samtale' : 'Select a conversation'}
              </h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {language === 'no' 
                  ? 'Velg en samtale fra listen for å begynne å chatte, eller utforsk innlegg for å finne nye lærere og studenter.'
                  : 'Choose a conversation from the list to start chatting, or explore posts to find new teachers and students.'
                }
              </p>
              <button 
                onClick={handleExploreContacts}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                {language === 'no' ? 'Utforsk innlegg' : 'Explore Posts'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Mobile overlay when sidebar is open */}
      {isMobile && showSidebar && selectedChatId && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={handleBackToList}
        />
      )}

      {/* Close button for modal mode */}
      {onClose && (
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full z-50"
        >
          <X className="h-5 w-5" />
        </button>
      )}

      {/* Appointment Modal */}
      <AppointmentModal
        isOpen={showAppointmentModal}
        onClose={() => {
          setShowAppointmentModal(false);
          setAppointmentError(null);
        }}
        onSubmit={handleAppointmentSubmit}
        language={language}
        chatId={selectedChatId || ''}
        error={appointmentError}
      />

      {/* Appointment Response Modal */}
      {selectedAppointmentMessage && (
        <AppointmentResponseModal
          isOpen={showAppointmentResponseModal}
          onClose={() => {
            setShowAppointmentResponseModal(false);
            setSelectedAppointmentMessage(null);
            setAppointmentResponseError(null);
          }}
          message={selectedAppointmentMessage}
          language={language}
          onAccept={handleAcceptAppointment}
          onReject={handleRejectAppointment}
          onCompleted={handleCompletedAppointment}
          onNotCompleted={handleNotCompletedAppointment}
          onDelete={handleDeleteAppointment}
          error={appointmentResponseError}
        />
      )}
    </div>
  );
}