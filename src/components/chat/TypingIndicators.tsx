'use client';

import { TypingIndicator } from '@/types/chat';
import { Language } from '@/lib/translations';

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
}: TypingIndicatorsProps) {
  // Since we removed real-time typing indicators, always return null
  return null;
}