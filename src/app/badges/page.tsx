import Link from 'next/link';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function BadgesPage() {
  const badgeData = [
    {
      name: 'Bronse',
      icon: '🥉',
      color: 'text-orange-800 bg-orange-200',
      requirements: {
        sessions: 2,
        users: 1
      }
    },
    {
      name: 'Sølv',
      icon: '🥈',
      color: 'text-slate-500 bg-slate-200',
      requirements: {
        sessions: 10,
        users: 2
      }
    },
    {
      name: 'Gull',
      icon: '🥇',
      color: 'text-yellow-600 bg-yellow-100',
      requirements: {
        sessions: 50,
        users: 5
      }
    },
    {
      name: 'Platina',
      icon: '🏆',
      color: 'text-purple-600 bg-purple-100',
      requirements: {
        sessions: 200,
        users: 10
      }
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/profile" 
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-1" />
            Tilbake til profil
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            TutorConnect Merke System
          </h1>
          <p className="text-lg text-gray-700 mb-2">
            Tjen merker basert på din aktivitet som lærer og student på plattformen.
          </p>
          <p className="text-base text-gray-600">
            Merker er en måte å vise din erfaring og troverdighet på TutorConnect - de representerer din karriere og stabilitet som en pålitelig lærer eller dedikert student.
          </p>
        </div>

        {/* Badge Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Teacher Badges */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">👨‍🏫</span>
              <h2 className="text-xl font-semibold text-gray-900">Lærer Merker</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Tjen merker ved å undervise andre studenter og fullføre økter.
            </p>
            
            <div className="space-y-4">
              {badgeData.map((badge) => (
                <div key={`teacher-${badge.name}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium mr-4 ${badge.color}`}>
                      <span className="mr-1">👨‍🏫</span>
                      <span>{badge.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{badge.name}</h3>
                      <p className="text-sm text-gray-600">Lærer merke</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>{badge.requirements.sessions} økter</div>
                    <div>{badge.requirements.users} elever</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Student Badges */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center mb-4">
              <span className="text-2xl mr-2">🎓</span>
              <h2 className="text-xl font-semibold text-gray-900">Student Merker</h2>
            </div>
            <p className="text-gray-600 mb-6">
              Tjen merker ved å ta timer med forskjellige lærere og fullføre økter.
            </p>
            
            <div className="space-y-4">
              {badgeData.map((badge) => (
                <div key={`student-${badge.name}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center">
                    <div className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium mr-4 ${badge.color}`}>
                      <span className="mr-1">🎓</span>
                      <span>{badge.icon}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{badge.name}</h3>
                      <p className="text-sm text-gray-600">Student merke</p>
                    </div>
                  </div>
                  <div className="text-right text-sm text-gray-600">
                    <div>{badge.requirements.sessions} økter</div>
                    <div>{badge.requirements.users} lærere</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* How it Works */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Hvordan det fungerer</h2>
          <div className="text-sm text-gray-600 space-y-2">
            <p>• <strong>Opprett eller finn annonser:</strong> Lag din egen annonse eller finn en annonse som passer dine behov</p>
            <p>• <strong>Kontakt og book økt:</strong> Ta kontakt gjennom chat-systemet og avtale en økt</p>
            <p>• <strong>Gjennomfør økten:</strong> Møt opp og gjennomfør undervisningen som avtalt</p>
            <p>• <strong>Marker som fullført:</strong> Begge parter markerer økten som "complete" i avtalesystemet</p>
            <p>• <strong>Automatisk tildeling:</strong> Merker tildeles automatisk basert på dine fullførte økter og antall unike personer du har jobbet med</p>
          </div>
        </div>

      </div>
    </div>
  );
}