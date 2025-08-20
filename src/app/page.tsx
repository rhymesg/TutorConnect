import type { Metadata } from 'next';
import Link from 'next/link';
import { ShimmerButton } from '@/components/ui/ShimmerButton';
import { GridPattern } from '@/components/ui/GridPattern';
import ConnectionDemo from '@/components/ui/ConnectionDemo';
import FeaturesBentoGrid from '@/components/sections/FeaturesBentoGrid';

export const metadata: Metadata = {
  title: 'Hjem',
  description: 'Velkommen til TutorConnect - Norges ledende plattform for privatlæring og tutoring.',
};

export default function HomePage() {
  return (
    <div className="flex-1">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-brand-500 via-brand-600 to-brand-700 py-16 sm:py-24 lg:py-32">
        <GridPattern 
          className="absolute inset-0 h-full w-full opacity-5" 
          width={60}
          height={60}
          strokeDasharray="2"
          squares={[[4, 4], [6, 2], [8, 5], [10, 3], [12, 7], [14, 1]]}
        />
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
              <Link href="/auth/register?type=teacher">
                <ShimmerButton 
                  className="px-6 py-3 text-sm font-semibold"
                  shimmerDuration="4s"
                  background="linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(229, 229, 229, 0.9))"
                  shimmerColor="rgba(14, 165, 233, 0.3)"
                >
                  <span className="text-brand-700">Start som lærer</span>
                </ShimmerButton>
              </Link>
              <Link href="/posts?type=teacher" className="btn-ghost text-white hover:bg-white/10 focus:ring-white">
                Finn en lærer
              </Link>
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

          {/* Connection Demo */}
          <div className="mt-16 mb-16">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-neutral-900">
                Sømløs forbindelse mellom lærere og studenter
              </h3>
              <p className="mt-2 text-neutral-600">
                Se hvordan TutorConnect kobler sammen kvalifiserte lærere med motiverte studenter
              </p>
            </div>
            <ConnectionDemo />
          </div>

        </div>
      </section>

      {/* Features Bento Grid */}
      <FeaturesBentoGrid />

      {/* Stats Section */}
      <section className="relative bg-brand-50 py-16 sm:py-24">
        <GridPattern 
          className="absolute inset-0 h-full w-full opacity-3" 
          width={40}
          height={40}
          strokeDasharray="1"
          squares={[[3, 2], [5, 6], [7, 1], [9, 4], [11, 8], [13, 3]]}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
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
      <section className="relative bg-neutral-900 py-16 sm:py-24">
        <GridPattern 
          className="absolute inset-0 h-full w-full fill-neutral-800/10 stroke-neutral-700/20" 
          width={50}
          height={50}
          strokeDasharray="3"
          squares={[[2, 3], [6, 1], [8, 6], [10, 2], [12, 5], [14, 8]]}
        />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Klar til å begynne?
          </h2>
          <p className="mt-4 text-lg text-neutral-300 text-pretty">
            Bli med i TutorConnect i dag og opplev fremtidens privatundervisning
          </p>
          <div className="mt-8 flex items-center justify-center gap-x-6">
            <Link href="/auth/register">
              <ShimmerButton 
                className="px-6 py-3 text-sm font-semibold"
                shimmerDuration="5s"
              >
                Opprett konto
              </ShimmerButton>
            </Link>
            <Link href="/om-oss" className="btn-ghost text-white hover:bg-white/10">
              Les mer <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}