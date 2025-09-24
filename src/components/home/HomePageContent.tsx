'use client';

import Link from 'next/link';
import { GraduationCap, Users } from 'lucide-react';
import StatsSection from './StatsSection';
import { useLanguageText } from '@/contexts/LanguageContext';

export default function HomePageContent() {
  const t = useLanguageText();

  return (
    <div className="flex-1">
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 py-12 sm:py-20 lg:py-24">
        <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              {t('Finn din perfekte', 'Find your perfect')}{' '}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                {t('lærer', 'tutor')}
              </span>{' '}
              {t('eller', 'or')}{' '}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                {t('student', 'student')}
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-blue-100 text-pretty">
              {t(
                'TutorConnect kobler sammen lærere og studenter som ønsker å dele kunnskap i hele Norge. Fra matematikk til musikk, barn til voksne - finn den perfekte matchen for dine behov.',
                'TutorConnect connects tutors and students across Norway who want to share knowledge. From maths to music, kids to adults – find the perfect match for your goals.'
              )}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Link
                href="/posts/teachers"
                className="btn-primary px-6 py-3 text-base min-w-[200px] justify-center gap-2 shadow-lg shadow-brand-500/10 hover:shadow-brand-600/20 transition-transform hover:-translate-y-0.5"
              >
                <GraduationCap className="h-5 w-5" />
                {t('Finn en lærer', 'Find a tutor')}
              </Link>
              <Link
                href="/posts/students"
                className="btn-secondary px-6 py-3 text-base min-w-[200px] justify-center gap-2 border border-white/30 bg-white/90 text-brand-600 backdrop-blur hover:bg-white shadow-lg shadow-brand-500/10 hover:shadow-brand-600/20 transition-transform hover:-translate-y-0.5"
              >
                <Users className="h-5 w-5" />
                {t('Finn en student', 'Find a student')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              {t('Hvorfor velge TutorConnect?', 'Why choose TutorConnect?')}
            </h2>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            <div className="card text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
                <svg className="h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-neutral-900">
                {t('Mangfoldig fellesskap', 'Diverse community')}
              </h3>
              <p className="mt-2 text-neutral-600">
                {t('Finn lærere med ulik bakgrunn og ekspertise som passer dine behov', 'Discover tutors with different backgrounds and expertise that fit your needs')}
              </p>
            </div>

            <div className="card text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
                <svg className="h-8 w-8 text-success-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-neutral-900">
                {t('Sanntid chat', 'Real-time chat')}
              </h3>
              <p className="mt-2 text-neutral-600">
                {t('Kommuniser direkte med lærere og studenter via vår innebygde chat-funksjon', 'Talk directly with tutors and students through our built-in chat')}
              </p>
            </div>

            <div className="card text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning-100">
                <svg className="h-8 w-8 text-warning-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-neutral-900">
                {t('Enkel booking', 'Easy scheduling')}
              </h3>
              <p className="mt-2 text-neutral-600">
                {t('Book timer direkte gjennom plattformen med automatiske påminnelser', 'Book sessions directly through the platform with automatic reminders')}
              </p>
            </div>
          </div>
        </div>
      </section>

      <StatsSection />

      <section className="bg-neutral-900 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t('Klar til å begynne?', 'Ready to get started?')}
          </h2>
          <p className="mt-4 text-lg text-neutral-300 text-pretty">
            {t('Opplev læring der du vil - på din måte, i ditt tempo, på ditt sted', 'Experience learning your way – at your pace, in your place, on your terms')}
          </p>
          <div className="mt-8 flex items-center justify-center gap-x-6">
            <a href="/auth/register" className="btn-primary">
              {t('Opprett konto', 'Create account')}
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
