import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'De beste nettstedene for privatundervisning i Norge (2025) - TutorConnect Blog',
  description: 'Oversikt over de mest brukte plattformene for privatundervisning i Norge. Sammenlign MentorNorge, UNAK, Superprof og TutorConnect for å finne den beste løsningen.',
  alternates: {
    canonical: 'https://tutorconnect.no/blog/de-beste-nettstedene-for-privatundervisning-i-norge-2025',
    languages: {
      'nb-NO': 'https://tutorconnect.no/blog/de-beste-nettstedene-for-privatundervisning-i-norge-2025',
      'en-US': 'https://tutorconnect.no/blog/en/best-private-tutoring-websites-norway-2025',
    },
  },
  openGraph: {
    title: 'De beste nettstedene for privatundervisning i Norge (2025)',
    description: 'Oversikt over de mest brukte plattformene for privatundervisning i Norge. Sammenlign MentorNorge, UNAK, Superprof og TutorConnect.',
    url: 'https://tutorconnect.no/blog/de-beste-nettstedene-for-privatundervisning-i-norge-2025',
    siteName: 'TutorConnect',
    locale: 'nb_NO',
    type: 'article',
  },
};

export default function BlogPostPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <div className="border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/blog"
              className="text-brand-600 hover:text-brand-700 font-medium"
            >
              ← Tilbake til blog
            </Link>
            <Link
              href="/blog/en/best-private-tutoring-websites-norway-2025"
              className="text-gray-500 hover:text-gray-700 text-sm"
            >
              English version
            </Link>
          </div>
        </div>
      </div>

      {/* Article */}
      <article className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-3 py-1 bg-brand-100 text-brand-700 text-sm font-medium rounded-full">
              Guide
            </span>
            <span className="text-sm text-gray-500">
              8 min lesing
            </span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            De beste nettstedene for privatundervisning i Norge (2025)
          </h1>
          
          <time className="text-gray-600">
            Publisert 15. august 2025
          </time>
        </header>

        {/* Content */}
        <div className="prose prose-lg prose-gray max-w-none">
          <p className="text-xl text-gray-700 leading-relaxed mb-8">
            Privatundervisning ("privatlærer" / "leksehjelp") blir stadig mer vanlig i Norge. Mange foreldre og studenter ønsker ekstra hjelp i matematikk, språk, naturfag eller andre fag. Men hvor finner man en lærer? Her er en oversikt over noen av de mest brukte plattformene.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <p className="text-blue-800 mb-0">
              💡 <strong>Tips:</strong> I tillegg til å hjelpe elever, er disse tjenestene også et godt utgangspunkt for deg som ønsker en fleksibel deltidsjobb som lærer eller barnevakt (part-time tutoring eller "barnepass"). Mange studenter og unge voksne bruker slike plattformer til å kombinere deltidsinntekt med studier eller fulltidsjobb.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">MentorNorge (mentornorge.no)</h2>
          <p>
            MentorNorge er en kjent aktør i Norge som tilbyr privatundervisning i en rekke fag. De setter opp en plan etter elevens behov og matcher eleven med en kvalifisert lærer.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 my-6">
            <p className="font-semibold mb-3">📋 Modell:</p>
            <p className="mb-4">Elever bestiller undervisning gjennom MentorNorge, og de organiserer lærer og oppfølging.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="font-semibold text-green-700 mb-2">✅ Fordeler:</p>
                <ul className="text-sm space-y-1">
                  <li>• Profesjonell struktur</li>
                  <li>• Lærergaranti</li>
                  <li>• Bredt fagtilbud</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-red-700 mb-2">❌ Ulemper:</p>
                <ul className="text-sm space-y-1">
                  <li>• Prisene kan være høyere</li>
                  <li>• Må følge tjenestens egne avtaler</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-md p-3 mt-4">
              <p className="text-sm text-blue-800 mb-0">
                👉 <strong>Også relevant for lærere:</strong> MentorNorge ansetter og følger opp lærere tett som ønsker trygg deltidsjobb.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Ungdomsakademiet (unak.no)</h2>
          <p>
            Ungdomsakademiet (UNAK) tilbyr både leksehjelp og mer omfattende privatundervisning. De gjør en behovsanalyse og tildeler deretter en lærer.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 my-6">
            <p className="font-semibold mb-3">📋 Modell:</p>
            <p className="mb-4">Elever beskriver behov, og UNAK finner passende lærer.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="font-semibold text-green-700 mb-2">✅ Fordeler:</p>
                <ul className="text-sm space-y-1">
                  <li>• Tett oppfølging</li>
                  <li>• Lærere med erfaring</li>
                  <li>• Trygghet for foreldre</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-red-700 mb-2">❌ Ulemper:</p>
                <ul className="text-sm space-y-1">
                  <li>• Mindre fleksibilitet i direkte avtaler</li>
                  <li>• Betaling går via organisasjonen</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-md p-3 mt-4">
              <p className="text-sm text-blue-800 mb-0">
                👉 <strong>God mulighet:</strong> For studenter eller nyutdannede som ønsker å kombinere deltidsundervisning med egen utdanning.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Superprof (superprof.no)</h2>
          <p>
            Superprof er en internasjonal markedsplass for privatlærere, inkludert i Norge. Her lager lærere egne profiler, og studenter kan søke etter fag, pris og sted.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 my-6">
            <p className="font-semibold mb-3">📋 Modell:</p>
            <p className="mb-4">Direkte matching — eleven velger lærer selv.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="font-semibold text-green-700 mb-2">✅ Fordeler:</p>
                <ul className="text-sm space-y-1">
                  <li>• Stort utvalg av lærere</li>
                  <li>• Fleksible fag og prisnivåer</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-red-700 mb-2">❌ Ulemper:</p>
                <ul className="text-sm space-y-1">
                  <li>• Kvalitet kan variere</li>
                  <li>• Må selv sjekke lærernes bakgrunn</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-md p-3 mt-4">
              <p className="text-sm text-blue-800 mb-0">
                👉 <strong>Side hustle:</strong> Populær blant personer som ønsker en side hustle: alt fra musikk, språk, idrett, til barnepass ("barnevakt") kan legges ut her.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">TutorConnect (tutorconnect.no)</h2>
          <p>
            TutorConnect er en ny norsk plattform som gjør det mulig for både lærere og elever å legge ut annonser. Plattformen har innebygd chat og kalenderfunksjon for å avtale timer.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 my-6">
            <p className="font-semibold mb-3">📋 Modell:</p>
            <p className="mb-4">Direkte kontakt — elev og lærer avtaler selv uten mellomledd.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="font-semibold text-green-700 mb-2">✅ Fordeler:</p>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Gratis bruk</strong> — Ingen provisjon eller gebyrer</li>
                  <li>• Full fleksibilitet</li>
                  <li>• Enkel kommunikasjon</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-red-700 mb-2">❌ Ulemper:</p>
                <ul className="text-sm space-y-1">
                  <li>• Relativt nytt i markedet</li>
                  <li>• Utvalget kan være mindre</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-green-100 rounded-md p-3 mt-4">
              <p className="text-sm text-green-800 mb-0">
                👉 <strong>Spesielt interessant:</strong> For deg som vil tilby part-time undervisning eller barnepass uten å betale gebyrer. Du beholder hele inntekten selv og kan avtale direkte med familien eller eleven.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">📊 Oppsummering</h2>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <ul className="space-y-3">
              <li>
                <strong>MentorNorge / Ungdomsakademiet:</strong> Profesjonell oppfølging, trygghet, men gjerne høyere pris og mindre fleksibilitet.
              </li>
              <li>
                <strong>Superprof:</strong> Stor variasjon og direkte valg, også aktuelt for dem som vil prøve seg på deltidsundervisning.
              </li>
              <li>
                <strong>TutorConnect:</strong> Ny tilnærming med null gebyr og direkte avtaler — både for elever og for deg som ønsker fleksibel deltidsjobb eller barnevakt-oppdrag.
              </li>
            </ul>
            
            <p className="mt-4 text-blue-800 font-medium mb-0">
              Hvilken tjeneste som passer best, avhenger av hva du prioriterer: trygghet, utvalg, fleksibilitet eller kostnadseffektivitet.
            </p>
          </div>

          {/* CTA Section */}
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-8 mt-12 text-center">
            <h3 className="text-xl font-bold text-brand-900 mb-4">
              Klar til å komme i gang?
            </h3>
            <p className="text-brand-700 mb-6">
              Opprett din profil på TutorConnect og begynn å tilby eller søk etter undervisning helt gratis.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/posts/teachers"
                className="bg-brand-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors"
              >
                Se lærere
              </Link>
              <Link
                href="/posts/students"
                className="bg-white text-brand-600 px-6 py-3 rounded-lg font-medium border-2 border-brand-600 hover:bg-brand-50 transition-colors"
              >
                Se elever
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}