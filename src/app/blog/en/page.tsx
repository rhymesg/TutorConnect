import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Blog - TutorConnect',
  description: 'Read articles about tutoring, learning, and education on TutorConnect\'s blog.',
  alternates: {
    canonical: 'https://tutorconnect.no/blog/en',
    languages: {
      'en-US': 'https://tutorconnect.no/blog/en',
      'nb-NO': 'https://tutorconnect.no/blog',
    },
  },
  openGraph: {
    title: 'Blog - TutorConnect',
    description: 'Read articles about tutoring, learning, and education on TutorConnect\'s blog.',
    url: 'https://tutorconnect.no/blog/en',
    siteName: 'TutorConnect',
    locale: 'en_US',
    type: 'website',
  },
};


export default function BlogPageEN() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "Best Private Tutoring Websites in Norway (2025)",
    "description": "Private tutoring is becoming increasingly popular in Norway. Here's an overview of the most popular platforms for finding tutors and students.",
    "image": "https://tutorconnect.no/images/blog-private-tutoring-norway.jpg",
    "author": {
      "@type": "Organization",
      "name": "TutorConnect",
      "url": "https://tutorconnect.no"
    },
    "publisher": {
      "@type": "Organization",
      "name": "TutorConnect",
      "logo": {
        "@type": "ImageObject",
        "url": "https://tutorconnect.no/logo.png"
      }
    },
    "datePublished": "2025-08-15",
    "dateModified": "2025-08-15",
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": "https://tutorconnect.no/blog/en"
    },
    "keywords": ["private tutoring", "Norway", "teachers", "students", "TutorConnect", "MentorNorge", "Superprof", "UNAK", "tutoring platform"],
    "inLanguage": "en-US"
  };

  return (
    <div className="min-h-screen bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center relative">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              TutorConnect Blog
            </h1>
            <p className="text-lg text-gray-600 mb-4">
              Articles about tutoring, learning, and education
            </p>
            <Link
              href="/blog"
              className="inline-flex items-center px-4 py-2 text-brand-600 hover:text-brand-700 font-medium border border-brand-200 rounded-lg hover:bg-brand-50 transition-colors"
            >
              Norsk →
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
              8 min read
            </span>
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
            Best Private Tutoring Websites in Norway (2025)
          </h1>
          
          <time className="text-gray-600">
            Published August 15, 2025
          </time>
        </header>

        {/* Content */}
        <div className="prose prose-lg prose-gray max-w-none">
          <p className="text-xl text-gray-700 leading-relaxed mb-8">
            Private tutoring is becoming increasingly popular in Norway. Many parents and students seek extra help in mathematics, languages, science, or other subjects. But where can you find a tutor? Here's an overview of some of the most popular platforms.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
            <p className="text-blue-800 mb-0">
              💡 <strong>Tip:</strong> In addition to helping students, these services are also a great starting point for those looking for flexible part-time work as a tutor or babysitter. Many students and young adults use such platforms to combine part-time income with studies or full-time work.
            </p>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">MentorNorge (mentornorge.no)</h2>
          <p>
            MentorNorge is a well-known player in Norway that offers private tutoring in a range of subjects. They create a plan according to the student's needs and match the student with a qualified teacher.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 my-6">
            <p className="font-semibold mb-3">📋 Model:</p>
            <p className="mb-4">Students order tutoring through MentorNorge, and they organize the teacher and follow-up.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="font-semibold text-green-700 mb-2">✅ Advantages:</p>
                <ul className="text-sm space-y-1">
                  <li>• Professional structure</li>
                  <li>• Teacher guarantee</li>
                  <li>• Wide range of subjects</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-red-700 mb-2">❌ Disadvantages:</p>
                <ul className="text-sm space-y-1">
                  <li>• Prices can be higher</li>
                  <li>• Must follow service's own agreements</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-md p-3 mt-4">
              <p className="text-sm text-blue-800 mb-0">
                👉 <strong>Also relevant for tutors:</strong> MentorNorge employs and closely follows up teachers who want secure part-time work.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Ungdomsakademiet (unak.no)</h2>
          <p>
            Ungdomsakademiet (UNAK) offers both homework help and more comprehensive private tutoring. They conduct a needs analysis and then assign an appropriate teacher.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 my-6">
            <p className="font-semibold mb-3">📋 Model:</p>
            <p className="mb-4">Students describe their needs, and UNAK finds a suitable teacher.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="font-semibold text-green-700 mb-2">✅ Advantages:</p>
                <ul className="text-sm space-y-1">
                  <li>• Close follow-up</li>
                  <li>• Experienced teachers</li>
                  <li>• Security for parents</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-red-700 mb-2">❌ Disadvantages:</p>
                <ul className="text-sm space-y-1">
                  <li>• Less flexibility in direct agreements</li>
                  <li>• Payment goes through organization</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-md p-3 mt-4">
              <p className="text-sm text-blue-800 mb-0">
                👉 <strong>Good opportunity:</strong> For students or recent graduates who want to combine part-time teaching with their own education.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Superprof (superprof.no)</h2>
          <p>
            Superprof is an international marketplace for private tutors, including in Norway. Here, teachers create their own profiles, and students can search by subject, price, and location.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 my-6">
            <p className="font-semibold mb-3">📋 Model:</p>
            <p className="mb-4">Direct matching — the student chooses the teacher themselves.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="font-semibold text-green-700 mb-2">✅ Advantages:</p>
                <ul className="text-sm space-y-1">
                  <li>• Large selection of teachers</li>
                  <li>• Flexible subjects and price levels</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-red-700 mb-2">❌ Disadvantages:</p>
                <ul className="text-sm space-y-1">
                  <li>• Quality can vary</li>
                  <li>• Must check teachers' backgrounds yourself</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-blue-100 rounded-md p-3 mt-4">
              <p className="text-sm text-blue-800 mb-0">
                👉 <strong>Side hustle:</strong> Popular among people who want a side hustle: everything from music, languages, sports, to babysitting can be listed here.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">
            <a href="https://tutorconnect.no" className="text-gray-900 hover:text-brand-600 transition-colors">
              TutorConnect (tutorconnect.no)
            </a>
          </h2>
          <p>
            <a href="https://tutorconnect.no" className="text-brand-600 hover:text-brand-700 font-medium">TutorConnect</a> is a new Norwegian platform that allows both teachers and students to post advertisements. The platform has built-in chat and calendar functionality to schedule lessons.
          </p>
          
          <div className="bg-gray-50 rounded-lg p-6 my-6">
            <p className="font-semibold mb-3">📋 Model:</p>
            <p className="mb-4">Direct contact — student and teacher arrange themselves without intermediaries.</p>
            
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="font-semibold text-green-700 mb-2">✅ Advantages:</p>
                <ul className="text-sm space-y-1">
                  <li>• <strong>Free to use</strong> — No commission or fees</li>
                  <li>• Complete flexibility</li>
                  <li>• Simple communication</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-red-700 mb-2">❌ Disadvantages:</p>
                <ul className="text-sm space-y-1">
                  <li>• Relatively new in the market</li>
                  <li>• Selection may be smaller</li>
                </ul>
              </div>
            </div>
            
            <div className="bg-green-100 rounded-md p-3 mt-4">
              <p className="text-sm text-green-800 mb-0">
                👉 <strong>Especially interesting:</strong> For those who want to offer part-time tutoring or babysitting without paying fees. You keep the entire income and can arrange directly with the family or student.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">📊 Summary</h2>
          
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
            <ul className="space-y-3">
              <li>
                <strong>MentorNorge / Ungdomsakademiet:</strong> Professional follow-up, security, but often higher prices and less flexibility.
              </li>
              <li>
                <strong>Superprof:</strong> Great variety and direct choice, also relevant for those wanting to try part-time tutoring.
              </li>
              <li>
                <strong>TutorConnect:</strong> New approach with zero fees and direct agreements — both for students and those wanting flexible part-time work or babysitting jobs.
              </li>
            </ul>
            
            <p className="mt-4 text-blue-800 font-medium mb-0">
              Which service fits best depends on what you prioritize: security, selection, flexibility, or cost-effectiveness.
            </p>
          </div>

          {/* CTA Section */}
          <div className="bg-brand-50 border border-brand-200 rounded-lg p-8 mt-12 text-center">
            <h3 className="text-xl font-bold text-brand-900 mb-4">
              Ready to get started?
            </h3>
            <p className="text-brand-700 mb-6">
              Create your profile on TutorConnect and start offering or searching for tutoring completely free.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link
                href="/posts/teachers"
                className="bg-brand-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-brand-700 transition-colors"
              >
                Find Tutors
              </Link>
              <Link
                href="/posts/students"
                className="bg-white text-brand-600 px-6 py-3 rounded-lg font-medium border-2 border-brand-600 hover:bg-brand-50 transition-colors"
              >
                Find Students
              </Link>
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}