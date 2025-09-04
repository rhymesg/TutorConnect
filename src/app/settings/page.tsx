'use client';

import { 
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function SettingsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Innstillinger</h1>
        </div>

        {/* Email Notifications Section */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <EnvelopeIcon className="h-8 w-8 text-gray-400" />
            </div>
            <div className="ml-4 flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                E-postvarsler
              </h3>
              <p className="mt-1 text-sm text-gray-600">
                Administrer e-postvarsler for meldinger og aktiviteter
              </p>
              
              <div className="mt-6">
                <div className="text-center py-12">
                  <p className="text-xl font-medium text-gray-600 mb-2">
                    Kommer snart
                  </p>
                  <p className="text-sm text-gray-500">
                    E-postvarsler innstillinger er under utvikling
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}