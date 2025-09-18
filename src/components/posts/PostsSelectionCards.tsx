'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function PostsSelectionCards() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const cards = [
    {
      href: '/posts/teachers',
      title: 'Finn en lærer',
      description: 'Søk blant erfarne lærere i ditt fagområde',
      accent: 'green',
      cta: 'Se alle lærere',
      iconPath:
        'M12 2C13.1 2 14 2.9 14 4C14 5.1 13.1 6 12 6C10.9 6 10 5.1 10 4C10 2.9 10.9 2 12 2ZM21 9V7L15 3.5C14.5 3.2 14 3 13.5 3H10.5C10 3 9.5 3.2 9 3.5L3 7V9H5V20C5 20.6 5.4 21 6 21H18C18.6 21 19 20.6 19 20V9H21ZM7 9H17V19H16V17C16 16.4 15.6 16 15 16H9C8.4 16 8 16.4 8 17V19H7V9Z',
    },
    {
      href: '/posts/students',
      title: 'Finn en student',
      description: 'Hjelp studenter i ditt fagområde',
      accent: 'blue',
      cta: 'Se alle studenter',
      iconPath:
        'M12 3L1 9L12 15L21 11.09V17H23V9L12 3ZM18.82 9L12 12.72L5.18 9L12 5.28L18.82 9ZM17 16L12 13L7 16L12 19L17 16Z',
    },
  ] as const;

  const getAccentClasses = (accent: 'green' | 'blue') => {
    if (accent === 'green') {
      return {
        card: 'hover:border-green-300',
        circle: 'bg-green-100 group-hover:bg-green-200',
        title: 'group-hover:text-green-700',
        cta: 'text-green-600 group-hover:text-green-700',
      } as const;
    }

    return {
      card: 'hover:border-blue-300',
      circle: 'bg-blue-100 group-hover:bg-blue-200',
      title: 'group-hover:text-blue-700',
      cta: 'text-blue-600 group-hover:text-blue-700',
    } as const;
  };

  if (!isMounted) {
    return (
      <div className="container mx-auto px-4 py-12">
        <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
          {cards.map((card) => (
            <div key={card.href} className="group relative rounded-xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
              <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-neutral-100">
                <svg className="h-8 w-8 text-neutral-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d={card.iconPath} />
                </svg>
              </div>
              <h2 className="mb-3 text-2xl font-bold text-neutral-900">{card.title}</h2>
              <p className="mb-4 text-neutral-600">{card.description}</p>
              <div className="inline-flex items-center font-medium text-neutral-500">
                {card.cta}
                <svg className="ml-2 h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                </svg>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-2">
        {cards.map((card) => {
          const accent = getAccentClasses(card.accent);

          return (
            <Link
              key={card.href}
              href={card.href}
              className={`group relative w-full rounded-xl border border-neutral-200 bg-white p-8 text-left text-center shadow-sm transition-all duration-200 hover:shadow-lg ${accent.card}`}
            >
              <div className={`mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full transition-colors ${accent.circle}`}>
                <svg className={`h-8 w-8 ${card.accent === 'green' ? 'text-green-600' : 'text-blue-600'}`} fill="currentColor" viewBox="0 0 24 24">
                  <path d={card.iconPath} />
                </svg>
              </div>
              <h2 className={`mb-3 text-2xl font-bold text-neutral-900 transition-colors ${accent.title}`}>
                {card.title}
              </h2>
              <p className="mb-4 text-neutral-600">{card.description}</p>
              <div className={`inline-flex items-center font-medium transition-colors ${accent.cta}`}>
                {card.cta}
                <svg className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z" />
                </svg>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
