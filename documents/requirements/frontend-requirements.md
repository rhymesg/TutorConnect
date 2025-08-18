# Frontend Agent Requirements

## Role and Responsibilities
Modern Next.js frontend development, PWA configuration, responsive UI/UX implementation

## Technology Stack
**Note: Always use latest stable versions**

- **Framework**: Next.js (App Router) + React
- **Language**: TypeScript
- **Styling**: Tailwind CSS (modern configuration)
- **UI Components**: Headless UI + Heroicons + Lucide React
- **State Management**: React Context + modern React state hooks
- **Data Fetching**: Server Components + Client Components hybrid approach
- **Icons**: Lucide React + Heroicons
- **Forms**: React Hook Form + Zod validation
- **Testing**: Jest + React Testing Library + Playwright E2E

## UI/UX Requirements

### 1. Overall Layout and Navigation
- **Main tab structure**: Teachers, Students, Messages (3 tabs)
- **Header**: Logo, search, profile menu
- **Bottom navigation**: Mobile-optimized tab bar
- **Responsive**: Mobile-first, desktop adaptive

### 2. User Authentication Pages
- **Registration Form**
  - Email/password
  - Name, region(postal code/city), gender(optional), birth year(optional)
  - Profile picture upload
  - School/degree/certification information
  - Document upload (PDF/images)
  - Email verification flow

- **Login Form**
  - Email/password
  - Password reset link

- **Profile Management**
  - Personal information editing
  - Privacy settings management (public/on-request for each information)
  - Document management

### 3. Post System (Teachers Tab)
- **Post List**
  - Card-style layout
  - Display photo, name, subject, price, region
  - Infinite scroll or pagination

- **Post Creation/Edit Form**
  - Subject selection (math, english, norwegian, science, coding, sports, etc.)
  - Target age selection (7-12, 13-15, 16-18, adult - multiple selection)
  - Available date/day/time selection
  - Region selection (Norwegian cities)
  - Hourly rate input
  - Title/content creation

- **Post Detail View**
  - Display all post information
  - Author profile link
  - Start chat button

### 4. Post System (Students Tab)
- **Post List** (similar structure to teachers tab)
- **Post Creation/Edit Form**
  - Subject to learn selection
  - Desired date/day/time selection
  - Desired location selection
  - Hourly price range input
  - Title/content creation

### 5. Search and Filtering
- **Search Bar**: Title/content text search
- **Filter Options**
  - Subject filter
  - Age range filter
  - Date/day/time filter
  - Region filter
  - Price range filter
- **Sort Options**: Latest, price, distance

### 6. Chat System (Messages Tab)
- **Chat Room List**
  - Recent message preview
  - Unread message indicator
  - Connected post information display

- **Chat Window**
  - Real-time message display
  - Message input field
  - Connected post information header
  - "Set Time" appointment booking button
  - File attachment feature (optional)

### 7. Appointment Management
- **Appointment Setting Modal**
  - Date/time selection
  - Location input
  - Confirmation button

- **Appointment Status Display**
  - Pending/confirmed/completed/cancelled status
  - Ready button (appointment readiness confirmation)
  - Completed button (completion confirmation)
  - Notification settings (30min/1hour before)

### 8. User Profile Page
- **Public Information Display**
  - Basic information (according to privacy settings)
  - Education/certification information
  - Number of completed tutoring sessions
  - Number of students/teachers met

- **Information Request Feature**
  - Private information request button
  - Requester information display
  - Accept/reject buttons

## PWA Requirements

### 1. Service Worker
- **Offline support**: Basic page caching
- **Background sync**: Retry message sending on failure
- **Cache management**: Image and static resource caching

### 2. Manifest.json
- **App information**: Name, icons, theme colors
- **Display mode**: standalone
- **Start URL**: Main page
- **Icons**: Various sizes of app icons

### 3. Installation Prompt
- **PWA installation guide**: Encourage installation on first visit
- **Add to home screen**: Support for both iOS/Android

## Responsive Design

### 1. Mobile-First
- **Minimum width**: 320px support
- **Touch-friendly**: Minimum button size 44px
- **Swipe gestures**: Tab switching, chat deletion, etc.

### 2. Breakpoints
- **sm**: 640px - Large phones
- **md**: 768px - Tablets
- **lg**: 1024px - Desktop
- **xl**: 1280px - Large desktop

### 3. Adaptive Layout
- **Mobile**: Bottom tabs, full-screen modals
- **Desktop**: Sidebar, multi-column layout

## Performance Optimization

### 1. Image Optimization
- Use **latest Next.js Image component** with enhanced optimizations
- Apply **Lazy loading** with modern React concurrent features
- Prioritize **WebP/AVIF formats**

### 2. Code Splitting
- Leverage **Next.js app router** automatic code splitting
- Utilize **dynamic imports** with latest React Suspense improvements
- **Component lazy loading** with enhanced streaming

### 3. Data Optimization
- Utilize **Server Components** for data fetching
- Implement **streaming with Suspense**
- Apply **optimistic updates** with latest React actions
- **Client-side caching** for interactive components

## Accessibility

### 1. WCAG 2.1 AA Compliance
- **Keyboard navigation** support
- **Screen reader** compatibility
- **Color contrast** 4.5:1 or higher

### 2. Semantic HTML
- Use **appropriate HTML tags**
- Provide **ARIA labels**
- Connect **form labels**

## Internationalization Preparation

### 1. i18n Structure
- **next-i18next** setup preparation
- Structured **translation keys**
- **RTL language** considerations

### 2. Default Languages
- **English**: Default UI language
- **Korean/Norwegian**: User content

## Browser Compatibility
- **Chrome**: Latest 2 versions
- **Safari**: iOS 12+ support
- **Firefox**: Latest 2 versions
- **Edge**: Chromium-based

## Testing Requirements
- **Unit Tests**: Major components
- **Integration Tests**: Form submission, data fetching
- **E2E Tests**: Core user flows
- **Visual Regression Tests**: UI consistency verification