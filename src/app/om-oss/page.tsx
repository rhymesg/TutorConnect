import { Metadata } from 'next';
import { EnvelopeIcon } from '@heroicons/react/24/outline';

export const metadata: Metadata = {
  title: 'Om oss | TutorConnect',
  description: 'Les historien bak TutorConnect og hvordan vi hjelper elever og lærere å finne hverandre.',
};

export default function OmOssPage() {
  return (
    <div className="min-h-screen bg-neutral-50">
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Main Story Section */}
        <section className="mb-16">
          <h1 className="text-4xl font-bold text-neutral-900 mb-8">Om TutorConnect</h1>
          
          <div className="prose prose-lg max-w-none">
            <p className="text-lg text-neutral-700 mb-6">
              Som far som ønsket bedre læringsmuligheter for datteren min utenfor skolen, opprettet jeg TutorConnect.
            </p>
            <p className="text-lg text-neutral-700 mb-6">
              Her deler vi vårt talent, kunnskap og tid for å hjelpe hverandre med å lære.
            </p>
            <p className="text-lg text-neutral-700">
              Jeg ser frem til dine ærlige tilbakemeldinger!
            </p>
          </div>
        </section>

        {/* Contact Section */}
        <section id="kontakt" className="bg-white rounded-lg shadow-sm p-8 scroll-mt-20">
          <h2 className="text-2xl font-bold text-neutral-900 mb-6">Kontakt oss</h2>
          
          <div className="flex items-start space-x-4">
            <div className="flex-shrink-0">
              <div className="bg-brand-50 rounded-full p-3">
                <EnvelopeIcon className="h-6 w-6 text-brand-600" />
              </div>
            </div>
            
            <div>
              <p className="text-neutral-700 mb-2">
                Har du spørsmål, tilbakemeldinger eller forslag? Ta gjerne kontakt!
              </p>
              <a 
                href="mailto:contact@tutorconnect.no"
                className="text-brand-600 hover:text-brand-700 font-medium transition-colors"
              >
                contact@tutorconnect.no
              </a>
            </div>
          </div>
        </section>

        {/* Additional Info Section */}
        <section className="mt-12 text-center">
          <p className="text-sm text-neutral-600">
            TutorConnect - der kunnskap møter behov
          </p>
        </section>
      </div>
    </div>
  );
}