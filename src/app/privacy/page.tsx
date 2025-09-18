import { Metadata } from 'next';
import { formatOsloDate } from '@/lib/datetime';

export const metadata: Metadata = {
  title: 'Personvernpolicy',
  description: 'TutorConnect sin personvernpolicy - under utvikling.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function PrivacyPage() {
  const lastUpdatedDisplay = formatOsloDate(new Date('2025-01-10T00:00:00Z'), 'nb-NO', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Personvernpolicy
          </h1>
          <p className="mt-4 text-lg text-neutral-600">
            Hvordan TutorConnect behandler dine personopplysninger
          </p>
        </div>

        {/* Privacy policy content */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="p-8 space-y-8">
            <div className="text-sm text-neutral-500">
              <p>Sist oppdatert: {lastUpdatedDisplay}</p>
            </div>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">1. Behandlingsansvarlig</h2>
              <div className="space-y-4 text-neutral-700">
                <p>
                  TutorConnect ("vi", "oss", "vår") er behandlingsansvarlig for dine personopplysninger 
                  i henhold til personvernforordningen (GDPR) og norsk personopplysningslov.
                </p>
                <div className="p-4 bg-neutral-50 rounded-lg">
                  <p><strong>Kontaktinformasjon:</strong></p>
                  <p>TutorConnect</p>
                  <p>E-post: <a href="mailto:contact@tutorconnect.no" className="text-brand-600 hover:text-brand-700">contact@tutorconnect.no</a></p>
                  <p>Nettside: tutorconnect.no</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">2. Personopplysninger vi samler inn</h2>
              <div className="space-y-4 text-neutral-700">
                <p>Vi samler inn følgende personopplysninger når du oppretter en konto:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2">✓ Opplysninger vi samler inn:</h4>
                    <ul className="text-sm text-green-800 space-y-1">
                      <li>• E-postadresse (for innlogging og kommunikasjon)</li>
                      <li>• Brukernavn (offentlig visning)</li>
                      <li>• Region/fylke (for geografisk matching)</li>
                      <li>• Alder (for alderstilpasset innhold)</li>
                      <li>• Kjønn (valgfritt, for preferanser)</li>
                      <li>• Annonsetekst og profilinnhold (som du publiserer)</li>
                      <li>• Chatmeldinger (lagres for plattformfunksjonalitet)</li>
                    </ul>
                  </div>
                  <div className="p-4 bg-red-50 rounded-lg">
                    <h4 className="font-medium text-red-900 mb-2">✗ Opplysninger vi IKKE samler inn:</h4>
                    <ul className="text-sm text-red-800 space-y-1">
                      <li>• Personnummer eller ID-numre</li>
                      <li>• Fullstendig adresse</li>
                      <li>• Telefonnummer</li>
                      <li>• Betalingsinformasjon</li>
                      <li>• Sensitive personopplysninger</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">3. Formål og rettslig grunnlag</h2>
              <div className="space-y-4 text-neutral-700">
                <p>Vi behandler dine personopplysninger for følgende formål:</p>
                <div className="space-y-4">
                  <div className="p-4 border border-neutral-200 rounded-lg">
                    <h4 className="font-medium text-neutral-900">Kontoopprettelse og -administrasjon</h4>
                    <p className="text-sm text-neutral-600 mt-2">
                      <strong>Rettslig grunnlag:</strong> Avtale (GDPR art. 6(1)(b)) - nødvendig for å yte tjenesten
                    </p>
                  </div>
                  <div className="p-4 border border-neutral-200 rounded-lg">
                    <h4 className="font-medium text-neutral-900">Matching mellom lærere og studenter</h4>
                    <p className="text-sm text-neutral-600 mt-2">
                      <strong>Rettslig grunnlag:</strong> Berettiget interesse (GDPR art. 6(1)(f)) - tilby relevant matching
                    </p>
                  </div>
                  <div className="p-4 border border-neutral-200 rounded-lg">
                    <h4 className="font-medium text-neutral-900">Kommunikasjon og meldinger</h4>
                    <p className="text-sm text-neutral-600 mt-2">
                      <strong>Rettslig grunnlag:</strong> Berettiget interesse (GDPR art. 6(1)(f)) - nødvendig for chatfunksjonalitet
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      Chatmeldinger lagres for å opprettholde samtalehistorikk og plattformfunksjonalitet
                    </p>
                  </div>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">4. Lagring og sletting</h2>
              <div className="space-y-4 text-neutral-700">
                <p>Vi lagrer dine personopplysninger så lenge det er nødvendig for formålene beskrevet ovenfor:</p>
                <ul className="space-y-2 list-disc pl-6">
                  <li><strong>Aktive kontoer:</strong> Så lenge kontoen er aktiv</li>
                  <li><strong>Inaktive kontoer:</strong> Slettes automatisk etter 2 år uten aktivitet</li>
                  <li><strong>Ved kontosletting:</strong> Alle personopplysninger slettes innen 30 dager</li>
                  <li><strong>Chatmeldinger:</strong> Lagres permanent så lenge begge brukere har aktive kontoer</li>
                  <li><strong>Ved én brukers sletting:</strong> Meldingshistorikk blir anonymisert for den andre brukeren</li>
                </ul>
                
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg mt-4">
                  <h4 className="font-medium text-blue-900 mb-2">💬 Om chatmeldinger</h4>
                  <p className="text-sm text-blue-800">
                    Chatmeldinger lagres for å opprettholde samtalehistorikk mellom brukere. Hvis du ønsker 
                    å slette spesifikke samtaler, kan du kontakte oss på contact@tutorconnect.no.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">5. Dine rettigheter</h2>
              <div className="space-y-4 text-neutral-700">
                <p>Du har følgende rettigheter under GDPR:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">Rett til innsyn</h4>
                      <p className="text-sm text-blue-800">Se hvilke opplysninger vi har om deg</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">Rett til retting</h4>
                      <p className="text-sm text-blue-800">Korrigere feil i dine opplysninger</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">Rett til sletting</h4>
                      <p className="text-sm text-blue-800">Be om at opplysninger slettes</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">Rett til dataportabilitet</h4>
                      <p className="text-sm text-blue-800">Få dine data i maskinlesbart format</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">Rett til innsigelse</h4>
                      <p className="text-sm text-blue-800">Motsette deg behandling</p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900">Klagerett</h4>
                      <p className="text-sm text-blue-800">Klage til Datatilsynet</p>
                    </div>
                  </div>
                </div>
                <p className="text-sm">
                  For å utøve dine rettigheter, send e-post til: 
                  <a href="mailto:contact@tutorconnect.no" className="text-brand-600 hover:text-brand-700 ml-1">contact@tutorconnect.no</a>
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">6. Datasikkerhet</h2>
              <div className="space-y-4 text-neutral-700">
                <p>Vi implementerer passende tekniske og organisatoriske sikkerhetstiltak:</p>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-2 list-disc pl-6">
                    <li>SSL/TLS-kryptering av all datatransport</li>
                    <li>Krypterte passord med bcrypt</li>
                    <li>Regelmessige sikkerhetskontroller</li>
                    <li>Begrenset tilgang til persondata</li>
                  </ul>
                  <ul className="space-y-2 list-disc pl-6">
                    <li>Sikker databaselagring</li>
                    <li>Automatiske sikkerhetskopier</li>
                    <li>Overvåking av systemaktivitet</li>
                    <li>Oppdaterte sikkerhetsprosedyrer</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">7. Deling med tredjeparter</h2>
              <div className="space-y-4 text-neutral-700">
                <p>Vi deler ikke dine personopplysninger med tredjeparter, unntatt:</p>
                <ul className="space-y-2 list-disc pl-6">
                  <li><strong>Tjenesteleverandører:</strong> Hosting og infrastruktur (Supabase/Vercel) under databehandleravtaler</li>
                  <li><strong>Juridiske krav:</strong> Når det kreves av norsk lov eller myndigheter</li>
                  <li><strong>Samtykke:</strong> Når du har gitt eksplisitt samtykke</li>
                </ul>
                <p className="text-sm bg-green-50 p-3 rounded-lg">
                  <strong>Viktig:</strong> Vi selger aldri dine personopplysninger til tredjeparter.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">8. Informasjonskapsler (cookies)</h2>
              <p className="text-neutral-700">
                Vi bruker kun nødvendige informasjonskapsler for innlogging og sikkerhet. 
                Vi bruker ikke sporings- eller markedsføringscookies. Du kan administrere 
                cookie-innstillinger i din nettleser.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">9. Endringer i personvernpolicyen</h2>
              <p className="text-neutral-700">
                Vi kan oppdatere denne personvernpolicyen fra tid til annen. Vesentlige endringer 
                vil bli kommunisert via e-post eller gjennom plattformen. Vi oppfordrer deg til 
                å gjennomgå denne policyen regelmessig.
              </p>
            </section>

            <div className="mt-12 pt-6 border-t border-neutral-200">
              <div className="space-y-4 mb-6">
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-yellow-900">
                        ⚠️ Viktig: Ingen brukerverifisering
                      </h3>
                      <p className="mt-1 text-sm text-yellow-800">
                        TutorConnect verifiserer ikke brukeres identitet, kvalifikasjoner eller bakgrunn. 
                        Vi er kun en plattform for annonser og meldinger. Brukere må selv verifisere 
                        informasjon før møter eller avtaler.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <div className="flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium text-blue-900">
                        GDPR-kompatibel behandling
                      </h3>
                      <p className="mt-1 text-sm text-blue-700">
                        Denne personvernpolicyen er utarbeidet i samsvar med GDPR og norsk personopplysningslov. 
                        Vi følger prinsippene om dataminimalisering, formålsbegrensning og gjennomsiktighet.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <a href="/" className="btn-ghost">
                  ← Gå tilbake
                </a>
                <a href="/om-oss#kontakt" className="btn-primary">
                  Kontakt oss for spørsmål
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="mt-12 text-center text-sm text-neutral-500">
          <p>
            For personvernspørsmål, kontakt oss på{' '}
            <a href="mailto:contact@tutorconnect.no" className="text-brand-600 hover:text-brand-700">
              contact@tutorconnect.no
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
