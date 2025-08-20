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

      {/* Footer */}
      <footer className="bg-white border-t border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center space-y-4">
            {/* Links */}
            <div className="flex justify-center space-x-6 text-sm">
              <Link
                href="/om-oss"
                className="text-neutral-600 hover:text-neutral-900 focus:outline-none focus:underline"
              >
                Om oss
              </Link>
              <Link
                href="/terms"
                className="text-neutral-600 hover:text-neutral-900 focus:outline-none focus:underline"
              >
                Vilkår
              </Link>
              <Link
                href="/privacy"
                className="text-neutral-600 hover:text-neutral-900 focus:outline-none focus:underline"
              >
                Personvern
              </Link>
              <Link
                href="/om-oss#kontakt"
                className="text-neutral-600 hover:text-neutral-900 focus:outline-none focus:underline"
              >
                Kontakt
              </Link>
            </div>

            {/* Copyright */}
            <div className="text-xs text-neutral-500">
              <p>© {new Date().getFullYear()} TutorConnect. Alle rettigheter forbeholdt.</p>
              <p className="mt-1">
                Sikker plattform for privatlæring i Norge
              </p>
            </div>

            {/* Security badges */}
            <div className="flex justify-center items-center space-x-4 text-xs text-neutral-400">
              <div className="flex items-center space-x-1">
                <svg className="h-4 w-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
                <span>SSL-sikret</span>
              </div>
              <div className="flex items-center space-x-1">
                <svg className="h-4 w-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>GDPR-kompatibel</span>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}