// Norwegian-specific types for TutorConnect

// Norwegian regions with display names
export const NORWEGIAN_REGIONS = {
  OSLO: 'Oslo',
  BERGEN: 'Bergen',
  TRONDHEIM: 'Trondheim',
  STAVANGER: 'Stavanger',
  KRISTIANSAND: 'Kristiansand',
  FREDRIKSTAD: 'Fredrikstad',
  SANDNES: 'Sandnes',
  TROMSOE: 'Tromsø',
  DRAMMEN: 'Drammen',
  ASKER: 'Asker',
  BAERUM: 'Bærum',
  AKERSHUS: 'Akershus',
  OESTFOLD: 'Østfold',
  BUSKERUD: 'Buskerud',
  VESTFOLD: 'Vestfold',
  TELEMARK: 'Telemark',
  AUST_AGDER: 'Aust-Agder',
  VEST_AGDER: 'Vest-Agder',
  ROGALAND: 'Rogaland',
  HORDALAND: 'Hordaland',
  SOGN_OG_FJORDANE: 'Sogn og Fjordane',
  MOERE_OG_ROMSDAL: 'Møre og Romsdal',
  SOER_TROENDELAG: 'Sør-Trøndelag',
  NORD_TROENDELAG: 'Nord-Trøndelag',
  NORDLAND: 'Nordland',
  TROMS: 'Troms',
  FINNMARK: 'Finnmark',
} as const;

export type NorwegianRegionKey = keyof typeof NORWEGIAN_REGIONS;
export type NorwegianRegionValue = typeof NORWEGIAN_REGIONS[NorwegianRegionKey];

// Norwegian postal code validation
export interface NorwegianPostalCode {
  code: string;
  city: string;
  region: NorwegianRegionKey;
}

// Norwegian phone number format
export interface NorwegianPhoneNumber {
  countryCode: '+47';
  number: string; // 8 digits
  formatted: string; // +47 XXX XX XXX
}

// Norwegian personal identification number (Fødselsnummer)
export interface NorwegianPersonalId {
  value: string; // 11 digits
  birthDate: Date;
  gender: 'MALE' | 'FEMALE';
  valid: boolean;
}

// Norwegian educational system types
export const NORWEGIAN_EDUCATION_LEVELS = {
  BARNESKOLE: 'Barneskole (1.-7. klasse)',
  UNGDOMSSKOLE: 'Ungdomsskole (8.-10. klasse)',
  VIDEREGAAENDE: 'Videregående skole',
  FAGSKOLE: 'Fagskole',
  HOEYSKOLE: 'Høyskole',
  UNIVERSITET: 'Universitet',
  MASTER: 'Master',
  DOKTORGRAD: 'Doktorgrad',
} as const;

export type NorwegianEducationLevel = keyof typeof NORWEGIAN_EDUCATION_LEVELS;


// Norwegian age group descriptions
export const NORWEGIAN_AGE_GROUPS = {
  CHILDREN_7_12: 'Barn (7-12 år)',
  TEENAGERS_13_15: 'Ungdom (13-15 år)',
  YOUTH_16_18: 'Ungdom (16-18 år)',
  ADULTS_19_PLUS: 'Voksne (19+ år)',
} as const;

export type NorwegianAgeGroupKey = keyof typeof NORWEGIAN_AGE_GROUPS;
export type NorwegianAgeGroupValue = typeof NORWEGIAN_AGE_GROUPS[NorwegianAgeGroupKey];

// Norwegian currency and pricing
export interface NorwegianPrice {
  amount: number;
  currency: 'NOK';
  formatted: string; // "500 kr" or "kr 500"
}

// Norwegian time formats
export interface NorwegianTime {
  hour: number; // 0-23
  minute: number; // 0-59
  formatted: string; // "14:30"
}

// Norwegian date formats
export interface NorwegianDate {
  date: Date;
  formatted: string; // "15. mars 2024"
  shortFormat: string; // "15.03.24"
}

// Norwegian workdays and holidays
export const NORWEGIAN_WEEKDAYS = {
  MONDAY: 'Mandag',
  TUESDAY: 'Tirsdag',
  WEDNESDAY: 'Onsdag',
  THURSDAY: 'Torsdag',
  FRIDAY: 'Fredag',
  SATURDAY: 'Lørdag',
  SUNDAY: 'Søndag',
} as const;

export type NorwegianWeekdayKey = keyof typeof NORWEGIAN_WEEKDAYS;
export type NorwegianWeekdayValue = typeof NORWEGIAN_WEEKDAYS[NorwegianWeekdayKey];

// Norwegian holidays (affecting scheduling)
export interface NorwegianHoliday {
  name: string;
  date: Date;
  type: 'public' | 'flag' | 'religious' | 'cultural';
  affectsScheduling: boolean;
}

// Common Norwegian holidays
export const COMMON_NORWEGIAN_HOLIDAYS = [
  'Nyttårsdag',
  'Skjærtorsdag',
  'Langfredag',
  'Første påskedag',
  'Andre påskedag',
  'Arbeidernes dag',
  'Grunnlovsdagen',
  'Kristi himmelfartsdag',
  'Første pinsedag',
  'Andre pinsedag',
  'Julaften',
  'Første juledag',
  'Andre juledag',
] as const;

export type CommonNorwegianHoliday = typeof COMMON_NORWEGIAN_HOLIDAYS[number];

// Norwegian business hours
export interface NorwegianBusinessHours {
  day: NorwegianWeekdayKey;
  open: NorwegianTime;
  close: NorwegianTime;
  isOpen: boolean;
}

// Norwegian contact information
export interface NorwegianContactInfo {
  phone?: NorwegianPhoneNumber;
  email?: string;
  address?: {
    street: string;
    postalCode: string;
    city: string;
    region: NorwegianRegionKey;
  };
}

// Norwegian language proficiency levels
export const NORWEGIAN_LANGUAGE_LEVELS = {
  BEGINNER: 'Nybegynner',
  ELEMENTARY: 'Elementært nivå',
  INTERMEDIATE: 'Mellomnivå',
  UPPER_INTERMEDIATE: 'Høyt mellomnivå',
  ADVANCED: 'Avansert',
  NATIVE: 'Morsmål',
} as const;

export type NorwegianLanguageLevel = keyof typeof NORWEGIAN_LANGUAGE_LEVELS;

// Norwegian tutoring session types
export const NORWEGIAN_SESSION_TYPES = {
  INDIVIDUAL: 'Enkeltundervisning',
  GROUP: 'Gruppeundervisning',
  ONLINE: 'Nettundervisning',
  HOME_VISIT: 'Hjemmebesøk',
  LIBRARY: 'Bibliotek',
  SCHOOL: 'Skole',
  CAFE: 'Kafé',
} as const;

export type NorwegianSessionType = keyof typeof NORWEGIAN_SESSION_TYPES;

// Norwegian payment methods
export const NORWEGIAN_PAYMENT_METHODS = {
  VIPPS: 'Vipps',
  BANK_TRANSFER: 'Bankoverføring',
  CASH: 'Kontant',
  SWISH: 'Swish', // For Swedish border regions
  MOBILEPAY: 'MobilePay', // For Danish border regions
} as const;

export type NorwegianPaymentMethod = keyof typeof NORWEGIAN_PAYMENT_METHODS;

// Norwegian qualification types
export const NORWEGIAN_QUALIFICATIONS = {
  TEACHING_DEGREE: 'Lærerutdanning',
  SUBJECT_DEGREE: 'Fagutdanning',
  PEDAGOGICAL_EDUCATION: 'Pedagogisk utdanning',
  WORK_EXPERIENCE: 'Arbeidserfaring',
  TUTORING_EXPERIENCE: 'Veiledningserfaring',
  CERTIFICATION: 'Sertifisering',
} as const;

export type NorwegianQualification = keyof typeof NORWEGIAN_QUALIFICATIONS;

// Norwegian privacy settings translations
export const NORWEGIAN_PRIVACY_SETTINGS = {
  PUBLIC: 'Offentlig',
  ON_REQUEST: 'På forespørsel',
  PRIVATE: 'Privat',
} as const;

export type NorwegianPrivacySettingKey = keyof typeof NORWEGIAN_PRIVACY_SETTINGS;
export type NorwegianPrivacySettingValue = typeof NORWEGIAN_PRIVACY_SETTINGS[NorwegianPrivacySettingKey];

// Norwegian form validation messages
export interface NorwegianValidationMessages {
  required: string;
  email: string;
  phone: string;
  postalCode: string;
  minLength: (min: number) => string;
  maxLength: (max: number) => string;
  pattern: string;
  numeric: string;
  dateFormat: string;
  timeFormat: string;
}

export const NORWEGIAN_VALIDATION_MESSAGES: NorwegianValidationMessages = {
  required: 'Dette feltet er påkrevd',
  email: 'Ugyldig e-postadresse',
  phone: 'Ugyldig telefonnummer',
  postalCode: 'Ugyldig postnummer',
  minLength: (min: number) => `Minimum ${min} tegn`,
  maxLength: (max: number) => `Maksimum ${max} tegn`,
  pattern: 'Ugyldig format',
  numeric: 'Kun tall tillatt',
  dateFormat: 'Ugyldig datoformat (dd.mm.åååå)',
  timeFormat: 'Ugyldig tidsformat (tt:mm)',
};

// Norwegian error messages
export interface NorwegianErrorMessages {
  general: string;
  network: string;
  authentication: string;
  authorization: string;
  notFound: string;
  serverError: string;
  validation: string;
  fileUpload: string;
  sessionExpired: string;
}

export const NORWEGIAN_ERROR_MESSAGES: NorwegianErrorMessages = {
  general: 'Noe gikk galt. Vennligst prøv igjen.',
  network: 'Nettverksfeil. Sjekk internettforbindelsen.',
  authentication: 'Innlogging feilet. Sjekk brukernavn og passord.',
  authorization: 'Du har ikke tilgang til denne ressursen.',
  notFound: 'Siden eller ressursen ble ikke funnet.',
  serverError: 'Serverfeil. Vennligst prøv igjen senere.',
  validation: 'Ugyldig data. Sjekk feltene og prøv igjen.',
  fileUpload: 'Filopplasting feilet. Sjekk filformat og størrelse.',
  sessionExpired: 'Sesjonen har utløpt. Vennligst logg inn igjen.',
};

// Norwegian success messages
export interface NorwegianSuccessMessages {
  accountCreated: string;
  profileUpdated: string;
  postCreated: string;
  messageSent: string;
  appointmentBooked: string;
  documentUploaded: string;
  emailVerified: string;
  passwordChanged: string;
}

export const NORWEGIAN_SUCCESS_MESSAGES: NorwegianSuccessMessages = {
  accountCreated: 'Kontoen din er opprettet. Sjekk e-posten for bekreftelse.',
  profileUpdated: 'Profilen din er oppdatert.',
  postCreated: 'Innlegget ditt er publisert.',
  messageSent: 'Meldingen er sendt.',
  appointmentBooked: 'Avtalen er bestilt.',
  documentUploaded: 'Dokumentet er lastet opp.',
  emailVerified: 'E-postadressen din er bekreftet.',
  passwordChanged: 'Passordet ditt er endret.',
};