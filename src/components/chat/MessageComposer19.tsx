'use client';

import { useActionState, useState, useRef, useCallback, useOptimistic } from 'react';
import { Send, Paperclip, Smile, Mic, X, Image, FileText, Calendar, MessageSquare, AlertTriangle } from 'lucide-react';
import { Message } from '@/types/chat';
import { Language, chat as chatTranslations } from '@/lib/translations';
import { sendMessageAction, sendQuickMessageAction, type ChatMessageState } from '@/lib/actions/chat';
import { LoadingSpinner } from '@/components/ui';

interface MessageComposer19Props {
  chatId: string;
  onMessageSent?: (message: any) => void;
  onStartTyping?: () => void;
  onStopTyping?: () => void;
  language: Language;
  disabled?: boolean;
  placeholder?: string;
}

interface FileAttachment {
  id: string;
  file: File;
  type: 'image' | 'document' | 'audio' | 'video';
  preview?: string;
  uploading?: boolean;
  error?: string;
}

interface OptimisticMessage {
  id: string;
  content: string;
  type: Message['type'];
  pending: boolean;
  failed?: boolean;
}

export default function MessageComposer19({
  chatId,
  onMessageSent,
  onStartTyping,
  onStopTyping,
  language,
  disabled = false,
  placeholder,
}: MessageComposer19Props) {
  const t = chatTranslations[language];
  
  // React 19 useActionState for message sending
  const [messageState, submitMessageAction, isPending] = useActionState<ChatMessageState, FormData>(
    sendMessageAction,
    null
  );

  // React 19 useOptimistic for optimistic updates
  const [optimisticMessages, addOptimisticMessage] = useOptimistic<OptimisticMessage[], OptimisticMessage>(
    [],
    (currentMessages, newMessage) => [...currentMessages, newMessage]
  );

  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const formRef = useRef<HTMLFormElement>(null);

  const adjustTextareaHeight = useCallback(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const scrollHeight = Math.min(textarea.scrollHeight, 120); // Max 5 lines
      textarea.style.height = scrollHeight + 'px';
    }
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setMessage(value);
    adjustTextareaHeight();
    
    // Handle typing indicators
    if (value.trim() && !typingTimeoutRef.current) {
      onStartTyping?.();
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      onStopTyping?.();
      typingTimeoutRef.current = undefined;
    }, 1000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && attachments.length === 0) return;
    if (isPending || disabled) return;

    // Create optimistic message
    const optimisticMessage: OptimisticMessage = {
      id: `optimistic-${Date.now()}`,
      content: trimmedMessage,
      type: 'TEXT',
      pending: true,
    };

    // Add optimistic message
    addOptimisticMessage(optimisticMessage);
    
    // Trigger form submission
    if (formRef.current) {
      const formData = new FormData(formRef.current);
      formData.set('chatId', chatId);
      formData.set('content', trimmedMessage);
      formData.set('type', 'TEXT');
      
      submitMessageAction(formData);
    }

    // Clear input immediately for better UX
    setMessage('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    
    onStopTyping?.();
  };

  // Handle successful message send
  if (messageState?.success && messageState.message && onMessageSent) {
    onMessageSent(messageState.message);
  }

  const handleFileSelect = (acceptedTypes: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = acceptedTypes;
      fileInputRef.current.click();
    }
    setShowAttachMenu(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    files.forEach(file => {
      const id = Date.now() + Math.random().toString();
      let type: FileAttachment['type'] = 'document';
      
      if (file.type.startsWith('image/')) {
        type = 'image';
      } else if (file.type.startsWith('audio/')) {
        type = 'audio';
      } else if (file.type.startsWith('video/')) {
        type = 'video';
      }
      
      const attachment: FileAttachment = {
        id,
        file,
        type,
        uploading: false,
      };
      
      // Generate preview for images
      if (type === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          setAttachments(prev => prev.map(att => 
            att.id === id ? { ...att, preview: e.target?.result as string } : att
          ));
        };
        reader.readAsDataURL(file);
      }
      
      setAttachments(prev => [...prev, attachment]);
    });
    
    // Clear file input
    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const quickTemplates = language === 'no' ? [
    'Når passer det best for deg?',
    'Jeg er tilgjengelig i dag etter klokka 15:00',
    'Kan vi møtes på biblioteket?',
    'Takk for undervisningen!',
    'Kan du forklare dette nærmere?',
    'Jeg trenger hjelp med hjemmeleksa'
  ] : [
    'When works best for you?',
    "I'm available today after 3 PM",
    'Can we meet at the library?',
    'Thanks for the tutoring!',
    'Can you explain this further?',
    'I need help with homework'
  ];

  const handleTemplateSelect = async (template: string) => {
    setShowTemplates(false);
    
    // Send quick message using server action
    try {
      const result = await sendQuickMessageAction(chatId, template);
      if (result.success && result.message && onMessageSent) {
        onMessageSent(result.message);
      }
    } catch (error) {
      console.error('Failed to send template message:', error);
    }
  };

  const canSend = (message.trim() || attachments.length > 0) && !isPending && !disabled;

  return (
    <div className="border-t border-neutral-200 p-4 bg-white">
      {/* Enhanced Error Message */}
      {messageState?.error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 p-3">
          <div className="flex items-center">
            <AlertTriangle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" />
            <div className="flex-1">
              <h4 className="text-sm font-medium text-red-800">
                Kunne ikke sende melding
              </h4>
              <p className="text-sm text-red-700 mt-1">{messageState.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Optimistic Messages Display */}
      {optimisticMessages.length > 0 && (
        <div className="mb-3 space-y-2">
          {optimisticMessages.map(msg => (
            <div key={msg.id} className="flex items-center text-sm text-neutral-600 bg-neutral-50 rounded-lg p-2">
              <div className="flex items-center mr-2">
                {msg.pending && <LoadingSpinner className="w-3 h-3 mr-1" />}
                {msg.failed && <AlertTriangle className="w-3 h-3 mr-1 text-red-500" />}
              </div>
              <span className={msg.failed ? 'text-red-600' : 'text-neutral-600'}>
                {msg.failed ? 'Feilet å sende' : 'Sender'}: "{msg.content}"
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {attachments.map(attachment => (
              <div
                key={attachment.id}
                className="relative bg-neutral-100 rounded-lg p-2 flex items-center gap-2"
              >
                {attachment.type === 'image' && attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt="Preview"
                    className="w-8 h-8 rounded object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-neutral-200 rounded flex items-center justify-center">
                    {attachment.type === 'image' && <Image className="h-4 w-4 text-neutral-500" />}
                    {attachment.type === 'document' && <FileText className="h-4 w-4 text-neutral-500" />}
                    {attachment.type === 'audio' && <Mic className="h-4 w-4 text-neutral-500" />}
                  </div>
                )}
                
                <span className="text-sm text-neutral-700 max-w-32 truncate">
                  {attachment.file.name}
                </span>
                
                {attachment.uploading && (
                  <div className="w-2 h-2 bg-brand-500 rounded-full animate-pulse"></div>
                )}
                
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="text-neutral-400 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* React 19 Form with Server Action */}
      <form ref={formRef} className="hidden">
        <input type="hidden" name="chatId" value={chatId} />
        <input type="hidden" name="content" value={message} />
        <input type="hidden" name="type" value="TEXT" />
      </form>

      <div className="flex items-end gap-2">
        {/* Quick Templates */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowTemplates(!showTemplates)}
            disabled={disabled}
            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            title={language === 'no' ? 'Hurtigmeldinger' : 'Quick messages'}
          >
            <MessageSquare className="h-5 w-5" />
          </button>
          
          {showTemplates && (
            <div className="absolute bottom-full left-0 mb-2 w-64 bg-white border border-neutral-200 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
              <div className="p-2 border-b border-neutral-100">
                <span className="text-xs font-medium text-neutral-700 uppercase tracking-wider">
                  {language === 'no' ? 'Hurtigmeldinger' : 'Quick Messages'}
                </span>
              </div>
              {quickTemplates.map((template, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleTemplateSelect(template)}
                  className="w-full text-left px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50 last:rounded-b-lg"
                >
                  {template}
                </button>
              ))}
              <div className="p-2 border-t border-neutral-100">
                <div className="text-xs text-brand-600 font-medium">
                  React 19 Actions
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Attachment Menu */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            disabled={disabled}
            className="p-2 text-neutral-500 hover:text-neutral-700 hover:bg-neutral-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          {showAttachMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-neutral-200 rounded-lg shadow-lg z-10">
              <button
                type="button"
                onClick={() => handleFileSelect('image/*')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-t-lg"
              >
                <Image className="h-4 w-4 text-blue-500" />
                {t.composer.attachments.image}
              </button>
              
              <button
                type="button"
                onClick={() => handleFileSelect('.pdf,.doc,.docx,.txt')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <FileText className="h-4 w-4 text-green-500" />
                {t.composer.attachments.document}
              </button>
              
              <button
                type="button"
                onClick={() => handleFileSelect('audio/*')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50"
              >
                <Mic className="h-4 w-4 text-purple-500" />
                {t.composer.attachments.audio}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowAttachMenu(false);
                  // TODO: Open appointment booking modal
                  console.log('Open appointment booking modal');
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-blue-700 hover:bg-blue-50 rounded-b-lg font-medium"
              >
                <Calendar className="h-4 w-4 text-blue-500" />
                {language === 'no' ? 'Book undervisningstime' : 'Schedule tutoring session'}
              </button>
            </div>
          )}
        </div>

        {/* Message Input */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleInputChange}
            onKeyPress={handleKeyPress}
            placeholder={placeholder || t.composer.placeholder}
            disabled={disabled || isPending}
            className="w-full resize-none border border-neutral-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-brand-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          {/* Emoji button - positioned inside textarea */}
          <button
            type="button"
            className="absolute right-2 top-2 text-neutral-400 hover:text-neutral-600 p-1"
            disabled={disabled || isPending}
            onClick={() => {
              // TODO: Open emoji picker
              console.log('Open emoji picker');
            }}
          >
            <Smile className="h-4 w-4" />
          </button>
        </div>

        {/* Send Button */}
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={`p-2 rounded-lg transition-colors ${
            canSend
              ? 'bg-brand-500 text-white hover:bg-brand-600'
              : 'bg-neutral-200 text-neutral-400 cursor-not-allowed'
          }`}
        >
          {isPending ? (
            <LoadingSpinner className="w-5 h-5" />
          ) : (
            <Send className="h-5 w-5" />
          )}
        </button>
      </div>
      
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        onChange={handleFileChange}
        className="hidden"
      />
      
      {/* Status messages */}
      {disabled && (
        <p className="text-center text-sm text-neutral-500 mt-2">
          {language === 'no' 
            ? 'Denne brukeren er ikke tilgjengelig for meldinger'
            : 'This user is not available for messages'
          }
        </p>
      )}
      
      {isUploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-brand-600 mt-2">
          <LoadingSpinner className="w-4 h-4" />
          <span>{t.composer.uploading}</span>
        </div>
      )}

      {/* React 19 Status Indicator */}
      <div className="flex items-center justify-between mt-2 text-xs text-neutral-500">
        <div className="flex items-center">
          <span className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium">
            React 19 Actions
          </span>
          <span className="ml-2">Optimistiske oppdateringer aktivert</span>
        </div>
        
        {isPending && (
          <div className="flex items-center text-orange-600">
            <LoadingSpinner className="w-3 h-3 mr-1" />
            <span>Sender...</span>
          </div>
        )}
      </div>
    </div>
  );
}