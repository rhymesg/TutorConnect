/**
 * Norwegian Regions Constants
 * Centralized region management for TutorConnect
 */

import { NorwegianRegion } from '@prisma/client';

export const REGION_OPTIONS: Record<NorwegianRegion, string> = {
  [NorwegianRegion.OSLO]: 'Oslo',
  [NorwegianRegion.BERGEN]: 'Bergen',
  [NorwegianRegion.TRONDHEIM]: 'Trondheim',
  [NorwegianRegion.STAVANGER]: 'Stavanger',
  [NorwegianRegion.KRISTIANSAND]: 'Kristiansand',
  [NorwegianRegion.FREDRIKSTAD]: 'Fredrikstad',
  [NorwegianRegion.SANDNES]: 'Sandnes',
  [NorwegianRegion.TROMSOE]: 'Tromsø',
  [NorwegianRegion.DRAMMEN]: 'Drammen',
  [NorwegianRegion.ASKER]: 'Asker',
  [NorwegianRegion.BAERUM]: 'Bærum',
  [NorwegianRegion.AKERSHUS]: 'Akershus',
  [NorwegianRegion.OESTFOLD]: 'Østfold',
  [NorwegianRegion.BUSKERUD]: 'Buskerud',
  [NorwegianRegion.VESTFOLD]: 'Vestfold',
  [NorwegianRegion.TELEMARK]: 'Telemark',
  [NorwegianRegion.AUST_AGDER]: 'Aust-Agder',
  [NorwegianRegion.VEST_AGDER]: 'Vest-Agder',
  [NorwegianRegion.ROGALAND]: 'Rogaland',
  [NorwegianRegion.HORDALAND]: 'Hordaland',
  [NorwegianRegion.SOGN_OG_FJORDANE]: 'Sogn og Fjordane',
  [NorwegianRegion.MOERE_OG_ROMSDAL]: 'Møre og Romsdal',
  [NorwegianRegion.NORD_TROENDELAG]: 'Nord-Trøndelag',
  [NorwegianRegion.SOER_TROENDELAG]: 'Sør-Trøndelag',
  [NorwegianRegion.NORDLAND]: 'Nordland',
  [NorwegianRegion.TROMS]: 'Troms',
  [NorwegianRegion.FINNMARK]: 'Finnmark',
};

/**
 * Get formatted region options for dropdowns and forms
 */
export function getRegionOptions(): Array<{ value: NorwegianRegion; label: string }> {
  return Object.entries(REGION_OPTIONS).map(([value, label]) => ({
    value: value as NorwegianRegion,
    label,
  }));
}

/**
 * Get region label by enum value
 */
export function getRegionLabel(region: NorwegianRegion): string {
  return REGION_OPTIONS[region] || region;
}

/**
 * Get all region enum values
 */
export function getAllRegions(): NorwegianRegion[] {
  return Object.keys(REGION_OPTIONS) as NorwegianRegion[];
}