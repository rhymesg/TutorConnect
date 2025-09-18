'use client';

import LoadingSpinner from '@/components/ui/LoadingSpinner';

export default function ChatLoadingSkeleton() {
  return (
    <div className="flex flex-1 items-center justify-center bg-white">
      <LoadingSpinner size="lg" />
    </div>
  );
}
