# Hydration Error Resolution Guide

## Overview
This document captures the hydration issues we encountered in TutorConnect and the modern fixes now in place. The previous workaround relied on replacing `Link` components with buttons. We have since reverted that change in favour of keeping declarative navigation and addressing the true sources of mismatch.

## The Problem

### What is a Hydration Error?
Next.js hydrates the server-rendered HTML on the client. If the markup generated during SSR differs from the markup React produces on the client, hydration fails with messages such as “The object can not be found here.”

### Symptoms Observed
- Error message: **“The object can not be found here.”**
- Chat view flashing from the empty state (“Velg en samtale”) to the actual conversation.
- Date/time labels showing different values between SSR and CSR, especially around midnight or on mobile.
- Pages with their own scroll containers fighting with the browser scroll, occasionally triggering hydration warnings.

### Root Causes
1. **Locale-sensitive formatting during render** – calls to `toLocaleDateString` / `toLocaleTimeString` ran during SSR and CSR, each with the machine’s timezone. This caused different strings to be rendered.
2. **Client-only data rendering synchronously** – chat content attempted to render before the client finished loading chat data, making the initial DOM inconsistent with the server’s placeholder.
3. **Layout wrappers with fixed heights** – multiple nested scroll containers altered layout between server and client when safe-area padding kicked in on mobile.

## The Solution

### 1. Standardise Date/Time Formatting
- Introduced `src/lib/datetime.ts` with helpers like `createOsloFormatter`, `formatOsloDate`, and `formatOsloTime`.
- All user-facing timestamps (chat lists, appointments, emails, posts, etc.) now use a deterministic Oslo timezone formatter so SSR and CSR output identical strings.

### 2. Defer Client-only UI Until Data Is Ready
- Added `ChatLoadingSkeleton` and a client-mount flag in `ChatInterface` so the chat detail pane only renders after the chat data exists.
- `useChat` now loads the target chat first, then refreshes the list, reducing flicker and avoiding extra renders.

### 3. Simplify Layout Scroll Behaviour
- `MainLayout` shifted to a single-column flex layout. Only the main content scrolls, and it honours `env(safe-area-inset-bottom)`.
- Removed hardcoded body heights. Mobile browsers now manage one scroll context, preventing mismatches and ensuring safe-area padding is applied consistently.

### 4. Keep Declarative Navigation
- Reinstated Next.js `Link` usage across header, sidebar, breadcrumbs, etc. With the above fixes in place, hydration remains stable while we retain prefetching and SEO benefits.

## Benefits
1. **Stable SSR/CSR output** – deterministic timezone formatting removes string mismatches.
2. **Smooth chat transitions** – skeleton placeholders ensure the DOM structure remains constant while data loads.
3. **Consistent scrolling** – a single scroll container makes pages behave the same during SSR and CSR, especially on mobile.
4. **Preserved DX/UX** – we keep `Link` components and prefetching without reintroducing hydration errors.

## Testing Checklist
- [ ] Navigate to `/chat`, select multiple conversations, verify no hydration warnings.
- [ ] Inspect timestamps (chat list, appointments, profile posts) to confirm consistent formatting across refreshes.
- [ ] Scroll long pages on mobile Safari/Chrome to ensure only one scroll context exists, and content is not clipped by safe areas.
- [ ] Confirm navigation via header, sidebar, and breadcrumbs renders without flicker.

## Future Considerations
1. Adopt Suspense boundaries around large client-only regions once React Server Components usage increases.
2. Monitor for any remaining locale-sensitive code paths; add ESLint rules or codemods to flag raw `toLocale*` calls.
3. If hydration warnings reappear, capture stack traces and compare SSR/CSR snapshots to identify new mismatches quickly.

## References
- [Next.js Hydration Documentation](https://nextjs.org/docs/messages/react-hydration-error)
- [React Hydration Mismatch](https://react.dev/reference/react-dom/client/hydrateRoot#hydrating-server-rendered-html)
