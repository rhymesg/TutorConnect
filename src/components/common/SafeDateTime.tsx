'use client';

import { useState, useEffect } from 'react';

interface SafeDateTimeProps {
  dateTime: string;
  language: 'no' | 'en';
}

export default function SafeDateTime({ dateTime, language }: SafeDateTimeProps) {
  const [localTime, setLocalTime] = useState<string | null>(null);

  useEffect(() => {
    try {
      const date = new Date(dateTime);
      const today = new Date();
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Use local timezone for display
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${minutes}`;

      // Date comparison
      const dateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());
      const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const tomorrowOnly = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

      if (dateOnly.getTime() === todayOnly.getTime()) {
        setLocalTime(`${language === 'no' ? 'I dag' : 'Today'} ${timeString}`);
      } else if (dateOnly.getTime() === tomorrowOnly.getTime()) {
        setLocalTime(`${language === 'no' ? 'I morgen' : 'Tomorrow'} ${timeString}`);
      } else {
        const day = date.getDate();
        const month = date.getMonth() + 1;
        setLocalTime(`${day}/${month} ${timeString}`);
      }
    } catch (error) {
      setLocalTime(dateTime);
    }
  }, [dateTime, language]);

  // Server-rendered fallback (SEO-friendly)
  const serverFallback = new Date(dateTime).toISOString().slice(0, 16).replace('T', ' ');

  return (
    <time dateTime={dateTime} suppressHydrationWarning>
      {localTime ?? serverFallback}
    </time>
  );
}