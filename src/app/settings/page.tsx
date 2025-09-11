'use client';

import { useState, useEffect } from 'react';
import { 
  EnvelopeIcon,
  ChatBubbleLeftIcon,
  CalendarIcon,
  BellIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { LoadingSpinner } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

interface EmailNotificationSettings {
  emailNewChat: boolean;
  emailNewMessage: boolean;
  emailAppointmentConfirm: boolean;
  emailAppointmentComplete: boolean;
}

export default function SettingsPage() {
  const { accessToken } = useAuth();
  const [settings, setSettings] = useState<EmailNotificationSettings>({
    emailNewChat: true,
    emailNewMessage: true,
    emailAppointmentConfirm: true,
    emailAppointmentComplete: true,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Load current settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch('/api/profile/email-notifications', {
          headers: {
            'Authorization': accessToken ? `Bearer ${accessToken}` : ''
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          setSettings({
            emailNewChat: data.emailNewChat,
            emailNewMessage: data.emailNewMessage,
            emailAppointmentConfirm: data.emailAppointmentConfirm,
            emailAppointmentComplete: data.emailAppointmentComplete,
          });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (accessToken) {
      loadSettings();
    }
  }, [accessToken]);

  const handleToggle = async (key: keyof EmailNotificationSettings) => {
    if (!accessToken) {
      setSaveMessage('Du må være logget inn');
      setTimeout(() => setSaveMessage(''), 3000);
      return;
    }
    const newValue = !settings[key];
    const newSettings = { ...settings, [key]: newValue };
    
    // Optimistic update
    setSettings(newSettings);
    setIsSaving(true);

    try {
      const response = await fetch('/api/profile/email-notifications', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : ''
        },
        body: JSON.stringify(newSettings)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error('Update failed:', response.status, errorData);
        throw new Error(errorData?.error || 'Failed to update settings');
      }

      setSaveMessage('Innstillinger lagret');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
      // Revert optimistic update
      setSettings(settings);
      setSaveMessage('Feil ved lagring');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const ToggleSwitch = ({ enabled, onChange, disabled = false }: { 
    enabled: boolean; 
    onChange: () => void; 
    disabled?: boolean;
  }) => (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${
        enabled ? 'bg-blue-600' : 'bg-gray-200'
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
          enabled ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  );

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
              
              {/* Save message */}
              {saveMessage && (
                <div className={`mt-4 p-3 rounded-lg ${
                  saveMessage.includes('Feil') 
                    ? 'bg-red-50 border border-red-200 text-red-700'
                    : 'bg-green-50 border border-green-200 text-green-700'
                }`}>
                  <div className="flex items-center">
                    <CheckCircleIcon className="h-5 w-5 mr-2" />
                    {saveMessage}
                  </div>
                </div>
              )}

              <div className="mt-6">
                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <LoadingSpinner size="lg" />
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* New Chat Notification */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-200">
                      <div className="flex items-start">
                        <ChatBubbleLeftIcon className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            Nye chatforespørsler
                          </h4>
                          <p className="text-sm text-gray-500">
                            Få varsling når noen starter en ny chat med deg
                          </p>
                        </div>
                      </div>
                      <ToggleSwitch
                        enabled={settings.emailNewChat}
                        onChange={() => handleToggle('emailNewChat')}
                        disabled={isSaving}
                      />
                    </div>

                    {/* New Message Notification */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-200">
                      <div className="flex items-start">
                        <BellIcon className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            Nye meldinger
                          </h4>
                          <p className="text-sm text-gray-500">
                            Få sammendrag av nye meldinger hver time
                          </p>
                        </div>
                      </div>
                      <ToggleSwitch
                        enabled={settings.emailNewMessage}
                        onChange={() => handleToggle('emailNewMessage')}
                        disabled={isSaving}
                      />
                    </div>

                    {/* Appointment Confirmation */}
                    <div className="flex items-center justify-between py-4 border-b border-gray-200">
                      <div className="flex items-start">
                        <CalendarIcon className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            Avtalebekreftelser
                          </h4>
                          <p className="text-sm text-gray-500">
                            Få varsling når en avtale blir bekreftet
                          </p>
                        </div>
                      </div>
                      <ToggleSwitch
                        enabled={settings.emailAppointmentConfirm}
                        onChange={() => handleToggle('emailAppointmentConfirm')}
                        disabled={isSaving}
                      />
                    </div>

                    {/* Appointment Completion Reminder */}
                    <div className="flex items-center justify-between py-4">
                      <div className="flex items-start">
                        <CheckCircleIcon className="h-5 w-5 text-gray-400 mt-1 mr-3" />
                        <div>
                          <h4 className="text-sm font-medium text-gray-900">
                            Avtale fullført påminnelse
                          </h4>
                          <p className="text-sm text-gray-500">
                            Få påminnelse om å bekrefte fullføring etter avtaleslutt
                          </p>
                        </div>
                      </div>
                      <ToggleSwitch
                        enabled={settings.emailAppointmentComplete}
                        onChange={() => handleToggle('emailAppointmentComplete')}
                        disabled={isSaving}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}