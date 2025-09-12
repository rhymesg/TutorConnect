# User Online Status Management Guide

## Overview

In TutorConnect, to check a user's **online status**, you should use the `isUserOnline()` function instead of the `User.isActive` database field.

## Background

- `User.isActive` database field is always kept as `true`
- User's actual online status is calculated based on the `lastActive` timestamp
- `isUserOnline()` function determines if a user is currently online

## The isUserOnline() Function

### Location
```
/src/lib/user-utils.ts
```

### Function Signature
```typescript
export function isUserOnline(
  lastActive: Date | string | null | undefined, 
  timeoutMinutes: number = 10
): boolean
```

### Parameters
- `lastActive`: User's last activity timestamp (accepts Date, string, null, undefined)
- `timeoutMinutes`: Minutes to consider user as online (default: 10 minutes)

### Return Value
- `boolean`: Returns `true` if user is online, `false` otherwise

### How It Works
1. Returns `false` if `lastActive` is null or undefined
2. Calculates the difference between current time and `lastActive`
3. Returns `true` if the difference is less than `timeoutMinutes`, otherwise `false`

## Usage Examples

### In Frontend Components
```typescript
import { isUserOnline } from '@/lib/user-utils';

// Show online status in post cards
const isOnline = isUserOnline(post.user.lastActive);

// Check if chat partner is online
const otherUserOnline = isUserOnline(otherUser.lastActive, 5); // 5-minute timeout
```

### In API Routes
```typescript
import { isUserOnline } from '@/lib/user-utils';

// Check online status before sending email notifications
const userIsCurrentlyOnline = isUserOnline(receiver.lastActive);
if (receiver.emailNewChat && !userIsCurrentlyOnline) {
  // Only send email when user is offline
  await sendEmail(receiver.email);
}
```

## Recommended Usage

1. **Online Status Indicators**: Show "online" badges in user profiles, post cards
2. **Email Notifications**: Only send emails when users are offline
3. **Chat UI**: Display online status of chat participants
4. **Real-time Features**: Determine whether to send real-time notifications

## What NOT to Use It For

1. **Authentication/Authorization**: Continue using `User.isActive` (always true)
2. **Database Query Filtering**: Use `isActive: true` at database level
3. **API Access Control**: Logged-in users should have access regardless of online status

## Database Fields Explained

- `User.isActive`: Account activation status (always `true`, only `false` when account is deactivated)
- `User.lastActive`: Last activity timestamp (used for calculating online status)
- `Chat.isActive`: Chat room activation status
- `Post.isActive`: Post activation status
- `ChatParticipant.isActive`: Chat participant activation status

## Migration Guide

When replacing existing `User.isActive` usage for online status:

```typescript
// Before
if (user.isActive) {
  showOnlineIndicator();
}

// After
if (isUserOnline(user.lastActive)) {
  showOnlineIndicator();
}
```

## Important Notes

1. The `timeoutMinutes` value can be adjusted based on use case (default 10 minutes)
2. Consider server and client timezone differences
3. Users with `null` lastActive are always considered offline
4. Very short timeouts may impact performance
5. **Database `isActive` fields remain unchanged and always `true`**

## Performance Considerations

- The function call itself is lightweight (simple time calculation)
- Main cost is selecting `lastActive` field from database
- Consider caching for large user lists
- Use appropriate timeout values to balance accuracy and performance

## Key Distinction

- **`isUserOnline()` function**: Determines user's **online status** (whether they're currently active)
- **`User.isActive` database field**: Account activation status (always kept as `true`)

Use `isUserOnline()` for showing online indicators, sending notifications to offline users, and other online status features. Keep database `isActive` fields unchanged.