/**
 * Norwegian translations and localization utilities for TutorConnect
 * Contains common Norwegian text and formatting functions
 */

export type Language = 'no' | 'en';

// Navigation and common UI text
export const navigation = {
  no: {
    home: 'Hjem',
    search: 'Søk',
    findTeacher: 'Finn lærer',
    becomeTeacher: 'Bli lærer',
    aboutUs: 'Om oss',
    contact: 'Kontakt',
    login: 'Logg inn',
    register: 'Registrer deg',
    profile: 'Profil',
    dashboard: 'Dashboard',
    chat: 'Chat',
    appointments: 'Timer',
    settings: 'Innstillinger',
    help: 'Hjelp',
    logout: 'Logg ut',
    menu: 'Meny',
    close: 'Lukk',
    skipToContent: 'Hopp til hovedinnhold',
    openMainMenu: 'Åpne hovedmeny',
    closeSidebar: 'Lukk sidemeny',
    userMenu: 'Brukermeny',
    notifications: 'Varsler',
    newNotifications: 'nye varsler',
  },
  en: {
    home: 'Home',
    search: 'Search',
    findTeacher: 'Find teacher',
    becomeTeacher: 'Become teacher',
    aboutUs: 'About us',
    contact: 'Contact',
    login: 'Log in',
    register: 'Register',
    profile: 'Profile',
    dashboard: 'Dashboard',
    chat: 'Chat',
    appointments: 'Appointments',
    settings: 'Settings',
    help: 'Help',
    logout: 'Log out',
    menu: 'Menu',
    close: 'Close',
    skipToContent: 'Skip to main content',
    openMainMenu: 'Open main menu',
    closeSidebar: 'Close sidebar',
    userMenu: 'User menu',
    notifications: 'Notifications',
    newNotifications: 'new notifications',
  },
};

// Common button and action text
export const actions = {
  no: {
    save: 'Lagre',
    cancel: 'Avbryt',
    delete: 'Slett',
    edit: 'Rediger',
    create: 'Opprett',
    update: 'Oppdater',
    send: 'Send',
    submit: 'Send inn',
    confirm: 'Bekreft',
    continue: 'Fortsett',
    back: 'Tilbake',
    next: 'Neste',
    previous: 'Forrige',
    viewMore: 'Se mer',
    viewLess: 'Se mindre',
    loadMore: 'Last mer',
    refresh: 'Oppdater',
    retry: 'Prøv igjen',
    download: 'Last ned',
    upload: 'Last opp',
    share: 'Del',
    copy: 'Kopier',
    copied: 'Kopiert!',
  },
  en: {
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    create: 'Create',
    update: 'Update',
    send: 'Send',
    submit: 'Submit',
    confirm: 'Confirm',
    continue: 'Continue',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    viewMore: 'View more',
    viewLess: 'View less',
    loadMore: 'Load more',
    refresh: 'Refresh',
    retry: 'Retry',
    download: 'Download',
    upload: 'Upload',
    share: 'Share',
    copy: 'Copy',
    copied: 'Copied!',
  },
};

// Form labels and placeholders
export const forms = {
  no: {
    name: 'Navn',
    firstName: 'Fornavn',
    lastName: 'Etternavn',
    email: 'E-postadresse',
    password: 'Passord',
    confirmPassword: 'Bekreft passord',
    phone: 'Telefonnummer',
    address: 'Adresse',
    city: 'By',
    postalCode: 'Postnummer',
    description: 'Beskrivelse',
    subject: 'Fag',
    price: 'Pris',
    location: 'Sted',
    date: 'Dato',
    time: 'Tid',
    message: 'Melding',
    title: 'Tittel',
    search: 'Søk...',
    searchPlaceholder: 'Søk etter lærere eller studenter...',
    enterEmail: 'Skriv inn e-postadresse',
    enterPassword: 'Skriv inn passord',
    enterMessage: 'Skriv melding...',
    selectSubject: 'Velg fag',
    selectLocation: 'Velg sted',
    optional: '(valgfritt)',
    required: '(påkrevd)',
  },
  en: {
    name: 'Name',
    firstName: 'First name',
    lastName: 'Last name',
    email: 'Email address',
    password: 'Password',
    confirmPassword: 'Confirm password',
    phone: 'Phone number',
    address: 'Address',
    city: 'City',
    postalCode: 'Postal code',
    description: 'Description',
    subject: 'Subject',
    price: 'Price',
    location: 'Location',
    date: 'Date',
    time: 'Time',
    message: 'Message',
    title: 'Title',
    search: 'Search...',
    searchPlaceholder: 'Search for teachers or students...',
    enterEmail: 'Enter email address',
    enterPassword: 'Enter password',
    enterMessage: 'Type message...',
    selectSubject: 'Select subject',
    selectLocation: 'Select location',
    optional: '(optional)',
    required: '(required)',
  },
};

// Status and feedback messages
export const messages = {
  no: {
    loading: 'Laster...',
    saving: 'Lagrer...',
    saved: 'Lagret!',
    error: 'Noe gikk galt',
    success: 'Vellykket!',
    notFound: 'Ikke funnet',
    unauthorized: 'Ikke autorisert',
    forbidden: 'Forbudt',
    networkError: 'Nettverksfeil',
    tryAgain: 'Prøv igjen senere',
    noResults: 'Ingen resultater funnet',
    emptyState: 'Ingenting å vise enda',
    connectionLost: 'Tilkobling tapt',
    connectionRestored: 'Tilkobling gjenopprettet',
    offline: 'Du er offline',
    online: 'Du er tilbake online',
  },
  en: {
    loading: 'Loading...',
    saving: 'Saving...',
    saved: 'Saved!',
    error: 'Something went wrong',
    success: 'Success!',
    notFound: 'Not found',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
    networkError: 'Network error',
    tryAgain: 'Try again later',
    noResults: 'No results found',
    emptyState: 'Nothing to show yet',
    connectionLost: 'Connection lost',
    connectionRestored: 'Connection restored',
    offline: 'You are offline',
    online: 'You are back online',
  },
};

// Norwegian-specific educational terms
export const education = {
  no: {
    subjects: {
      math: 'Matematikk',
      norwegian: 'Norsk',
      english: 'Engelsk',
      science: 'Naturfag',
      physics: 'Fysikk',
      chemistry: 'Kjemi',
      biology: 'Biologi',
      history: 'Historie',
      geography: 'Geografi',
      socialStudies: 'Samfunnsfag',
      religion: 'Religion og etikk',
      music: 'Musikk',
      art: 'Kunst og håndverk',
      programming: 'Programmering',
      economics: 'Økonomi',
    },
    levels: {
      elementary: 'Barneskole',
      middleSchool: 'Ungdomsskole',
      highSchool: 'Videregående',
      university: 'Høyskole/Universitet',
      adult: 'Voksenopplæring',
    },
    grades: {
      grade1: '1. klasse',
      grade2: '2. klasse',
      grade3: '3. klasse',
      grade4: '4. klasse',
      grade5: '5. klasse',
      grade6: '6. klasse',
      grade7: '7. klasse',
      grade8: '8. klasse',
      grade9: '9. klasse',
      grade10: '10. klasse',
      vg1: 'Vg1',
      vg2: 'Vg2',
      vg3: 'Vg3',
    },
  },
  en: {
    subjects: {
      math: 'Mathematics',
      norwegian: 'Norwegian',
      english: 'English',
      science: 'Science',
      physics: 'Physics',
      chemistry: 'Chemistry',
      biology: 'Biology',
      history: 'History',
      geography: 'Geography',
      socialStudies: 'Social Studies',
      religion: 'Religion and Ethics',
      music: 'Music',
      art: 'Arts and Crafts',
      programming: 'Programming',
      economics: 'Economics',
    },
    levels: {
      elementary: 'Elementary School',
      middleSchool: 'Middle School',
      highSchool: 'High School',
      university: 'University/College',
      adult: 'Adult Education',
    },
    grades: {
      grade1: 'Grade 1',
      grade2: 'Grade 2',
      grade3: 'Grade 3',
      grade4: 'Grade 4',
      grade5: 'Grade 5',
      grade6: 'Grade 6',
      grade7: 'Grade 7',
      grade8: 'Grade 8',
      grade9: 'Grade 9',
      grade10: 'Grade 10',
      vg1: 'Vg1',
      vg2: 'Vg2',
      vg3: 'Vg3',
    },
  },
};

// Norwegian regions and counties
export const regions = {
  counties: [
    'Agder',
    'Innlandet',
    'Møre og Romsdal',
    'Nordland',
    'Oslo',
    'Rogaland',
    'Vestfold og Telemark',
    'Troms og Finnmark',
    'Trøndelag',
    'Vestland',
    'Viken',
  ],
  majorCities: [
    'Oslo',
    'Bergen',
    'Stavanger',
    'Trondheim',
    'Drammen',
    'Fredrikstad',
    'Kristiansand',
    'Sandnes',
    'Tromsø',
    'Sarpsborg',
  ],
};

// Utility functions
export const formatters = {
  // Format Norwegian currency
  currency: (amount: number): string => {
    return new Intl.NumberFormat('nb-NO', {
      style: 'currency',
      currency: 'NOK',
      minimumFractionDigits: 0,
    }).format(amount);
  },

  // Format Norwegian date
  date: (date: Date): string => {
    return new Intl.DateTimeFormat('nb-NO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  },

  // Format Norwegian time
  time: (date: Date): string => {
    return new Intl.DateTimeFormat('nb-NO', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  },

  // Format Norwegian phone number
  phone: (phone: string): string => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('47')) {
      const number = cleaned.substring(2);
      return `+47 ${number.substring(0, 3)} ${number.substring(3, 5)} ${number.substring(5)}`;
    }
    if (cleaned.length === 8) {
      return `${cleaned.substring(0, 3)} ${cleaned.substring(3, 5)} ${cleaned.substring(5)}`;
    }
    return phone;
  },
};

// Translation utility function
export function getTranslation(
  section: keyof typeof navigation,
  key: string,
  language: Language = 'no'
): string {
  const translations = {
    navigation,
    actions,
    forms,
    messages,
    education,
  };

  const sectionTranslations = translations[section];
  if (!sectionTranslations) return key;

  const languageTranslations = sectionTranslations[language];
  if (!languageTranslations) return key;

  return (languageTranslations as any)[key] || key;
}

// Hook for getting current language (placeholder for future i18n)
export function useLanguage(): Language {
  // TODO: Implement actual language detection/selection
  return 'no';
}

// Post-specific translations
export const posts = {
  no: {
    types: {
      tutorOffering: 'Tilbyr undervisning',
      studentSeeking: 'Søker lærer',
    },
    actions: {
      contact: 'Kontakt',
      offerHelp: 'Tilby hjelp',
      viewProfile: 'Se profil',
      sendMessage: 'Send melding',
      bookAppointment: 'Book time',
    },
    filters: {
      postType: 'Type annonse',
      subject: 'Fag',
      ageGroups: 'Aldersgrupper',
      location: 'Sted',
      priceRange: 'Prisområde',
      availability: 'Tilgjengelighet',
      rating: 'Vurdering',
      distance: 'Avstand',
    },
    sorting: {
      newest: 'Nyeste først',
      oldest: 'Eldste først',
      priceHighest: 'Høyeste pris',
      priceLowest: 'Laveste pris',
      ratingHighest: 'Høyeste vurdering',
      ratingLowest: 'Laveste vurdering',
      distance: 'Nærmeste først',
    },
    status: {
      active: 'Aktiv',
      inactive: 'Inaktiv',
      online: 'Pålogget',
      offline: 'Frakoblet',
      responseTime: 'Svarer vanligvis innen',
      lastSeen: 'Sist sett',
    },
    details: {
      hourlyRate: 'Timepris',
      priceRange: 'Prisområde',
      negotiable: 'Pris etter avtale',
      budget: 'Budsjett etter avtale',
      perHour: 'per time',
      flexibleTime: 'Fleksibel tid',
      availableTimes: 'Tilgjengelige tider',
      preferredSchedule: 'Foretrukket timeplan',
      experience: 'Erfaring',
      qualifications: 'Kvalifikasjoner',
      specializations: 'Spesialiseringer',
    },
    search: {
      placeholder: 'Søk etter lærere eller studenter...',
      noResults: 'Ingen resultater funnet',
      tryDifferentTerms: 'Prøv andre søkeord eller juster filtrene',
      resultsFor: 'Resultater for',
      showingResults: 'Viser {count} av {total} resultater',
      loadMore: 'Last flere',
      viewAll: 'Se alle',
    },
    errors: {
      loadFailed: 'Kunne ikke laste inn annonser',
      contactFailed: 'Kunne ikke sende melding',
      networkError: 'Nettverksfeil - sjekk tilkoblingen',
      tryAgain: 'Prøv igjen',
      somethingWrong: 'Noe gikk galt',
    },
  },
  en: {
    types: {
      tutorOffering: 'Offering Tutoring',
      studentSeeking: 'Seeking Tutor',
    },
    actions: {
      contact: 'Contact',
      offerHelp: 'Offer Help',
      viewProfile: 'View Profile',
      sendMessage: 'Send Message',
      bookAppointment: 'Book Appointment',
    },
    filters: {
      postType: 'Post Type',
      subject: 'Subject',
      ageGroups: 'Age Groups',
      location: 'Location',
      priceRange: 'Price Range',
      availability: 'Availability',
      rating: 'Rating',
      distance: 'Distance',
    },
    sorting: {
      newest: 'Newest First',
      oldest: 'Oldest First',
      priceHighest: 'Highest Price',
      priceLowest: 'Lowest Price',
      ratingHighest: 'Highest Rating',
      ratingLowest: 'Lowest Rating',
      distance: 'Nearest First',
    },
    status: {
      active: 'Active',
      inactive: 'Inactive',
      online: 'Online',
      offline: 'Offline',
      responseTime: 'Usually responds within',
      lastSeen: 'Last seen',
    },
    details: {
      hourlyRate: 'Hourly Rate',
      priceRange: 'Price Range',
      negotiable: 'Price negotiable',
      budget: 'Budget negotiable',
      perHour: 'per hour',
      flexibleTime: 'Flexible time',
      availableTimes: 'Available times',
      preferredSchedule: 'Preferred schedule',
      experience: 'Experience',
      qualifications: 'Qualifications',
      specializations: 'Specializations',
    },
    search: {
      placeholder: 'Search for teachers or students...',
      noResults: 'No results found',
      tryDifferentTerms: 'Try different search terms or adjust filters',
      resultsFor: 'Results for',
      showingResults: 'Showing {count} of {total} results',
      loadMore: 'Load more',
      viewAll: 'View all',
    },
    errors: {
      loadFailed: 'Failed to load posts',
      contactFailed: 'Failed to send message',
      networkError: 'Network error - check connection',
      tryAgain: 'Try again',
      somethingWrong: 'Something went wrong',
    },
  },
};

// Default export for common translations
export default {
  navigation,
  actions,
  forms,
  messages,
  education,
  regions,
  posts,
  formatters,
  getTranslation,
  useLanguage,
};