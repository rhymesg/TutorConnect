import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    template: '%s | TutorConnect',
    default: 'TutorConnect - Norges ledende plattform for privatlæring',
  },
  description: 'Finn kvalifiserte lærere og studenter for privatundervisning i Norge. Trygge, verifiserte profiler og enkel booking.',
  keywords: ['privatundervisning', 'lærer', 'student', 'Norge', 'utdanning', 'tutoring'],
  authors: [{ name: 'TutorConnect' }],
  creator: 'TutorConnect',
  publisher: 'TutorConnect',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://tutorconnect.no'),
  alternates: {
    canonical: '/',
    languages: {
      'no': '/no',
      'en': '/en',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'no_NO',
    url: 'https://tutorconnect.no',
    siteName: 'TutorConnect',
    title: 'TutorConnect - Norges ledende plattform for privatlæring',
    description: 'Finn kvalifiserte lærere og studenter for privatundervisning i Norge.',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'TutorConnect - Privatundervisning i Norge',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TutorConnect - Norges ledende plattform for privatlæring',
    description: 'Finn kvalifiserte lærere og studenter for privatundervisning i Norge.',
    images: ['/images/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    // Add verification codes when available
    // google: 'google-verification-code',
    // yandex: 'yandex-verification-code',
  },
  category: 'education',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="no" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* PWA meta tags */}
        <meta name="application-name" content="TutorConnect" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TutorConnect" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#0ea5e9" />

        {/* Favicons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Preload critical fonts */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin=""
        />
        
        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        {process.env.NEXT_PUBLIC_SUPABASE_URL && (
          <link rel="dns-prefetch" href={process.env.NEXT_PUBLIC_SUPABASE_URL} />
        )}
      </head>
      <body className="min-h-screen bg-neutral-50 font-sans antialiased">
        <div id="root" className="relative flex min-h-screen flex-col">
          {children}
        </div>
        
        {/* Skip to main content for accessibility */}
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 z-50 rounded-md bg-brand-500 px-4 py-2 text-white focus:ring-2 focus:ring-brand-600"
        >
          Hopp til hovedinnhold
        </a>
        
        {/* Service Worker registration script will be added by PWA configuration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator && '${process.env.NODE_ENV}' === 'production') {
                navigator.serviceWorker.register('/sw.js')
                  .then(function(registration) {
                    console.log('SW registered with scope: ', registration.scope);
                  })
                  .catch(function(error) {
                    console.log('SW registration failed: ', error);
                  });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}