'use client';

import Link from 'next/link';
import { 
  EnvelopeIcon, 
  PhoneIcon, 
  MapPinIcon 
} from '@heroicons/react/24/outline';

interface FooterSection {
  title: string;
  links: FooterLink[];
}

interface FooterLink {
  name: string;
  href: string;
  external?: boolean;
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections: FooterSection[] = [
    {
      title: 'TutorConnect',
      links: [
        { name: 'Om oss', href: '/om-oss' },
        { name: 'Hvordan det fungerer', href: '/hvordan-det-fungerer' },
        { name: 'Priser', href: '/priser' },
        { name: 'Karriere', href: '/karriere' },
        { name: 'Presse', href: '/presse' },
      ],
    },
    {
      title: 'For lærere',
      links: [
        { name: 'Bli lærer', href: '/auth/register?type=teacher' },
        { name: 'Lærerguide', href: '/guide/teacher' },
        { name: 'Ressurser', href: '/resources/teacher' },
        { name: 'Suksesshistorier', href: '/success-stories' },
      ],
    },
    {
      title: 'For studenter',
      links: [
        { name: 'Finn lærer', href: '/posts?type=teacher' },
        { name: 'Studentguide', href: '/guide/student' },
        { name: 'Studietips', href: '/tips' },
        { name: 'FAQ', href: '/faq' },
      ],
    },
    {
      title: 'Støtte',
      links: [
        { name: 'Hjelp', href: '/help' },
        { name: 'Kontakt oss', href: '/kontakt' },
        { name: 'Sikkerhet', href: '/sikkerhet' },
        { name: 'Tilgjengelighet', href: '/tilgjengelighet' },
      ],
    },
  ];

  const socialLinks = [
    {
      name: 'Facebook',
      href: 'https://facebook.com/tutorconnect.no',
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      ),
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com/tutorconnect.no',
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987s11.987-5.367 11.987-11.987C24.014 5.367 18.647.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.378-1.297C3.85 14.428 3.85 12.696 3.85 12.017s0-2.411 1.221-3.674c.93-.807 2.081-1.297 3.378-1.297s2.448.49 3.378 1.297c1.221 1.263 1.221 2.995 1.221 3.674s0 2.411-1.221 3.674c-.93.807-2.081 1.297-3.378 1.297z" />
        </svg>
      ),
    },
    {
      name: 'LinkedIn',
      href: 'https://linkedin.com/company/tutorconnect-no',
      icon: (props: React.SVGProps<SVGSVGElement>) => (
        <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      ),
    },
  ];

  const legalLinks = [
    { name: 'Personvern', href: '/personvern' },
    { name: 'Vilkår og betingelser', href: '/vilkar' },
    { name: 'Informasjonskapsler', href: '/cookies' },
    { name: 'Refusjonsregler', href: '/refusjon' },
  ];

  return (
    <footer className="bg-neutral-900 text-neutral-300" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Main footer content */}
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4">
          {footerSections.map((section) => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                {section.title}
              </h3>
              <ul className="mt-4 space-y-2">
                {section.links.map((link) => (
                  <li key={link.name}>
                    <Link
                      href={link.href}
                      className="text-sm hover:text-white transition-colors duration-200"
                      {...(link.external ? { 
                        target: '_blank', 
                        rel: 'noopener noreferrer',
                        'aria-label': `${link.name} (åpnes i ny fane)`
                      } : {})}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Contact information */}
        <div className="mt-12 border-t border-neutral-700 pt-8">
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Kontaktinformasjon
              </h3>
              <div className="space-y-3">
                <div className="flex items-center">
                  <EnvelopeIcon className="h-5 w-5 mr-2 text-neutral-400" aria-hidden="true" />
                  <Link 
                    href="mailto:contact@tutorconnect.no"
                    className="text-sm hover:text-white transition-colors duration-200"
                  >
                    contact@tutorconnect.no
                  </Link>
                </div>
                <div className="flex items-center">
                  <PhoneIcon className="h-5 w-5 mr-2 text-neutral-400" aria-hidden="true" />
                  <Link 
                    href="tel:+4712345678"
                    className="text-sm hover:text-white transition-colors duration-200"
                  >
                    +47 123 45 678
                  </Link>
                </div>
                <div className="flex items-center">
                  <MapPinIcon className="h-5 w-5 mr-2 text-neutral-400" aria-hidden="true" />
                  <span className="text-sm">
                    Oslo, Norge
                  </span>
                </div>
              </div>
            </div>
            
            {/* Social media links */}
            <div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                Følg oss
              </h3>
              <div className="flex space-x-4">
                {socialLinks.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-neutral-400 hover:text-white transition-colors duration-200"
                    aria-label={`Følg oss på ${item.name} (åpnes i ny fane)`}
                  >
                    <item.icon className="h-6 w-6" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Legal section */}
        <div className="mt-8 border-t border-neutral-700 pt-8">
          <div className="flex flex-col space-y-4 lg:flex-row lg:justify-between lg:space-y-0">
            {/* Legal links */}
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {legalLinks.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-sm text-neutral-400 hover:text-white transition-colors duration-200"
                >
                  {link.name}
                </Link>
              ))}
            </div>

            {/* Company information */}
            <div className="flex flex-col space-y-2 lg:items-end">
              <p className="text-sm text-neutral-400">
                © {currentYear} TutorConnect AS. Alle rettigheter forbeholdt.
              </p>
              <p className="text-xs text-neutral-500">
                Org.nr: 123 456 789 | Registrert i Norge
              </p>
            </div>
          </div>
        </div>

        {/* Newsletter signup (optional) */}
        <div className="mt-8 border-t border-neutral-700 pt-8">
          <div className="lg:flex lg:items-center lg:justify-between">
            <div className="lg:flex-1">
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Hold deg oppdatert
              </h3>
              <p className="mt-2 text-sm text-neutral-400">
                Få de nyeste oppdateringene og tipsene direkte i innboksen din.
              </p>
            </div>
            <div className="mt-4 lg:mt-0 lg:ml-6">
              <div className="flex max-w-md">
                <label htmlFor="email-newsletter" className="sr-only">
                  E-postadresse for nyhetsbrev
                </label>
                <input
                  id="email-newsletter"
                  type="email"
                  placeholder="Din e-postadresse"
                  className="min-w-0 flex-1 rounded-l-lg border border-neutral-700 bg-neutral-800 px-4 py-2 text-sm text-white placeholder:text-neutral-400 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="submit"
                  className="rounded-r-lg bg-brand-500 px-4 py-2 text-sm font-medium text-white hover:bg-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors duration-200"
                >
                  Abonner
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}