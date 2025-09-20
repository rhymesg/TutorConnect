import Link from 'next/link';
import { MapPin, User, MessageCircle, Calendar } from 'lucide-react';
import { PostWithDetails } from '@/types/database';
import { formatters } from '@/lib/translations';
import { getSubjectLabel } from '@/constants/subjects';
import { getAgeGroupLabels } from '@/constants/ageGroups';
import { getRegionLabel } from '@/constants/regions';
import { isUserOnline } from '@/lib/user-utils';
import { getTeacherBadge, getStudentBadge } from '@/lib/badges';
import { getPostStatusLabel, getPostStatusColor } from '@/constants/postStatus';

interface PostCardStaticProps {
  post: PostWithDetails;
  className?: string;
}

export default function PostCardStatic({ post, className = '' }: PostCardStaticProps) {
  const isTutorPost = post.type === 'TEACHER';
  const subjectName = getSubjectLabel(post.subject);
  const ageGroupText = getAgeGroupLabels(post.ageGroups);
  const lastActive = post.user?.lastActive;
  const chatCount = post._count?.chats ?? 0;

  const rateDisplay = () => {
    if (post.type === 'TEACHER') {
      if (post.hourlyRate) {
        return `${post.hourlyRate} kr`;
      }
    } else {
      if (post.hourlyRateMin && post.hourlyRateMax) {
        return `${post.hourlyRateMin} - ${post.hourlyRateMax} kr`;
      }
      if (post.hourlyRateMin) {
        return `Fra ${post.hourlyRateMin} kr`;
      }
      if (post.hourlyRateMax) {
        return `Opp til ${post.hourlyRateMax} kr`;
      }
    }
    return '••• kr';
  };

  const formatAvailableDays = (days: string[]) => {
    const dayNames = {
      MONDAY: 'Man',
      TUESDAY: 'Tir',
      WEDNESDAY: 'Ons',
      THURSDAY: 'Tor',
      FRIDAY: 'Fre',
      SATURDAY: 'Lør',
      SUNDAY: 'Søn',
    } as const;

    return days
      .map((day) => dayNames[day as keyof typeof dayNames] || day)
      .join(', ');
  };

  const availableDaysText = post.availableDays?.length
    ? formatAvailableDays(post.availableDays)
    : 'Fleksible dager';

  return (
    <div
      className={`
        group ${
          isTutorPost
            ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 hover:border-green-300'
            : 'bg-gradient-to-br from-blue-50 to-sky-50 border-blue-200 hover:border-blue-300'
        }
        rounded-xl shadow-sm hover:shadow-lg transition-all duration-300
        overflow-hidden border ${className}
      `}
    >
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between">
          {post.status === 'PAUSET' ? (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPostStatusColor('PAUSET')}`}
            >
              {getPostStatusLabel('PAUSET')}
            </span>
          ) : (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                isTutorPost ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
              }`}
            >
              {isTutorPost ? 'Tilbyr undervisning' : 'Søker lærer'}
            </span>
          )}

          <span className="text-sm text-neutral-500">
            {formatters.date(new Date(post.createdAt))}
          </span>
        </div>
      </div>

      <Link href={`/posts/${post.id}`} className="block">
        <div className="px-4 pb-4">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-neutral-900 group-hover:text-brand-600 transition-colors line-clamp-1">
              {post.title}
            </h3>
          </div>

          <div className="flex flex-wrap gap-2 mb-3">
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-brand-50 text-brand-700 text-xs font-medium">
              {subjectName}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-md bg-neutral-100 text-neutral-700 text-xs">
              {ageGroupText}
            </span>
          </div>

          <div className="flex items-center mb-3">
            <div className="relative w-8 h-8 mr-3">
              {post.user.profileImage ? (
                <img
                  src={post.user.profileImage}
                  alt={post.user.name}
                  className="w-full h-full rounded-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full rounded-full bg-brand-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-brand-600" />
                </div>
              )}
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                  isUserOnline(lastActive) ? 'bg-green-400' : 'bg-gray-400'
                }`}
              />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-900 truncate">{post.user.name}</span>
                {(() => {
                  const badge = isTutorPost
                    ? getTeacherBadge(post.user.teacherSessions || 0, post.user.teacherStudents || 0)
                    : getStudentBadge(post.user.studentSessions || 0, post.user.studentTeachers || 0);

                  if (!badge) return null;

                  const typeIcon = isTutorPost ? '👨‍🏫' : '🎓';

                  return (
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium ${badge.color}`}>
                      <span className="mr-1">{typeIcon}</span>
                      <span>{badge.icon}</span>
                    </span>
                  );
                })()}
              </div>
            </div>
          </div>

          <div className="space-y-2 mb-3">
            <div className="flex items-center text-sm text-neutral-600">
              <Calendar className="w-4 h-4 mr-2 text-neutral-400" />
              <span className="truncate">{availableDaysText}</span>
            </div>
            <div className="flex items-center text-sm text-neutral-600">
              <MapPin className="w-4 h-4 mr-2 text-neutral-400" />
              <span className="truncate">{post.specificLocation || getRegionLabel(post.location)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-neutral-100">
            <div className="flex flex-col">
              <span className="text-sm text-neutral-600 font-medium">{rateDisplay()}</span>
              <span className="text-xs text-neutral-500">per time</span>
            </div>

            <div className="flex items-center text-sm text-neutral-500">
              <MessageCircle className="w-4 h-4 mr-1" />
              <span>{chatCount}</span>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
