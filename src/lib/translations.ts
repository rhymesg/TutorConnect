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
    tryAgain: 'Prøv igjen',
  },
  en: {
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    loading: 'Loading...',
    noData: 'No data found',
    tryAgain: 'Try again',
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
  }
};