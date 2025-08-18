import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Hjem',
  description: 'Velkommen til TutorConnect - Norges ledende plattform for privatlæring og tutoring.',
};

export default function HomePage() {
  return (
    <main id="main-content" className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 py-16 sm:py-24 lg:py-32">
        <div className="absolute inset-0 bg-[url('/images/hero-pattern.svg')] opacity-10" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl">
              Finn din perfekte{' '}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                lærer
              </span>{' '}
              eller{' '}
              <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                student
              </span>
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100 text-pretty">
              TutorConnect kobler sammen kvalifiserte lærere og motiverte studenter 
              for privatundervisning i hele Norge. Trygg, enkel og effektiv læring.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button className="btn-primary bg-white text-brand-600 hover:bg-neutral-50 focus:ring-white">
                Start som lærer
              </button>
              <button className="btn-ghost text-white hover:bg-white/10 focus:ring-white">
                Finn en lærer
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Hvorfor velge TutorConnect?
            </h2>
            <p className="mt-4 text-lg text-neutral-600 text-pretty">
              Vi gjør privatundervisning trygt, enkelt og tilgjengelig for alle
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <div className="card text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand-100">
                <svg className="h-8 w-8 text-brand-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.623 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-neutral-900">
                Verifiserte profiler
              </h3>
              <p className="mt-2 text-neutral-600">
                Alle lærere gjennomgår grundig bakgrunnssjekk og verifikasjon av kvalifikasjoner
              </p>
            </div>

            {/* Feature 2 */}
            <div className="card text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-success-100">
                <svg className="h-8 w-8 text-success-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-neutral-900">
                Sanntid chat
              </h3>
              <p className="mt-2 text-neutral-600">
                Kommuniser direkte med lærere og studenter via vår innebygde chat-funksjon
              </p>
            </div>

            {/* Feature 3 */}
            <div className="card text-center">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-warning-100">
                <svg className="h-8 w-8 text-warning-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5a2.25 2.25 0 002.25-2.25m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5a2.25 2.25 0 012.25 2.25v7.5" />
                </svg>
              </div>
              <h3 className="mt-6 text-xl font-semibold text-neutral-900">
                Enkel booking
              </h3>
              <p className="mt-2 text-neutral-600">
                Book timer direkte gjennom plattformen med automatiske påminnelser
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-brand-50 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight text-neutral-900 sm:text-4xl">
              Tilliten til tusenvis av nordmenn
            </h2>
          </div>
          <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-600">500+</div>
              <div className="mt-2 text-sm font-medium text-neutral-600">Aktive lærere</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-600">2000+</div>
              <div className="mt-2 text-sm font-medium text-neutral-600">Fornøyde studenter</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-600">15+</div>
              <div className="mt-2 text-sm font-medium text-neutral-600">Fag tilgjengelig</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-brand-600">98%</div>
              <div className="mt-2 text-sm font-medium text-neutral-600">Tilfredshet</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-neutral-900 py-16 sm:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Klar til å begynne?
          </h2>
          <p className="mt-4 text-lg text-neutral-300 text-pretty">
            Bli med i TutorConnect i dag og opplev fremtidens privatundervisning
          </p>
          <div className="mt-8 flex items-center justify-center gap-x-6">
            <button className="btn-primary">
              Opprett konto
            </button>
            <button className="btn-ghost text-white hover:bg-white/10">
              Les mer <span aria-hidden="true">→</span>
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}