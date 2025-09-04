'use client';

import { useEffect, useState } from 'react';

interface PlatformStats {
  teachers: number;
  students: number;
  subjects: number;
  totalPosts: number;
}

export default function StatsSection() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        console.log('Fetching stats from /api/stats...');
        const response = await fetch('/api/stats');
        console.log('Response status:', response.status, response.statusText);
        
        if (response.ok) {
          const data = await response.json();
          console.log('Stats data received:', data);
          setStats(data);
        } else {
          const errorText = await response.text();
          console.error('API response not ok:', response.status, errorText);
        }
      } catch (error) {
        console.error('Failed to fetch stats:', error);
        console.error('Error details:', {
          name: error instanceof Error ? error.name : 'Unknown',
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        // Keep stats as null to show fallback content
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Show loading state
  if (loading) {
    return (
      <section className="bg-brand-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Del av et voksende læringsfellesskap
            </h2>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="text-center">
                <div className="animate-pulse">
                  <div className="h-10 w-20 bg-neutral-200 rounded mx-auto mb-2"></div>
                  <div className="h-4 w-32 bg-neutral-200 rounded mx-auto"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Show real stats (always show if we have stats data, even if 0)
  return (
    <section className="bg-brand-50 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            {stats ? "Del av et voksende læringsfellesskap" : "Hvorfor TutorConnect?"}
          </h2>
        </div>
        
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {stats ? (
            // Show real statistics (including 0 values)
            <>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-600">{stats.teachers}</div>
                <div className="mt-2 text-sm font-medium text-neutral-600">
                  {stats.teachers === 1 ? 'Engasjert lærer' : 'Engasjerte lærere'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-600">{stats.students}</div>
                <div className="mt-2 text-sm font-medium text-neutral-600">
                  {stats.students === 1 ? 'Inspirert student' : 'Inspirerte studenter'}
                </div>
              </div>
              
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-600">{stats.subjects}</div>
                <div className="mt-2 text-sm font-medium text-neutral-600">
                  {stats.subjects === 1 ? 'Fag tilgjengelig' : 'Fag tilgjengelig'}
                </div>
              </div>
            </>
          ) : (
            // Show platform benefits only when API fails
            <>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-600">Gratis</div>
                <div className="mt-2 text-sm font-medium text-neutral-600">Ingen skjulte kostnader</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-600">Direkte</div>
                <div className="mt-2 text-sm font-medium text-neutral-600">Kontakt lærere uten mellomledd</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold text-brand-600">Fleksibelt</div>
                <div className="mt-2 text-sm font-medium text-neutral-600">Avtale tid og sted som passer</div>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}