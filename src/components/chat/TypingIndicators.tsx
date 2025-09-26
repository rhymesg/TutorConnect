'use client';

import { TypingIndicator } from '@/types/chat';

interface TypingIndicatorsProps {
  typingUsers: TypingIndicator[];
  currentUserId: string;
  className?: string;
  showAvatars?: boolean;
  maxDisplayUsers?: number;
  autoHideDelay?: number;
}

export default function TypingIndicators({
  typingUsers,
  currentUserId,
  className = '',
}: TypingIndicatorsProps) {
  // Since we removed real-time typing indicators, always return null
  return null;
}
