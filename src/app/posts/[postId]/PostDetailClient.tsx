'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  MapPin, 
  Clock, 
  Calendar, 
  DollarSign, 
  User, 
  MessageCircle, 
  BookOpen,
  ChevronLeft,
  ExternalLink,
  Star,
  Shield,
  Award
} from 'lucide-react';
import { PostWithDetails } from '@/types/database';
import { formatters } from '@/lib/translations';
import { getSubjectLabel } from '@/constants/subjects';
import { getAgeGroupLabels } from '@/constants/ageGroups';
import { getRegionLabel } from '@/constants/regions';
import { getTeacherBadge, getStudentBadge } from '@/lib/badges';

interface PostDetailClientProps {
  post: PostWithDetails;
}

export default function PostDetailClient({ post }: PostDetailClientProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const router = useRouter();
  const { user, isAuthenticated, refreshAuth } = useAuth();
  
  const isTutorPost = post.type === 'TEACHER';
  const subjectName = getSubjectLabel(post.subject);
  const ageGroupText = getAgeGroupLabels(post.ageGroups);
  
  // Format available days
  const formatAvailableDays = (days: string[]) => {
    const dayNames = {
      'MONDAY': 'Mandag', 'monday': 'Mandag',
      'TUESDAY': 'Tirsdag', 'tuesday': 'Tirsdag',
      'WEDNESDAY': 'Onsdag', 'wednesday': 'Onsdag',
      'THURSDAY': 'Torsdag', 'thursday': 'Torsdag',
      'FRIDAY': 'Fredag', 'friday': 'Fredag',
      'SATURDAY': 'Lørdag', 'saturday': 'Lørdag',
      'SUNDAY': 'Søndag', 'sunday': 'Søndag'
    };
    return days.map(day => dayNames[day as keyof typeof dayNames] || day).join(', ');
  };

  // Format rate display
  const formatRate = () => {
    if (post.hourlyRate) {
      return `${post.hourlyRate} kr/time`;
    } else if (post.hourlyRateMin && post.hourlyRateMax) {
      return `${post.hourlyRateMin} - ${post.hourlyRateMax} kr/time`;
    }
    return 'Pris etter avtale';
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const { openProfilePopup } = require('@/constants/ui');
    openProfilePopup(post.userId);
  };

  const handleStartChat = async () => {
    // Check if user is authenticated
    if (!isAuthenticated || !user) {
      router.push(`/auth/login?returnUrl=/posts/${post.id}`);
      return;
    }

    // Check if trying to chat with own post
    if (user.id === post.userId) {
      setChatError('Du kan ikke starte en samtale med din egen annonse');
      return;
    }

    setIsCreatingChat(true);
    setChatError(null);

    try {
      // Try to refresh token first to ensure we have a valid token
      const refreshed = await refreshAuth();
      
      // Get the fresh token after refresh
      const accessToken = localStorage.getItem('accessToken');
      
      if (!refreshed || !accessToken) {
        // If refresh failed, redirect to login
        router.push(`/auth/login?returnUrl=/posts/${post.id}`);
        return;
      }

      // Create chat via API (without initial message)
      const response = await fetch(`/api/posts/${post.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          // No initial message - let users start their own conversation
        }),
      });

      if (!response.ok) {
        let errorMessage = 'Kunne ikke starte samtalen';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          
          // Handle specific authentication errors
          if (response.status === 401) {
            // Token is invalid or expired, redirect to login
            localStorage.removeItem('accessToken');
            router.push(`/auth/login?returnUrl=/posts/${post.id}`);
            return;
          }
        } catch {
          // If parsing error response fails, use status-based message
          if (response.status === 401) {
            errorMessage = 'Du må logge inn på nytt';
          } else if (response.status === 400) {
            errorMessage = 'Ugyldig forespørsel';
          }
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Chat creation response:', data);
      
      if (data.data.existing) {
        // If chat already exists, navigate to it
        router.push(`/chat?id=${data.data.chatId}`);
      } else if (data.data.chat && data.data.chat.id) {
        // Navigate to the new chat
        router.push(`/chat?id=${data.data.chat.id}`);
      } else {
        throw new Error('Invalid response from chat creation');
      }
    } catch (error) {
      console.error('Failed to start chat:', error);
      setChatError(error instanceof Error ? error.message : 'En feil oppstod');
    } finally {
      setIsCreatingChat(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link 
              href="/posts" 
              className="inline-flex items-center text-neutral-600 hover:text-neutral-900"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              Tilbake til annonser
            </Link>
            
            {/* Post Type Badge */}
            <span className={`
              inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
              ${isTutorPost 
                ? 'bg-green-100 text-green-800' 
                : 'bg-blue-100 text-blue-800'
              }
            `}>
              {isTutorPost ? 'Tilbyr undervisning' : 'Søker lærer'}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Title and Subject */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h1 className="text-2xl font-bold text-neutral-900 mb-4">
                {post.title}
              </h1>
              
              <div className="flex flex-wrap gap-3 mb-6">
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-brand-50 text-brand-700 font-medium">
                  <BookOpen className="w-4 h-4 mr-2" />
                  {subjectName}
                </span>
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-neutral-100 text-neutral-700">
                  {ageGroupText}
                </span>
              </div>

              {/* Description */}
              <div className="prose prose-neutral max-w-none">
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">Beskrivelse</h3>
                <p className="text-neutral-700 whitespace-pre-wrap">{post.description}</p>
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Tilgjengelighet
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-2">Tilgjengelige dager</p>
                  <p className="text-neutral-900">
                    {post.availableDays?.length > 0 
                      ? formatAvailableDays(post.availableDays)
                      : 'Fleksible dager'}
                  </p>
                </div>
                
                {post.availableTimes && post.availableTimes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-neutral-600 mb-2">Tilgjengelige tider</p>
                    <div className="flex flex-wrap gap-2">
                      {post.availableTimes.map((time, index) => (
                        <span 
                          key={index}
                          className="inline-flex items-center px-3 py-1 rounded-lg bg-neutral-100 text-neutral-700 text-sm"
                        >
                          <Clock className="w-3.5 h-3.5 mr-1.5" />
                          {time}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                {post.preferredSchedule && (
                  <div>
                    <p className="text-sm font-medium text-neutral-600 mb-2">Ønsket timeplan</p>
                    <p className="text-neutral-700">{post.preferredSchedule}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Lokasjon
              </h3>
              
              <div className="space-y-3">
                <p className="text-neutral-900">
                  {getRegionLabel(post.location)}
                </p>
                {post.specificLocation && (
                  <p className="text-neutral-700">
                    {post.specificLocation}
                  </p>
                )}
                {post.postnummer && (
                  <p className="text-sm text-neutral-600">
                    Postnummer: {post.postnummer}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Pricing */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Pris
              </h3>
              <p className="text-2xl font-bold text-neutral-900">
                {formatRate()}
              </p>
            </div>

            {/* User Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                {isTutorPost ? 'Lærer' : 'Student'}
              </h3>
              
              <div className="space-y-4">
                {/* Profile Link */}
                <div className="w-full flex items-center p-3 rounded-lg hover:bg-neutral-50 transition-colors group">
                  <div className="relative w-12 h-12 mr-3">
                    {post.user.profileImage ? (
                      <img
                        src={post.user.profileImage}
                        alt={post.user.name}
                        className={`w-full h-full rounded-full object-cover transition-opacity duration-200 ${
                          imageLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                        onLoad={() => setImageLoaded(true)}
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-brand-100 flex items-center justify-center">
                        <User className="w-6 h-6 text-brand-600" />
                      </div>
                    )}
                    {!imageLoaded && post.user.profileImage && (
                      <div className="absolute inset-0 w-full h-full rounded-full bg-neutral-200 animate-pulse" />
                    )}
                    {post.user.isActive && (
                      <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleProfileClick}
                          className="font-medium text-neutral-900 hover:text-brand-600 transition-colors truncate text-left"
                        >
                          {post.user.name}
                        </button>
                        {/* User Badges */}
                        {(() => {
                          const badge = isTutorPost 
                            ? getTeacherBadge(post.user.teacherSessions || 0, post.user.teacherStudents || 0)
                            : getStudentBadge(post.user.studentSessions || 0, post.user.studentTeachers || 0);
                          
                          if (!badge) return null;
                          
                          const typeIcon = isTutorPost ? '👨‍🏫' : '🎓';
                          const title = `${isTutorPost ? 'Lærer' : 'Student'} ${badge.level} - Klikk for mer info`;
                          
                          return (
                            <button 
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                window.location.href = '/badges';
                              }}
                              className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium hover:scale-105 transition-transform cursor-pointer ${badge.color}`}
                              title={title}
                            >
                              <span className="mr-1">{typeIcon}</span>
                              <span>{badge.icon}</span>
                            </button>
                          );
                        })()}
                      </div>
                      <button
                        onClick={handleProfileClick}
                        className="text-neutral-400 group-hover:text-brand-600 transition-colors"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-neutral-600">Se profil</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Button */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <button
                onClick={handleStartChat}
                disabled={isCreatingChat || user?.id === post.userId}
                className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors ${
                  user?.id === post.userId
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    : isCreatingChat
                    ? 'bg-brand-400 text-white cursor-wait'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
              >
                {isCreatingChat ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Starter samtale...
                  </>
                ) : (
                  <>
                    <MessageCircle className="w-5 h-5 mr-2" />
                    {user?.id === post.userId ? 'Din egen annonse' : 'Start samtale'}
                  </>
                )}
              </button>
              {!isAuthenticated && (
                <p className="text-xs text-neutral-500 text-center mt-3">
                  Du må være innlogget for å starte en samtale
                </p>
              )}
              {chatError && (
                <p className="text-xs text-red-500 text-center mt-3">
                  {chatError}
                </p>
              )}
            </div>

            {/* Post Meta */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-medium text-neutral-600 mb-3">Annonsedetaljer</h3>
              <div className="space-y-2 text-sm text-neutral-600">
                <p>
                  Publisert: {formatters.date(new Date(post.createdAt))}
                </p>
                {post.updatedAt && post.updatedAt !== post.createdAt && (
                  <p>
                    Sist oppdatert: {formatters.date(new Date(post.updatedAt))}
                  </p>
                )}
                <p>
                  Henvendelser: {post._count.chats}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}