import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Vilkår for bruk',
  description: 'TutorConnect sine vilkår for bruk - under utvikling.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-neutral-50 py-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
            Vilkår for bruk
          </h1>
          <p className="mt-4 text-lg text-neutral-600">
            TutorConnect sine brukervilkår
          </p>
        </div>

        {/* Terms content */}
        <div className="bg-white rounded-lg shadow-sm border border-neutral-200">
          <div className="p-8 space-y-8">
            <div className="text-sm text-neutral-500">
              <p>Sist oppdatert: {new Date().toLocaleDateString('no-NO')}</p>
            </div>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">1. Om TutorConnect</h2>
              <p className="text-neutral-700 mb-4">
                TutorConnect ("vi", "oss", "vår") er en digital plattform som forbinder lærere og studenter 
                for privatlæring i Norge. Plattformen er underlagt norsk rett.
              </p>
              <p className="text-neutral-700">
                Ved å bruke vår tjeneste aksepterer du disse vilkårene for bruk ("Vilkårene").
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">2. Brukerens ansvar</h2>
              <div className="space-y-4 text-neutral-700">
                <p>Som bruker av TutorConnect forplikter du deg til å:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Være minst 13 år gammel, eller ha samtykke fra foresatte</li>
                  <li>Oppgi korrekte og oppdaterte opplysninger i din profil</li>
                  <li>Behandle andre brukere med respekt</li>
                  <li>Ikke misbruke plattformen til ulovlige eller skadelige formål</li>
                  <li>Ikke dele falsk eller villedende informasjon</li>
                  <li>Beskytte dine innloggingsopplysninger</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">3. Plattformens tjenester</h2>
              <div className="space-y-4 text-neutral-700">
                <p>TutorConnect tilbyr følgende tjenester:</p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Plattform for å publisere og se lærer/student-annonser</li>
                  <li>Søk- og filtreringsverktøy for å finne relevante annonser</li>
                  <li>Meldingsystem for kommunikasjon mellom brukere</li>
                  <li>Profilopprettelse og -administrasjon</li>
                </ul>
                
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">⚠️ Viktig informasjon</h4>
                  <p className="text-sm text-yellow-800">
                    <strong>TutorConnect er kun en annonse- og meldingsplattform.</strong> Vi verifiserer ikke 
                    brukeres identitet, kvalifikasjoner eller bakgrunn. All kommunikasjon, avtaler om 
                    undervisning, møtesteder og betaling er brukerenes eget ansvar.
                  </p>
                </div>

                <p>
                  Vi forbeholder oss retten til å endre, suspendere eller avslutte tjenester 
                  med rimelig varsel.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">4. Innhold og immaterielle rettigheter</h2>
              <div className="space-y-4 text-neutral-700">
                <p>
                  Du beholder rettigheter til innhold du laster opp, men gir TutorConnect 
                  lisens til å bruke innholdet i forbindelse med tjenestene.
                </p>
                <p>
                  TutorConnect sin merkevare, design og teknologi er beskyttet av immaterielle 
                  rettigheter og kan ikke brukes uten tillatelse.
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">5. Ansvarsbegrensning</h2>
              <div className="space-y-4 text-neutral-700">
                <p>
                  TutorConnect fungerer som en plattform for å forbinde lærere og studenter. 
                  Vi er ikke ansvarlige for:
                </p>
                <ul className="list-disc pl-6 space-y-2">
                  <li>Verifikasjon av brukeres identitet, kvalifikasjoner eller bakgrunn</li>
                  <li>Kvaliteten på undervisning eller læringsutbytte</li>
                  <li>Avtaler, betalinger eller møter mellom brukere</li>
                  <li>Tvister mellom lærere og studenter</li>
                  <li>Tap eller skader som oppstår ved bruk av tjenesten</li>
                  <li>Innhold publisert av andre brukere</li>
                  <li>Sikkerhet ved fysiske møter</li>
                </ul>
                
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-900 mb-2">🛡️ Sikkerhetsanbefalinger</h4>
                  <p className="text-sm text-red-800">
                    Vi anbefaler sterkt at brukere:
                  </p>
                  <ul className="text-sm text-red-800 mt-2 space-y-1">
                    <li>• Møtes på offentlige steder</li>
                    <li>• Verifiserer den andre personens identitet selv</li>
                    <li>• Ikke deler personlig informasjon før dere har møttes</li>
                    <li>• Stoler på sin egen dømmekraft</li>
                    <li>• Rapporterer mistenkelig aktivitet til oss</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">6. Oppsigelse</h2>
              <p className="text-neutral-700">
                Du kan når som helst slette din konto. Vi kan suspendere eller avslutte din 
                tilgang hvis du bryter disse vilkårene. Ved oppsigelse slettes dine personopplysninger 
                i henhold til vår personvernpolicy.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">7. Endringer i vilkårene</h2>
              <p className="text-neutral-700">
                Vi kan oppdatere disse vilkårene fra tid til annen. Vesentlige endringer vil bli 
                kommunisert med rimelig varsel. Fortsatt bruk av tjenesten etter endringer utgjør 
                aksept av nye vilkår.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">8. Gjeldende lov og jurisdiksjon</h2>
              <p className="text-neutral-700">
                Disse vilkårene er underlagt norsk rett. Eventuelle tvister skal løses ved norske domstoler.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-neutral-900 mb-4">9. Kontaktinformasjon</h2>
              <div className="text-neutral-700">
                <p>For spørsmål om disse vilkårene, kontakt oss på:</p>
                <div className="mt-4 p-4 bg-neutral-50 rounded-lg">
                  <p><strong>TutorConnect</strong></p>
                  <p>E-post: <a href="mailto:contact@tutorconnect.no" className="text-brand-600 hover:text-brand-700">contact@tutorconnect.no</a></p>
                  <p>Nettside: tutorconnect.no</p>
                </div>
              </div>
            </section>

            <div className="mt-12 pt-6 border-t border-neutral-200 flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/" className="btn-ghost">
                ← Gå tilbake
              </a>
              <a href="/om-oss#kontakt" className="btn-primary">
                Kontakt oss for spørsmål
              </a>
            </div>
          </div>
        </div>

        {/* Contact info */}
        <div className="mt-12 text-center text-sm text-neutral-500">
          <p>
            For spørsmål om våre kommende vilkår, kontakt oss på{' '}
            <a href="mailto:contact@tutorconnect.no" className="text-brand-600 hover:text-brand-700">
              contact@tutorconnect.no
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}