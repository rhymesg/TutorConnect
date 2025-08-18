'use client';

import { useState, useRef, useCallback } from 'react';
import { Send, Paperclip, Smile, Mic, X, Image, FileText, Calendar } from 'lucide-react';
import { Message } from '@/types/chat';
import { Language, chat as chatTranslations } from '@/lib/translations';

interface MessageComposerProps {
  onSendMessage: (content: string, type?: Message['type']) => Promise<void>;
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

export default function MessageComposer({
  onSendMessage,
  onStartTyping,
  onStopTyping,
  language,
  disabled = false,
  placeholder,
}: MessageComposerProps) {
  const t = chatTranslations[language];
  
  const [message, setMessage] = useState('');
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

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

  const handleSend = async () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage && attachments.length === 0) return;
    if (isSending || disabled) return;

    setIsSending(true);
    onStopTyping?.();
    
    try {
      // TODO: Handle file attachments upload here
      if (attachments.length > 0) {
        // Upload attachments first, then send message with attachment URLs
        console.log('Uploading attachments:', attachments);
      }
      
      await onSendMessage(trimmedMessage);
      
      // Clear input after successful send
      setMessage('');
      setAttachments([]);
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      // TODO: Show error toast/notification
    } finally {
      setIsSending(false);
    }
  };

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

  const canSend = (message.trim() || attachments.length > 0) && !isSending && !disabled;

  return (
    <div className="border-t border-gray-200 p-4 bg-white">
      {/* Attachments Preview */}
      {attachments.length > 0 && (
        <div className="mb-3">
          <div className="flex flex-wrap gap-2">
            {attachments.map(attachment => (
              <div
                key={attachment.id}
                className="relative bg-gray-100 rounded-lg p-2 flex items-center gap-2"
              >
                {attachment.type === 'image' && attachment.preview ? (
                  <img
                    src={attachment.preview}
                    alt="Preview"
                    className="w-8 h-8 rounded object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-gray-200 rounded flex items-center justify-center">
                    {attachment.type === 'image' && <Image className="h-4 w-4 text-gray-500" />}
                    {attachment.type === 'document' && <FileText className="h-4 w-4 text-gray-500" />}
                    {attachment.type === 'audio' && <Mic className="h-4 w-4 text-gray-500" />}
                  </div>
                )}
                
                <span className="text-sm text-gray-700 max-w-32 truncate">
                  {attachment.file.name}
                </span>
                
                {attachment.uploading && (
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                )}
                
                <button
                  onClick={() => removeAttachment(attachment.id)}
                  className="text-gray-400 hover:text-red-500"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      <div className="flex items-end gap-2">
        {/* Attachment Menu */}
        <div className="relative">
          <button
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            disabled={disabled}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Paperclip className="h-5 w-5" />
          </button>
          
          {showAttachMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
              <button
                onClick={() => handleFileSelect('image/*')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
              >
                <Image className="h-4 w-4 text-blue-500" />
                {t.composer.attachments.image}
              </button>
              
              <button
                onClick={() => handleFileSelect('.pdf,.doc,.docx,.txt')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <FileText className="h-4 w-4 text-green-500" />
                {t.composer.attachments.document}
              </button>
              
              <button
                onClick={() => handleFileSelect('audio/*')}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50"
              >
                <Mic className="h-4 w-4 text-purple-500" />
                {t.composer.attachments.audio}
              </button>
              
              <button
                onClick={() => {
                  setShowAttachMenu(false);
                  // TODO: Open appointment booking modal
                }}
                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-b-lg"
              >
                <Calendar className="h-4 w-4 text-orange-500" />
                {t.appointment.request}
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
            disabled={disabled}
            className="w-full resize-none border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ minHeight: '40px', maxHeight: '120px' }}
          />
          
          {/* Emoji button - positioned inside textarea */}
          <button
            className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 p-1"
            disabled={disabled}
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
          onClick={handleSend}
          disabled={!canSend}
          className={`p-2 rounded-lg transition-colors ${
            canSend
              ? 'bg-blue-500 text-white hover:bg-blue-600'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
        >
          {isSending ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
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
        <p className="text-center text-sm text-gray-500 mt-2">
          {language === 'no' 
            ? 'Denne brukeren er ikke tilgjengelig for meldinger'
            : 'This user is not available for messages'
          }
        </p>
      )}
      
      {isUploading && (
        <div className="flex items-center justify-center gap-2 text-sm text-blue-600 mt-2">
          <Upload className="h-4 w-4 animate-bounce" />
          <span>{t.composer.uploading}</span>
        </div>
      )}
    </div>
    </div>
  );
}