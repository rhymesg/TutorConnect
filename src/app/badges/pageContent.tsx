'use client';

import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useLanguageText } from '@/contexts/LanguageContext';

interface BadgeTier {
  name: string;
  icon: string;
  color: string;
  sessions: number;
  users: number;
}

export function BadgesContent() {
  const t = useLanguageText();

  const badgeTiers: BadgeTier[] = [
    { name: t('Bronse', 'Bronze'), icon: '🥉', color: 'text-orange-800 bg-orange-200', sessions: 2, users: 1 },
    { name: t('Sølv', 'Silver'), icon: '🥈', color: 'text-slate-500 bg-slate-200', sessions: 10, users: 2 },
    { name: t('Gull', 'Gold'), icon: '🥇', color: 'text-yellow-600 bg-yellow-100', sessions: 50, users: 5 },
    { name: t('Platina', 'Platinum'), icon: '🏆', color: 'text-purple-600 bg-purple-100', sessions: 200, users: 10 },
  ];

  const backLabel = t('Tilbake', 'Back');
  const pageTitle = t('TutorConnect merkesystem', 'TutorConnect badge system');
  const introLead = t(
    'Tjen merker basert på din aktivitet som lærer og student på plattformen.',
    'Earn badges based on your activity as a tutor and student on the platform.',
  );
  const introBody = t(
    'Merker viser din erfaring og troverdighet på TutorConnect – de representerer hvor stabil og engasjert du er som pålitelig lærer eller dedikert student.',
    'Badges showcase your experience and credibility on TutorConnect—they represent how consistent and engaged you are as a trusted tutor or dedicated student.',
  );

  const teacherTitle = t('Lærerverdier', 'Tutor badges');
  const teacherSubtitle = t('Tjen merker ved å undervise andre studenter og fullføre økter.', 'Earn badges by teaching and completing sessions.');
  const teacherBadgeLabel = t('Lærermerke', 'Tutor badge');

  const studentTitle = t('Studentmerker', 'Student badges');
  const studentSubtitle = t('Tjen merker ved å ta timer med forskjellige lærere og fullføre økter.', 'Earn badges by booking lessons with tutors and completing sessions.');
  const studentBadgeLabel = t('Studentmerke', 'Student badge');

  const sessionLabel = t('økter', 'sessions');
  const studentCountLabel = t('elever', 'students');
  const tutorCountLabel = t('lærere', 'tutors');

  const howItWorksTitle = t('Hvordan det fungerer', 'How it works');
  const howItWorksSteps = [
    t('• Opprett eller finn annonser: Lag din egen annonse eller finn en annonse som passer dine behov', '• Create or find ads: Post your own ad or browse one that fits your needs'),
    t('• Kontakt og book økt: Ta kontakt gjennom chat-systemet og avtale en økt', '• Contact and book: Reach out through chat and schedule a session'),
    t('• Gjennomfør økten: Møt opp og gjennomfør undervisningen som avtalt', '• Complete the session: Show up and teach or learn as agreed'),
    t('• Marker som fullført: Begge parter markerer økten som "fullført" i avtalesystemet', '• Mark as completed: Both parties mark the session as “completed” in the appointment flow'),
    t('• Automatisk tildeling: Merker tildeles automatisk basert på dine fullførte økter og antall unike personer du har jobbet med', '• Automatic awards: Badges are granted automatically based on completed sessions and how many unique people you work with'),
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            {backLabel}
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-4">{pageTitle}</h1>
          <p className="text-lg text-gray-700 mb-2">{introLead}</p>
          <p className="text-base text-gray-600">{introBody}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">👨‍🏫</span>
              <h2 className="text-xl font-semibold text-gray-900">{teacherTitle}</h2>
            </div>
            <p className="text-gray-600 mb-6">{teacherSubtitle}</p>

            <div className="space-y-4">
              {badgeTiers.map((badge) => (
                <div key={`teacher-${badge.name}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium mr-4 ${badge.color}`}>
                      <span className="mr-1">👨‍🏫</span>
                      <span>{badge.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{badge.name}</h3>
                      <p className="text-sm text-gray-600">{teacherBadgeLabel}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>{badge.sessions} {sessionLabel}</div>
                    <div>{badge.users} {studentCountLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">🎓</span>
              <h2 className="text-xl font-semibold text-gray-900">{studentTitle}</h2>
            </div>
            <p className="text-gray-600 mb-6">{studentSubtitle}</p>

            <div className="space-y-4">
              {badgeTiers.map((badge) => (
                <div key={`student-${badge.name}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium mr-4 ${badge.color}`}>
                      <span className="mr-1">🎓</span>
                      <span>{badge.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{badge.name}</h3>
                      <p className="text-sm text-gray-600">{studentBadgeLabel}</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>{badge.sessions} {sessionLabel}</div>
                    <div>{badge.users} {tutorCountLabel}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">{howItWorksTitle}</h2>
          <div className="text-sm text-gray-600 space-y-2">
            {howItWorksSteps.map((step, index) => (
              <p key={index}>{step}</p>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
