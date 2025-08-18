/**
 * Norwegian education system utilities and validation
 * Contains specific data for Norwegian educational institutions and qualifications
 */

// Norwegian education levels based on the Norwegian education system
export const norwegianEducationLevels = [
  {
    value: 'BARNESKOLE',
    label: 'Barneskole (1.-7. trinn)',
    description: 'Grunnskole første del',
    ageRange: '6-13 år',
  },
  {
    value: 'UNGDOMSSKOLE',
    label: 'Ungdomsskole (8.-10. trinn)',
    description: 'Grunnskole andre del',
    ageRange: '13-16 år',
  },
  {
    value: 'VIDEREGAAENDE',
    label: 'Videregående skole',
    description: 'Vg1-Vg3, studiespesialisering eller yrkesfag',
    ageRange: '16-19 år',
  },
  {
    value: 'FAGSKOLE',
    label: 'Fagskole',
    description: 'Yrkesrettet utdanning etter videregående',
    duration: '0.5-2 år',
  },
  {
    value: 'HOGSKOLE_UNIVERSITET',
    label: 'Høyskole/Universitet',
    description: 'Bachelor, master, PhD',
    duration: '3+ år',
  },
  {
    value: 'VOKSENOPPLARING',
    label: 'Voksenopplæring',
    description: 'Utdanning for voksne',
    ageRange: '25+ år',
  },
];

// Norwegian subjects based on the official curriculum
export const norwegianSubjects = [
  // Core subjects (Fellesfag)
  {
    category: 'FELLESFAG',
    categoryLabel: 'Fellesfag',
    subjects: [
      { value: 'NORSK', label: 'Norsk', levels: ['BARNESKOLE', 'UNGDOMSSKOLE', 'VIDEREGAAENDE'] },
      { value: 'MATEMATIK', label: 'Matematikk', levels: ['BARNESKOLE', 'UNGDOMSSKOLE', 'VIDEREGAAENDE'] },
      { value: 'ENGELSK', label: 'Engelsk', levels: ['BARNESKOLE', 'UNGDOMSSKOLE', 'VIDEREGAAENDE'] },
      { value: 'NATURFAG', label: 'Naturfag', levels: ['BARNESKOLE', 'UNGDOMSSKOLE'] },
      { value: 'SAMFUNNSFAG', label: 'Samfunnsfag', levels: ['UNGDOMSSKOLE', 'VIDEREGAAENDE'] },
      { value: 'KROPPSIVING', label: 'Kroppsøving', levels: ['BARNESKOLE', 'UNGDOMSSKOLE', 'VIDEREGAAENDE'] },
      { value: 'RELIGION_ETIKK', label: 'Religion og etikk (KRLE)', levels: ['BARNESKOLE', 'UNGDOMSSKOLE'] },
    ]
  },
  
  // Natural sciences
  {
    category: 'REALFAG',
    categoryLabel: 'Realfag',
    subjects: [
      { value: 'FYSIKK', label: 'Fysikk', levels: ['VIDEREGAAENDE', 'HOGSKOLE_UNIVERSITET'] },
      { value: 'KJEMI', label: 'Kjemi', levels: ['VIDEREGAAENDE', 'HOGSKOLE_UNIVERSITET'] },
      { value: 'BIOLOGI', label: 'Biologi', levels: ['VIDEREGAAENDE', 'HOGSKOLE_UNIVERSITET'] },
      { value: 'GEOFAG', label: 'Geofag', levels: ['VIDEREGAAENDE'] },
      { value: 'TEKNOLOGI_DESIGN', label: 'Teknologi og design', levels: ['UNGDOMSSKOLE'] },
    ]
  },
  
  // Languages
  {
    category: 'SPRAK',
    categoryLabel: 'Språk',
    subjects: [
      { value: 'TYSK', label: 'Tysk', levels: ['UNGDOMSSKOLE', 'VIDEREGAAENDE'] },
      { value: 'FRANSK', label: 'Fransk', levels: ['UNGDOMSSKOLE', 'VIDEREGAAENDE'] },
      { value: 'SPANSK', label: 'Spansk', levels: ['UNGDOMSSKOLE', 'VIDEREGAAENDE'] },
      { value: 'SAMISK', label: 'Samisk', levels: ['BARNESKOLE', 'UNGDOMSSKOLE', 'VIDEREGAAENDE'] },
      { value: 'FINSK', label: 'Finsk', levels: ['UNGDOMSSKOLE', 'VIDEREGAAENDE'] },
    ]
  },
  
  // Arts and crafts
  {
    category: 'ESTETISKE_FAG',
    categoryLabel: 'Estetiske fag',
    subjects: [
      { value: 'KUNST_HANDVERK', label: 'Kunst og håndverk', levels: ['BARNESKOLE', 'UNGDOMSSKOLE'] },
      { value: 'MUSIKK', label: 'Musikk', levels: ['BARNESKOLE', 'UNGDOMSSKOLE', 'VIDEREGAAENDE'] },
      { value: 'MAT_HELSE', label: 'Mat og helse', levels: ['UNGDOMSSKOLE'] },
      { value: 'DRAMA', label: 'Drama', levels: ['VIDEREGAAENDE'] },
      { value: 'DANS', label: 'Dans', levels: ['VIDEREGAAENDE'] },
    ]
  },
  
  // Vocational subjects
  {
    category: 'YRKESFAG',
    categoryLabel: 'Yrkesfag',
    subjects: [
      { value: 'BYGG_ANLEGG', label: 'Bygg og anleggsteknikk', levels: ['VIDEREGAAENDE', 'FAGSKOLE'] },
      { value: 'ELEKTRO', label: 'Elektrofag', levels: ['VIDEREGAAENDE', 'FAGSKOLE'] },
      { value: 'HELSE_SOSIAL', label: 'Helse- og sosialfag', levels: ['VIDEREGAAENDE', 'FAGSKOLE'] },
      { value: 'RESTAURANT_MATFAG', label: 'Restaurant- og matfag', levels: ['VIDEREGAAENDE'] },
      { value: 'SERVICE_SAMFERSEL', label: 'Service og samferdsel', levels: ['VIDEREGAAENDE'] },
      { value: 'TEKNIKK_INDUSTRI', label: 'Teknikk og industriell produksjon', levels: ['VIDEREGAAENDE'] },
      { value: 'NATURBRUK', label: 'Naturbruk', levels: ['VIDEREGAAENDE'] },
      { value: 'MEDIA_KOMMUNIKASJON', label: 'Media og kommunikasjon', levels: ['VIDEREGAAENDE'] },
    ]
  },
  
  // Higher education subjects
  {
    category: 'HOGSKOLE_UNIVERSITET',
    categoryLabel: 'Høyskole/Universitet',
    subjects: [
      { value: 'INFORMATIKK', label: 'Informatikk/IKT', levels: ['VIDEREGAAENDE', 'HOGSKOLE_UNIVERSITET'] },
      { value: 'OKONOMI_ADMINISTRASJON', label: 'Økonomi og administrasjon', levels: ['VIDEREGAAENDE', 'HOGSKOLE_UNIVERSITET'] },
      { value: 'JUSS', label: 'Juss', levels: ['HOGSKOLE_UNIVERSITET'] },
      { value: 'MEDISIN', label: 'Medisin og helsefag', levels: ['HOGSKOLE_UNIVERSITET'] },
      { value: 'INGENIORFAG', label: 'Ingeniørfag', levels: ['HOGSKOLE_UNIVERSITET'] },
      { value: 'LARARUTDANNING', label: 'Lærerutdanning', levels: ['HOGSKOLE_UNIVERSITET'] },
      { value: 'PSYKOLOGI', label: 'Psykologi', levels: ['HOGSKOLE_UNIVERSITET'] },
    ]
  },
];

// Norwegian grading scales
export const norwegianGradeScales = {
  // Current scale (from 2006)
  current: {
    name: 'Karakterskala 1-6',
    grades: [
      { value: 6, label: '6 - Særdeles godt', description: 'Utmerket kompetanse' },
      { value: 5, label: '5 - Godt', description: 'God kompetanse' },
      { value: 4, label: '4 - Nokså godt', description: 'Nokså god kompetanse' },
      { value: 3, label: '3 - Tilstrekkelig', description: 'Tilstrekkelig kompetanse' },
      { value: 2, label: '2 - Lite tilfredsstillende', description: 'Lite tilfredsstillende kompetanse' },
      { value: 1, label: '1 - Svært lite tilfredsstillende', description: 'Ikke godkjent' },
    ]
  },
  
  // Pass/fail for younger students
  passFail: {
    name: 'Bestått/Ikke bestått',
    grades: [
      { value: 'BESTATT', label: 'Bestått', description: 'Har oppnådd kompetansen' },
      { value: 'IKKE_BESTATT', label: 'Ikke bestått', description: 'Har ikke oppnådd kompetansen' },
    ]
  }
};

// Norwegian school types and institutions
export const norwegianInstitutions = {
  grunnskoler: [
    'Offentlig grunnskole',
    'Privat grunnskole',
    'Steiner/Waldorf-skole',
    'Montessori-skole',
    'Internasjonal skole',
  ],
  
  videregaaende: [
    'Offentlig videregående skole',
    'Privat videregående skole',
    'Folkehøyskole',
    'Internasjonal videregående skole',
  ],
  
  hoyskoler: [
    'Universitetet i Oslo (UiO)',
    'Universitetet i Bergen (UiB)',
    'Norges teknisk-naturvitenskapelige universitet (NTNU)',
    'Universitetet i Tromsø (UiT)',
    'Universitetet i Stavanger (UiS)',
    'Universitetet i Agder (UiA)',
    'Nord universitet',
    'OsloMet - storbyuniversitetet',
    'Høgskulen på Vestlandet (HVL)',
    'Høgskolen i Innlandet (HiNN)',
    'Høgskolen i Østfold (HiØ)',
    'Høgskolen i Molde (HiM)',
    'VID vitenskapelige høgskole',
    'Norges handelshøyskole (NHH)',
    'Kunsthøgskolen i Oslo (KHiO)',
  ],
};

// Validation functions
export const validateNorwegianEducation = {
  isValidEducationLevel: (level: string): boolean => {
    return norwegianEducationLevels.some(edu => edu.value === level);
  },

  isValidSubjectForLevel: (subject: string, level: string): boolean => {
    const allSubjects = norwegianSubjects.flatMap(category => category.subjects);
    const subjectData = allSubjects.find(s => s.value === subject);
    return subjectData ? subjectData.levels.includes(level) : false;
  },

  getSubjectsForLevel: (level: string) => {
    const allSubjects = norwegianSubjects.flatMap(category => category.subjects);
    return allSubjects.filter(subject => subject.levels.includes(level));
  },

  getEducationLevelLabel: (level: string): string => {
    const eduLevel = norwegianEducationLevels.find(edu => edu.value === level);
    return eduLevel?.label || level;
  },

  getSubjectLabel: (subject: string): string => {
    const allSubjects = norwegianSubjects.flatMap(category => category.subjects);
    const subjectData = allSubjects.find(s => s.value === subject);
    return subjectData?.label || subject;
  },
};

// Common Norwegian educational qualifications
export const commonQualifications = [
  'Videregående skole (Generell studiekompetanse)',
  'Videregående skole (Yrkesfaglig studiekompetanse)',
  'Fagbrev',
  'Svennebrev',
  'Fagskole (1-2 år)',
  'Bachelorgrad (3 år)',
  'Mastergrad (5 år totalt)',
  'Doktorgrad (PhD)',
  'Profesjonelle utdanninger (Medisin, Juss, etc.)',
];

// Teaching qualifications in Norway
export const teachingQualifications = [
  {
    qualification: 'Grunnskolelærer (1.-7. trinn)',
    duration: '4 år (bachelor)',
    description: 'Lærer for barneskolen',
  },
  {
    qualification: 'Grunnskolelærer (5.-10. trinn)',
    duration: '4 år (bachelor)',
    description: 'Lærer for ungdomsskolen',
  },
  {
    qualification: 'Adjunkt',
    duration: '3 år bachelor + 1 år PPU',
    description: 'Lærer for videregående skole',
  },
  {
    qualification: 'Lektor',
    duration: '5 år master + 1 år PPU',
    description: 'Lærer for videregående skole med mastergrad',
  },
  {
    qualification: 'Faglærer',
    duration: 'Varierer',
    description: 'Spesialisert lærer i praktiske/estetiske fag',
  },
];

export default {
  norwegianEducationLevels,
  norwegianSubjects,
  norwegianGradeScales,
  norwegianInstitutions,
  validateNorwegianEducation,
  commonQualifications,
  teachingQualifications,
};