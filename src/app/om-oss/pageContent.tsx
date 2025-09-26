'use client';

import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { useLanguageText } from '@/contexts/LanguageContext';

export function OmniContent() {
  const t = useLanguageText();
  const title = t('Om TutorConnect', 'About TutorConnect');
  const storyParagraphs = [
    t('Som far som ønsket bedre læringsmuligheter for datteren min utenfor skolen, opprettet jeg TutorConnect.', 'As a dad who wanted better learning opportunities for my daughter outside of school, I created TutorConnect.'),
    t('Her deler vi vårt talent, kunnskap og tid for å hjelpe hverandre med å lære.', 'Here we share our talent, knowledge, and time to help each other learn.'),
    t('Jeg ser frem til dine ærlige tilbakemeldinger!', 'I look forward to your honest feedback!'),
  ];
  const contactHeading = t('Kontakt oss', 'Contact us');
  const contactDescription = t('Har du spørsmål, tilbakemeldinger eller forslag? Ta gjerne kontakt!', 'Questions, feedback, or ideas? We would love to hear from you!');
  const footerText = t('TutorConnect - læring der du vil', 'TutorConnect – learning wherever you are');

  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <section className="mb-16">
          <h1 className="text-4xl font-bold text-neutral-900 mb-8">{title}</h1>

          <div className="prose prose-lg max-w-none">
            {storyParagraphs.map((paragraph, index) => (
              <p
                key={index}
                className={`text-lg text-neutral-700 ${index < storyParagraphs.length - 1 ? 'mb-6' : ''}`}
              >
                {paragraph}
              </p>
            ))}
          </div>
        </section>

        <section id="kontakt" className="bg-white rounded-lg shadow-sm p-8 scroll-mt-20">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">{contactHeading}</h2>

          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="bg-brand-50 rounded-full p-3">
                <EnvelopeIcon className="h-6 w-6 text-brand-600" />
              </div>
            </div>

            <div>
              <p className="text-neutral-700 mb-2">{contactDescription}</p>
              <a
                href="mailto:contact@tutorconnect.no"
                className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
              >
                contact@tutorconnect.no
              </a>
            </div>
          </div>
        </section>

        <section className="mt-12 text-center">
          <p className="text-sm text-neutral-600">{footerText}</p>
        </section>
      </div>
    </div>
  );
}
