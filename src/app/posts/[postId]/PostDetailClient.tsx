'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  PencilIcon
} from 'lucide-react';
import { PostWithDetails } from '@/types/database';
import { isUserOnline } from '@/lib/user-utils';
import { useLanguage, useLanguageText } from '@/contexts/LanguageContext';
import { getSubjectLabelByLanguage } from '@/constants/subjects';
import { getAgeGroupLabelsByLanguage } from '@/constants/ageGroups';
import { getRegionLabel } from '@/constants/regions';
import { getTeacherBadge, getStudentBadge } from '@/lib/badges';
import { useAuth } from '@/contexts/AuthContext';
import { getPostStatusLabelByLanguage, getPostStatusColor } from '@/constants/postStatus';
import AdsterraBanner from '@/components/ads/AdsterraBanner';
import { adPlacementIds } from '@/constants/adPlacements';

interface PostDetailClientProps {
  post: PostWithDetails;
}

export default function PostDetailClient({ post }: PostDetailClientProps) {
  const { language } = useLanguage();
  const t = useLanguageText();
  const [imageLoaded, setImageLoaded] = useState(false);
  const [isCreatingChat, setIsCreatingChat] = useState(false);
  const { user, accessToken } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [backUrl, setBackUrl] = useState('/posts');
  const [isMobileAd, setIsMobileAd] = useState(false);

  const isTutorPost = post.type === 'TEACHER';
  const subjectName = getSubjectLabelByLanguage(language, post.subject);

  // Check if user came from a chat and set appropriate back URL
  useEffect(() => {
    const chatId = searchParams.get('from_chat');
    if (chatId) {
      setBackUrl(`/chat?id=${chatId}`);
    }
  }, [searchParams]);

  useEffect(() => {
    const updateAdBreakpoint = () => {
      if (typeof window === 'undefined') {
        return;
      }
      setIsMobileAd(window.innerWidth < 768);
    };

    updateAdBreakpoint();
    window.addEventListener('resize', updateAdBreakpoint);
    return () => window.removeEventListener('resize', updateAdBreakpoint);
  }, []);

  const formatDate = (value: string | Date) => {
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat(language === 'no' ? 'nb-NO' : 'en-GB', {
      timeZone: 'Europe/Oslo',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date);
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined) {
      return '';
    }

    return new Intl.NumberFormat(language === 'no' ? 'nb-NO' : 'en-GB', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatNegotiable = () => t('Pris etter avtale', 'Price negotiable');

  const handleStartChat = async () => {
    if (isOwner || !user || post.status === 'PAUSET' || isCreatingChat) {
      return;
    }

    setIsCreatingChat(true);

    try {
      // Create chat via post-specific API
      const response = await fetch(`/api/posts/${post.id}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': accessToken ? `Bearer ${accessToken}` : '',
        },
        body: JSON.stringify({}), // No initial message, just create chat
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create chat');
      }

      const { data } = await response.json();
      
      // Navigate to the chat page with the chat ID as query parameter
      window.location.href = `/chat?id=${data.chatId || data.chat.id}`;
    } catch (error) {
      console.error('Error creating chat:', error);
      alert(t('Kunne ikke opprette samtale. Prøv igjen.', 'Could not start the conversation. Please try again.'));
    } finally {
      setIsCreatingChat(false);
    }
  };
  const ageGroupText = getAgeGroupLabelsByLanguage(language, post.ageGroups);
  const isOwner = user?.id === post.userId;
  const postStatus = post.status || 'AKTIV'; // Fallback for existing posts

  // Format available days
  const formatAvailableDays = (days: string[]) => {
    const dayNames = language === 'no'
      ? {
          MONDAY: 'Mandag',
          TUESDAY: 'Tirsdag',
          WEDNESDAY: 'Onsdag',
          THURSDAY: 'Torsdag',
          FRIDAY: 'Fredag',
          SATURDAY: 'Lørdag',
          SUNDAY: 'Søndag',
        }
      : {
          MONDAY: 'Monday',
          TUESDAY: 'Tuesday',
          WEDNESDAY: 'Wednesday',
          THURSDAY: 'Thursday',
          FRIDAY: 'Friday',
          SATURDAY: 'Saturday',
          SUNDAY: 'Sunday',
        };

    return days
      .map((day) => dayNames[day.toUpperCase() as keyof typeof dayNames] || day)
      .join(', ');
  };

  // Format rate display - different logic for TEACHER vs STUDENT
  const formatRate = () => {
    if (post.type === 'TEACHER') {
      // Teachers use hourlyRate (fixed rate they charge)
      if (post.hourlyRate !== null && post.hourlyRate !== undefined) {
        return `${formatCurrency(post.hourlyRate)} ${t('per time', 'per hour')}`;
      }
      return formatNegotiable();
    } else {
      // Students use hourlyRateMin/Max (budget range they can pay)
      if (
        post.hourlyRateMin !== null && post.hourlyRateMin !== undefined &&
        post.hourlyRateMax !== null && post.hourlyRateMax !== undefined
      ) {
        return `${formatCurrency(post.hourlyRateMin)} - ${formatCurrency(post.hourlyRateMax)} ${t('per time', 'per hour')}`;
      } else if (post.hourlyRateMin !== null && post.hourlyRateMin !== undefined) {
        return `${t('Fra', 'From')} ${formatCurrency(post.hourlyRateMin)} ${t('per time', 'per hour')}`;
      } else if (post.hourlyRateMax !== null && post.hourlyRateMax !== undefined) {
        return `${t('Opptil', 'Up to')} ${formatCurrency(post.hourlyRateMax)} ${t('per time', 'per hour')}`;
      }
      return formatNegotiable();
    }
  };

  const handleProfileClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const { openProfilePopup } = require('@/constants/ui');
    openProfilePopup(post.userId);
  };

  const backToLabel = backUrl.includes('/chat')
    ? t('Tilbake til chat', 'Back to chat')
    : t('Tilbake til annonser', 'Back to listings');

  const availabilityTitle = t('Tilgjengelighet', 'Availability');
  const availableDaysLabel = t('Tilgjengelige dager', 'Available days');
  const flexibleDaysLabel = t('Fleksible dager', 'Flexible days');
  const availableTimesLabel = t('Tilgjengelige tider', 'Available times');
  const fromLabel = t('Fra', 'From');
  const toLabel = t('Til', 'To');
  const preferredScheduleLabel = t('Ønsket timeplan', 'Preferred schedule');
  const locationTitle = t('Lokasjon', 'Location');
  const priceTitle = t('Pris', 'Price');
  const priceNoteLineOne = t('Vi tar ingen gebyrer', 'We charge no fees');
  const priceNoteLineTwo = t('- Betaling skjer direkte mellom dere', '- Payment happens directly between you');
  const profileTitle = isTutorPost ? t('Lærer', 'Teacher') : t('Student', 'Student');
  const editLabel = t('Rediger', 'Edit');
  const descriptionLabel = t('Beskrivelse', 'Description');
  const flexibleTimeLabel = t('Fleksibel tid', 'Flexible time');
  const postPausedLabel = t('Denne annonsen er satt på pause', 'This listing is paused');
  const loginRequiredLabel = t('Du må være innlogget for å starte en samtale', 'You must be logged in to start a conversation');
  const selfChatLabel = t('Du kan ikke starte en samtale med deg selv', 'You cannot start a conversation with yourself');
  const startConversationLabel = t('Klikk for å starte en samtale', 'Click to start a conversation');
  const creatingChatLabel = t('Oppretter samtale...', 'Creating conversation...');
  const startChatLabel = t('Start samtale', 'Start conversation');
  const buttonDisabledText = {
    owner: selfChatLabel,
    noUser: loginRequiredLabel,
    paused: postPausedLabel,
    default: startConversationLabel,
  };
  const listingDetailsTitle = t('Annonsedetaljer', 'Listing details');
  const lastUpdatedLabel = t('Sist oppdatert', 'Last updated');
  const inquiriesLabel = t('Henvendelser', 'Messages received');
  const postalCodeLabel = t('Postnummer', 'Postal code');

  const badgeRoleLabel = isTutorPost ? t('Lærer', 'Teacher') : t('Student', 'Student');
  const badgeInfoLabel = t('Klikk for mer info', 'Click for more info');
  const statusLabel = getPostStatusLabelByLanguage(language, postStatus as any);
  const postTypeLabel = isTutorPost
    ? t('Tilbyr undervisning', 'Offers tutoring')
    : t('Søker lærer', 'Seeking tutor');
  const descriptionContent = post.description || t('Ingen beskrivelse tilgjengelig.', 'No description provided.');
  const isOnline = isUserOnline(post.user.lastActive);

  const disabledReason = isOwner
    ? 'owner'
    : !user
      ? 'noUser'
      : post.status === 'PAUSET'
        ? 'paused'
        : 'default';

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <div className="bg-white border-b border-neutral-200 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => router.push(backUrl)}
              className="inline-flex items-center text-neutral-600 hover:text-neutral-900"
            >
              <ChevronLeft className="w-5 h-5 mr-1" />
              {backToLabel}
            </button>
            
            {/* Status and Type Badges */}
            <div className="flex items-center gap-2">
              {/* Status Badge */}
              <span className={`
                inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                ${getPostStatusColor(postStatus as any)}
              `}>
                {statusLabel}
              </span>
              
              {/* Post Type Badge */}
              <span className={`
                inline-flex items-center px-3 py-1 rounded-full text-sm font-medium
                ${isTutorPost 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
                }
              `}>
                {postTypeLabel}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8 pb-4">
        <div className="grid gap-8 lg:grid-cols-6">
          {/* Main Content */}
          <div className="space-y-6 lg:col-span-3">
            {/* Title and Subject */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex justify-between items-start mb-4">
                <h1 className="text-2xl font-bold text-neutral-900">
                  {post.title}
                </h1>
                {isOwner && (
                  <Link
                    href={`/posts/${post.id}/edit`}
                    className="inline-flex items-center px-3 py-2 border border-neutral-300 rounded-md shadow-sm text-sm font-medium text-neutral-700 bg-white hover:bg-neutral-50 transition-colors"
                  >
                    <PencilIcon className="h-4 w-4 mr-1.5" />
                    {editLabel}
                  </Link>
                )}
              </div>
              
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
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">{descriptionLabel}</h3>
                <p className="text-neutral-700 whitespace-pre-wrap">{descriptionContent}</p>
              </div>
            </div>

            {/* Availability */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                {availabilityTitle}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-neutral-600 mb-2">{availableDaysLabel}</p>
                  <p className="text-neutral-900">
                    {post.availableDays?.length > 0 
                      ? formatAvailableDays(post.availableDays)
                      : flexibleDaysLabel}
                  </p>
                </div>
                
                {(post.startTime || post.endTime) && (
                  <div>
                    <p className="text-sm font-medium text-neutral-600 mb-2">{availableTimesLabel}</p>
                    <div className="inline-flex items-center px-3 py-1 rounded-lg bg-neutral-100 text-neutral-700 text-sm">
                      <Clock className="w-3.5 h-3.5 mr-1.5" />
                      {post.startTime && post.endTime 
                        ? `${post.startTime} - ${post.endTime}`
                        : post.startTime 
                          ? `${fromLabel} ${post.startTime}`
                          : `${toLabel} ${post.endTime}`
                      }
                    </div>
                  </div>
                )}
                
                {post.preferredSchedule && (
                  <div>
                    <p className="text-sm font-medium text-neutral-600 mb-2">{preferredScheduleLabel}</p>
                    <p className="text-neutral-700">{post.preferredSchedule}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Location */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                {locationTitle}
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
                    {postalCodeLabel}: {post.postnummer}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6 lg:col-span-2">
            {/* Pricing */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4 flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                {priceTitle}
              </h3>
              <p className="text-2xl font-bold text-neutral-900">
                {formatRate()}
              </p>
              <p className="text-xs text-neutral-500 mt-2 leading-relaxed">
                {priceNoteLineOne}<br />
                {priceNoteLineTwo}
              </p>
            </div>

            {/* User Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">
                {profileTitle}
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
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      isOnline ? 'bg-green-400' : 'bg-gray-400'
                    }`} />
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
                          const title = `${badgeRoleLabel} ${badge.level} - ${badgeInfoLabel}`;
                          
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
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Button */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <button
                onClick={handleStartChat}
                disabled={isOwner || !user || post.status === 'PAUSET' || isCreatingChat}
                className={`w-full inline-flex items-center justify-center px-6 py-3 rounded-lg font-medium transition-colors ${
                  isOwner || !user || post.status === 'PAUSET' || isCreatingChat
                    ? 'bg-neutral-300 text-neutral-500 cursor-not-allowed'
                    : 'bg-brand-600 text-white hover:bg-brand-700'
                }`}
              >
                <MessageCircle className="w-5 h-5 mr-2" />
                {isCreatingChat ? creatingChatLabel : startChatLabel}
              </button>
              <p className="text-xs text-neutral-500 text-center mt-3">
                {buttonDisabledText[disabledReason as keyof typeof buttonDisabledText]}
              </p>
            </div>

            {/* Post Meta */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-sm font-medium text-neutral-600 mb-3">{listingDetailsTitle}</h3>
              <div className="space-y-2 text-sm text-neutral-600">
                {post.updatedAt && post.updatedAt !== post.createdAt && (
                  <p>
                    {lastUpdatedLabel}: {formatDate(post.updatedAt)}
                  </p>
                )}
                <p>
                  {inquiriesLabel}: {post._count.chats}
                </p>
              </div>
            </div>
          </div>

          {/* Advertisement Column */}
          <div className="hidden lg:flex lg:col-span-1 lg:justify-center">
            <AdsterraBanner
              placement="vertical160x600"
              className="w-[160px]"
              style={{ minHeight: 600 }}
            />
          </div>
        </div>
      </div>

      <div className="mt-2 flex justify-center overflow-x-auto pb-2">
        <AdsterraBanner
          placement={
            isMobileAd
              ? adPlacementIds.horizontalMobile320x50
              : adPlacementIds.horizontal728x90
          }
          className="mx-auto"
        />
      </div>
    </div>
  );
}
