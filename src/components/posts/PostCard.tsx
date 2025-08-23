'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Clock, MapPin, User, Star, MessageCircle, Calendar, GraduationCap, BookOpen } from 'lucide-react';
import { PostWithDetails, PostType } from '@/types/database';
import { formatters, education, common } from '@/lib/translations';
import { StartChatButton } from '@/components/chat';

interface PostCardProps {
  post: PostWithDetails;
  className?: string;
  onContactClick?: (postId: string) => void;
}

export default function PostCard({ post, className = '', onContactClick }: PostCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);

  const isTutorPost = post.type === 'TEACHER';
  
  // Subject mappings that match PostFormFields19 options
  const subjectMapping = {
    'math': 'Matematikk',
    'english': 'Engelsk',
    'norwegian': 'Norsk', 
    'science': 'Naturfag',
    'programming': 'Programmering',
    'sports': 'Sport',
    'art': 'Kunst',
    'music': 'Musikk',
    'childcare': 'Barnepass og aktiviteter',
    'other': 'Annet',
    // Also include original mappings for backwards compatibility
    ...education.no.subjects
  };
  
  const subjectName = subjectMapping[post.subject as keyof typeof subjectMapping] || post.subject;
  
  // Format age groups with more readable names
  const formatAgeGroups = (ageGroups: string[]) => {
    const ageGroupNames = {
      'PRESCHOOL_3_6': '3-6 år',
      'PRIMARY_7_10': '7-10 år', 
      'MIDDLE_11_13': '11-13 år',
      'SECONDARY_14_16': '14-16 år',
      'HIGH_SCHOOL_17_19': '17-19 år',
      'ADULTS_20_PLUS': '20+ år'
    };
    return ageGroups.map(group => ageGroupNames[group as keyof typeof ageGroupNames] || group).join(', ');
  };
  
  const ageGroupText = formatAgeGroups(post.ageGroups);
  
  // Format rate display - Don't show specific prices to encourage click-through
  const rateDisplay = () => {
    return '••• kr';
  };

  // Format available days and times
  const formatAvailableDays = (days: string[]) => {
    // Use shortened versions of Norwegian day names (handle both cases)
    const dayNames = {
      'MONDAY': 'Man', 'monday': 'Man',
      'TUESDAY': 'Tir', 'tuesday': 'Tir',
      'WEDNESDAY': 'Ons', 'wednesday': 'Ons',
      'THURSDAY': 'Tor', 'thursday': 'Tor',
      'FRIDAY': 'Fre', 'friday': 'Fre',
      'SATURDAY': 'Lør', 'saturday': 'Lør',
      'SUNDAY': 'Søn', 'sunday': 'Søn'
    };
    return days.map(day => dayNames[day as keyof typeof dayNames] || day).join(', ');
  };

  const availableDaysText = post.availableDays?.length > 0 
    ? formatAvailableDays(post.availableDays)
    : 'Fleksible dager';

  const availableTimesText = post.availableTimes?.length > 0 
    ? post.availableTimes.slice(0, 2).join(', ') + (post.availableTimes.length > 2 ? '...' : '')
    : 'Fleksibel tid';

  const handleContactClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onContactClick?.(post.id);
  };

  return (
    <div className={`
      group bg-white rounded-xl shadow-sm border border-neutral-200 
      hover:shadow-lg hover:border-brand-200 transition-all duration-300
      overflow-hidden ${className}
    `}>
      {/* Post Type Badge */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
            ${isTutorPost 
              ? 'bg-green-100 text-green-800' 
              : 'bg-blue-100 text-blue-800'
            }
          `}>
{isTutorPost ? 'Tilbyr undervisning' : 'Søker lærer'}
          </span>
          <span className="text-sm text-neutral-500">
            {formatters.date(new Date(post.createdAt))}
          </span>
        </div>
      </div>

      {/* Main Content */}
      <Link href={`/posts/${post.id}`} className="block">
        <div className="px-4 pb-4">
          {/* Title */}
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors line-clamp-1">
              {post.title}
            </h3>
          </div>

          {/* Subject and Age Groups */}
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-brand-50 text-brand-700 text-xs font-medium">
              {subjectName}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 text-neutral-700 text-xs">
              {ageGroupText}
            </span>
          </div>

          {/* User Info with Badge */}
          <div className="flex items-center mb-3">
            <div className="relative w-8 h-8 mr-3">
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
                  <User className="w-4 h-4 text-brand-600" />
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
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-900 truncate">
                  {post.user.name}
                </span>
                {/* Badge System - TODO: Replace with actual badge system */}
                <div className="flex items-center gap-1">
                  {/* Placeholder for badge system */}
                </div>
              </div>
            </div>
          </div>

          {/* Availability and Location */}
          <div className="space-y-2 mb-3">
            <div className="flex items-center text-sm text-neutral-600">
              <Calendar className="w-4 h-4 mr-2 text-neutral-400" />
              <span className="truncate">{availableDaysText}</span>
            </div>
            <div className="flex items-center text-sm text-neutral-600">
              <MapPin className="w-4 h-4 mr-2 text-neutral-400" />
              <span className="truncate">
                {post.specificLocation || post.location}
              </span>
            </div>
          </div>

          {/* Rate and Actions */}
          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <div className="flex flex-col">
              <span className="text-sm text-neutral-600 font-medium">
                {rateDisplay()}
              </span>
              <span className="text-xs text-neutral-500">per time</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="hidden sm:flex items-center text-sm text-neutral-500">
                <MessageCircle className="w-4 h-4 mr-1" />
                <span>{post._count.chats}</span>
              </div>
              <StartChatButton
                postId={post.id}
                postTitle={post.title}
                postType={post.type === 'TEACHER' ? 'STUDENT' : 'TEACHER'}
                authorId={post.userId}
                authorName={post.user.name}
                className="inline-flex items-center px-2 sm:px-3 py-1.5 rounded-lg bg-brand-600 text-white text-xs sm:text-sm font-medium hover:bg-brand-700 transition-colors whitespace-nowrap"
                onChatStarted={(chatId) => {
                  // Optional: Handle chat started event
                  console.log('Chat started:', chatId);
                }}
              />
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}

// Skeleton loader for post cards
export function PostCardSkeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden ${className}`}>
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-neutral-200 rounded-full w-32 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-20 animate-pulse" />
        </div>
      </div>
      
      <div className="px-4 pb-4">
        <div className="mb-3">
          <div className="h-6 bg-neutral-200 rounded w-3/4 mb-2 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-full mb-1 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-2/3 animate-pulse" />
        </div>
        
        <div className="flex gap-2 mb-3">
          <div className="h-6 bg-neutral-200 rounded w-20 animate-pulse" />
          <div className="h-6 bg-neutral-200 rounded w-16 animate-pulse" />
        </div>
        
        <div className="flex items-center mb-3">
          <div className="w-8 h-8 bg-neutral-200 rounded-full mr-3 animate-pulse" />
          <div className="flex-1">
            <div className="h-4 bg-neutral-200 rounded w-24 mb-1 animate-pulse" />
            <div className="h-3 bg-neutral-200 rounded w-16 animate-pulse" />
          </div>
        </div>
        
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-neutral-200 rounded w-40 animate-pulse" />
          <div className="h-4 bg-neutral-200 rounded w-32 animate-pulse" />
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
          <div className="h-6 bg-neutral-200 rounded w-24 animate-pulse" />
          <div className="h-8 bg-neutral-200 rounded w-20 animate-pulse" />
        </div>
      </div>
    </div>
  );
}