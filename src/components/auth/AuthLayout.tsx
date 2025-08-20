'use client';

import { ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface AuthLayoutProps {
  children: ReactNode;
  title?: string;
  description?: string;
  showBackToHome?: boolean;
}

export default function AuthLayout({ 
  children, 
  title = 'TutorConnect',
  description = 'Norges ledende plattform for privatlæring',
  showBackToHome = true
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col">
      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="w-full max-w-md">
          {children}
        </div>
      </main>

    </div>
  );
}