import { useLanguageText } from '@/contexts/LanguageContext';

export default function Footer() {
  const t = useLanguageText();

  return (
    <footer className="bg-neutral-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 text-sm text-neutral-400">
            <a href="/privacy" className="hover:text-white transition-colors">
              {t('Personvern', 'Privacy Policy')}
            </a>
            <a href="/terms" className="hover:text-white transition-colors">
              {t('Vilkår og betingelser', 'Terms & Conditions')}
            </a>
            <a href="/om-oss#kontakt" className="hover:text-white transition-colors">
              {t('Kontakt', 'Contact')}
            </a>
          </div>
          
          {/* Copyright */}
          <div className="mt-6 text-sm text-neutral-500">
            {t('© 2025 TutorConnect. Alle rettigheter reservert.', '© 2025 TutorConnect. All rights reserved.')}
          </div>
        </div>
      </div>
    </footer>
  );
}
