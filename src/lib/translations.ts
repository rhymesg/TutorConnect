export const navigation = {
  no: {
    login: 'Logg inn',
    register: 'Registrer deg',
    logout: 'Logg ut',
    dashboard: 'Dashboard',
    profile: 'Profil',
    posts: 'Innlegg',
    chat: 'Chat',
    settings: 'Innstillinger',
  },
  en: {
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    dashboard: 'Dashboard',
    profile: 'Profile',
    posts: 'Posts',
    chat: 'Chat',
    settings: 'Settings',
  }
};

export const forms = {
  no: {
    email: 'E-post',
    password: 'Passord',
    confirmPassword: 'Bekreft passord',
    firstName: 'Fornavn',
    lastName: 'Etternavn',
    name: 'Navn',
    region: 'Fylke',
    postalCode: 'Postnummer',
    phone: 'Telefon',
    enterEmail: 'Skriv inn e-postadressen din',
    enterPassword: 'Skriv inn passordet ditt',
    save: 'Lagre',
    cancel: 'Avbryt',
    submit: 'Send inn',
    required: 'Påkrevd',
    searchPlaceholder: 'Søk etter fag, lærer eller område...',
    subject: 'Fag',
    location: 'Sted',
    selectSubject: 'Velg fag',
    selectLocation: 'Velg sted',
    priceRange: 'Prisområde',
    ageGroups: 'Aldersgrupper',
    availability: 'Tilgjengelighet',
    
    // Post form specific fields
    title: 'Tittel',
    description: 'Beskrivelse',
    specificLocation: 'Spesifikt sted',
    preferredSchedule: 'Foretrukket timeplan',
    hourlyRate: 'Timelønn',
    hourlyRateFixed: 'Fast pris per time',
    hourlyRateMin: 'Minimum pris per time',
    hourlyRateMax: 'Maksimum pris per time',
    availableDays: 'Tilgjengelige dager',
    availableTimes: 'Tilgjengelige tider',
    postType: 'Type annonse',
    
    // Form labels and help text
    titleLabel: 'Tittel på annonsen',
    titlePlaceholder: 'F.eks. Matematikk for videregående skole',
    titleHelp: 'Skriv en tydelig og beskrivende tittel',
    
    descriptionLabel: 'Detaljert beskrivelse',
    descriptionPlaceholder: 'Beskriv hva du tilbyr eller søker etter. Inkluder erfaring, undervisningsmetoder, og andre relevante detaljer...',
    descriptionHelp: 'Jo mer informasjon du gir, desto lettere er det å finne den rette matchen',
    
    locationLabel: 'Fylke/Region',
    locationPlaceholder: 'Velg fylke',
    locationHelp: 'Velg området hvor du kan undervise eller ønsker undervisning',
    
    specificLocationLabel: 'Spesifikt sted (valgfritt)',
    specificLocationPlaceholder: 'F.eks. Oslo sentrum, hjemme hos meg, online',
    specificLocationHelp: 'Spesifiser hvor undervisningen kan foregå',
    
    subjectLabel: 'Fagområde',
    subjectHelp: 'Velg det fagområdet du kan undervise i eller trenger hjelp med',
    
    ageGroupsLabel: 'Aldersgrupper',
    ageGroupsHelp: 'Velg hvilke aldersgrupper du kan undervise eller trenger hjelp for',
    
    availabilityLabel: 'Tilgjengelighet',
    availableDaysLabel: 'Tilgjengelige dager',
    availableDaysHelp: 'Velg hvilke dager du er tilgjengelig',
    
    availableTimesLabel: 'Tilgjengelige tider',
    availableTimesHelp: 'Legg til tidspunkter når du er tilgjengelig',
    
    scheduleLabel: 'Foretrukket timeplan (valgfritt)',
    schedulePlaceholder: 'Beskriv din foretrukne timeplan eller spesielle ønsker...',
    scheduleHelp: 'Gi mer informasjon om din tilgjengelighet',
    
    pricingLabel: 'Prising',
    pricingHelp: 'Angi enten en fast pris eller et prisområde. La stå tomt for "pris etter avtale"',
    fixedRateLabel: 'Fast pris (NOK/time)',
    minRateLabel: 'Min pris (NOK/time)',
    maxRateLabel: 'Maks pris (NOK/time)',
    
    // Validation messages
    validation: {
      required: 'Dette feltet er påkrevd',
      minLength: 'Minimum {min} tegn påkrevd',
      maxLength: 'Maksimum {max} tegn tillatt',
      email: 'Ugyldig e-postadresse',
      phone: 'Ugyldig telefonnummer',
      price: 'Prisen må være et gyldig tall',
      time: 'Tid må være i format TT:MM',
      atLeastOne: 'Du må velge minst ett alternativ',
      maxSelections: 'Du kan velge maksimum {max} alternativer',
    },
  },
  en: {
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    firstName: 'First Name',
    lastName: 'Last Name',
    name: 'Name',
    region: 'Region',
    postalCode: 'Postal Code',
    phone: 'Phone',
    enterEmail: 'Enter your email address',
    enterPassword: 'Enter your password',
    save: 'Save',
    cancel: 'Cancel',
    submit: 'Submit',
    required: 'Required',
    searchPlaceholder: 'Search for subjects, teachers or locations...',
    subject: 'Subject',
    location: 'Location',
    selectSubject: 'Select subject',
    selectLocation: 'Select location',
    priceRange: 'Price range',
    ageGroups: 'Age groups',
    availability: 'Availability',
  }
};

export const actions = {
  no: {
    create: 'Opprett',
    edit: 'Rediger',
    delete: 'Slett',
    view: 'Vis',
    search: 'Søk',
    filter: 'Filtrer',
    sort: 'Sorter',
    upload: 'Last opp',
    download: 'Last ned',
    retry: 'Prøv igjen',
    refresh: 'Oppdater',
    loadMore: 'Last flere',
    contact: 'Ta kontakt',
    showMore: 'Vis mer',
    showLess: 'Vis mindre',
    clear: 'Tøm',
    apply: 'Bruk',
    reset: 'Tilbakestill',
    cancel: 'Avbryt',
    save: 'Lagre',
    publish: 'Publiser',
    publishPost: 'Publiser annonse',
    saveChanges: 'Lagre endringer',
    preview: 'Forhåndsvisning',
    hidePreview: 'Skjul forhåndsvisning',
  },
  en: {
    create: 'Create',
    edit: 'Edit',
    delete: 'Delete',
    view: 'View',
    search: 'Search',
    filter: 'Filter',
    sort: 'Sort',
    upload: 'Upload',
    download: 'Download',
    retry: 'Retry',
    refresh: 'Refresh',
    loadMore: 'Load more',
    contact: 'Contact',
    showMore: 'Show more',
    showLess: 'Show less',
    clear: 'Clear',
    apply: 'Apply',
    reset: 'Reset',
  }
};

export const messages = {
  no: {
    success: 'Vellykket',
    error: 'Feil',
    warning: 'Advarsel',
    info: 'Informasjon',
    loading: 'Laster...',
    noData: 'Ingen data funnet',
    noResults: 'Ingen resultater funnet',
    tryAgain: 'Prøv igjen',
    loadingMore: 'Laster flere...',
    offline: 'Du er offline',
    connectionError: 'Tilkoblingsfeil',
    serverError: 'Serverfeil',
    notFound: 'Ikke funnet',
    unauthorized: 'Ikke autorisert',
    forbidden: 'Ikke tillatt',
    validation: 'Valideringsfeil',
    timeout: 'Forespørsel tidsavbrudd',
  },
  en: {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    loading: 'Loading...',
    noData: 'No data found',
    noResults: 'No results found',
    tryAgain: 'Try again',
    loadingMore: 'Loading more...',
    offline: 'You are offline',
    connectionError: 'Connection error',
    serverError: 'Server error',
    notFound: 'Not found',
    unauthorized: 'Unauthorized',
    forbidden: 'Forbidden',
    validation: 'Validation error',
    timeout: 'Request timeout',
  }
};

export const chat = {
  no: {
    title: 'Meldinger',
    noChats: 'Ingen samtaler enda',
    noChatsDesc: 'Start en samtale ved å kontakte en lærer eller student gjennom deres innlegg.',
    
    roomList: {
      title: 'Samtaler',
      search: 'Søk i samtaler...',
      filter: 'Filtrer',
      filterAll: 'Alle',
      filterUnread: 'Uleste',
      filterArchived: 'Arkiverte',
      noResults: 'Ingen samtaler funnet',
      loadMore: 'Last flere',
    },

    header: {
      online: 'På nett',
      offline: 'Frakoblet',
      lastSeen: 'Sist sett',
      typing: 'skriver...',
      about: 'Om innlegget',
      call: 'Ring',
      videoCall: 'Videosamtale',
      settings: 'Innstillinger',
      block: 'Blokker bruker',
      report: 'Rapporter',
      archive: 'Arkiver',
      unarchive: 'Fjern fra arkiv',
      delete: 'Slett samtale',
    },

    composer: {
      placeholder: 'Skriv en melding...',
      attachments: {
        image: 'Bilde',
        document: 'Dokument', 
        audio: 'Lyd',
        video: 'Video',
      },
      emojiPicker: 'Velg emoji',
      sendButton: 'Send melding',
      maxLength: 'Meldingen er for lang',
      uploading: 'Laster opp...',
      uploadError: 'Opplasting feilet',
      draftSaved: 'Utkast lagret',
    },

    messages: {
      today: 'I dag',
      yesterday: 'I går',
      edited: 'redigert',
      deleted: 'Melding slettet',
      failed: 'Sending feilet',
      retry: 'Prøv igjen',
      reactions: {
        like: 'Liker',
        love: 'Elsker',
        laugh: 'Ler',
        wow: 'Wow',
        sad: 'Trist',
        angry: 'Sint',
      },
    },

    appointment: {
      request: 'Timeavtale forespørsel',
      confirmed: 'Timeavtale bekreftet',
      cancelled: 'Timeavtale avlyst',
      completed: 'Timeavtale fullført',
      accept: 'Aksepter',
      decline: 'Avslå',
      reschedule: 'Endre tid',
      cancel: 'Avlys',
      viewDetails: 'Vis detaljer',
    },

    status: {
      sending: 'Sender...',
      sent: 'Sendt',
      delivered: 'Levert',
      read: 'Lest',
      failed: 'Feilet',
    },

    actions: {
      copy: 'Kopier',
      edit: 'Rediger',
      delete: 'Slett',
      report: 'Rapporter',
      reply: 'Svar',
      forward: 'Videresend',
      pin: 'Fest melding',
      unpin: 'Løsne melding',
      translate: 'Oversett',
    },

    typing: {
      single: '{name} skriver...',
      multiple: '{names} skriver...',
      anonymous: 'Noen skriver...',
    },

    errors: {
      loadFailed: 'Kunne ikke laste samtaler',
      sendFailed: 'Kunne ikke sende melding',
      connectionLost: 'Tilkoblingen mistet',
      reconnecting: 'Kobler til på nytt...',
      tryAgain: 'Prøv igjen',
      unauthorized: 'Ikke autorisert',
      blocked: 'Du kan ikke sende meldinger til denne brukeren',
      rateLimit: 'For mange meldinger. Vent litt.',
    },

    settings: {
      title: 'Samtaleinnstillinger',
      notifications: 'Varsler',
      sound: 'Lyd',
      emailNotifications: 'E-postvarsler',
      muteChat: 'Demp samtale',
      muteUntil: 'Demp til',
      blockUser: 'Blokker bruker',
      reportUser: 'Rapporter bruker',
      exportChat: 'Eksporter samtale',
      deleteChat: 'Slett samtale',
    },

    privacy: {
      messageEncrypted: 'Meldinger er krypterte',
      onlineStatus: 'Vis online-status',
      readReceipts: 'Lesebekreftelser',
      typingIndicators: 'Skriveindikator',
    },
  },
  en: {
    title: 'Messages',
    noChats: 'No conversations yet',
    noChatsDesc: 'Start a conversation by contacting a teacher or student through their post.',
    
    roomList: {
      title: 'Conversations',
      search: 'Search conversations...',
      filter: 'Filter',
      filterAll: 'All',
      filterUnread: 'Unread',
      filterArchived: 'Archived',
      noResults: 'No conversations found',
      loadMore: 'Load more',
    },

    header: {
      online: 'Online',
      offline: 'Offline',
      lastSeen: 'Last seen',
      typing: 'typing...',
      about: 'About this post',
      call: 'Call',
      videoCall: 'Video call',
      settings: 'Settings',
      block: 'Block user',
      report: 'Report',
      archive: 'Archive',
      unarchive: 'Unarchive',
      delete: 'Delete conversation',
    },

    composer: {
      placeholder: 'Type a message...',
      attachments: {
        image: 'Image',
        document: 'Document',
        audio: 'Audio',
        video: 'Video',
      },
      emojiPicker: 'Choose emoji',
      sendButton: 'Send message',
      maxLength: 'Message too long',
      uploading: 'Uploading...',
      uploadError: 'Upload failed',
      draftSaved: 'Draft saved',
    },

    messages: {
      today: 'Today',
      yesterday: 'Yesterday',
      edited: 'edited',
      deleted: 'Message deleted',
      failed: 'Send failed',
      retry: 'Retry',
      reactions: {
        like: 'Like',
        love: 'Love',
        laugh: 'Laugh',
        wow: 'Wow',
        sad: 'Sad',
        angry: 'Angry',
      },
    },

    appointment: {
      request: 'Appointment request',
      confirmed: 'Appointment confirmed',
      cancelled: 'Appointment cancelled',
      completed: 'Appointment completed',
      accept: 'Accept',
      decline: 'Decline',
      reschedule: 'Reschedule',
      cancel: 'Cancel',
      viewDetails: 'View details',
    },

    status: {
      sending: 'Sending...',
      sent: 'Sent',
      delivered: 'Delivered',
      read: 'Read',
      failed: 'Failed',
    },

    actions: {
      copy: 'Copy',
      edit: 'Edit',
      delete: 'Delete',
      report: 'Report',
      reply: 'Reply',
      forward: 'Forward',
      pin: 'Pin message',
      unpin: 'Unpin message',
      translate: 'Translate',
    },

    typing: {
      single: '{name} is typing...',
      multiple: '{names} are typing...',
      anonymous: 'Someone is typing...',
    },

    errors: {
      loadFailed: 'Failed to load conversations',
      sendFailed: 'Failed to send message',
      connectionLost: 'Connection lost',
      reconnecting: 'Reconnecting...',
      tryAgain: 'Try again',
      unauthorized: 'Unauthorized',
      blocked: 'You cannot send messages to this user',
      rateLimit: 'Too many messages. Please wait.',
    },

    settings: {
      title: 'Chat Settings',
      notifications: 'Notifications',
      sound: 'Sound',
      emailNotifications: 'Email notifications',
      muteChat: 'Mute chat',
      muteUntil: 'Mute until',
      blockUser: 'Block user',
      reportUser: 'Report user',
      exportChat: 'Export chat',
      deleteChat: 'Delete chat',
    },

    privacy: {
      messageEncrypted: 'Messages are encrypted',
      onlineStatus: 'Show online status',
      readReceipts: 'Read receipts',
      typingIndicators: 'Typing indicators',
    },
  }
};

// Language hook
export type Language = 'no' | 'en';

export function useLanguage(): Language {
  // This would typically come from user preferences, localStorage, or URL param
  // For now, defaulting to Norwegian since it's the primary market
  return 'no';
}

// Date/time formatters for Norwegian locale
export const formatters = {
  date: (date: Date): string => {
    const language = useLanguage();
    return date.toLocaleDateString(language === 'no' ? 'nb-NO' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  },
  
  time: (date: Date): string => {
    const language = useLanguage();
    return date.toLocaleTimeString(language === 'no' ? 'nb-NO' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: language === 'en'
    });
  },
  
  dateTime: (date: Date): string => {
    const language = useLanguage();
    return date.toLocaleString(language === 'no' ? 'nb-NO' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: language === 'en'
    });
  },

  relativeTime: (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const language = useLanguage();

    if (diffMinutes < 1) {
      return language === 'no' ? 'nå' : 'now';
    } else if (diffMinutes < 60) {
      return language === 'no' ? `${diffMinutes}m siden` : `${diffMinutes}m ago`;
    } else if (diffHours < 24) {
      return language === 'no' ? `${diffHours}t siden` : `${diffHours}h ago`;
    } else if (diffDays < 7) {
      return language === 'no' ? `${diffDays}d siden` : `${diffDays}d ago`;
    } else {
      return formatters.date(date);
    }
  },

  currency: (amount: number | string, currency: string = 'NOK'): string => {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    const language = useLanguage();
    
    if (isNaN(numAmount)) return '';
    
    try {
      return new Intl.NumberFormat(language === 'no' ? 'nb-NO' : 'en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      }).format(numAmount);
    } catch (error) {
      // Fallback formatting
      return `${numAmount.toLocaleString()} ${currency}`;
    }
  },

  number: (num: number): string => {
    const language = useLanguage();
    return num.toLocaleString(language === 'no' ? 'nb-NO' : 'en-US');
  }
};

// Education levels
export const education = {
  no: {
    levels: {
      'elementary': 'Grunnskole',
      'middleSchool': 'Ungdomsskole',
      'highSchool': 'Videregående',
      'university': 'Universitet',
      'adult': 'Voksenopplæring',
      'high_school': 'Videregående',
      'bachelor': 'Bachelor',
      'master': 'Master',
      'phd': 'PhD',
    },
    subjects: {
      'mathematics': 'Matematikk',
      'physics': 'Fysikk',
      'chemistry': 'Kjemi',
      'biology': 'Biologi',
      'norwegian': 'Norsk',
      'english': 'Engelsk',
      'spanish': 'Spansk',
      'french': 'Fransk',
      'german': 'Tysk',
      'history': 'Historie',
      'geography': 'Geografi',
      'social_studies': 'Samfunnsfag',
      'programming': 'Programmering',
      'economics': 'Økonomi',
      'other': 'Annet',
    }
  },
  en: {
    levels: {
      'elementary': 'Elementary',
      'high_school': 'High School', 
      'bachelor': 'Bachelor',
      'master': 'Master',
      'phd': 'PhD',
    },
    subjects: {
      'mathematics': 'Mathematics',
      'physics': 'Physics',
      'chemistry': 'Chemistry',
      'biology': 'Biology',
      'norwegian': 'Norwegian',
      'english': 'English',
      'spanish': 'Spanish',
      'french': 'French',
      'german': 'German',
      'history': 'History',
      'geography': 'Geography',
      'social_studies': 'Social Studies',
      'programming': 'Programming',
      'economics': 'Economics',
      'other': 'Other',
    }
  }
};

// Norwegian regions
export const regions = {
  counties: [
    'Oslo',
    'Akershus',
    'Bergen',
    'Trondheim',
    'Stavanger',
    'Vestland',
    'Rogaland',
    'Trøndelag',
    'Viken',
    'Innlandet',
    'Vestfold og Telemark',
    'Agder',
    'Møre og Romsdal',
    'Nordland',
    'Troms og Finnmark',
  ],
  no: {
    regions: {
      'OSLO': 'Oslo',
      'AKERSHUS': 'Akershus',
      'BERGEN': 'Bergen',
      'TRONDHEIM': 'Trondheim',
      'STAVANGER': 'Stavanger',
    }
  },
  en: {
    regions: {
      'OSLO': 'Oslo',
      'AKERSHUS': 'Akershus', 
      'BERGEN': 'Bergen',
      'TRONDHEIM': 'Trondheim',
      'STAVANGER': 'Stavanger',
    }
  }
};


// Posts
export const posts = {
  no: {
    title: 'Innlegg',
    create: 'Opprett innlegg',
    edit: 'Rediger innlegg',
    types: {
      tutorOffering: 'Tilbyr undervisning',
      studentSeeking: 'Søker lærer',
    },
    pricing: {
      perHour: 'per time',
      negotiable: 'Pris etter avtale',
      budgetRange: 'Budsjett etter avtale',
      upTo: 'Opptil',
      from: 'Fra',
      to: 'til',
    },
    availability: {
      flexible: 'Fleksibel tid',
      weekdays: {
        MONDAY: 'Mandag',
        TUESDAY: 'Tirsdag',
        WEDNESDAY: 'Onsdag',
        THURSDAY: 'Torsdag',
        FRIDAY: 'Fredag',
        SATURDAY: 'Lørdag',
        SUNDAY: 'Søndag',
      }
    },
    filters: {
      allFilters: 'alle filtre',
      activeFilters: 'Aktive filtre:',
      typeLabel: 'Type annonse',
      ageGroupsCount: 'aldersgrupper',
      priceFormat: '{min}-{max} NOK',
      priceFromFormat: 'Fra {min} NOK',
      priceToFormat: 'Opptil {max} NOK',
    },
    sorting: {
      newest: 'Nyeste først',
      price: 'Pris',
      rating: 'Vurdering',
      created: 'Dato opprettet',
      highest: 'høyest først',
      lowest: 'lavest først',
    },
    viewModes: {
      grid: 'Rutenettvisning',
      list: 'Listevisning',
      compact: 'Kompakt visning',
      normal: 'Normal visning',
    },
    results: {
      found: '{count} resultater funnet',
      endOfResults: 'Du har sett alle {count} annonser',
      adjustFilters: 'Prøv å justere søkekriteriene eller fjerne noen filtre.',
    },
    errors: {
      loadingFailed: 'Feil ved lasting av annonser',
      offline: 'Ingen nettverkstilkobling',
      offlineMessage: 'Sjekk internettforbindelsen din og prøv igjen.',
      loadingMessage: 'Kunne ikke laste inn annonser. Prøv igjen senere.',
      retryButton: 'Prøv igjen',
    },
    status: {
      online: 'På nett',
      offline: 'Du er offline. Noen funksjoner kan være begrenset.',
      loadingMore: 'Laster flere annonser...',
      errorLoading: 'Feil ved lasting',
    }
  },
  en: {
    title: 'Posts',
    create: 'Create post',
    edit: 'Edit post',
    types: {
      tutorOffering: 'Offers tutoring',
      studentSeeking: 'Seeking tutor',
    },
    pricing: {
      perHour: 'per hour',
      negotiable: 'Price negotiable',
      budgetRange: 'Budget negotiable',
      upTo: 'Up to',
      from: 'From',
      to: 'to',
    },
    availability: {
      flexible: 'Flexible time',
      weekdays: {
        MONDAY: 'Monday',
        TUESDAY: 'Tuesday',
        WEDNESDAY: 'Wednesday',
        THURSDAY: 'Thursday',
        FRIDAY: 'Friday',
        SATURDAY: 'Saturday',
        SUNDAY: 'Sunday',
      }
    },
    filters: {
      allFilters: 'all filters',
      activeFilters: 'Active filters:',
      typeLabel: 'Post type',
      ageGroupsCount: 'age groups',
      priceFormat: '{min}-{max} NOK',
      priceFromFormat: 'From {min} NOK',
      priceToFormat: 'Up to {max} NOK',
    },
    sorting: {
      newest: 'Newest first',
      price: 'Price',
      rating: 'Rating',
      created: 'Date created',
      highest: 'highest first',
      lowest: 'lowest first',
    },
    viewModes: {
      grid: 'Grid view',
      list: 'List view',
      compact: 'Compact view',
      normal: 'Normal view',
    },
    results: {
      found: '{count} results found',
      endOfResults: 'You have seen all {count} posts',
      adjustFilters: 'Try adjusting search criteria or removing some filters.',
    },
    errors: {
      loadingFailed: 'Error loading posts',
      offline: 'No network connection',
      offlineMessage: 'Check your internet connection and try again.',
      loadingMessage: 'Could not load posts. Please try again later.',
      retryButton: 'Try again',
    },
    status: {
      online: 'Online',
      offline: 'You are offline. Some features may be limited.',
      loadingMore: 'Loading more posts...',
      errorLoading: 'Error loading',
    }
  }
};