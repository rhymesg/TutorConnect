export default function Footer() {
  return (
    <footer className="bg-neutral-900 py-8">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          {/* Footer Links */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-4 text-sm text-neutral-400">
            <a href="/privacy" className="hover:text-white transition-colors">
              Personvern
            </a>
            <a href="/terms" className="hover:text-white transition-colors">
              Vilkår og betingelser
            </a>
            <a href="/om-oss#kontakt" className="hover:text-white transition-colors">
              Kontakt
            </a>
          </div>
          
          {/* Copyright */}
          <div className="mt-6 text-sm text-neutral-500">
            © 2025 TutorConnect. Alle rettigheter reservert.
          </div>
        </div>
      </div>
    </footer>
  );
}